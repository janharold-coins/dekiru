import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { studioAttachments, studioDecisions, studioEvents, studioRequests, users } from "@/db/schema";
import { getTemplate, templates } from "@/content/templates";
import { patterns } from "@/deck/registry";
import { proposal, proposals, type Proposal } from "@/studio/proposals";
import type { SignedInUser } from "./auth";
import { canEditThemes, createTheme, publishTheme, publishedThemes, saveThemeDraft } from "./themes";
import { notify } from "./notifications";

/**
 * The Studio. Anyone signed in asks for a layout or theme, as a ticket:
 *   new            Claude checks it against what exists and open tickets, then replies (claudeReply):
 *   answered         "use this template" → the requester picks That works (resolved) or Still need it
 *   merged           a duplicate, closed into another ticket
 *   needs_approval   a build is needed → a Studio reviewer approves (approved) or rejects it with a reason
 *   approved       Claude builds it as a proposal in code (src/studio/proposals.ts); then the proposal's status
 *                  leads (For review → approved / changes / rejected with a reason).
 * Reviewers' own tickets skip the approval: "a build is needed" or Still need it goes straight to approved.
 * The requester can withdraw a ticket until it's approved. Rule changes are reviewer-only and go straight to approved.
 * Studio reviewers: admins and people with "Studio reviewer" ticked on People (users.canUseStudio).
 */
export class StudioError extends Error {}

/** A Studio reviewer: reviews, revises, approves and rejects; asks for rule changes. Everyone else can request and look. */
export const canUseStudio = (u: SignedInUser | null) => !u || u.role === "admin" || Boolean(u.canUseStudio);

function mustUse(u: SignedInUser | null) {
  if (!canUseStudio(u)) throw new StudioError("Only Studio reviewers can do that.");
}

export type TicketStatus = "new" | "answered" | "needs_approval" | "approved" | "resolved" | "merged" | "withdrawn" | "rejected" | "done";
export const TICKET_LABEL: Record<TicketStatus, string> = {
  new: "Claude is checking", answered: "Claude replied", needs_approval: "Waiting for approval", approved: "Approved · building",
  resolved: "Resolved", merged: "Merged", withdrawn: "Withdrawn", rejected: "Rejected", done: "Done",
};
export const CLOSED: TicketStatus[] = ["resolved", "merged", "withdrawn", "rejected", "done"];
/** Before a reviewer approves it: the requester may still withdraw it. */
const PRE_APPROVAL: TicketStatus[] = ["new", "answered", "needs_approval"];

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
 * A revision ("Revision of <ref>") is built and reviewed the same way, but once approved it replaces the
 * original instead of joining the library beside it.
 */
const REMIX = /^(Remix|Revision) of ((?:template:|theme:)?[A-Za-z0-9_-]+)\n/;
export const remixOf = (prompt: string) => prompt.match(REMIX)?.[2];
/** Whether a remix request revises the original (replaces it once approved) rather than adding a variant. */
export const isRevision = (prompt: string) => prompt.match(REMIX)?.[1] === "Revision";

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
  // UI patterns aren't remixed (yet): a variant is a new pattern proposal.
  if (!p || p.kind === "pattern" || statusOf(p, await decisionsOf(id)).status !== "approved") return null;
  return { ref, name: p.name, kind: p.kind, what: `an approved ${p.kind}`, href: `/studio/${id}` };
}

export async function addRequest(u: SignedInUser | null, kind: RequestKind, prompt: string, remix?: string, revise = false): Promise<string> {
  let text = prompt.trim();
  if (!text) throw new StudioError("Describe what you'd like.");
  if (remix) {
    if (revise) mustUse(u); // editing the original is for reviewers; anyone can remix
    const from = await remixSource(remix);
    if (!from) throw new StudioError(`Only library templates, themes and approved proposals can be ${revise ? "revised" : "remixed"}.`);
    kind = from.kind;
    text = `${revise ? "Revision" : "Remix"} of ${from.ref}\n${text}`;
  }
  if (!(kind in KIND_LABEL)) throw new StudioError("Pick a layout, a theme or a rule change.");
  // Rule changes are reviewers' own and go straight to Claude; everything else starts as a ticket for Claude to check.
  if (kind === "rule") mustUse(u);
  const [row] = await db().insert(studioRequests).values({
    kind, prompt: text.slice(0, 4000), authorId: u?.id ?? null,
    status: kind === "rule" ? "approved" : "new", draftLoop: canUseStudio(u),
  }).returning({ id: studioRequests.id });
  return row.id;
}

