import { asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { studioAttachments, studioDecisions, studioRequests, users } from "@/db/schema";
import { getTemplate } from "@/content/templates";
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
/**
 * What can be recorded on a proposal's revision. "changes_requested" is a prompt for Claude (from the review
 * page or a draft's remix prompts); "submitted" sends a draft for review.
 */
export type Decision = "approved" | "changes_requested" | "rejected" | "submitted";
/**
 * Draft: being worked on (a remix, or sent back with notes) until it's sent for review. For review: waiting
 * for a decision. Approved items are in the library; rejected ones are kept for reference.
 */
export type Status = "draft" | "waiting" | "approved" | "rejected";

export const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft", waiting: "For review", approved: "Approved", rejected: "Rejected",
};

/**
 * A remix asks for a variant of something approved: a Studio proposal ("client-quote"), a library template
 * ("template:cover") or a published theme ("theme:coins"). It's an ordinary request whose prompt starts with
 * "Remix of <ref>" on its own line; Claude builds the variant as a new proposal, reviewed like any other.
 */
const REMIX = /^Remix of ((?:template:|theme:)?[A-Za-z0-9_-]+)\n/;
export const remixOf = (prompt: string) => prompt.match(REMIX)?.[1];

export interface RemixSource {
  ref: string;
  name: string;
  kind: "layout" | "theme";
  /** What it is, for "Variant of …": "a library template", "a library theme", "an approved layout". */
  what: string;
  href?: string;
}

/** What a remix ref points at, or null when it doesn't exist or isn't approved yet. */
export async function remixSource(ref: string): Promise<RemixSource | null> {
  const [type, id] = ref.includes(":") ? ref.split(":", 2) : ["proposal", ref];
  if (type === "template") {
    const t = getTemplate(id);
    return t ? { ref, name: t.name, kind: "layout", what: "a library template", href: `/library/templates/${id}` } : null;
  }
  if (type === "theme") {
    const t = (await publishedThemes()).find((x) => x.id === id);
    return t ? { ref, name: t.name, kind: "theme", what: "a library theme" } : null;
  }
  const p = proposal(id);
  if (!p || statusOf(p, await decisionsOf(id)).status !== "approved") return null;
  return { ref, name: p.name, kind: p.kind, what: `an approved ${p.kind}`, href: `/studio/${id}` };
}

export async function addRequest(u: SignedInUser | null, kind: RequestKind, prompt: string, remix?: string): Promise<string> {
  mustUse(u);
  let text = prompt.trim();
  if (!text) throw new StudioError("Describe what you'd like.");
  if (remix) {
    const from = await remixSource(remix);
    if (!from) throw new StudioError("Only library templates, themes and approved proposals can be remixed.");
    kind = from.kind;
    text = `Remix of ${from.ref}\n${text}`;
  }
  if (!(kind in KIND_LABEL)) throw new StudioError("Pick a layout, a theme or a rule change.");
  const [row] = await db().insert(studioRequests).values({ kind, prompt: text.slice(0, 4000), authorId: u?.id ?? null }).returning({ id: studioRequests.id });
  return row.id;
}

/** One open request, for a remix draft Claude hasn't built yet (null once closed or answered by a proposal). */
export async function openRequest(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  return (await openRequests()).find((r) => r.id === id) ?? null;
}

/** Any request, open or not (a built remix's first prompt). */
export async function requestById(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [r] = await db()
    .select({ id: studioRequests.id, kind: studioRequests.kind, prompt: studioRequests.prompt, createdAt: studioRequests.createdAt, author: users.name })
    .from(studioRequests).leftJoin(users, eq(users.id, studioRequests.authorId)).where(eq(studioRequests.id, id)).limit(1);
  return r ? { ...r, remix: remixOf(r.prompt), prompt: r.prompt.replace(REMIX, "") } : null;
}

/** The proposal Claude built for a request, if any. */
export const proposalFor = (requestId: string) => proposals.find((p) => p.request === requestId);

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
  return rows.filter((r) => !answered.has(r.id)).map((r) => ({ ...r, remix: remixOf(r.prompt), prompt: r.prompt.replace(REMIX, "") }));
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

/**
 * Where a proposal stands, from the newest decision on its current revision. A new revision is for review again,
 * except a remix, which stays a draft until someone sends it for review. `building`: there's a prompt on the
 * current revision that Claude hasn't built yet.
 */
export function statusOf(p: Proposal, rows: DecisionRow[]): { status: Status; latest?: DecisionRow; building: boolean } {
  const latest = rows.find((r) => r.proposalId === p.id);
  const d = latest?.revision === p.revision ? latest.decision : undefined;
  const status: Status = d === "approved" || d === "rejected" ? d
    : d === "submitted" ? "waiting"
    : d === "changes_requested" ? "draft"
    : p.remixOf ? "draft" : "waiting";
  return { status, latest, building: d === "changes_requested" };
}

