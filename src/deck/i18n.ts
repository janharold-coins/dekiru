/**
 * Translated decks.
 *
 * English is the content; a translation is an overlay of the slide's text in another language, kept on
 * the slide itself (`slide.i18n[lang]`), so it travels with the slide everywhere the slide goes:
 * a master's translation reaches every deck that references the slide, a copy snapshots it, a share link
 * freezes it, and version history keeps it. Only the text people edit in the slide form is translated
 * (src/deck/fields.ts decides what that is); images, colours, positions and layout keys stay as approved.
 *
 * Nothing in the app translates: Claude does, through the connector (get_deck_text / set_translation in
 * src/lib/mcp-tools.ts). Each translation remembers a fingerprint of the English it was made from, so the
 * app can tell "up to date" from "English changed since" without any AI.
 */
import { isEditableKey, isImagePath } from "./fields";
import type { SlideData } from "./types";

export type TargetLang = "zh" | "th";
export type Lang = "en" | TargetLang;

export interface Language {
  code: Lang;
  /** The language's own name, as shown on the selector. */
  name: string;
  /** Shown to English-speaking editors. */
  english: string;
  /** Two-letter code and flag for compact pickers ("EN 🇬🇧"). */
  short: string;
  flag: string;
  /** Line-height multiplier the script needs (Thai stacks marks above and below the line). */
  lineHeight: number;
}

export const LANGUAGES: Record<Lang, Language> = {
  en: { code: "en", name: "English", english: "English", short: "EN", flag: "🇬🇧", lineHeight: 1 },
  zh: { code: "zh", name: "中文", english: "Chinese (Simplified)", short: "ZH", flag: "🇨🇳", lineHeight: 1.1 },
  th: { code: "th", name: "ไทย", english: "Thai", short: "TH", flag: "🇹🇭", lineHeight: 1.15 },
};

/** Languages a deck can be translated into (English is the source). */
export const TARGET_LANGS: TargetLang[] = ["zh", "th"];
export const isTargetLang = (x: unknown): x is TargetLang => x === "zh" || x === "th";

export const isLang = (x: unknown): x is Lang => typeof x === "string" && x in LANGUAGES;
export const asLang = (x: unknown, fallback: Lang = "en"): Lang => (isLang(x) ? x : fallback);

/** One translated slide: the text overlay (same shape as props, strings only) and the English it was made from. */
export interface SlideTranslation {
  props: Record<string, unknown>;
  /** Fingerprint of the English text at translation time; differs from sourceHash(slide.props) once English changed. */
  source: string;
}

/* ---------- which text is translatable ---------- */

export interface TextEntry { path: string; text: string }

/**
 * Every translatable string of a slide, with its path ("cards[2].title"). Same rule as the slide form:
 * layout keys, image paths and colours are left out. Pure whitespace and bare numbers aren't worth translating.
 */
export function textEntries(props: Record<string, unknown>): TextEntry[] {
  const out: TextEntry[] = [];
  const walk = (v: unknown, path: string) => {
    if (typeof v === "string") {
      if (v.trim() && !/^[\d\s.,%+$€£¥₱:/–-]*$/.test(v)) out.push({ path, text: v });
    } else if (Array.isArray(v)) {
      v.forEach((x, i) => walk(x, `${path}[${i}]`));
    } else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) if (isEditableKey(k, x)) walk(x, path ? `${path}.${k}` : k);
    }
  };
  walk(props, "");
  return out;
}

