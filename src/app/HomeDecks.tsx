"use client";
import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import type { ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { Menu, type MenuItem } from "./decks/[id]/edit/Menu";
import { archiveAction, copyAction } from "./decks/[id]/actions";
import { DeckId } from "./DeckId";
import { EmptyState } from "./EmptyState";
import { PageHero } from "./PageHero";
import { CopyDialog } from "./decks/[id]/edit/CopyDialog";
import type { TargetLang } from "@/deck/i18n";
import type { StatusLabel } from "@/lib/status";

export interface HomeDeck {
  id: string;
  title: string;
  kind: "master" | "copy";
  /** Departments the deck is tagged for (names, A–Z). */
  tags: string[];
  /** The owner (copies): shown and filterable on Employee decks. */
  ownerId?: string;
  owner?: string;
  cover: SlideData;
  tokens: ThemeTokens;
  slideCount: number;
  /** Milliseconds, for sorting. */
  updated: number;
  updatedLabel: string;
  hasDraft: boolean;
  /** Draft / Under review / Approved / Master (spec §7b). */
  status: StatusLabel;
  /** Someone else's deck shared with you: "Shared by … · view only". */
  shared?: string;
  /** Translations the live version has (spec §7b): shown as "2 translations available" on the cover. */
  translations: { lang: string; name: string; english: string; flag: string; note: string; review: string }[];
  /** One of your own decks that you archived (My Decks only). */
  archived?: boolean;
  /** For review tab: what kind of review is waiting and how far it is. */
  review?: { what: string; progress: string; lang: "en" | "zh" | "th" };
}

type Tab = "company" | "mine" | "employees" | "review";
type Sort = "updated" | "name";
type View = "grid" | "list";
const VIEW_KEY = "dekiru.decks.view";

// Grid or list, remembered per browser; the server always renders grid. Storage may be blocked, so every access is guarded.
const viewListeners = new Set<() => void>();
let viewFallback: View = "grid";
const readView = (): View => {
  try { return localStorage.getItem(VIEW_KEY) === "list" ? "list" : localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : viewFallback; } catch { return viewFallback; }
};
const subscribeView = (fn: () => void) => { viewListeners.add(fn); return () => { viewListeners.delete(fn); }; };
const saveView = (v: View) => {
  viewFallback = v;
  try { localStorage.setItem(VIEW_KEY, v); } catch { /* not remembered */ }
  viewListeners.forEach((fn) => fn());
};

const NOTE: Record<Tab, string> = {
  mine: "Decks you made, and decks people shared with you.",
  company: "Shared with everyone in Coins.ph. All decks are strictly private and confidential.",
  employees: "Decks others in Coins.ph made. Open, present or copy them; only the owner can edit.",
  review: "Decks waiting for your approval. Check each slide, then approve or request changes.",
};

export function HomeDecks({ company, mine, employees, review = [], reviewer = false, initialTab, initialOwner = "", initialTag = "", myDepartment }: {
  company: HomeDeck[]; mine: HomeDeck[];
  /** Everyone else's decks — admins and managers only (undefined hides the tab). */
  employees?: HomeDeck[];
  review?: HomeDeck[]; reviewer?: boolean; initialTab: Tab;
  /** Employee decks filtered to one person (?owner=, linked from People). */
  initialOwner?: string;
  /** Show only decks with this tag (?tag=). */
  initialTag?: string;
  /** The person's own department, when some deck is tagged with it: listed first in the Tag filter. */
  myDepartment?: string;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [owner, setOwner] = useState(initialOwner);
  const [tag, setTag] = useState(initialTag);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const [showArchived, setShowArchived] = useState(false);
  const view = useSyncExternalStore(subscribeView, readView, () => "grid" as View);
  // Archive/unarchive applies here straight away; the server confirms in the background.
  const [archivedNow, setArchivedNow] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const myDecks = useMemo(() => mine.map((d) => (d.id in archivedNow ? { ...d, archived: archivedNow[d.id] } : d)), [mine, archivedNow]);
  // People who made employee decks, for the Author filter.
  const people = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of employees ?? []) if (d.ownerId) m.set(d.ownerId, d.owner ?? "Unknown");
    return [...m].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [employees]);
  const ownerOn = people.some((p) => p.id === owner) ? owner : "";
  const theirs = useMemo(() => (employees ?? []).filter((d) => !ownerOn || d.ownerId === ownerOn), [employees, ownerOn]);
  const archivable = tab === "mine" || tab === "employees";
  const pool = tab === "company" ? company : tab === "review" ? review : tab === "mine" ? myDecks : theirs;
  // Tags used in this collection, the person's department first; a tag no deck here carries isn't offered.
  const tagsHere = useMemo(() => {
    const names = [...new Set(pool.flatMap((d) => d.tags))].sort((a, b) => a.localeCompare(b));
    return myDepartment && names.includes(myDepartment) ? [myDepartment, ...names.filter((n) => n !== myDepartment)] : names;
  }, [pool, myDepartment]);
  const tagOn = tagsHere.includes(tag) ? tag : "";
  const tagged = tagOn ? pool.filter((d) => d.tags.includes(tagOn)) : pool;
  const archivedCount = archivable ? tagged.filter((d) => d.archived).length : 0;
  const all = archivable && !showArchived ? tagged.filter((d) => !d.archived) : tagged;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? all.filter((d) => d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q)) || (tab === "employees" && (d.owner ?? "").toLowerCase().includes(q))) : [...all];
    return list.sort(sort === "name" ? (a, b) => a.title.localeCompare(b.title) : (a, b) => b.updated - a.updated);
  }, [all, query, sort, tab]);

  const archive = (id: string, on: boolean) => {
    setError(null);
    setArchivedNow((m) => ({ ...m, [id]: on }));
    startTransition(async () => {
      const r = await archiveAction(id, on);
      if (r.error) {
        setArchivedNow((m) => ({ ...m, [id]: !on }));
        setError(r.error);
      }
    });
  };

  // Keep the tab (and person filter) in the address so Back and reload return to it.
  const syncUrl = (t: Tab, o: string, g: string) => {
    const url = new URL(window.location.href);
    if (t === "company") url.searchParams.delete("tab"); else url.searchParams.set("tab", t);
    if (t === "employees" && o) url.searchParams.set("owner", o); else url.searchParams.delete("owner");
    if (g) url.searchParams.set("tag", g); else url.searchParams.delete("tag");
    window.history.replaceState(null, "", url);
  };
  const choose = (t: Tab) => { setTab(t); syncUrl(t, ownerOn, tag); };
  const pickOwner = (o: string) => { setOwner(o); syncUrl(tab, o, tag); };
  const pickTag = (g: string) => { setTag(g); syncUrl(tab, ownerOn, g); };

  return (
    <main className="home-main">
      <PageHero title="Decks">{NOTE[tab]}</PageHero>
      <div className="home-head">
        <div className="home-head-l">
          <div className="home-tabs" role="tablist" aria-label="Deck collections">
            <TabButton on={tab === "company"} count={company.length} onClick={() => choose("company")}>Company-wide</TabButton>
            <TabButton on={tab === "mine"} count={myDecks.filter((d) => !d.archived).length} onClick={() => choose("mine")}>My decks</TabButton>
            {employees && <TabButton on={tab === "employees"} count={employees.filter((d) => !d.archived).length} onClick={() => choose("employees")}>Others</TabButton>}
            {(reviewer || review.length > 0) && <TabButton on={tab === "review"} count={review.length} onClick={() => choose("review")}>For review</TabButton>}
          </div>
          <div className="home-toolbar-r" aria-label="Filter and sort" role="group">
          {tab === "employees" && (
            <label className="home-sort">
              <span>Author</span>
              <b>{people.find((p) => p.id === ownerOn)?.name ?? "All"}</b>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/app/sort-chevron.svg" alt="" width={4.92} height={4.512} />
              <select value={ownerOn} onChange={(e) => pickOwner(e.target.value)} aria-label="Show decks made by">
                <option value="">All</option>
                {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
          )}
          {tagsHere.length > 0 && (
            <label className="home-sort">
              <span>Tag</span>
              <b>{tagOn || "All"}</b>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/app/sort-chevron.svg" alt="" width={4.92} height={4.512} />
              <select value={tagOn} onChange={(e) => pickTag(e.target.value)} aria-label="Show decks tagged">
                <option value="">All</option>
                {tagsHere.map((t) => <option key={t} value={t}>{t === myDepartment ? `${t} (your department)` : t}</option>)}
              </select>
            </label>
          )}
          {archivable && (
            <label className="home-show-archived">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              <span>Show archived<span className="home-archived-count">{archivedCount}</span></span>
            </label>
          )}
          <label className="home-sort">
            <span>Sort by</span>
            <b>{sort === "updated" ? "Last updated" : "Name"}</b>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/app/sort-chevron.svg" alt="" width={4.92} height={4.512} />
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort decks by">
              <option value="updated">Last updated</option>
              <option value="name">Name</option>
            </select>
          </label>
          <ViewToggle view={view} onChange={saveView} />
          </div>
        </div>
        <div className="home-head-r">
          <label className="home-search">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/app/search.svg" alt="" width={18} height={18} />
            <input type="search" placeholder="Search decks or IDs" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search decks" />
          </label>
          <Link href="/new" className="home-create">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/app/plus.svg" alt="" width={18} height={18} />
            Create a deck
          </Link>
        </div>
      </div>

      <section className="home-collection" role="tabpanel" aria-label={TAB_NAME[tab]}>
        {error && <p className="home-error" role="alert">{error}</p>}

        {shown.length ? (
          view === "grid" ? (
            <div className="home-grid">
              {shown.map((d) => <DeckCard key={d.id} d={d} showOwner={tab === "employees"} onArchive={tab === "mine" ? (on) => archive(d.id, on) : undefined} />)}
            </div>
          ) : (
            <div className="home-list" role="list">
              {shown.map((d) => <DeckRow key={d.id} d={d} showOwner={tab === "employees"} onArchive={tab === "mine" ? (on) => archive(d.id, on) : undefined} />)}
            </div>
          )
        ) : tagOn && !query.trim() && !archivedCount ? (
          <EmptyState art="search" title={`No ${tagOn} decks here`}
            body={`Nothing in ${TAB_NAME[tab]} is tagged ${tagOn}${tab === "employees" && ownerOn ? " by this author" : ""}.`}>
            <button type="button" className="home-empty-btn" onClick={() => pickTag("")}>Show all tags</button>
          </EmptyState>
        ) : query.trim() ? (
          <EmptyState art="search" title="No decks match your search"
            body={<>Nothing in {TAB_NAME[tab]} matches “{query.trim()}”. Try a deck name, a tag, an ID like dk-1a2b3c4d{tab === "employees" ? " or a person" : ""}.</>}>
            <button type="button" className="home-empty-btn" onClick={() => setQuery("")}>Clear search</button>
          </EmptyState>
        ) : tab === "employees" && archivedCount ? (
          <EmptyState art="archive" title="All of these decks are archived"
            body={`${archivedCount} archived deck${archivedCount === 1 ? " is" : "s are"} hidden. Show them to open, present or unarchive.`}>
            <button type="button" className="home-empty-btn" onClick={() => setShowArchived(true)}>Show archived decks</button>
          </EmptyState>
        ) : tab === "employees" ? (
          <EmptyState art="people" title={ownerOn ? "This author has no decks" : "No decks from others yet"}
            body={ownerOn ? "They haven't made or copied a deck yet." : "When people in Coins.ph make or copy a deck, it shows up here for you to open, present and copy."}>
            {ownerOn && <button type="button" className="home-empty-btn" onClick={() => pickOwner("")}>Show all authors</button>}
          </EmptyState>
        ) : tab === "review" ? (
          <EmptyState art="review" title="You're all caught up"
            body="Nothing is waiting for your review. When someone sends a deck or a translation for approval, it lands here." />
        ) : tab === "mine" ? (
          <EmptyState art="deck" title={archivedCount ? "Start a new deck" : "Make your first deck"}
            body="Build one from approved master slides, copy a company deck and tailor it, or ask Claude (Dekiru connector) to put one together.">
            <Link href="/new" className="home-empty-btn primary">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/app/plus.svg" alt="" width={16} height={16} />
              Create a deck
            </Link>
            {company.length > 0 && <button type="button" className="home-empty-btn" onClick={() => choose("company")}>Browse company decks</button>}
            {archivedCount > 0 && (
              <button type="button" className="home-empty-link" onClick={() => setShowArchived(true)}>
                Show {archivedCount} archived deck{archivedCount === 1 ? "" : "s"}
              </button>
            )}
          </EmptyState>
        ) : (
          <EmptyState art="deck" title="No company decks yet" body="Company decks are the approved masters everyone at Coins.ph starts from. Once one is published, it appears here." />
        )}
      </section>
    </main>
  );
}

