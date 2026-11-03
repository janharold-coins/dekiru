"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "../../decks/[id]/edit/Menu";
import { deleteThemeAction } from "./actions";

/**
 * Delete a theme (it leaves every picker; its history stays so old share links keep their look).
 * Disabled, with the reason, while decks use it. `after` is where to go once it's gone.
 */
export function DeleteTheme({ id, name, usedBy, after, className = "btn" }: {
  id: string; name: string; usedBy: number; after?: string; className?: string;
}) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const blocked = usedBy > 0 ? `${usedBy} deck${usedBy === 1 ? " uses" : "s use"} this theme. Switch ${usedBy === 1 ? "it" : "them"} to another theme first.` : null;
  const run = () => start(async () => {
    setError(null);
    const r = await deleteThemeAction(id);
    if (r.error) { setError(r.error); return; }
    if (after) router.push(after); else router.refresh();
  });
  return (
    <span className="theme-delete">
      <button type="button" className={`${className} danger-ghost`} disabled={pending || Boolean(blocked)}
        title={blocked ?? `Delete ${name}`} aria-describedby={blocked ? `theme-del-${id}` : undefined} onClick={() => setAsking(true)}>
        {pending ? "Deleting…" : "Delete"}
      </button>
      {blocked && <span id={`theme-del-${id}`} className="sr-only">{blocked}</span>}
      {error && <span className="hint warn" role="alert">{error}</span>}
      {asking && (
        <ConfirmDialog danger title={`Delete “${name}”?`} action="Delete theme"
          body="It disappears from every theme picker. Share links already sent keep their look. You can't undo this here."
          onCancel={() => setAsking(false)} onConfirm={() => { setAsking(false); run(); }} />
      )}
    </span>
  );
}
