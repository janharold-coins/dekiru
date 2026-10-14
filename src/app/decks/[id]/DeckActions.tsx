"use client";
import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { copyAction, discardAction, publishAction, restoreAction } from "./actions";

/** Shown to editors while a deck has unpublished changes. */
export function DraftBar({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(publishAction.bind(null, deckId), {});
  const [confirm, setConfirm] = useState(false);
  const [discarding, start] = useTransition();
  return (
    <div className="draftbar" role="status">
      <span><b>Unpublished changes.</b> You&apos;re seeing the draft. Others, share links and presentations still use the published version.</span>
      <span className="spacer" />
      {state.error && <span className="hint warn">{state.error}</span>}
      {confirm ? (
        <button className="btn danger" disabled={discarding} onBlur={() => setConfirm(false)}
          onClick={() => start(async () => { await discardAction(deckId); setConfirm(false); router.refresh(); })}>
          {discarding ? "Discarding…" : "Discard all changes?"}
        </button>
      ) : (
        <button className="btn" onClick={() => setConfirm(true)}>Discard</button>
      )}
      <form action={action}><button className="btn primary" disabled={pending}>{pending ? "Publishing…" : "Publish"}</button></form>
    </div>
  );
}


export function CopyButton({ deckId }: { deckId: string }) {
  return (
    <form action={copyAction.bind(null, deckId)}>
      <button className="btn">Make a copy</button>
    </form>
  );
}

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
