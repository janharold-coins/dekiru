"use client";
import { useState } from "react";

export function ConsentButtons({ consentCode }: { consentCode: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function answer(accept: boolean) {
    setBusy(true);
    setError(null);
    const r = await fetch("/api/auth/oauth2/consent", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accept, consent_code: consentCode }),
    });
    const d = await r.json().catch(() => null);
    if (r.ok && d?.redirectURI) { window.location.assign(d.redirectURI); return; }
    setBusy(false);
    setError(d?.message ?? "That didn't work. Start the connection again from Claude.");
  }
  return (
    <>
      {error && <p className="signin-error" role="alert">{error}</p>}
      <div className="row" style={{ marginTop: 6 }}>
        <button className="btn primary" disabled={busy} onClick={() => answer(true)}>{busy ? "Connecting…" : "Allow"}</button>
        <button className="btn" disabled={busy} onClick={() => answer(false)}>Cancel</button>
      </div>
    </>
  );
}
