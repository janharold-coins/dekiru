/**
 * Inks: the named text and accent colours a colour preset can change (see ./presets.ts). The slides read them
 * through `onBg()` in ./theme.ts. Kept in its own module so themes and presets can both import it.
 *
 * The designed text and accent colours, by name. Each reads a CSS variable (`--dk-ink-<name>`) that a colour
 * preset can set on the deck's wrapper; unset, the designed colour shows, so the approved look is unchanged.
 * White text is not an ink: it belongs to the dark backgrounds and follows the theme's text tone instead.
 * Status colours (red, green, amber), chip colours and chart shades stay fixed: they carry meaning.
 */
export type InkRole = "title" | "text" | "muted" | "accent" | "brand";

export const INKS: { id: InkRole; name: string; use: string; designed: string }[] = [
  { id: "title", name: "Title", use: "Titles and headings on light backgrounds", designed: "#204680" },
  { id: "text", name: "Text", use: "Body text on light backgrounds", designed: "#17191d" },
  { id: "muted", name: "Muted text", use: "Eyebrows, captions, descriptions", designed: "#545454" },
  { id: "accent", name: "Accent", use: "Highlights, numbers, bullets, quote marks", designed: "#fa7312" },
  { id: "brand", name: "Brand", use: "Brand highlights, key figures and markers", designed: "#1f7aff" },
];

export const INK_VAR = (r: InkRole) => `--dk-ink-${r}`;

/** Designed colours → the ink they are. */
export const INK_OF: Record<string, InkRole> = {
  "#204680": "title",
  "#000": "text", "#000000": "text", "#17191d": "text",
  "#545454": "muted", "#606060": "muted", "#757575": "muted", "#363636": "muted", "#3d3d3d": "muted",
  "#5b6572": "muted", "#898989": "muted", "#474747": "muted", "#6482a5": "muted",
  "#fa7312": "accent", "#efa023": "accent",
  "#1f7aff": "brand",
};

/** WCAG relative luminance of a #rrggbb colour; null when it isn't one. */
export function luminanceOf(hex: string): number | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** WCAG contrast ratio between two #rrggbb colours (1 when either isn't one). */
export function contrastRatio(a: string, b: string): number {
  const la = luminanceOf(a), lb = luminanceOf(b);
  if (la == null || lb == null) return 1;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Contrast each ink needs on the light background. Text inks are body text (4.5:1); accent and brand mark
 * large figures, bullets and rules, so the large-text level applies (3:1).
 */
export const INK_MIN_CONTRAST: Record<InkRole, number> = { title: 4.5, text: 4.5, muted: 4.5, accent: 3, brand: 3 };
