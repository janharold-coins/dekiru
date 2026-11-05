import { createElement } from "react";
import { Band, g, gap, type } from "@/studio/grid";
import { keepBreaks, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface DoDontProps {
  title: string;
  /** Column headings, "Do" and "Don't" unless changed (or translated). */
  doLabel: string;
  dontLabel: string;
  /** Up to 4 short items each. */
  dos: string[];
  donts: string[];
  /** Optional example image at the top of each column (e.g. a correct and an incorrect screen). */
  doImage?: string;
  dontImage?: string;
}

export const doDontMeta: PatternMeta = {
  id: "do-dont", name: "Do and don't", shape: "comparison",
  description: "Title on top; two equal columns below: Do, marked with a check, and Don't, marked with a cross, each with up to 4 short items. Each column can open with an example image (a correct and an incorrect screen, say); use both or neither so the columns line up.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 56, maxLines: 1 }, { slot: "doLabel", maxChars: 16, maxLines: 1 }, { slot: "dontLabel", maxChars: 16, maxLines: 1 },
    { slot: "dos", maxItems: 4 }, { slot: "donts", maxItems: 4 }, { slot: "dos.item", maxChars: 48, maxLines: 1 }, { slot: "donts.item", maxChars: 48, maxLines: 1 },
  ],
};

const TONE = { do: "#15803d", dont: "#dc2626" };
const BODY_CAP_MID = Math.round(32 * 0.36); // middle of a body line's capitals, for the item marks (optical)
const H3_CAP_MID = Math.round(48 * 0.36); // and of the heading's, for the round mark beside it

/** The check or the cross as a shape with an exact box. */
function Mark({ kind, size, color, stroke }: { kind: "do" | "dont"; size: number; color: string; stroke: number }) {
  const d = kind === "do" ? "M5 12.5l4.5 4.5L19 7.5" : "M6.5 6.5l11 11M17.5 6.5l-11 11";
  return createElement("svg", { "aria-hidden": true, viewBox: "0 0 24 24", width: size, height: size, style: { display: "block", flex: "none" } },
    createElement("path", { d, fill: "none", stroke: color, strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" }));
}

function Column({ kind, label, items, image }: { kind: "do" | "dont"; label: string; items: string[]; image?: string }) {
  const tone = TONE[kind];
  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: g(4), paddingTop: g(4), borderTop: `${g(0.5)}px solid ${tone}` }}>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" src={image} style={{ display: "block", width: "100%", height: g(24), objectFit: "cover", objectPosition: "center", borderRadius: g(2) }} />
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: g(2) }}>
        <span style={{ width: g(6), height: g(6), marginTop: H3_CAP_MID - g(3), borderRadius: "50%", background: tone, display: "grid", placeItems: "center", flex: "none" }}>
          <Mark kind={kind} size={g(4)} color="#ffffff" stroke={3} />
        </span>
        <span style={{ ...type("h3", 700), color: tone, ...noWrap }}>{label}</span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: g(3) }}>
        {items.slice(0, 4).map((it, i) => (
          <li key={i} style={{ display: "flex", gap: g(2), alignItems: "flex-start" }}>
            <span style={{ marginTop: BODY_CAP_MID - g(1.5) }}><Mark kind={kind} size={g(3)} color={tone} stroke={3} /></span>
            <span style={{ ...type("body", 500), ...keepBreaks, minWidth: 0 }}>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Approved in the Studio 2026-11-05 (revision 1). Built to the Studio rules (src/studio/STUDIO.md). */
export function DoDont({ title, doLabel, dontLabel, dos, donts, doImage, dontImage }: DoDontProps) {
  return (
    <Band gap={gap(g(6))}>
      <h2 style={{ margin: 0, ...type("h2", 600, "#204680"), ...noWrap }}>{title}</h2>
      <div style={{ display: "flex", gap: g(10) }}>
        <Column kind="do" label={doLabel} items={dos} image={doImage} />
        <Column kind="dont" label={dontLabel} items={donts} image={dontImage} />
      </div>
    </Band>
  );
}
