import { Band, g, gap, pair, SAFE, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export type Quadrant = "top-left" | "top-right" | "bottom-left" | "bottom-right";
export interface MatrixAxis {
  /** What the axis measures: Effort, Impact, Price. */
  label: string;
  /** End labels; Low and High by default. */
  low?: string;
  high?: string;
}
export interface MatrixItem {
  label: string;
  quadrant: Quadrant;
}
export interface MatrixProps {
  eyebrow?: string;
  title: string;
  /** Optional one-line takeaway under the title. */
  takeaway?: string;
  xAxis: MatrixAxis;
  yAxis: MatrixAxis;
  /** Quadrant names. */
  quadrants: Record<Quadrant, string>;
  /** The quadrant in the brand accent (Do first). */
  highlight?: Quadrant;
  /** Up to 8, at most 4 in one quadrant. They flow inside their quadrant as chips. */
  items: MatrixItem[];
}

export const matrixMeta: PatternMeta = {
  id: "matrix", name: "2×2 matrix", shape: "comparison",
  description: "Optional eyebrow, a title and a one-line takeaway on the left; a square 2×2 matrix on the right with a labelled x-axis and y-axis (Low to High), four quadrant names and up to 8 items as chips inside their quadrants (at most 4 in one). One quadrant can take the brand accent (Do first). For impact vs. effort, market positioning and workshop exercises.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 32, maxLines: 1 }, { slot: "title", maxChars: 48, maxLines: 3 }, { slot: "takeaway", maxChars: 90, maxLines: 3 },
    { slot: "axis.label", maxChars: 16, maxLines: 1 }, { slot: "quadrant", maxChars: 18, maxLines: 1 },
    { slot: "items", maxItems: 8 }, { slot: "item.label", maxChars: 16, maxLines: 1 },
  ],
};

const ACCENT = onBg("#fa7312", "accent");
const LINE = onBg("rgba(0,0,0,0.16)", "rule");
const MUTE = "#757575";
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;
const SQUARE = g(76); // 608: the matrix
const AXIS = g(4); // 32: the y-axis label column
const RIGHT = AXIS + g(2) + SQUARE; // 656: matrix block width
const GUTTER = g(12);
const LEFT = SAFE.width - RIGHT - GUTTER; // 1008
const ORDER: Quadrant[] = ["top-left", "top-right", "bottom-left", "bottom-right"];

function Cell({ q, name, items, lit }: { q: Quadrant; name: string; items: MatrixItem[]; lit: boolean }) {
  const top = q.startsWith("top"), left = q.endsWith("left");
  return (
    <div style={{
      boxSizing: "border-box", minWidth: 0, minHeight: 0, padding: g(3), display: "flex", flexDirection: "column", gap: g(2),
      background: lit ? "rgba(250,115,18,0.10)" : undefined,
      borderRight: left ? `2px solid ${LINE}` : undefined, borderBottom: top ? `2px solid ${LINE}` : undefined,
    }}>
      <span style={{ ...type("caption", 700, lit ? undefined : "#204680"), ...(lit ? { color: ACCENT } : {}), ...noWrap, ...LETTERS }}>{name}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: g(1), alignContent: "flex-start" }}>
        {items.slice(0, 4).map((it, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: g(1), padding: `${g(1)}px ${g(2)}px`, borderRadius: g(5), background: "#ffffff", border: `2px solid ${lit ? ACCENT : LINE}` }}>
            <span style={{ width: g(1), height: g(1), borderRadius: "50%", background: lit ? ACCENT : "#204680", flex: "none" }} />
            <span style={{ ...type("caption", 500, "#1a1a1a"), ...noWrap, ...LETTERS }}>{it.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Approved in the Studio 2026-11-09 (revision 1). Built to the Studio rules (src/studio/STUDIO.md). */
export function Matrix({ eyebrow, title, takeaway, xAxis, yAxis, quadrants, highlight, items }: MatrixProps) {
  const list = items.slice(0, 8);
  const end = (s: string) => <span style={{ ...type("caption", 500, MUTE), ...noWrap, ...LETTERS }}>{s}</span>;
  return (
    <>
      <Band gap={gap(g(4))} style={{ width: LEFT }}>
        <div style={{ display: "flex", flexDirection: "column", gap: pair(g(3)) }}>
          {eyebrow && <span style={{ ...type("caption", 600, MUTE), ...noWrap }}>{eyebrow}</span>}
          <h2 style={{ margin: 0, ...type("h2", 600, "#204680"), ...keepBreaks }}>{title}</h2>
        </div>
        {takeaway && <p style={{ margin: 0, ...type("lead", 500, "#545454"), ...keepBreaks }}>{takeaway}</p>}
      </Band>
      <Band gap={g(2)} style={{ left: SAFE.right - RIGHT, width: RIGHT }}>
        <div style={{ display: "flex", gap: g(2) }}>
          {/* y-axis: High at the top, Low at the bottom, the label in the middle, read bottom to top */}
          <div style={{ width: AXIS, height: SQUARE, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{end(yAxis.high ?? "High")}</span>
            <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", ...type("caption", 700, "#204680"), ...noWrap, ...LETTERS }}>{yAxis.label}</span>
            <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{end(yAxis.low ?? "Low")}</span>
          </div>
          <div style={{ width: SQUARE, height: SQUARE, boxSizing: "border-box", border: `2px solid ${LINE}`, borderRadius: g(3), overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" }}>
            {ORDER.map((q) => <Cell key={q} q={q} name={quadrants[q]} items={list.filter((it) => it.quadrant === q)} lit={highlight === q} />)}
          </div>
        </div>
        {/* x-axis: Low on the left, High on the right, under the square */}
        <div style={{ marginLeft: AXIS + g(2), width: SQUARE, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {end(xAxis.low ?? "Low")}
          <span style={{ ...type("caption", 700, "#204680"), ...noWrap, ...LETTERS }}>{xAxis.label}</span>
          {end(xAxis.high ?? "High")}
        </div>
      </Band>
    </>
  );
}
