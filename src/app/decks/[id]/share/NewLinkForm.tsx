"use client";
import { useActionState, useState } from "react";
import { createLinkAction, type CreateState } from "./actions";

export function NewLinkForm({ deckId, origin }: { deckId: string; origin: string }) {
  const [state, action, pending] = useActionState(createLinkAction.bind(null, deckId), {} as CreateState);
  const [mode, setMode] = useState<"generate" | "custom" | "none">("generate");
  const url = state.ok ? `${origin}/s/${state.ok.slug}` : "";
  const message = state.ok
    ? `${url}${state.ok.password ? `\nPassword: ${state.ok.password}` : ""}`
    : "";

  return (
    <div className="share-new">
      <form action={action} className="share-form">
        <label>
          <span>Who is it for?</span>
          <input name="label" placeholder="e.g. Acme Remit — Maria" maxLength={80} />
        </label>
        <fieldset>
          <legend>Password</legend>
          <label className="opt"><input type="radio" name="passwordMode" value="generate" checked={mode === "generate"} onChange={() => setMode("generate")} /> Generate one</label>
          <label className="opt"><input type="radio" name="passwordMode" value="custom" checked={mode === "custom"} onChange={() => setMode("custom")} /> Set my own</label>
          <label className="opt"><input type="radio" name="passwordMode" value="none" checked={mode === "none"} onChange={() => setMode("none")} /> No password</label>
          {mode === "custom" && <input name="customPassword" type="text" minLength={6} required placeholder="At least 6 characters" autoComplete="off" />}
          {mode === "none" && <p className="hint warn">Anyone with the link can open it. The deck is marked confidential.</p>}
        </fieldset>
        <label>
          <span>Expires</span>
          <select name="expires" defaultValue="30">
            <option value="7">In 7 days</option>
            <option value="30">In 30 days</option>
            <option value="90">In 90 days</option>
            <option value="0">Never</option>
          </select>
        </label>
        <button className="btn primary" disabled={pending}>{pending ? "Creating…" : "Create link"}</button>
        {state.error && <p className="hint warn" role="alert">{state.error}</p>}
      </form>

      {state.ok && (
        <div className="share-result" role="status">
          <b>Link ready{state.ok.label ? ` for ${state.ok.label}` : ""}</b> <span className="mono">v{state.ok.versionNumber}, frozen</span>
          <code>{url}</code>
          {state.ok.password && (
            <>
              <code>Password: {state.ok.password}</code>
              <p className="hint">Copy the password now. It isn&apos;t shown again; if it&apos;s lost, make a new link.</p>
            </>
          )}
          <div className="row">
            <CopyButton text={message} label={state.ok.password ? "Copy link + password" : "Copy link"} />
            <a className="btn" href={url} target="_blank" rel="noreferrer">Open</a>
          </div>
        </div>
      )}
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn" onClick={async () => {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    }}>{done ? "Copied" : label}</button>
  );
}
