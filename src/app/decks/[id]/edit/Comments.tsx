"use client";
/* eslint-disable @next/next/no-img-element */
/**
 * Comments on slides (editor › Comments tab). Anyone who can open the deck can comment; a thread is a
 * root comment plus replies, optionally pinned to a point or an area of the slide (press C, then click or
 * drag on the slide). Pins are numbered on the slide while the Comments tab is open.
 */
import { useEffect, useRef, useState } from "react";
import type { Comment, CommentAnchor } from "@/lib/comments";
import { addCommentAction, deleteCommentAction, editCommentAction, resolveCommentAction } from "./actions";
import { Menu } from "./Menu";

export type { Comment, CommentAnchor };

export interface Thread { root: Comment; replies: Comment[]; /** Pin number on the slide (anchored threads only). */ n: number | null }

/** Threads on one slide, oldest first; pins numbered in that order (resolved threads keep their number). */
export function threadsFor(all: Comment[], slideId: string): Thread[] {
  const roots = all.filter((c) => c.slideId === slideId && !c.parentId);
  let n = 0;
  return roots.map((root) => ({ root, replies: all.filter((c) => c.parentId === root.id), n: root.anchor ? ++n : null }));
}

export const openCount = (all: Comment[], slideId: string) => all.filter((c) => c.slideId === slideId && !c.parentId && !c.resolvedAt).length;

const ICON = (name: string, size = 16) => <img src={`/editor/${name}.svg`} alt="" width={size} height={size} />;

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Manila" });
}

/** What the editor keeps about comments: the list, who's signed in, and the selection/pin state shared with the canvas. */
export interface CommentsState {
  comments: Comment[];
  userId: string | null;
  admin: boolean;
  /** Thread shown highlighted on the slide. */
  activeId: string | null;
  /** Press C: the next click or drag on the slide places the new comment's pin. */
  pinMode: boolean;
  /** Where the comment being written will be pinned (null = not pinned). */
  draftAnchor: CommentAnchor | null;
}

/* ================= Panel (the Comments tab) ================= */

export function CommentsPanel({ deckId, slideId, state, onState, onComments, onError, composerRef }: {
  deckId: string; slideId: string | null; state: CommentsState;
  onState: (patch: Partial<CommentsState>) => void;
  onComments: (fn: (all: Comment[]) => Comment[]) => void;
  onError: (m: string) => void;
  /** The composer textarea, so pressing C then typing lands in it. */
  composerRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [showResolved, setShowResolved] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  if (!slideId) return <div className="ed-form" role="tabpanel"><p className="ed-hint">Choose a slide on the left.</p></div>;
  const threads = threadsFor(state.comments, slideId);
  const open = threads.filter((t) => !t.root.resolvedAt);
  const resolved = threads.filter((t) => t.root.resolvedAt);
  const shown = showResolved ? threads : open;

  const post = async () => {
    const text = body.trim();
    if (!text || busy) return;
    setBusy(true);
    const r = await addCommentAction(deckId, { slideId, body: text, anchor: state.draftAnchor });
    setBusy(false);
    if (r.error || !r.comment) { onError(r.error ?? "Couldn't post the comment."); return; }
    const c = r.comment;
    onComments((all) => [...all, c]);
    setBody("");
    onState({ draftAnchor: null, pinMode: false, activeId: c.id });
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void post(); }
    if (e.key === "Escape") { (e.target as HTMLElement).blur(); onState({ pinMode: false }); }
  };
  const anchorLabel = state.draftAnchor ? (state.draftAnchor.w ? "Pinned to an area" : "Pinned to a point") : null;

  return (
    <div className="ed-form ed-comments" role="tabpanel">
      <div className={`ed-compose${state.pinMode ? " pinning" : ""}`}>
        {state.pinMode && !state.draftAnchor && (
          <p className="ed-compose-hint">{ICON("plus-small", 12)}<span>Click a spot or drag an area on the slide to pin this comment, or just start typing. Esc to cancel.</span></p>
        )}
        {anchorLabel && (
          <p className="ed-compose-pin">
            <span className="ed-pin ed-pin-new" aria-hidden>{(threads.filter((t) => t.n).length + 1)}</span>
            <span>{anchorLabel}</span>
            <button type="button" className="ed-link" onClick={() => onState({ draftAnchor: null })}>Remove</button>
            <button type="button" className="ed-link" onClick={() => onState({ pinMode: true })}>Move</button>
          </p>
        )}
        <textarea ref={composerRef} className="ed-input" rows={2} placeholder={threads.length ? "Add a comment…" : "Add the first comment… Press C to pin it to the slide."}
          value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={onKey} disabled={busy} />
        <div className="ed-compose-f">
          {!state.draftAnchor && !state.pinMode && (
            <button type="button" className="ed-btn ed-btn-sm" onClick={() => onState({ pinMode: true })} title="Shortcut: C">{ICON("plus-small", 12)}<span>Pin to slide</span></button>
          )}
          <button type="button" className="ed-btn ed-btn-sm ed-btn-primary" disabled={!body.trim() || busy} onClick={() => void post()}>{busy ? "Posting…" : "Comment"}</button>
        </div>
      </div>

      {!threads.length ? <p className="ed-hint">No comments on this slide yet.</p> : (
        <>
          <ol className="ed-threads">
            {shown.map((t) => (
              <ThreadCard key={t.root.id} deckId={deckId} thread={t} state={state} onState={onState} onComments={onComments} onError={onError} />
            ))}
          </ol>
          {resolved.length > 0 && (
            <button type="button" className="ed-link ed-resolved-toggle" onClick={() => setShowResolved((v) => !v)}>
              {showResolved ? "Hide" : "Show"} resolved ({resolved.length})
            </button>
          )}
        </>
      )}
    </div>
  );
}