/** One open request, for a remix draft Claude hasn't built yet (null once closed or answered by a proposal). */
export async function openRequest(id: string) {
  const t = await ticket(id);
  return t && !t.closedAt && !t.proposal ? t : null;
}

/** Any request, open or not (a built remix's first prompt). */
export async function requestById(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [r] = await db()
    .select({ id: studioRequests.id, kind: studioRequests.kind, prompt: studioRequests.prompt, createdAt: studioRequests.createdAt, author: users.name })
    .from(studioRequests).leftJoin(users, eq(users.id, studioRequests.authorId)).where(eq(studioRequests.id, id)).limit(1);
  return r ? { ...r, remix: remixOf(r.prompt), revise: isRevision(r.prompt), prompt: r.prompt.replace(REMIX, "") } : null;
}

/** The proposal Claude built for a request, if any. */
export const proposalFor = (requestId: string) => proposals.find((p) => p.request === requestId);

/**
 * Withdraws a ticket (kept, marked Withdrawn: only its author and admins see it). The author can until a reviewer
 * approves it; reviewers can drop any ticket nothing has been built for yet (discarding a remix draft).
 */
export async function withdrawRequest(u: SignedInUser | null, id: string) {
  const t = await ticket(id);
  if (!t || t.closedAt) throw new StudioError("This request is closed.");
  if (t.proposal) throw new StudioError("Claude has built this one already: reject the build instead.");
  const mine = !u || t.authorId === u.id;
  if (!canUseStudio(u) && !(mine && PRE_APPROVAL.includes(t.status))) throw new StudioError("Only the requester can withdraw it, until it's approved.");
  await setStatus(id, "withdrawn");
  await addEvent(id, "withdrawn", u?.id ?? null);
}
/** @deprecated old name, used by remix drafts' Discard. */
export const dismissRequest = withdrawRequest;

/** Claude closes a request it answered without a proposal (a rule change): `npm run studio -- close <id>`. */
export async function closeRequest(id: string) {
  const rows = await db().update(studioRequests).set({ closedAt: new Date(), status: "done" }).where(eq(studioRequests.id, id)).returning({ id: studioRequests.id });
  if (!rows.length) throw new StudioError(`No request "${id}".`);
}

/** Approved requests no proposal answers yet, oldest first: what Claude has to build (rule changes included). */
export async function openRequests() {
  const answered = new Set(proposals.map((p) => p.request).filter(Boolean));
  const rows = await db()
    .select({ id: studioRequests.id, kind: studioRequests.kind, prompt: studioRequests.prompt, createdAt: studioRequests.createdAt, author: users.name, email: users.email, draftLoop: studioRequests.draftLoop })
    .from(studioRequests).leftJoin(users, eq(users.id, studioRequests.authorId))
    .where(and(isNull(studioRequests.closedAt), eq(studioRequests.status, "approved"))).orderBy(asc(studioRequests.createdAt));
  return rows.filter((r) => !answered.has(r.id)).map((r) => ({ ...r, remix: remixOf(r.prompt), revise: isRevision(r.prompt), prompt: r.prompt.replace(REMIX, "") }));
}

/* ---------- tickets ---------- */

const ticketCols = {
  id: studioRequests.id, kind: studioRequests.kind, prompt: studioRequests.prompt, createdAt: studioRequests.createdAt,
  closedAt: studioRequests.closedAt, status: studioRequests.status, mergedInto: studioRequests.mergedInto, draftLoop: studioRequests.draftLoop,
  authorId: studioRequests.authorId, author: users.name, email: users.email,
};
type TicketRow = { id: string; kind: string; prompt: string; createdAt: Date; closedAt: Date | null; status: string; mergedInto: string | null; draftLoop: boolean; authorId: string | null; author: string | null; email: string | null };
const shape = (r: TicketRow) => ({
  ...r, status: r.status as TicketStatus, remix: remixOf(r.prompt), revise: isRevision(r.prompt), prompt: r.prompt.replace(REMIX, ""),
  proposal: proposalFor(r.id)?.id ?? null,
});
export type Ticket = ReturnType<typeof shape>;

