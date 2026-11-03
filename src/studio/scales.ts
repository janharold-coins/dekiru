import { TYPE, type TypeStep } from "./grid";

/**
 * Type scales the Studio's Tune card can preview. "default" is the hand-picked scale in grid.ts; the others are
 * built from body text at 32px by a ratio: each step is 32 × ratio^n. Line heights round up to the 8-point grid
 * (×1.15 for headings, ×1.4 for running text). Fine print never goes under 20px, so it stays readable on a slide.
 */
export type ScaleId = "default" | "fifth" | "golden";
export const SCALES: { id: ScaleId; name: string; ratio?: number }[] = [
  { id: "default", name: "Layout default" },
  { id: "fifth", name: "Perfect Fifth", ratio: 1.5 },
  { id: "golden", name: "Golden Ratio", ratio: 1.618 },
];

const STEP: Record<TypeStep, number> = { micro: -1, caption: -0.5, body: 0, lead: 0.5, h3: 1, h2: 2, h1: 2.5, display: 3 };
const HEADINGS = new Set<TypeStep>(["display", "h1", "h2", "h3"]);
const up8 = (n: number) => Math.ceil(n / 8) * 8;

export function scaleSizes(id: ScaleId): Record<TypeStep, { size: number; line: number }> {
  const ratio = SCALES.find((s) => s.id === id)?.ratio;
  return Object.fromEntries((Object.keys(TYPE) as TypeStep[]).map((step) => {
    if (!ratio) return [step, { size: TYPE[step].size, line: TYPE[step].line }];
    const size = Math.max(20, Math.round(32 * ratio ** STEP[step]));
    return [step, { size, line: up8(size * (HEADINGS.has(step) ? 1.15 : 1.4)) }];
  })) as Record<TypeStep, { size: number; line: number }>;
}

/** CSS variables that switch type() to another scale (empty for the default). */
export function scaleVars(id: ScaleId): Record<string, string> {
  if (id === "default") return {};
  return Object.fromEntries(Object.entries(scaleSizes(id)).flatMap(([step, v]) => [[`--st-${step}-size`, `${v.size}px`], [`--st-${step}-line`, `${v.line}px`]]));
}
