"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** Scales a 1920×1080 slide to the width of its container (fixed 16:9, no reflow). */
export function ScaledSlide({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 1920);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden" }}>
        {children}
      </div>
    </div>
  );
}
