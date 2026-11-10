import { Band, g, gap, pair, SAFE, type } from "@/studio/grid";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";
import { scaleSizes } from "@/studio/scales";

export interface GlossaryTerm {
  term: string;
  /** Plain-language definition, one or two lines. */
  definition: string;
  /** Optional small tag: Payments, Crypto. */
  tag?: string;
}
export interface GlossaryProps {
  eyebrow?: string;
  title: string;
  /** Up to 8, in two columns (filled top to bottom, left column first). */
  terms: GlossaryTerm[];
}

export const glossaryMeta: PatternMeta = {
  id: "glossary", name: "Glossary", shape: "set",
  description: "Optional eyebrow and a title (Key terms) on the left; up to 8 terms on the right in two columns, each term in bold with an optional small tag (Payments, Crypto) and a one or two-line plain-language definition under it. For trainings, onboarding, client enablement and the appendix of sales decks.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 32, maxLines: 1 }, { slot: "title", maxChars: 32, maxLines: 3 },
    { slot: "terms", maxItems: 8 }, { slot: "term.term", maxChars: 18, maxLines: 1 }, { slot: "term.tag", maxChars: 10, maxLines: 1 },
    { slot: "term.definition", maxChars: 72, maxLines: 2 },
  ],
};

const LEFT = g(56); // 448
const GUTTER = g(12); // 96
const COL_GAP = g(8); // 64
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;
/** Perfect Fifth scale, from the Tune line on revision 1 (h2 72/88, lead 39/56, body 32/48, caption 26/40). */
const SIZES = scaleSizes("fifth");
/** Revision 2 (more room): 24 between a term and its definition; terms 48 apart, 40 when a column holds 4. */
const PAIR = g(3);

function Tag({ children }: { children: string }) {
  return (
    <span style={{ flex: "none", padding: `${g(1)}px ${g(2)}px`, borderRadius: g(5), background: "rgba(32,70,128,0.08)" }}>
      <span style={{ ...type("micro", 600, "#204680", undefined, SIZES), ...noWrap, ...LETTERS, display: "block" }}>{children}</span>
    </span>
  );
}

/** Approved in the Studio 2026-11-09 (revision 2). Built to the Studio rules (src/studio/STUDIO.md). */
export function Glossary({ eyebrow, title, terms }: GlossaryProps) {
  const list = terms.slice(0, 8);
  const half = Math.ceil(list.length / 2);
  const cols = [list.slice(0, half), list.slice(half)];
  const between = half > 3 ? g(5) : g(6);
  return (
    <>
      <Band gap={pair(g(3))} style={{ width: LEFT }}>
        {eyebrow && <span style={{ ...type("caption", 600, "#757575", undefined, SIZES), ...noWrap }}>{eyebrow}</span>}
        <h2 style={{ margin: 0, ...type("h2", 600, "#204680", undefined, SIZES), ...keepBreaks }}>{title}</h2>
      </Band>
      <Band style={{ left: SAFE.left + LEFT + GUTTER, width: SAFE.width - LEFT - GUTTER }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", columnGap: COL_GAP, alignItems: "start" }}>
          {cols.map((col, c) => (
            <dl key={c} style={{ margin: 0, display: "flex", flexDirection: "column", gap: gap(between) }}>
              {col.map((t, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: pair(PAIR) }}>
                  <dt style={{ display: "flex", flexWrap: "wrap", alignItems: "center", columnGap: g(2), rowGap: g(1) }}>
                    <span style={{ ...type("lead", 700, "#204680", undefined, SIZES), ...noWrap, ...LETTERS }}>{t.term}</span>
                    {t.tag && <Tag>{t.tag}</Tag>}
                  </dt>
                  <dd style={{ margin: 0, ...type("body", 400, "#545454", undefined, SIZES), ...keepBreaks }}>{t.definition}</dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
      </Band>
    </>
  );
}
