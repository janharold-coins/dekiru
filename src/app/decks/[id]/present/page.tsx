import { notFound } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { getDeck } from "@/lib/decks";
import { Presenter } from "./Presenter";

export default async function PresentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = await getDeck(id);
  if (!deck) notFound();
  return <Presenter slides={deck.slides.filter((s) => !s.hidden).map((s) => <RenderSlide key={s.id} slide={s} />)} />;
}
