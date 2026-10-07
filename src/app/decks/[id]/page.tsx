import Link from "next/link";
import { notFound } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { PreviewChecks } from "@/deck/frame/PreviewChecks";
import { checkOverflow } from "@/deck/overflow";
import { patterns } from "@/deck/registry";
import { getDeck } from "@/lib/decks";
import { requireUser } from "@/lib/auth";
import { Nav } from "../../Nav";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/decks/${id}`);
  const deck = await getDeck(id);
  if (!deck) notFound();
  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <div className="row" style={{ marginBottom: 8 }}>
        <h1 className="page" style={{ margin: 0 }}>{deck.title}</h1>
        <span className="spacer" style={{ flex: 1 }} />
        <Link className="btn" href={`/decks/${deck.id}/compare`}>Compare with Figma</Link>
        <Link className="btn" href={`/decks/${deck.id}/share`}>Share</Link>
        <Link className="btn primary" href={`/decks/${deck.id}/present`}>Present ▶</Link>
      </div>
      <p className="lede">{deck.slides.filter((s) => !s.hidden).length} slides presented{deck.slides.some((s) => s.hidden) ? ` · ${deck.slides.filter((s) => s.hidden).length} hidden` : ""} · {deck.kind === "master" ? "master deck" : "personal copy"}{deck.versionNumber ? ` · v${deck.versionNumber}${deck.hasDraft ? " (unpublished draft exists)" : ""}` : ""}{deck.slides.some((s) => s.ref) ? ` · ${deck.slides.filter((s) => s.ref).length} shared with other decks` : ""}. Overflow flags and image-fit warnings show here in preview only, never in the presented deck.</p>
      <div className="grid">
        {deck.slides.map((s, i) => {
          const warnings = checkOverflow(s);
          const presentIndex = deck.slides.slice(0, i).filter((x) => !x.hidden).length + 1;
          return (
            <div key={s.id} className="card" style={s.hidden ? { opacity: 0.45 } : undefined}>
              <Link href={s.hidden ? "#" : `/decks/${deck.id}/present#${presentIndex}`}>
                <ScaledSlide className="thumb">
                  <PreviewChecks><RenderSlide slide={s} /></PreviewChecks>
                </ScaledSlide>
              </Link>
              <div className="meta">
                <b>{s.hidden ? "—" : String(presentIndex).padStart(2, "0")}</b>
                <span>{patterns[s.pattern]?.meta.name ?? s.pattern}</span>
                <span className="mono" title="Position in the Figma file">fig {s.source?.slide ?? i + 1}</span>
                <span className="spacer" style={{ flex: 1 }} />
                {s.ref && <span className="tag" title={`Shared slide — edits to ${s.ref} apply to every deck that uses it`}>Shared · {s.ref.split("/")[0]}</span>}
                {s.hidden && <span className="tag">Hidden</span>}
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
