/**
 * Deck structure read from a master's slide order, so the New deck builder can do the obvious steps itself.
 *
 * - Product = a product-hero plus the product-detail / product-flow slides after it. Other slides that follow a
 *   product inside a sub-section (e.g. Corridor Readiness after Multi-Currency) travel with that product.
 * - A level-1 section that holds products ("Products and Pricing") is managed: its divider, its product index and
 *   its level-2 dividers (pillars) are added automatically, never picked:
 *     divider  — whenever a product is picked
 *     index    — when 3+ products are picked; lists only the picked products and pillars
 *     pillars  — when the products come from 2+ pillars
 * - Section numbers: 3+ level-1 sections → 01, 02, 03… in deck order; 2 or fewer → no numbers.
 * - Agenda: added after the cover when the deck has 3+ level-1 sections, listing exactly those sections. Never picked.
 *
 * Everything is detected from patterns and order, so new products and sections in a master follow the same rules.
 */
import type { SlideData } from "@/deck/types";
import { isRef, type SeedSlide } from "./resolve";

export interface ProductGroup { key: string; name: string; blocks: string[]; slides: SlideData[]; pillar: Pillar | null; section: ManagedSection }
export interface Pillar { block: string; slide: SlideData; order: number }
export interface ManagedSection {
  block: string; slide: SlideData;
  index: { block: string; slide: SlideData } | null;
  pillars: Pillar[];
  groups: ProductGroup[];
}
export interface MasterStructure {
  sections: ManagedSection[];
  /** Any slide of a product → its product. */
  groupOf: Map<string, ProductGroup>;
  /** Divider, index and pillar dividers of managed sections, and the agenda: added automatically. */
  managed: Set<string>;
  /** Every level-1 divider in master order (the agenda's items follow this order). */
  l1: { block: string; slide: SlideData }[];
  agenda: { block: string; slide: SlideData } | null;
}

const PRODUCT_PARTS = new Set(["product-detail", "product-flow"]);
const NEVER_ATTACH = new Set(["cover", "closing", "section", "product-index", "product-hero"]);

/** Reads a master's own presented slides (refs to other masters are skipped: they're listed under their own deck). */
export function analyzeMaster(deckId: string, stored: SeedSlide[]): MasterStructure {
  const own = stored.filter((s): s is SlideData => !isRef(s) && !s.hidden);
  const sections: ManagedSection[] = [];
  const all: MasterStructure["l1"] = [];
  let agenda: MasterStructure["agenda"] = null;
  const groupOf = new Map<string, ProductGroup>();
  let l1: ManagedSection | null = null;
  let pillar: Pillar | null = null;
  let group: ProductGroup | null = null;
  for (const s of own) {
    const block = `${deckId}/${s.id}`;
    const level = (s.props as { level?: number }).level;
    if (s.pattern === "section" && level !== 2) {
      l1 = { block, slide: s, index: null, pillars: [], groups: [] }; sections.push(l1); all.push({ block, slide: s }); pillar = null; group = null;
    } else if (s.pattern === "agenda" && !agenda) {
      agenda = { block, slide: s }; group = null;
    } else if (s.pattern === "section") {
      pillar = l1 ? { block, slide: s, order: l1.pillars.length } : null;
      if (l1 && pillar) l1.pillars.push(pillar);
      group = null;
    } else if (s.pattern === "product-index" && l1) {
      l1.index = { block, slide: s }; group = null;
    } else if (s.pattern === "product-hero" && l1) {
      const p = s.props as { title?: string };
      group = { key: block, name: (p.title ?? s.id).replace(/\s+/g, " ").trim(), blocks: [block], slides: [s], pillar, section: l1 };
      l1.groups.push(group); groupOf.set(block, group);
    } else if (group && (PRODUCT_PARTS.has(s.pattern) || (group.pillar && !NEVER_ATTACH.has(s.pattern)))) {
      group.blocks.push(block); group.slides.push(s); groupOf.set(block, group);
    } else {
      group = null;
    }
  }
  const managedSections = sections.filter((x) => x.groups.length > 0);
  const managed = new Set<string>();
  for (const m of managedSections) {
    managed.add(m.block);
    if (m.index) managed.add(m.index.block);
    for (const p of m.pillars) managed.add(p.block);
  }
  if (agenda) managed.add(agenda.block);
  return { sections: managedSections, groupOf, managed, l1: all, agenda };
}

/* ---------- product index ---------- */

