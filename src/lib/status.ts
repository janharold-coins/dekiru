/**
 * Deck status vocabulary (review v2, spec §7b): Draft → Under review → Approved → Master, the same for
 * English and every translation. "Changes requested" is a Draft with a note. Pure, so client components can use it.
 */
export type ReviewStatus = "for_review" | "changes_requested" | "approved" | "withdrawn";
export type StatusTone = "none" | "wait" | "ok" | "warn";
export interface StatusLabel { text: string; tone: StatusTone }

/**
 * `review`: the newest review of this layer. `approvedBefore`: an earlier version of this layer is approved and live,
 * so the deck keeps that status while a revision is drafted or reviewed ("Master · revision under review").
 */
export function statusLabel(input: { kind: "master" | "copy"; hasDraft: boolean; review: ReviewStatus | null | undefined; approvedBefore?: boolean }): StatusLabel {
  const { kind, hasDraft, review, approvedBefore } = input;
  const done = kind === "master" ? "Master" : "Approved";
  const more = hasDraft ? " · draft changes" : "";
  if (review === "approved") return { text: done + more, tone: "ok" };
  if (approvedBefore) {
    if (review === "for_review") return { text: `${done} · revision under review`, tone: "ok" };
    if (review === "changes_requested") return { text: `${done} · changes requested`, tone: "ok" };
    return { text: done + more, tone: "ok" };
  }
  if (review === "for_review") return { text: "Under review" + more, tone: "wait" };
  if (review === "changes_requested") return { text: "Draft · changes requested", tone: "warn" };
  return { text: "Draft", tone: "none" };
}

/** Longer explanation for a tooltip. */
export function statusHint(input: { kind: "master" | "copy"; hasDraft: boolean; review: ReviewStatus | null | undefined; approvedVersion?: number | null; sentVersion?: number | null }) {
  const { hasDraft, review, approvedVersion, sentVersion } = input;
  const live = approvedVersion ? `v${approvedVersion} is approved and live.` : sentVersion ? `v${sentVersion} was sent; nothing is approved yet.` : "Nothing has been sent for review yet.";
  if (hasDraft) return `Unsent changes. ${live}`;
  if (review === "for_review") return `Waiting for reviewers. ${live}`;
  if (review === "approved") return live;
  if (review === "changes_requested") return `A reviewer asked for changes. ${live}`;
  return live;
}
