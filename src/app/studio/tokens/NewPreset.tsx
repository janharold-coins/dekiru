"use client";
import { useActionState } from "react";
import type { PresetKind } from "@/deck/presets";
import { createPresetAction } from "./actions";

/** Start a design token set of one kind. It begins as the approved look and opens in the editor. */
export function NewPreset({ kind, label, placeholder }: { kind: PresetKind; label: string; placeholder: string }) {
  const [state, action, pending] = useActionState(createPresetAction, {});
  return (
    <form action={action} className="new-theme">
      <input type="hidden" name="kind" value={kind} />
      <label className="picker-title"><span>{label}</span><input name="name" placeholder={placeholder} maxLength={60} required /></label>
      <button className="btn primary" disabled={pending}>{pending ? "Creating…" : "Create"}</button>
      {state.error && <span className="hint warn">{state.error}</span>}
    </form>
  );
}
