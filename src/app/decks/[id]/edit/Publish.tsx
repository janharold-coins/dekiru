"use client";
import { useEffect, useRef, useState } from "react";
import type { DraftChange, DraftChangeKind } from "@/lib/editing";
import { Menu } from "./Menu";

/** "Send for review" (freezes the draft as the version reviewers see — review v2) with a dropdown for the other thing you can do with a draft: throw it away. */
export function PublishSplit({ publishing, onPublish, onDiscard }: { publishing: boolean; onPublish: () => void; onDiscard: () => void }) {
  return (
    <div className="ed-split">
      <button type="button" className="ed-btn ed-btn-publish ed-split-main" onClick={onPublish} disabled={publishing}
        title="See what changed, then send it: the draft becomes the version reviewers see. You can keep editing afterwards.">
        <i aria-hidden />{publishing ? "Sending…" : "Send for review"}
      </button>
      <Menu className="ed-split-more" label="More options"
        // eslint-disable-next-line @next/next/no-img-element
        trigger={<img src="/editor/chevron-down.svg" alt="" width={16} height={16} />}
        items={[{
          label: "Discard unsent changes", danger: true, onSelect: onDiscard,
          confirm: { title: "Discard unsent changes?", body: "Every edit since the last version you sent will be lost and the deck goes back to that version. This can't be undone.", action: "Discard all changes" },
        }]} />
    </div>
  );
}

const LABEL: Record<DraftChangeKind, string> = {
  first: "First version", theme: "Theme", added: "Added", edited: "Edited", moved: "Moved", hidden: "Hidden", shown: "Shown", removed: "Removed",
};

/** Confirmation before sending for review: every difference between the draft and the last sent version. */
export function PublishDialog({ load, onConfirm, onCancel }: {
  load: () => Promise<{ error?: string; changes?: DraftChange[] }>; onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [changes, setChanges] = useState<DraftChange[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    let live = true;
    load().then((r) => { if (!live) return; if (r.error) setError(r.error); else setChanges(r.changes ?? []); })
      .catch((e: Error) => live && setError(e.message));
    return () => { live = false; };
  }, [load]);
  const count = changes?.length ?? 0;
  return (
    <dialog ref={ref} className="ed-dialog ed-publish-dialog" aria-labelledby="ed-publish-title"
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="ed-dialog-body">
        <h2 id="ed-publish-title">Send for review?</h2>
        <p>{changes === null && !error ? "Checking what changed…"
          : error ? null
          : count ? `${count} change${count === 1 ? "" : "s"} will be sent as a new version. Reviewers see only what you send; links already shared keep their version.`
          : "Nothing differs from the last version you sent. Sending makes a new version anyway."}</p>
        {error && <p className="signin-error" role="alert">{error}</p>}
        {count > 0 && (
          <ul className="ed-changes">
            {changes!.map((c, i) => (
              <li key={i}>
                <span className={`ed-change-tag ${c.kind}`}>{LABEL[c.kind]}</span>
                <span className="ed-change-text">
                  {c.slide && <b>{c.slide}</b>}
                  {c.detail && <span>{c.detail}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="ed-dialog-actions">
        <button type="button" className="ed-btn" onClick={onCancel} autoFocus>Cancel</button>
        <button type="button" className="ed-btn ed-btn-primary" onClick={onConfirm} disabled={changes === null && !error}>Send for review</button>
      </div>
    </dialog>
  );
}
