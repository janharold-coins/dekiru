"use client";
import Link from "next/link";
import { useActionState, useRef, useTransition } from "react";
import { decideAction, dismissAction, requestAction, type Result } from "./actions";

/** "Ask for something new": a layout or a theme, in your own words. */
export function RequestForm({ kind = "layout" }: { kind?: "layout" | "theme" | "rule" }) {
  const [state, action, pending] = useActionState(async (prev: Result, form: FormData) => {
    const r = await requestAction(prev, form);
    if (r.ok) ref.current?.reset();
    return r;
  }, {});
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={action} className="studio-ask card">
      <div className="studio-ask-head">
        <span className="studio-ask-title">
          <b>Ask for something new</b>
          <Link href="/studio/rules" className="studio-rules-link">Studio rules →</Link>
        </span>
        <span className="studio-kind">
          <label><input type="radio" name="kind" value="layout" defaultChecked={kind === "layout"} /> Slide layout</label>
          <label><input type="radio" name="kind" value="theme" defaultChecked={kind === "theme"} /> Theme</label>
          <label><input type="radio" name="kind" value="rule" defaultChecked={kind === "rule"} /> Rule change</label>
        </span>
      </div>
      <textarea name="prompt" rows={3} required maxLength={4000}
        placeholder="e.g. A comparison slide: Coins.ph vs. two alternatives, five rows, our column highlighted." />
      <div className="studio-ask-foot">
        <span className={`hint${state.error ? " warn" : ""}`}>{state.error ?? state.ok ?? "Layouts and themes come back here as proposals to approve; rule changes go into the Studio rules."}</span>
        <button className="btn primary" disabled={pending}>{pending ? "Sending…" : "Send request"}</button>
      </div>
    </form>
  );
}

export function DismissRequest({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return <button className="btn" disabled={pending} onClick={() => start(() => dismissAction(id))}>{pending ? "…" : "Dismiss"}</button>;
}

/** Approve, request changes or reject the proposal's current revision. */
export function DecisionForm({ id, revision }: { id: string; revision: number }) {
  const [state, action, pending] = useActionState(decideAction.bind(null, id), {});
  return (
    <form action={action} className="studio-decide card">
      <b>Your decision on revision {revision}</b>
      <textarea name="note" rows={3} maxLength={2000} placeholder="Note for Claude (needed when asking for changes): what to move, resize, recolour…" />
      <div className="studio-decide-buttons">
        <button className="btn primary" name="decision" value="approved" disabled={pending}>Approve</button>
        <button className="btn" name="decision" value="changes_requested" disabled={pending}>Request changes</button>
        <button className="btn danger" name="decision" value="rejected" disabled={pending}>Reject</button>
      </div>
      {(state.error || state.ok) && <p className={`hint${state.error ? " warn" : ""}`}>{state.error ?? state.ok}</p>}
    </form>
  );
}
