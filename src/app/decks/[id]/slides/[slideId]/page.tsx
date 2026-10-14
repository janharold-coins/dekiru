import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deckFor, deckRow } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { EditError, updateSlide } from "@/lib/editing";
import { Nav } from "../../../../Nav";
import { SlideForm } from "../../../SlideForm";
import { slideName } from "../../Report";

/** Edit one slide's words in a deck you can edit. Saves to the deck's draft. */
export default async function EditSlidePage({ params }: { params: Promise<{ id: string; slideId: string }> }) {
  const { id, slideId } = await params;
  const user = await requireUser(`/decks/${id}/slides/${slideId}`);
  const found = await deckFor(id, user);
  if (!found) notFound();
  if (!found.canEdit) redirect(`/decks/${id}`);
  const slide = found.deck.slides.find((s) => s.id === slideId);
  if (!slide) notFound();
  async function save(props: Record<string, unknown>) {
    "use server";
    const u = await requireUser(`/decks/${id}/slides/${slideId}`);
    try { await updateSlide(u, id, slideId, props, undefined, "app"); }
    catch (e) { return { error: e instanceof EditError ? e.message : (e as Error).message }; }
    redirect(`/decks/${id}/edit`);
  }
  const { ref, ...plain } = slide;
  const master = ref ? (await deckRow(ref.split("/")[0]))?.title ?? ref.split("/")[0] : null;
  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <p className="mono" style={{ margin: "0 0 4px" }}><Link href={`/decks/${id}/edit`}>← Arrange {found.deck.title}</Link></p>
      <h1 className="page">Edit slide: {slideName(slide)}</h1>
      <p className="lede">Changes save to the deck&apos;s draft. Publish when you&apos;re happy.</p>
      <SlideForm slide={plain} saveLabel="Save to draft" onSave={save}
        note={ref ? (
          <p className="sf-note">
            This is an approved slide from {master}. Saving your edits makes it this deck&apos;s own slide,
            so later updates to {master} won&apos;t reach it.
          </p>
        ) : undefined} />
    </main>
  );
}
