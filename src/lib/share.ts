/**
 * Share links: a public URL for one published deck version, password-protected by default.
 *
 * - The link stores a snapshot of the slides (references resolved) at creation, so it never changes.
 * - Passwords are stored as scrypt hashes; a generated one is shown to the creator once.
 * - Unlocking sets a cookie scoped to /s/<slug> holding an HMAC of the link id + password hash,
 *   so changing the password or revoking the link locks everyone out again.
 */
import { createHmac, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { deckVersions, decks, shareLinks, users, viewSessions } from "@/db/schema";
import { resolveSlides } from "@/content/resolve";
import type { SignedInUser } from "./auth";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/* ---------- passwords ---------- */

// No 0/O, 1/l/I: easy to read aloud and type from a chat message.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export function generatePassword() {
  const pick = (n: number) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${pick(4)}-${pick(4)}`;
}

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const key = await scrypt(pw, salt, 32);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function checkPassword(pw: string, stored: string) {
  const [kind, salt, key] = stored.split("$");
  if (kind !== "scrypt" || !salt || !key) return false;
  const expected = Buffer.from(key, "base64");
  const got = await scrypt(pw.trim(), Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(got, expected);
}

/* ---------- unlock cookie ---------- */

function secret() {
  const s = process.env.BETTER_AUTH_SECRET;
  if (s) return s;
  if (process.env.VERCEL_ENV) throw new Error("BETTER_AUTH_SECRET is required to unlock share links");
  return "dekiru-local-dev-only";
}

export const unlockCookieName = (slug: string) => `dekiru_s_${slug}`;

export function unlockToken(link: { id: string; passwordHash: string | null }) {
  return createHmac("sha256", secret()).update(`${link.id}:${link.passwordHash ?? ""}`).digest("base64url");
}

export function isUnlocked(link: { id: string; passwordHash: string | null }, cookieValue?: string) {
  if (!link.passwordHash) return true;
  if (!cookieValue) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(unlockToken(link));
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------- links ---------- */

const newSlug = () => randomBytes(8).toString("base64url").replace(/[-_]/g, "").slice(0, 10).toLowerCase();

export interface CreateLinkInput {
  label?: string;
  password: "generate" | "none" | { custom: string };
  expiresInDays?: number | null;
}

/** Creates a link to the deck's newest published version. Returns the plain password once. */
export async function createShareLink(deckId: string, input: CreateLinkInput, user: SignedInUser | null) {
  const q = db();
  const [deck] = await q.select().from(decks).where(eq(decks.id, deckId)).limit(1);
  if (!deck) throw new Error("Deck not found");
  const [version] = await q.select().from(deckVersions)
    .where(and(eq(deckVersions.deckId, deckId), eq(deckVersions.status, "published")))
    .orderBy(desc(deckVersions.number)).limit(1);
  if (!version) throw new Error("This deck has no published version to share");

  const slides = (await resolveSlides(version.slides, async (id) => {
    const [v] = await q.select({ slides: deckVersions.slides }).from(deckVersions)
      .where(and(eq(deckVersions.deckId, id), eq(deckVersions.status, "published")))
      .orderBy(desc(deckVersions.number)).limit(1);
    return v?.slides;
  })).filter((s) => !s.hidden);

  const password = input.password === "generate" ? generatePassword()
    : input.password === "none" ? null
    : input.password.custom.trim();
  if (password !== null && password.length < 6) throw new Error("Password must be at least 6 characters");

  const expiresAt = input.expiresInDays ? new Date(Date.now() + input.expiresInDays * 86_400_000) : null;
  const [link] = await q.insert(shareLinks).values({
    slug: newSlug(), deckId, versionId: version.id, deckTitle: deck.title, slides,
    label: input.label?.trim() || null,
    passwordHash: password ? await hashPassword(password) : null,
    createdBy: user?.id ?? null, expiresAt,
  }).returning();
  return { link, password, versionNumber: version.number };
}

export type LinkStatus = "live" | "revoked" | "expired";
export const linkStatus = (l: { revokedAt: Date | null; expiresAt: Date | null }): LinkStatus =>
  l.revokedAt ? "revoked" : l.expiresAt && l.expiresAt.getTime() < Date.now() ? "expired" : "live";

/** Links for a deck, newest first, with who made them, which version, and how often they were opened. */
export async function listShareLinks(deckId: string) {
  const q = db();
  const rows = await q
    .select({
      id: shareLinks.id, slug: shareLinks.slug, label: shareLinks.label, createdAt: shareLinks.createdAt,
      expiresAt: shareLinks.expiresAt, revokedAt: shareLinks.revokedAt, hasPassword: shareLinks.passwordHash,
      createdBy: shareLinks.createdBy, creatorName: users.name, creatorEmail: users.email,
      versionNumber: deckVersions.number, slideCount: sql<number>`jsonb_array_length(${shareLinks.slides})`.mapWith(Number),
    })
    .from(shareLinks)
    .leftJoin(users, eq(users.id, shareLinks.createdBy))
    .innerJoin(deckVersions, eq(deckVersions.id, shareLinks.versionId))
    .where(eq(shareLinks.deckId, deckId))
    .orderBy(desc(shareLinks.createdAt));
  const opens = await q.select({ linkId: viewSessions.linkId, n: count() }).from(viewSessions)
    .innerJoin(shareLinks, eq(shareLinks.id, viewSessions.linkId))
    .where(eq(shareLinks.deckId, deckId)).groupBy(viewSessions.linkId);
  const openBy = new Map(opens.map((o) => [o.linkId, o.n]));
  return rows.map(({ hasPassword, slideCount, ...r }) => ({
    ...r, hasPassword: Boolean(hasPassword), slideCount,
    status: linkStatus(r), opens: openBy.get(r.id) ?? 0,
  }));
}

/** Creator, admins and managers can revoke. */
export async function revokeShareLink(id: string, user: SignedInUser | null) {
  const q = db();
  const [link] = await q.select().from(shareLinks).where(eq(shareLinks.id, id)).limit(1);
  if (!link) throw new Error("Link not found");
  const allowed = !user || user.role !== "member" || link.createdBy === user.id;
  if (!allowed) throw new Error("Only the person who made this link, an admin or a manager can revoke it");
  await q.update(shareLinks).set({ revokedAt: new Date() }).where(eq(shareLinks.id, id));
  return link.deckId;
}

/** The link behind a public URL, or why it can't be shown. */
export async function getShareLink(slug: string) {
  if (!/^[a-z0-9]{6,16}$/.test(slug)) return null;
  const [link] = await db().select().from(shareLinks).where(eq(shareLinks.slug, slug)).limit(1);
  return link ?? null;
}
