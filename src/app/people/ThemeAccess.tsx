"use client";
import { useActionState } from "react";
import { setThemeAccessAction } from "./actions";

/** "Can edit themes" switch. Admins always can, so theirs is shown on and locked. */
export function ThemeAccess({ userId, allowed, admin }: { userId: string; allowed: boolean; admin: boolean }) {
  const [state, action, pending] = useActionState(setThemeAccessAction, {});
  return (
    <form action={action} className="role-form">
      <input type="hidden" name="userId" value={userId} />
      <label className="check">
        <input type="checkbox" name="allowed" defaultChecked={admin || allowed} disabled={admin || pending}
          onChange={(e) => e.currentTarget.form?.requestSubmit()} />
        <span>{admin ? "Yes (admin)" : "Can edit themes"}</span>
      </label>
      {pending && <span className="mono">Saving…</span>}
      {state.error && <span className="hint warn">{state.error}</span>}
    </form>
  );
}
