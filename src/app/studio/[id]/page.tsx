import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { patterns } from "@/deck/registry";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import { checkTheme, normalizeTokens } from "@/deck/theme";
import { requireUser } from "@/lib/auth";
import { canUseStudio, decisionsOf, remixSource, requestById, STATUS_LABEL, statusOf } from "@/lib/studio";
import { pickTheme, publishedThemes } from "@/lib/themes";
import { templates } from "@/content/templates";
import { proposal, proposals } from "@/studio/proposals";
import { Nav } from "../../Nav";
import { layoutSamples } from "../../library/themes/samples";
import { discardDraftAction } from "../actions";
import { proposalSlides, remixThread } from "../remix";
import { RemixEditor } from "../RemixEditor";
import { kindLabel, ProposalThumb, quadOf } from "../ProposalThumb";
import { DecisionForm } from "../StudioForms";
import { PatternFrame } from "../PatternPreview";
import { ui } from "@/ui/registry";
import { screens } from "@/content/screens";
import { TuneCard, TunedPreview, TuneProvider } from "../Tuner";

/** The element spacing layouts use by default (Studio rules), the Tune card's starting point. */
const TUNE_GAP = 32;

const DECIDED: Record<string, string> = { approved: "Approved", changes_requested: "Asked for changes", rejected: "Rejected" };

