"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

const clamp = (v: number) => Math.round(Math.max(0, Math.min(100, v)) * 10) / 10;

/** Where a placed element's centre sits, in % of its frame. */
function centreOf(el: HTMLElement) {
  const frame = el.closest<HTMLElement>("[data-dk-place-frame]");
  if (!frame) return null;
  const r = frame.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  return { frame, x: clamp(((b.left + b.width / 2 - r.left) / r.width) * 100), y: clamp(((b.top + b.height / 2 - r.top) / r.height) * 100) };
}

/**
 * Drag to place, on the editor canvas. A pattern marks what can be placed with data-dk-place="<list>.<index>"
 * (e.g. "callouts.2") inside an element marked data-dk-place-frame (e.g. the screenshot). Drag one and its x / y
 * are written back in % of the frame, to 0.1%, so the marker stays on its spot at any image size. Click one to
 * select it: arrow keys nudge it 0.1% (Shift: 1%), Esc lets go. Zoom the canvas in for finer placing.
 */
export function PlaceLayer({ onPlace, children }: { onPlace?: (path: string, x: number, y: number) => void; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<{ path: string; frame: HTMLElement; dx: number; dy: number } | null>(null);
  const [active, setActive] = useState<{ path: string; x: number; y: number } | null>(null);
  const enabled = Boolean(onPlace);

  const find = (path: string) => root.current?.querySelector<HTMLElement>(`[data-dk-place="${path}"]`) ?? null;

  const down = (e: React.PointerEvent) => {
    if (!enabled) return;
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-dk-place]");
    if (!el || !root.current?.contains(el)) { setActive(null); return; }
    const at = centreOf(el);
    if (!at) return;
    e.preventDefault();
    e.stopPropagation();
    const b = el.getBoundingClientRect();
    // Keep the grab point under the pointer, so the marker doesn't jump to it.
    drag.current = { path: el.dataset.dkPlace!, frame: at.frame, dx: e.clientX - (b.left + b.width / 2), dy: e.clientY - (b.top + b.height / 2) };
    root.current.setPointerCapture(e.pointerId);
    setActive({ path: el.dataset.dkPlace!, x: at.x, y: at.y });
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !onPlace) return;
    const r = d.frame.getBoundingClientRect();
    const x = clamp(((e.clientX - d.dx - r.left) / r.width) * 100);
    const y = clamp(((e.clientY - d.dy - r.top) / r.height) * 100);
    setActive({ path: d.path, x, y });
    onPlace(d.path, x, y);
  };
  const up = () => { drag.current = null; };

  useEffect(() => {
    if (!active || !onPlace) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (e.key === "Escape") { setActive(null); return; }
      const step = e.shiftKey ? 1 : 0.1;
      const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (!d) return;
      const el = find(active.path);
      const at = el && centreOf(el);
      if (!at) return;
      e.preventDefault();
      const x = clamp(at.x + d[0]);
      const y = clamp(at.y + d[1]);
      setActive({ path: active.path, x, y });
      onPlace(active.path, x, y);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onPlace]);

  // Leaving edit mode hides the selection (a slide change remounts this layer).
  const shown = enabled ? active : null;
  const n = shown ? Number(shown.path.split(".").pop()) + 1 : 0;
  return (
    <div ref={root} className={enabled ? "dk-placing" : undefined} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} style={{ position: "relative", width: "100%", height: "100%" }}>
      {enabled && (
        <style>{`.dk-placing [data-dk-place]{cursor:grab}.dk-placing [data-dk-place]:active{cursor:grabbing}${shown ? `.dk-placing [data-dk-place="${shown.path}"]{outline:6px solid #2066ed;outline-offset:6px;border-radius:50%}` : ""}`}</style>
      )}
      {children}
      {shown && (
        <div data-dk-place-readout="" style={{ position: "absolute", left: 24, top: 24, padding: "10px 18px", borderRadius: 12, background: "rgba(23,25,29,0.88)", color: "#fff", font: "500 26px/1.3 system-ui, sans-serif", pointerEvents: "none" }}>
          Marker {n} · x {shown.x.toFixed(1)}% · y {shown.y.toFixed(1)}% · arrows nudge, Shift ×10, Esc done
        </div>
      )}
    </div>
  );
}
