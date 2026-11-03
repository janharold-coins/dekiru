import { Band, g, gap, pair, QuoteMark, type } from "@/studio/grid";
import { scaleSizes } from "@/studio/scales";
import { onBg } from "../theme";
import { keepBreaks, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface ClientQuoteProps {
  eyebrow: string;
  quote: string;
  name: string;
  role: string;
}

export const clientQuoteMeta: PatternMeta = {
  id: "client-quote", name: "Client quote", shape: "statement",
  description: "One client's words, large, with who said it. Eyebrow names the topic; the quote takes up to four lines. The block is centred between the logo and the footer.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "eyebrow", maxChars: 40, maxLines: 1 }, { slot: "quote", maxChars: 170, maxLines: 4 }, { slot: "name", maxChars: 40, maxLines: 1 }, { slot: "role", maxChars: 60, maxLines: 1 }],
};

/** Approved in the Studio with the Golden Ratio scale (h2 84/104, body 32/48, caption 25/40). */
const SIZES = scaleSizes("golden");

/**
 * Built to the Studio rules (src/studio/STUDIO.md): one centred block, every gap 32 measured between visible
 * edges (text is trimmed to cap height and its descender line), so the mark and the rule each sit with equal
 * space above and below. Name and role pair at 16.
 */
export function ClientQuote({ eyebrow, quote, name, role }: ClientQuoteProps) {
  return (
    <Band gap={gap(g(4))}>
      <span style={{ ...type("caption", 600, "#757575", undefined, SIZES), ...noWrap }}>{eyebrow}</span>
      <QuoteMark height={g(6)} color={onBg("#fa7312", "accent")} />
      <p style={{ margin: 0, ...type("h2", 600, "#204680", undefined, SIZES), ...keepBreaks }}>{quote}</p>
      <div style={{ width: g(10), height: g(0.5), background: onBg("#fa7312", "accent") }} />
      <div style={{ display: "flex", flexDirection: "column", gap: pair(g(2)) }}>
        <span style={{ ...type("body", 700, undefined, undefined, SIZES), ...noWrap }}>{name}</span>
        <span style={{ ...type("caption", 500, "#757575", undefined, SIZES), ...noWrap }}>{role}</span>
      </div>
    </Band>
  );
}
