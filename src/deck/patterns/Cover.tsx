import { t, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface CoverProps { title: string; subtitle: string }

export const coverMeta: PatternMeta = {
  id: "cover", name: "Cover", shape: "chrome",
  description: "Dark gradient, large logo, two-line headline and a one-line tagline.",
  defaultChrome: { background: "dark", overlay: true, logo: "white-lg", footer: "cover", accentBar: false },
  budgets: [{ slot: "title", maxChars: 40, maxLines: 2 }, { slot: "subtitle", maxChars: 70, maxLines: 1 }],
};

export function Cover({ title, subtitle }: CoverProps) {
  return (
    <>
      <h1 style={{ position: "absolute", left: 128, top: 401, margin: 0, ...t(120, 1.15, -3.6, 500, "#fff"), ...noWrap }}>{title}</h1>
      <p style={{ position: "absolute", left: 128, top: 708, margin: 0, ...t(48, 1.15, -1.44, 400, "#fff"), ...noWrap }}>{subtitle}</p>
    </>
  );
}
