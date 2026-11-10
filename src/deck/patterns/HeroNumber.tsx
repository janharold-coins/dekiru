import { Band, g, gap, pair, SourceNote, type } from "@/studio/grid";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface HeroNumberProps {
  eyebrow?: string;
  /** The figure, as written: 2.4M, 98%, PHP 1.2B. */
  value: string;
  /** What the figure is, in a few words. */
  label: string;
  /** Optional one-line context or comparison (up from 1.8M last year). */
  context?: string;
  /** Optional source note, in the footer row on the right. */
  source?: string;
}

export const heroNumberMeta: PatternMeta = {
  id: "hero-number", name: "Hero number", shape: "statement",
  description: "One very large figure as the whole slide, on the dark navy background with the brand glow: optional eyebrow above in gold, the figure in a white-to-orange gradient over a warm spotlight, a short label under it and an optional one-line context or comparison (up from 1.8M last year). Centred. Optional source note in the footer row. For one proof point, the metric that matters, or a striking fact in a training.",
  defaultChrome: { background: "dark-navy", overlay: true, logo: "white", footer: "bottom-left", accentBar: false },
  budgets: [
    { slot: "eyebrow", maxChars: 40, maxLines: 1 }, { slot: "value", maxChars: 8, maxLines: 1 },
    { slot: "label", maxChars: 48, maxLines: 1 }, { slot: "context", maxChars: 80, maxLines: 2 }, { slot: "source", maxChars: 90, maxLines: 1 },
  ],
};

/** The figure: twice the display step (asked for: "one very large figure"). Line height on the grid. */
const HERO = { size: 240, line: 256, track: -0.04 };
const GOLD = "#efa023";
/** White at the top of the letters, warming to the brand orange at the bottom (revision 2). */
const FIGURE_FILL = "linear-gradient(180deg, #ffffff 8%, #ffd9b8 48%, #fa7312 92%)";

export function HeroNumber({ eyebrow, value, label, context, source }: HeroNumberProps) {
  return (
    <>
      {/* A warm spotlight behind the figure and a cool wash at the top: deliberate background layers */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 720px 400px at 960px 520px, rgba(250,115,18,0.30), rgba(250,115,18,0) 70%), radial-gradient(ellipse 1200px 480px at 960px 0px, rgba(31,122,255,0.22), rgba(31,122,255,0) 72%)" }} />
      <Band gap={gap(g(5))} style={{ alignItems: "center", textAlign: "center" }}>
        {eyebrow && <span style={{ ...type("caption", 700, GOLD), ...noWrap, letterSpacing: "0.08em", textTransform: "uppercase" }}>{eyebrow}</span>}
        <span style={{
          ...type("display", 700, undefined, "numeral"), ...noWrap,
          fontSize: HERO.size, lineHeight: `calc(${HERO.line}px * var(--dk-lh, 1))`, letterSpacing: HERO.size * HERO.track,
          backgroundImage: FIGURE_FILL, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          filter: "drop-shadow(0 16px 48px rgba(250,115,18,0.35))",
        }}>{value}</span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: pair(g(3)), maxWidth: g(140) }}>
          <span style={{ ...type("h3", 600, "#ffffff"), ...noWrap }}>{label}</span>
          {context && <span style={{ ...type("lead", 500, "rgba(255,255,255,0.72)"), ...keepBreaks }}>{context}</span>}
        </div>
      </Band>
      {source && <SourceNote><span style={{ color: "rgba(255,255,255,0.56)" }}>{source}</span></SourceNote>}
    </>
  );
}
