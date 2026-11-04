"use client";
import { useActionState, useState, useTransition } from "react";
import { ConfirmDialog } from "../decks/[id]/edit/Menu";
import { addDepartmentAction, deleteDepartmentAction, renameDepartmentAction, setDepartmentAction } from "./actions";

type Department = { id: string; name: string };

/**
 * A person's department on the People page. Changing the select saves straight away. The select is controlled:
 * React resets uncontrolled form fields once an action finishes, which would snap it back to the old value.
 */
export function DepartmentSelect({ userId, departmentId, departments }: { userId: string; departmentId: string | null; departments: Department[] }) {
  const [value, setValue] = useState(departmentId ?? "");
  const [state, action, pending] = useActionState(async (prev: { error?: string }, form: FormData) => {
    const r = await setDepartmentAction(prev, form);
    if (r.error) setValue(departmentId ?? "");
    return r;
  }, {});
  return (
    <form action={action} className="role-form">
      <input type="hidden" name="userId" value={userId} />
      <select name="departmentId" value={value} disabled={pending} aria-label="Department"
        onChange={(e) => { setValue(e.target.value); e.currentTarget.form?.requestSubmit(); }}>
        <option value="">—</option>
        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>
      {pending && <span className="mono">Saving…</span>}
      {state.error && <span className="hint warn">{state.error}</span>}
    </form>
  );
}

/**
 * The department list, above the People table. The same names are the tags decks can carry, so renaming one
 * renames it everywhere and removing one takes it off people and decks.
 */
export function DepartmentList({ departments, usage }: { departments: Department[]; usage: Record<string, { people: number; decks: number }> }) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [removing, setRemoving] = useState<Department | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<{ error?: string }>, done?: () => void) => start(async () => {
    const r = await fn();
    if (r.error) setError(r.error); else { setError(null); done?.(); }
  });
  const add = () => { if (name.trim()) act(() => addDepartmentAction(name), () => setName("")); };
  const rename = (d: Department) => {
    setEditing(null);
    if (draft.trim() && draft.trim() !== d.name) act(() => renameDepartmentAction(d.id, draft));
  };
  const used = (d: Department) => {
    const u = usage[d.id] ?? { people: 0, decks: 0 };
    return [u.people && `${u.people} ${u.people === 1 ? "person" : "people"}`, u.decks && `${u.decks} ${u.decks === 1 ? "deck" : "decks"}`].filter(Boolean).join(" and ");
  };
  return (
    <section className="departments" aria-labelledby="departments-h">
      <h2 id="departments-h">Departments</h2>
      <p className="departments-note">Each person belongs to one. Decks are tagged with the same names, so people can find the decks for their team.</p>
      <ul className="departments-list">
        {departments.map((d) => (
          <li key={d.id} className="dept-chip">
            {editing === d.id ? (
              <input className="dept-input" value={draft} autoFocus maxLength={40} aria-label={`Rename ${d.name}`}
                onChange={(e) => setDraft(e.target.value)} onBlur={() => rename(d)}
                onKeyDown={(e) => { if (e.key === "Enter") rename(d); if (e.key === "Escape") setEditing(null); }} />
            ) : (
              <button type="button" className="dept-name" title="Rename" onClick={() => { setDraft(d.name); setEditing(d.id); }}>{d.name}</button>
            )}
            <button type="button" className="dept-remove" aria-label={`Remove ${d.name}`} title="Remove" disabled={pending} onClick={() => setRemoving(d)}>×</button>
          </li>
        ))}
        <li>
          <form className="dept-add" onSubmit={(e) => { e.preventDefault(); add(); }}>
            <input className="dept-input" value={name} maxLength={40} placeholder="Add a department" aria-label="New department name" onChange={(e) => setName(e.target.value)} />
            <button type="submit" className="btn btn-sm" disabled={pending || !name.trim()}>Add</button>
          </form>
        </li>
      </ul>
      {error && <p className="hint warn">{error}</p>}
      {removing && (
        <ConfirmDialog title={`Remove ${removing.name}?`} action="Remove" danger
          body={used(removing) ? `It's used by ${used(removing)}. They'll lose this department or tag.` : "Nobody uses it yet."}
          onCancel={() => setRemoving(null)}
          onConfirm={() => { const d = removing; setRemoving(null); act(() => deleteDepartmentAction(d.id)); }} />
      )}
    </section>
  );
}
