"use client";
import { useState, useTransition } from "react";
import { restoreAction } from "./actions";

/** Puts an old version back as the draft (version history). */
export function RestoreButton({ deckId, number }: { deckId: string; number: number }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button className="linkish" disabled={pending} onClick={() => start(async () => { const r = await restoreAction(deckId, number); if (r?.error) setError(r.error); })}>
        {pending ? "Restoring…" : "Restore"}
      </button>
      {error && <span className="hint warn"> {error}</span>}
    </>
  );
}
