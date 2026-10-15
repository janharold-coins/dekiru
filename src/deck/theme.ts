/**
 * Themes: the look a deck applies to every slide in it. Slides carry content and name a background
 * *role*; the deck's theme decides what each role looks like. Mixing slides from decks with different
 * themes is therefore never a problem: they all take the theme of the deck they're in.
 *
 * A theme becomes CSS custom properties on a wrapper element (`themeStyle`). The slide chrome reads them,
 * falling back to the Coins.ph look, so anything rendered outside a themed wrapper looks as approved.
 *
 * v1 covers backgrounds: the three background roles (each with the text tone that goes on it), the glow,
 * and the accent bar.
 *
 * Text tone: slides are designed with white text on the dark roles and dark text on the light role. When a
 * theme gives a role the other tone (e.g. a white "Main dark"), every slide on that role switches its
 * on-background text, rules, logo and footer to a matching palette. Cards with their own surface keep
 * their designed colours. See `onBg` and `FLIP` below.
 */
import type { CSSProperties } from "react";

export type BackgroundRole = "dark" | "dark-navy" | "light";

export type TextTone = "light" | "dark"; // light = white text, dark = near-black text

export interface Gradient {
  angle: number; // degrees, CSS linear-gradient
  from: string; // hex
  fromAt: number; // %
  to: string;
  toAt: number;
  /**
   * Text on this background. "auto" (Auto contrast, the default) keeps the designed tone while it reads
   * well and switches to the other tone when the background calls for it; "light"/"dark" fix it by hand.
   */
  text?: TextTone | "auto";
}

export interface ThemeTokens {
  backgrounds: Record<BackgroundRole, Gradient>;
  glow: {
    warm: string; // bottom-left blobs (Coins.ph orange)
    cool: string; // top-right blobs (Coins.ph blue)
    strength: number; // 0 = off … 1 = as approved … 1.5
  };
  accent: [string, string, string]; // bottom rule on light slides, left to right
}

/** What each role is for, and the background tone slides on it were designed for. */
export const ROLES: { id: BackgroundRole; name: string; use: string; tone: "dark" | "light" }[] = [
  { id: "dark", name: "Main dark", use: "Cover and section dividers", tone: "dark" },
  { id: "dark-navy", name: "Closing dark", use: "Contact and thank-you slides", tone: "dark" },
  { id: "light", name: "Light", use: "Content slides", tone: "light" },
];

/** The approved Coins.ph look (Figma Presentation-Decks). */
export const DEFAULT_TOKENS: ThemeTokens = {
  backgrounds: {
    dark: { angle: 144.83648150139365, from: "#17191d", fromAt: 17.147, to: "#141414", toAt: 72.199 },
    "dark-navy": { angle: 139.0856182740788, from: "#060f1f", fromAt: 30.321, to: "#191616", toAt: 87.755 },
    light: { angle: 139.0856182740788, from: "#f0f0f0", fromAt: 30.321, to: "#eef0ee", toAt: 87.755 },
  },
  glow: { warm: "#fa7312", cool: "#225cb4", strength: 1 },
  accent: ["#1f7aff", "#204680", "#fa7312"],
};

export const DEFAULT_THEME_ID = "coins";

export const gradientCss = (g: Gradient) => `linear-gradient(${g.angle}deg, ${g.from} ${g.fromAt}%, ${g.to} ${g.toAt}%)`;

/** CSS variables the slide chrome reads (see src/deck/chrome/Chrome.tsx). */
export const VAR = {
  bg: (role: BackgroundRole) => `--dk-bg-${role}`,
  strength: "--dk-glow-strength",
  accent: (i: number) => `--dk-accent-${i}`,
} as const;

/** Fills in anything missing (older or partial token sets) from the default. */
export function normalizeTokens(t: Partial<ThemeTokens> | null | undefined): ThemeTokens {
  const d = DEFAULT_TOKENS;
  const bg = (r: BackgroundRole) => {
    const g = { ...d.backgrounds[r], ...t?.backgrounds?.[r] };
    return { ...g, text: g.text === "light" || g.text === "dark" ? g.text : "auto" as const };
  };
  return {
    backgrounds: { dark: bg("dark"), "dark-navy": bg("dark-navy"), light: bg("light") },
    glow: { ...d.glow, ...t?.glow },
    accent: (t?.accent?.length === 3 ? t.accent : d.accent) as ThemeTokens["accent"],
  };
}

