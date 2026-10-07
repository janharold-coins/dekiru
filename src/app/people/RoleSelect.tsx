"use client";
import { useActionState } from "react";
import { setRoleAction } from "./actions";

/** Changing the select saves straight away. */
export function RoleSelect({ userId, role, roles, disabled }: { userId: string; role: string; roles: readonly string[]; disabled?: boolean }) {
  const [state, action, pending] = useActionState(setRoleAction, {});
  return (
    <form action={action} className="role-form">
      <input type="hidden" name="userId" value={userId} />
      <select name="role" defaultValue={role} disabled={disabled || pending} onChange={(e) => e.currentTarget.form?.requestSubmit()} aria-label="Role">
        {roles.map((r) => <option key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</option>)}
      </select>
      {pending && <span className="mono">Saving…</span>}
      {state.error && <span className="hint warn">{state.error}</span>}
    </form>
  );
}
