"use client";
import Link from "next/link";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import type { ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { Menu } from "./decks/[id]/edit/Menu";
import { archiveAction, copyAction } from "./decks/[id]/actions";
import { DeckId } from "./DeckId";

export interface HomeDeck {
  id: string;
  title: string;
  kind: "master" | "copy";
  cover: SlideData;
  tokens: ThemeTokens;
  slideCount: number;
  /** Milliseconds, for sorting. */
  updated: number;
  updatedLabel: string;
  hasDraft: boolean;
  /** One of your own decks that you archived (My Decks only). */
  archived?: boolean;
}

type Tab = "company" | "mine";
type Sort = "updated" | "name";

const NOTE: Partial<Record<Tab, string>> = {
  company: "Decks are shared with everyone in Coins.ph. All decks are strictly private and confidential.",
};

export function HomeDecks({ company, mine, initialTab }: { company: HomeDeck[]; mine: HomeDeck[]; initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const [showArchived, setShowArchived] = useState(false);
  // Archive/unarchive applies here straight away; the server confirms in the background.
  const [archivedNow, setArchivedNow] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const myDecks = useMemo(() => mine.map((d) => (d.id in archivedNow ? { ...d, archived: archivedNow[d.id] } : d)), [mine, archivedNow]);
  const active = myDecks.filter((d) => !d.archived);
  const archivedCount = myDecks.length - active.length;
  const all = tab === "company" ? company : showArchived ? myDecks : active;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? all.filter((d) => d.title.toLowerCase().includes(q) || d.id.toLowerCase().includes(q)) : [...all];
    return list.sort(sort === "name" ? (a, b) => a.title.localeCompare(b.title) : (a, b) => b.updated - a.updated);
  }, [all, query, sort]);

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

  const choose = (t: Tab) => {
    setTab(t);
    // Keep the tab in the address so Back and reload return to it.
    const url = new URL(window.location.href);
    if (t === "mine") url.searchParams.set("tab", "mine"); else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url);
  };

  return (
    <main className="home-main">
      <div className="home-head">
        <div className="home-head-l">
          <h1>Decks</h1>
          <div className="home-tabs" role="tablist" aria-label="Deck collections">
            <TabButton on={tab === "company"} count={company.length} onClick={() => choose("company")}>Company decks</TabButton>
            <TabButton on={tab === "mine"} count={active.length} onClick={() => choose("mine")}>My decks</TabButton>
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

      <section className="home-collection" role="tabpanel" aria-label={tab === "company" ? "Company decks" : "My decks"}>
        <div className="home-toolbar">
          {NOTE[tab] && <p>{NOTE[tab]}</p>}
          <div className="home-toolbar-r">
          {tab === "mine" && (
            <label className="home-show-archived">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              <span>Show archived decks<span className="home-archived-count">{archivedCount}</span></span>
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
          </div>
        </div>
        {error && <p className="home-error" role="alert">{error}</p>}

        {shown.length ? (
          <div className="home-grid">
            {shown.map((d) => <DeckCard key={d.id} d={d} onArchive={tab === "mine" ? (on) => archive(d.id, on) : undefined} />)}
          </div>
        ) : query.trim() ? (
          <p className="home-empty">No decks match “{query.trim()}”.</p>
        ) : tab === "mine" && archivedCount ? (
          <p className="home-empty">All your decks are archived. Turn on Show archived decks to see them.</p>
        ) : tab === "mine" ? (
          <p className="home-empty">
            You don&apos;t have any decks yet. <Link href="/new">Create a deck</Link> from approved slides, open a company deck and
            choose Make a copy, or ask Claude (Dekiru connector) to build one.
          </p>
        ) : (
          <p className="home-empty">No company decks yet.</p>
        )}
      </section>
    </main>
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

function DeckCard({ d, onArchive }: { d: HomeDeck; onArchive?: (archived: boolean) => void }) {
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
      </div>
      <div className="home-details">
        <div className="home-title">
          <Link href={`/decks/${d.id}`}><h2>{d.title}</h2></Link>
          <p>
            {d.archived && <span className="home-archived-tag">Archived</span>}
            {d.updatedLabel}
            {d.hasDraft && <span className="home-draft">{d.updatedLabel ? " · " : ""}Unpublished changes</span>}
          </p>
        </div>
        <Menu
          className="home-options"
          label={`Options for ${d.title}`}
          trigger={<span aria-hidden>···</span>}
          items={[
            { label: "Open", href: `/decks/${d.id}` },
            { label: "Present", href: `/decks/${d.id}/present` },
            { label: "Share", href: `/decks/${d.id}/share` },
            { label: "Make a copy", onSelect: () => { void copyAction(d.id); } },
            { label: "Version history", href: `/decks/${d.id}/history` },
            { label: "Archive", onSelect: () => onArchive?.(true), hidden: !onArchive || d.archived },
            { label: "Unarchive", onSelect: () => onArchive?.(false), hidden: !onArchive || !d.archived },
          ]}
        />
      </div>
    </article>
  );
}
