"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { coverTitle } from "@/content/cover";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { DEFAULT_THEME_ID, themeStyle, type ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import type { PickerItem } from "../decks/BlockPicker";

export interface NewDeckOptions { publish: boolean; coverTitle: boolean; themeId: string }
interface ThemeOption { id: string; name: string; tokens: ThemeTokens }
interface Section { title: string; items: PickerItem[] }
type Tab = "company" | "products" | "templates";

const PROMPT = "Create a new deck for CLIENT NAME";
const ICON = (name: string, size = 16) => <img src={`/editor/${name}.svg`} alt="" width={size} height={size} />;

/**
 * Two columns under an editor-style top bar: the deck's name, theme and cover preview stay put on the left;
 * the slides to pick scroll on the right. Picked slides keep following their master.
 */
export function NewDeckBuilder({ company, products, templates, themes, cover, onCreate }: {
  company: Section[];
  products: PickerItem[];
  templates: PickerItem[];
  themes: ThemeOption[];
  /** The cover every new deck starts with (null when no cover template exists). */
  cover: SlideData | null;
  onCreate: (blocks: string[], title: string, opts: NewDeckOptions) => Promise<{ error?: string } | void>;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [applyTitle, setApplyTitle] = useState(false);
  const [themeId, setThemeId] = useState(themes.find((t) => t.id === DEFAULT_THEME_ID)?.id ?? themes[0]?.id ?? "");
  const [tab, setTab] = useState<Tab>("company");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();
  const [action, setAction] = useState<"draft" | "publish" | null>(null);

  const all = useMemo(() => new Map([...company.flatMap((s) => s.items), ...products, ...templates].map((i) => [i.block, i])), [company, products, templates]);
  const blocks = picked.flatMap((k) => all.get(k)?.blocks ?? [k]);
  const toggle = (b: string) => setPicked((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));
  const pickAll = (items: PickerItem[]) => {
    const every = items.every((i) => picked.includes(i.block));
    setPicked((p) => (every ? p.filter((x) => !items.some((i) => i.block === x)) : [...p, ...items.map((i) => i.block).filter((b) => !p.includes(b))]));
  };

  const theme = themes.find((t) => t.id === themeId) ?? themes[0];
  const themeVars = useMemo(() => themeStyle(theme?.tokens), [theme]);
  const name = title.trim();
  const previewCover = cover && (applyTitle && name ? { ...cover, props: { ...cover.props, title: coverTitle(name) } } : cover);
  const canCreate = picked.length > 0 && name.length > 0 && !pending;
  const submit = (publish: boolean) => {
    setAction(publish ? "publish" : "draft");
    start(async () => {
      setError(null);
      const r = await onCreate(blocks, name, { publish, coverTitle: applyTitle, themeId });
      if (r && r.error) { setError(r.error); setAction(null); }
    });
  };
  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(PROMPT); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* clipboard unavailable */ }
  };
  const count = (n: number) => `${n} slide${n === 1 ? "" : "s"}`;
  const companyCount = company.reduce((n, s) => n + s.items.length, 0);

  const card = (it: PickerItem) => {
    const order = picked.indexOf(it.block);
    return (
      <button key={it.block} type="button" className={`card pick${order >= 0 ? " on" : ""}`} onClick={() => toggle(it.block)} aria-pressed={order >= 0}>
        {it.stack?.length
          ? <span className="thumbwrap stack">
              {[...it.stack].reverse().map((t, i) => <span key={i} className={`layer back${it.stack!.length - i}`}>{t}</span>)}
              <span className="layer front">{it.thumb}</span>
              {order >= 0 && <span className="badge">{order + 1}</span>}
            </span>
          : <span className="thumbwrap">{it.thumb}{order >= 0 && <span className="badge">{order + 1}</span>}</span>}
        <span className="meta"><b>{it.name}</b><span className="spacer" /><span className="mono">{it.kind}</span></span>
      </button>
    );
  };
  const sectionHead = (label: string, items: PickerItem[]) => (
    <div className="nd-section-h">
      <b>{label}</b>
      <button type="button" className="linkish" onClick={() => pickAll(items)}>
        {items.every((i) => picked.includes(i.block)) ? "Unpick all" : "Pick all"}
      </button>
    </div>
  );

  return (
    <div className="ed nd">
      <header className="ed-top nd-top">
        <div className="ed-identity">
          <Link href="/" className="ed-icon-btn" aria-label="Back to decks">{ICON("arrow-left")}</Link>
          <span className="ed-divider" aria-hidden />
          <div className="ed-title-block">
            <span className="ed-crumb"><span><Link href="/">Decks</Link> / My decks</span></span>
            <h1 className={`ed-title ed-title-static${name ? "" : " nd-untitled"}`}><span>{name || "Untitled new deck"}</span></h1>
          </div>
        </div>
        <div className="ed-actions">
          {error
            ? <span className="ed-save error" role="alert"><span className="ed-save-error" title={error}>Couldn&apos;t create: {error}</span></span>
            : <span className="ed-save" role="status" aria-live="polite">{picked.length ? `${count(blocks.length)} picked` : "Nothing picked yet"}</span>}
          <button type="button" className="ed-btn" disabled={!canCreate} onClick={() => submit(false)} title="Create the deck without publishing it">
            {pending && action === "draft" ? "Saving…" : "Save as draft"}
          </button>
          <button type="button" className="ed-btn ed-btn-primary" disabled={!canCreate} onClick={() => submit(true)} title="Create the deck and make it live">
            {ICON("play")}<span>{pending && action === "publish" ? "Publishing…" : "Publish deck"}</span>
          </button>
        </div>
      </header>

      <div className="nd-body">
        <aside className="nd-side">
          <h2 className="nd-h">Create a new deck</h2>
          <div className="nd-field">
            <div className="nd-label-row">
              <label htmlFor="nd-name">Deck name</label>
              <label className="check nd-check">
                <input type="checkbox" checked={applyTitle} onChange={(e) => setApplyTitle(e.target.checked)} />
                <span>Apply as cover title</span>
              </label>
            </div>
            <input id="nd-name" className="nd-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="eg. Ramp deck for Security Bank" maxLength={80} autoFocus />
          </div>
          <div className="nd-field">
            <label htmlFor="nd-theme">Select theme</label>
            <select id="nd-theme" className="nd-input" value={themeId} onChange={(e) => setThemeId(e.target.value)}>
              {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {previewCover && (
            <figure className="nd-cover" style={themeVars}>
              <ScaledSlide className="nd-cover-frame"><RenderSlide slide={previewCover} /></ScaledSlide>
              <figcaption>Cover preview</figcaption>
            </figure>
          )}
          <div className="nd-claude">
            <p className="nd-claude-h">You can also create a new deck via Claude</p>
            <span className="nd-label">Starting prompt</span>
            <button type="button" className="nd-prompt" onClick={copyPrompt} title="Copy to clipboard">
              <code>{PROMPT}</code>
              <span className="nd-copied" aria-live="polite">{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </aside>

        <section className="nd-main" style={themeVars} aria-label="Slides to add">
          <div className="nd-main-h">
            <b>Select slides to add</b>
            <div className="tabs nd-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={tab === "company"} className={tab === "company" ? "on" : ""} onClick={() => setTab("company")}>Company info<span>{companyCount}</span></button>
              <button type="button" role="tab" aria-selected={tab === "products"} className={tab === "products" ? "on" : ""} onClick={() => setTab("products")}>Our products<span>{products.length}</span></button>
              <span className="spacer" />
              <button type="button" role="tab" aria-selected={tab === "templates"} className={tab === "templates" ? "on" : ""} onClick={() => setTab("templates")}>Templates<span>{templates.length}</span></button>
            </div>
          </div>
          {tab === "company" && company.map((s) => (
            <div key={s.title} className="nd-section">
              {sectionHead(s.title, s.items)}
              <div className="grid picker-grid">{s.items.map(card)}</div>
            </div>
          ))}
          {tab === "products" && (
            <div className="nd-section">
              {sectionHead("Picking a product adds all its slides", products)}
              <div className="grid picker-grid">{products.map(card)}</div>
            </div>
          )}
          {tab === "templates" && (
            <div className="nd-section">
              {sectionHead("Blank layouts with placeholder words, to fill in", templates)}
              <div className="grid picker-grid">{templates.map(card)}</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
