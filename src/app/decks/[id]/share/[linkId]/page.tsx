import Link from "next/link";
import { notFound } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import type { SlideData } from "@/deck/types";
import { patterns } from "@/deck/registry";
import { requireUser } from "@/lib/auth";
import { duration, getLinkForReport, linkReport } from "@/lib/analytics";
import { linkStatus } from "@/lib/share";
import { Nav } from "../../../../Nav";

const when = (d: Date) =>
  d.toLocaleString("en-PH", { timeZone: "Asia/Manila", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

function slideName(s: SlideData) {
  const p = s.props as Record<string, unknown>;
  const runs = Array.isArray(p.titleRuns) ? (p.titleRuns as { text: string }[]).map((r) => r.text).join("") : null;
  const t = String(p.title ?? p.titleBold ?? runs ?? "").replace(/\s*\n\s*/g, " ").trim();
  const kind = patterns[s.pattern]?.meta.name ?? s.pattern;
  // Product slides share a title (hero, detail, flow), so say which one.
  return s.pattern.startsWith("product-") && s.pattern !== "product-index" ? `${t} · ${kind.replace(/^Product /, "")}` : t || kind;
}

/** One share link: who opened it, for how long, and which slides held attention. */
export default async function LinkReportPage({ params }: { params: Promise<{ id: string; linkId: string }> }) {
  const { id, linkId } = await params;
  const user = await requireUser(`/decks/${id}/share/${linkId}`);
  if (!/^[0-9a-f-]{36}$/.test(linkId)) notFound();
  const link = await getLinkForReport(linkId);
  if (!link || link.deckId !== id) notFound();
  const r = await linkReport(link.id);
  const bySlide = new Map(r.slides.map((s) => [s.slideId, s]));
  const peak = Math.max(1, ...r.slides.map((s) => s.ms));
  const status = linkStatus(link);

  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <p className="mono" style={{ margin: "0 0 4px" }}><Link href={`/decks/${id}/share`}>← Share · {link.deckTitle}</Link></p>
      <h1 className="page">{link.label ?? "Untitled link"}</h1>
      <p className="lede">
        <code className="inline">/s/{link.slug}</code> · {status === "live" ? "live" : status} · visible time only; visits by
        people signed in to Dekiru aren&apos;t counted{r.internalOpens ? ` (${r.internalOpens} internal ${r.internalOpens === 1 ? "visit" : "visits"} left out)` : ""}.
      </p>

      <div className="tiles">
        <Tile label="Opens" value={String(r.opens)} />
        <Tile label="Time viewed" value={r.totalMs ? duration(r.totalMs) : "—"} />
        <Tile label="Average per visit" value={r.avgMs ? duration(r.avgMs) : "—"} />
        <Tile label="Last opened" value={r.lastOpened ? when(r.lastOpened) : "Not yet"} />
      </div>

      <h2 className="section-h">Time per slide</h2>
      <p className="lede" style={{ marginBottom: 12 }}>Total time across all visits, and how many visits reached each slide.</p>
      {r.opens === 0 ? (
        <p className="mono">No visits yet. Numbers appear here as soon as someone opens the link.</p>
      ) : (
        <ol className="slidebars">
          <li className="head" aria-hidden><span /><span /><span>Slide</span><span>Time</span><span>Visits</span></li>
          {link.slides.map((s, i) => {
            const v = bySlide.get(s.id);
            const frac = v ? Math.max(0.015, v.ms / peak) : 0;
            return (
              <li key={s.id}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <ScaledSlide className="mini"><RenderSlide slide={s} /></ScaledSlide>
                <span className="name">{slideName(s)}</span>
                <span className="bar">
                  {v && <i style={{ "--p": frac } as React.CSSProperties} />}
                  <b>{v ? duration(v.ms) : "not seen"}</b>
                </span>
                <span className="reach">{v ? `${v.reach} of ${r.opens}` : "—"}</span>
              </li>
            );
          })}
        </ol>
      )}

      {r.visits.length > 0 && (
        <>
          <h2 className="section-h">Visits</h2>
          <table className="links" style={{ maxWidth: 720 }}>
            <thead><tr><th>Opened</th><th>Time viewed</th><th>Slides seen</th></tr></thead>
            <tbody>
              {r.visits.map((v, i) => (
                <tr key={i}><td>{when(v.startedAt)}</td><td>{v.ms ? duration(v.ms) : "—"}</td><td>{v.slidesSeen} of {link.slides.length}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </main>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="tile">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
