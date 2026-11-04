"use client";
import { useActionState } from "react";
import { decideSourceAction, type Result } from "./actions";

/** The buttons on one source row: make canonical, retire, or restore as a candidate, with an optional note. */
export function SourceDecision({ component, source, status, canSave }: { component: string; source: string; status: "canonical" | "candidate" | "retired"; canSave: boolean }) {
  const [state, action, pending] = useActionState<Result, FormData>(decideSourceAction, {});
  if (!canSave) return <span className="muted">read-only</span>;
  return (
    <form action={action} style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <input type="hidden" name="component" value={component} />
      <input type="hidden" name="source" value={source} />
      <input name="note" placeholder="note (optional)" style={{ font: "inherit", fontSize: 13, padding: "4px 8px", border: "1px solid var(--line)", borderRadius: 6, width: 160 }} />
      {status !== "canonical" && <button className="btn primary" name="status" value="canonical" disabled={pending}>Make canonical</button>}
      {status !== "retired" && <button className="btn" name="status" value="retired" disabled={pending}>Retire</button>}
      {status === "retired" && <button className="btn" name="status" value="candidate" disabled={pending}>Restore</button>}
      {state.error && <span style={{ color: "var(--warn)", fontSize: 13 }}>{state.error}</span>}
      {state.ok && <span className="muted" style={{ fontSize: 13 }}>{state.ok}</span>}
    </form>
  );
}
