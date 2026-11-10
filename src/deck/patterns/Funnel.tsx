import { Band, g, gap, SAFE, SourceNote, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface FunnelStage {
  label: string;
  /** The stage's figure, as written: 120K, 48%. */
  value: string;
  /**
   * Optional change from the stage above, shown with the stage. Start it with + (green) or − / - (red) to show
   * which way it went: +12%, −36%. Without a sign it stays grey.
   */
  rate?: string;
}
export interface FunnelProps {
  title: string;
  /** Optional one-line takeaway under the title. */
  takeaway?: string;
  /** 3 to 6, widest first. */
  stages: FunnelStage[];
  /** The stage in the accent (0-based); none by default. */
  highlight?: number;
  /** Where stage names go: beside the funnel (side, the default) or on top of each bar with its change (top). */
  labels?: "side" | "top";
  /** Optional source note, in the footer row on the right. */
  source?: string;
}

export const funnelMeta: PatternMeta = {
  id: "funnel", name: "Funnel", shape: "sequence",
  description: "Title and a one-line takeaway on the left; a funnel on the right with 3 to 6 stages, widest first, each with its figure inside its bar. Two variants: stage names left-aligned in a column beside the funnel with the change between bars (side), or each name sitting on top of its bar with its change (top). A change starting with + is green, with − or - red, otherwise grey. One stage can take the accent. Bar widths step down evenly (they show order, not the figures). Optional source note in the footer row.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 48, maxLines: 3 }, { slot: "takeaway", maxChars: 90, maxLines: 3 },
    { slot: "stages", maxItems: 6 }, { slot: "stage.label", maxChars: 22, maxLines: 1 }, { slot: "stage.value", maxChars: 10, maxLines: 1 },
    { slot: "stage.rate", maxChars: 8, maxLines: 1 }, { slot: "source", maxChars: 90, maxLines: 1 },
  ],
};

const LEFT = g(72); // 576
const GUTTER = g(12); // 96
const NAMES = g(40); // 320: stage names (side variant), left-aligned
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;
const NAVY = "#204680";
const ACCENT = onBg("#fa7312", "accent");
/** Navy stepping lighter down the funnel; white figures stay readable on every step (large bold text, at least 3:1). */
const SHADES = ["#204680", "#2a5592", "#3464a4", "#3e73b6", "#4882c8", "#5291da"];

/** The change, signed and coloured: + green, − / - red, anything else grey. */
function Change({ rate }: { rate: string }) {
  const r = rate.trim();
  const up = r.startsWith("+"), down = /^[−-]/.test(r);
  const text = down ? `−${r.slice(1)}` : r; // a true minus sign
  const fg = up ? "#15803d" : down ? "#dc2626" : "#757575";
  return <span style={{ ...type("caption", 700, fg, "numeral"), ...noWrap, ...LETTERS }}>{`${up ? "▲" : down ? "▼" : ""}${up || down ? " " : ""}${text}`}</span>;
}

export function Funnel({ title, takeaway, stages, highlight, labels = "side", source }: FunnelProps) {
  const list = stages.slice(0, 6);
  const top = labels === "top";
  const right = SAFE.width - LEFT - GUTTER; // 1088
  const funnel = top ? right : right - NAMES - g(4); // 1088 or 736
  const min = 0.4; // the narrowest bar is 40% of the widest
  const width = (i: number) => Math.round((funnel * (1 - ((1 - min) * i) / Math.max(1, list.length - 1))) / 8) * 8;
  const bar = top ? g(7) : g(9); // 56 or 72 tall: the top variant gives a line to each name
  const fill = (i: number) => (highlight === i ? ACCENT : SHADES[i]);
  return (
    <>
      <Band gap={gap(g(4))} style={{ width: LEFT }}>
        <h2 style={{ margin: 0, ...type("h2", 600, NAVY), ...keepBreaks }}>{title}</h2>
        {takeaway && <p style={{ margin: 0, ...type("lead", 500, "#545454"), ...keepBreaks }}>{takeaway}</p>}
      </Band>
      <Band gap={top ? g(3) : 0} style={{ left: SAFE.left + LEFT + GUTTER, width: right }}>
        {list.map((s, i) => {
          const lit = highlight === i;
          const name = <span style={{ ...type("body", lit ? 700 : 600, lit ? undefined : NAVY), ...(lit ? { color: ACCENT } : {}), ...noWrap, ...LETTERS }}>{s.label}</span>;
          const figure = (
            <div style={{ width: width(i), height: bar, borderRadius: g(2), background: fill(i), display: "grid", placeItems: "center" }}>
              <span style={{ ...type(top ? "body" : "lead", 700, "#ffffff", "numeral"), ...noWrap, ...LETTERS }}>{s.value}</span>
            </div>
          );
          if (top) {
            // The name and its change sit on the bar's left edge, 16 above it.
            const inset = (funnel - width(i)) / 2;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: g(2), paddingLeft: inset }}>
                <div style={{ display: "flex", alignItems: "center", gap: g(2) }}>{name}{s.rate && i > 0 && <Change rate={s.rate} />}</div>
                {figure}
              </div>
            );
          }
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
              {i > 0 && (
                <div style={{ height: g(5), display: "flex", alignItems: "center", paddingLeft: NAMES + g(4) + funnel / 2 + g(2) }}>
                  {s.rate && <Change rate={s.rate} />}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: g(4) }}>
                <span style={{ width: NAMES, flex: "none", display: "flex" }}>{name}</span>
                <div style={{ width: funnel, flex: "none", display: "flex", justifyContent: "center" }}>{figure}</div>
              </div>
            </div>
          );
        })}
      </Band>
      {source && <SourceNote>{source}</SourceNote>}
    </>
  );
}
