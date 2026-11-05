import { Band, g, gap, SAFE, BAND, SourceNote, type } from "@/studio/grid";
import { scaleSizes } from "@/studio/scales";
import { onBg } from "../theme";
import { keepBreaks, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface ColumnBar {
  /** Category under the bar ("Jan", "Q1 2026"). */
  label: string;
  /** Value as shown on top of the bar ("1.2M", "₱340K", "34%"). The bar's height is read from it. */
  value: string;
  /** The one bar in the brand accent. With none set, the last bar is highlighted. */
  highlight?: boolean;
}
export interface ColumnChartProps {
  title: string;
  takeaway: string;
  bars: ColumnBar[];
  /** Optional label on the value axis ("Volume, PHP millions"). */
  axisLabel?: string;
  /** Optional source note, in the footer row on the right. */
  source?: string;
}

export const columnChartMeta: PatternMeta = {
  id: "column-chart", name: "Column chart", shape: "comparison",
  description: "Title and a one-line takeaway on the left; a column chart on the right with up to 8 categories, each value labelled on top of its bar and one bar highlighted in the accent (the last, unless another is set). Bar heights are read from the values as written (K, M and B are understood), so keep one unit across bars. Optional axis label (the unit) above the chart and a source note in the footer row. Category labels wrap between words only: at 8 bars a word of up to about 8 characters fits (December).",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 48, maxLines: 2 }, { slot: "takeaway", maxChars: 90, maxLines: 2 },
    { slot: "bars", maxItems: 8 }, { slot: "bar.label", maxChars: 14, maxLines: 2 }, { slot: "bar.value", maxChars: 6, maxLines: 1 },
    { slot: "axisLabel", maxChars: 32, maxLines: 1 }, { slot: "source", maxChars: 90, maxLines: 1 },
  ],
};

/** "1.2M" → 1200000, "₱340K" → 340000, "34%" → 34, "12,400" → 12400. Anything unreadable is 0. */
export function amount(v: string): number {
  const m = /(-?\d[\d,]*(?:\.\d+)?)\s*([kmb])?/i.exec(v ?? "");
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return Math.max(0, n * ({ k: 1e3, m: 1e6, b: 1e9 }[(m[2] ?? "").toLowerCase() as "k" | "m" | "b"] ?? 1));
}

const LEFT = g(80); // 640: title column
const GUTTER = g(12); // 96
const CHART = SAFE.width - LEFT - GUTTER; // 1024
const COL_GAP = g(3);
const LABEL_BLEED = g(1); // how far a category label may reach into the gap on each side
const BAR_MAX = g(20); // bars stop widening at 160, so 3 bars don't turn into blocks
/** Golden Ratio scale, from the Tune line on revision 1 (h2 84/104, h3 52/64, lead 41/64, body 32/48, caption 25/40). */
const SIZES = scaleSizes("golden");
/** Labels wrap between words only, never inside one ("Categor / y"). */
const wordsOnly = { whiteSpace: "pre-wrap", wordBreak: "normal", overflowWrap: "normal", hyphens: "none" } as const;
const ACCENT = onBg("#fa7312", "accent");
const MUTED = onBg("#d3dbe8", "rule");

/**
 * Approved in the Studio 2026-11-05 (revision 2) with the Golden Ratio scale. Built to the Studio rules (src/studio/STUDIO.md). The text block is centred in the band; the chart fills the
 * band's height. Values sit 16 above their bars; category labels 16 under the baseline.
 */
export function ColumnChart({ title, takeaway, bars, axisLabel, source }: ColumnChartProps) {
  const list = bars.slice(0, 8);
  const values = list.map((b) => amount(b.value));
  const max = Math.max(...values, 0) || 1;
  const hi = list.some((b) => b.highlight) ? list.findIndex((b) => b.highlight) : list.length - 1;
  const step = list.length <= 5 ? "h3" : "body"; // value labels fit the column at 8 bars
  const reserve = SIZES[step].line + g(2); // the value label's line plus its gap
  const cols = { display: "flex", gap: COL_GAP, width: CHART } as const;
  return (
    <>
      <Band gap={gap(g(4))} style={{ width: LEFT }}>
        <h2 style={{ margin: 0, ...type("h2", 600, "#204680", undefined, SIZES), ...keepBreaks }}>{title}</h2>
        <p style={{ margin: 0, ...type("lead", 500, "#545454", undefined, SIZES), ...keepBreaks }}>{takeaway}</p>
      </Band>
      <div style={{ position: "absolute", left: SAFE.left + LEFT + GUTTER, top: BAND.top, width: CHART, height: BAND.height, display: "flex", flexDirection: "column" }}>
        {axisLabel && <span style={{ ...type("caption", 500, "#757575", undefined, SIZES), ...noWrap, marginBottom: g(3) }}>{axisLabel}</span>}
        <div style={{ ...cols, flex: 1, minHeight: 0 }}>
          {list.map((b, i) => (
            <div key={i} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
              <span style={{ ...type(step, i === hi ? 700 : 600, i === hi ? undefined : "#545454", undefined, SIZES), ...(i === hi ? { color: ACCENT } : {}), ...noWrap, marginBottom: g(2) }}>{b.value}</span>
              <div style={{
                width: `min(100%, ${BAR_MAX}px)`, borderRadius: `${g(1)}px ${g(1)}px 0 0`, background: i === hi ? ACCENT : MUTED,
                height: values[i] > 0 ? `max(${g(0.5)}px, calc((100% - ${reserve}px) * ${values[i] / max}))` : 0,
              }} />
            </div>
          ))}
        </div>
        <div style={{ height: 2, background: onBg("rgba(0,0,0,0.25)", "rule") }} />
        <div style={{ ...cols, marginTop: g(2) }}>
          {/* Each label reaches 8 into the gap on either side, so a word like "Category" or "December" fits at
              8 bars and neighbouring labels still keep 8 of air between them. */}
          {list.map((b, i) => (
            <div key={i} style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "center" }}>
              <span style={{ flex: "none", width: `calc(100% + ${LABEL_BLEED * 2}px)`, textAlign: "center", ...type("caption", i === hi ? 600 : 500, i === hi ? "#17191d" : "#757575", undefined, SIZES), ...wordsOnly }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
      {source && <SourceNote>{source}</SourceNote>}
    </>
  );
}
