"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * Review controls in the deck editor (spec §7a, status pipeline §7b). Everything here follows the preview
 * language: in English it's about the deck's content review, in Chinese or Thai about that translation's review.
 * Status: Draft → Under review → Approved → Master. "Send for review" freezes the draft as the version reviewers see.
 */
import { useEffect, useRef, useState, useTransition } from "react";
import { LANGUAGES, type Lang } from "@/deck/i18n";
import type { ReviewSummary } from "@/lib/reviews";
import type { RevisionDiff, SlideChange } from "@/lib/editing";
import { statusHint, statusLabel, type StatusLabel } from "@/lib/status";
import {
  approveDeckAction, approveForEveryoneAction, approveSlideAction, promoteDeckAction, requestChangesAction, sendForReviewAction, withdrawReviewAction,
} from "./actions";

/** What the page knows about reviews, serialisable for the client. */
export interface ReviewProps {
  content: ReviewSummary | null;
  translations: Partial<Record<"zh" | "th", ReviewSummary | null>>;
  /** Whether the signed-in person may approve each layer's open review (admins yes, requesters no). */
  canReview: Partial<Record<Lang, boolean>>;
  canSend: boolean;
  admin: boolean;
  userId: string | null;
  /** Names of people, for "Approved by …". */
  names: Record<string, string>;
  /** Per layer under review: what changed since the last approved version (null = first review, nothing to dim). */
  diff: Partial<Record<Lang, RevisionDiff | null>>;
}

/** What a reviewer should know about one slide in the reviewed language, or null when there's no earlier approved version. */
export function slideChange(review: ReviewProps, lang: Lang, slideId: string): SlideChange | null {
  const d = review.diff[lang];
  if (!d) return null;
  return d.slides[slideId] ?? { kind: "unchanged", fields: [] };
}

export const CHANGE_LABEL: Record<SlideChange["kind"], string> = { added: "New", edited: "Edited", moved: "Moved", hidden: "Hidden", shown: "Shown", unchanged: "" };

export const summaryFor = (r: ReviewProps, lang: Lang) => (lang === "en" ? r.content : r.translations[lang] ?? null);

const ICON = (name: string, size = 16) => <img src={`/editor/${name}.svg`} alt="" width={size} height={size} />;

/** Context the status needs beyond the review itself: the deck's kind and whether there are unsent changes. */
export interface StatusCtx { kind: "master" | "copy"; hasDraft: boolean; sentVersion?: number | null; approvedVersion?: number | null }

/** Status of one language layer, for the Language button and its list (no counts — the tooltip has them). */
export function reviewLabel(s: ReviewSummary | null, ctx: StatusCtx, lang: Lang = "en"): StatusLabel {
  // The live approved version (ctx.approvedVersion) is about the English content; translations stand on their own review.
  return statusLabel({ kind: ctx.kind, hasDraft: ctx.hasDraft, review: s?.status ?? null, approvedBefore: lang === "en" && Boolean(ctx.approvedVersion) });
}

/** Tooltip for one language's status. */
export function reviewTitle(s: ReviewSummary | null, lang: Lang, ctx: StatusCtx) {
  const hint = statusHint({ kind: ctx.kind, hasDraft: ctx.hasDraft, review: s?.status ?? null, sentVersion: ctx.sentVersion, approvedVersion: ctx.approvedVersion });
  const layer = lang === "en" ? "" : `${LANGUAGES[lang].english} translation: `;
  if (!s || ctx.hasDraft) return `${layer}${hint}`;
  if (s.status === "approved") return `${layer}Approved${s.approverNames.length ? ` by ${s.approverNames.join(", ")}` : ""}. ${hint}`;
  if (s.status === "changes_requested") return `${layer}Changes requested${s.note ? `: ${s.note}` : ""}`;
  return `${layer}Under review · ${s.level} of ${s.required} approvals · ${s.approvedSlides} of ${s.totalSlides} slides done${s.approverNames.length ? ` · approved so far by ${s.approverNames.join(", ")}` : ""}.`;
}