/** One ticket (any status), or null. */
export async function ticket(id: string): Promise<Ticket | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [r] = await db().select(ticketCols).from(studioRequests).leftJoin(users, eq(users.id, studioRequests.authorId)).where(eq(studioRequests.id, id)).limit(1);
  return r ? shape(r) : null;
}

/** Every layout and theme ticket (rule changes live on the rules page), newest first. */
export async function tickets(): Promise<Ticket[]> {
  const rows = await db().select(ticketCols).from(studioRequests).leftJoin(users, eq(users.id, studioRequests.authorId))
    .where(ne(studioRequests.kind, "rule")).orderBy(desc(studioRequests.createdAt));
  return rows.map(shape);
}

/** A ticket's thread, oldest first. `by` null = Claude. */
export async function eventsOf(requestIds: string[]) {
  if (!requestIds.length) return [];
  return db().select({ id: studioEvents.id, requestId: studioEvents.requestId, kind: studioEvents.kind, note: studioEvents.note, refs: studioEvents.refs, createdAt: studioEvents.createdAt, byId: studioEvents.byId, by: users.name })
    .from(studioEvents).leftJoin(users, eq(users.id, studioEvents.byId))
    .where(inArray(studioEvents.requestId, requestIds)).orderBy(asc(studioEvents.createdAt));
}
export type TicketEvent = Awaited<ReturnType<typeof eventsOf>>[number];

async function setStatus(id: string, status: TicketStatus, extra: { mergedInto?: string } = {}) {
  await db().update(studioRequests).set({ status, closedAt: CLOSED.includes(status) ? new Date() : null, ...extra }).where(eq(studioRequests.id, id));
}
async function addEvent(requestId: string, kind: string, byId: string | null, note?: string | null, refs: string[] = []) {
  await db().insert(studioEvents).values({ requestId, kind, byId, note: note?.trim() || null, refs });
}

/** Studio reviewers: admins plus people with "Studio reviewer" ticked. */
export async function studioReviewers(): Promise<string[]> {
  const rows = await db().select({ id: users.id }).from(users).where(sql`${users.role} = 'admin' or ${users.canUseStudio} = true`);
  return rows.map((r) => r.id);
}

/** A ticket's short name for notifications: its first line, cut at 60 characters. */
const short = (t: Ticket) => { const line = t.prompt.split("\n")[0].trim(); return `“${line.length > 60 ? `${line.slice(0, 59)}…` : line}”`; };
const ticketHref = (id: string) => `/studio/requests/${id}`;
async function tell(recipients: (string | null)[], text: string, href: string, actor: SignedInUser | null = null) {
  await notify(recipients, { kind: "studio", text, href, actor });
}

/**
 * Claude's reply to a new ticket (`npm run studio -- reply|merge|build`, or the connector's studio_reply):
 *   recommend  existing templates or themes cover it (`refs`: "template:<id>", "theme:<id>" or an approved proposal id)
 *   merge      a duplicate of another open ticket (`into`)
 *   build      nothing fits: a build is needed (a reviewer's own ticket is approved straight away)
 */
