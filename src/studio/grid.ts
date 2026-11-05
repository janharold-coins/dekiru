import { createElement, type CSSProperties, type ReactNode } from "react";
import { noWrap, t } from "@/deck/tokens";

/** Studio layout helpers: the 8-point grid, the content band and the type scale (rules: STUDIO.md). */

/** n steps of the 8-point grid, in slide px. `g(3)` = 24; `g(0.5)` = 4, the half step for inside components only. */
export const g = (n: number) => n * 8;

/** Horizontal safe area: content runs from x 80 to x 1840. */
export const SAFE = { left: 80, right: 1840, width: 1760 } as const;

/** The content band between the logo (bottom 177) and the footer (top 938), on the grid. */
export const BAND = { top: 200, bottom: 912, height: 712 } as const;

export type TypeStep = "display" | "h1" | "h2" | "h3" | "lead" | "body" | "caption" | "micro";

/**
 * The type scale: size, line height (both slide px, line heights on the grid), tracking as a fraction of size,
 * and how lines wrap: headings balance their lines; running text wraps "pretty" (no orphan on the last line).
 */
export const TYPE: Record<TypeStep, { size: number; line: number; track: number; wrap: "balance" | "pretty" }> = {
  display: { size: 120, line: 136, track: -0.03, wrap: "balance" },
  h1: { size: 96, line: 112, track: -0.03, wrap: "balance" },
  h2: { size: 72, line: 88, track: -0.02, wrap: "balance" },
  h3: { size: 48, line: 64, track: -0.015, wrap: "balance" },
  lead: { size: 40, line: 56, track: -0.015, wrap: "pretty" },
  body: { size: 32, line: 48, track: -0.01, wrap: "pretty" },
  caption: { size: 24, line: 32, track: -0.01, wrap: "pretty" },
  micro: { size: 20, line: 32, track: 0, wrap: "pretty" },
};

/**
 * Text style for one step of the scale. Wraps the deck's t(), so theme text flipping and translated line heights
 * still apply. The wrap is set as `text-wrap-style` (not the `text-wrap` shorthand), so a `whiteSpace` spread
 * after it (keepBreaks, noWrap) keeps it.
 *
 * The box is trimmed to the letters (`text-box: trim-both cap text`): its top is the cap height of the first
 * line and its bottom the descender line of the last, so descenders (g, y, p) stay inside it and the line
 * height's invisible half-leading no longer adds to the gaps around it. Lines inside a paragraph keep their
 * full line height. Browsers without text-box (Firefox, for now) show slightly larger gaps; nothing overlaps.
 *
 * Size, line height and the bottom edge read CSS variables first (--st-<step>-size, --st-<step>-line, --st-under),
 * so the Studio's Tune card can preview another scale live; without them the values above apply. A layout
 * approved with another scale passes it as `sizes` (scaleSizes("golden") from ./scales).
 */
export function type(step: TypeStep, weight: 400 | 500 | 600 | 700, color?: string, family?: Parameters<typeof t>[5],
  sizes: Record<TypeStep, { size: number; line: number }> = TYPE): CSSProperties {
  const s = { ...TYPE[step], ...sizes[step] };
  const size = `var(--st-${step}-size, ${s.size}px)`;
  return {
    ...t(s.size, s.line / s.size, +(s.size * s.track).toFixed(2), weight, color, family === "everett" ? undefined : family), // rule 3: Manrope only, numbers included
    fontSize: size,
    lineHeight: `calc(var(--st-${step}-line, ${s.line}px) * var(--dk-lh, 1))`,
    letterSpacing: `calc(${size} * ${s.track})`,
    textWrapStyle: s.wrap, textBox: "trim-both cap var(--st-under, text)",
  };
}

/**
 * Spacing between a layout's elements, and inside a tight pair (name + role, number + label). Pass the layout's
 * own default in px; the Tune card can override both live (--st-gap, --st-pair).
 */
export const gap = (px: number) => `var(--st-gap, ${px}px)`;
export const pair = (px: number) => `var(--st-pair, ${px}px)`;

/** The opening quote mark as a shape with an exact box, so space above and below it is what the grid says. */
export function QuoteMark({ height = g(6), color }: { height?: number; color: string }) {
  return createElement("svg", { "aria-hidden": true, viewBox: "0 0 88 64", height, width: (height * 88) / 64, style: { display: "block", flex: "none" } },
    createElement("path", { fill: color, d: "M0 64V36C0 15 11 3 32 0v13c-10 3-15 9-16 19h16v32H0Zm48 0V36C48 15 59 3 80 0v13c-10 3-15 9-16 19h16v32H48Z" }));
}

/**
 * The content block, centred vertically in the band and spanning the safe area. Children stack in a flex
 * column with `gap` (grid px), so longer text pushes the next item down instead of overlapping it.
 */
export function Band({ gap = g(4), align = "center", style, children }: {
  gap?: number | string; align?: "start" | "center" | "end"; style?: CSSProperties; children: ReactNode;
}) {
  return createElement("div", {
    "data-st-band": "", // the Tune card checks this block still fits the band
    style: {
      position: "absolute", left: SAFE.left, top: BAND.top, width: SAFE.width, height: BAND.height,
      display: "flex", flexDirection: "column", justifyContent: align === "center" ? "center" : `flex-${align}`, gap, ...style,
    },
  }, children);
}

/**
 * A small source note in the footer row: right-aligned to the safe edge (x 1840), on the confidentiality line's
 * baseline (a zero-width strut set exactly like the footer). Outside the band, so it never meets the content.
 */
export function SourceNote({ children }: { children: ReactNode }) {
  return createElement("div", { style: { position: "absolute", right: 1920 - SAFE.right, top: 938, display: "flex", alignItems: "baseline", maxWidth: g(120) } },
    createElement("span", { "aria-hidden": true, style: { ...t(24, "normal", 0, 400), width: 0, overflow: "hidden" } }, "\u200b"),
    createElement("span", { style: { ...t(20, "normal", 0, 400, "#757575"), ...noWrap } }, children));
}
