import { t, keepBreaks, noWrap } from "@/deck/tokens";
import { onBg } from "@/deck/theme";
import type { PatternMeta } from "@/deck/types";

export interface ClientQuoteProps {
  eyebrow: string;
  quote: string;
  name: string;
  role: string;
}

export const clientQuoteMeta: PatternMeta = {
  id: "client-quote", name: "Client quote", shape: "statement",
  description: "One client's words, large, with who said it. Eyebrow names the topic; the quote takes up to four lines.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "eyebrow", maxChars: 40, maxLines: 1 }, { slot: "quote", maxChars: 170, maxLines: 4 }, { slot: "name", maxChars: 40, maxLines: 1 }, { slot: "role", maxChars: 60, maxLines: 1 }],
};

/** Quote mark and text sit on one left edge; the attribution hangs under a short rule, clear of the footer (938). */
export function ClientQuote({ eyebrow, quote, name, role }: ClientQuoteProps) {
  return (
    <>
      <span style={{ position: "absolute", left: 150, top: 240, ...t(32, 1.4, -0.32, 600, "#757575"), ...noWrap }}>{eyebrow}</span>
      <span aria-hidden style={{ position: "absolute", left: 140, top: 270, ...t(260, 1, 0, 600, "#fa7312", "everett") }}>“</span>
      <p style={{ position: "absolute", left: 150, top: 450, width: 1560, margin: 0, ...t(72, 1.25, -2.16, 600, "#204680"), ...keepBreaks }}>{quote}</p>
      <div style={{ position: "absolute", left: 150, top: 770, width: 80, height: 4, background: onBg("#fa7312", "accent") }} />
      <span style={{ position: "absolute", left: 150, top: 796, ...t(36, 1.4, -0.72, 700), ...noWrap }}>{name}</span>
      <span style={{ position: "absolute", left: 150, top: 846, ...t(30, 1.4, -0.3, 500, "#757575"), ...noWrap }}>{role}</span>
    </>
  );
}