function ThreadCard({ deckId, thread, state, onState, onComments, onError }: {
  deckId: string; thread: Thread; state: CommentsState; onState: (p: Partial<CommentsState>) => void;
  onComments: (fn: (all: Comment[]) => Comment[]) => void; onError: (m: string) => void;
}) {
  const { root, replies, n } = thread;
  const active = state.activeId === root.id;
  const ref = useRef<HTMLLIElement>(null);
  const [replying, setReplying] = useState(false);
  useEffect(() => { if (active) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [active]);
  const resolve = async (on: boolean) => {
    const r = await resolveCommentAction(deckId, root.id, on);
    if (r.error) { onError(r.error); return; }
    const at = on ? new Date().toISOString() : null;
    onComments((all) => all.map((c) => (c.id === root.id ? { ...c, resolvedAt: at } : c)));
    onState({ activeId: null });
  };
  return (
    <li ref={ref} className={`ed-thread${active ? " on" : ""}${root.resolvedAt ? " resolved" : ""}`} onClick={() => onState({ activeId: root.id })}>
      <CommentView deckId={deckId} c={root} n={n} state={state} onComments={onComments} onError={onError}
        extra={[
          root.resolvedAt
            ? { label: "Reopen", onSelect: () => void resolve(false) }
            : { label: "Resolve", onSelect: () => void resolve(true) },
        ]} />
      {replies.length > 0 && (
        <ol className="ed-replies">
          {replies.map((c) => <CommentView key={c.id} deckId={deckId} c={c} n={null} state={state} onComments={onComments} onError={onError} extra={[]} />)}
        </ol>
      )}
      {root.resolvedAt ? (
        <p className="ed-thread-resolved">{ICON("check", 12)}<span>Resolved {timeAgo(root.resolvedAt)}</span></p>
      ) : replying ? (
        <ReplyBox deckId={deckId} root={root} onDone={(c) => { setReplying(false); if (c) onComments((all) => [...all, c]); }} onError={onError} />
      ) : (
        <button type="button" className="ed-link ed-reply-btn" onClick={(e) => { e.stopPropagation(); setReplying(true); onState({ activeId: root.id }); }}>Reply</button>
      )}
    </li>
  );
}

function CommentView({ deckId, c, n, state, onComments, onError, extra }: {
  deckId: string; c: Comment; n: number | null; state: CommentsState;
  onComments: (fn: (all: Comment[]) => Comment[]) => void; onError: (m: string) => void;
  extra: { label: string; onSelect: () => void }[];
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(c.body);
  const mine = state.userId == null || state.admin || c.authorId === state.userId;
  const save = async () => {
    const r = await editCommentAction(deckId, c.id, text);
    if (r.error || !r.comment) { onError(r.error ?? "Couldn't save."); return; }
    const u = r.comment;
    onComments((all) => all.map((x) => (x.id === c.id ? u : x)));
    setEditing(false);
  };
  const remove = async () => {
    const r = await deleteCommentAction(deckId, c.id);
    if (r.error) { onError(r.error); return; }
    onComments((all) => all.filter((x) => x.id !== c.id && x.parentId !== c.id));
  };
  return (
    <div className="ed-comment">
      <div className="ed-comment-h">
        {n != null && <span className="ed-pin" aria-label={`Pin ${n}`}>{n}</span>}
        <b>{c.authorId && c.authorId === state.userId ? "You" : c.authorName}</b>
        <span className="ed-comment-time" title={new Date(c.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Manila" })}>{timeAgo(c.createdAt)}{c.editedAt ? " · edited" : ""}</span>
        <span onClick={(e) => e.stopPropagation()}>
          <Menu label="Comment actions" trigger={ICON("ellipsis", 14)} items={[
            ...extra,
            { label: "Edit", onSelect: () => { setText(c.body); setEditing(true); }, hidden: !mine },
            { label: "Delete", danger: true, hidden: !mine, onSelect: () => void remove(),
              confirm: { title: c.parentId ? "Delete this reply?" : "Delete this comment?", body: c.parentId ? undefined : "Its replies are deleted with it.", action: "Delete" } },
          ]} />
        </span>
      </div>
      {editing ? (
        <div className="ed-compose" onClick={(e) => e.stopPropagation()}>
          <textarea className="ed-input" rows={2} value={text} autoFocus onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void save(); } if (e.key === "Escape") setEditing(false); }} />
          <div className="ed-compose-f">
            <button type="button" className="ed-btn ed-btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            <button type="button" className="ed-btn ed-btn-sm ed-btn-primary" disabled={!text.trim()} onClick={() => void save()}>Save</button>
          </div>
        </div>
      ) : <p className="ed-comment-body">{c.body}</p>}
    </div>
  );
}

function ReplyBox({ deckId, root, onDone, onError }: { deckId: string; root: Comment; onDone: (c: Comment | null) => void; onError: (m: string) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const post = async () => {
    if (!text.trim() || busy) return;
    setBusy(true);
    const r = await addCommentAction(deckId, { slideId: root.slideId, body: text, parentId: root.id });
    setBusy(false);
    if (r.error || !r.comment) { onError(r.error ?? "Couldn't post the reply."); return; }
    onDone(r.comment);
  };
  return (
    <div className="ed-compose ed-reply" onClick={(e) => e.stopPropagation()}>
      <textarea className="ed-input" rows={2} placeholder="Reply…" value={text} autoFocus disabled={busy} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); void post(); } if (e.key === "Escape") onDone(null); }} />
      <div className="ed-compose-f">
        <button type="button" className="ed-btn ed-btn-sm" onClick={() => onDone(null)}>Cancel</button>
        <button type="button" className="ed-btn ed-btn-sm ed-btn-primary" disabled={!text.trim() || busy} onClick={() => void post()}>{busy ? "Posting…" : "Reply"}</button>
      </div>
    </div>
  );
}