export async function claudeReply(id: string, outcome: "recommend" | "merge" | "build", note: string, opts: { refs?: string[]; into?: string } = {}) {
  const t = await ticket(id);
  if (!t) throw new StudioError(`No request "${id}".`);
  if (t.kind === "rule") throw new StudioError("Rule changes aren't tickets: edit STUDIO.md, then close the request.");
  if (t.status !== "new") throw new StudioError(`This ticket is ${TICKET_LABEL[t.status].toLowerCase()}, not waiting for Claude.`);
  if (!note.trim()) throw new StudioError("Write the reply the requester will read.");
  const reviewers = await studioReviewers();
  if (outcome === "recommend") {
    const refs = [...new Set(opts.refs ?? [])];
    if (!refs.length) throw new StudioError("Name at least one template or theme to recommend.");
    for (const r of refs) if (!(await remixSource(r))) throw new StudioError(`"${r}" isn't a library template, theme or approved proposal.`);
    await setStatus(id, "answered");
    await addEvent(id, "reply", null, note, refs);
    await tell([t.authorId], `Claude replied to your request ${short(t)}: something that exists may already work.`, ticketHref(id));
    await tell(reviewers.filter((r) => r !== t.authorId), `Claude pointed ${t.author ?? "a request"}'s request ${short(t)} to the library.`, ticketHref(id));
  } else if (outcome === "merge") {
    const into = opts.into ? await ticket(opts.into) : null;
    if (!into || into.id === id) throw new StudioError("Name the ticket it duplicates.");
    if (into.status === "merged" || into.status === "withdrawn") throw new StudioError("Merge into a ticket that's still going.");
    await setStatus(id, "merged", { mergedInto: into.id });
    await addEvent(id, "merged", null, note, [into.id]);
    await tell([t.authorId], `Your request ${short(t)} was merged into a matching one. Follow it there.`, ticketHref(into.id));
    await tell(reviewers.filter((r) => r !== t.authorId), `Claude merged a request into ${short(into)}.`, ticketHref(into.id));
  } else {
    const next: TicketStatus = t.draftLoop ? "approved" : "needs_approval";
    await setStatus(id, next);
    await addEvent(id, "build_needed", null, note);
    await tell([t.authorId], next === "approved"
      ? `Claude found nothing that fits ${short(t)}: it's building it.`
      : `Claude found nothing that fits ${short(t)}: it's waiting for a reviewer to approve the build.`, ticketHref(id));
    if (next === "needs_approval") await tell(reviewers.filter((r) => r !== t.authorId), `New request to approve: ${short(t)} from ${t.author ?? "someone"}.`, ticketHref(id));
  }
}

/** The requester's answer to Claude's recommendation: it works (resolved), or they still need a build. */
export async function answerTicket(u: SignedInUser | null, id: string, answer: "works" | "still_need", note = "") {
  const t = await ticket(id);
  if (!t) throw new StudioError("No such request.");
  if (u && t.authorId !== u.id) throw new StudioError("Only the requester can answer Claude.");
  if (t.status !== "answered") throw new StudioError("This request isn't waiting for your answer.");
  await addEvent(id, answer, u?.id ?? null, note);
  if (answer === "works") return setStatus(id, "resolved");
  // A reviewer doesn't approve their own request: theirs goes straight to Claude.
  const next: TicketStatus = canUseStudio(u) ? "approved" : "needs_approval";
  await setStatus(id, next);
  if (next === "needs_approval") {
    await tell((await studioReviewers()).filter((r) => r !== t.authorId), `New request to approve: ${short(t)} from ${t.author ?? "someone"} (still needed after Claude's suggestion).`, ticketHref(id), u);
  }
}

/** A reviewer approves a ticket for building, or rejects it with a reason. */
export async function reviewTicket(u: SignedInUser | null, id: string, decision: "approved" | "rejected", reason: string) {
  mustUse(u);
  const t = await ticket(id);
  if (!t || t.closedAt) throw new StudioError("This request is closed.");
  if (!PRE_APPROVAL.includes(t.status)) throw new StudioError("This request is approved already.");
  if (decision === "rejected" && !reason.trim()) throw new StudioError("Say why it's rejected: the requester sees it.");
  await setStatus(id, decision);
  await addEvent(id, decision, u?.id ?? null, reason);
  await tell([t.authorId], decision === "approved"
    ? `Your request ${short(t)} was approved: Claude builds it next.`
    : `Your request ${short(t)} was rejected: ${reason.trim()}`, ticketHref(id), u);
}

/**
 * Records each new build (first version or a revision) on its ticket and tells the requester, and reviewers when
 * it's for review. Runs with `npm run studio` and the connector's studio_queue, so it catches what Claude built.
 */
