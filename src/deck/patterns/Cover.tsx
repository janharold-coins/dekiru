import { t, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface CoverProps {
  title: string;
  subtitle: string;
  /** Optional, top right beside the logo row: e.g. the client's name. */
  topRight?: string;
  /** Optional, bottom right beside the footer: e.g. event name, date and/or location. */
  bottomRight?: string;
}

export const coverMeta: PatternMeta = {
  id: "cover", name: "Cover", shape: "chrome",
  description: "Dark gradient, large logo, headline of up to four lines with a tagline under it (vertically centred), plus optional client name (top right) and event details (bottom right).",
  defaultChrome: { background: "dark", overlay: true, logo: "white-lg", footer: "cover", accentBar: false },
  budgets: [
    { slot: "title", maxChars: 40, maxLines: 4 },
    { slot: "subtitle", maxChars: 70, maxLines: 2 },
    { slot: "topRight", maxChars: 40, maxLines: 2 },
    { slot: "bottomRight", maxChars: 70, maxLines: 2 },
  ],
};

/** The band between the logo row and the footer; the headline block is centred in it whatever its line count. */
const BAND_TOP = 155;
const BAND_BOTTOM = 981;
const RIGHT = 81; // right edge, mirroring the footer's left edge

export function Cover({ title, subtitle, topRight, bottomRight }: CoverProps) {
  return (
    <>
      <div style={{ position: "absolute", left: 128, right: 128, top: BAND_TOP, height: BAND_BOTTOM - BAND_TOP, display: "flex", flexDirection: "column", justifyContent: "center", gap: 32 }}>
        <h1 style={{ margin: 0, ...t(120, 1.15, -3.6, 500, "#fff"), ...noWrap }}>{title}</h1>
        {subtitle && <p style={{ margin: 0, ...t(48, 1.15, -1.44, 400, "#fff"), ...noWrap }}>{subtitle}</p>}
      </div>
      {topRight && (
        <p style={{ position: "absolute", right: RIGHT, top: 82, height: 71, margin: 0, display: "flex", alignItems: "center", textAlign: "right", ...t(32, 1.25, -0.32, 500, "#fff"), ...noWrap }}>{topRight}</p>
      )}
      {bottomRight && (
        <p style={{ position: "absolute", right: RIGHT, bottom: 1080 - 1010, margin: 0, textAlign: "right", ...t(24, 1.35, 2.4, 400, "#fff"), ...noWrap }}>{bottomRight}</p>
      )}
    </>
  );
}
