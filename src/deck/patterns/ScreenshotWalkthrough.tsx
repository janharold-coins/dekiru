import { Band, BAND, g, gap, pair, SAFE, type } from "@/studio/grid";
import { onBg } from "../theme";
import { keepBreaks, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface Callout {
  /** Where the marker sits on the screenshot, in % of its width and height (0 to 100). */
  x: number;
  y: number;
  title: string;
  /** One line explaining it. */
  text: string;
}
export interface ScreenshotWalkthroughProps {
  eyebrow?: string;
  title?: string;
  /** The screenshot or phone mockup. */
  image: string;
  /** Which side the screenshot sits on; the legend takes the other. */
  side?: "left" | "right";
  /** Up to 5, numbered in order. */
  callouts: Callout[];
}

export const screenshotWalkthroughMeta: PatternMeta = {
  id: "screenshot-walkthrough", name: "Screenshot walkthrough", shape: "sequence",
  placeable: ["callouts"],
  description: "One large screenshot or phone mockup on one side with up to 5 numbered markers placed on it, and a matching numbered legend on the other side: a short title and one line per number. Optional eyebrow and title above the legend. Drag a marker on the editor canvas to place it (arrow keys nudge it); it is kept in % of the image, so it stays on its spot at any image size.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 40, maxLines: 1 }, { slot: "title", maxChars: 50, maxLines: 2 },
    { slot: "callouts", maxItems: 5 }, { slot: "callout.title", maxChars: 32, maxLines: 1 }, { slot: "callout.text", maxChars: 56, maxLines: 1 },
  ],
};

const IMG = g(126); // 1008: the screenshot's box; the image fits inside it, keeping its shape
const GUTTER = g(10); // 80
const LEGEND = SAFE.width - IMG - GUTTER; // 672
const ACCENT = onBg("#fa7312", "accent");
/** The number badge is centred on the middle of the title's capitals (body cap height ≈ 0.72 × 32): optical. */
const BADGE = g(5);
const BADGE_TOP = Math.round(32 * 0.36 - BADGE / 2);

function Badge({ n, size, ring }: { n: number; size: number; ring?: boolean }) {
  return (
    <span style={{
      flex: "none", width: size, height: size, borderRadius: "50%", background: ACCENT, display: "grid", placeItems: "center",
      boxSizing: "border-box", border: ring ? `${g(0.5)}px solid #ffffff` : undefined, boxShadow: ring ? "0 4px 16px rgba(0,0,0,0.24)" : undefined,
    }}>
      <span style={{ ...type("caption", 700, "#ffffff", "numeral"), color: "#ffffff", textBox: "trim-both cap alphabetic", ...noWrap }}>{n}</span>
    </span>
  );
}

/** Approved in the Studio 2026-11-05 (revision 2, drag-to-place). Built to the Studio rules (src/studio/STUDIO.md). */
export function ScreenshotWalkthrough({ eyebrow, title, image, side = "left", callouts }: ScreenshotWalkthroughProps) {
  const list = callouts.slice(0, 5);
  const imgLeft = side === "left" ? SAFE.left : SAFE.right - IMG;
  const legendLeft = side === "left" ? SAFE.left + IMG + GUTTER : SAFE.left;
  return (
    <>
      <div style={{ position: "absolute", left: imgLeft, top: BAND.top, width: IMG, height: BAND.height, display: "flex", alignItems: "center", justifyContent: side === "left" ? "flex-start" : "flex-end" }}>
        <div data-dk-place-frame="" style={{ position: "relative", lineHeight: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" src={image} style={{ display: "block", maxWidth: IMG, maxHeight: BAND.height, borderRadius: g(2), boxShadow: "0 8px 32px rgba(0,0,0,0.12)" }} />
          {list.map((c, i) => (
            <div key={i} data-dk-place={`callouts.${i}`} style={{ position: "absolute", left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%, -50%)" }}>
              <Badge n={i + 1} size={g(6)} ring />
            </div>
          ))}
        </div>
      </div>
      <Band gap={gap(g(6))} style={{ left: legendLeft, width: LEGEND }}>
        {(eyebrow || title) && (
          <div style={{ display: "flex", flexDirection: "column", gap: pair(g(3)) }}>
            {eyebrow && <span style={{ ...type("caption", 600, "#757575"), ...noWrap }}>{eyebrow}</span>}
            {title && <h2 style={{ margin: 0, ...type("h3", 600, "#204680"), ...keepBreaks }}>{title}</h2>}
          </div>
        )}
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: g(4) }}>
          {list.map((c, i) => (
            <li key={i} style={{ display: "flex", gap: g(3), alignItems: "flex-start" }}>
              <span style={{ marginTop: BADGE_TOP }}><Badge n={i + 1} size={BADGE} /></span>
              <div style={{ display: "flex", flexDirection: "column", gap: g(1), minWidth: 0 }}>
                <span style={{ ...type("body", 700), ...keepBreaks }}>{c.title}</span>
                <span style={{ ...type("caption", 400, "#545454"), ...keepBreaks }}>{c.text}</span>
              </div>
            </li>
          ))}
        </ol>
      </Band>
    </>
  );
}
