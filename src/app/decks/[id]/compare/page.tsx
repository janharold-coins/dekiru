import { notFound } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { patterns } from "@/deck/registry";
import { decks, getDeck } from "@/content/decks";
import { Nav } from "../../../Nav";

export function generateStaticParams() {
  return Object.keys(decks).map((id) => ({ id }));
}

/** Side by side: Figma render (left) vs code render (right), for parity review. */
export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deck = getDeck(id);
  if (!deck) notFound();
  return (
    <main className="shell">
      <Nav on="decks" />
      <h1 className="page">{deck.title}: Figma vs code</h1>
      <p className="lede">Left: the Figma frame. Right: the same slide rendered from the pattern library. Differences in letterforms usually mean the Cns Manrope / TWK Everett font files aren&apos;t installed on this machine.</p>
      {deck.slides.map((s, i) => (
        <div key={s.id} className="compare">
          <div className="slidehead">
            <span>{String(i + 1).padStart(2, "0")}</span>
            <span className="tag">{patterns[s.pattern]?.meta.name ?? s.pattern}</span>
            {s.hidden && <span className="tag">Hidden</span>}
            <span className="mono">figma {s.source?.figmaNode}{s.source?.visualNode ? ` · visual ${s.source.visualNode}` : ""}</span>
          </div>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={`Figma slide ${i + 1}`} src={`/figma/ref/${String(s.source?.slide ?? i + 1).padStart(2, "0")}.jpg`} />
            <figcaption><span>Figma</span></figcaption>
          </figure>
          <figure>
            <ScaledSlide><RenderSlide slide={s} /></ScaledSlide>
            <figcaption><span>Code</span></figcaption>
          </figure>
        </div>
      ))}
    </main>
  );
}
