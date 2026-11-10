import { Band, g, gap, pair, SAFE, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface FaqPair {
  question: string;
  /** Up to two lines. */
  answer: string;
}
export interface FaqProps {
  title: string;
  /** Optional one-line note under the title (Ask us anything else in #channel). */
  note?: string;
  /** Up to 6: 4 or fewer in one column, 5 or 6 in two. */
  pairs: FaqPair[];
}

export const faqMeta: PatternMeta = {
  id: "faq", name: "FAQ", shape: "set",
  description: "A title (Frequently asked questions) and an optional one-line note on the left; up to 6 question-and-answer pairs on the right, each question in bold over a short answer of up to two lines. 4 or fewer pairs sit in one column; 5 or 6 split into two columns, one type step smaller so they still fit. For client objections, announcements, policy changes and trainings.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 40, maxLines: 3 }, { slot: "note", maxChars: 80, maxLines: 2 },
    { slot: "pairs", maxItems: 6 }, { slot: "pair.question", maxChars: 56, maxLines: 1 }, { slot: "pair.answer", maxChars: 120, maxLines: 2 },
  ],
};

const LEFT = g(64); // 512
const GUTTER = g(12); // 96
const LINE = onBg("rgba(0,0,0,0.12)", "rule");

/** Approved in the Studio 2026-11-09 (revision 1). Built to the Studio rules (src/studio/STUDIO.md). */
export function Faq({ title, note, pairs }: FaqProps) {
  const list = pairs.slice(0, 6);
  const two = list.length > 4;
  // Two columns are half as wide, so the pair steps down one size (question lead → body, answer body → caption).
  const q = two ? "body" : "lead";
  const a = two ? "caption" : "body";
  const half = two ? Math.ceil(list.length / 2) : list.length;
  const cols = two ? [list.slice(0, half), list.slice(half)] : [list];
  return (
    <>
      <Band gap={pair(g(3))} style={{ width: LEFT }}>
        <h2 style={{ margin: 0, ...type("h2", 600, "#204680"), ...keepBreaks }}>{title}</h2>
        {note && <p style={{ margin: 0, ...type("body", 500, "#545454"), ...keepBreaks }}>{note}</p>}
      </Band>
      <Band style={{ left: SAFE.left + LEFT + GUTTER, width: SAFE.width - LEFT - GUTTER }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))`, columnGap: g(8), alignItems: "start" }}>
          {cols.map((col, c) => (
            <div key={c} style={{ display: "flex", flexDirection: "column" }}>
              {col.map((p, i) => (
                <div key={i} style={{
                  display: "flex", flexDirection: "column", gap: g(2), padding: `${two ? g(4) : g(3)}px 0`,
                  borderTop: i === 0 ? undefined : `1px solid ${LINE}`,
                  ...(i === 0 ? { paddingTop: 0 } : {}), ...(i === col.length - 1 ? { paddingBottom: 0 } : {}),
                }}>
                  <span style={{ ...type(q, 700, "#204680"), ...(two ? keepBreaks : noWrap) }}>{p.question}</span>
                  <span style={{ ...type(a, 400, "#545454"), ...keepBreaks }}>{p.answer}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Band>
    </>
  );
}
