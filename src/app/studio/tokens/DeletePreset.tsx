"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "../../decks/[id]/edit/Menu";
import { deletePresetAction } from "./actions";

/**
 * Delete a design token set (it leaves every picker; its history stays so old share links keep their look).
 * Disabled, with the reason, while decks use it. `after` is where to go once it's gone.
 */
export function DeletePreset({ id, name, usedBy, after, className = "btn" }: {
  id: string; name: string; usedBy: number; after?: string; className?: string;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const blocked = usedBy > 0 ? `${usedBy} deck${usedBy === 1 ? " uses" : "s use"} this set. Switch ${usedBy === 1 ? "it" : "them"} first.` : null;
  const run = () => start(async () => {
    setError(null);
    const r = await deletePresetAction(id);
    if (r.error) { setError(r.error); return; }
    if (after) router.push(after); else router.refresh();
  });
  return (
    <span className="theme-delete">
      <button type="button" className={`${className} danger-ghost`} disabled={pending || Boolean(blocked)}
        title={blocked ?? `Delete ${name}`} aria-describedby={blocked ? `preset-del-${id}` : undefined} onClick={() => setAsking(true)}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {blocked && <span id={`preset-del-${id}`} className="sr-only">{blocked}</span>}
      {error && <span className="hint warn" role="alert">{error}</span>}
      {asking && (
        <ConfirmDialog danger title={`Delete “${name}”?`} action="Delete set"
          body="It disappears from every deck's Theme page. Share links already sent keep their look. You can't undo this here."
          onCancel={() => setAsking(false)} onConfirm={() => { setAsking(false); run(); }} />
      )}
    </span>
  );
}
