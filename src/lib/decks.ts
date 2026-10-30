/**
 * The one place the app reads and writes decks.
 *
 * With DATABASE_URL set, decks come from Postgres (Neon). The **live** version of a deck is its newest
 * approved one (review v2, spec §7b); a deck nobody has approved yet shows its newest sent version
 * ("published" in the database — sending for review freezes a version). Slide references resolve
 * against the referenced deck's live version, so a master-slide change reaches other decks only
 * once the master's revision is approved.
 * Without it, the app reads the Figma-built JSON seed directly, so it still runs with no setup.
 */
import { and, desc, eq, inArray, isNull, max } from "drizzle-orm";
import { connection } from "next/server";
import { db, hasDb, type Db } from "@/db/client";
import { deckMembers, deckVersions, decks, reviews, users } from "@/db/schema";
import { resolveSlides, snapshotSlides, type DeckLookup, type SeedSlide } from "@/content/resolve";
import { seedDecks } from "@/content/decks";
import type { Deck } from "@/deck/types";
import { DEFAULT_THEME, pickTheme, publishedThemes, type ThemeInfo } from "./themes";

export interface DeckInfo extends Deck {
  kind: "master" | "copy";
  ownerId?: string | null;
  /** Version number shown in the UI; absent when running from the JSON seed. */
  versionNumber?: number;
  versionId?: string;
  status: "published" | "draft";
  /** True when unsent changes (a draft) exist alongside the version shown. */
  hasDraft: boolean;
  /** Newest sent version and newest approved one (null when none); the live version is the approved one when it exists. */
  sentVersionNumber?: number | null;
  approvedVersionNumber?: number | null;
  /** The theme of the version shown (null = default) and its live look. */
  themeId: string | null;
  theme: ThemeInfo;
  /** Last change to the deck (draft save or publish), and who made it (name; null when unknown, e.g. seeded). */
  updatedAt?: Date;
  updatedById?: string | null;
  updatedBy?: string | null;
  /** When the owner archived it (hidden from lists unless asked for); null/absent = active. */
  archivedAt?: Date | null;
  /** The owner's name (copies, from listDecks). */
  ownerName?: string | null;
  /** Set when the deck is someone else's and shared with the viewer (spec §7b): their role on it and the owner's name. */
  shared?: { role: "editor" | "viewer"; owner: string | null };
}

/** The database, or a transaction on it. */
type Q = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

/* ---------- reads ---------- */

const seedLookup: DeckLookup = (id) => seedDecks.find((d) => d.id === id)?.slides;

async function latestPublished(q: Q, deckId: string) {
  const [v] = await q
    .select()
    .from(deckVersions)
    .where(and(eq(deckVersions.deckId, deckId), eq(deckVersions.status, "published")))
    .orderBy(desc(deckVersions.number))
    .limit(1);
  return v;
}

async function draftOf(q: Q, deckId: string) {
  const [v] = await q
    .select()
    .from(deckVersions)
    .where(and(eq(deckVersions.deckId, deckId), eq(deckVersions.status, "draft")))
    .limit(1);
  return v;
}

/** Newest sent version with an approved content review (employee or company kind; translations don't count). */
async function latestApproved(q: Q, deckId: string) {
  const [row] = await q
    .select({ v: deckVersions })
    .from(deckVersions)
    .innerJoin(reviews, eq(reviews.versionId, deckVersions.id))
    .where(and(eq(deckVersions.deckId, deckId), eq(deckVersions.status, "published"), eq(reviews.status, "approved"), inArray(reviews.kind, ["employee", "company"])))
    .orderBy(desc(deckVersions.number))
    .limit(1);
  return row?.v;
}

/** The version the world sees: newest approved, else newest sent. */
async function liveVersion(q: Q, deckId: string) {
  return (await latestApproved(q, deckId)) ?? (await latestPublished(q, deckId));
}

const dbLookup = (q: Q): DeckLookup => async (id) => (await liveVersion(q, id))?.slides;

/** Slides of a deck's live version, for resolving references (editing, reviews, share links). */
export const liveSlidesOf: DeckLookup = async (id) => (await liveVersion(db(), id))?.slides;

/**
 * Live decks (newest approved, else newest sent), references resolved.
 * With `viewerId`: company masters plus that person's own copies.
 */
