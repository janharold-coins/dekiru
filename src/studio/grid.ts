import { createElement, type CSSProperties, type ReactNode } from "react";
import { t } from "@/deck/tokens";

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
 * after it (keepBreaks, noWrap) keeps it. Browsers without support simply wrap as usual.
 */
export function type(step: TypeStep, weight: 400 | 500 | 600 | 700, color?: string, family?: Parameters<typeof t>[5]): CSSProperties {
  const s = TYPE[step];
  return { ...t(s.size, s.line / s.size, +(s.size * s.track).toFixed(2), weight, color, family), textWrapStyle: s.wrap };
}

/**
 * The content block, centred vertically in the band and spanning the safe area. Children stack in a flex
 * column with `gap` (grid px), so longer text pushes the next item down instead of overlapping it.
 */
export function Band({ gap = g(4), align = "center", style, children }: {
  gap?: number; align?: "start" | "center" | "end"; style?: CSSProperties; children: ReactNode;
}) {
  return createElement("div", {
    style: {
      position: "absolute", left: SAFE.left, top: BAND.top, width: SAFE.width, height: BAND.height,
      display: "flex", flexDirection: "column", justifyContent: align === "center" ? "center" : `flex-${align}`, gap, ...style,
    },
  }, children);
}