/** Status chip (used where the Language button isn't shown). */
export function ReviewChip({ review, lang, ctx }: { review: ReviewProps; lang: Lang; ctx: StatusCtx }) {
  const s = summaryFor(review, lang);
  const l = reviewLabel(s, ctx, lang);
  return <span className={`ed-review-chip ${l.tone}`} title={reviewTitle(s, lang, ctx)}><i aria-hidden />{l.text}</span>;
}

/** Runs a review action, then reloads so the editor shows the new state. */
function useReviewAction(deckId: string, onError: (m: string) => void) {
  const [busy, start] = useTransition();
  const run = (fn: () => Promise<{ error?: string }>) => start(async () => {
    const r = await fn();
    if (r.error) onError(r.error); else window.location.reload();
  });
  return { busy, run };
}

/** "Send for review" (editors) or "Approve deck" (reviewers), beside Present. */
export function ReviewButtons({ deckId, review, lang, hasDraft, onError }: { deckId: string; review: ReviewProps; lang: Lang; hasDraft: boolean; onError: (m: string) => void }) {
  const s = summaryFor(review, lang);
  const { busy, run } = useReviewAction(deckId, onError);
  const what = lang === "en" ? "deck" : `${LANGUAGES[lang].english} translation`;
  if (s?.status === "for_review" && review.canReview[lang]) {
    const left = s.totalSlides - s.approvedSlides;
    return (
      <button type="button" className="ed-btn ed-btn-approve" disabled={busy} onClick={() => run(() => approveDeckAction(deckId, lang))}
        title={`Approve every slide of the ${what} (${left} still need${left === 1 ? "s" : ""} your approval).`}>
        {ICON("check", 15)}<span>{busy ? "Approving…" : "Approve deck"}</span>
      </button>
    );
  }
  // Editors can send whenever there is something new: unsent changes, or a version nobody is reviewing yet.
  if (review.canSend && (hasDraft || !s || s.status === "changes_requested" || s.status === "withdrawn")) {
    return (
      <button type="button" className="ed-btn ed-btn-publish" disabled={busy} onClick={() => run(() => sendForReviewAction(deckId, lang))}
        title={hasDraft ? `Freeze the current changes as a new version and ask reviewers to approve the ${what}. You can keep editing afterwards; reviewers only see what you sent.` : `Ask reviewers to approve the ${what}.`}>
        {busy ? "Sending…" : "Send for review"}
      </button>
    );
  }
  return null;
}

/** Items for the "More" menu: withdraw, request changes, approve for everyone, promote. */
export function reviewMenuItems(deckId: string, review: ReviewProps, lang: Lang, deckKind: "master" | "copy", hasDraft: boolean, open: (d: Dialog) => void) {
  const s = summaryFor(review, lang);
  const what = lang === "en" ? "deck" : `${LANGUAGES[lang].english} translation`;
  return [
    { label: "Request changes…", onSelect: () => open({ kind: "changes", lang }), hidden: !(s?.status === "for_review" && review.canReview[lang]) },
    { label: "Withdraw from review", onSelect: () => open({ kind: "withdraw", lang }), hidden: !(s?.status === "for_review" && review.canSend) },
    { label: `Approve ${what} for everyone…`, onSelect: () => open({ kind: "override", lang }), hidden: !(review.admin && s?.status !== "approved" && (lang === "en" || lang in review.translations)) },
    { label: "Promote to company deck…", onSelect: () => open({ kind: "promote", lang: "en" as Lang }), hidden: !(review.admin && deckKind === "copy" && review.content?.status === "approved" && !hasDraft) },
  ];
}

export type Dialog = { kind: "changes" | "withdraw" | "override" | "promote"; lang: Lang };

