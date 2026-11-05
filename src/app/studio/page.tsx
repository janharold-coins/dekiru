import { PatternFrame } from "./PatternPreview";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import { requireUser } from "@/lib/auth";
import { canUseStudio, decisionsOf, KIND_LABEL, openRequests, remixSource, statusOf, type RequestKind, type Status } from "@/lib/studio";
import { publishedThemes } from "@/lib/themes";
import { getTemplate, templates } from "@/content/templates";
import type { SlideData } from "@/deck/types";
import type { ThemeInfo } from "@/lib/themes";
import { patternOrder, patterns } from "@/deck/registry";
import { proposal, proposals } from "@/studio/proposals";
import { EmptyState, type Art } from "../EmptyState";
import { Nav } from "../Nav";
import { PageHero } from "../PageHero";
import { layoutSamples } from "../library/themes/samples";
import { DismissRequest, RequestForm } from "./StudioForms";

/** Approved items have no tab of their own: they're in the Library tab (layouts once Claude moves them in). */
type Tab = Exclude<Status, "approved">;
const TABS: Tab[] = ["waiting", "draft", "rejected"];
const TAB_LABEL: Record<Tab, string> = { waiting: "For review", draft: "Drafts", rejected: "Rejected" };

/** What each tab says when it has nothing in it (the decks home's empty-state design). */
const EMPTY: Record<Tab, { art: Art; title: string; body: string }> = {
  waiting: { art: "review", title: "You're all caught up", body: "Nothing is waiting for your decision. Ask for a layout, theme or rule change above, and Claude's proposal lands here." },
  draft: { art: "changes", title: "No drafts", body: "Remix a template or theme from the Library to start one. Proposals sent back with notes also wait here while Claude revises them." },
  rejected: { art: "rejected", title: "Nothing rejected", body: "Proposals you reject are kept here, with your note, for reference." },
};

