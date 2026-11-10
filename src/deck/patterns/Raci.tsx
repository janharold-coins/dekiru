import { Band, g, gap, pair, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface RaciTask {
  label: string;
  /** One per role: R, A, C, I, a pair (A/R), or empty. */
  cells: string[];
  highlight?: boolean;
}
export interface RaciProps {
  eyebrow?: string;
  title: string;
  /** Up to 5 roles or teams. */
  roles: string[];
  /** Up to 6. */
  tasks: RaciTask[];
}

export const raciMeta: PatternMeta = {
  id: "raci", name: "RACI", shape: "comparison",
  description: "Optional eyebrow and a title on top; a grid of up to 6 tasks (rows) by up to 5 roles or teams (columns). Each cell holds R, A, C or I as a coloured badge (or a pair, A/R, or nothing); one row can be highlighted. A legend under the grid explains the letters: Responsible, Accountable, Consulted, Informed. For kick-offs, cross-team processes, handovers and trainings on who does what.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 40, maxLines: 1 }, { slot: "title", maxChars: 48, maxLines: 1 },
    { slot: "roles", maxItems: 5 }, { slot: "role", maxChars: 16, maxLines: 1 },
    { slot: "tasks", maxItems: 6 }, { slot: "task.label", maxChars: 32, maxLines: 1 },
  ],
};

const NAVY = "#204680";
const ACCENT = onBg("#fa7312", "accent");
const LINE = onBg("rgba(0,0,0,0.12)", "rule");
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;
const TASK = g(64); // 512: the task column
const ROW = g(8); // 64: rows (rule 4 minimum), so 6 tasks and the legend fit the band
const BADGE = g(5); // 40

/** R does the work (accent), A owns it (navy), C is asked (blue outline), I is told (grey). */
const KIND: Record<string, { word: string; fg: string; bg: string; border?: string }> = {
  R: { word: "Responsible", fg: "#ffffff", bg: ACCENT },
  A: { word: "Accountable", fg: "#ffffff", bg: NAVY },
  C: { word: "Consulted", fg: "#2066ed", bg: "rgba(32,102,237,0.10)", border: "#2066ed" },
  I: { word: "Informed", fg: "#545454", bg: "rgba(0,0,0,0.06)" },
};

function Badge({ letter }: { letter: string }) {
  const k = KIND[letter];
  if (!k) return null;
  return (
    <span style={{ width: BADGE, height: BADGE, flex: "none", boxSizing: "border-box", borderRadius: "50%", background: k.bg, border: k.border ? `2px solid ${k.border}` : undefined, display: "grid", placeItems: "center" }}>
      <span style={{ ...type("caption", 700), color: k.fg, ...noWrap, ...LETTERS }}>{letter}</span>
    </span>
  );
}

/** Approved in the Studio 2026-11-09 (revision 1). Built to the Studio rules (src/studio/STUDIO.md). */
export function Raci({ eyebrow, title, roles, tasks }: RaciProps) {
  const cols = roles.slice(0, 5);
  const rows = tasks.slice(0, 6);
  const grid = `${TASK}px repeat(${cols.length}, minmax(0, 1fr))`;
  const letters = (v: string) => v.toUpperCase().split(/[^RACI]+/).join("").split("").filter((x, i, a) => a.indexOf(x) === i);
  return (
    <Band gap={gap(g(5))}>
      <div style={{ display: "flex", flexDirection: "column", gap: pair(g(2)) }}>
        {eyebrow && <span style={{ ...type("caption", 600, "#757575"), ...noWrap }}>{eyebrow}</span>}
        <h2 style={{ margin: 0, ...type("h2", 600, NAVY), ...noWrap }}>{title}</h2>
      </div>
      <div>
        <div style={{ display: "grid", gridTemplateColumns: grid, alignItems: "center", paddingBottom: g(3), borderBottom: `2px solid ${LINE}` }}>
          <span />
          {cols.map((r, i) => <span key={i} style={{ ...type("caption", 700, NAVY), ...noWrap, ...LETTERS, textAlign: "center" }}>{r}</span>)}
        </div>
        {rows.map((t, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: grid, alignItems: "center", height: ROW,
            borderBottom: `1px solid ${LINE}`, background: t.highlight ? "rgba(250,115,18,0.08)" : undefined,
            boxShadow: t.highlight ? `inset ${g(0.5)}px 0 0 ${ACCENT}` : undefined,
          }}>
            <span style={{ ...type("body", t.highlight ? 700 : 500), ...noWrap, ...LETTERS, paddingLeft: g(3) }}>{t.label}</span>
            {cols.map((_, j) => (
              <span key={j} style={{ display: "flex", justifyContent: "center", gap: g(1) }}>
                {letters(t.cells[j] ?? "").map((l) => <Badge key={l} letter={l} />)}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: g(5), flexWrap: "wrap" }}>
        {Object.entries(KIND).map(([l, k]) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: g(1) }}>
            <Badge letter={l} />
            <span style={{ ...type("caption", 500, "#545454"), ...noWrap, ...LETTERS }}>{k.word}</span>
          </span>
        ))}
      </div>
    </Band>
  );
}
