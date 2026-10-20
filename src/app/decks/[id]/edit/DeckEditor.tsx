"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { checkOverflow } from "@/deck/overflow";
import { fieldLabel } from "@/deck/fields";
import { themeStyle, type ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { ContentFields } from "./ContentFields";
import { Menu } from "./Menu";
import {
  discardDraftAction, hideSlideAction, moveSlideAction, publishDeckAction, removeSlideAction, renameDeckAction,
  saveSlideAction, setThemeAction,
} from "./actions";

export interface EditorSlide {
  slide: SlideData;
  name: string;
  section: string;
  layout: string;
  /** Approved slide that follows a company deck. */
  from: { block: string; deck: string } | null;
}
interface ThemeOption { id: string; name: string; tokens: ThemeTokens }
type SaveState = { kind: "saved" } | { kind: "saving" } | { kind: "error"; message: string } | { kind: "published"; version: number };

const ICON = (name: string, size = 16) => <img src={`/editor/${name}.svg`} alt="" width={size} height={size} />;
const pad2 = (n: number) => String(n).padStart(2, "0");
const SAVE_DELAY = 700;
const SLIDE_W = 1920;
const SLIDE_H = 1080;

export function DeckEditor({ deck, slides: initialSlides, initialSlide, theme: initialTheme, themes }: {
  deck: { id: string; title: string; kind: "master" | "copy"; hasDraft: boolean; versionNumber: number | null };
  slides: EditorSlide[];
  initialSlide: string | null;
  theme: { id: string; name: string; tokens: ThemeTokens };
  themes: ThemeOption[];
}) {
  const [slides, setSlides] = useState(initialSlides);
  const [selectedId, setSelectedId] = useState(initialSlide);
  const [title, setTitle] = useState(deck.title);
  const [themeId, setThemeId] = useState(initialTheme.id);
  const [hasDraft, setHasDraft] = useState(deck.hasDraft);
  const [save, setSave] = useState<SaveState>({ kind: "saved" });
  const [navOpen, setNavOpen] = useState(true);
  const [panelWidth, setPanelWidth] = useState(360);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);

  const theme = themes.find((t) => t.id === themeId) ?? initialTheme;
  const themeVars = useMemo(() => themeStyle(theme.tokens), [theme.tokens]);
  const selectedIndex = slides.findIndex((s) => s.slide.id === selectedId);
  const selected = selectedIndex >= 0 ? slides[selectedIndex] : null;
  const presentNumber = (i: number) => slides.slice(0, i).filter((s) => !s.slide.hidden).length + 1;

  // Keep ?slide= in the address so a reload (or a shared link) opens the same slide.
  useEffect(() => {
    if (!selectedId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("slide", selectedId);
    window.history.replaceState(null, "", url);
  }, [selectedId]);

  /* ---------- autosave ---------- */
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pending = useRef(new Map<string, Record<string, unknown>>());
  const inflight = useRef(new Set<Promise<unknown>>());

  const flushOne = useCallback((slideId: string) => {
    const props = pending.current.get(slideId);
    if (!props) return;
    pending.current.delete(slideId);
    clearTimeout(timers.current.get(slideId));
    timers.current.delete(slideId);
    setSave({ kind: "saving" });
    const p = saveSlideAction(deck.id, slideId, props).then((r) => {
      if (r.error) { setSave({ kind: "error", message: r.error }); return; }
      setHasDraft(true);
      if (r.unlinked) setSlides((all) => all.map((s) => (s.slide.id === slideId ? { ...s, from: null, slide: { ...s.slide, ref: undefined } } : s)));
      if (!pending.current.size) setSave({ kind: "saved" });
    }).finally(() => inflight.current.delete(p));
    inflight.current.add(p);
  }, [deck.id]);

  const flushAll = useCallback(async () => {
    for (const id of [...pending.current.keys()]) flushOne(id);
    await Promise.all([...inflight.current]);
  }, [flushOne]);

  const editProps = (slideId: string, props: Record<string, unknown>) => {
    setSlides((all) => all.map((s) => (s.slide.id === slideId ? { ...s, slide: { ...s.slide, props } } : s)));
    pending.current.set(slideId, props);
    clearTimeout(timers.current.get(slideId));
    timers.current.set(slideId, setTimeout(() => flushOne(slideId), SAVE_DELAY));
    setSave({ kind: "saving" });
  };

  // Don't lose typing if the tab is closed mid-save.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (pending.current.size || inflight.current.size) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  /* ---------- slide operations (optimistic) ---------- */
  const structural = async (next: EditorSlide[], action: () => Promise<{ error?: string }>) => {
    const before = slides;
    setSlides(next);
    await flushAll();
    setSave({ kind: "saving" });
    const r = await action();
    if (r.error) { setSlides(before); setSave({ kind: "error", message: r.error }); return false; }
    setHasDraft(true);
    setSave({ kind: "saved" });
    return true;
  };
  const move = (id: string, to: number) => {
    const from = slides.findIndex((s) => s.slide.id === id);
    if (from < 0 || to < 0 || to >= slides.length || from === to) return;
    const next = [...slides];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    void structural(next, () => moveSlideAction(deck.id, id, to + 1));
  };
  const remove = (id: string) => {
    const i = slides.findIndex((s) => s.slide.id === id);
    const next = slides.filter((s) => s.slide.id !== id);
    if (!next.length) return;
    if (selectedId === id) setSelectedId(next[Math.min(i, next.length - 1)].slide.id);
    void structural(next, () => removeSlideAction(deck.id, id));
  };
  const toggleHidden = (id: string) => {
    const s = slides.find((x) => x.slide.id === id);
    if (!s) return;
    const hidden = !s.slide.hidden;
    void structural(slides.map((x) => (x.slide.id === id ? { ...x, slide: { ...x.slide, hidden } } : x)), () => hideSlideAction(deck.id, id, hidden));
  };

  /* ---------- deck operations ---------- */
  const rename = async (next: string) => {
    const name = next.trim();
    if (!name || name === title) return;
    const before = title;
    setTitle(name);
    const r = await renameDeckAction(deck.id, name);
    if (r.error) { setTitle(before); setSave({ kind: "error", message: r.error }); }
  };
  const chooseTheme = async (id: string) => {
    if (id === themeId) return;
    const before = themeId;
    setThemeId(id);
    await flushAll();
    const r = await setThemeAction(deck.id, id);
    if (r.error) { setThemeId(before); setSave({ kind: "error", message: r.error }); return; }
    setHasDraft(true);
  };
  const publishNow = async () => {
    setPublishing(true);
    await flushAll();
    const r = await publishDeckAction(deck.id);
    setPublishing(false);
    if (r.error) { setSave({ kind: "error", message: r.error }); return; }
    setHasDraft(false);
    setSave({ kind: "published", version: r.version ?? 0 });
  };
  const discard = async () => {
    for (const t of timers.current.values()) clearTimeout(t);
    pending.current.clear();
    await Promise.all([...inflight.current]);
    const r = await discardDraftAction(deck.id);
    if (r.error) { setSave({ kind: "error", message: r.error }); return; }
    window.location.reload(); // start again from the published version
  };

  /* ---------- keyboard: ↑/↓ choose a slide, Alt+↑/↓ move it ---------- */
  const onNavKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const d = e.key === "ArrowUp" ? -1 : 1;
    if (selectedIndex < 0) return;
    if (e.altKey) move(slides[selectedIndex].slide.id, selectedIndex + d);
    else {
      const next = slides[selectedIndex + d];
      if (next) { setSelectedId(next.slide.id); document.getElementById(`thumb-${next.slide.id}`)?.focus(); }
    }
  };

  return (
    <div className="ed" style={{ ["--ed-panel" as string]: `${panelWidth}px` }}>
      <TopBar
        deck={deck} title={title} onRename={rename} themes={themes} theme={theme} onTheme={chooseTheme}
        save={save} hasDraft={hasDraft} publishing={publishing} onPublish={publishNow} onDiscard={discard}
        presentHref={`/decks/${deck.id}/present${selected && !selected.slide.hidden ? `#${presentNumber(selectedIndex)}` : ""}`}
      />
      <div className="ed-work" style={themeVars}>
        <Navigator
          open={navOpen} onToggle={() => setNavOpen((o) => !o)} deckId={deck.id} slides={slides} selectedId={selectedId}
          onSelect={setSelectedId} onMove={move} onRemove={remove} onKey={onNavKey}
        />
        <Canvas selected={selected} number={selected ? (selected.slide.hidden ? "Hidden" : pad2(presentNumber(selectedIndex))) : ""} />
        <ContentPanel
          key={selected?.slide.id}
          deckId={deck.id}
          item={selected}
          locked={Boolean(selected?.from) && !unlocked.has(selected!.slide.id)}
          onUnlock={() => selected && setUnlocked((u) => new Set(u).add(selected.slide.id))}
          onChange={(props) => selected && editProps(selected.slide.id, props)}
          onToggleHidden={() => selected && toggleHidden(selected.slide.id)}
          onRemove={() => selected && remove(selected.slide.id)}
          canRemove={slides.length > 1}
          onResize={setPanelWidth}
          width={panelWidth}
        />
      </div>
    </div>
  );
}

/* ================= Top bar ================= */

function TopBar({ deck, title, onRename, themes, theme, onTheme, save, hasDraft, publishing, onPublish, onDiscard, presentHref }: {
  deck: { id: string; kind: "master" | "copy"; versionNumber: number | null };
  title: string; onRename: (t: string) => void;
  themes: ThemeOption[]; theme: ThemeOption; onTheme: (id: string) => void;
  save: SaveState; hasDraft: boolean; publishing: boolean; onPublish: () => void; onDiscard: () => void; presentHref: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const commit = () => { setEditing(false); onRename(draft); };
  return (
    <header className="ed-top">
      <div className="ed-identity">
        <Link href={`/decks/${deck.id}`} className="ed-icon-btn" aria-label="Back to deck overview">{ICON("arrow-left")}</Link>
        <span className="ed-divider" aria-hidden />
        <div className="ed-title-block">
          <span className="ed-crumb"><Link href="/">Decks</Link> / {deck.kind === "master" ? "Company decks" : "My decks"}</span>
          {editing ? (
            <input className="ed-title-input" value={draft} autoFocus maxLength={80} aria-label="Deck name"
              onChange={(e) => setDraft(e.target.value)} onBlur={commit}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(title); setEditing(false); } }} />
          ) : (
            <button type="button" className="ed-title" onClick={() => { setDraft(title); setEditing(true); }} title="Rename deck">
              <span>{title}</span>{ICON("pencil", 13)}
            </button>
          )}
        </div>
      </div>

      <ThemePicker themes={themes} theme={theme} onTheme={onTheme} />

      <div className="ed-actions">
        <span className={`ed-save ${save.kind}`} role="status" aria-live="polite">
          {save.kind === "error" ? <span className="ed-save-error" title={save.message}>Couldn&apos;t save: {save.message}</span>
            : <>{ICON("cloud-check", 15)}<span>{save.kind === "saving" ? "Saving…" : save.kind === "published" ? `Published v${save.version}` : hasDraft ? "Saved as draft" : "All changes saved"}</span></>}
        </span>
        {hasDraft && (
          <button type="button" className="ed-btn ed-btn-publish" onClick={onPublish} disabled={publishing}
            title="Make the draft the live version. Links already sent keep their version.">
            <i aria-hidden />{publishing ? "Publishing…" : "Publish"}
          </button>
        )}
        <Link className="ed-btn" href={`/decks/${deck.id}/share`}>{ICON("user-plus")}<span>Share</span></Link>
        <Link className="ed-btn ed-btn-primary" href={presentHref}>{ICON("play")}<span>Present</span></Link>
        <Menu label="More deck actions" trigger={ICON("ellipsis")} items={[
          { label: "Deck overview", href: `/decks/${deck.id}` },
          { label: "Version history", href: `/decks/${deck.id}/history` },
          { label: "Presentations", href: `/decks/${deck.id}/presentations` },
          { label: "Compare with Figma", href: `/decks/${deck.id}/compare`, hidden: deck.kind !== "master" },
          { label: "Discard unpublished changes", confirm: "Discard all unpublished changes?", danger: true, onSelect: onDiscard, hidden: !hasDraft },
        ]} />
      </div>
    </header>
  );
}