/** The dialogs those menu items open. */
export function ReviewDialog({ deckId, dialog, onClose, onError }: { deckId: string; dialog: Dialog; onClose: () => void; onError: (m: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState("");
  const { busy, run } = useReviewAction(deckId, (m) => { onClose(); onError(m); });
  useEffect(() => { const d = ref.current; if (d && !d.open) d.showModal(); }, []);
  const what = dialog.lang === "en" ? "deck" : `${LANGUAGES[dialog.lang].english} translation`;
  const copy = {
    changes: { title: "Request changes", body: `Tell the editor what should change in the ${what}. The review closes until they send it again.`, action: "Request changes", danger: true, note: true },
    withdraw: { title: "Withdraw from review?", body: `The ${what} stops waiting for review. Approvals so far are kept for slides that don't change.`, action: "Withdraw", danger: false, note: false },
    override: { title: `Approve the ${what} for everyone?`, body: "This approves it without the usual number of reviewers. History records that you did.", action: "Approve for everyone", danger: false, note: true },
    promote: { title: "Promote to company deck?", body: "The deck becomes a company deck everyone can see and reuse; its slides become approved blocks. This can't be undone from the app.", action: "Promote", danger: false, note: false },
  }[dialog.kind];
  const go = () => run(() =>
    dialog.kind === "changes" ? requestChangesAction(deckId, dialog.lang, note)
    : dialog.kind === "withdraw" ? withdrawReviewAction(deckId, dialog.lang)
    : dialog.kind === "override" ? approveForEveryoneAction(deckId, dialog.lang, note)
    : promoteDeckAction(deckId));
  return (
    <dialog ref={ref} className="ed-dialog" aria-labelledby="ed-review-dialog-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ed-dialog-body">
        <h2 id="ed-review-dialog-title">{copy.title}</h2>
        <p>{copy.body}</p>
        {copy.note && (
          <textarea className="ed-review-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} autoFocus
            placeholder={dialog.kind === "changes" ? "What should change" : "Why (optional)"} aria-label="Note" />
        )}
      </div>
      <div className="ed-dialog-actions">
        <button type="button" className="ed-btn" onClick={onClose}>Cancel</button>
        <button type="button" className={`ed-btn ${copy.danger ? "ed-btn-danger" : "ed-btn-primary"}`} disabled={busy || (dialog.kind === "changes" && !note.trim())} onClick={go}>
          {busy ? "Working…" : copy.action}
        </button>
      </div>
    </dialog>
  );
}

/** Per-slide approval in the content panel header. */
export function ApproveSlide({ deckId, slideId, review, lang, onError }: { deckId: string; slideId: string; review: ReviewProps; lang: Lang; onError: (m: string) => void }) {
  const s = summaryFor(review, lang);
  const { busy, run } = useReviewAction(deckId, onError);
  if (!s || s.status !== "for_review") return null;
  const slide = s.slides[slideId];
  if (!slide) return lang === "en" ? null : <span className="ed-slide-review none">No {LANGUAGES[lang].english} text on this slide</span>;
  const mine = review.userId ? slide.approvers.includes(review.userId) : false;
  const by = slide.approvers.map((id) => review.names[id] ?? "someone");
  const status = slide.ok ? `Approved${by.length ? ` by ${by.join(", ")}` : ""}` : `${slide.approvers.length} of ${s.required}${by.length ? ` · ${by.join(", ")}` : ""}`;
  return (
    <span className="ed-slide-review-wrap">
      {review.canReview[lang] && !mine && !slide.ok && (
        <button type="button" className="ed-btn ed-btn-sm ed-btn-approve" disabled={busy} onClick={() => run(() => approveSlideAction(deckId, slideId, lang))}>
          {ICON("check", 13)}<span>{busy ? "…" : "Approve slide"}</span>
        </button>
      )}
      <span className={`ed-slide-review ${slide.ok ? "ok" : "wait"}`} title={status}>{slide.ok ? "Approved" : mine ? "You approved" : `${slide.approvers.length}/${s.required}`}</span>
    </span>
  );
}