/**
 * Decks for lists. Archived decks are left out unless `includeArchived` (the home page's "Show archived decks").
 * `everyone`: every copy, not just the viewer's (admins and managers: Employee decks on the home page).
 */
export async function listDecks(opts: { viewerId?: string | null; includeArchived?: boolean; everyone?: boolean } = {}): Promise<DeckInfo[]> {
  if (!hasDb()) {
    return Promise.all(
      seedDecks.map(async (d) => ({
        ...d, kind: "master" as const, status: "published" as const, hasDraft: false, themeId: null, theme: DEFAULT_THEME,
        slides: await resolveSlides(d.slides, seedLookup),
      })),
    );
  }
  await connection(); // database reads happen per request, never at build time
  const q = db();
  const all = await q.select().from(decks).where(opts.includeArchived ? undefined : isNull(decks.archivedAt)).orderBy(decks.kind, decks.createdAt);
  // Decks shared with the viewer (their role on each) come along with the masters and their own.
  const shared = opts.viewerId
    ? new Map((await q.select({ deckId: deckMembers.deckId, role: deckMembers.role }).from(deckMembers).where(eq(deckMembers.userId, opts.viewerId))).map((m) => [m.deckId, m.role]))
    : new Map<string, "editor" | "viewer">();
  const rows = opts.viewerId && !opts.everyone ? all.filter((r) => r.kind === "master" || r.ownerId === opts.viewerId || shared.has(r.id)) : all;
  const themes = await publishedThemes();
  const out = (await Promise.all(rows.map((r) => load(q, r, false, themes)))).filter((d): d is DeckInfo => Boolean(d));
  const ids = [...new Set([...out.map((d) => d.updatedById), ...out.filter((d) => d.kind === "copy").map((d) => d.ownerId)].filter((x): x is string => Boolean(x)))];
  const names = ids.length ? await q.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, ids)) : [];
  const nameOf = new Map(names.map((u) => [u.id, u.name || u.email]));
  return out.map((d) => ({
    ...d, updatedBy: d.updatedById ? nameOf.get(d.updatedById) ?? null : null,
    ownerName: d.kind === "copy" && d.ownerId ? nameOf.get(d.ownerId) ?? null : null,
    shared: shared.has(d.id) && d.ownerId !== opts.viewerId ? { role: shared.get(d.id)!, owner: d.ownerId ? nameOf.get(d.ownerId) ?? null : null } : undefined,
  }));
}

/** One deck. `draft: true` returns the working version for editors (draft, else newest sent); otherwise the live version. */
export async function getDeck(id: string, opts: { draft?: boolean } = {}): Promise<DeckInfo | undefined> {
  if (!hasDb()) return (await listDecks()).find((d) => d.id === id);
  await connection();
  const q = db();
  const [row] = await q.select().from(decks).where(eq(decks.id, id)).limit(1);
  return row ? load(q, row, Boolean(opts.draft), await publishedThemes()) : undefined;
}

async function load(q: Db, row: typeof decks.$inferSelect, wantDraft: boolean, themes: ThemeInfo[]): Promise<DeckInfo | undefined> {
  const [pub, draft, approved] = await Promise.all([latestPublished(q, row.id), draftOf(q, row.id), latestApproved(q, row.id)]);
  // Editors work on the draft (else the newest sent version); everyone else sees the live one.
  // A deck that was never sent (saved as a draft from the New deck screen) shows its draft everywhere.
  const v = wantDraft ? draft || pub : approved || pub || draft;
  if (!v) return undefined;
  return {
    id: row.id, title: row.title, kind: row.kind, ownerId: row.ownerId,
    version: `v${v.number}`, versionNumber: v.number, versionId: v.id, status: v.status, hasDraft: Boolean(draft),
    sentVersionNumber: pub?.number ?? null, approvedVersionNumber: approved?.number ?? null,
    themeId: v.themeId ?? null, theme: pickTheme(themes, v.themeId),
    slides: await resolveSlides(v.slides, dbLookup(q)),
    updatedAt: row.updatedAt, updatedById: draft?.createdBy ?? pub?.publishedBy ?? pub?.createdBy ?? null,
    archivedAt: row.archivedAt,
  };
}

