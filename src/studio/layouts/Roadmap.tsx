import { Band, g, gap, pair, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface RoadmapItem {
  title: string;
  /** Optional one-line note. */
  note?: string;
  /** Optional status chip: Done, In progress, Pending, Blocked, On hold or Planned (any word works; those get their colours). */
  status?: string;
}
export interface RoadmapColumn {
  /** Now, Next, Later, or a quarter (Q1). */
  label: string;
  /** Up to 4. */
  items: RoadmapItem[];
}
export interface RoadmapProps {
  title: string;
  /** Optional one line of context under the title. */
  context?: string;
  /** 3 or 4. */
  columns: RoadmapColumn[];
}

export const roadmapMeta: PatternMeta = {
  id: "roadmap", name: "Roadmap", shape: "sequence",
  description: "Title and an optional line of context on top; 3 or 4 columns below (Now / Next / Later, or quarters; labels are editable), each with up to 4 item cards: a short title, an optional one-line note and an optional status chip. Status words get colours: Done green, In progress blue, Pending yellow, Blocked and On hold red, anything else grey (Planned). Keep titles to a few words so cards stay one line.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 48, maxLines: 1 }, { slot: "context", maxChars: 90, maxLines: 1 },
    { slot: "columns", maxItems: 4 }, { slot: "column.label", maxChars: 14, maxLines: 1 },
  ],
};

const LINE = onBg("rgba(0,0,0,0.12)", "rule");
const ACCENT = onBg("#fa7312", "accent");

/** Chip colours by status word (revision 2); anything else reads as planned. */
function tone(status: string) {
  const s = status.toLowerCase();
  if (/done|live|shipped|complete/.test(s)) return { fg: "#15803d", bg: "rgba(21,128,61,0.12)" }; // green
  if (/block|hold|stuck|risk/.test(s)) return { fg: "#dc2626", bg: "rgba(220,38,38,0.12)" }; // red
  if (/pending|waiting|review/.test(s)) return { fg: "#a16207", bg: "rgba(234,179,8,0.20)" }; // yellow
  if (/progress|doing|building|beta/.test(s)) return { fg: "#2066ed", bg: "rgba(32,102,237,0.12)" }; // blue
  return { fg: "#545454", bg: "rgba(0,0,0,0.06)" }; // grey: planned
}
/** Card text is trimmed to cap height and baseline, so padding looks the same above and below the letters. */
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;
const CARD_PAD = g(2); // 16 on every side

function Chip({ status }: { status: string }) {
  const t = tone(status);
  return (
    <span style={{ flex: "none", padding: `${g(0.5)}px ${g(1.5)}px`, borderRadius: g(2), background: t.bg }}>
      <span style={{ ...type("caption", 600), color: t.fg, ...noWrap, display: "block", textBox: "trim-both cap alphabetic", padding: `${g(0.5)}px 0` }}>{status}</span>
    </span>
  );
}

export function Roadmap({ title, context, columns }: RoadmapProps) {
  const cols = columns.slice(0, 4);
  return (
    <Band gap={gap(g(5))}>
      <div style={{ display: "flex", flexDirection: "column", gap: pair(g(2)) }}>
        <h2 style={{ margin: 0, ...type("h2", 600, "#204680"), ...noWrap }}>{title}</h2>
        {context && <p style={{ margin: 0, ...type("lead", 500, "#545454"), ...keepBreaks }}>{context}</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`, gap: g(4), alignItems: "start" }}>
        {cols.map((c, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: g(2), minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: g(2) }}>
              <span style={{ ...type("h3", 600, i === 0 ? undefined : "#204680"), ...(i === 0 ? { color: ACCENT } : {}), ...noWrap }}>{c.label}</span>
              <div style={{ height: g(0.5), borderRadius: 2, background: i === 0 ? ACCENT : LINE }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: g(2) }}>
              {c.items.slice(0, 4).map((it, j) => (
                <div key={j} style={{ border: `2px solid ${LINE}`, borderRadius: g(2), padding: CARD_PAD, display: "flex", flexDirection: "column", justifyContent: "center", gap: g(2) }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: g(2) }}>
                    <span style={{ ...type("body", 600), ...keepBreaks, ...LETTERS, minWidth: 0 }}>{it.title}</span>
                    {it.status && <Chip status={it.status} />}
                  </div>
                  {it.note && <span style={{ ...type("caption", 400, "#545454"), ...keepBreaks, ...LETTERS }}>{it.note}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Band>
  );
}
