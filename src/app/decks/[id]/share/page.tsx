import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { getDeck } from "@/lib/decks";
import { listShareLinks } from "@/lib/share";
import { Nav } from "../../../Nav";
import { revokeLinkAction } from "./actions";
import { CopyButton, NewLinkForm } from "./NewLinkForm";

const fmt = (d: Date) => d.toLocaleDateString("en-PH", { day: "numeric", month: "short", year: "numeric" });

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/decks/${id}/share`);
  const deck = await getDeck(id);
  if (!deck) notFound();
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <p className="mono" style={{ margin: "0 0 4px" }}><Link href={`/decks/${deck.id}`}>← {deck.title}</Link></p>
      <h1 className="page">Share</h1>
      <p className="lede">
        A link shows this deck exactly as it is now{deck.versionNumber ? ` (v${deck.versionNumber})` : ""}. Later edits to the deck never change a link
        you&apos;ve sent; make a new link to send an update. Links are password-protected unless you choose otherwise.
      </p>
      {!hasDb() ? (
        <p className="hint warn">Sharing needs the database. Add DATABASE_URL to .env.local.</p>
      ) : (
        <>
          <NewLinkForm deckId={deck.id} origin={origin} />
          <LinkList deckId={deck.id} origin={origin} userId={user?.id ?? null} canRevokeAll={!user || user.role !== "member"} />
        </>
      )}
    </main>
  );
}

async function LinkList({ deckId, origin, userId, canRevokeAll }: { deckId: string; origin: string; userId: string | null; canRevokeAll: boolean }) {
  const links = await listShareLinks(deckId);
  if (!links.length) return <p className="mono">No links yet.</p>;
  return (
    <table className="links">
      <thead>
        <tr><th>For</th><th>Link</th><th>Version</th><th>Made by</th><th>Opens</th><th>Status</th><th /></tr>
      </thead>
      <tbody>
        {links.map((l) => (
          <tr key={l.id} className={l.status === "live" ? "" : "dead"}>
            <td>{l.label ?? <span className="mono">—</span>}{l.hasPassword ? "" : <span className="tag warn" style={{ marginLeft: 6 }}>no password</span>}</td>
            <td><code>/s/{l.slug}</code> {l.status === "live" && <CopyButton text={`${origin}/s/${l.slug}`} label="Copy" />}</td>
            <td>v{l.versionNumber} <span className="mono">· {l.slideCount} slides</span></td>
            <td>{l.creatorName || l.creatorEmail || <span className="mono">local</span>}<div className="mono">{fmt(l.createdAt)}</div></td>
            <td>{l.opens}</td>
            <td>
              {l.status === "live" ? <span className="tag">Live</span> : <span className="tag warn">{l.status === "revoked" ? "Revoked" : "Expired"}</span>}
              {l.status === "live" && <div className="mono">{l.expiresAt ? `until ${fmt(l.expiresAt)}` : "no expiry"}</div>}
            </td>
            <td>
              {l.status === "live" && (canRevokeAll || l.createdBy === userId) && (
                <form action={revokeLinkAction}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="linkish">Revoke</button>
                </form>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
