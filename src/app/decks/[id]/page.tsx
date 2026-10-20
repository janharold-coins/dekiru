import { notFound } from "next/navigation";
import { patterns } from "@/deck/registry";
import { deckFor, deckRow } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { publishedThemes } from "@/lib/themes";
import { slideName } from "./Report";
import { DeckEditor, type EditorSlide } from "./edit/DeckEditor";

/**
 * A deck opens in the editor: slides on the left, the selected slide in the middle, its content on the right.
 * Editors' changes save to the deck's draft as you type; Publish makes them live. People who can't edit
 * the deck (members on company decks) get the same view, read-only, with Present, Share and Make a copy.
 */
export default async function DeckPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ slide?: string }> }) {
  const [{ id }, { slide }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/decks/${id}`);
  const found = await deckFor(id, user);
  if (!found) notFound();
  const { deck } = found;
  const themes = await publishedThemes();

  // Section each slide sits in (the latest section divider before it), and where approved slides come from.
  const masters = new Map<string, string>();
  for (const s of deck.slides) {
    const m = s.ref?.split("/")[0];
    if (m && !masters.has(m)) masters.set(m, (await deckRow(m))?.title ?? m);
  }
  const slides: EditorSlide[] = [];
  let section = "Opening";
  for (const s of deck.slides) {
    if (s.pattern === "section") section = slideName(s);
    slides.push({
      slide: s, name: slideName(s), section, layout: patterns[s.pattern]?.meta.name ?? s.pattern,
      from: s.ref ? { block: s.ref, deck: masters.get(s.ref.split("/")[0]) ?? s.ref } : null,
    });
  }

  return (
    <DeckEditor
      key={`${deck.versionId}-${deck.status}`}
      deck={{ id: deck.id, title: deck.title, kind: deck.kind, hasDraft: deck.status === "draft", versionNumber: deck.versionNumber ?? null }}
      slides={slides}
      initialSlide={slides.some((s) => s.slide.id === slide) ? slide! : slides[0]?.slide.id ?? null}
      theme={deck.theme}
      themes={themes.map((t) => ({ id: t.id, name: t.name, tokens: t.tokens }))}
      readOnly={!found.canEdit}
    />
  );
}
