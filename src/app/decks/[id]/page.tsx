import Link from "next/link";
import { notFound } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { PreviewChecks } from "@/deck/frame/PreviewChecks";
import { checkOverflow } from "@/deck/overflow";
import { patterns } from "@/deck/registry";
import { deckFor } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { Nav } from "../../Nav";
import { CopyButton, DraftBar } from "./DeckActions";

export default async function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/decks/${id}`);
  const found = await deckFor(id, user);
  if (!found) notFound();
  const { deck, canEdit } = found;
  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <div className="row" style={{ marginBottom: 8 }}>
        <h1 className="page" style={{ margin: 0 }}>{deck.title}</h1>
        <span className="spacer" style={{ flex: 1 }} />
        {deck.kind === "master" && <Link className="btn" href={`/decks/${deck.id}/compare`}>Compare with Figma</Link>}
        {canEdit && <Link className="btn" href={`/decks/${deck.id}/edit`}>Arrange slides</Link>}
        {deck.versionNumber && <Link className="btn" href={`/decks/${deck.id}/history`}>History</Link>}
        <CopyButton deckId={deck.id} />
        <Link className="btn" href={`/decks/${deck.id}/presentations`}>Presentations</Link>
        <Link className="btn" href={`/decks/${deck.id}/share`}>Share</Link>
        <Link className="btn primary" href={`/decks/${deck.id}/present`}>Present ▶</Link>
      </div>
      {canEdit && deck.status === "draft" && <DraftBar deckId={deck.id} />}
      <p className="lede">{deck.slides.filter((s) => !s.hidden).length} slides presented{deck.slides.some((s) => s.hidden) ? ` · ${deck.slides.filter((s) => s.hidden).length} hidden` : ""} · {deck.kind === "master" ? "master deck" : "personal copy"}{deck.versionNumber ? ` · ${deck.status === "draft" ? `draft after v${deck.versionNumber - 1}` : `v${deck.versionNumber}`}` : ""}{deck.slides.some((s) => s.ref) ? ` · ${deck.slides.filter((s) => s.ref).length} shared with other decks` : ""}. Overflow flags and image-fit warnings show here in preview only, never in the presented deck.</p>
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
                {deck.kind === "master" && <span className="mono" title="Position in the Figma file">fig {s.source?.slide ?? i + 1}</span>}
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
