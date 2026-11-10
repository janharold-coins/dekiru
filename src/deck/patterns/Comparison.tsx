import { Band, g, gap, pair, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface ComparisonRow {
  /** What the row compares ("Settlement", "Fees"). */
  label: string;
  /** One short point per column, in the same order as the columns. */
  cells: string[];
}
export interface ComparisonProps {
  eyebrow?: string;
  title: string;
  /** Column names: 2, or 3. */
  columns: string[];
  /** Up to 5. */
  rows: ComparisonRow[];
  /** Index of the column shown in the accent ("ours" or the recommended option). */
  highlightColumn?: number;
  /** Optional tag above the highlighted column's name ("Recommended", "Coins.ph"). */
  highlightLabel?: string;
}

export const comparisonMeta: PatternMeta = {
  id: "comparison", name: "Comparison", shape: "comparison",
  description: "Title on top; two or three named columns side by side, with up to 5 rows of short points aligned across them and a row label on the left. One column can be highlighted in the accent as ours or the recommended one, with an optional tag above its name. Keep points to a few words: at 5 rows each fits one line.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 40, maxLines: 1 }, { slot: "title", maxChars: 48, maxLines: 1 },
    { slot: "columns", maxItems: 3 }, { slot: "column.item", maxChars: 16, maxLines: 1 },
    { slot: "rows", maxItems: 5 }, { slot: "row.label", maxChars: 18, maxLines: 1 }, { slot: "highlightLabel", maxChars: 20, maxLines: 1 },
  ],
};

const LABEL_COL = g(40); // 320: row labels
const PAD_X = g(4); // 32, inside each cell
const PAD_Y = g(3); // 24, around the column names
const ROW_Y = g(3); // 24, above and below each point (its letters: text is trimmed to cap height and baseline)
const ACCENT = onBg("#fa7312", "accent");
const LINE = onBg("rgba(0,0,0,0.12)", "rule");
/** Row text is trimmed to cap height and baseline and centred in its row, so short and two-line points sit in the middle. */
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;
const MIDDLE = { display: "flex", alignItems: "center" } as const;

/**
 * One grid, so every row lines up across the columns however its points wrap. The highlighted column is a card
 * laid behind its cells (tint and accent border), spanning the header to the last row.
 */
/** Approved in the Studio 2026-11-09 (revision 2). Built to the Studio rules (src/studio/STUDIO.md). */
export function Comparison({ eyebrow, title, columns, rows, highlightColumn, highlightLabel }: ComparisonProps) {
  const cols = columns.slice(0, 3);
  const list = rows.slice(0, 5);
  const hi = highlightColumn != null && highlightColumn >= 0 && highlightColumn < cols.length ? highlightColumn : -1;
  const at = (row: number, col: number) => ({ gridRow: row + 1, gridColumn: col + 1 });
  return (
    <Band gap={gap(g(7))}>
      <div style={{ display: "flex", flexDirection: "column", gap: pair(g(4)) }}>
        {eyebrow && <span style={{ ...type("caption", 600, "#757575"), ...noWrap }}>{eyebrow}</span>}
        <h2 style={{ margin: 0, ...type("h2", 600, "#204680"), ...noWrap }}>{title}</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `${LABEL_COL}px repeat(${cols.length}, minmax(0, 1fr))`, position: "relative" }}>
        {hi >= 0 && (
          <div aria-hidden style={{
            gridRow: `1 / ${list.length + 2}`, gridColumn: hi + 2, borderRadius: g(3), boxSizing: "border-box",
            background: "rgba(250,115,18,0.08)", border: `2px solid ${ACCENT}`,
          }} />
        )}
        {cols.map((name, c) => (
          <div key={`h${c}`} style={{ ...at(0, c + 1), padding: `${PAD_Y}px ${PAD_X}px`, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: g(2), position: "relative" }}>
            {c === hi && highlightLabel && (
              <span style={{ alignSelf: "flex-start", padding: `${g(1)}px ${g(2)}px`, borderRadius: g(5), background: ACCENT }}>
                <span style={{ ...type("caption", 600, "#ffffff"), color: "#ffffff", ...noWrap, display: "block" }}>{highlightLabel}</span>
              </span>
            )}
            <span style={{ ...type("h3", 700, c === hi ? undefined : "#204680"), ...(c === hi ? { color: ACCENT } : {}), ...noWrap }}>{name}</span>
          </div>
        ))}
        {list.map((r, i) => (
          <div key={`r${i}`} style={{ display: "contents" }}>
            <div style={{ ...at(i + 1, 0), ...MIDDLE, padding: `${ROW_Y}px ${PAD_X}px ${ROW_Y}px 0`, borderTop: `1px solid ${LINE}` }}>
              <span style={{ ...type("body", 600, "#545454"), ...keepBreaks, ...LETTERS, display: "block" }}>{r.label}</span>
            </div>
            {cols.map((_, c) => (
              <div key={c} style={{ ...at(i + 1, c + 1), ...MIDDLE, padding: `${ROW_Y}px ${PAD_X}px`, borderTop: `1px solid ${LINE}`, position: "relative" }}>
                <span style={{ ...type("body", c === hi ? 600 : 400), ...keepBreaks, ...LETTERS, display: "block" }}>{r.cells[c] ?? ""}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Band>
  );
}
