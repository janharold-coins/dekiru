import type { FigmaOrigin } from "../types";

/** "Icon/Logo/Light" (Country × Logo × Text × Padding): the Coins.ph mark with the PH badge, 40px. */
export const coinsLogoOrigin: FigmaOrigin = {
  // Foundation holds two "Icon/Logo" sets (a8818784… 2026-10-20 and 4220c47d… 2026-09-09); the library node 405:3284 says which once mapped from there.
  library: "Foundation Library V2", set: "Icon/Logo", mainNode: "22361:39411", libraryNode: "405:3284",
  variants: ["Country", "Logo", "Text", "Padding"],
};

export interface CoinsLogoProps { country?: "Philippines"; size?: number }

export function CoinsLogo({ size = 40 }: CoinsLogoProps) {
  const s = size / 40;
  return (
    <span style={{ position: "relative", display: "block", width: size, height: size, flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src="/ui/logo/coins-mark.svg" style={{ position: "absolute", left: 0, top: 2.2 * s, width: 35.62 * s, height: 35.62 * s }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src="/ui/logo/coins-badge.svg" style={{ position: "absolute", left: 29.12 * s, top: 26.92 * s, width: 10.88 * s, height: 10.88 * s }} />
    </span>
  );
}
