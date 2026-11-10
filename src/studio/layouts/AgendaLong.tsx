import { Band, g, gap, pair, SAFE, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";
import { scaleSizes } from "@/studio/scales";

export interface AgendaSection {
  title: string;
  /** Optional one-line description. */
  description?: string;
  /** Optional time or duration: 10:30, 20 min. */
  time?: string;
  /** A break: shows a coffee or lunch mark instead of a number, and isn't counted in the numbering. */
  break?: "coffee" | "lunch";
}
export interface AgendaLongProps {
  eyebrow?: string;
  title: string;
  /** 5 to 8, in two columns (filled top to bottom). */
  sections: AgendaSection[];
  /** The section you're in (0-based), in the accent: reuse the slide between sections as "you are here". */
  current?: number;
  /** Optional titles over the two columns, such as Morning and Afternoon. */
  columns?: [string, string];
}

export const agendaLongMeta: PatternMeta = {
  id: "agenda-long", name: "Long agenda", shape: "sequence",
  description: "For trainings and workshops: optional eyebrow and a title on the left; 5 to 8 sections on the right in two columns (filled top to bottom), with optional column titles (Morning, Afternoon). Each section has a short title, an optional one-line description and an optional time; a break shows a coffee or lunch mark instead of a number. One section can be marked current in the accent, so the same slide can come back between sections as \"you are here\".",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 32, maxLines: 1 }, { slot: "title", maxChars: 40, maxLines: 3 },
    { slot: "columns", maxChars: 24, maxLines: 1 },
    { slot: "sections", maxItems: 8 }, { slot: "section.title", maxChars: 22, maxLines: 1 },
    { slot: "section.description", maxChars: 32, maxLines: 1 }, { slot: "section.time", maxChars: 6, maxLines: 1 },
  ],
};

const SIZES = scaleSizes("fifth"); // Perfect Fifth, from the Tune line it was revised with
const LEFT = g(48); // 384
const GUTTER = g(8); // 64
const NAVY = "#204680";
const ACCENT = onBg("#fa7312", "accent");
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;
const MARK = { coffee: "☕", lunch: "🍽️" } as const;

export function AgendaLong({ eyebrow, title, sections, current, columns }: AgendaLongProps) {
  const list = sections.slice(0, 8);
  const half = Math.ceil(list.length / 2);
  const cols = [list.slice(0, half), list.slice(half)];
  // Breaks don't take a number, so sessions count 01, 02, 03… on either side of them.
  let count = 0;
  const numbers = list.map((s) => (s.break ? 0 : ++count));
  return (
    <>
      <Band gap={pair(g(3))} style={{ width: LEFT }}>
        {eyebrow && <span style={{ ...type("caption", 600, "#757575", undefined, SIZES), ...noWrap }}>{eyebrow}</span>}
        <h2 style={{ margin: 0, ...type("h2", 600, NAVY, undefined, SIZES), ...keepBreaks }}>{title}</h2>
      </Band>
      <Band style={{ left: SAFE.left + LEFT + GUTTER, width: SAFE.width - LEFT - GUTTER }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", columnGap: g(4), alignItems: "start" }}>
          {cols.map((col, c) => (
            <div key={c} style={{ display: "flex", flexDirection: "column", gap: gap(g(3)), minWidth: 0 }}>
              {columns?.[c] && (
                // In line with the row text (past the 24 padding), so the title reads as the column's heading.
                <span style={{ paddingLeft: g(3), ...type("caption", 700, NAVY, undefined, SIZES), textTransform: "uppercase", letterSpacing: "0.08em", ...noWrap, ...LETTERS }}>{columns[c]}</span>
              )}
              <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: gap(g(2)) }}>
                {col.map((s, i) => {
                  const n = c * half + i;
                  const on = current === n;
                  const brk = s.break;
                  return (
                    // Every row is a box with 24 on every side, so marking one current changes nothing but its colour.
                    <li key={i} style={{
                      display: "flex", alignItems: "center", gap: g(3), padding: g(3), borderRadius: g(3),
                      background: on ? "rgba(250,115,18,0.10)" : brk ? "rgba(32,70,128,0.05)" : undefined,
                      boxShadow: on ? `inset 0 0 0 2px ${ACCENT}` : undefined,
                    }}>
                      {brk
                        ? <span aria-hidden style={{ flex: "none", width: g(6), height: g(5), display: "grid", placeItems: "center", fontSize: g(5), lineHeight: 1 }}>{MARK[brk]}</span>
                        : <span style={{ flex: "none", width: g(6), ...type("lead", 700, on ? undefined : NAVY, "numeral", SIZES), ...(on ? { color: ACCENT } : {}), ...noWrap, ...LETTERS }}>{String(numbers[n]).padStart(2, "0")}</span>}
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: g(2) }}>
                        <span style={{ ...type("body", on ? 700 : 600, brk && !on ? "#545454" : undefined, undefined, SIZES), ...noWrap, ...LETTERS }}>{s.title}</span>
                        {s.description && <span style={{ ...type("caption", 400, "#545454", undefined, SIZES), ...noWrap, ...LETTERS }}>{s.description}</span>}
                      </div>
                      {s.time && <span style={{ flex: "none", ...type("caption", 600, on ? undefined : "#757575", "numeral", SIZES), ...(on ? { color: ACCENT } : {}), ...noWrap, ...LETTERS }}>{s.time}</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </Band>
    </>
  );
}
