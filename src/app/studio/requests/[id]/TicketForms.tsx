"use client";
import { useActionState, useState, useTransition } from "react";
import { answerAction, reviewTicketAction, withdrawAction, type Result } from "../../actions";

/** The requester's answer to Claude's suggestion: it works (closes the request), or a build is still needed. */
export function AnswerForm({ id, reviewer }: { id: string; reviewer: boolean }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<Result>({});
  const answer = (a: "works" | "still_need") => start(async () => setState(await answerAction(id, a)));
  return (
    <section className="card studio-box studio-ticket-act">
      <b>Does this cover what you need?</b>
      <div className="studio-decide-buttons">
        <button className="btn primary" disabled={pending} onClick={() => answer("works")}>That works</button>
        <button className="btn" disabled={pending} onClick={() => answer("still_need")}>Still need it</button>
      </div>
      <p className="hint">{reviewer ? "Still need it sends it straight to Claude to build." : "Still need it asks a reviewer to approve a new build."}</p>
      {(state.error || state.ok) && <p className={`hint${state.error ? " warn" : ""}`} role="status">{state.error ?? state.ok}</p>}
    </section>
  );
}

/** A reviewer's decision on a request: approve it for building, or reject it with a reason the requester reads. */
export function ReviewTicketForm({ id }: { id: string }) {
  const [reason, setReason] = useState("");
  const [state, action, pending] = useActionState((prev: Result, form: FormData) => reviewTicketAction(id, prev, form), {});
  return (
    <form action={action} className="card studio-box studio-ticket-act">
      <b>Your decision</b>
      <div className="studio-decide-buttons">
        <button className="btn primary" name="decision" value="approved" disabled={pending}>Approve build</button>
        <button className="btn danger" name="decision" value="rejected" disabled={pending || !reason.trim()}
          title={reason.trim() ? "Reject with this reason" : "Write a reason first"}>Reject</button>
      </div>
      <label htmlFor="ticket-reason" className="hint">Reason, to reject (the requester sees it)</label>
      <textarea id="ticket-reason" name="reason" rows={3} maxLength={2000} value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder="e.g. The Comparison template already does this; use it with three columns." />
      {(state.error || state.ok) && <p className={`hint${state.error ? " warn" : ""}`} role="status">{state.error ?? state.ok}</p>}
    </form>
  );
}

/** Withdraw: the ticket is kept as Withdrawn under Closed, visible to its author and admins. */
export function WithdrawButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<Result>({});
  return (
    <>
      <button className="studio-reject-text" disabled={pending}
        onClick={() => start(async () => setState(await withdrawAction(id)))}>{pending ? "Withdrawing…" : "Withdraw request"}</button>
      {state.error && <p className="hint warn" role="status">{state.error}</p>}
    </>
  );
}
