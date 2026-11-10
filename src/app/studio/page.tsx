import { kindLabel, ProposalThumb, quadOf, SourceThumb } from "./ProposalThumb";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import { requireUser } from "@/lib/auth";
import { canUseStudio, decisionsOf, eventsOf, KIND_LABEL, remixSource, statusOf, TICKET_LABEL, tickets, type RequestKind, type Ticket, type TicketStatus } from "@/lib/studio";
import { publishedThemes } from "@/lib/themes";
import { templates } from "@/content/templates";
import { patternOrder, patterns } from "@/deck/registry";
import { proposals } from "@/studio/proposals";
import { EmptyState, type Art } from "../EmptyState";
import { Nav } from "../Nav";
import { PageHero } from "../PageHero";
import { layoutSamples } from "../library/themes/samples";
import { RequestForm } from "./StudioForms";

type Tab = "requests" | "progress" | "review" | "rejected" | "slides";
/** Slides (templates and themes) opens first, on the left; the request tabs sit on the right. Graphics, Web pages and UI join Slides on the left later. */
const TABS: { key: Tab; label: string }[] = [
  { key: "slides", label: "Slides" }, { key: "requests", label: "Requests" }, { key: "progress", label: "In progress" },
  { key: "review", label: "For review" }, { key: "rejected", label: "Rejected" },
];
/** Old links: ?show=waiting was For review, draft / changes_requested were Drafts (now In progress). */
const OLD: Record<string, Tab> = { waiting: "review", draft: "progress", changes_requested: "progress", library: "slides" };
type ReqSub = "mine" | "others" | "closed";
const OPEN: TicketStatus[] = ["new", "answered", "needs_approval"];

/** What each list says when it has nothing in it (the decks home's empty-state design). */
const EMPTY: Record<"mine" | "others" | "closed" | "progress" | "review" | "rejected-requests" | "rejected-builds", { art: Art; title: string; body: string }> = {
  mine: { art: "review", title: "No open requests", body: "Ask for a layout or theme above. Claude checks it against what already exists and replies here." },
  others: { art: "review", title: "Nothing from others", body: "Requests from everyone else show here while Claude checks them and reviewers decide." },
  closed: { art: "changes", title: "Nothing closed yet", body: "Requests answered by something that exists, merged into another, or withdrawn are kept here." },
  progress: { art: "changes", title: "Nothing in progress", body: "Approved requests wait here while Claude builds them, and builds sent back for changes while Claude revises them." },
  review: { art: "review", title: "You're all caught up", body: "Nothing is waiting for a decision. Builds land here once Claude has made them." },
  "rejected-requests": { art: "rejected", title: "No rejected requests", body: "Requests a reviewer turns down are kept here with the reason." },
  "rejected-builds": { art: "rejected", title: "No rejected builds", body: "Builds a reviewer turns down are kept here with the reason." },
};

const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Manila" });

/**
 * Studio: anyone can ask for a layout or theme and follow it as a ticket (Requests → In progress → For review,
 * or Rejected). Studio reviewers approve requests and decide on builds; everyone else sees those view-only.
 */
