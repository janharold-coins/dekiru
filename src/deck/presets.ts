/**
 * Presets: partial themes. A theme sets a deck's whole look (backgrounds first, see ./theme.ts); a preset sets
 * one part of it and sits on top of whatever theme the deck uses, without changing that theme.
 *
 *   typography — the fonts: one font for everything, or a title font paired with a body font
 *   colors     — the text and accent colours (the inks in ./theme.ts); backgrounds stay the theme's
 *
 * Like themes, a preset becomes CSS custom properties on the deck's wrapper (`presetStyle`). The slides read
 * them through `t()` (font roles, ./tokens.ts) and `onBg()` (inks, ./theme.ts); anything a preset leaves out
 * falls back to the approved look.
 */
import type { CSSProperties } from "react";
import { DEFAULT_FONT, FONTS, fontById, type FontId } from "./fonts";
import { INKS, INK_VAR, type InkRole } from "./theme";
import { FONT_VAR } from "./tokens";

export type PresetKind = "typography" | "colors";

export const PRESET_KINDS: { id: PresetKind; name: string; use: string }[] = [
  { id: "typography", name: "Typography", use: "One font, or a title and body pairing" },
  { id: "colors", name: "Colours", use: "Title, text and accent colours" },
];

export interface TypographyTokens {
  /** Slide titles and headings. */
  title: FontId;
  /** Everything else. Same as `title` for a one-font preset. */
  body: FontId;
  /** Numbers set as figures (section numbers, key numbers, prices) follow the title or the body font. */
  numeral: "title" | "body";
}

export interface ColorTokens {
  /** Only the inks the preset changes; the rest keep the designed colour. Hex, #rrggbb. */
  ink: Partial<Record<InkRole, string>>;
}

export type PresetTokens = TypographyTokens | ColorTokens;

export const DEFAULT_TYPOGRAPHY: TypographyTokens = { title: DEFAULT_FONT, body: DEFAULT_FONT, numeral: "title" };
export const DEFAULT_COLORS: ColorTokens = { ink: {} };

const HEX = /^#[0-9a-f]{6}$/i;
const INK_IDS = INKS.map((i) => i.id);

/** Fills in or drops anything missing or unknown (older or hand-made token sets). */
export function normalizeTypography(t: Partial<TypographyTokens> | null | undefined): TypographyTokens {
  const title = fontById(t?.title)?.id ?? DEFAULT_TYPOGRAPHY.title;
  const body = fontById(t?.body)?.id ?? title;
  return { title, body, numeral: t?.numeral === "body" ? "body" : "title" };
}

export function normalizeColors(t: Partial<ColorTokens> | null | undefined): ColorTokens {
  const ink: ColorTokens["ink"] = {};
  for (const id of INK_IDS) {
    const v = t?.ink?.[id];
    if (typeof v === "string" && HEX.test(v.trim())) ink[id] = v.trim().toLowerCase();
  }
  return { ink };
}

export function normalizePreset(kind: PresetKind, t: unknown): PresetTokens {
  return kind === "typography" ? normalizeTypography(t as Partial<TypographyTokens>) : normalizeColors(t as Partial<ColorTokens>);
}

/** Problems that stop a preset from being saved (unknown fonts, colours that aren't hex). */
export function checkPreset(kind: PresetKind, t: unknown): string[] {
  const out: string[] = [];
  if (kind === "typography") {
    const v = (t ?? {}) as Partial<Record<keyof TypographyTokens, unknown>>;
    for (const k of ["title", "body"] as const) {
      if (v[k] != null && !fontById(String(v[k]))) out.push(`${k === "title" ? "Title" : "Body"} font "${String(v[k])}" isn't on the approved list.`);
    }
  } else {
    const ink = ((t ?? {}) as { ink?: Record<string, unknown> }).ink ?? {};
    for (const [k, v] of Object.entries(ink)) {
      const name = INKS.find((i) => i.id === k)?.name;
      if (!name) out.push(`"${k}" isn't a colour a preset can change.`);
      else if (v != null && v !== "" && !(typeof v === "string" && HEX.test(v.trim()))) out.push(`${name}: "${String(v)}" isn't a 6-digit hex colour.`);
    }
  }
  return out;
}

/** The CSS variables a preset sets. Values equal to the approved look are left out, so nothing changes for them. */
export function presetVars(kind: PresetKind, t: PresetTokens): Record<string, string> {
  if (kind === "typography") {
    const v = normalizeTypography(t as TypographyTokens);
    const out: Record<string, string> = {};
    const set = (role: "title" | "body" | "numeral", id: FontId) => { if (id !== DEFAULT_FONT) out[FONT_VAR[role]] = fontById(id)!.stack; };
    set("title", v.title);
    set("body", v.body);
    set("numeral", v.numeral === "body" ? v.body : v.title);
    return out;
  }
  const v = normalizeColors(t as ColorTokens);
  const out: Record<string, string> = {};
  for (const ink of INKS) {
    const c = v.ink[ink.id];
    if (c && c !== ink.designed) out[INK_VAR(ink.id)] = c;
  }
  return out;
}

/** The presets a deck applies, by kind (none = the theme's own look for that part). */
export type AppliedPresets = Partial<{ typography: TypographyTokens; colors: ColorTokens }>;

/** Style for a wrapper element: every slide inside takes these presets on top of its theme. */
export function presetStyle(applied: AppliedPresets | null | undefined): CSSProperties {
  if (!applied) return {};
  return {
    ...(applied.typography ? presetVars("typography", applied.typography) : {}),
    ...(applied.colors ? presetVars("colors", applied.colors) : {}),
  } as CSSProperties;
}

/** How much wider than Cns Manrope a preset sets text, per font role (1 = same). For overflow checks. */
export function widthFactor(t: TypographyTokens | null | undefined, role: "title" | "body" | "numeral"): number {
  if (!t) return 1;
  const v = normalizeTypography(t);
  const id = role === "title" ? v.title : role === "body" ? v.body : v.numeral === "body" ? v.body : v.title;
  return fontById(id)?.width ?? 1;
}

/** Fonts a preset uses, for labels and previews ("Fraunces / Inter", or one name). */
export function typographyLabel(t: TypographyTokens): string {
  const v = normalizeTypography(t);
  const name = (id: FontId) => FONTS.find((f) => f.id === id)!.name;
  return v.title === v.body ? name(v.title) : `${name(v.title)} / ${name(v.body)}`;
}
