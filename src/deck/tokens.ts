import type { CSSProperties } from "react";

/** Design tokens taken from the Figma file (Presentation-Decks). Values are in slide px (1920×1080). */
export const color = {
  black: "#000000",
  ink: "#17191d",
  white: "#ffffff",
  brandNavy: "#204680", // Base/Blue/Blue 800
  blue: "#1f7aff", // Core/Blue
  orange: "#fa7312", // Base/Orange/Orange 500
  gold: "#efa023", // logo dot, step numbers, CTA emails
  grey545: "#545454",
  grey757: "#757575",
  grey606: "#606060",
  grey898: "#898989",
  chipBorder: "#bcbcbc",
  chevron: "#0095ff",
} as const;

export const backgrounds = {
  dark: "linear-gradient(144.83648150139365deg, rgb(23, 25, 29) 17.147%, rgb(20, 20, 20) 72.199%)",
  "dark-navy": "linear-gradient(139.0856182740788deg, rgb(6, 15, 31) 30.321%, rgb(25, 22, 22) 87.755%)",
  light: "linear-gradient(139.0856182740788deg, rgb(240, 240, 240) 30.321%, rgb(238, 240, 238) 87.755%)",
} as const;
export type BackgroundVariant = keyof typeof backgrounds;

/** Font stacks. "Cns Manrope" / "TWK Everett" are used when installed locally; otherwise the loaded web fallbacks. */
export const font = {
  manrope: "'Cns Manrope', var(--font-manrope), Manrope, system-ui, sans-serif",
  everett: "'TWK Everett', var(--font-numeral), 'Inter', system-ui, sans-serif",
  encode: "'Encode Sans Semi Expanded', var(--font-manrope), sans-serif",
} as const;

type Family = keyof typeof font;

/** Typography helper: size px, line-height multiplier (or "normal"), tracking px, weight, color. */
export function t(
  size: number,
  lineHeight: number | "normal",
  tracking: number,
  weight: number,
  col: string = color.black,
  family: Family = "manrope",
): CSSProperties {
  return {
    fontFamily: font[family],
    fontSize: size,
    lineHeight: lineHeight === "normal" ? "normal" : lineHeight,
    letterSpacing: tracking,
    fontWeight: weight,
    color: col,
    fontStyle: "normal",
  };
}

/** Explicit line breaks (\n) from content are kept; everything else wraps at the box width. */
export const keepBreaks: CSSProperties = { whiteSpace: "pre-wrap", wordBreak: "break-word" };
export const noWrap: CSSProperties = { whiteSpace: "pre" };

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;
