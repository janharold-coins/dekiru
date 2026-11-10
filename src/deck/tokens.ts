import type { CSSProperties } from "react";
import { onBg } from "./theme";

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

/**
 * Font stacks. Slide text, numbers and figures included, is set in "Cns Manrope" (served from public/fonts,
 * see the @font-face rules in globals.css); Google Manrope is only the fallback while it loads.
 * `--dk-script` is the script font for translated slides (Noto Sans SC / Thai, set per `lang` in globals.css):
 * it comes after the design font, so Latin letters and numbers keep the design font and only the glyphs
 * Cns Manrope lacks fall through to it.
 *
 * Font roles: every piece of slide text is a title (slide titles and headings), body (everything else) or
 * numeral (numbers set as figures: section and agenda numbers, key numbers, prices, years, step numbers).
 * Each role reads a CSS variable (`--dk-font-title` / `-body` / `-numeral`) that a typography preset can set
 * on the deck's wrapper; unset, all three are Cns Manrope, the approved look.
 */
const DESIGN_FONT = "'Cns Manrope', var(--font-manrope), Manrope";
const AFTER = "var(--dk-script, system-ui), system-ui, sans-serif";

export type FontRole = "title" | "body" | "numeral";
export const FONT_VAR: Record<FontRole, string> = { title: "--dk-font-title", body: "--dk-font-body", numeral: "--dk-font-numeral" };

export const font = {
  title: `var(${FONT_VAR.title}, ${DESIGN_FONT}), ${AFTER}`,
  body: `var(${FONT_VAR.body}, ${DESIGN_FONT}), ${AFTER}`,
  numeral: `var(${FONT_VAR.numeral}, ${DESIGN_FONT}), ${AFTER}`,
  /** Only inside the ALMOND logo (LogoItem); not themeable. */
  encode: "'Encode Sans Semi Expanded', var(--font-manrope), var(--dk-script, system-ui), sans-serif",
} as const;

/**
 * Typography helper: size px, line-height multiplier (or "normal"), tracking px, weight, color, font role.
 * Pass `undefined` as the colour to keep the default when only the role is needed.
 */
export function t(
  size: number,
  lineHeight: number | "normal",
  tracking: number,
  weight: number,
  col: string = color.black,
  family: FontRole = "body",
): CSSProperties {
  return {
    fontFamily: font[family],
    fontSize: size,
    // Translated slides may need taller lines (Thai stacks marks above and below): --dk-lh, 1 in English.
    lineHeight: lineHeight === "normal" ? "normal" : `calc(${lineHeight} * var(--dk-lh, 1))`,
    letterSpacing: tracking,
    fontWeight: weight,
    color: onBg(col), // follows the theme's text tone when the slide's background role is switched
    fontStyle: "normal",
  };
}

/** Explicit line breaks (\n) from content are kept; everything else wraps at the box width. */
export const keepBreaks: CSSProperties = { whiteSpace: "pre-wrap", wordBreak: "break-word" };
export const noWrap: CSSProperties = { whiteSpace: "pre" };

export const SLIDE_W = 1920;
export const SLIDE_H = 1080;
