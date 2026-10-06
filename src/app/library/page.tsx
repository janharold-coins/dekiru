import Link from "next/link";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { patternOrder, patterns } from "@/deck/registry";
import { decks } from "@/content/decks";
import { Nav } from "../Nav";

export default function LibraryPage() {
  const all = Object.values(decks).flatMap((d) => d.slides.map((s, i) => ({ deck: d, slide: s, index: i })));
  return (
    <main className="shell">
      <Nav on="library" />
      <h1 className="page">Pattern library</h1>
      <p className="lede">
        {patternOrder.length} patterns. A pattern is a layout that takes any content; blocks (approved content) and decks are built from them.
        Character budgets below are when Dekiru flags overflow: it suggests a rephrase or another layout and never shrinks type.
      </p>
      {patternOrder.map((id) => {
        const { meta } = patterns[id];
        const uses = all.filter((u) => u.slide.pattern === id);
        return (
          <section key={id} className="pattern" id={id}>
            <header>
              <h3>{meta.name}</h3>
              <span className="mono">{id}</span>
              {meta.shape && <span className="tag">{meta.shape}</span>}
              <span style={{ flex: 1 }} />
              <span className="mono">{uses.length} slide{uses.length === 1 ? "" : "s"} in master decks</span>
            </header>
            <p style={{ margin: "6px 0 0", maxWidth: 900 }}>{meta.description}</p>
            <div className="chips">
              <span>bg: {meta.defaultChrome.background}{meta.defaultChrome.overlay ? " + glow" : ""}</span>
              <span>footer: {meta.defaultChrome.footer ?? "none"}</span>
              {meta.defaultChrome.accentBar && <span>accent bar</span>}
              {(meta.budgets ?? []).map((b) => (
                <span key={b.slot}>
                  {b.slot}: {[b.maxItems && `≤${b.maxItems} items`, b.maxChars && `≤${b.maxChars} chars`, b.maxLines && `≤${b.maxLines} lines`].filter(Boolean).join(", ")}
                </span>
              ))}
            </div>
            <div className="strip">
              {uses.map((u) => (
                <figure key={u.deck.id + u.slide.id}>
                  <Link href={`/decks/${u.deck.id}/present#${u.index + 1}`} className="frame" style={{ display: "block" }}>
                    <ScaledSlide><RenderSlide slide={u.slide} /></ScaledSlide>
                  </Link>
                  <figcaption>{u.deck.id} · slide {u.index + 1}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
