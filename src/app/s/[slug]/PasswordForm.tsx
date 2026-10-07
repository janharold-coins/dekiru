"use client";
import { useActionState } from "react";
import { unlockAction } from "./actions";

export function PasswordForm({ slug }: { slug: string }) {
  const [state, action, pending] = useActionState(unlockAction.bind(null, slug), {});
  return (
    <form action={action} className="share-form bare">
      <label>
        <span>Password</span>
        <input name="password" type="password" required autoFocus autoComplete="off" />
      </label>
      {state.error && <p className="signin-error" role="alert">{state.error}</p>}
      <button className="btn primary signin" disabled={pending}>{pending ? "Checking…" : "Open deck"}</button>
    </form>
  );
}
