import { redirect } from "next/navigation";

/** Slides are edited in the deck editor now. */
export default async function EditSlidePage({ params }: { params: Promise<{ id: string; slideId: string }> }) {
  const { id, slideId } = await params;
  redirect(`/decks/${id}?slide=${encodeURIComponent(slideId)}`);
}