/**
 * Records a decision on the current revision. Approving a theme also adds it to the library (published),
 * when the person may edit themes; otherwise the approval is recorded and a theme editor adds it.
 */
function checkImages(images: NewImage[]) {
  if (images.length > MAX_IMAGES) throw new StudioError(`Up to ${MAX_IMAGES} images.`);
  for (const img of images) {
    if (!IMAGE_TYPES.includes(img.mime)) throw new StudioError("Images must be PNG, JPEG or WebP.");
    if (img.bytes.length > MAX_IMAGE_BYTES) throw new StudioError("An image is too large.");
  }
}

async function record(u: SignedInUser | null, proposalId: string, revision: number, decision: Decision, note: string, images: NewImage[]) {
  const [row] = await db().insert(studioDecisions)
    .values({ proposalId, revision, decision, note: note || null, byId: u?.id ?? null }).returning({ id: studioDecisions.id });
  if (images.length) {
    await db().insert(studioAttachments).values(images.map((img) => ({ decisionId: row.id, mime: img.mime, data: img.bytes.toString("base64") })));
  }
}

/**
 * A remix prompt for Claude. `target` is a proposal id (asks for its next revision) or "request:<id>" for a
 * remix Claude hasn't built yet (added to what it builds first).
 */
export async function addPrompt(u: SignedInUser | null, target: string, note: string, images: NewImage[] = []) {
  mustUse(u);
  const text = note.trim();
  if (!text && !images.length) throw new StudioError("Describe what should change, or add an image.");
  checkImages(images);
  let revision = 0;
  if (target.startsWith("request:")) {
    if (!(await openRequest(target.slice(8)))) throw new StudioError("This draft is closed.");
  } else {
    const p = proposal(target);
    if (!p) throw new StudioError(`No proposal "${target}".`);
    if (statusOf(p, await decisionsOf(target)).status !== "draft") throw new StudioError("Only drafts take prompts.");
    revision = p.revision;
  }
  await record(u, target, revision, "changes_requested", text, images);
}

/** A request from a prompt box, with its images (kept as a prompt on "request:<id>"). `remix` names what it varies. */
export async function startRequest(u: SignedInUser | null, kind: RequestKind, note: string, images: NewImage[] = [], remix?: string) {
  checkImages(images);
  const id = await addRequest(u, kind, note.trim() || (images.length ? "(see the images)" : ""), remix);
  if (images.length) await addPrompt(u, `request:${id}`, "", images);
  return id;
}

/** Starts a remix draft: a request naming what it varies, with the first prompt (and its images). */
export const startRemix = (u: SignedInUser | null, ref: string, note: string, images: NewImage[] = []) => startRequest(u, "layout", note, images, ref);

/** Every rule-change request, oldest first, open or closed: the rules page's prompts. */
export async function ruleRequests() {
  return db()
    .select({ id: studioRequests.id, prompt: studioRequests.prompt, createdAt: studioRequests.createdAt, closedAt: studioRequests.closedAt, author: users.name })
    .from(studioRequests).leftJoin(users, eq(users.id, studioRequests.authorId))
    .where(eq(studioRequests.kind, "rule")).orderBy(asc(studioRequests.createdAt));
}

/** Sends a draft for review, once Claude has built every prompt on it. */
export async function submitDraft(u: SignedInUser | null, id: string) {
  mustUse(u);
  const p = proposal(id);
  if (!p) throw new StudioError(`No proposal "${id}".`);
  const s = statusOf(p, await decisionsOf(id));
  if (s.status !== "draft") throw new StudioError("Only drafts can be sent for review.");
  if (s.building) throw new StudioError("Claude hasn't built your last prompt yet.");
  await record(u, id, p.revision, "submitted", "", []);
}

export async function decide(u: SignedInUser | null, id: string, decision: Decision, note: string, images: NewImage[] = []) {
  mustUse(u);
  const p = proposal(id);
  if (!p) throw new StudioError(`No proposal "${id}".`);
  if (!["approved", "changes_requested", "rejected"].includes(decision)) throw new StudioError("Unknown decision.");
  const text = note.trim();
  if (decision === "changes_requested" && !text && !images.length) throw new StudioError("Say what should change, or add an image.");
  checkImages(images);
  let added: string | undefined;
  if (decision === "approved" && p.kind === "theme" && canEditThemes(u)) {
    const existing = (await publishedThemes()).find((t) => t.name === p.name);
    added = existing?.id ?? await createTheme(u, p.name);
    await saveThemeDraft(u, added, { tokens: p.tokens, note: `Approved in the Studio (rev ${p.revision})` });
    await publishTheme(u, added);
  }
  await record(u, id, p.revision, decision, text, images);
  return { themeId: added };
}

export const isStudioDecision = (d: string): d is Decision => d === "approved" || d === "changes_requested" || d === "rejected";
