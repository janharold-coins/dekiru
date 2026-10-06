"use client";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { CageLayout } from "../types";

/**
 * Big title with the hairline "type cage" (section L1, CTA, closing).
 * Pass `layout` to reproduce Figma exactly; otherwise rules are derived from the
 * rendered lines: per line at +0.2167 / +0.6583 / +0.975 × font-size, a left rule
 * at the title edge and a right rule at the end of each line.
 */
export function TitleCage({
  text,
  left,
  top,
  fontSize,
  lineHeight = 1.15,
  textStyle,
  layout,
  bleedX,
  extend = 60,
  stroke = 1,
}: {
  text: string;
  left: number;
  top: number;
  fontSize: number;
  lineHeight?: number;
  textStyle: CSSProperties;
  layout?: CageLayout | null;
  bleedX: number;
  extend?: number;
  stroke?: number;
}) {
  const lines = text.split("\n");
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const [auto, setAuto] = useState<CageLayout | null>(null);

  useLayoutEffect(() => {
    if (layout) return;
    const measure = () => {
      const widths = refs.current.map((el) => (el ? el.offsetWidth : 0));
      const pitch = fontSize * lineHeight;
      const ys: number[] = [];
      widths.forEach((_, i) => {
        const base = top + i * pitch;
        ys.push(base + 0.2167 * fontSize, base + 0.6583 * fontSize, base + 0.975 * fontSize);
      });
      const maxRight = left + Math.max(...widths);
      setAuto({
        x: bleedX,
        width: maxRight + extend - bleedX,
        ys: ys.map(Math.round),
        stroke,
        vLeft: { x: left, top: top - 1, height: Math.round(pitch * lines.length + 2) },
        vRight: widths.map((w, i) => ({ x: Math.round(left + w), top: Math.round(top + i * pitch + 0.1 * fontSize), height: Math.round(pitch) })),
      });
    };
    measure();
    document.fonts?.ready.then(measure);
  }, [layout, text, left, top, fontSize, lineHeight, bleedX, extend, stroke, lines.length]);

  const cage = layout ?? auto;
  const rule = "rgba(255,255,255,0.3)";
  return (
    <>
      {cage && (
        <div aria-hidden>
          {cage.ys.map((y, i) => (
            <div key={`h${i}`} style={{ position: "absolute", left: cage.x, top: y - cage.stroke, width: cage.width, height: cage.stroke, background: rule }} />
          ))}
          {[cage.vLeft, ...(cage.vRight ?? [])].filter(Boolean).map((v, i) => (
            <div key={`v${i}`} style={{ position: "absolute", left: v!.x - cage.stroke, top: v!.top, width: cage.stroke, height: v!.height, background: rule }} />
          ))}
        </div>
      )}
      <div style={{ position: "absolute", left, top, margin: 0, ...textStyle, lineHeight, whiteSpace: "pre" }}>
        {lines.map((l, i) => (
          <span key={i} ref={(el) => { refs.current[i] = el; }} style={{ display: "block", width: "fit-content" }}>
            {l}
          </span>
        ))}
      </div>
    </>
  );
}
