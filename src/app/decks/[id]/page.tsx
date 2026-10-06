import Link from "next/link";
import { notFound } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { PreviewChecks } from "@/deck/frame/PreviewChecks";
import { checkOverflow } from "@/deck/overflow";
import { patterns } from "@/deck/registry";
import { decks, getDeck } from "@/content/decks";
import { Nav } from "../../Nav";

export function generateStaticParams() {
  return Object.keys(decks).map((id) => ({ id }));
}

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = getDeck(id);
  if (!deck) notFound();
  return (
    <main className="shell">
      <Nav on="decks" />
      <div className="row" style={{ marginBottom: 8 }}>
        <h1 className="page" style={{ margin: 0 }}>{deck.title}</h1>
        <span className="spacer" style={{ flex: 1 }} />
        <Link className="btn" href={`/decks/${deck.id}/compare`}>Compare with Figma</Link>
        <Link className="btn primary" href={`/decks/${deck.id}/present`}>Present ▶</Link>
      </div>
      <p className="lede">{deck.slides.length} slides · master deck. Overflow flags and image-fit warnings show here in preview only, never in the presented deck.</p>
      <div className="grid">
        {deck.slides.map((s, i) => {
          const warnings = checkOverflow(s);
          return (
            <div key={s.id} className="card">
              <Link href={`/decks/${deck.id}/present#${i + 1}`}>
                <ScaledSlide className="thumb">
                  <PreviewChecks><RenderSlide slide={s} /></PreviewChecks>
                </ScaledSlide>
              </Link>
              <div className="meta">
                <b>{String(i + 1).padStart(2, "0")}</b>
                <span>{patterns[s.pattern]?.meta.name ?? s.pattern}</span>
                <span className="spacer" style={{ flex: 1 }} />
                {warnings.length > 0 && <span className="tag warn">{warnings.length} overflow</span>}
              </div>
              {warnings.length > 0 && (
                <ul className="warnlist">{warnings.map((w, j) => <li key={j}><b>{w.slot}</b>: {w.message}</li>)}</ul>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
