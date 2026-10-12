"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Presenter } from "./Presenter";

const BEAT_MS = 15_000;

/**
 * Presenter plus view tracking: counts time only while the tab is visible and reports it per slide
 * on every slide change, every 15 s, and when the tab is hidden or closed.
 * Used by share links (/s/<slug>) and by the in-app Present button, which also offers "Presenting to…".
 */
export function TrackedPresenter({ trackUrl, slides, slideIds, askAudience = false }: {
  trackUrl: string; slides: ReactNode[]; slideIds: string[]; askAudience?: boolean;
}) {
  const sid = useRef<string | null>(null);
  const current = useRef(0);
  const since = useRef<number | null>(null); // when visible time started counting for the current slide

  const flush = useCallback((beacon = false) => {
    if (!sid.current || since.current === null) return;
    const ms = Date.now() - since.current;
    since.current = document.visibilityState === "visible" ? Date.now() : null;
    if (ms < 250) return;
    const body = JSON.stringify({ sid: sid.current, slide: slideIds[current.current], ms });
    if (beacon && navigator.sendBeacon) navigator.sendBeacon(trackUrl, new Blob([body], { type: "application/json" }));
    else fetch(trackUrl, { method: "POST", body, keepalive: true }).catch(() => {});
  }, [slideIds, trackUrl]);

  useEffect(() => {
    let alive = true;
    fetch(trackUrl, { method: "POST", body: "{}" })
      .then((r) => (r.ok && r.status !== 204 ? r.json() : null))
      .then((d) => { if (alive && d?.sid) { sid.current = d.sid; since.current = document.visibilityState === "visible" ? Date.now() : null; } })
      .catch(() => {});
    const beat = setInterval(() => flush(), BEAT_MS);
    const onVis = () => {
      if (document.visibilityState === "hidden") flush(true);
      else if (since.current === null) since.current = Date.now();
    };
    const onHide = () => flush(true);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    return () => {
      alive = false;
      clearInterval(beat);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
      flush(true);
    };
  }, [flush, trackUrl]);

  const onSlide = useCallback((i: number) => {
    if (i === current.current) return;
    flush();
    current.current = i;
  }, [flush]);

  return <Presenter slides={slides} onSlide={onSlide} hudExtra={askAudience ? <Audience trackUrl={trackUrl} sid={sid} /> : undefined} />;
}

/** "Presenting to…" in the presenter's bottom bar. Optional; saved when you press Enter or click away. */
function Audience({ trackUrl, sid }: { trackUrl: string; sid: React.RefObject<string | null> }) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState("");
  const save = () => {
    if (!sid.current || value.trim() === saved) return;
    fetch(trackUrl, { method: "POST", body: JSON.stringify({ sid: sid.current, audience: value }) })
      .then((r) => { if (r.ok) setSaved(value.trim()); })
      .catch(() => {});
  };
  return (
    <label className="audience">
      <span>Presenting to</span>
      <input
        value={value}
        placeholder="e.g. Acme Remit (optional)"
        maxLength={120}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      />
      {saved && value.trim() === saved && <i aria-label="Saved">✓</i>}
    </label>
  );
}