/** Stable fingerprint of the English text (FNV-1a over the entries; the same in the browser and on the server). */
export function sourceHash(props: Record<string, unknown>): string {
  let h = 0x811c9dc5;
  for (const { path, text } of textEntries(props)) {
    for (const ch of `${path}\u0000${text}\u0001`) {
      h ^= ch.codePointAt(0)!;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  return h.toString(16).padStart(8, "0");
}

/**
 * How much room a string takes, in Latin characters, so one budget works for every language:
 * a CJK character is about two Latin characters wide; a Thai letter runs wider than the average Latin
 * one (no narrow letters, and words don't break at spaces), while Thai vowel and tone marks sit above
 * or below a letter and take no width of their own.
 */
export function textWidth(text: string): number {
  let w = 0;
  for (const ch of text.replace(/\n/g, "")) {
    const c = ch.codePointAt(0)!;
    if ((c >= 0x2e80 && c <= 0x9fff) || (c >= 0xf900 && c <= 0xfaff) || (c >= 0xff00 && c <= 0xff60) || (c >= 0x3000 && c <= 0x303f)) w += 2;
    else if (c === 0x0e31 || (c >= 0x0e34 && c <= 0x0e3a) || (c >= 0x0e47 && c <= 0x0e4e)) w += 0;
    else if (c >= 0x0e01 && c <= 0x0e5b) w += 1.6;
    else w += 1;
  }
  return Math.round(w);
}

/* ---------- building and applying overlays ---------- */

/** Builds an overlay (props-shaped, strings only) from translated entries keyed by path. Unknown paths are ignored. */
export function overlayFromEntries(props: Record<string, unknown>, translated: Record<string, string>): Record<string, unknown> {
  const overlay: Record<string, unknown> = {};
  for (const { path } of textEntries(props)) {
    const text = translated[path];
    if (typeof text !== "string" || !text.trim()) continue;
    setPath(overlay, path, text);
  }
  return overlay;
}

function setPath(target: Record<string, unknown>, path: string, value: string) {
  const parts = path.match(/[^.[\]]+/g) ?? [];
  let cur: Record<string, unknown> | unknown[] = target;
  parts.forEach((part, i) => {
    const key: string | number = /^\d+$/.test(part) ? Number(part) : part;
    const last = i === parts.length - 1;
    const nextIsIndex = !last && /^\d+$/.test(parts[i + 1]);
    const c = cur as Record<string | number, unknown>;
    if (last) c[key] = value;
    else {
      if (c[key] == null) c[key] = nextIsIndex ? [] : {};
      cur = c[key] as Record<string, unknown> | unknown[];
    }
  });
}

/** English props with the overlay's strings in place; anything the overlay doesn't cover stays English. */
export function mergeText<T>(base: T, overlay: unknown): T {
  if (typeof base === "string") return (typeof overlay === "string" && overlay ? overlay : base) as T;
  if (Array.isArray(base)) {
    if (!Array.isArray(overlay)) return base;
    return base.map((x, i) => mergeText(x, overlay[i])) as T;
  }
  if (base && typeof base === "object") {
    if (!overlay || typeof overlay !== "object" || Array.isArray(overlay)) return base;
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const [k, v] of Object.entries(overlay as Record<string, unknown>)) {
      if (k in out && !isImagePath(out[k])) out[k] = mergeText(out[k], v);
    }
    return out as T;
  }
  return base;
}

/** The slide as shown in `lang`: English, or English with the translation's text. */
export function localize(slide: SlideData, lang: Lang): SlideData {
  if (lang === "en") return slide;
  const tr = slide.i18n?.[lang];
  if (!tr) return slide;
  return { ...slide, props: mergeText(slide.props, tr.props) };
}

/**
 * What a reviewer approved on a slide: in English the slide's content (pattern, props, chrome), in another
 * language that translation. A later version with the same fingerprint keeps the approval.
 */
export function fingerprint(slide: SlideData, lang: Lang): string {
  const { i18n: _i18n, ...content } = slide; // eslint-disable-line @typescript-eslint/no-unused-vars
  const subject = lang === "en"
    ? { pattern: content.pattern, props: content.props, chrome: content.chrome ?? null }
    : { source: sourceHash(slide.props), props: slide.i18n?.[lang]?.props ?? null };
  return fnv(canon(subject));
}

/** JSON with sorted keys, so the database's key order doesn't change the fingerprint. */
const canon = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(canon).join(",")}]`
  : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon((v as Record<string, unknown>)[k])}`).join(",")}}`
  : JSON.stringify(v);

function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (const ch of text) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/* ---------- status ---------- */

export type TranslationState = "fresh" | "stale" | "missing";

/** Is this slide's translation current? "stale" = English changed since it was translated. */
export function translationState(slide: SlideData, lang: Lang): TranslationState {
  if (lang === "en") return "fresh";
  const tr = slide.i18n?.[lang];
  if (!tr) return textEntries(slide.props).length ? "missing" : "fresh"; // nothing to translate on an image-only slide
  return tr.source === sourceHash(slide.props) ? "fresh" : "stale";
}

export interface DeckTranslationStatus { lang: TargetLang; fresh: number; stale: number; missing: number }

/** Per language: how many presented slides are translated, stale, or missing. */
export function deckTranslationStatus(slides: SlideData[]): DeckTranslationStatus[] {
  const shown = slides.filter((s) => !s.hidden);
  return TARGET_LANGS.map((lang) => {
    const st = { lang, fresh: 0, stale: 0, missing: 0 };
    for (const s of shown) st[translationState(s, lang)]++;
    return st;
  });
}

/** Languages worth offering on a viewer: at least one slide has a translation. */
export function availableLangs(slides: SlideData[]): TargetLang[] {
  return TARGET_LANGS.filter((lang) => slides.some((s) => !s.hidden && s.i18n?.[lang]));
}

/** Records a translation on a slide, fingerprinting the English it was made from. */
export function withTranslation(slide: SlideData, lang: TargetLang, overlay: Record<string, unknown>): SlideData {
  return { ...slide, i18n: { ...slide.i18n, [lang]: { props: overlay, source: sourceHash(slide.props) } } };
}
