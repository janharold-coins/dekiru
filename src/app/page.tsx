import Link from "next/link";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { patterns } from "@/deck/registry";
import { listDecks } from "@/lib/decks";
import { requireUser } from "@/lib/auth";
import { Nav } from "./Nav";

function DeckCard({ d }: { d: Awaited<ReturnType<typeof listDecks>>[number] }) {
  return (
    <Link href={`/decks/${d.id}`} className="card">
      <ScaledSlide className="thumb"><RenderSlide slide={d.slides[0]} /></ScaledSlide>
      <div className="meta">
        <b>{d.title}</b><span className="spacer" />
        {d.hasDraft && <span className="tag warn">draft</span>}
        <span className="tag">{d.slides.filter((s) => !s.hidden).length} slides</span>
      </div>
    </Link>
  );
}

export default async function Home() {
  const user = await requireUser("/");
  const decks = await listDecks({ viewerId: user?.id ?? null });
  const masters = decks.filter((d) => d.kind === "master");
  const mine = decks.filter((d) => d.kind !== "master");
  return (
    <main className="shell">
      <Nav user={user} />
      <h1 className="page">Decks</h1>
      <p className="lede">Company master decks, and your own decks made from them. Make a copy to tailor a deck for a client; masters change only through admins and managers.</p>
      <h2 className="section-h" style={{ marginTop: 8 }}>Company decks</h2>
      <div className="grid">
        {masters.map((d) => <DeckCard key={d.id} d={d} />)}
        <Link href="/library" className="card" style={{ display: "grid", placeItems: "center", padding: 24, minHeight: 200 }}>
          <div style={{ textAlign: "center" }}>
            <b style={{ fontSize: 18 }}>Pattern library</b>
            <div className="mono">{Object.keys(patterns).length} patterns</div>
          </div>
        </Link>
      </div>
      <div className="row" style={{ marginTop: 48 }}>
        <h2 className="section-h" style={{ margin: 0 }}>My decks</h2>
        <span className="spacer" style={{ flex: 1 }} />
        <Link className="btn primary" href="/new">+ New deck</Link>
      </div>
      {mine.length ? (
        <div className="grid">{mine.map((d) => <DeckCard key={d.id} d={d} />)}</div>
      ) : (
        <p className="mono">None yet. Start a New deck from approved slides, open a company deck and click Make a copy, or ask Claude (Dekiru connector) to build one.</p>
      )}
    </main>
  );
}
