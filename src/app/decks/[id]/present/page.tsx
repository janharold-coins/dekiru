import { notFound } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { decks, getDeck } from "@/content/decks";
import { Presenter } from "./Presenter";

export function generateStaticParams() {
  return Object.keys(decks).map((id) => ({ id }));
}

export default async function PresentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = getDeck(id);
  if (!deck) notFound();
  return <Presenter slides={deck.slides.filter((s) => !s.hidden).map((s) => <RenderSlide key={s.id} slide={s} />)} />;
}
