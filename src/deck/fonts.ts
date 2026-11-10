/**
 * The approved fonts a typography preset can choose from. A short list on purpose: every font here is checked
 * against the slide layouts (weights, width), and loaded by src/app/layout.tsx without preloading, so a deck
 * only downloads the fonts it actually uses.
 *
 * `width` is how wide the font sets text compared with Cns Manrope (1 = same). Text budgets in the layouts
 * are counted for Cns Manrope, so overflow checks scale by it. Measured in the browser on a sentence of slide
 * copy at weights 400 and 600, keeping the wider of the two (2026-11-09).
 */
export type FontId =
  | "cns-manrope" | "inter" | "dm-sans" | "plus-jakarta-sans" | "figtree" | "ibm-plex-sans"
  | "fraunces" | "source-serif-4" | "newsreader" | "playfair-display";

export interface FontInfo {
  id: FontId;
  name: string;
  kind: "sans" | "serif";
  /** CSS family list, without the script and generic fallbacks (src/deck/tokens.ts adds those). */
  stack: string;
  /** Weights the font really has, inclusive. Slides use 200–800; outside this range the browser fakes it. */
  weights: [number, number];
  width: number;
}

export const DEFAULT_FONT: FontId = "cns-manrope";

export const FONTS: FontInfo[] = [
  { id: "cns-manrope", name: "Cns Manrope", kind: "sans", stack: "'Cns Manrope', var(--font-manrope), Manrope", weights: [200, 800], width: 1 },
  { id: "inter", name: "Inter", kind: "sans", stack: "var(--font-numeral), Inter", weights: [100, 900], width: 1.06 },
  { id: "dm-sans", name: "DM Sans", kind: "sans", stack: "var(--font-dm-sans), 'DM Sans'", weights: [100, 1000], width: 1.04 },
  { id: "plus-jakarta-sans", name: "Plus Jakarta Sans", kind: "sans", stack: "var(--font-jakarta), 'Plus Jakarta Sans'", weights: [200, 800], width: 1.04 },
  { id: "figtree", name: "Figtree", kind: "sans", stack: "var(--font-figtree), Figtree", weights: [300, 900], width: 0.99 },
  { id: "ibm-plex-sans", name: "IBM Plex Sans", kind: "sans", stack: "var(--font-plex-sans), 'IBM Plex Sans'", weights: [100, 700], width: 0.99 },
  { id: "fraunces", name: "Fraunces", kind: "serif", stack: "var(--font-fraunces), Fraunces", weights: [100, 900], width: 1.02 },
  { id: "source-serif-4", name: "Source Serif 4", kind: "serif", stack: "var(--font-source-serif), 'Source Serif 4'", weights: [200, 900], width: 1.02 },
  { id: "newsreader", name: "Newsreader", kind: "serif", stack: "var(--font-newsreader), Newsreader", weights: [200, 800], width: 0.94 },
  { id: "playfair-display", name: "Playfair Display", kind: "serif", stack: "var(--font-playfair), 'Playfair Display'", weights: [400, 900], width: 0.98 },
];

export const fontById = (id: string | null | undefined): FontInfo | undefined => FONTS.find((f) => f.id === id);
