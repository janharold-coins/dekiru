"use client";
import { useActionState } from "react";
import { copyAction, publishAction } from "./actions";

export function PublishBar({ deckId }: { deckId: string }) {
  const [state, action, pending] = useActionState(publishAction.bind(null, deckId), {});
  return (
    <div className="draftbar" role="status">
      <span><b>Unpublished changes.</b> You&apos;re seeing the draft. Others, share links and presentations still use the published version.</span>
      <span className="spacer" />
      {state.error && <span className="hint warn">{state.error}</span>}
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