function ThemePicker({ themes, theme, onTheme }: { themes: ThemeOption[]; theme: ThemeOption; onTheme: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  const dot = (t: ThemeOption) => <i className="ed-theme-dot" style={{ background: t.tokens.accent[0] }} aria-hidden />;
  return (
    <div className="ed-theme" ref={ref}>
      <button type="button" className="ed-theme-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>Theme</span>{dot(theme)}<span>{theme.name}</span>
      </button>
      {open && (
        <div className="ed-menu-list center" role="listbox" aria-label="Theme">
          {themes.map((t) => (
            <button key={t.id} type="button" role="option" aria-selected={t.id === theme.id} className={`ed-menu-item ed-theme-opt${t.id === theme.id ? " on" : ""}`}
              onClick={() => { setOpen(false); onTheme(t.id); }}>
              <span className="ed-theme-swatch" style={{ background: `linear-gradient(135deg, ${t.tokens.backgrounds.dark.from} 0 50%, ${t.tokens.backgrounds.light.from} 50%)` }} />
              {dot(t)}<span>{t.name}</span>
            </button>
          ))}
          <p className="ed-menu-note">Switching saves to the draft. Publish to make it live.</p>
        </div>
      )}
    </div>
  );
}

/* ================= Slide navigator ================= */

function Navigator({ open, onToggle, deckId, slides, selectedId, onSelect, onMove, onRemove, onKey }: {
  open: boolean; onToggle: () => void; deckId: string; slides: EditorSlide[]; selectedId: string | null;
  onSelect: (id: string) => void; onMove: (id: string, to: number) => void; onRemove: (id: string) => void;
  onKey: (e: React.KeyboardEvent) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  let n = 0;
  if (!open) {
    return (
      <nav className="ed-nav closed" aria-label="Slides">
        <button type="button" className="ed-icon-btn" aria-label="Show slides" onClick={onToggle} style={{ transform: "scaleX(-1)" }}>{ICON("panel-left-close")}</button>
      </nav>
    );
  }
  return (
    <nav className="ed-nav" aria-label="Slides">
      <div className="ed-nav-h">
        <span><b>Slides</b><span className="ed-count">{slides.length}</span></span>
        <button type="button" className="ed-icon-btn" aria-label="Hide slides" onClick={onToggle}>{ICON("panel-left-close")}</button>
      </div>
      <ol className="ed-thumbs" onKeyDown={onKey}>
        {slides.map((s, i) => {
          const number = s.slide.hidden ? null : ++n;
          const on = s.slide.id === selectedId;
          return (
            <li key={s.slide.id}
              className={["ed-thumb", on ? "on" : "", s.slide.hidden ? "is-hidden" : "", dragId === s.slide.id ? "dragging" : "", over === i && dragId !== s.slide.id ? "drop" : ""].join(" ")}
              draggable
              onDragStart={(e) => { setDragId(s.slide.id); e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => { setDragId(null); setOver(null); }}
              onDragOver={(e) => { e.preventDefault(); setOver(i); }}
              onDrop={(e) => { e.preventDefault(); if (dragId) onMove(dragId, i); setDragId(null); setOver(null); }}
            >
              <button type="button" id={`thumb-${s.slide.id}`} className="ed-thumb-btn" aria-current={on ? "true" : undefined}
                aria-label={`${number ? `Slide ${number}` : "Hidden slide"}: ${s.name}`} onClick={() => onSelect(s.slide.id)}>
                <ScaledSlide><RenderSlide slide={s.slide} /></ScaledSlide>
              </button>
              <span className="ed-thumb-n" aria-hidden>{number ? pad2(number) : "—"}</span>
              {(s.slide.hidden || s.from) && <span className="ed-thumb-tag">{s.slide.hidden ? "Hidden" : "Approved"}</span>}
              {slides.length > 1 && (confirm === s.slide.id ? (
                <button type="button" className="ed-thumb-del armed" onClick={() => { setConfirm(null); onRemove(s.slide.id); }} onBlur={() => setConfirm(null)} autoFocus>Delete?</button>
              ) : (
                <button type="button" className="ed-thumb-del" aria-label={`Delete ${s.name}`} onClick={() => setConfirm(s.slide.id)}>{ICON("trash-2", 12)}</button>
              ))}
            </li>
          );
        })}
      </ol>
      <div className="ed-nav-f">
        <Menu className="ed-add" label="Add slide" align="start"
          trigger={<span className="ed-btn ed-btn-block">{ICON("plus")}<span>Add slide</span></span>}
          items={[
            { label: "Approved slide", href: `/library?deck=${encodeURIComponent(deckId)}` },
            { label: "From a template", href: `/library/templates?deck=${encodeURIComponent(deckId)}` },
          ]} />
        <p className="ed-hint">Drag slides to reorder</p>
      </div>
    </nav>
  );
}

/* ================= Canvas ================= */

const ZOOMS = [0.25, 0.33, 0.42, 0.5, 0.67, 0.75, 1];

function Canvas({ selected, number }: { selected: EditorSlide | null; number: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.42);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const update = () => setFit(Math.max(0.1, Math.min((el.clientWidth - 96) / SLIDE_W, (el.clientHeight - 48 - 28) / SLIDE_H)));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const scale = zoom === "fit" ? fit : zoom;
  const step = (d: 1 | -1) => {
    // Skip steps within 3% of the current size, so each click visibly changes the zoom.
    const next = d > 0 ? ZOOMS.find((z) => z > scale + 0.03) : [...ZOOMS].reverse().find((z) => z < scale - 0.03);
    if (next) setZoom(next);
  };
  return (
    <main className="ed-canvas-wrap">
      <div className={`ed-canvas${zoom !== "fit" && scale > fit ? " zoomed" : ""}`} ref={box}>
        {selected ? (
          <div className="ed-stage" style={{ width: SLIDE_W * scale }}>
            <div className="ed-context">
              <span>{number} / {selected.section.toUpperCase()}</span>
              <span className="ed-layout">{ICON("panels-top-left", 12)}{selected.layout}</span>
            </div>
            <div className="ed-slide" style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: SLIDE_W, height: SLIDE_H }}>
                <RenderSlide slide={selected.slide} />
              </div>
            </div>
          </div>
        ) : <p className="ed-hint">This deck has no slides.</p>}
      </div>
      <div className="ed-status">
        <span className="ed-status-item">{ICON("monitor", 13)}Widescreen · 16:9</span>
        <span className="ed-zoom">
          <button type="button" aria-label="Zoom out" onClick={() => step(-1)}>{ICON("minus", 12)}</button>
          <span aria-live="polite">{Math.round(scale * 100)}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => step(1)}>{ICON("plus-small", 12)}</button>
          <span className="ed-divider" aria-hidden />
          <button type="button" className={zoom === "fit" ? "on" : ""} onClick={() => setZoom("fit")}>Fit</button>
        </span>
      </div>
    </main>
  );
}