/** Style for a wrapper element: every slide inside it takes this theme. */
export function themeStyle(tokens: Partial<ThemeTokens> | null | undefined): CSSProperties {
  if (!tokens) return {};
  const t = normalizeTokens(tokens);
  const vars: Record<string, string> = { [VAR.strength]: String(t.glow.strength), ...glowStops(t.glow) };
  for (const r of ROLES) {
    vars[VAR.bg(r.id)] = gradientCss(t.backgrounds[r.id]);
    // Only a role whose text tone differs from the design gets a palette; the others keep designed colours.
    const text = textFor(t.backgrounds[r.id], r.id);
    if (text !== designedText(r.id)) for (const [k, v] of Object.entries(FLIP[text])) vars[`--dk-${r.id}-${k}`] = v;
  }
  t.accent.forEach((c, i) => { vars[VAR.accent(i)] = c; });
  return vars as CSSProperties;
}

/* ---------- text tone ---------- */

/** The text tone slides on this role were designed with. */
export const designedText = (r: BackgroundRole): TextTone => (ROLES.find((x) => x.id === r)?.tone === "dark" ? "light" : "dark");

/** Palettes used when a role's text tone is switched away from the design. */
const FLIP: Record<TextTone, Record<FlipLevel, string>> = {
  dark: {
    primary: "#17191d", secondary: "#545454", title: "#204680", accent: "#b45309",
    rule: "rgba(0,0,0,0.25)", border: "#000000", "logo-designed": "none", "logo-alt": "block",
  },
  light: {
    primary: "#ffffff", secondary: "rgba(255,255,255,0.75)", title: "#ffffff", accent: "#efa023",
    rule: "rgba(255,255,255,0.3)", border: "rgba(255,255,255,0.7)", "logo-designed": "none", "logo-alt": "block",
  },
};
export type FlipLevel = "primary" | "secondary" | "title" | "accent" | "rule" | "border" | "logo-designed" | "logo-alt";
const LEVELS: FlipLevel[] = ["primary", "secondary", "title", "accent", "rule", "border", "logo-designed", "logo-alt"];

/**
 * Per-slide variables (set by SlideFrame for the slide's role). When the theme didn't switch this role's
 * text, the referenced variable is undefined, so every `onBg(...)` falls back to the designed colour.
 */
export function slideFlipVars(role: BackgroundRole): CSSProperties {
  return Object.fromEntries(LEVELS.map((l) => [`--dk-flip-${l}`, `var(--dk-${role}-${l})`])) as CSSProperties;
}

/** Cards and panels with their own surface: keep designed colours whatever the background does. */
export const OWN_SURFACE = Object.fromEntries(LEVELS.map((l) => [`--dk-flip-${l}`, "initial"])) as CSSProperties;

/** Designed colours of text that sits on the slide background, by what they are. */
const LEVEL_OF: Record<string, FlipLevel> = {
  "#000": "primary", "#000000": "primary", "#17191d": "primary", "#fff": "primary", "#ffffff": "primary",
  "#204680": "title",
  "#545454": "secondary", "#606060": "secondary", "#757575": "secondary", "#363636": "secondary", "#3d3d3d": "secondary",
  "#5b6572": "secondary", "#898989": "secondary", "#474747": "secondary", "#6482a5": "secondary",
  "#efa023": "accent",
};

/** A colour for something on the slide background: as designed, unless the theme switched the text tone. */
export function onBg(designed: string, level?: FlipLevel): string {
  const l = level ?? LEVEL_OF[designed.toLowerCase()];
  return l ? `var(--dk-flip-${l}, ${designed})` : designed;
}

/* ---------- glow ---------- */

/**
 * The approved glow's gradient stops (see Glow.tsx) are shades of one warm and one cool colour.
 * A theme's warm/cool colour is turned into the same shades; the approved colours give the exact originals.
 */
const GLOW_SHADES = {
  w1: { base: "warm", approved: "#803f11", mix: 0.51 },
  w2: { base: "warm", approved: "#fa7312", mix: 1 },
  w3: { base: "warm", approved: "#d06111", mix: 0.83 },
  c1: { base: "cool", approved: "#225cb4", mix: 1 },
  c2: { base: "cool", approved: "#193155", mix: 0.5 },
  c3: { base: "cool", approved: "#003488", mix: 0.72 },
  c4: { base: "cool", approved: "#0057f4", mix: 1.25 },
} as const;

