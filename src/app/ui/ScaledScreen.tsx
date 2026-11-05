"use client";
import { useLayoutEffect, useRef, useState } from "react";

/**
 * A screen's live render (its /frame route) scaled to the card's width, like a deck cover scales its slide.
 * The iframe is the device: fonts and widths are the screen's own, and the card only shows the first screen-height.
 */
export function ScaledScreen({ id, width, height }: { id: string; width: number; height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <div ref={ref} style={{ position: "relative", width: "100%", aspectRatio: `${width} / ${height}`, overflow: "hidden", background: "#fff" }}>
      <iframe title="" tabIndex={-1} src={`/ui/${id}/frame`} width={width} height={height} scrolling="no"
        style={{ position: "absolute", left: 0, top: 0, border: 0, transformOrigin: "0 0", transform: `scale(${scale})`, visibility: scale ? "visible" : "hidden", pointerEvents: "none" }} />
    </div>
  );
}
