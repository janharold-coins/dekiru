"use client";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { Presenter } from "../../decks/[id]/present/Presenter";

const BEAT_MS = 15_000;

/**
 * The public presenter plus view tracking: counts time only while the tab is visible,
 * reports it per slide on every slide change, every 15 s, and when the tab is hidden or closed.
 */
export function TrackedPresenter({ slug, slides, slideIds }: { slug: string; slides: ReactNode[]; slideIds: string[] }) {
  const url = `/s/${slug}/track`;
  const sid = useRef<string | null>(null);
  const current = useRef(0);
  const since = useRef<number | null>(null); // when visible time started counting for the current slide

  const flush = useCallback((beacon = false) => {
    if (!sid.current || since.current === null) return;
    const ms = Date.now() - since.current;
    since.current = document.visibilityState === "visible" ? Date.now() : null;
    if (ms < 250) return;
    const body = JSON.stringify({ sid: sid.current, slide: slideIds[current.current], ms });
    if (beacon && navigator.sendBeacon) navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    else fetch(url, { method: "POST", body, keepalive: true }).catch(() => {});
  }, [slideIds, url]);

  useEffect(() => {
    let alive = true;
    fetch(url, { method: "POST", body: "{}" })
      .then((r) => (r.ok ? r.json() : null))
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
  }, [flush, url]);

  const onSlide = useCallback((i: number) => {
    if (i === current.current) return;
    flush();
    current.current = i;
  }, [flush]);

  return <Presenter slides={slides} onSlide={onSlide} />;
}
