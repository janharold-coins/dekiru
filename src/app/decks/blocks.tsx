/* Approved slides ("blocks") to pick from: the company masters' own slides, grouped by their section dividers. */
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import { patterns } from "@/deck/registry";
import type { SignedInUser } from "@/lib/auth";
import { listDecks } from "@/lib/decks";
import type { PickerGroup } from "./BlockPicker";
import { slideName } from "./[id]/Report";

export async function blockGroups(user: SignedInUser | null): Promise<PickerGroup[]> {
  const masters = (await listDecks({ viewerId: user?.id ?? null })).filter((d) => d.kind === "master");
  const groups: PickerGroup[] = [];
  for (const d of masters) {
    // Slides shared from another master are listed once, under the deck they come from.
    const own = d.slides.filter((s) => !s.ref && !s.hidden);
    if (!own.length) continue;
    let section = "Opening";
    const sections: PickerGroup["sections"] = [];
    for (const s of own) {
      if (s.pattern === "section") section = slideName(s);
      let cur = sections.at(-1);
      if (!cur || cur.title !== section) { cur = { title: section, items: [] }; sections.push(cur); }
      cur.items.push({
        block: `${d.id}/${s.id}`, name: slideName(s), kind: patterns[s.pattern]?.meta.name ?? s.pattern,
        // Keyed: React checks keys on elements passed from the server inside lists.
        thumb: <ThemeScope key={`${d.id}/${s.id}`} tokens={d.theme.tokens}><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></ThemeScope>,
      });
    }
    groups.push({ deckId: d.id, deckTitle: d.title, sections });
  }
  return groups;
}
