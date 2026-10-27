import Link from "next/link";
import { themeStyle } from "@/deck/theme";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { duration, getLinkForReport, linkReport, WHO, type Who } from "@/lib/analytics";
import { linkStatus } from "@/lib/share";
import { Nav } from "../../../../Nav";
import { SlideBars, Tile, when } from "../../Report";

/** One share link: who opened it, for how long, and which slides held attention. */
const WHO_LABEL: Record<Who, string> = { all: "All visits", recipients: "Recipients", team: "Team" };
const WHO_HINT: Record<Who, string> = {
  all: "Everyone who opened the link.",
  recipients: "Opened without signing in to Dekiru, usually the client on their own.",
  team: "Opened while signed in to Dekiru: someone on the team presenting it in a meeting, or checking it.",
};

export default async function LinkReportPage({ params, searchParams }: {
  params: Promise<{ id: string; linkId: string }>; searchParams: Promise<{ who?: string }>;
}) {
  const { id, linkId } = await params;
  const whoParam = (await searchParams).who;
  const who: Who = WHO.includes(whoParam as Who) ? (whoParam as Who) : "all";
  const user = await requireUser(`/decks/${id}/share/${linkId}`);
  if (!/^[0-9a-f-]{36}$/.test(linkId)) notFound();
  const link = await getLinkForReport(linkId);
  if (!link || link.deckId !== id) notFound();
  const r = await linkReport(link.id, who);
  const status = linkStatus(link);

  return (
    <main className="shell" style={themeStyle(link.theme)}>
      <Nav on="decks" user={user} />
      <p className="crumb"><Link href={`/decks/${id}/share`}>← Share · {link.deckTitle}</Link></p>
      <h1 className="page">{link.label ?? "Untitled link"}</h1>
      <p className="page-meta">
        <code className="inline">/s/{link.slug}</code> · {status === "live" ? "Live" : status[0].toUpperCase() + status.slice(1)}
      </p>

      <nav className="seg" aria-label="Whose visits">
        {WHO.map((w) => (
          <Link key={w} href={`/decks/${id}/share/${linkId}${w === "all" ? "" : `?who=${w}`}`} className={w === who ? "on" : ""} aria-current={w === who ? "page" : undefined}>
            {WHO_LABEL[w]} <span>{r.counts[w]}</span>
          </Link>
        ))}
      </nav>
      <p className="hint" style={{ margin: "8px 0 16px" }}>{WHO_HINT[who]}</p>

      <div className="tiles">
        <Tile label="Opens" value={String(r.opens)} />
        <Tile label="Time viewed" value={r.totalMs ? duration(r.totalMs) : "—"} />
        <Tile label="Average per visit" value={r.avgMs ? duration(r.avgMs) : "—"} />
        <Tile label="Last opened" value={r.lastOpened ? when(r.lastOpened) : "Not yet"} />
      </div>

      <h2 className="section-h">Time per slide</h2>
      {r.opens === 0 ? (
        <p className="mono">{r.counts.all === 0 ? "No visits yet. Numbers appear here as soon as someone opens the link." : `No ${WHO_LABEL[who].toLowerCase()} visits yet.`}</p>
      ) : (
        <SlideBars slides={link.slides} stats={r.slides} sessions={r.opens} sessionWord="Visits" />
      )}

      {r.visits.length > 0 && (
        <>
          <h2 className="section-h">Visits</h2>
          <table className="links" style={{ maxWidth: 720 }}>
            <thead><tr><th>Opened</th><th>Who</th><th>Time viewed</th><th>Slides seen</th></tr></thead>
            <tbody>
              {r.visits.map((v, i) => (
                <tr key={i}><td>{when(v.startedAt)}</td><td>{v.viewer ? <>{v.viewer} <span className="tag">team</span></> : "Recipient"}</td><td>{v.ms ? duration(v.ms) : "—"}</td><td>{v.slidesSeen} of {link.slides.length}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}

