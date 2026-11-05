import { Band, g, gap, pair, SourceNote, type } from "@/studio/grid";
import { scaleSizes } from "@/studio/scales";
import { onBg } from "../theme";
import { keepBreaks, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface TableRow {
  cells: string[];
  /** The one row in the brand accent. */
  highlight?: boolean;
}
export interface DataTableProps {
  title: string;
  takeaway: string;
  /** Header row, up to 6. */
  columns: string[];
  /** Up to 8. */
  rows: TableRow[];
  /** Index of the one column in the brand accent (instead of a row). */
  highlightColumn?: number;
  source?: string;
}

export const dataTableMeta: PatternMeta = {
  id: "data-table", name: "Data table", shape: "comparison",
  description: "Title and a one-line takeaway on top; a table of up to 6 columns and 8 rows below, with a header row. Columns that are mostly numbers (₱1,000, 0.5%, 3x, PHP 50K) are right-aligned, even with a word like Custom in them. One row or one column can be highlighted in the accent. Optional source note in the footer row.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 48, maxLines: 1 }, { slot: "takeaway", maxChars: 80, maxLines: 1 },
    { slot: "columns", maxItems: 6 }, { slot: "column.item", maxChars: 20, maxLines: 1 }, { slot: "rows", maxItems: 8 },
    { slot: "source", maxChars: 90, maxLines: 1 },
  ],
};

/** A number as people write them in tables: currency or code in front, %, K/M/B, x or bps behind. */
const NUMBER = /^\s*([A-Z]{3}\s?|[₱$€£¥฿])?[+\-−–]?\s*[\d][\d,]*(\.\d+)?\s*(%|[kKmMbB]|x|bps)?\s*$/;
export const isNumber = (v: string) => NUMBER.test(v ?? "");

/** Perfect Fifth scale, from the Tune line on revision 1 (h2 72/88, lead 39/56, body 32/48, caption 26/40). */
const SIZES = scaleSizes("fifth");
/** Body rows: 56 + 20% (asked for on revision 1), on the 4 half step inside the table. Eight rows step down to 60, and the gap above the table to 40, to stay in the band. */
const ROW = 68;
const ROW_8 = 60;
/** Cell text is trimmed to cap height and baseline, so it centres in its row by its letters. */
const CENTRED = { textBox: "trim-both cap alphabetic" } as const;
const HEAD = g(6); // 48
const PAD = g(3); // 24, inside each cell
const TINT = "rgba(250,115,18,0.10)";

/** Approved in the Studio 2026-11-05 (revision 2) with the Perfect Fifth scale. Built to the Studio rules (src/studio/STUDIO.md). */
export function DataTable({ title, takeaway, columns, rows, highlightColumn, source }: DataTableProps) {
  const cols = columns.slice(0, 6);
  const body = rows.slice(0, 8);
  const rowH = body.length > 7 ? ROW_8 : ROW;
  // A column of numbers is right-aligned, even with a word or two in it ("Custom", "n/a").
  const numeric = cols.map((_, c) => { const v = body.map((r) => r.cells[c] ?? "").filter((x) => x.trim()); return v.length > 0 && v.filter(isNumber).length * 2 >= v.length; });
  const template = cols.map((_, c) => (c === 0 ? "minmax(0, 1.5fr)" : "minmax(0, 1fr)")).join(" ");
  const hiCol = body.some((r) => r.highlight) ? -1 : highlightColumn ?? -1;
  const cell = (c: number, height: number, tint: boolean) => ({
    height, padding: `0 ${PAD}px`, display: "flex", alignItems: "center", justifyContent: numeric[c] ? "flex-end" : "flex-start",
    textAlign: numeric[c] ? "right" : "left", background: tint ? TINT : undefined, minWidth: 0,
  } as const);
  return (
    <>
      <Band gap={gap(body.length > 7 ? g(5) : g(6))}>
        <div style={{ display: "flex", flexDirection: "column", gap: pair(g(2)) }}>
          <h2 style={{ margin: 0, ...type("h2", 600, "#204680", undefined, SIZES), ...noWrap }}>{title}</h2>
          <p style={{ margin: 0, ...type("lead", 500, "#545454", undefined, SIZES), ...keepBreaks }}>{takeaway}</p>
        </div>
        <div role="table">
          <div role="row" style={{ display: "grid", gridTemplateColumns: template, borderBottom: `2px solid ${onBg("rgba(0,0,0,0.25)", "rule")}` }}>
            {cols.map((h, c) => (
              <div key={c} role="columnheader" style={cell(c, HEAD, c === hiCol)}>
                <span style={{ ...type("caption", 600, c === hiCol ? undefined : "#757575", undefined, SIZES), ...(c === hiCol ? { color: onBg("#fa7312", "accent") } : {}), ...noWrap, ...CENTRED }}>{h}</span>
              </div>
            ))}
          </div>
          {body.map((r, i) => (
            <div key={i} role="row" style={{ display: "grid", gridTemplateColumns: template, background: r.highlight ? TINT : undefined, borderBottom: `1px solid ${onBg("rgba(0,0,0,0.12)", "rule")}` }}>
              {cols.map((_, c) => (
                <div key={c} role="cell" style={cell(c, rowH, c === hiCol)}>
                  <span style={{ ...type("body", r.highlight || c === 0 ? 600 : 400, undefined, undefined, SIZES), ...noWrap, ...CENTRED }}>{r.cells[c] ?? ""}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Band>
      {source && <SourceNote>{source}</SourceNote>}
    </>
  );
}
