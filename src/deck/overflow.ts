import type { SlideData, SlotBudget } from "./types";
import { patterns } from "./registry";
import { localize, textWidth, type Lang } from "./i18n";

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
 */
export function checkOverflow(source: SlideData, lang: Lang = "en"): OverflowWarning[] {
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
    for (const v of resolve(slide.props, b.slot)) {
      if (b.maxChars != null && len(v) > b.maxChars) {
        out.push({ slot: b.slot, message: lang === "en"
          ? `${len(v)} characters — budget ${b.maxChars}. Suggest a shorter phrasing or another layout.`
          : `about ${len(v)} English characters wide — budget ${b.maxChars}. Shorten the translation.` });
      }
      else if (b.maxLines != null && lines(v) > b.maxLines) out.push({ slot: b.slot, message: `${lines(v)} explicit lines — budget ${b.maxLines}` });
    }
  }
  return out;
}
