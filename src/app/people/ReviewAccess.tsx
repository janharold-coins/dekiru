"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { setReviewScopesAction } from "./actions";

type ScopeOption = { scope: string; label: string; group: "content" | "translation" };

/** "Can review" on the People page: a modal with what this person may approve. Admins review everything. */
export function ReviewAccess({ userId, scopes, admin, options }: { userId: string; scopes: string[]; admin: boolean; options: ScopeOption[] }) {
  const [open, setOpen] = useState(false);
  const [chosen, setChosen] = useState<string[]>(scopes);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);

  const summary = admin ? "Everything (admin)"
    : scopes.length === 0 ? "Nothing"
    : options.filter((o) => scopes.includes(o.scope)).map((o) => o.group === "translation" ? o.label.split(" (")[0] : o.label.split(" ")[0]).join(", ");
  const toggle = (scope: string) => setChosen((c) => (c.includes(scope) ? c.filter((x) => x !== scope) : [...c, scope]));
  const save = () => start(async () => {
    const r = await setReviewScopesAction(userId, chosen);
    if (r.error) setError(r.error); else { setError(null); setOpen(false); }
  });
  const content = options.filter((o) => o.group === "content");
  const langs = options.filter((o) => o.group === "translation");
  return (
    <div className="role-form">
      <span className="review-summary">{summary}</span>
      {!admin && <button type="button" className="btn btn-sm" onClick={() => { setChosen(scopes); setOpen(true); }}>Edit</button>}
      {open && (
        <dialog ref={ref} className="ed-dialog" aria-labelledby={`review-${userId}`}
          onCancel={(e) => { e.preventDefault(); setOpen(false); }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="ed-dialog-body">
            <h2 id={`review-${userId}`}>Can review</h2>
            <p>What this person may approve. Employee decks need one approval; company-wide decks and translations need two.</p>
            <div className="review-scopes">
              {content.map((o) => (
                <label key={o.scope} className="check"><input type="checkbox" checked={chosen.includes(o.scope)} onChange={() => toggle(o.scope)} /><span>{o.label}</span></label>
              ))}
              <div className="review-scopes-group">
                <span className="review-scopes-h">Translated decks</span>
                {langs.map((o) => (
                  <label key={o.scope} className="check"><input type="checkbox" checked={chosen.includes(o.scope)} onChange={() => toggle(o.scope)} /><span>{o.label}</span></label>
                ))}
              </div>
            </div>
            {error && <p className="hint warn">{error}</p>}
          </div>
          <div className="ed-dialog-actions">
            <button type="button" className="ed-btn" onClick={() => setOpen(false)}>Cancel</button>
            <button type="button" className="ed-btn ed-btn-primary" onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</button>
          </div>
        </dialog>
      )}
    </div>
  );
}