const TAB_NAME: Record<Tab, string> = { company: "Company-wide", mine: "My decks", employees: "Others", review: "For review" };

/** Grid / list switch beside Sort by. */
function ViewToggle({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  return (
    <div className="home-view" role="group" aria-label="Layout">
      <button type="button" className={view === "grid" ? "on" : ""} aria-pressed={view === "grid"} aria-label="Grid view" title="Grid view" onClick={() => onChange("grid")}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><rect x="1.75" y="1.75" width="5" height="5" rx="1.25" stroke="currentColor" strokeWidth="1.5" /><rect x="9.25" y="1.75" width="5" height="5" rx="1.25" stroke="currentColor" strokeWidth="1.5" /><rect x="1.75" y="9.25" width="5" height="5" rx="1.25" stroke="currentColor" strokeWidth="1.5" /><rect x="9.25" y="9.25" width="5" height="5" rx="1.25" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      <button type="button" className={view === "list" ? "on" : ""} aria-pressed={view === "list"} aria-label="List view" title="List view" onClick={() => onChange("list")}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><rect x="1.75" y="2.25" width="4" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.5" /><rect x="1.75" y="10.75" width="4" height="3" rx="0.75" stroke="currentColor" strokeWidth="1.5" /><path d="M8.5 3.75h6M8.5 12.25h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
      </button>
    </div>
  );
}

function TabButton({ on, count, onClick, children }: { on: boolean; count: number; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" role="tab" aria-selected={on} className={`home-tab${on ? " on" : ""}`} onClick={onClick}>
      {children}
      <span className="home-count">{count}</span>
    </button>
  );
}

/** "2 translations available" over the cover's bottom-right corner; hover or focus lists them, each opens the deck in that language. */
function Translations({ deckId, items }: { deckId: string; items: HomeDeck["translations"] }) {
  return (
    <div className="home-tr">
      <button type="button" className="home-tr-chip" aria-label={`${items.length} translation${items.length === 1 ? "" : "s"} available: ${items.map((t) => t.english).join(", ")}`}>
        <span aria-hidden>{items.map((t) => t.flag).join(" ")}</span>
        {items.length} translation{items.length === 1 ? "" : "s"} available
      </button>
      <div className="home-tr-pop" role="list">
        {items.map((t) => (
          <Link key={t.lang} role="listitem" href={`/decks/${deckId}?lang=${t.lang}`} className="home-tr-row">
            <span className="home-tr-flag" aria-hidden>{t.flag}</span>
            <span className="home-tr-name"><span lang={t.lang}>{t.name}</span><small>{t.english}</small></span>
            <span className="home-tr-meta">{t.note}<small>{t.review}</small></span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function deckMenu(d: HomeDeck, onArchive: ((archived: boolean) => void) | undefined, askCopy: () => void): MenuItem[] {
  return [
    { label: d.review ? "Review" : "Open", href: d.review && d.review.lang !== "en" ? `/decks/${d.id}?lang=${d.review.lang}` : `/decks/${d.id}` },
    { label: "Present", href: `/decks/${d.id}/present` },
    { label: "Share", href: `/decks/${d.id}/share` },
    { label: "Make a copy", onSelect: () => { if (d.translations.length) askCopy(); else void copyAction(d.id); } },
    { label: "Version history", href: `/decks/${d.id}/history` },
    { label: "Archive", onSelect: () => onArchive?.(true), hidden: !onArchive || d.archived || Boolean(d.shared) },
    { label: "Unarchive", onSelect: () => onArchive?.(false), hidden: !onArchive || !d.archived },
  ];
}

/** The status / owner / updated line under a deck's title (card and row). */
function DeckMeta({ d, showOwner }: { d: HomeDeck; showOwner: boolean }) {
  return (
    <p>
      {d.archived && <span className="home-archived-tag">Archived</span>}
      {!d.review && <span className={`home-status ${d.status.tone}`}><i aria-hidden />{d.status.text}</span>}
      {d.review ? <><span className="home-review-what">{d.review.what}</span> · {d.review.progress}</> : d.updatedLabel ? <> · {d.updatedLabel}</> : null}
      {d.shared && !showOwner && <span className="home-shared"> · {d.shared}</span>}
    </p>
  );
}

/** Department tags under a deck's title (card and row). */
function DeckTags({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return <ul className="home-tags" aria-label="Tags">{tags.map((t) => <li key={t}>{t}</li>)}</ul>;
}

/** List view: small cover, title and status, slide count, menu. */
function DeckRow({ d, showOwner = false, onArchive }: { d: HomeDeck; showOwner?: boolean; onArchive?: (archived: boolean) => void }) {
  const [copyAsk, setCopyAsk] = useState(false);
  return (
    <article role="listitem" className={`home-row${d.archived ? " archived" : ""}`}>
      <Link href={`/decks/${d.id}`} className="home-row-cover" aria-label={`Open ${d.title}`} tabIndex={-1}>
        <ThemeScope tokens={d.tokens}>
          <ScaledSlide><RenderSlide slide={d.cover} /></ScaledSlide>
        </ThemeScope>
      </Link>
      <div className="home-title home-row-title">
        <Link href={`/decks/${d.id}`}><h2>{d.title}</h2></Link>
        <DeckMeta d={d} showOwner={showOwner} />
        <DeckTags tags={d.tags} />
      </div>
      <DeckId id={d.id} className="home-row-id" />
      <span className="home-row-langs" title={d.translations.map((t) => t.english).join(", ") || undefined}>
        {d.translations.length > 0 ? <><span aria-hidden>{d.translations.map((t) => t.flag).join(" ")}</span> {d.translations.length} translation{d.translations.length === 1 ? "" : "s"}</> : <span className="home-row-none">English only</span>}
      </span>
      <span className="home-row-slides">{d.slideCount} {d.slideCount === 1 ? "slide" : "slides"}</span>
      <Menu className="home-options" label={`Options for ${d.title}`} trigger={<span aria-hidden>···</span>} items={deckMenu(d, onArchive, () => setCopyAsk(true))} />
      {copyAsk && <CopyDialog deckId={d.id} title={d.title} langs={d.translations.map((t) => t.lang as TargetLang)} onClose={() => setCopyAsk(false)} />}
    </article>
  );
}

function DeckCard({ d, showOwner = false, onArchive }: { d: HomeDeck; showOwner?: boolean; onArchive?: (archived: boolean) => void }) {
  // Copies start in English only: a deck with translations asks whether to keep them.
  const [copyAsk, setCopyAsk] = useState(false);
  return (
    <article className={`home-card${d.archived ? " archived" : ""}`}>
      <div className="home-cover-wrap">
        <Link href={`/decks/${d.id}`} className="home-cover" aria-label={`Open ${d.title}`}>
          <ThemeScope tokens={d.tokens}>
            <ScaledSlide><RenderSlide slide={d.cover} /></ScaledSlide>
          </ThemeScope>
          <span className="home-slides">{d.slideCount} {d.slideCount === 1 ? "slide" : "slides"}</span>
        </Link>
        {/* Outside the link (a button can't sit inside one); positioned over the cover's top-left corner. */}
        <DeckId id={d.id} className="deck-id-cover" />
        {d.translations.length > 0 && <Translations deckId={d.id} items={d.translations} />}
      </div>
      <div className="home-details">
        <div className="home-title">
          <Link href={`/decks/${d.id}`}><h2>{d.title}</h2></Link>
          <DeckMeta d={d} showOwner={showOwner} />
          <DeckTags tags={d.tags} />
        </div>
        <Menu
          className="home-options"
          label={`Options for ${d.title}`}
          trigger={<span aria-hidden>···</span>}
          items={deckMenu(d, onArchive, () => setCopyAsk(true))}
        />
      </div>
      {copyAsk && <CopyDialog deckId={d.id} title={d.title} langs={d.translations.map((t) => t.lang as TargetLang)} onClose={() => setCopyAsk(false)} />}
    </article>
  );
}