export async function syncBuilt(): Promise<string[]> {
  const built = proposals.filter((p) => p.request);
  if (!built.length) return [];
  const ids = built.map((p) => p.request!);
  const [known, rows, decisions] = await Promise.all([
    db().select({ requestId: studioEvents.requestId, note: studioEvents.note }).from(studioEvents)
      .where(and(inArray(studioEvents.requestId, ids), eq(studioEvents.kind, "built"))),
    db().select(ticketCols).from(studioRequests).leftJoin(users, eq(users.id, studioRequests.authorId)).where(inArray(studioRequests.id, ids)),
    decisionsOf(),
  ]);
  const done: string[] = [];
  let reviewers: string[] | null = null;
  for (const p of built) {
    const r = rows.find((x) => x.id === p.request);
    const rev = `rev ${p.revision}`;
    if (!r || known.some((k) => k.requestId === r.id && k.note === rev)) continue;
    const t = shape(r);
    await addEvent(t.id, "built", null, rev, [p.id]);
    const { status } = statusOf(p, decisions);
    if (status === "approved" || status === "rejected") continue; // decided before it was recorded (older proposals)
    reviewers ??= await studioReviewers();
    const what = p.revision > 1 ? `Revision ${p.revision} of ${p.name}` : p.name;
    await tell([t.authorId], status === "draft"
      ? `${what} is ready in your draft.`
      : `${what} is built for your request ${short(t)} and waiting for review.`, `/studio/${p.id}`);
    if (status === "waiting") await tell(reviewers.filter((x) => x !== t.authorId), `${what} is ready for review.`, `/studio/${p.id}`);
    done.push(p.id);
  }
  return done;
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
  // Remixes by people who aren't reviewers skip the draft: once built they go straight to review (statusOf).
  const noDraft = new Set((await db().select({ id: studioRequests.id }).from(studioRequests).where(eq(studioRequests.draftLoop, false))).map((r) => r.id));
  return Object.assign(rows.map((r) => ({ ...r, images: files.filter((f) => f.decisionId === r.id).map((f) => f.id) })), { noDraft });
}

/** One attached image (served at /studio/attachments/<id> to people with Studio access). */
export async function attachment(id: string) {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const [row] = await db().select({ mime: studioAttachments.mime, data: studioAttachments.data }).from(studioAttachments).where(eq(studioAttachments.id, id)).limit(1);
  return row ? { mime: row.mime, bytes: Buffer.from(row.data, "base64") } : null;
}
type DecisionRow = Awaited<ReturnType<typeof decisionsOf>>[number];
type Decisions = DecisionRow[] & { noDraft?: Set<string> };

/**
 * Where a proposal stands, from the newest decision on its current revision. A new revision is for review again,
 * except a remix, which stays a draft until someone sends it for review. `building`: there's a prompt on the
 * current revision that Claude hasn't built yet.
 */
export function statusOf(p: Proposal, rows: Decisions): { status: Status; latest?: DecisionRow; building: boolean } {
  const latest = rows.find((r) => r.proposalId === p.id);
  const d = latest?.revision === p.revision ? latest.decision : undefined;
  const drafts = p.remixOf && !(p.request && rows.noDraft?.has(p.request));
  const status: Status = d === "approved" || d === "rejected" ? d
    : d === "submitted" ? "waiting"
    : d === "changes_requested" ? "draft"
    : drafts ? "draft" : "waiting";
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
  return savePrompt(u, target, note, images);
}

