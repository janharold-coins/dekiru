import { requireUser } from "@/lib/auth";
import { ThemeScope } from "@/deck/ThemeScope";
import { notFound } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { deckFor } from "@/lib/access";
import { TrackedPresenter } from "./TrackedPresenter";
import { ReviewNotice } from "./ReviewNotice";
import { reviewState } from "@/lib/reviews";
import { hasDb } from "@/db/client";

export default async function PresentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/decks/${id}/present`);
  const found = await deckFor(id, user);
  if (!found) notFound();
  const { deck } = found;
  const shown = deck.slides.filter((s) => !s.hidden);
  const approved = hasDb() ? (await reviewState(deck.id)).approved : [];
  return (
    <ThemeScope tokens={deck.theme.tokens}>
    <TrackedPresenter
      trackUrl={`/decks/${deck.id}/present/track`}
      askAudience
      slideIds={shown.map((s) => s.id)}
      slides={shown.map((s) => <RenderSlide key={s.id} slide={s} />)}
    />
    <ReviewNotice approved={approved} lang="en" team />
    </ThemeScope>
  );
}
