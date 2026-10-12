import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { duration, presentationReport, SHORT_PRESENTATION_MS } from "@/lib/analytics";
import { getDeck } from "@/lib/decks";
import { Nav } from "../../../Nav";
import { SlideBars, Tile, when } from "../Report";

/** Every time someone presented this deck with the Present button: who, to whom, how long, which slides. */
export default async function PresentationsPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ short?: string }>;
}) {
  const { id } = await params;
  const includeShort = (await searchParams).short === "1";
  const user = await requireUser(`/decks/${id}/presentations`);
  const deck = await getDeck(id);
  if (!deck) notFound();
  const shown = deck.slides.filter((s) => !s.hidden);
  const r = hasDb() ? await presentationReport(deck.id, { includeShort }) : null;
  const secs = SHORT_PRESENTATION_MS / 1000;

  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <p className="mono" style={{ margin: "0 0 4px" }}><Link href={`/decks/${deck.id}`}>← {deck.title}</Link></p>
      <h1 className="page">Presentations</h1>
      <p className="lede">
        Every time someone on the team presented this deck with the <b>Present</b> button. Time counts only while the deck is
        on screen. Presenters can note who they&apos;re presenting to in the bar at the bottom of the presenter.
      </p>

      {!r ? (
        <p className="hint warn">Tracking needs the database. Add DATABASE_URL to .env.local.</p>
      ) : (
        <>
          <div className="tiles">
            <Tile label="Presentations" value={String(r.shown)} />
            <Tile label="Time presenting" value={r.totalMs ? duration(r.totalMs) : "—"} />
            <Tile label="Average length" value={r.avgMs ? duration(r.avgMs) : "—"} />
            <Tile label="Last presented" value={r.last ? when(r.last) : "Not yet"} />
          </div>
          <p className="hint" style={{ marginTop: 10 }}>
            {includeShort
              ? <>Showing everything, including quick checks under {secs} s. <Link className="ul" href={`/decks/${deck.id}/presentations`}>Hide them</Link></>
              : r.short > 0
                ? <>{r.short} quick {r.short === 1 ? "check" : "checks"} under {secs} s hidden. <Link className="ul" href={`/decks/${deck.id}/presentations?short=1`}>Show</Link></>
                : <>Sessions under {secs} s count as quick checks and are hidden.</>}
          </p>

          <h2 className="section-h">Time per slide</h2>
          <p className="lede" style={{ marginBottom: 12 }}>Total across these presentations, and how many reached each slide.</p>
          {r.shown === 0
            ? <p className="mono">No presentations yet. They appear here after someone presents this deck for {secs} seconds or more.</p>
            : <SlideBars slides={shown} stats={r.slides} sessions={r.shown} sessionWord="Reached" />}

          {r.sessions.length > 0 && (
            <>
              <h2 className="section-h">Sessions</h2>
              <table className="links" style={{ maxWidth: 960 }}>
                <thead><tr><th>When</th><th>Presented by</th><th>Presenting to</th><th>Length</th><th>Slides shown</th></tr></thead>
                <tbody>
                  {r.sessions.map((s) => (
                    <tr key={s.id}>
                      <td>{when(s.startedAt)}</td>
                      <td>{s.presenter ?? <span className="mono">local</span>}</td>
                      <td>{s.audience ?? <span className="mono">—</span>}</td>
                      <td>{s.ms ? duration(s.ms) : "—"}</td>
                      <td>{s.slidesSeen} of {shown.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </main>
  );
}
