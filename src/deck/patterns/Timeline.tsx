import { t, keepBreaks, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface TimelineItem {
  year: string; yearColor?: string;
  side: "right" | "left" | "both" | "right-bracket" | "bracket-end";
  text?: string; leftText?: string; caption?: string; captionTracking?: number;
  bracketGroup?: string; y: number; markerY: number;
}
export interface TimelineProps {
  title: string; subtitle: string; items: TimelineItem[];
  flags?: { code: string; file: string; x: number; y: number }[];
}

export const timelineMeta: PatternMeta = {
  id: "timeline", name: "Timeline", shape: "sequence",
  description: "Pitch left; vertical year axis right with milestones on either side and an optional flag track.",
  defaultChrome: { background: "light", overlay: true, overlayOpacity: 0.3, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "items", maxItems: 9 }, { slot: "item.text", maxChars: 52, maxLines: 2 }],
};

const AXIS_X = 1242;
const YEAR_X = 1152;
const DESC_X = YEAR_X + 233; // year box + 170 gap
const CAPTION_DY: Record<string, number> = { "2026": 67, "2025": 68, "2015": 75 };

export function Timeline({ title, subtitle, items, flags = [] }: TimelineProps) {
  const year = (it: TimelineItem) => t(24, "normal", 0, 400, it.yearColor ?? "#17191d", "everett");
  const right = t(24, "normal", 0, 500);
  const left = t(24, "normal", 0, 700);
  const bracket = items.filter((i) => i.bracketGroup);
  return (
    <>
      <h1 style={{ position: "absolute", left: 79, top: 440, margin: 0, ...t(72, 1.15, -2.16, 600, "#204680"), ...noWrap }}>{title}</h1>
      <p style={{ position: "absolute", left: 79, top: 540, width: 578, margin: 0, ...t(48, 1.4, -1.44, 600) }}>{subtitle}</p>

      {/* flag track: three stacked pills */}
      <div style={{ position: "absolute", left: 1299, top: 137, width: 48, height: 204, borderRadius: "24px 24px 0 0", opacity: 0.2, background: "linear-gradient(to bottom, #f9f9f9 16.834%, #4f92a0 66.08%)" }} />
      {flags.filter((f) => ["sg", "hk"].includes(f.code)).map((f) => <Flag key={f.code} {...f} />)}
      <div style={{ position: "absolute", left: 1299, top: 278, width: 48, height: 297, borderRadius: "24px 24px 0 0", boxShadow: "0 -2px 8px rgba(0,0,0,0.15)", background: "linear-gradient(to bottom, #f6d8ef 0%, #94ccfe 51.771%)" }} />

      <div style={{ position: "absolute", left: AXIS_X, top: 160, width: 1, height: 920, background: "#9e9e9e" }} />

      {items.map((it, i) => {
        const yearEl = <span style={{ ...year(it), ...noWrap }}>{it.year}</span>;
        if (it.side === "right") {
          return (
            <div key={i} style={{ position: "absolute", left: YEAR_X, top: it.y, display: "flex", gap: it.year === "2015" ? 175 : 170 }}>
              {yearEl}
              <span style={{ ...right, ...keepBreaks }}>{it.text}</span>
            </div>
          );
        }
        if (it.side === "left") {
          return (
            <div key={i} style={{ position: "absolute", right: 1920 - (YEAR_X + 64), top: it.y, display: "flex", justifyContent: "flex-end", gap: 48 }}>
              <span style={{ ...left, textAlign: "right", ...keepBreaks }}>{it.text}</span>
              {yearEl}
            </div>
          );
        }
        if (it.side === "both") {
          return (
            <div key={i}>
              <div style={{ position: "absolute", right: 1920 - (YEAR_X + 64), top: it.y, display: "flex", gap: 48 }}>
                <span style={{ ...left, textAlign: "right", ...keepBreaks }}>{it.leftText}</span>
                {yearEl}
              </div>
              <span style={{ position: "absolute", left: DESC_X, top: it.y, ...right, ...keepBreaks }}>{it.text}</span>
            </div>
          );
        }
        // bracket entries: years stacked, one description
        return (
          <div key={i} style={{ position: "absolute", left: YEAR_X, top: it.y }}>
            {yearEl}
            {it.side === "right-bracket" && <span style={{ position: "absolute", left: 233, top: 16, ...right, ...keepBreaks, width: 300 }}>{it.text}</span>}
          </div>
        );
      })}

      {bracket.length === 2 && (
        <div style={{ position: "absolute", left: 1217, top: bracket[0].markerY + 6, width: 59, height: bracket[1].markerY - bracket[0].markerY, border: "1px dashed rgba(0,0,0,0.4)", borderLeft: "none", borderRadius: "0 24px 24px 0" }} />
      )}

      {items.map((it, i) =>
        it.caption ? (
          <span key={`c${i}`} style={{ position: "absolute", left: it.year === "2015" ? 1385 : 1388, top: it.y + (CAPTION_DY[it.year] ?? 67), ...t(18, "normal", it.captionTracking ?? 2.16, 600, "#6482a5"), ...noWrap }}>{it.caption}</span>
        ) : null,
      )}
      {items.map((it, i) => (
        <div key={`m${i}`} style={{ position: "absolute", left: 1236, top: it.markerY, width: 13, height: 13, borderRadius: "50%", background: "#1f7aff" }} />
      ))}

      <div style={{ position: "absolute", left: 1299, top: 429, width: 48, height: 667, borderRadius: "24px 24px 0 0", boxShadow: "0 -2px 8px rgba(0,0,0,0.15)", background: "linear-gradient(to bottom, #fff 33.137%, rgba(243,243,243,0) 97.133%)" }} />
      {flags.filter((f) => !["sg", "hk"].includes(f.code)).map((f) => <Flag key={f.code} {...f} />)}
    </>
  );
}

function Flag({ file, x, y }: { file: string; x: number; y: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" src={file} style={{ position: "absolute", left: x, top: y, width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />;
}
