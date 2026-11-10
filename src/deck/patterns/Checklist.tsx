import { createElement } from "react";
import { Band, g, gap, pair, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";
import { scaleSizes } from "@/studio/scales";

export interface ChecklistStep {
  /** The step, action-led: Check the ID matches the account. */
  text: string;
  /** Optional one-line note: who does it, or what to check. */
  note?: string;
}
export interface ChecklistProps {
  title: string;
  /** Optional one line of context under the title. */
  context?: string;
  /** Up to 8: 4 or more split into two columns (filled top to bottom); fewer stay in one. */
  steps: ChecklistStep[];
  /** Optional warning for the step people most often skip. */
  warning?: string;
}

export const checklistMeta: PatternMeta = {
  id: "checklist", name: "SOP checklist", shape: "sequence",
  description: "Title and an optional line of context on top; up to 8 numbered steps below, each with a checkbox-style number, a short action-led step and an optional one-line note (who does it, what to check). From 4 steps they split into two columns (filled top to bottom), one type step smaller; up to 3 stay in one column. An optional warning line at the bottom flags the step people most often skip. For trainings, onboarding, compliance procedures and support playbooks.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 48, maxLines: 1 }, { slot: "context", maxChars: 90, maxLines: 1 },
    { slot: "steps", maxItems: 8 }, { slot: "step.text", maxChars: 48, maxLines: 1 }, { slot: "step.note", maxChars: 64, maxLines: 1 },
    { slot: "warning", maxChars: 96, maxLines: 1 },
  ],
};

const NAVY = "#204680";
const LINE = onBg("rgba(0,0,0,0.20)", "rule");
const AMBER = { fg: "#a16207", bg: "rgba(234,179,8,0.16)" };
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;
/** Perfect Fifth scale, from the Tune line on revision 1 (h2 72/88, lead 39/56, body 32/48, caption 26/40). */
const SIZES = scaleSizes("fifth");

/** A warning triangle as an exact-box shape. */
const Warn = () => createElement("svg", { "aria-hidden": true, viewBox: "0 0 32 32", width: g(4), height: g(4), style: { display: "block", flex: "none" } },
  createElement("path", { d: "M16 4L30 28H2L16 4Z", fill: "none", stroke: AMBER.fg, strokeWidth: 2.5, strokeLinejoin: "round" }),
  createElement("path", { d: "M16 13v7M16 24v.5", stroke: AMBER.fg, strokeWidth: 2.5, strokeLinecap: "round" }));

export function Checklist({ title, context, steps, warning }: ChecklistProps) {
  const list = steps.slice(0, 8);
  const two = list.length >= 4; // revision 2: two columns from 4 steps
  // Two columns are half as wide, so a step steps down one size (lead → body, note body → caption).
  const step = two ? "body" : "lead";
  const note = two ? "caption" : "body";
  const box = two ? g(5) : g(6); // the checkbox: 40 or 48
  const half = two ? Math.ceil(list.length / 2) : list.length;
  const cols = two ? [list.slice(0, half), list.slice(half)] : [list];
  return (
    <Band gap={gap(g(5))}>
      <div style={{ display: "flex", flexDirection: "column", gap: pair(g(2)) }}>
        <h2 style={{ margin: 0, ...type("h2", 600, NAVY, undefined, SIZES), ...noWrap }}>{title}</h2>
        {context && <p style={{ margin: 0, ...type("lead", 500, "#545454", undefined, SIZES), ...keepBreaks }}>{context}</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`, gap: g(8), alignItems: "start" }}>
        {cols.map((col, c) => (
          <ol key={c} style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: two ? g(4) : g(5) }}>
            {col.map((s, i) => (
              <li key={i} style={{ display: "flex", alignItems: "center", gap: g(3) }}>
                <span style={{ flex: "none", width: box, height: box, boxSizing: "border-box", borderRadius: g(1), border: `2px solid ${LINE}`, display: "grid", placeItems: "center" }}>
                  <span style={{ ...type("caption", 700, NAVY, "numeral", SIZES), ...noWrap, ...LETTERS }}>{c * half + i + 1}</span>
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: g(2), minWidth: 0 }}>
                  <span style={{ ...type(step, 600, undefined, undefined, SIZES), ...noWrap, ...LETTERS }}>{s.text}</span>
                  {s.note && <span style={{ ...type(note, 400, "#545454", undefined, SIZES), ...noWrap, ...LETTERS }}>{s.note}</span>}
                </div>
              </li>
            ))}
          </ol>
        ))}
      </div>
      {warning && (
        <div style={{ display: "flex", alignItems: "center", gap: g(2), padding: g(3), borderRadius: g(2), background: AMBER.bg }}>
          <Warn />
          <span style={{ ...type("body", 600, AMBER.fg, undefined, SIZES), ...keepBreaks, ...LETTERS }}>{warning}</span>
        </div>
      )}
    </Band>
  );
}
