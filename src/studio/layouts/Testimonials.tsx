import { Band, g, gap, pair, QuoteMark, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface Testimonial {
  quote: string;
  name: string;
  /** Role and company. */
  role: string;
  /** Optional round photo or logo; without one, initials. */
  photo?: string;
}
export interface TestimonialsProps {
  eyebrow?: string;
  title: string;
  /** 2 to 4. */
  quotes: Testimonial[];
  /** One card shown larger (0-based), in the accent. */
  featured?: number;
}

export const testimonialsMeta: PatternMeta = {
  id: "testimonials", name: "Testimonial grid", shape: "set",
  description: "Optional eyebrow and a title on top; 2 to 4 short quotes below as cards, each with the quote, the person's name, their role and company, and a round photo or logo (initials without one). With up to 3 quotes, one card can be featured: it takes twice the width, a larger quote and the accent. For what clients say, shout-outs from colleagues and learner feedback. Use real quotes only, with permission.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 40, maxLines: 1 }, { slot: "title", maxChars: 48, maxLines: 1 },
    { slot: "quotes", maxItems: 4 }, { slot: "quote.quote", maxChars: 90, maxLines: 6 },
    { slot: "quote.name", maxChars: 28, maxLines: 2 }, { slot: "quote.role", maxChars: 36, maxLines: 2 },
  ],
};

const NAVY = "#204680";
const ACCENT = onBg("#fa7312", "accent");
const LINE = onBg("rgba(0,0,0,0.12)", "rule");
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;
const AVATAR = g(6); // 48

/** Quotes set tighter than running text (×1.25, on the grid): 32/40, and 40/48 when featured. */
const quoteLine = (big: boolean) => `calc(${big ? g(6) : g(5)}px * var(--dk-lh, 1))`;

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export function Testimonials({ eyebrow, title, quotes, featured }: TestimonialsProps) {
  const list = quotes.slice(0, 4);
  // A featured card takes twice the width; with 4 quotes there is no room for one, so all four stay equal.
  const feat = list.length <= 3 ? featured : undefined;
  const cols = list.map((_, i) => (i === feat ? "2fr" : "1fr")).join(" ");
  return (
    <Band gap={gap(g(6))}>
      <div style={{ display: "flex", flexDirection: "column", gap: pair(g(3)) }}>
        {eyebrow && <span style={{ ...type("caption", 600, "#757575"), ...noWrap }}>{eyebrow}</span>}
        <h2 style={{ margin: 0, ...type("h2", 600, NAVY), ...noWrap }}>{title}</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: cols, gap: g(4), alignItems: "stretch" }}>
        {list.map((q, i) => {
          const big = i === feat;
          return (
            <figure key={i} style={{
              margin: 0, padding: g(4), borderRadius: g(3), display: "flex", flexDirection: "column", justifyContent: "space-between", gap: g(4), minWidth: 0,
              border: `2px solid ${big ? ACCENT : LINE}`, background: big ? "rgba(250,115,18,0.06)" : "#ffffff",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: g(3) }}>
                <QuoteMark height={g(4)} color={big ? ACCENT : "#9aa3b2"} />
                <blockquote style={{ margin: 0, ...type(big ? "lead" : "body", 500, NAVY), lineHeight: quoteLine(big), ...keepBreaks }}>{q.quote}</blockquote>
              </div>
              <figcaption style={{ display: "flex", alignItems: "center", gap: g(2) }}>
                {q.photo
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={q.photo} alt="" width={AVATAR} height={AVATAR} style={{ borderRadius: "50%", objectFit: "cover", flex: "none" }} />
                  : <span style={{ width: AVATAR, height: AVATAR, flex: "none", borderRadius: "50%", background: big ? ACCENT : NAVY, display: "grid", placeItems: "center" }}>
                      <span style={{ ...type("caption", 700, "#ffffff"), ...noWrap, ...LETTERS }}>{initials(q.name)}</span>
                    </span>}
                <span style={{ display: "flex", flexDirection: "column", gap: g(1), minWidth: 0 }}>
                  <span style={{ ...type("caption", 700), ...keepBreaks }}>{q.name}</span>
                  <span style={{ ...type("caption", 400, "#545454"), ...keepBreaks }}>{q.role}</span>
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </Band>
  );
}
