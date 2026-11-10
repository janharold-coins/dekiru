"use client";
import { useActionState } from "react";
import { setStudioAccessAction, setThemeAccessAction } from "./actions";

/** "Can edit themes" switch. Admins always can, so theirs is shown on and locked. */
export function ThemeAccess(p: { userId: string; allowed: boolean; admin: boolean }) {
  return <AccessSwitch {...p} label="Can edit themes" act={setThemeAccessAction} />;
}

/** "Studio reviewer" switch: approve requests and decide on builds (everyone can request). Admins always are. */
export function StudioAccess(p: { userId: string; allowed: boolean; admin: boolean }) {
  return <AccessSwitch {...p} label="Studio reviewer" act={setStudioAccessAction} />;
}

function AccessSwitch({ userId, allowed, admin, label, act }: {
  userId: string; allowed: boolean; admin: boolean; label: string;
  act: (prev: { error?: string }, form: FormData) => Promise<{ error?: string }>;
}) {
  const [state, action, pending] = useActionState(act, {});
  return (
    <form action={action} className="role-form">
      <input type="hidden" name="userId" value={userId} />
      <label className="check">
        <input type="checkbox" name="allowed" defaultChecked={admin || allowed} disabled={admin || pending}
          onChange={(e) => e.currentTarget.form?.requestSubmit()} />
        <span>{admin ? "Yes (admin)" : label}</span>
      </label>
      {pending && <span className="mono">Saving…</span>}
      {state.error && <span className="hint warn">{state.error}</span>}
    </form>
  );
}
