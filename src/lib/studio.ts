import { asc, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { studioDecisions, studioRequests, users } from "@/db/schema";
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

export type RequestKind = "layout" | "theme";
export type Decision = "approved" | "changes_requested" | "rejected";
export type Status = "waiting" | Decision;

export const STATUS_LABEL: Record<Status, string> = {
  waiting: "For review", changes_requested: "Changes requested", approved: "Approved", rejected: "Rejected",
};

export async function addRequest(u: SignedInUser | null, kind: RequestKind, prompt: string) {
  mustUse(u);
  const text = prompt.trim();
  if (!text) throw new StudioError("Describe what you'd like.");
  if (kind !== "layout" && kind !== "theme") throw new StudioError("Pick a layout or a theme.");
  await db().insert(studioRequests).values({ kind, prompt: text.slice(0, 4000), authorId: u?.id ?? null });
}

export async function dismissRequest(u: SignedInUser | null, id: string) {
  mustUse(u);
  await db().update(studioRequests).set({ closedAt: new Date() }).where(eq(studioRequests.id, id));
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

export async function decisionsOf(proposalId?: string) {
  return db()
    .select({ proposalId: studioDecisions.proposalId, revision: studioDecisions.revision, decision: studioDecisions.decision, note: studioDecisions.note, createdAt: studioDecisions.createdAt, by: users.name })
    .from(studioDecisions).leftJoin(users, eq(users.id, studioDecisions.byId))
    .where(proposalId ? eq(studioDecisions.proposalId, proposalId) : undefined)
    .orderBy(desc(studioDecisions.createdAt));
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
export async function decide(u: SignedInUser | null, id: string, decision: Decision, note: string) {
  mustUse(u);
  const p = proposal(id);
  if (!p) throw new StudioError(`No proposal "${id}".`);
  if (!["approved", "changes_requested", "rejected"].includes(decision)) throw new StudioError("Unknown decision.");
  const text = note.trim();
  if (decision === "changes_requested" && !text) throw new StudioError("Say what should change.");
  let added: string | undefined;
  if (decision === "approved" && p.kind === "theme" && canEditThemes(u)) {
    const existing = (await publishedThemes()).find((t) => t.name === p.name);
    added = existing?.id ?? await createTheme(u, p.name);
    await saveThemeDraft(u, added, { tokens: p.tokens, note: `Approved in the Studio (rev ${p.revision})` });
    await publishTheme(u, added);
  }
  await db().insert(studioDecisions).values({ proposalId: id, revision: p.revision, decision, note: text || null, byId: u?.id ?? null });
  return { themeId: added };
}

export const isStudioDecision = (d: string): d is Decision => d === "approved" || d === "changes_requested" || d === "rejected";
