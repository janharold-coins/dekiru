import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import { requireUser } from "@/lib/auth";
import { canUseStudio, decisionsOf, KIND_LABEL, openRequests, STATUS_LABEL, statusOf, type RequestKind, type Status } from "@/lib/studio";
import { proposals } from "@/studio/proposals";
import { Nav } from "../Nav";
import { PageHero } from "../PageHero";
import { layoutSamples } from "../library/themes/samples";
import { DismissRequest, RequestForm } from "./StudioForms";

const TABS: Status[] = ["waiting", "changes_requested", "approved", "rejected"];

/** Studio: request new layouts and themes, and approve what Claude builds. Admins and people with Studio access only. */
export default async function StudioPage({ searchParams }: { searchParams: Promise<{ show?: string; ask?: string }> }) {
  const user = await requireUser("/studio");
  if (!canUseStudio(user) || !hasDb()) notFound();
  const { show, ask } = await searchParams;
  const on: Status = TABS.includes(show as Status) ? (show as Status) : "waiting";
  const [requests, decisions, samples] = await Promise.all([openRequests(), decisionsOf(), layoutSamples(user?.id ?? null)]);
  // A theme card shows one slide per background role and a content slide, as a 2×2 the size of a layout card.
  const pick = (...ids: string[]) => ids.map((id) => samples.find((s) => s.pattern === id)).find(Boolean);
  const quad = [pick("cover"), pick("key-numbers", "agenda"), pick("section"), pick("closing", "cta-contact")].filter((s) => s != null);
  const rows = proposals.map((p) => ({ p, ...statusOf(p, decisions) }));
  const count = (s: Status) => rows.filter((r) => r.status === s).length;
  const shown = rows.filter((r) => r.status === on);
  return (
    <main className="shell">
      <Nav on="studio" user={user} />
      <PageHero title="Studio">New slide layouts and themes for review. Only admins and people with Studio access see this page.</PageHero>
      <RequestForm kind={ask === "rule" || ask === "theme" ? ask : "layout"} />
      {requests.length > 0 && (
        <section className="studio-queue">
          <h2>Requested <span className="mono">· {requests.length} waiting for Claude</span></h2>
          <ul>
            {requests.map((r) => (
              <li key={r.id} className="card">
                <span className="tag">{KIND_LABEL[r.kind as RequestKind] ?? r.kind}</span>
                <p>{r.prompt}</p>
                <span className="mono">{r.author || r.email || "—"} · {r.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                <DismissRequest id={r.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="page-head studio-tabs">
        <nav className="tabs" aria-label="Proposals">
          {TABS.map((s) => (
            <Link key={s} href={s === "waiting" ? "/studio" : `/studio?show=${s}`} className={on === s ? "on" : ""}>{STATUS_LABEL[s]}<span>{count(s)}</span></Link>
          ))}
        </nav>
      </div>
      {shown.length === 0 ? (
        <p className="hint studio-empty">{on === "waiting" ? "Nothing for review. Ask for something above." : `Nothing ${STATUS_LABEL[on].toLowerCase()}.`}</p>
      ) : (
        <div className="studio-grid">
          {shown.map(({ p, latest }) => (
            <Link key={p.id} href={`/studio/${p.id}`} className="card studio-card">
              {p.kind === "layout" ? (
                <span className="frame"><ScaledSlide><RenderSlide slide={p.examples[0]} entry={p.entry} /></ScaledSlide></span>
              ) : (
                <ThemeScope tokens={p.tokens}>
                  <span className="frame studio-quad">
                    {quad.map((s) => <span key={s.id}><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></span>)}
                  </span>
                </ThemeScope>
              )}
              <span className="studio-card-meta">
                <span className="studio-card-title">
                  <b>{p.name}</b>
                  <span className="tag">{p.kind === "theme" ? "Theme" : "Layout"}</span>
                  <span className="mono">rev {p.revision}</span>
                </span>
                <span className="studio-brief">{p.brief}</span>
                {p.revision > 1 && on === "waiting" && p.changes && <span className="hint">Changed: {p.changes}</span>}
                {latest?.note && on !== "waiting" && <span className="hint">“{latest.note}” — {latest.by ?? "—"}</span>}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
