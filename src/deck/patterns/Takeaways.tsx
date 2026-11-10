import { Band, BAND, g, gap, pair, type } from "@/studio/grid";
import { scaleSizes } from "@/studio/scales";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface Takeaway {
  /** The takeaway, short and bold. */
  text: string;
  /** Optional one-line explanation. */
  detail?: string;
}
export interface TakeawaysProps {
  eyebrow?: string;
  title: string;
  /** 3 to 5, numbered. */
  takeaways: Takeaway[];
}

export const takeawaysMeta: PatternMeta = {
  id: "takeaways", name: "Key takeaways", shape: "sequence",
  description: "A calm closing slide for a section or a talk: optional eyebrow naming the session, a title (Key takeaways), then 3 to 5 numbered takeaways, each a bold short line with an optional one-line explanation, separated by hairlines.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 40, maxLines: 1 }, { slot: "title", maxChars: 40, maxLines: 1 },
    { slot: "takeaways", maxItems: 5 }, { slot: "takeaway.text", maxChars: 64, maxLines: 1 }, { slot: "takeaway.detail", maxChars: 110, maxLines: 1 },
  ],
};

const NUM = g(12); // 96: the number column
/** Perfect Fifth scale, from the Tune line on revision 1 (h2 72/88, lead 39/56, body 32/48, caption 26/40). */
const SIZES = scaleSizes("fifth");
/** Element spacing 64 and pairs 32, from the same Tune line. */
const GAP = g(8);
const PAIR = g(4);

/**
 * Spacing that fits: space above and below each takeaway (between it and the hairlines) is 32 when the list has
 * room and steps down by 8 when 4 or 5 takeaways with explanations would run out of the band. Below 16, the
 * header tightens instead (gap 48, pair 16), so the rows keep 16. Heights are the measured visible ones.
 */
function spacing(rows: number, withDetail: boolean, withEyebrow: boolean) {
  const row = (withDetail ? 40 + g(1) + 27 : 40) + 1; // lead line, 8, caption line, hairline
  const fit = (gapPx: number, pairPx: number) => {
    const header = (withEyebrow ? 27 + pairPx : 0) + 74 + gapPx; // eyebrow, title and the gap under it
    return Math.floor((BAND.height - header - rows * row) / rows / 2 / 8) * 8;
  };
  const roomy = fit(GAP, PAIR);
  if (roomy >= g(2)) return { pad: Math.min(g(4), roomy), gap: GAP, pair: PAIR };
  return { pad: Math.max(g(1), Math.min(g(2), fit(g(6), g(2)))), gap: g(6), pair: g(2) };
}

/** Approved in the Studio 2026-11-09 (revision 2). Built to the Studio rules (src/studio/STUDIO.md). */
export function Takeaways({ eyebrow, title, takeaways }: TakeawaysProps) {
  const list = takeaways.slice(0, 5);
  const { pad, gap: gapPx, pair: pairPx } = spacing(list.length, list.some((t) => t.detail), Boolean(eyebrow));
  return (
    <Band gap={gap(gapPx)}>
      <div style={{ display: "flex", flexDirection: "column", gap: pair(pairPx) }}>
        {eyebrow && <span style={{ ...type("caption", 600, "#757575", undefined, SIZES), ...noWrap }}>{eyebrow}</span>}
        <h2 style={{ margin: 0, ...type("h2", 600, "#204680", undefined, SIZES), ...noWrap }}>{title}</h2>
      </div>
      <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {list.map((t, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", padding: `${pad}px 0`, borderTop: `1px solid ${onBg("rgba(0,0,0,0.12)", "rule")}`, ...(i === list.length - 1 ? { borderBottom: `1px solid ${onBg("rgba(0,0,0,0.12)", "rule")}` } : {}) }}>
            <span style={{ width: NUM, flex: "none", ...type("lead", 600, undefined, "numeral", SIZES), color: onBg("#fa7312", "accent"), ...noWrap }}>{String(i + 1).padStart(2, "0")}</span>
            <div style={{ display: "flex", flexDirection: "column", gap: g(1), minWidth: 0 }}>
              <span style={{ ...type("lead", 700, undefined, undefined, SIZES), ...keepBreaks }}>{t.text}</span>
              {t.detail && <span style={{ ...type("caption", 400, "#545454", undefined, SIZES), ...keepBreaks }}>{t.detail}</span>}
            </div>
          </li>
        ))}
      </ol>
    </Band>
  );
}