async function savePrompt(u: SignedInUser | null, target: string, note: string, images: NewImage[]) {
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
export async function startRequest(u: SignedInUser | null, kind: RequestKind, note: string, images: NewImage[] = [], remix?: string, revise = false) {
  checkImages(images);
  const id = await addRequest(u, kind, note.trim() || (images.length ? "(see the images)" : ""), remix, revise);
  if (images.length) await savePrompt(u, `request:${id}`, "", images);
  return id;
}

/** Starts a remix draft (or, with `revise`, a revision of the original): a request naming its source, with the first prompt (and its images). */
export const startRemix = (u: SignedInUser | null, ref: string, note: string, images: NewImage[] = [], revise = false) => startRequest(u, "layout", note, images, ref, revise);

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
  if (decision === "rejected" && !text) throw new StudioError("Write why it's rejected in the note box: the requester sees it.");
  checkImages(images);
  let added: string | undefined;
  if (decision === "approved" && p.kind === "theme" && canEditThemes(u)) {
    const existing = (await publishedThemes()).find((t) => t.name === p.name);
    added = existing?.id ?? await createTheme(u, p.name);
    await saveThemeDraft(u, added, { tokens: p.tokens, note: `Approved in the Studio (rev ${p.revision})` });
    await publishTheme(u, added);
  }
  await record(u, id, p.revision, decision, text, images);
  const t = p.request ? await ticket(p.request) : null;
  if (t) {
    await tell([t.authorId], decision === "approved" ? `${p.name} was approved and joins the library.`
      : decision === "rejected" ? `${p.name} was rejected: ${text}`
      : `${p.name} was sent back to Claude for changes.`, `/studio/${p.id}`, u);
  }
  return { themeId: added };
}

export const isStudioDecision = (d: string): d is Decision => d === "approved" || d === "changes_requested" || d === "rejected";

/**
 * Everything waiting on Claude, for `npm run studio` and the Dekiru connector's studio_queue: open requests (with
 * their remix prompts), prompts on drafts and sent-back proposals, and approved layouts to move into the library.
 */
export async function studioQueue() {
  await syncBuilt();
  const [requests, decisions, all, themes] = await Promise.all([openRequests(), decisionsOf(), tickets(), publishedThemes()]);
  const open = all.filter((t) => !t.closedAt && t.status !== "merged");
  const promptsOn = (target: string, revision: number) => decisions
    .filter((d) => d.proposalId === target && d.revision === revision && d.decision === "changes_requested").reverse()
    .map((d) => ({ id: d.id, note: d.note, images: d.images, by: d.by, at: d.createdAt }));
  const rows = proposals.map((p) => ({ p, ...statusOf(p, decisions) }));
  return {
    /** New tickets to check before anything is built: recommend, merge or say a build is needed (claudeReply). */
    check: all.filter((t) => t.status === "new").reverse().map((t) => ({
      id: t.id, kind: t.kind, prompt: t.prompt, remix: t.remix, revise: t.revise, author: t.author, email: t.email, createdAt: t.createdAt,
      prompts: promptsOn(`request:${t.id}`, 0),
    })),
    /** What a ticket can be pointed to or merged into. */
    library: {
      templates: templates.map((t) => ({ ref: `template:${t.id}`, name: t.name, use: t.use })),
      themes: themes.map((t) => ({ ref: `theme:${t.id}`, name: t.name })),
      approved: rows.filter((r) => r.status === "approved").map((r) => ({ ref: r.p.id, name: r.p.name, kind: r.p.kind, brief: r.p.brief })),
      tickets: open.filter((t) => t.status !== "new").map((t) => ({ id: t.id, status: t.status, kind: t.kind, prompt: t.prompt.slice(0, 300) })),
    },
    requests: requests.map((r) => ({ ...r, prompts: promptsOn(`request:${r.id}`, 0) })),
    revise: rows.filter((r) => r.building).map(({ p }) => ({ id: p.id, revision: p.revision, remixOf: p.remixOf, revises: p.revises, prompts: promptsOn(p.id, p.revision) })),
    ship: rows.filter((r) => r.status === "approved" && r.p.kind === "layout" && !patterns[r.p.entry.meta.id]).map((r) => r.p.id),
    waiting: rows.filter((r) => r.status === "waiting").map((r) => r.p.id),
    drafts: rows.filter((r) => r.status === "draft" && !r.building).map((r) => r.p.id),
  };
}
export type StudioQueue = Awaited<ReturnType<typeof studioQueue>>;

/** One key per piece of work Claude has to do, so a watcher can tell what's new since it last looked. */
export const workKeys = (q: StudioQueue) => [
  ...q.check.map((t) => `check:${t.id}`),
  ...q.requests.flatMap((r) => [`request:${r.id}`, ...r.prompts.map((x) => `prompt:${x.id}`)]),
  ...q.revise.flatMap((r) => r.prompts.map((x) => `prompt:${x.id}`)),
  ...q.ship.map((id) => `ship:${id}`),
];
