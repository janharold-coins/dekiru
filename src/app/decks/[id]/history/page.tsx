import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { deckFor } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { listVersions } from "@/lib/editing";
import { pickTheme, publishedThemes } from "@/lib/themes";
import { Nav } from "../../../Nav";
import { RestoreButton } from "../DeckActions";
import { when } from "../Report";
import { reviewHistory } from "@/lib/reviews";
import { LANGUAGES, type Lang } from "@/deck/i18n";

/** Every version of a deck. Restoring brings an old version back as the draft, to review and publish. */
export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/decks/${id}/history`);
  const found = hasDb() ? await deckFor(id, user) : null;
  if (!found) notFound();
  const [versions, themes, events] = await Promise.all([listVersions(user, id), publishedThemes(), reviewHistory(id)]);
  const live = versions.find((v) => v.status === "published")?.number;
  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <p className="crumb"><Link href={`/decks/${id}`}>← {found.deck.title}</Link></p>
      <h1 className="page">Version history</h1>
      <table className="links" style={{ maxWidth: 980 }}>
        <thead><tr><th>Version</th><th>What changed</th><th>By</th><th>When</th><th>Slides</th><th>Theme</th><th /></tr></thead>
        <tbody>
          {versions.map((v) => (
            <tr key={v.number}>
              <td>
                v{v.number}{" "}
                {v.status === "draft" ? <span className="tag warn">draft</span> : v.number === live ? <span className="tag">live</span> : null}
              </td>
              <td>{v.note ?? <span className="mono">—</span>}</td>
              <td>{(v.status === "published" ? v.publishedBy ?? v.createdBy : v.createdBy) ?? <span className="mono">system</span>}</td>
              <td>{when(v.publishedAt ?? v.createdAt)}</td>
              <td>{v.slideCount}</td>
              <td>{pickTheme(themes, v.themeId).name}</td>
              <td style={{ whiteSpace: "nowrap" }}>
                <Link className="ul" href={`/decks/${id}/history/${v.number}`}>View</Link>
                {found.canEdit && v.status === "published" && v.number !== live && <> · <RestoreButton deckId={id} number={v.number} /></>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {events.length > 0 && (
        <>
          <h2 className="section-h">Reviews</h2>
          <table className="links" style={{ maxWidth: 980 }}>
            <thead><tr><th>Version</th><th>What happened</th><th>By</th><th>When</th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td>{e.version ? `v${e.version}` : <span className="mono">—</span>}</td>
                  <td>{describe(e)}</td>
                  <td>{e.by ?? <span className="mono">system</span>}</td>
                  <td>{when(e.at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}

/** One review event as a sentence. */
function describe(e: Awaited<ReturnType<typeof reviewHistory>>[number]) {
  const layer = e.lang ? `${LANGUAGES[e.lang as Lang]?.english ?? e.lang} translation` : "deck";
  switch (e.event) {
    case "sent": return `Sent the ${layer} for review`;
    case "slide_approved": return `Approved slide ${e.slideId}${e.lang ? ` (${LANGUAGES[e.lang as Lang]?.english ?? e.lang})` : ""}`;
    case "deck_approved": return `Approved every slide of the ${layer}`;
    case "approved": return <b>{`${layer[0].toUpperCase()}${layer.slice(1)} approved`}</b>;
    case "changes_requested": return <>Requested changes to the {layer}{e.note ? <>: <i>{e.note}</i></> : null}</>;
    case "override": return <>Approved the {layer} for everyone (admin override){e.note ? <>: <i>{e.note}</i></> : null}</>;
    case "withdrawn": return `Withdrew the ${layer} from review`;
    case "promoted": return <b>Promoted to company deck</b>;
    default: return e.event;
  }
}
