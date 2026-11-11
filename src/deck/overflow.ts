import type { SlideData, SlotBudget } from "./types";
import { patterns } from "./registry";
import { localize, textWidth, type Lang } from "./i18n";
import { fontById } from "./fonts";
import { normalizeTypography, type TypographyTokens } from "./presets";

export interface OverflowWarning { slot: string; message: string }

/* eslint-disable @typescript-eslint/no-explicit-any */
function resolve(obj: any, path: string): any[] {
  // "what.item" → every element of obj.what; "card.title" → title of every element of obj.cards
  const [head, ...rest] = path.split(".");
  if (!rest.length) return [obj?.[head]];
  const arr = obj?.[head] ?? obj?.[head + "s"];
  if (!Array.isArray(arr)) return [];
  if (rest[0] === "item") return arr;
  return arr.flatMap((el) => resolve(el, rest.join(".")));
}

const len = (v: unknown) => (typeof v === "string" ? textWidth(v) : 0);
const lines = (v: unknown) => (typeof v === "string" ? v.split("\n").length : 0);

/**
 * Budget check: flags only — content is never blocked or shrunk.
 * In another language the slide's translated text is checked: budgets are in Latin-character widths,
 * and textWidth() counts a Chinese character as two and Thai marks as none, so one budget serves all.
 *
 * Budgets are counted for Cns Manrope. With a typography preset whose font sets text wider, character budgets
 * shrink by its width (titles by the title font, everything else by the body font); narrower fonts keep the
 * budget as it is, since the layout's other limits (lines, boxes) haven't moved.
 */
export function checkOverflow(source: SlideData, lang: Lang = "en", typography?: TypographyTokens | null): OverflowWarning[] {
  const slide = localize(source, lang);
  const budgets: SlotBudget[] = patterns[slide.pattern]?.meta.budgets ?? [];
  const out: OverflowWarning[] = [];
  for (const b of budgets) {
    if (b.maxItems != null) {
      const [head] = b.slot.split(" ");
      const parts = head.split(".");
      const arr = parts.reduce((o: any, k) => o?.[k], slide.props as any);
      if (Array.isArray(arr) && arr.length > b.maxItems) out.push({ slot: b.slot, message: `${arr.length} items — layout holds ${b.maxItems}` });
      continue;
    }
    const font = fontFor(b.slot, typography);
    const max = b.maxChars != null && font ? Math.floor(b.maxChars / font.width) : b.maxChars;
    const forFont = font ? ` (${b.maxChars} in Cns Manrope; ${font.name} sets text wider)` : "";
    for (const v of resolve(slide.props, b.slot)) {
      if (max != null && len(v) > max) {
        out.push({ slot: b.slot, message: lang === "en"
          ? `${len(v)} characters — budget ${max}${forFont}. Suggest a shorter phrasing or another layout.`
          : `about ${len(v)} English characters wide — budget ${max}${forFont}. Shorten the translation.` });
      }
      else if (b.maxLines != null && lines(v) > b.maxLines) out.push({ slot: b.slot, message: `${lines(v)} explicit lines — budget ${b.maxLines}` });
    }
  }
  return out;
}

/** The preset font a slot is set in, when it sets text wider than Cns Manrope (else none: the budget stands). */
function fontFor(slot: string, typography: TypographyTokens | null | undefined) {
  if (!typography) return undefined;
  const t = normalizeTypography(typography);
  const field = slot.split(" ")[0].split(".").pop() ?? "";
  const f = fontById(/title|heading/i.test(field) ? t.title : t.body);
  return f && f.width > 1 ? f : undefined;
}
