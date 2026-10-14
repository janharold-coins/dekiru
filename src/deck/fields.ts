/**
 * Which parts of a slide's props people fill in by hand (the slide form), and how to label them.
 * Everything else (positions, sizes, colours, image paths, variants) is layout, kept as approved.
 */
import { patterns } from "./registry";

/** Keys that are layout or styling, never shown in the form. */
const LAYOUT_KEYS = new Set([
  "figma", "product", "variant", "tone", "color", "yearColor", "file", "src", "icon", "flag", "panel", "group", "code",
  "side", "kind", "font", "decoration", "level", "highlight", "valueRuns", "figmaBoldSplit", "fit", "unit",
]);
/** Items holding any of these are placed by hand on the slide, so the list can't grow or shrink. */
const POSITION_KEYS = ["x", "y", "markerY", "w", "h"];

export const isImagePath = (v: unknown) => typeof v === "string" && /^\/.*\.(png|jpe?g|svg|webp|gif)$/i.test(v);

export function isEditableKey(key: string, value: unknown): boolean {
  if (LAYOUT_KEYS.has(key)) return false;
  if (typeof value === "string") return !isImagePath(value) && !/^#[0-9a-f]{3,8}$/i.test(value);
  if (Array.isArray(value)) return value.some((v) => hasText(v));
  if (value && typeof value === "object") return Object.entries(value).some(([k, v]) => isEditableKey(k, v));
  return false;
}

function hasText(v: unknown): boolean {
  if (typeof v === "string") return !isImagePath(v);
  if (v && typeof v === "object") return Object.entries(v).some(([k, x]) => isEditableKey(k, x));
  return false;
}

/** Can this list take more or fewer items? Not when items are positioned by hand. */
export function listLimits(pattern: string, key: string, items: unknown[]) {
  const placed = items.some((it) => it && typeof it === "object" && POSITION_KEYS.some((k) => k in (it as object)));
  if (placed || key === "titleRuns") return { fixed: true, max: items.length };
  const budget = (patterns[pattern]?.meta.budgets ?? []).find((b) => b.maxItems != null && b.slot.split(" ")[0].split(".").pop() === key);
  return { fixed: false, max: budget?.maxItems ?? 12 };
}

const LABELS: Record<string, string> = {
  eyebrow: "Eyebrow (small label above the title)", whoLabel: "“Who” heading", whatLabel: "“What” heading",
  keyApisLabel: "“Key APIs” heading", pricingLabel: "Pricing heading", keyApis: "Key APIs", what: "What it is",
  who: "Who it's for", n: "Step number", titleBold: "Title (bold part)", titleRegular: "Title (light part)",
  titleRuns: "Title parts", statCards: "Stat cards", primaryStats: "Main figures", secondaryStats: "More figures",
  parentTitle: "Parent section", leftText: "Earlier milestone", bracketGroup: "Year range", callout: "Callout",
  lead: "Lead-in", lines: "Lines", subtext: "Small print", text: "Text",
};
const SINGULAR: Record<string, string> = {
  what: "Point", keyApis: "API line", lines: "Line", titleRuns: "Part", statCards: "Stat card", primaryStats: "Figure",
  secondaryStats: "Figure", chips: "Rate", statuses: "Status",
};

export function fieldLabel(key: string) {
  if (LABELS[key]) return LABELS[key];
  const words = key.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function itemLabel(key: string, index: number) {
  const one = SINGULAR[key] ?? fieldLabel(key).replace(/ies$/, "y").replace(/s$/, "");
  return `${one} ${index + 1}`;
}

/** Image paths in a slide, for the "images stay as approved" note. */
export function countImages(v: unknown): number {
  if (isImagePath(v)) return 1;
  if (Array.isArray(v)) return v.reduce((n: number, x) => n + countImages(x), 0);
  if (v && typeof v === "object") return Object.values(v).reduce((n: number, x) => n + countImages(x), 0);
  return 0;
}
