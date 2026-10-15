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

/** Every version of a deck. Restoring brings an old version back as the draft, to review and publish. */
export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/decks/${id}/history`);
  const found = hasDb() ? await deckFor(id, user) : null;
  if (!found) notFound();
  const [versions, themes] = await Promise.all([listVersions(user, id), publishedThemes()]);
  const live = versions.find((v) => v.status === "published")?.number;
  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <p className="mono" style={{ margin: "0 0 4px" }}><Link href={`/decks/${id}`}>← {found.deck.title}</Link></p>
      <h1 className="page">Version history</h1>
      <p className="lede">
        Every publish is kept, with its slides and theme. Share links keep showing the version they were made from.
        {found.canEdit && " Restoring an old version puts it back as a draft, so nothing changes for anyone until you publish."}
      </p>
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
    </main>
  );
}