/* ================= Overlay on the slide (canvas) ================= */

const CLICK_PX = 4; // a drag shorter than this is a click: a point, not an area

/**
 * Sits over the slide. Shows numbered pins and, for the active thread, its area; in pin mode it takes the
 * pointer: click → point, drag → area (fractions of the slide), then hands the anchor back.
 */
export function CommentOverlay({ slideId, state, onState, onPlaced }: {
  slideId: string; state: CommentsState; onState: (p: Partial<CommentsState>) => void;
  /** A pin was placed: the editor focuses the composer. */
  onPlaced: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const threads = threadsFor(state.comments, slideId).filter((t) => t.root.anchor && (!t.root.resolvedAt || state.activeId === t.root.id));
  const frac = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)), px: e.clientX, py: e.clientY };
  };
  const down = (e: React.PointerEvent) => {
    if (!state.pinMode || e.button !== 0) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = frac(e);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const move = (e: React.PointerEvent) => { if (drag) { const p = frac(e); setDrag({ ...drag, x1: p.x, y1: p.y }); } };
  const up = (e: React.PointerEvent) => {
    if (!drag) return;
    const r = box.current!.getBoundingClientRect();
    const d = drag; setDrag(null);
    const dx = Math.abs(d.x1 - d.x0) * r.width, dy = Math.abs(d.y1 - d.y0) * r.height;
    const anchor: CommentAnchor = dx < CLICK_PX && dy < CLICK_PX
      ? { x: d.x0, y: d.y0 }
      : { x: Math.min(d.x0, d.x1), y: Math.min(d.y0, d.y1), w: Math.abs(d.x1 - d.x0), h: Math.abs(d.y1 - d.y0) };
    onState({ draftAnchor: anchor, pinMode: false, activeId: null });
    onPlaced();
    void e;
  };
  const pct = (v: number) => `${v * 100}%`;
  const rect = (a: CommentAnchor) => ({ left: pct(a.x), top: pct(a.y), width: pct(a.w ?? 0), height: pct(a.h ?? 0) });
  const active = threads.find((t) => t.root.id === state.activeId);
  const newN = threadsFor(state.comments, slideId).filter((t) => t.n).length + 1;
  return (
    <div ref={box} className={`ed-pins${state.pinMode ? " pinning" : ""}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDrag(null)}>
      {active?.root.anchor?.w && <div className="ed-area on" style={rect(active.root.anchor)} />}
      {state.draftAnchor?.w && <div className="ed-area new" style={rect(state.draftAnchor)} />}
      {drag && <div className="ed-area drawing" style={rect({ x: Math.min(drag.x0, drag.x1), y: Math.min(drag.y0, drag.y1), w: Math.abs(drag.x1 - drag.x0), h: Math.abs(drag.y1 - drag.y0) })} />}
      {threads.map((t) => {
        const a = t.root.anchor!;
        return (
          <button key={t.root.id} type="button" className={`ed-pin ed-pin-slide${state.activeId === t.root.id ? " on" : ""}${t.root.resolvedAt ? " resolved" : ""}`}
            style={{ left: pct(a.x), top: pct(a.y) }} title={`${t.root.authorName}: ${t.root.body.slice(0, 80)}`}
            onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onState({ activeId: state.activeId === t.root.id ? null : t.root.id, pinMode: false }); }}>
            {t.n}
          </button>
        );
      })}
      {state.draftAnchor && <span className="ed-pin ed-pin-slide ed-pin-new" style={{ left: pct(state.draftAnchor.x), top: pct(state.draftAnchor.y) }} aria-hidden>{newN}</span>}
    </div>
  );
}
