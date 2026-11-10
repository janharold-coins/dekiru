import { createElement } from "react";
import { Band, g, gap, pair, SAFE, type } from "@/studio/grid";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface Objective {
  /** Action-led: "Explain…", "Set up…". */
  text: string;
  /** Optional one-line detail. */
  detail?: string;
}
export interface ObjectivesProps {
  eyebrow: string;
  title: string;
  /** 3 to 5. */
  objectives: Objective[];
}

export const objectivesMeta: PatternMeta = {
  id: "objectives", name: "Learning objectives", shape: "set",
  description: "Eyebrow (In this session) and a title (By the end, you'll be able to…) on the left; 3 to 5 objectives on the right, each with a check-circle, a short action-led line and an optional one-line detail. Both sides are centred between the logo and the footer.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 32, maxLines: 1 }, { slot: "title", maxChars: 48, maxLines: 3 },
    { slot: "objectives", maxItems: 5 }, { slot: "objective.text", maxChars: 56, maxLines: 1 }, { slot: "objective.detail", maxChars: 80, maxLines: 1 },
  ],
};

const LEFT = g(80); // 640
const GUTTER = g(12); // 96
const ICON = g(5); // 40
/** Light blue, asked for on revision 1 (Coins blue #1f7aff, lightened). Stays the same on any theme. */
const CHECK = "#5ba4ff";
/** The circle sits on the middle of the line's capitals (lead cap height ≈ 0.72 × 40): optical. */
const ICON_TOP = Math.round(40 * 0.36 - ICON / 2);

function CheckCircle() {
  return createElement("svg", { "aria-hidden": true, viewBox: "0 0 40 40", width: ICON, height: ICON, style: { display: "block", flex: "none" } },
    createElement("circle", { cx: 20, cy: 20, r: 20, fill: CHECK }),
    createElement("path", { d: "M12 20.5l5.5 5.5L28.5 14", fill: "none", stroke: "#ffffff", strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" }));
}

/** Approved in the Studio 2026-11-09 (revision 2). Built to the Studio rules (src/studio/STUDIO.md). */
export function Objectives({ eyebrow, title, objectives }: ObjectivesProps) {
  return (
    <>
      <Band gap={pair(g(3))} style={{ width: LEFT }}>
        <span style={{ ...type("caption", 600, "#757575"), ...noWrap }}>{eyebrow}</span>
        <h2 style={{ margin: 0, ...type("h2", 600, "#204680"), ...keepBreaks }}>{title}</h2>
      </Band>
      <Band gap={gap(g(6))} style={{ left: SAFE.left + LEFT + GUTTER, width: SAFE.width - LEFT - GUTTER }}>
        {objectives.slice(0, 5).map((o, i) => (
          <div key={i} style={{ display: "flex", gap: g(3), alignItems: "flex-start" }}>
            <span style={{ marginTop: ICON_TOP }}><CheckCircle /></span>
            <div style={{ display: "flex", flexDirection: "column", gap: g(1), minWidth: 0 }}>
              <span style={{ ...type("lead", 600), ...keepBreaks }}>{o.text}</span>
              {o.detail && <span style={{ ...type("body", 400, "#545454"), ...keepBreaks }}>{o.detail}</span>}
            </div>
          </div>
        ))}
      </Band>
    </>
  );
}