/** Newest sent ("published") version, current draft and live version of a deck, unresolved (database only). */
export async function getDeckVersions(deckId: string) {
  const q = db();
  const [published, draft, approved] = await Promise.all([latestPublished(q, deckId), draftOf(q, deckId), latestApproved(q, deckId)]);
  return { published, draft, approved, live: approved ?? published };
}

/* ---------- writes (database only) ---------- */

export interface Actor { userId?: string | null }

/**
 * Edits land in the deck's single draft; it is created from the newest published version if needed.
 * `themeId`: undefined keeps the current theme; null means the default theme.
 */
export async function saveDraft(deckId: string, slides: SeedSlide[], who: Actor & { note?: string; themeId?: string | null } = {}) {
  return db().transaction(async (tx) => {
    const existing = await draftOf(tx, deckId);
    if (existing) {
      const [v] = await tx.update(deckVersions)
        .set({ slides, note: who.note ?? existing.note, ...(who.themeId !== undefined ? { themeId: who.themeId } : {}) })
        .where(eq(deckVersions.id, existing.id)).returning();
      return v;
    }
    const [{ n }] = await tx.select({ n: max(deckVersions.number) }).from(deckVersions).where(eq(deckVersions.deckId, deckId));
    const themeId = who.themeId !== undefined ? who.themeId : (await latestPublished(tx, deckId))?.themeId ?? null;
    const [v] = await tx.insert(deckVersions)
      .values({ deckId, number: (n ?? 0) + 1, status: "draft", slides, themeId, note: who.note, createdBy: who.userId ?? null })
      .returning();
    await tx.update(decks).set({ updatedAt: new Date() }).where(eq(decks.id, deckId));
    return v;
  });
}

/** The draft becomes the newest sent ("published") version: what reviewers see. Existing share links keep their own version. */
export async function publishDraft(deckId: string, who: Actor = {}) {
  return db().transaction(async (tx) => {
    const draft = await draftOf(tx, deckId);
    if (!draft) throw new Error(`Deck ${deckId} has no draft to publish`);
    const [v] = await tx.update(deckVersions)
      .set({ status: "published", publishedAt: new Date(), publishedBy: who.userId ?? null })
      .where(eq(deckVersions.id, draft.id)).returning();
    await tx.update(decks).set({ updatedAt: new Date() }).where(eq(decks.id, deckId));
    return v;
  });
}

/** Creates a deck with its first published version (used by the seed and by "new deck"). */
export async function createDeck(
  input: {
    id: string; title: string; kind: "master" | "copy"; slides: SeedSlide[]; note?: string; themeId?: string | null;
    copiedFromDeckId?: string; copiedFromVersionId?: string;
    /** "draft": the deck starts unpublished (version 1 is its draft) until someone publishes it. */
    status?: "published" | "draft";
  },
  who: Actor = {},
) {
  return db().transaction(async (tx) => {
    await tx.insert(decks).values({
      id: input.id, title: input.title, kind: input.kind, ownerId: input.kind === "copy" ? who.userId ?? null : null,
      copiedFromDeckId: input.copiedFromDeckId, copiedFromVersionId: input.copiedFromVersionId,
    });
    const published = input.status !== "draft";
    const [v] = await tx.insert(deckVersions).values({
      deckId: input.id, number: 1, status: published ? "published" : "draft", slides: input.slides, note: input.note, themeId: input.themeId ?? null,
      createdBy: who.userId ?? null, publishedAt: published ? new Date() : null, publishedBy: published ? who.userId ?? null : null,
    }).returning();
    return v;
  });
}

/** A personal copy: a snapshot of the source's newest published version. Master edits don't reach it. */
export async function copyDeck(sourceId: string, input: { id: string; title: string }, who: Actor = {}) {
  const q = db();
  const src = await latestPublished(q, sourceId);
  if (!src) throw new Error(`Deck ${sourceId} has no published version`);
  const slides = await snapshotSlides(src.slides, dbLookup(q));
  return createDeck({
    ...input, kind: "copy", slides, themeId: src.themeId, note: `Copied from ${sourceId} v${src.number}`,
    copiedFromDeckId: sourceId, copiedFromVersionId: src.id,
  }, who);
}