export default async function StudioPage({ searchParams }: { searchParams: Promise<{ show?: string; sub?: string; ask?: string; lib?: string }> }) {
  const user = await requireUser("/studio");
  if (!hasDb()) notFound();
  const reviewer = canUseStudio(user);
  const admin = !user || user.role === "admin";
  const { show, sub, ask, lib } = await searchParams;
  const on: Tab = OLD[show ?? ""] ?? (TABS.some((t) => t.key === show) ? (show as Tab) : "slides");
  const reqSub: ReqSub = sub === "mine" || sub === "others" || sub === "closed" ? sub : reviewer ? "others" : "mine";
  const rejSub: "requests" | "builds" = sub === "builds" ? "builds" : "requests";
  const libTab: "templates" | "themes" = lib === "themes" ? "themes" : "templates";
  const [all, decisions, samples, themes] = await Promise.all([tickets(), decisionsOf(), layoutSamples(user?.id ?? null), publishedThemes()]);
  const me = user?.id ?? null;
  // Withdrawn tickets: only their author and admins see them.
  const visible = all.filter((t) => t.status !== "withdrawn" || admin || t.authorId === me);
  const ordered = [...templates].sort((a, b) => patternOrder.indexOf(a.slide.pattern) - patternOrder.indexOf(b.slide.pattern));
  const quad = quadOf(samples);
  const rows = proposals.map((p) => ({ p, ...statusOf(p, decisions) }));
  // Approved layouts Claude hasn't moved into the library yet show first in the Library tab.
  const joining = rows.filter((r) => r.status === "approved" && r.p.kind === "layout" && !patterns[r.p.entry.meta.id]).map((r) => r.p);

  const open = visible.filter((t) => OPEN.includes(t.status));
  const lists = {
    mine: open.filter((t) => t.authorId === me),
    // Reviewers see what needs their approval first.
    others: open.filter((t) => t.authorId !== me).sort((a, b) => Number(b.status === "needs_approval") - Number(a.status === "needs_approval")),
    closed: visible.filter((t) => t.status === "resolved" || t.status === "merged" || t.status === "withdrawn"),
    building: visible.filter((t) => t.status === "approved" && !t.proposal),
    rejectedRequests: visible.filter((t) => t.status === "rejected"),
  };
  const drafts = rows.filter((r) => r.status === "draft");
  const waiting = rows.filter((r) => r.status === "waiting");
  const rejectedBuilds = rows.filter((r) => r.status === "rejected");
  const counts: Record<Tab, number> = {
    requests: lists.mine.length + lists.others.length,
    progress: lists.building.length + drafts.length,
    review: waiting.length,
    rejected: lists.rejectedRequests.length + rejectedBuilds.length,
    slides: joining.length + templates.length + themes.length,
  };
  // The last thing said on each open ticket, for its card.
  const events = await eventsOf([...open, ...lists.closed, ...lists.rejectedRequests].map((t) => t.id));
  const lastWord = (id: string) => events.filter((e) => e.requestId === id && e.note && e.kind !== "built").at(-1);
  const sources = Object.fromEntries(await Promise.all(lists.building.filter((t) => t.remix).map(async (t) => [t.id, await remixSource(t.remix!)] as const)));
  const href = (tab: Tab, s?: string) => `/studio?show=${tab}${s ? `&sub=${s}` : ""}`;

  const ticketList = (list: Ticket[], empty: keyof typeof EMPTY) => list.length === 0 ? <EmptyState {...EMPTY[empty]} /> : (
    <ul className="studio-tickets">
      {list.map((t) => {
        const w = lastWord(t.id);
        const waitsOnMe = (t.status === "answered" && t.authorId === me) || (t.status === "needs_approval" && reviewer);
        return (
          <li key={t.id}>
            <Link href={`/studio/requests/${t.id}`} className="card studio-ticket">
              <span className="studio-ticket-head">
                <span className="tag">{t.remix ? (t.revise ? "Revision" : "Remix") : KIND_LABEL[t.kind as RequestKind] ?? t.kind}</span>
                <span className={`tag${waitsOnMe ? " warn" : " quiet"}`}>{waitsOnMe ? (t.status === "answered" ? "Your answer needed" : "Approve or reject") : TICKET_LABEL[t.status]}</span>
                <span className="mono">{t.author || t.email || "—"} · {day(t.createdAt)}</span>
              </span>
              <p>{t.prompt}</p>
              {w && <span className="hint studio-ticket-last">{w.by ?? "Claude"}: {w.note}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const proposalCards = (list: typeof rows, tab: "progress" | "review" | "rejected") => (
    <>
      {list.map(({ p, latest, building }) => (
        <div key={p.id} className="card studio-card">
          <Link href={`/studio/${p.id}`} className="studio-card-link">
            <ProposalThumb p={p} quad={quad} />
            <span className="studio-card-meta">
              <span className="studio-card-title">
                <b>{p.name}</b>
                <span className="tag">{kindLabel(p)}</span>
                <span className="mono">rev {p.revision}</span>
              </span>
              <span className="studio-brief">{p.brief}</span>
              {p.revision > 1 && tab === "review" && p.changes && <span className="hint">Changed: {p.changes}</span>}
              {latest?.note && tab !== "review" && <span className="hint">“{latest.note}” — {latest.by ?? "—"}</span>}
              {tab === "progress" && <span className="hint">{building ? "Claude is building the last prompt." : p.remixOf ? `Revision ${p.revision} ready: prompt again or send it for review.` : "Revised versions come back to For review."}</span>}
            </span>
          </Link>
        </div>
      ))}
    </>
  );

  return (
    <main className="shell">
      <Nav on="studio" user={user} />
      <OffHours />
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
        <RequestForm kind={ask === "theme" ? "theme" : "layout"} rules={reviewer} />
      </section>
      <div className="page-head studio-tabs">
        <nav className="tabs" aria-label="Studio">
          {TABS.map((t) => (
            <Link key={t.key} href={href(t.key)} className={`${t.key === "requests" ? "studio-tab-review" : ""}${on === t.key ? " on" : ""}`}
              aria-current={on === t.key ? "page" : undefined}>{t.label}<span>{counts[t.key]}</span></Link>
          ))}
        </nav>
      </div>
      {on === "requests" && (
        <>
          <div className="studio-library-head">
            <nav className="studio-subtabs" aria-label="Requests">
              <Link href={href("requests", "mine")} className={reqSub === "mine" ? "on" : ""}>My requests<span>{lists.mine.length}</span></Link>
              <Link href={href("requests", "others")} className={reqSub === "others" ? "on" : ""}>Others<span>{lists.others.length}</span></Link>
              <Link href={href("requests", "closed")} className={reqSub === "closed" ? "on" : ""}>Closed<span>{lists.closed.length}</span></Link>
            </nav>
            {!reviewer && reqSub === "others" && <span className="hint">View only. Reviewers approve or reject these.</span>}
          </div>
          {ticketList(lists[reqSub], reqSub)}
        </>
      )}
      {on === "progress" && (
        lists.building.length + drafts.length === 0 ? <EmptyState {...EMPTY.progress} /> : (
          <div className="studio-grid">
            {lists.building.map((t) => (
              <div key={t.id} className="card studio-card">
                <Link href={t.remix && reviewer ? `/studio/draft/${t.id}` : `/studio/requests/${t.id}`} className="studio-card-link">
                  {t.remix ? <SourceThumb of={t.remix} quad={quad} themes={themes} /> : <span className="frame studio-frame-empty"><span>Building</span></span>}
                  <span className="studio-card-meta">
                    <span className="studio-card-title">
                      <b>{t.remix ? `${sources[t.id]?.name ?? t.remix} ${t.revise ? "revision" : "variant"}` : KIND_LABEL[t.kind as RequestKind] ?? t.kind}</b>
                      <span className="tag">{t.remix ? (t.revise ? "Revision" : "Remix") : "Request"}</span>
                    </span>
                    <span className="studio-brief">{t.prompt}</span>
                    <span className="hint">Claude builds the first version when it next checks the Studio.</span>
                  </span>
                </Link>
              </div>
            ))}
            {proposalCards(drafts, "progress")}
          </div>
        )
      )}
      {on === "review" && (waiting.length === 0 ? <EmptyState {...EMPTY.review} /> : (
        <>
          {!reviewer && <p className="hint studio-viewonly">View only. Reviewers approve these, ask for changes or reject them.</p>}
          <div className="studio-grid">{proposalCards(waiting, "review")}</div>
        </>
      ))}
      {on === "rejected" && (
        <>
          <div className="studio-library-head">
            <nav className="studio-subtabs" aria-label="Rejected">
              <Link href={href("rejected", "requests")} className={rejSub === "requests" ? "on" : ""}>Requests<span>{lists.rejectedRequests.length}</span></Link>
              <Link href={href("rejected", "builds")} className={rejSub === "builds" ? "on" : ""}>Builds<span>{rejectedBuilds.length}</span></Link>
            </nav>
          </div>
          {rejSub === "requests" ? ticketList(lists.rejectedRequests, "rejected-requests")
            : rejectedBuilds.length === 0 ? <EmptyState {...EMPTY["rejected-builds"]} />
            : <div className="studio-grid">{proposalCards(rejectedBuilds, "rejected")}</div>}
        </>
      )}
      {on === "slides" && (
        <>
          <div className="studio-library-head">
            <nav className="studio-subtabs" aria-label="Slides">
              <Link href="/studio?show=slides" className={libTab === "templates" ? "on" : ""} aria-current={libTab === "templates" ? "page" : undefined}>Templates<span>{joining.length + ordered.length}</span></Link>
              <Link href="/studio?show=slides&lib=themes" className={libTab === "themes" ? "on" : ""} aria-current={libTab === "themes" ? "page" : undefined}>Themes<span>{themes.length}</span></Link>
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
                <CardActions of={`template:${t.id}`} edit={reviewer} />
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
                <CardActions of={`theme:${t.id}`} edit={reviewer} />
              </div>
            ))}
          </div>
          )}
        </>
      )}
    </main>
  );
}

/**
 * Claude checks the Studio on weekdays, 9am to 7pm Manila time. Outside those hours a banner says when requests
 * will next be picked up, so nobody waits for a reply that isn't coming yet.
 */
function OffHours() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  const dow = now.getDay(); // 0 Sunday … 6 Saturday
  const h = now.getHours();
  const weekday = dow >= 1 && dow <= 5;
  if (weekday && h >= 9 && h < 19) return null;
  // Before 9 on a weekday: today. Friday evening and weekends: Monday. Other evenings: tomorrow.
  const next = weekday && h < 9 ? "today at 9am" : dow === 5 || dow === 6 || dow === 0 ? "Monday at 9am" : "tomorrow at 9am";
  return (
    <div className="studio-offhours" role="status">
      <b>Claude is off right now.</b> It checks Studio requests on weekdays, 9am to 7pm (Manila). Anything you send now is picked up {next}.
    </div>
  );
}

