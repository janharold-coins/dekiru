"use client";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import type { ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { Menu } from "./decks/[id]/edit/Menu";
import { copyAction } from "./decks/[id]/actions";

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
}

type Tab = "company" | "mine";
type Sort = "updated" | "name";

const NOTE: Record<Tab, string> = {
  company: "Decks are shared with everyone in Coins.ph. All decks are strictly private and confidential.",
  mine: "Your own decks, made from company slides. Only you can edit them. All decks are strictly private and confidential.",
};

export function HomeDecks({ company, mine, initialTab }: { company: HomeDeck[]; mine: HomeDeck[]; initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const all = tab === "company" ? company : mine;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? all.filter((d) => d.title.toLowerCase().includes(q)) : [...all];
    return list.sort(sort === "name" ? (a, b) => a.title.localeCompare(b.title) : (a, b) => b.updated - a.updated);
  }, [all, query, sort]);

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
            <TabButton on={tab === "company"} count={company.length} onClick={() => choose("company")}>Company Decks</TabButton>
            <TabButton on={tab === "mine"} count={mine.length} onClick={() => choose("mine")}>My Decks</TabButton>
          </div>
        </div>
        <div className="home-head-r">
          <label className="home-search">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/app/search.svg" alt="" width={18} height={18} />
            <input type="search" placeholder="Search decks" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search decks" />
          </label>
          <Link href="/new" className="home-create">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/app/plus.svg" alt="" width={18} height={18} />
            Create a Deck
          </Link>
        </div>
      </div>

      <section className="home-collection" role="tabpanel" aria-label={tab === "company" ? "Company Decks" : "My Decks"}>
        <div className="home-toolbar">
          <p>{NOTE[tab]}</p>
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

        {shown.length ? (
          <div className="home-grid">{shown.map((d) => <DeckCard key={d.id} d={d} />)}</div>
        ) : query.trim() ? (
          <p className="home-empty">No decks match “{query.trim()}”.</p>
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

function DeckCard({ d }: { d: HomeDeck }) {
  return (
    <article className="home-card">
      <Link href={`/decks/${d.id}`} className="home-cover" aria-label={`Open ${d.title}`}>
        <ThemeScope tokens={d.tokens}>
          <ScaledSlide><RenderSlide slide={d.cover} /></ScaledSlide>
        </ThemeScope>
        <span className="home-slides">{d.slideCount} {d.slideCount === 1 ? "slide" : "slides"}</span>
      </Link>
      <div className="home-details">
        <div className="home-title">
          <Link href={`/decks/${d.id}`}><h2>{d.title}</h2></Link>
          <p>
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
          ]}
        />
      </div>
    </article>
  );
}
