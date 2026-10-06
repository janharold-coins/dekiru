import { LogoItem, type LogoData } from "../components/LogoItem";
import { t } from "../tokens";
import type { PatternMeta } from "../types";

export interface LogoGroup { group: string; header: string; logos: LogoData[] }
export interface LogoWallProps { title: string; body: string; groups: LogoGroup[] }

export const logoWallMeta: PatternMeta = {
  id: "logo-wall", name: "Logo wall", shape: "set",
  description: "Pitch left; dark rounded panel right with partner logos grouped under small headers.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "groups", maxItems: 4 }, { slot: "body", maxChars: 330, maxLines: 10 }],
};

/** Geometry of the four group panels inside the dark card (Figma), with header style and logo-flow gaps. */
const SLOTS = [
  { left: 644, top: 121, w: 1177, h: 389, header: t(28, 1.4, -0.42, 700, "#fff"), alpha: 0.4, pad: "28px 28px 24px", gap: "36px 36px" },
  { left: 644, top: 534, w: 639, h: 242, header: t(20, 1.4, -0.3, 600, "#fff"), alpha: 0.2, pad: "24px 46px 20px", gap: "36px 42px" },
  { left: 644, top: 800, w: 639, h: 187, header: t(20, 1.4, -0.3, 700, "#fff"), alpha: 0.2, pad: "16px 96px 16px", gap: "20px 42px" },
  { left: 1307, top: 534, w: 514, h: 453, header: t(20, 1.4, -0.3, 700, "#fff"), alpha: 0.2, pad: "28px 45px 24px", gap: "48px 42px" },
];

export function LogoWall({ title, body, groups }: LogoWallProps) {
  return (
    <>
      <h1 style={{ position: "absolute", left: 79, top: 225, margin: 0, ...t(72, 1.15, -2.16, 600, "#204680") }}>{title}</h1>
      <p style={{ position: "absolute", left: 79, top: 332, width: 497, margin: 0, ...t(36, 1.4, -1.08, 600) }}>{body}</p>
      <div
        style={{
          position: "absolute", left: 616, top: 83, width: 1233, height: 941, borderRadius: "12px 12px 210px 12px",
          backgroundImage: "linear-gradient(193.9064deg, rgb(19,27,38) 8.7004%, rgb(128,63,17) 20.704%, rgb(32,70,128) 29.938%, rgb(19,27,38) 83.249%, rgb(30,27,27) 104.73%)",
          boxShadow: "inset 0 -24px 24px rgba(0,0,0,0.25)",
        }}
      />
      {groups.slice(0, 4).map((g, i) => {
        const s = SLOTS[i];
        return (
          <fieldset
            key={g.group}
            style={{
              position: "absolute", left: s.left, top: s.top, width: s.w, height: s.h, margin: 0, boxSizing: "border-box",
              border: `1px solid rgba(255,255,255,${s.alpha})`, borderRadius: 12, padding: s.pad,
              display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", alignContent: "center", gap: s.gap,
            }}
          >
            <legend style={{ ...s.header, padding: "0 16px", margin: "0 auto", textAlign: "center" }}>{g.header}</legend>
            {g.logos.map((l, j) => <LogoItem key={j} logo={l} />)}
          </fieldset>
        );
      })}
    </>
  );
}
