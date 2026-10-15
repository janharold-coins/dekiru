"use client";
import { useActionState } from "react";
import { createThemeAction } from "./actions";

/** Start a theme from an existing one's live look. */
export function NewTheme({ themes }: { themes: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createThemeAction, {});
  return (
    <form action={action} className="new-theme">
      <label className="picker-title"><span>New theme</span><input name="name" placeholder="e.g. Coins.ph Light" maxLength={60} required /></label>
      <label className="picker-title">
        <span>starting from</span>
        <select name="from" defaultValue={themes[0]?.id}>{themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
      </label>
      <button className="btn primary" disabled={pending}>{pending ? "Creating…" : "Create"}</button>
      {state.error && <span className="hint warn">{state.error}</span>}
    </form>
  );
}
