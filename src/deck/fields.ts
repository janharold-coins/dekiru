/**
 * Which parts of a slide's props people fill in by hand (the slide form), and how to label them.
 * Everything else (positions, sizes, colours, image paths, variants) is layout, kept as approved.
 */
import { patterns } from "./registry";

/** Keys that are layout or styling, never shown in the form. */
const LAYOUT_KEYS = new Set([
  "figma", "product", "variant", "tone", "color", "yearColor", "file", "src", "icon", "flag", "panel", "group", "code",
  "side", "kind", "font", "decoration", "level", "highlight", "valueRuns", "figmaBoldSplit", "fit", "unit",
  "crop", "chip", "composite", "objectPosition",
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
  topRight: "Top right (optional)", bottomRight: "Bottom right (optional)",
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

/**
 * Reading order of each slide's fields, top to bottom as they appear on the slide.
 * Saved slides lose their original key order (the database sorts keys), so the form
 * sorts by this instead. Paths: pattern, then ".key" for a group and ".key[]" for a list's items.
 */
const FIELD_ORDER: Record<string, string[]> = {
  "agenda": ["title", "items"],
  "agenda.items[]": ["number", "title", "description"],
  "card-grid": ["eyebrow", "title", "subtitle", "body", "cards"],
  "card-grid.cards[]": ["country", "rail", "speed", "statuses"],
  "card-grid.cards[].statuses[]": ["label", "status"],
  "closing": ["title"],
  "cover": ["title", "subtitle", "topRight", "bottomRight"],
  "cta-contact": ["title", "subtitle", "contacts"],
  "cta-contact.contacts[]": ["label", "email"],
  "feature-cards": ["title", "cards"],
  "feature-cards.cards[]": ["number", "title", "body"],
  "key-numbers": ["title", "subtitle", "callout", "statCards", "primaryStats", "secondaryStats"],
  "key-numbers.callout": ["lead", "lines"],
  "key-numbers.statCards[]": ["value", "eyebrow", "label", "description"],
  "key-numbers.primaryStats[]": ["value", "label", "note"],
  "key-numbers.secondaryStats[]": ["value", "label"],
  "logo-wall": ["title", "body", "groups"],
  "logo-wall.groups[]": ["header", "logos"],
  "logo-wall.groups[].logos[]": ["name"],
  "product-detail": ["eyebrow", "title", "tagline", "description", "whoLabel", "who", "whatLabel", "what", "keyApisLabel", "keyApis", "pricingLabel", "pricing"],
  "product-detail.keyApis[]": ["title", "items"],
  "product-detail.pricing": ["chips", "tiers", "text", "subtext"],
  "product-detail.pricing.chips[]": ["label", "value", "caption"],
  "product-detail.pricing.tiers[]": ["tierLabel", "tier", "value", "caption", "conditionPrefix", "conditionAmount", "volumeNote"],
  "product-flow": ["eyebrow", "titleBold", "titleRegular", "steps"],
  "product-flow.steps[]": ["n", "title", "caption"],
  "product-hero": ["eyebrow", "title", "tagline"],
  "product-index": ["titleRuns", "subtitle", "pillars"],
  "product-index.pillars[]": ["number", "title", "products"],
  "product-index.pillars[].products[]": ["name", "description"],
  "section": ["number", "parentTitle", "title", "subtitle"],
  "statement-highlights": ["title", "body", "highlights"],
  "statement-highlights.highlights[]": ["title", "description"],
  "timeline": ["title", "subtitle", "items"],
  "timeline.items[]": ["year", "leftText", "bracketGroup", "text", "caption"],
};
/** For layouts not listed above: headings first, then supporting text, then everything else. */
const GENERIC_ORDER = [
  "eyebrow", "number", "n", "parentTitle", "titleRuns", "titleBold", "titleRegular", "title", "tagline", "subtitle",
  "lead", "description", "body",
];

/**
 * Optional text fields a pattern can show even when the saved slide has no value for them
 * (older slides and masters predate them). Keyed by path, then field: the placeholder shown in the form.
 */
const OPTIONAL_FIELDS: Record<string, Record<string, string>> = {
  "cover": { topRight: "e.g. Client name", bottomRight: "e.g. Event name, date and/or location" },
};

export const fieldPlaceholder = (path: string, key: string) => OPTIONAL_FIELDS[path]?.[key];

/** The slide object with its optional fields present (empty when unset), so the form can offer them. */
export function withOptionalFields(path: string, value: Record<string, unknown>): Record<string, unknown> {
  const opt = OPTIONAL_FIELDS[path];
  if (!opt) return value;
  const out = { ...value };
  for (const k of Object.keys(opt)) if (!(k in out)) out[k] = "";
  return out;
}

/** Fields that are notes for whoever placed the slide, not words on it. */
const HIDDEN_FIELDS = new Set(["logo-wall.groups[].logos[].note", "agenda.items[].number"]); // agenda numbers follow position

/** A slide object's editable fields, in the order they read on the slide. */
export function editableEntries(path: string, value: Record<string, unknown>): [string, unknown][] {
  const order = FIELD_ORDER[path] ?? GENERIC_ORDER;
  const rank = (k: string) => { const i = order.indexOf(k); return i < 0 ? order.length : i; };
  return Object.entries(withOptionalFields(path, value))
    .filter(([k, v]) => isEditableKey(k, v) && !HIDDEN_FIELDS.has(`${path}.${k}`))
    .map((e, i) => [e, i] as const)
    .sort(([[a], i], [[b], j]) => rank(a) - rank(b) || i - j)
    .map(([e]) => e);
}
