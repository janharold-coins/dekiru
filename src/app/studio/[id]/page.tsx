import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { patterns } from "@/deck/registry";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import { checkTheme, normalizeTokens } from "@/deck/theme";
import { requireUser } from "@/lib/auth";
import { canUseStudio, decisionsOf, STATUS_LABEL, statusOf } from "@/lib/studio";
import { pickTheme, publishedThemes } from "@/lib/themes";
import { templates } from "@/content/templates";
import { proposal } from "@/studio/proposals";
import { Nav } from "../../Nav";
import { layoutSamples } from "../../library/themes/samples";
import { DecisionForm } from "../StudioForms";
import { TuneCard, TunedPreview, TuneProvider } from "../Tuner";

/** The element spacing layouts use by default (Studio rules), the Tune card's starting point. */
const TUNE_GAP = 32;

const DECIDED: Record<string, string> = { approved: "Approved", changes_requested: "Asked for changes", rejected: "Rejected" };

/** One proposal: every example (layouts, in any theme) or every layout (themes), the brief, the decision. */
export default async function ProposalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ theme?: string }> }) {
  const [{ id }, { theme }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/studio/${id}`);
  const p = proposal(id);
  if (!p || !canUseStudio(user) || !hasDb()) notFound();
  const [history, themes] = await Promise.all([decisionsOf(id), publishedThemes()]);
  const { status } = statusOf(p, history);
  const look = pickTheme(themes, theme);
  const samples = p.kind === "theme" ? await layoutSamples(user?.id ?? null) : [];
  const issues = p.kind === "theme" ? checkTheme(normalizeTokens(p.tokens)) : [];
  // Approved layouts go into the library (Claude moves them on its next check; see proposals.ts).
  const listed = p.kind === "layout" && !!patterns[p.entry.meta.id];
  const library = p.kind === "layout" && status === "approved"
    ? { listed, template: listed ? templates.find((t) => t.slide.pattern === p.entry.meta.id)?.id : undefined } : null;
  return (
    <main className="shell">
      <Nav on="studio" user={user} />
      <p className="crumb"><Link href="/studio">← Studio</Link></p>
      <header className="studio-head">
        <h1>{p.name}</h1>
        <span className="tag">{p.kind === "theme" ? "Theme" : "Layout"}</span>
        <span className={`tag${status === "waiting" || status === "changes_requested" ? " warn" : ""}`}>{STATUS_LABEL[status]}</span>
        {library && (library.template
          ? <Link className="tag" href={`/library/templates/${library.template}`}>In the library →</Link>
          : <span className="tag">{library.listed ? "In the library" : "Joins the library on Claude's next Studio check"}</span>)}
        <span className="mono">rev {p.revision} · {p.date}</span>
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
          ) : (
            <ThemeScope tokens={p.tokens}>
              <div className="studio-theme-grid">
                {samples.map((s) => <div key={s.id} className="card"><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></div>)}
              </div>
            </ThemeScope>
          )}
        </div>
        <aside className="studio-side">
          <DecisionForm id={p.id} revision={p.revision} />
          {p.kind === "layout" && <TuneCard defaultGap={TUNE_GAP} />}
          <section className="card studio-box">
            <b>Brief</b>
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
            {issues.length > 0 && <><b>Readability</b><ul className="studio-budgets">{issues.map((i, n) => <li key={n} className="hint warn">{i.message}</li>)}</ul></>}
          </section>
          {history.length > 0 && (
            <section className="card studio-box">
              <b>History</b>
              <ul className="studio-history">
                {history.map((h, n) => (
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
        </aside>
      </div>
      </TuneProvider>
    </main>
  );
}
