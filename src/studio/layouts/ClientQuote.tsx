import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";
import { Band, g, type } from "../grid";

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

/** Studio rules: one centred block on the 8-point grid. Eyebrow + mark, the quote (h2), then the attribution under a short rule. */
export function ClientQuote({ eyebrow, quote, name, role }: ClientQuoteProps) {
  return (
    <Band gap={g(5)}>
      <div style={{ display: "flex", flexDirection: "column", gap: g(2) }}>
        <span style={{ ...type("caption", 600, "#757575"), ...noWrap }}>{eyebrow}</span>
        <span aria-hidden style={{ ...type("h1", 600, "#fa7312", "everett"), height: g(8), overflow: "hidden" }}>“</span>
      </div>
      <p style={{ margin: 0, ...type("h2", 600, "#204680"), ...keepBreaks }}>{quote}</p>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {/* A 4px rule at the top of a g(4) row, so the name starts on the grid. */}
        <div style={{ width: g(10), height: g(4), boxSizing: "border-box", borderTop: `${g(0.5)}px solid ${onBg("#fa7312", "accent")}` }} />
        <span style={{ ...type("body", 700), ...noWrap }}>{name}</span>
        <span style={{ ...type("caption", 500, "#757575"), ...noWrap }}>{role}</span>
      </div>
    </Band>
  );
}
