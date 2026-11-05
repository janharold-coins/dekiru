import { Band, BAND, g, gap, pair, SAFE, type } from "@/studio/grid";
import { onBg } from "../theme";
import { keepBreaks, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface BulletItem {
  text: string;
  /** Optional one-line sub-point under the bullet. */
  sub?: string;
}
export interface BulletsProps {
  eyebrow?: string;
  title: string;
  /** 3 to 6. */
  bullets: BulletItem[];
  /** Optional small image or icon on the right. Without it, bullets take the full width. */
  image?: string;
}

export const bulletsMeta: PatternMeta = {
  id: "bullets", name: "Title and bullets", shape: "set",
  description: "The everyday content slide: optional eyebrow, a title of up to two lines, then 3 to 6 bullets, each with an optional one-line sub-point. An optional small image or icon sits on the right; without it the bullets take the full width. The block is centred between the logo and the footer.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 40, maxLines: 1 }, { slot: "title", maxChars: 60, maxLines: 2 },
    { slot: "bullets", maxItems: 6 }, { slot: "bullet.text", maxChars: 56, maxLines: 1 }, { slot: "bullet.sub", maxChars: 80, maxLines: 1 },
  ],
};

const IMAGE = g(64); // 512: the image box, square, on the right
const GUTTER = g(12); // 96
/** The dash sits on the middle of the first line's capitals (body cap height ≈ 0.72 × 32): optical, not on the grid. */
const DASH_TOP = Math.round(32 * 0.36 - 2);

/** Approved in the Studio 2026-11-05 (revision 1). Built to the Studio rules (src/studio/STUDIO.md). */
export function Bullets({ eyebrow, title, bullets, image }: BulletsProps) {
  const list = bullets.slice(0, 6);
  const withSubs = list.some((b) => b.sub);
  // Five or six bullets with sub-points need the tighter steps to stay inside the band.
  const tight = withSubs && list.length > 4;
  const step = tight ? g(2) : g(3);
  return (
    <>
      <Band gap={gap(g(6))} style={image ? { width: SAFE.width - IMAGE - GUTTER } : undefined}>
        <div style={{ display: "flex", flexDirection: "column", gap: pair(g(3)) }}>
          {eyebrow && <span style={{ ...type("caption", 600, "#757575"), ...noWrap }}>{eyebrow}</span>}
          <h2 style={{ margin: 0, ...type("h2", 600, "#204680"), ...keepBreaks }}>{title}</h2>
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: step }}>
          {list.map((b, i) => (
            <li key={i} style={{ display: "flex", gap: g(3), alignItems: "flex-start" }}>
              <span aria-hidden style={{ flex: "none", width: g(3), height: g(0.5), marginTop: DASH_TOP, borderRadius: 2, background: onBg("#fa7312", "accent") }} />
              <div style={{ display: "flex", flexDirection: "column", gap: tight ? g(0.5) : g(1), minWidth: 0 }}>
                <span style={{ ...type("body", 500), ...keepBreaks }}>{b.text}</span>
                {b.sub && <span style={{ ...type("caption", 400, "#757575"), ...keepBreaks }}>{b.sub}</span>}
              </div>
            </li>
          ))}
        </ul>
      </Band>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" src={image} style={{ position: "absolute", left: SAFE.right - IMAGE, top: BAND.top + (BAND.height - IMAGE) / 2, width: IMAGE, height: IMAGE, objectFit: "contain", borderRadius: g(3) }} />
      )}
    </>
  );
}