/* ================= Content panel ================= */

function ContentPanel({ item, locked, onUnlock, onChange, onToggleHidden, onRemove, canRemove, onResize, width }: {
  deckId: string; item: EditorSlide | null; locked: boolean; onUnlock: () => void;
  onChange: (props: Record<string, unknown>) => void; onToggleHidden: () => void; onRemove: () => void; canRemove: boolean;
  onResize: (w: number) => void; width: number;
}) {
  const warnings = item ? checkOverflow(item.slide) : [];
  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const x0 = e.clientX;
    const w0 = width;
    const move = (ev: PointerEvent) => onResize(Math.max(300, Math.min(480, w0 + (x0 - ev.clientX))));
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };
  return (
    <aside className="ed-panel" aria-label="Slide content">
      <div className="ed-resize" role="separator" aria-orientation="vertical" aria-label="Resize panel" aria-valuemin={300} aria-valuemax={480} aria-valuenow={width}
        tabIndex={0} onPointerDown={startResize}
        onKeyDown={(e) => { if (e.key === "ArrowLeft") onResize(Math.min(480, width + 20)); if (e.key === "ArrowRight") onResize(Math.max(300, width - 20)); }}>
        <i /><i />
      </div>
      <div className="ed-panel-h">
        <h2>Slide Content Editor</h2>
        {item && (
          <Menu label="Slide actions" trigger={ICON("ellipsis")} items={[
            { label: item.slide.hidden ? "Show in presentation" : "Hide from presentation", onSelect: onToggleHidden },
            { label: "Delete slide", confirm: "Delete this slide?", danger: true, onSelect: onRemove, hidden: !canRemove },
          ]} />
        )}
      </div>
      <div className="ed-form">
        {!item ? <p className="ed-hint">Choose a slide on the left.</p> : (
          <>
            {item.slide.hidden && <p className="ed-note">Hidden: kept in the deck but not presented or shared.</p>}
            {locked && item.from && (
              <div className="ed-note">
                <p>Approved slide from <b>{item.from.deck}</b>. It updates when that deck changes.</p>
                <button type="button" className="ed-btn ed-btn-sm" onClick={onUnlock}>Edit for this deck only</button>
                <p className="ed-note-sub">Editing makes it this deck&apos;s own slide; updates from {item.from.deck} won&apos;t reach it.</p>
              </div>
            )}
            {warnings.length > 0 && (
              <ul className="ed-warn">
                {warnings.map((w, i) => <li key={i}><b>{fieldLabel(w.slot.split(".").pop()!.split(" ")[0])}</b>: {w.message}</li>)}
              </ul>
            )}
            <ContentFields pattern={item.slide.pattern} value={item.slide.props as Record<string, unknown>} onChange={onChange} disabled={locked} />
          </>
        )}
      </div>
      <div className="ed-panel-f">{ICON("info", 12)}<span>Changes appear on your slide automatically</span></div>
    </aside>
  );
}