interface IndexProps {
  titleRuns: { text: string; color: string }[];
  subtitle: string;
  pillars: { number: string; title: string; color: string; products: { name: string; description: string }[] }[];
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
const countWord = (n: number) => WORDS[n] ?? String(n);
const pad = (n: number) => String(n).padStart(2, "0");

/** Which picked product an index row stands for ("Scan and Pay" ↔ "QRPh Scan and Pay"). */
function findGroup(name: string, groups: ProductGroup[]) {
  const n = norm(name);
  return groups.find((g) => norm(g.name) === n) ?? groups.find((g) => norm(g.name).includes(n) || n.includes(norm(g.name)));
}

/**
 * The master's index cut down to the picked products: only their pillars, renumbered; title runs only for those pillars.
 * "Seven products. Three pillars." stays (with the real counts) only when every pillar is there.
 */
export function indexFor(master: IndexProps, section: ManagedSection, picked: ProductGroup[]): IndexProps {
  const pillars = master.pillars
    .map((p, i) => ({ p, i, products: p.products.filter((pr) => { const g = findGroup(pr.name, section.groups); return g ? picked.includes(g) : false; }) }))
    .filter((x) => x.products.length > 0);
  const runsMatch = master.titleRuns.length === master.pillars.length;
  const runs = runsMatch ? pillars.map((x) => ({ ...master.titleRuns[x.i] })) : master.titleRuns.map((r) => ({ ...r }));
  if (runsMatch && runs.length) {
    // Same punctuation as the design: "Pay. Move. Trade" — every run but the last ends ". ".
    runs.forEach((r, i) => {
      const word = r.text.replace(/[.\s]+$/, "");
      r.text = i < runs.length - 1 ? `${word}. ` : word;
    });
  }
  const allPillars = pillars.length === master.pillars.length;
  const count = pillars.reduce((n, x) => n + x.products.length, 0);
  const lead = /^\s*\S+\s+products?\.\s*\S+\s+pillars?\.\s*/i;
  const subtitle = !lead.test(master.subtitle)
    ? master.subtitle
    : allPillars
      ? master.subtitle.replace(lead, `${countWord(count)} product${count === 1 ? "" : "s"}. ${countWord(pillars.length)} pillar${pillars.length === 1 ? "" : "s"}. `)
      : master.subtitle.replace(lead, "");
  return { ...master, titleRuns: runs, subtitle, pillars: pillars.map((x, i) => ({ ...x.p, number: pad(i + 1), products: x.products })) };
}

/* ---------- arranging a new deck ---------- */

export interface Built { block?: string; slide?: SlideData }

/**
 * Turns picked blocks (in click order) into the deck's slide list. Products expand to all their slides and gather,
 * in master order, under their section's divider (+ index, + pillar dividers) where the first product was picked.
 * Picked dividers/indexes of managed sections are dropped: the rules decide them.
 * Returns blocks for linked slides and full slides for ones made for this deck (a cut-down index).
 */
export function arrange(picks: string[], structures: MasterStructure[]): Built[] {
  const groupOf = new Map<string, ProductGroup>();
  const managed = new Set<string>();
  for (const s of structures) { s.groupOf.forEach((g, b) => groupOf.set(b, g)); s.managed.forEach((b) => managed.add(b)); }
  const picked = new Set<ProductGroup>();
  for (const b of picks) { const g = groupOf.get(b); if (g) picked.add(g); }

  const out: Built[] = [];
  const done = new Set<ManagedSection>();
  const seen = new Set<string>();
  for (const b of picks) {
    if (managed.has(b)) continue;
    const g = groupOf.get(b);
    if (!g) { if (!seen.has(b)) { seen.add(b); out.push({ block: b }); } continue; }
    if (done.has(g.section)) continue;
    done.add(g.section);
    const sec = g.section;
    const groups = sec.groups.filter((x) => picked.has(x));
    out.push({ block: sec.block });
    if (groups.length >= 3 && sec.index) {
      const all = groups.length === sec.groups.length;
      out.push(all ? { block: sec.index.block } : { slide: { ...sec.index.slide, props: indexFor(sec.index.slide.props as unknown as IndexProps, sec, groups) as unknown as Record<string, unknown>, source: { ...sec.index.slide.source, copiedFrom: sec.index.block } } });
    }
    const pillars = [...new Set(groups.map((x) => x.pillar))];
    const withDividers = pillars.filter(Boolean).length >= 2;
    for (const p of pillars) {
      if (withDividers && p) out.push({ block: p.block });
      for (const x of groups.filter((y) => y.pillar === p)) for (const xb of x.blocks) { seen.add(xb); out.push({ block: xb }); }
    }
  }
  return out;
}

/**
 * Section numbers for a whole deck: 3+ level-1 sections → "01", "02"…; otherwise none.
 * Level-2 dividers carry their parent's number. Returns the number each section slide should show, by position.
 */
export function sectionNumbers(slides: SlideData[]): Map<number, string> {
  const l1 = slides.filter((s) => s.pattern === "section" && (s.props as { level?: number }).level !== 2).length;
  const out = new Map<number, string>();
  let n = 0, current = "";
  slides.forEach((s, i) => {
    if (s.pattern !== "section") return;
    if ((s.props as { level?: number }).level !== 2) { n++; current = l1 >= 3 ? pad(n) : ""; }
    out.set(i, l1 >= 3 ? current : "");
  });
  return out;
}

/* ---------- agenda ---------- */

interface AgendaProps { title: string; items: { number: string; title: string; description: string }[] }
const oneLine = (s: string) => s.replace(/\s*\n\s*/g, " ").trim();

/**
 * The agenda for a deck's level-1 sections (3+; otherwise none). Each section takes the wording of the master
 * agenda row in the same position ("About Coins.ph" → "About us"); a section the master agenda doesn't cover uses
 * its own title and subtitle. Linked to the master agenda when the sections are exactly the master's.
 */
export function agendaFor(sections: { block?: string; slide: SlideData }[], structures: MasterStructure[]): Built | null {
  if (sections.length < 3) return null;
  const source = structures.find((s) => s.agenda && sections.some((x) => x.block && s.l1.some((l) => l.block === x.block)))
    ?? structures.find((s) => s.agenda);
  if (!source?.agenda) return null;
  const master = source.agenda.slide.props as unknown as AgendaProps;
  const same = sections.length === source.l1.length && sections.every((x, i) => x.block === source.l1[i].block)
    && master.items.length === source.l1.length;
  if (same) return { block: source.agenda.block };
  const items = sections.map((x, i) => {
    const at = source.l1.findIndex((l) => l.block === x.block);
    const row = at >= 0 && source.l1.length === master.items.length ? master.items[at] : null;
    const p = x.slide.props as { title?: string; subtitle?: string };
    return { number: pad(i + 1), title: row?.title ?? oneLine(p.title ?? ""), description: row?.description ?? oneLine(p.subtitle ?? "") };
  });
  return { slide: { ...source.agenda.slide, props: { ...master, items } as unknown as Record<string, unknown>, source: { ...source.agenda.slide.source, copiedFrom: source.agenda.block } } };
}
