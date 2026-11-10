import { createElement } from "react";
import { Band, g, gap, pair, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface ProsConsProps {
  eyebrow?: string;
  /** The option being weighed. */
  title: string;
  /** Up to 5 each. */
  pros: string[];
  cons: string[];
  /** Optional verdict at the bottom (Recommendation: go ahead, with a pilot first). */
  verdict?: string;
  /** Column names, if not Pros / Cons. */
  labels?: [string, string];
}

export const prosConsMeta: PatternMeta = {
  id: "pros-cons", name: "Pros and cons", shape: "comparison",
  description: "Optional eyebrow and a title naming the option being weighed; two columns below, Pros with a plus and Cons with a minus (names editable), up to 5 short one-line items each; an optional verdict line at the bottom in a box with the accent. For internal decisions, proposals to management, why-switch slides and trainings.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 40, maxLines: 1 }, { slot: "title", maxChars: 48, maxLines: 1 },
    { slot: "pros", maxItems: 5 }, { slot: "cons", maxItems: 5 }, { slot: "item", maxChars: 48, maxLines: 1 },
    { slot: "verdict", maxChars: 96, maxLines: 1 },
  ],
};

const TONE = { pro: "#15803d", con: "#dc2626" };
const LINE = onBg("rgba(0,0,0,0.12)", "rule");
const ACCENT = onBg("#fa7312", "accent");
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;

/** A plus or minus in a circle, as an exact-box shape. */
function Mark({ pro, size }: { pro: boolean; size: number }) {
  const c = pro ? TONE.pro : TONE.con;
  return createElement("svg", { "aria-hidden": true, viewBox: "0 0 40 40", width: size, height: size, style: { display: "block", flex: "none" } },
    createElement("circle", { cx: 20, cy: 20, r: 20, fill: c, opacity: 0.14 }),
    createElement("path", { d: pro ? "M12 20h16M20 12v16" : "M12 20h16", stroke: c, strokeWidth: 3.5, strokeLinecap: "round" }));
}

function Column({ pro, label, items }: { pro: boolean; label: string; items: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: g(3), minWidth: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: g(2) }}>
        <div style={{ display: "flex", alignItems: "center", gap: g(2) }}>
          <Mark pro={pro} size={g(6)} />
          <span style={{ ...type("h3", 600), color: pro ? TONE.pro : TONE.con, ...noWrap, ...LETTERS }}>{label}</span>
        </div>
        <div style={{ height: g(0.5), borderRadius: 2, background: LINE }} />
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: g(3) }}>
        {items.slice(0, 5).map((t, i) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: g(2) }}>
            <Mark pro={pro} size={g(4)} />
            <span style={{ ...type("body", 500), ...noWrap, ...LETTERS, minWidth: 0 }}>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Approved in the Studio 2026-11-09 (revision 1). Built to the Studio rules (src/studio/STUDIO.md). */
export function ProsCons({ eyebrow, title, pros, cons, verdict, labels = ["Pros", "Cons"] }: ProsConsProps) {
  return (
    <Band gap={gap(g(5))}>
      <div style={{ display: "flex", flexDirection: "column", gap: pair(g(2)) }}>
        {eyebrow && <span style={{ ...type("caption", 600, "#757575"), ...noWrap }}>{eyebrow}</span>}
        <h2 style={{ margin: 0, ...type("h2", 600, "#204680"), ...noWrap }}>{title}</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: g(8), alignItems: "start" }}>
        <Column pro label={labels[0]} items={pros} />
        <Column pro={false} label={labels[1]} items={cons} />
      </div>
      {verdict && (
        <div style={{ padding: g(3), borderRadius: g(2), background: "rgba(250,115,18,0.08)", borderLeft: `${g(1)}px solid ${ACCENT}` }}>
          <p style={{ margin: 0, ...type("body", 600, "#204680"), ...keepBreaks, ...LETTERS }}>{verdict}</p>
        </div>
      )}
    </Band>
  );
}
