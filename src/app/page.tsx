import Link from "next/link";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { patterns } from "@/deck/registry";
import { decks } from "@/content/decks";
import { Nav } from "./Nav";

export default function Home() {
  return (
    <main className="shell">
      <Nav />
      <h1 className="page">Decks</h1>
      <p className="lede">Master decks built from the pattern library. Open one to review it slide by slide, present it, or compare it with the Figma original.</p>
      <div className="grid">
        {Object.values(decks).map((d) => (
          <Link key={d.id} href={`/decks/${d.id}`} className="card">
            <ScaledSlide className="thumb"><RenderSlide slide={d.slides[0]} /></ScaledSlide>
            <div className="meta"><b>{d.title}</b><span className="spacer" /><span className="tag">{d.slides.length} slides</span></div>
          </Link>
        ))}
        <Link href="/library" className="card" style={{ display: "grid", placeItems: "center", padding: 24, minHeight: 200 }}>
          <div style={{ textAlign: "center" }}>
            <b style={{ fontSize: 18 }}>Pattern library</b>
            <div className="mono">{Object.keys(patterns).length} patterns</div>
          </div>
        </Link>
      </div>
    </main>
  );
}
