import type { SlideData, SlotBudget } from "./types";
import { patterns } from "./registry";

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

const len = (v: unknown) => (typeof v === "string" ? v.replace(/\n/g, "").length : 0);
const lines = (v: unknown) => (typeof v === "string" ? v.split("\n").length : 0);

/** Budget check: flags only — content is never blocked or shrunk. */
export function checkOverflow(slide: SlideData): OverflowWarning[] {
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
      if (b.maxChars != null && len(v) > b.maxChars) out.push({ slot: b.slot, message: `${len(v)} characters — budget ${b.maxChars}. Suggest a shorter phrasing or another layout.` });
      else if (b.maxLines != null && lines(v) > b.maxLines) out.push({ slot: b.slot, message: `${lines(v)} explicit lines — budget ${b.maxLines}` });
    }
  }
  return out;
}
