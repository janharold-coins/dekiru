import { requireUser } from "@/lib/auth";
import { ThemeScope } from "@/deck/ThemeScope";
import { notFound } from "next/navigation";
import { deckFor } from "@/lib/access";
import { DeckViewer } from "./DeckViewer";
import { approvedLayers } from "@/lib/reviews";
import { hasDb } from "@/db/client";

export default async function PresentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ lang?: string }> }) {
  const [{ id }, { lang = "en" }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/decks/${id}/present`);
  const found = await deckFor(id, user);
  if (!found) notFound();
  const { deck } = found;
  const shown = deck.slides.filter((s) => !s.hidden);
  const approved = hasDb() ? await approvedLayers(deck.id) : [];
  return (
    <ThemeScope tokens={deck.theme.tokens}>
    <DeckViewer slides={shown} trackUrl={`/decks/${deck.id}/present/track`} initialLang={lang} approved={approved} team askAudience />
    </ThemeScope>
  );
}