function shade(hex: string, k: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(k <= 1 ? v * k : v + (255 - v) * (k - 1)))));
  return `#${ch.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function glowStops(glow: ThemeTokens["glow"]) {
  const out: Record<string, string> = {};
  for (const [name, s] of Object.entries(GLOW_SHADES)) {
    const color = glow[s.base];
    const approved = color.toLowerCase() === DEFAULT_TOKENS.glow[s.base];
    out[`--dk-glow-${name}`] = approved || !/^#[0-9a-f]{6}$/i.test(color) ? s.approved : shade(color, s.mix);
  }
  return out;
}

/* ---------- checks ---------- */

function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * Problems that would make slides hard to read: text on dark roles is white and on light roles near-black,
 * so each background colour needs enough contrast with that text (WCAG 4.5:1 for body text).
 */
const TEXT_LUM: Record<TextTone, number> = { light: 1, dark: 0.0098 }; // white, #17191d

/** Lowest contrast between a text tone and the two ends of a background. */
export function minContrast(g: Gradient, text: TextTone) {
  const ends = [luminance(g.from), luminance(g.to)].filter((l): l is number => l != null);
  return ends.length ? Math.min(...ends.map((l) => contrast(l, TEXT_LUM[text]))) : 0;
}

/** The text tone that reads best on this background. */
export const bestText = (g: Gradient): TextTone => (minContrast(g, "light") >= minContrast(g, "dark") ? "light" : "dark");

const validHex = (h: string) => /^#[0-9a-f]{6}$/i.test(h);

/** Auto contrast: the designed tone while it reads (4.5:1), otherwise whichever tone reads better. */
export function autoText(g: Gradient, role: BackgroundRole): TextTone {
  if (!validHex(g.from) || !validHex(g.to)) return designedText(role);
  const designed = designedText(role);
  return minContrast(g, designed) >= 4.5 ? designed : bestText(g);
}

/** The text tone actually used on a role: the hand-picked one, or Auto contrast's choice. */
export const textFor = (g: Gradient, role: BackgroundRole): TextTone =>
  g.text === "light" || g.text === "dark" ? g.text : autoText(g, role);

export interface ThemeIssue { role: BackgroundRole | "accent" | "glow"; message: string; fix?: TextTone }

export function checkTheme(tokens: ThemeTokens): ThemeIssue[] {
  const out: ThemeIssue[] = [];
  for (const r of ROLES) {
    const g = tokens.backgrounds[r.id];
    const text = textFor(g, r.id);
    const auto = g.text !== "light" && g.text !== "dark";
    for (const [label, hex] of [["start", g.from], ["end", g.to]] as const) {
      const l = luminance(hex);
      if (l == null) { out.push({ role: r.id, message: `${r.name}: ${label} colour "${hex}" isn't a 6-digit hex colour.` }); continue; }
      const c = contrast(l, TEXT_LUM[text]);
      if (c < 4.5) {
        const other: TextTone = text === "light" ? "dark" : "light";
        out.push({
          role: r.id,
          message: auto
            ? `${r.name}: neither white nor dark text reads well on the ${label} colour (contrast ${c.toFixed(1)}:1, needs 4.5:1). Make the two colours closer in lightness.`
            : `${r.name}: ${label} colour is too ${text === "light" ? "light" : "dark"} for ${text === "light" ? "white" : "dark"} text (contrast ${c.toFixed(1)}:1, needs 4.5:1).`,
          ...(!auto && minContrast(g, other) >= 4.5 ? { fix: other } : {}),
        });
      }
    }
  }
  for (const [k, v] of [["warm", tokens.glow.warm], ["cool", tokens.glow.cool], ...tokens.accent.map((a, i) => [`accent ${i + 1}`, a])]) {
    if (luminance(v) == null) out.push({ role: k.startsWith("accent") ? "accent" : "glow", message: `${k}: "${v}" isn't a 6-digit hex colour.` });
  }
  if (!(tokens.glow.strength >= 0 && tokens.glow.strength <= 1.5)) out.push({ role: "glow", message: "Glow strength must be between 0 and 1.5." });
  return out;
}