/** Pencil (Lucide "pencil"), in the text colour. */
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" />
  </svg>
);
/** Two crossing arrows (Lucide "shuffle"): a variant made from this one. */
const RemixIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m18 14 4 4-4 4" /><path d="m18 2 4 4-4 4" /><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-7.6a4 4 0 0 1 3.3-1.7H22" /><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" /><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
  </svg>
);

/** A card's Remix button, over the thumbnail's top-right corner: opens the remix editor on this item. */
function RemixButton({ of }: { of: string }) {
  return <Link href={`/studio/remix?of=${encodeURIComponent(of)}`} className="btn studio-remix-btn"><RemixIcon />Remix</Link>;
}

/**
 * A library card's buttons, over the thumbnail's top-right corner. Edit (Studio reviewers only) changes the
 * template or theme itself: the revision replaces it once approved. Remix (anyone) makes a variant that joins
 * the library beside it.
 */
function CardActions({ of, edit }: { of: string; edit: boolean }) {
  const href = `/studio/remix?of=${encodeURIComponent(of)}`;
  return (
    <span className="studio-card-actions">
      {edit && <Link href={`${href}&revise=1`} className="btn"><EditIcon />Edit</Link>}
      <Link href={href} className="btn"><RemixIcon />Remix</Link>
    </span>
  );
}
