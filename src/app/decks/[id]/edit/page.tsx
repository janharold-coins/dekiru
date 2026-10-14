import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { checkOverflow } from "@/deck/overflow";
import { patterns } from "@/deck/registry";
import { deckFor } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { Nav } from "../../../Nav";
import { DraftBar } from "../DeckActions";
import { slideName } from "../Report";
import { SlideEditor } from "./SlideEditor";

/** Arrange a deck: reorder, hide, remove, add approved slides. Changes save to the draft as you go. */
export default async function EditDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/decks/${id}/edit`);
  const found = await deckFor(id, user);
  if (!found) notFound();
  if (!found.canEdit) redirect(`/decks/${id}`);
  const { deck } = found;
  const items = deck.slides.map((s) => ({
    id: s.id, name: slideName(s), kind: patterns[s.pattern]?.meta.name ?? s.pattern, hidden: Boolean(s.hidden),
    follows: s.ref ?? null, overflow: checkOverflow(s).length,
    thumb: <ScaledSlide key={s.id}><RenderSlide slide={s} /></ScaledSlide>,
  }));
  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <p className="mono" style={{ margin: "0 0 4px" }}><Link href={`/decks/${deck.id}`}>← {deck.title}</Link></p>
      <div className="row" style={{ marginBottom: 8 }}>
        <h1 className="page" style={{ margin: 0 }}>Arrange slides</h1>
        <span className="spacer" style={{ flex: 1 }} />
        <Link className="btn" href={`/decks/${deck.id}/add`}>+ Add approved slides</Link>
        <Link className="btn" href={`/library/templates?deck=${encodeURIComponent(deck.id)}`}>+ From a template</Link>
        <Link className="btn primary" href={`/decks/${deck.id}`}>Done</Link>
      </div>
      <p className="lede">Drag to reorder, or use the arrows. Hidden slides stay in the deck but aren&apos;t presented or shared. Changes save as a draft; publish when you&apos;re happy. Use Edit to change a slide&apos;s words, or ask Claude with the Dekiru connector.</p>
      {deck.status === "draft" && <DraftBar deckId={deck.id} />}
      <SlideEditor key={deck.slides.map((s) => s.id + (s.hidden ? "h" : "")).join()} deckId={deck.id} items={items} />
    </main>
  );
}
