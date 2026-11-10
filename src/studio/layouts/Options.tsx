import { Band, g, gap, pair, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface Option {
  name: string;
  /** One line on what it is. */
  summary: string;
  /** Up to 3 short points: cost, time, risk. */
  points: string[];
}
export interface OptionsProps {
  title: string;
  /** Optional one line of context under the title. */
  context?: string;
  /** 2 or 3. */
  options: Option[];
  /** The recommended option (0-based), in the accent. */
  recommended?: number;
  /** Optional line on why, under the cards. */
  why?: string;
  /** The tag on the recommended card; Recommended by default. */
  tag?: string;
}

export const optionsMeta: PatternMeta = {
  id: "options", name: "Options and recommendation", shape: "comparison",
  description: "Title and an optional line of context on top; 2 or 3 option cards side by side, each with a short name, a one-line summary and up to 3 short points (cost, time, risk). One option is marked recommended: accent border and a Recommended tag beside its name, with a short why line under the cards. For management decisions, project and client proposals, and workshop read-outs.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 48, maxLines: 1 }, { slot: "context", maxChars: 90, maxLines: 1 },
    { slot: "options", maxItems: 3 }, { slot: "option.name", maxChars: 18, maxLines: 1 }, { slot: "option.summary", maxChars: 64, maxLines: 2 },
    { slot: "option.points", maxItems: 3 }, { slot: "point", maxChars: 30, maxLines: 1 },
    { slot: "why", maxChars: 96, maxLines: 1 }, { slot: "tag", maxChars: 14, maxLines: 1 },
  ],
};

const NAVY = "#204680";
const ACCENT = onBg("#fa7312", "accent");
const LINE = onBg("rgba(0,0,0,0.12)", "rule");
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;

export function Options({ title, context, options, recommended, why, tag = "Recommended" }: OptionsProps) {
  const list = options.slice(0, 3);
  return (
    <Band gap={gap(g(5))}>
      <div style={{ display: "flex", flexDirection: "column", gap: pair(g(2)) }}>
        <h2 style={{ margin: 0, ...type("h2", 600, NAVY), ...noWrap }}>{title}</h2>
        {context && <p style={{ margin: 0, ...type("lead", 500, "#545454"), ...keepBreaks }}>{context}</p>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))`, gap: g(4), alignItems: "stretch" }}>
        {list.map((o, i) => {
          const on = recommended === i;
          return (
            <div key={i} style={{
              padding: g(4), borderRadius: g(3), display: "flex", flexDirection: "column", gap: g(3), minWidth: 0,
              border: `${on ? g(0.5) : 2}px solid ${on ? ACCENT : LINE}`, background: on ? "rgba(250,115,18,0.06)" : "#ffffff",
            }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", columnGap: g(2), rowGap: g(2) }}>
                <span style={{ ...type("h3", 700, on ? undefined : NAVY), ...(on ? { color: ACCENT } : {}), ...noWrap, ...LETTERS }}>{o.name}</span>
                {on && (
                  <span style={{ flex: "none", padding: `${g(1)}px ${g(2)}px`, borderRadius: g(5), background: ACCENT }}>
                    <span style={{ ...type("caption", 700, "#ffffff"), ...noWrap, ...LETTERS, display: "block" }}>{tag}</span>
                  </span>
                )}
              </div>
              <span style={{ ...type("body", 500, "#545454"), ...keepBreaks }}>{o.summary}</span>
              <ul style={{ margin: 0, padding: `${g(3)}px 0 0`, listStyle: "none", display: "flex", flexDirection: "column", gap: g(3), borderTop: `2px solid ${LINE}` }}>
                {o.points.slice(0, 3).map((p, j) => (
                  <li key={j} style={{ display: "flex", alignItems: "center", gap: g(2) }}>
                    <span style={{ flex: "none", width: g(1), height: g(1), borderRadius: "50%", background: on ? ACCENT : NAVY }} />
                    <span style={{ ...type("body", 600), ...noWrap, ...LETTERS }}>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {why && (
        <p style={{ margin: 0, ...type("body", 600, NAVY), ...keepBreaks }}>
          <span style={{ color: ACCENT }}>Why: </span>{why}
        </p>
      )}
    </Band>
  );
}
