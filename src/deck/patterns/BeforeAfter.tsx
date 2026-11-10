import { createElement } from "react";
import { Band, g, gap, pair, SourceNote, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface BeforeAfterMetric {
  /** What's measured: Time to approve. */
  name: string;
  before: string;
  after: string;
  /** Optional signed change: −40%, +2.1x. */
  change?: string;
  /** Is the change good? Green if so, red if not. Without it, + reads as good and − as bad. */
  good?: boolean;
}
export interface BeforeAfterProps {
  title: string;
  /** Optional one-line takeaway under the title. */
  takeaway?: string;
  /** 2 to 4. */
  metrics: BeforeAfterMetric[];
  /** Optional source note, in the footer row on the right. */
  source?: string;
}

export const beforeAfterMeta: PatternMeta = {
  id: "before-after", name: "Before and after", shape: "comparison",
  description: "Title and a one-line takeaway on top; 2 to 4 metric cards below, each with the metric's name, the before value (muted), a down arrow, the after value (large, navy) and an optional signed change in green when it's good or red when it isn't (a drop in time can be good: set good). Optional source note in the footer row. For results after switching, project retros and internal updates.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 48, maxLines: 1 }, { slot: "takeaway", maxChars: 96, maxLines: 2 },
    { slot: "metrics", maxItems: 4 }, { slot: "metric.name", maxChars: 24, maxLines: 1 },
    { slot: "metric.before", maxChars: 10, maxLines: 1 }, { slot: "metric.after", maxChars: 8, maxLines: 1 },
    { slot: "metric.change", maxChars: 10, maxLines: 1 }, { slot: "source", maxChars: 90, maxLines: 1 },
  ],
};

const NAVY = "#204680";
const LINE = onBg("rgba(0,0,0,0.12)", "rule");
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;

const Arrow = () => createElement("svg", { "aria-hidden": true, viewBox: "0 0 24 24", width: g(4), height: g(4), style: { display: "block", flex: "none" } },
  createElement("path", { d: "M12 4v15M6 13l6 6 6-6", fill: "none", stroke: "#9aa3b2", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round" }));

function Change({ change, good }: { change: string; good?: boolean }) {
  const c = change.trim();
  const ok = good ?? c.startsWith("+");
  const t = ok ? { fg: "#15803d", bg: "rgba(21,128,61,0.12)" } : { fg: "#dc2626", bg: "rgba(220,38,38,0.12)" };
  const text = /^-/.test(c) ? `−${c.slice(1)}` : c; // a true minus sign
  return (
    <span style={{ alignSelf: "flex-start", padding: `${g(1)}px ${g(2)}px`, borderRadius: g(5), background: t.bg }}>
      <span style={{ ...type("caption", 700, t.fg, "numeral"), ...noWrap, ...LETTERS, display: "block" }}>{text}</span>
    </span>
  );
}

export function BeforeAfter({ title, takeaway, metrics, source }: BeforeAfterProps) {
  const list = metrics.slice(0, 4);
  return (
    <>
      <Band gap={gap(g(6))}>
        <div style={{ display: "flex", flexDirection: "column", gap: pair(g(2)) }}>
          <h2 style={{ margin: 0, ...type("h2", 600, NAVY), ...noWrap }}>{title}</h2>
          {takeaway && <p style={{ margin: 0, ...type("lead", 500, "#545454"), ...keepBreaks }}>{takeaway}</p>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))`, gap: g(4) }}>
          {list.map((m, i) => (
            <div key={i} style={{ border: `2px solid ${LINE}`, borderRadius: g(3), padding: g(4), display: "flex", flexDirection: "column", gap: g(3) }}>
              <span style={{ ...type("body", 700, NAVY), ...noWrap, ...LETTERS }}>{m.name}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: g(2) }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: g(2) }}>
                  <span style={{ ...type("caption", 600, "#757575"), ...noWrap, ...LETTERS }}>Before</span>
                  <span style={{ ...type("h3", 500, "#9aa3b2", "numeral"), ...noWrap, ...LETTERS }}>{m.before}</span>
                </div>
                <Arrow />
                <span style={{ ...type("h2", 700, NAVY, "numeral"), ...noWrap, ...LETTERS }}>{m.after}</span>
              </div>
              {m.change && <Change change={m.change} good={m.good} />}
            </div>
          ))}
        </div>
      </Band>
      {source && <SourceNote>{source}</SourceNote>}
    </>
  );
}
