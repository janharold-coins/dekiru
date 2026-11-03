import { asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { studioAttachments, studioDecisions, studioRequests, users } from "@/db/schema";
import { proposal, proposals, type Proposal } from "@/studio/proposals";
import type { SignedInUser } from "./auth";
import { canEditThemes, createTheme, publishTheme, publishedThemes, saveThemeDraft } from "./themes";

/**
 * The Studio: people with Studio access ask for a layout or theme; Claude builds it as a proposal in code
 * (src/studio/proposals.ts); they approve it, ask for changes or reject it. Admins always have access.
 */
export class StudioError extends Error {}

export const canUseStudio = (u: SignedInUser | null) => !u || u.role === "admin" || Boolean(u.canUseStudio);

function mustUse(u: SignedInUser | null) {
  if (!canUseStudio(u)) throw new StudioError("Only admins and people with Studio access can use the Studio.");
}

export type RequestKind = "layout" | "theme" | "rule";
export const KIND_LABEL: Record<RequestKind, string> = { layout: "Layout", theme: "Theme", rule: "Rule change" };
export type Decision = "approved" | "changes_requested" | "rejected";
export type Status = "waiting" | Decision;

export const STATUS_LABEL: Record<Status, string> = {
  waiting: "For review", changes_requested: "Changes requested", approved: "Approved", rejected: "Rejected",
};

export async function addRequest(u: SignedInUser | null, kind: RequestKind, prompt: string) {
  mustUse(u);
  const text = prompt.trim();
  if (!text) throw new StudioError("Describe what you'd like.");
  if (!(kind in KIND_LABEL)) throw new StudioError("Pick a layout, a theme or a rule change.");
  await db().insert(studioRequests).values({ kind, prompt: text.slice(0, 4000), authorId: u?.id ?? null });
}

export async function dismissRequest(u: SignedInUser | null, id: string) {
  mustUse(u);
  await db().update(studioRequests).set({ closedAt: new Date() }).where(eq(studioRequests.id, id));
}

/** Claude closes a request it answered without a proposal (a rule change): `npm run studio -- close <id>`. */
export async function closeRequest(id: string) {
  const rows = await db().update(studioRequests).set({ closedAt: new Date() }).where(eq(studioRequests.id, id)).returning({ id: studioRequests.id });
  if (!rows.length) throw new StudioError(`No request "${id}".`);
}

/** Requests no proposal answers yet and nobody dismissed, oldest first: what Claude has to build. */
export async function openRequests() {
  const answered = new Set(proposals.map((p) => p.request).filter(Boolean));
  const rows = await db()
    .select({ id: studioRequests.id, kind: studioRequests.kind, prompt: studioRequests.prompt, createdAt: studioRequests.createdAt, author: users.name, email: users.email })
    .from(studioRequests).leftJoin(users, eq(users.id, studioRequests.authorId))
    .where(isNull(studioRequests.closedAt)).orderBy(asc(studioRequests.createdAt));
  return rows.filter((r) => !answered.has(r.id));
}

/** Images on a decision: resized in the browser (StudioForms), at most MAX_IMAGES, each under MAX_IMAGE_BYTES. */
export const MAX_IMAGES = 6;
export const MAX_IMAGE_BYTES = 1_500_000;
const IMAGE_TYPES = ["image/webp", "image/png", "image/jpeg"];
export interface NewImage { mime: string; bytes: Buffer }

export async function decisionsOf(proposalId?: string) {
  const rows = await db()
    .select({ id: studioDecisions.id, proposalId: studioDecisions.proposalId, revision: studioDecisions.revision, decision: studioDecisions.decision, note: studioDecisions.note, createdAt: studioDecisions.createdAt, by: users.name })
    .from(studioDecisions).leftJoin(users, eq(users.id, studioDecisions.byId))
    .where(proposalId ? eq(studioDecisions.proposalId, proposalId) : undefined)
    .orderBy(desc(studioDecisions.createdAt));
  const files = rows.length
    ? await db().select({ id: studioAttachments.id, decisionId: studioAttachments.decisionId }).from(studioAttachments)
      .where(inArray(studioAttachments.decisionId, rows.map((r) => r.id))).orderBy(asc(studioAttachments.createdAt))
    : [];
  return rows.map((r) => ({ ...r, images: files.filter((f) => f.decisionId === r.id).map((f) => f.id) }));
}

/** One attached image (served at /studio/attachments/<id> to people with Studio access). */
export async function attachment(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db().select({ mime: studioAttachments.mime, data: studioAttachments.data }).from(studioAttachments).where(eq(studioAttachments.id, id)).limit(1);
  return row ? { mime: row.mime, bytes: Buffer.from(row.data, "base64") } : null;
}
type DecisionRow = Awaited<ReturnType<typeof decisionsOf>>[number];

/** The newest decision on the proposal's current revision; a newer revision is for review again. */
export function statusOf(p: Proposal, rows: DecisionRow[]): { status: Status; latest?: DecisionRow } {
  const latest = rows.find((r) => r.proposalId === p.id);
  if (!latest || latest.revision !== p.revision) return { status: "waiting", latest };
  return { status: latest.decision as Decision, latest };
}

/**
 * Records a decision on the current revision. Approving a theme also adds it to the library (published),
 * when the person may edit themes; otherwise the approval is recorded and a theme editor adds it.
 */
export async function decide(u: SignedInUser | null, id: string, decision: Decision, note: string, images: NewImage[] = []) {
  mustUse(u);
  const p = proposal(id);
  if (!p) throw new StudioError(`No proposal "${id}".`);
  if (!["approved", "changes_requested", "rejected"].includes(decision)) throw new StudioError("Unknown decision.");
  const text = note.trim();
  if (decision === "changes_requested" && !text && !images.length) throw new StudioError("Say what should change, or add an image.");
  if (images.length > MAX_IMAGES) throw new StudioError(`Up to ${MAX_IMAGES} images.`);
  for (const img of images) {
    if (!IMAGE_TYPES.includes(img.mime)) throw new StudioError("Images must be PNG, JPEG or WebP.");
    if (img.bytes.length > MAX_IMAGE_BYTES) throw new StudioError("An image is too large.");
  }
  let added: string | undefined;
  if (decision === "approved" && p.kind === "theme" && canEditThemes(u)) {
    const existing = (await publishedThemes()).find((t) => t.name === p.name);
    added = existing?.id ?? await createTheme(u, p.name);
    await saveThemeDraft(u, added, { tokens: p.tokens, note: `Approved in the Studio (rev ${p.revision})` });
    await publishTheme(u, added);
  }
  const [row] = await db().insert(studioDecisions)
    .values({ proposalId: id, revision: p.revision, decision, note: text || null, byId: u?.id ?? null }).returning({ id: studioDecisions.id });
  if (images.length) {
    await db().insert(studioAttachments).values(images.map((img) => ({ decisionId: row.id, mime: img.mime, data: img.bytes.toString("base64") })));
  }
  return { themeId: added };
}

export const isStudioDecision = (d: string): d is Decision => d === "approved" || d === "changes_requested" || d === "rejected";
