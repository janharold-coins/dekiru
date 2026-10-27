/* Approved slides ("blocks") to pick from: the company masters' own slides, grouped by their section dividers. */
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import { patterns } from "@/deck/registry";
import type { SlideData } from "@/deck/types";
import { analyzeMaster } from "@/content/structure";
import type { SignedInUser } from "@/lib/auth";
import { listDecks } from "@/lib/decks";
import type { PickerGroup } from "./BlockPicker";
import { slideName } from "./[id]/Report";

/**
 * Products show as one stacked card (picking it adds all its slides).
 * smart (the New deck screen): the cover, closing, product section dividers and indexes are left out — they're added automatically.
 */
export async function blockGroups(user: SignedInUser | null, { smart = false, themed = true }: { smart?: boolean; themed?: boolean } = {}): Promise<PickerGroup[]> {
  const masters = (await listDecks({ viewerId: user?.id ?? null })).filter((d) => d.kind === "master");
  const groups: PickerGroup[] = [];
  for (const d of masters) {
    // Slides shared from another master are listed once, under the deck they come from.
    const own = d.slides.filter((s) => !s.ref && !s.hidden);
    if (!own.length) continue;
    const structure = analyzeMaster(d.id, own);
    // Keyed: React checks keys on elements passed from the server inside lists.
    // themed: false leaves the theme to the page (the New deck screen previews everything in the chosen theme).
    const thumb = (s: SlideData) => themed
      ? <ThemeScope key={`${d.id}/${s.id}`} tokens={d.theme.tokens}><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></ThemeScope>
      : <ScaledSlide key={`${d.id}/${s.id}`}><RenderSlide slide={s} /></ScaledSlide>;
    let section = "Opening";
    const sections: PickerGroup["sections"] = [];
    for (const s of own) {
      const block = `${d.id}/${s.id}`;
      if (s.pattern === "section") section = slideName(s);
      if (smart && structure.managed.has(block)) continue;
      if (smart && (s.pattern === "cover" || s.pattern === "closing")) continue; // every new deck gets its own
      const product = structure.groupOf.get(block);
      if (product && product.key !== block) continue;
      let cur = sections.at(-1);
      if (!cur || cur.title !== section) { cur = { title: section, items: [] }; sections.push(cur); }
      cur.items.push(product
        ? { block, blocks: product.blocks, name: product.name, kind: `${product.blocks.length} slides`, thumb: thumb(s), stack: product.slides.slice(1, 3).map(thumb) }
        : { block, blocks: [block], name: slideName(s), kind: patterns[s.pattern]?.meta.name ?? s.pattern, thumb: thumb(s) });
    }
    groups.push({ deckId: d.id, deckTitle: d.title, sections });
  }
  return groups;
}

/** Number of slides the picker offers (products count all their slides). */
export const slideCount = (groups: PickerGroup[]) =>
  groups.reduce((n, g) => n + g.sections.reduce((m, s) => m + s.items.reduce((k, i) => k + i.blocks.length, 0), 0), 0);