/** Studio: request new layouts and themes, and approve what Claude builds. Admins and people with Studio access only. */
export default async function StudioPage({ searchParams }: { searchParams: Promise<{ show?: string; ask?: string; lib?: string }> }) {
  const user = await requireUser("/studio");
  if (!canUseStudio(user) || !hasDb()) notFound();
  const { show, ask, lib } = await searchParams;
  // The Library opens first; old Approved / Changes requested links land on the Library / Drafts.
  const on: Tab = show === "changes_requested" ? "draft" : TABS.includes(show as Tab) ? (show as Tab) : "waiting";
  const library = show !== "changes_requested" && !TABS.includes(show as Tab);
  const libTab: "templates" | "themes" = lib === "themes" ? "themes" : "templates";
  const [all, decisions, samples, themes] = await Promise.all([openRequests(), decisionsOf(), layoutSamples(user?.id ?? null), publishedThemes()]);
  // Remixes Claude hasn't built yet are drafts (Drafts tab), not requests in the queue.
  const requests = all.filter((r) => !r.remix);
  const unbuilt = await Promise.all(all.filter((r) => r.remix).map(async (r) => ({ r, from: await remixSource(r.remix!) })));
  const ordered = [...templates].sort((a, b) => patternOrder.indexOf(a.slide.pattern) - patternOrder.indexOf(b.slide.pattern));
  // A theme card shows one slide per background role and a content slide, as a 2×2 the size of a layout card.
  const pick = (...ids: string[]) => ids.map((id) => samples.find((s) => s.pattern === id)).find(Boolean);
  const quad = [pick("cover"), pick("key-numbers", "agenda"), pick("section"), pick("closing", "cta-contact")].filter((s) => s != null);
  const rows = proposals.map((p) => ({ p, ...statusOf(p, decisions) }));
  const count = (s: Status) => rows.filter((r) => r.status === s).length;
  // Approved layouts Claude hasn't moved into the library yet show first in the Library tab.
  const joining = rows.filter((r) => r.status === "approved" && r.p.kind === "layout" && !patterns[r.p.entry.meta.id]).map((r) => r.p);
  const shown = rows.filter((r) => r.status === on);
  const building = (p: (typeof proposals)[number]) => rows.find((r) => r.p === p)?.building ?? false;
  return (
    <main className="shell">
      <Nav on="studio" user={user} />
      <section className="studio-top">
        {/* Slowly drifting blurred colour, like the sign-in background. Decorative; still when motion is reduced. */}
        <div className="studio-glow" aria-hidden><i /><i /><i /><i /></div>
        <PageHero title={
          <span className="studio-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/app/dekiru-logo.svg" alt="Dekiru" width={155} height={40} />
            <span>Studio</span>
          </span>
        } />
        <RequestForm kind={ask === "theme" ? "theme" : "layout"} />
      </section>
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
          <Link href="/studio" className={library ? "on" : ""}>Library<span>{joining.length + templates.length + themes.length}</span></Link>
          {TABS.map((s, i) => (
            <Link key={s} href={`/studio?show=${s}`} className={`${i === 0 ? "studio-tab-review" : ""}${!library && on === s ? " on" : ""}`}>{TAB_LABEL[s]}<span>{count(s) + (s === "draft" ? unbuilt.length : 0)}</span></Link>
          ))}
        </nav>
      </div>
      {library ? (
        <>
          <div className="studio-library-head">
            <nav className="studio-subtabs" aria-label="Library">
              <Link href="/studio" className={libTab === "templates" ? "on" : ""} aria-current={libTab === "templates" ? "page" : undefined}>Templates<span>{joining.length + ordered.length}</span></Link>
              <Link href="/studio?lib=themes" className={libTab === "themes" ? "on" : ""} aria-current={libTab === "themes" ? "page" : undefined}>Themes<span>{themes.length}</span></Link>
            </nav>
          </div>
          {libTab === "templates" ? (
          <div className="studio-grid">
            {joining.map((p) => p.kind === "layout" && (
              <div key={p.id} className="card studio-card">
                <Link href={`/studio/${p.id}`} className="studio-card-link">
                  <span className="frame"><ScaledSlide><RenderSlide slide={p.examples[0]} entry={p.entry} /></ScaledSlide></span>
                  <span className="studio-card-meta">
                    <span className="studio-card-title"><b>{p.name}</b><span className="tag">Approved</span></span>
                    <span className="studio-brief">Joins the templates on Claude&apos;s next Studio check.</span>
                  </span>
                </Link>
                <RemixButton of={p.id} />
              </div>
            ))}
            {ordered.map((t) => (
              <div key={t.id} className="card studio-card">
                <Link href={`/library/templates/${t.id}`} className="studio-card-link">
                  <span className="frame"><ScaledSlide><RenderSlide slide={t.slide} /></ScaledSlide></span>
                  <span className="studio-card-meta">
                    <span className="studio-card-title"><b>{t.name}</b></span>
                    <span className="studio-brief">{t.use}</span>
                  </span>
                </Link>
                <RemixButton of={`template:${t.id}`} />
              </div>
            ))}
          </div>
          ) : (
          <div className="studio-grid">
            {themes.map((t) => (
              <div key={t.id} className="card studio-card">
                <ThemeScope tokens={t.tokens}>
                  <span className="frame studio-quad">
                    {quad.map((s) => <span key={s.id}><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></span>)}
                  </span>
                </ThemeScope>
                <span className="studio-card-meta">
                  <span className="studio-card-title"><b>{t.name}</b><span className="tag">Theme</span>{t.version != null && <span className="mono">v{t.version}</span>}</span>
                </span>
                <RemixButton of={`theme:${t.id}`} />
              </div>
            ))}
          </div>
          )}
        </>
      ) : shown.length + (on === "draft" ? unbuilt.length : 0) === 0 ? (
        <EmptyState {...EMPTY[on]} />
      ) : (
        <div className="studio-grid">
          {on === "draft" && unbuilt.map(({ r, from }) => (
            <div key={r.id} className="card studio-card">
              <Link href={`/studio/draft/${r.id}`} className="studio-card-link">
                <SourceThumb of={r.remix!} quad={quad} themes={themes} />
                <span className="studio-card-meta">
                  <span className="studio-card-title"><b>{from?.name ?? r.remix} variant</b><span className="tag">Remix</span></span>
                  <span className="studio-brief">{r.prompt}</span>
                  <span className="hint">Claude builds the first version when it next checks the Studio.</span>
                </span>
              </Link>
            </div>
          ))}
          {shown.map(({ p, latest }) => (
            <div key={p.id} className="card studio-card">
            <Link href={`/studio/${p.id}`} className="studio-card-link">
              {p.kind === "layout" ? (
                <span className="frame"><ScaledSlide><RenderSlide slide={p.examples[0]} entry={p.entry} /></ScaledSlide></span>
              ) : p.kind === "pattern" ? (
                <span className="frame studio-pattern-thumb"><PatternFrame tree={p.examples[0].tree} extra={p.components} still /></span>
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
                  <span className="tag">{p.remixOf ? "Remix" : p.kind === "theme" ? "Theme" : p.kind === "pattern" ? "UI pattern" : "Layout"}</span>
                  <span className="mono">rev {p.revision}</span>
                </span>
                <span className="studio-brief">{p.brief}</span>
                {p.revision > 1 && on === "waiting" && p.changes && <span className="hint">Changed: {p.changes}</span>}
                {latest?.note && on !== "waiting" && <span className="hint">“{latest.note}” — {latest.by ?? "—"}</span>}
                {on === "draft" && <span className="hint">{building(p) ? "Claude is building the last prompt." : p.remixOf ? `Revision ${p.revision} ready: prompt again or send it for review.` : "Revised versions come back to For review."}</span>}
              </span>
            </Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

/** A card's Remix button, over the thumbnail's top-right corner: opens the remix editor on this item. */
function RemixButton({ of }: { of: string }) {
  return <Link href={`/studio/remix?of=${encodeURIComponent(of)}`} className="btn studio-remix-btn">Remix</Link>;
}

/** What an unbuilt remix starts from, as a card thumbnail: the template, the theme (2×2) or the approved proposal. */
function SourceThumb({ of, quad, themes }: { of: string; quad: SlideData[]; themes: ThemeInfo[] }) {
  const [type, id] = of.includes(":") ? of.split(":", 2) : ["proposal", of];
  const tokens = type === "theme" ? themes.find((t) => t.id === id)?.tokens : type === "proposal" ? (proposal(id)?.kind === "theme" ? (proposal(id) as { tokens: ThemeInfo["tokens"] }).tokens : undefined) : undefined;
  if (tokens) {
    return (
      <ThemeScope tokens={tokens}>
        <span className="frame studio-quad">{quad.map((s) => <span key={s.id}><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></span>)}</span>
      </ThemeScope>
    );
  }
  const p = type === "proposal" ? proposal(id) : undefined;
  const slide = type === "template" ? getTemplate(id)?.slide : p?.kind === "layout" ? p.examples[0] : undefined;
  return <span className="frame">{slide && <ScaledSlide><RenderSlide slide={slide} entry={p?.kind === "layout" ? p.entry : undefined} /></ScaledSlide>}</span>;
}