/** One proposal: every example (layouts, in any theme) or every layout (themes), the brief, the decision. */
export default async function ProposalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ theme?: string }> }) {
  const [{ id }, { theme }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/studio/${id}`);
  const p = proposal(id);
  if (!p || !hasDb()) notFound();
  // Everyone can look; Studio reviewers decide, tune and refine remix drafts.
  const reviewer = canUseStudio(user);
  const [history, themes, from] = await Promise.all([decisionsOf(id), publishedThemes(), p.remixOf ? remixSource(p.remixOf) : null]);
  const { status, building, latest } = statusOf(p, history);
  // A remix draft opens in the remix editor until it's sent for review.
  if (p.remixOf && status === "draft" && reviewer) {
    const [req, from, canvas] = await Promise.all([p.request ? requestById(p.request) : null, remixSource(p.remixOf), proposalSlides(p, user?.id ?? null)]);
    const name = from?.name ?? p.remixOf;
    return (
      <RemixEditor target={p.id} name={p.name} source={{ name, href: from?.href }} revise={p.revises}
        status={building ? "Draft · Claude is building your last prompt" : `Draft · revision ${p.revision} ready`} building={building}
        slides={canvas.slides} labels={canvas.labels} thread={await remixThread(req, p)} canSubmit={!building} discard={discardDraftAction.bind(null, p.id)} />
    );
  }
  const look = pickTheme(themes, theme);
  const [samples, all] = await Promise.all([layoutSamples(user?.id ?? null), decisionsOf()]);
  // What else is for review: shown in a modal once a decision is made here.
  const quad = quadOf(samples);
  const next = proposals.filter((o) => o.id !== p.id && statusOf(o, all).status === "waiting")
    .map((o) => ({ id: o.id, name: o.name, kind: kindLabel(o), brief: o.brief, thumb: <ProposalThumb p={o} quad={quad} /> }));
  const issues = p.kind === "theme" ? checkTheme(normalizeTokens(p.tokens)) : [];
  // Approved layouts go into the library (Claude moves them on its next check; see proposals.ts).
  const listed = p.kind === "layout" && !!patterns[p.entry.meta.id];
  const library = p.kind === "layout" && status === "approved"
    ? { listed, template: listed ? templates.find((t) => t.slide.pattern === p.entry.meta.id)?.id : undefined } : null;
  // From revision 2 on, the last change asked for sits in the decision card (to check against), not in History.
  const lastAsk = status === "waiting" ? history.find((h) => h.decision === "changes_requested" && h.revision < p.revision) : undefined;
  const past = history.filter((h) => h !== lastAsk);
  return (
    <main className="shell">
      <Nav on="studio" user={user} />
      <p className="crumb"><Link href="/studio">← Studio</Link></p>
      <header className="studio-head">
        <h1>{p.name}</h1>
        <span className="tag">{p.kind === "theme" ? "Theme" : p.kind === "pattern" ? "UI pattern" : "Layout"}</span>
        <span className={`tag${status === "waiting" || status === "draft" ? " warn" : ""}`}>{STATUS_LABEL[status]}</span>
        {library && (library.template
          ? <Link className="tag" href={`/library/templates/${library.template}`}>In the library →</Link>
          : <span className="tag">{library.listed ? "In the library" : "Joins the library on Claude's next Studio check"}</span>)}
        <span className="mono">rev {p.revision} · {p.date}</span>
        {from && (from.href ? <Link className="tag" href={from.href}>{p.revises ? "Revision" : "Remix"} of {from.name}</Link> : <span className="tag">{p.revises ? "Revision" : "Remix"} of {from.name}</span>)}
        {p.request && <Link className="tag" href={`/studio/requests/${p.request}`}>Request →</Link>}
        {status === "approved" && <Link className="btn studio-remix" href={`/studio/remix?of=${encodeURIComponent(p.id)}`}>Remix</Link>}
      </header>
      <TuneProvider defaultGap={TUNE_GAP}>
      <div className="studio-detail">
        <div className="studio-previews">
          {p.kind === "layout" ? (
            <>
              <nav className="studio-themes" aria-label="Preview in theme">
                <span className="hint">Preview in</span>
                {themes.map((t) => (
                  <Link key={t.id} href={`/studio/${id}?theme=${t.id}`} className={`btn${t.id === look.id ? " primary" : ""}`}>{t.name}</Link>
                ))}
              </nav>
              <ThemeScope tokens={look.tokens}>
                <TunedPreview>
                  {p.examples.map((s) => <div key={s.id} className="card studio-big"><ScaledSlide><RenderSlide slide={s} entry={p.entry} /></ScaledSlide></div>)}
                </TunedPreview>
              </ThemeScope>
            </>
          ) : p.kind === "pattern" ? (
            <>
              <h2 className="studio-pattern-h">Origin: {ui[p.origin.entry]?.name ?? p.origin.entry}, rebuilt as {p.name}</h2>
              <p>
                Left is the origin as the screens draw it today; right is the same content in the pattern. They should look the same.
                Used on {p.origin.screens.map((s, i) => <span key={s}>{i ? ", " : ""}<Link href={`/ui/${s}`}>{screens[s]?.title ?? s}</Link></span>)}
                {" · "}<a href={p.origin.figma.url} target="_blank" rel="noreferrer">{p.origin.figma.name} ↗</a>. Tap a header to open or close it.
              </p>
              {p.examples.filter((e) => e.was).map((e) => (
                <section key={e.id} style={{ marginBottom: 24 }}>
                  <h3 className="studio-pattern-h" style={{ fontSize: 14 }}>{e.label}</h3>
                  <div className="studio-pattern-grid">
                    <figure><figcaption>Today</figcaption><PatternFrame tree={e.was} still /></figure>
                    <figure><figcaption>As {p.name} (tap the header)</figcaption><PatternFrame tree={e.tree} extra={p.components} /></figure>
                  </div>
                </section>
              ))}
              <h2 className="studio-pattern-h">Other uses</h2>
              <p>The same pattern with other content. Placeholder copy: real copy comes from the screen that uses it.</p>
              <div className="studio-pattern-grid">
                {p.examples.filter((e) => !e.was).map((e) => (
                  <figure key={e.id}><figcaption>{e.label}</figcaption><PatternFrame tree={e.tree} extra={p.components} /></figure>
                ))}
              </div>
            </>
          ) : (
            <ThemeScope tokens={p.tokens}>
              <div className="studio-theme-grid">
                {samples.map((s) => <div key={s.id} className="card"><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></div>)}
              </div>
            </ThemeScope>
          )}
        </div>
        <aside className="studio-side">
          {!reviewer && status !== "approved" && status !== "rejected" ? (
            <section className="card studio-box">
              <b>Decision</b>
              <p>View only. A Studio reviewer approves this, asks Claude for changes or rejects it{p.request ? "; the requester is notified" : ""}.</p>
            </section>
          ) : <DecisionForm id={p.id} revision={p.revision} next={next} lastAsk={lastAsk && {
            revision: lastAsk.revision, note: lastAsk.note, images: lastAsk.images, by: lastAsk.by,
            at: lastAsk.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" }) }}
            decided={(status === "approved" || status === "rejected") && latest ? { decision: status, by: latest.by, at: latest.createdAt.toISOString(), note: latest.note } : undefined} />}
          {/* Tune picks go with a decision, so the card goes once one is made. */}
          {p.kind === "layout" && reviewer && status !== "approved" && status !== "rejected" && <TuneCard defaultGap={TUNE_GAP} />}
          {past.length > 0 && (
            <section className="card studio-box">
              <b>History</b>
              <ul className="studio-history">
                {past.map((h, n) => (
                  <li key={n}>
                    <span>{DECIDED[h.decision] ?? h.decision} rev {h.revision}</span>
                    <span className="mono">{h.by ?? "—"} · {h.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    {h.note && <p>{h.note}</p>}
                    {h.images.length > 0 && (
                      <span className="studio-thumbs">
                        {h.images.map((img, n) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <a key={img} href={`/studio/attachments/${img}`} target="_blank" rel="noreferrer"><img src={`/studio/attachments/${img}`} alt={`Image ${n + 1} with this decision`} /></a>
                        ))}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {/* Long on most proposals, so it starts closed at the bottom of the column. */}
          <details className="card studio-box studio-brief-card">
            <summary>Brief</summary>
            <p>{p.brief}</p>
            {p.changes && <><b>Changed in rev {p.revision}</b><p>{p.changes}</p></>}
            <b>Studio rules</b>
            <p>{p.exceptions ? <>Exceptions: {p.exceptions}</> : "Follows all of them."} <Link href="/studio/rules" className="studio-rules-link">Read the rules</Link></p>
            {p.kind === "layout" && (
              <>
                <b>How it works</b>
                <p>{p.entry.meta.description}</p>
                {p.entry.meta.budgets?.length ? (
                  <ul className="studio-budgets">
                    {p.entry.meta.budgets.map((b) => (
                      <li key={b.slot}><span className="mono">{b.slot}</span> {[b.maxChars && `${b.maxChars} chars`, b.maxLines && `${b.maxLines} lines`, b.maxItems && `${b.maxItems} items`].filter(Boolean).join(" · ")}</li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
            {p.kind === "pattern" && <><b>How it works</b><p>{p.description}</p></>}
            {issues.length > 0 && <><b>Readability</b><ul className="studio-budgets">{issues.map((i, n) => <li key={n} className="hint warn">{i.message}</li>)}</ul></>}
          </details>
        </aside>
      </div>
      </TuneProvider>
    </main>
  );
}
