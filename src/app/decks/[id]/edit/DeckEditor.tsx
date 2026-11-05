"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { RenderSlide } from "@/deck/RenderSlide";
import { PreviewChecks } from "@/deck/frame/PreviewChecks";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { PlaceLayer } from "./PlaceLayer";
import { checkOverflow } from "@/deck/overflow";
import { availableLangs, deckTranslationStatus, LANGUAGES, TARGET_LANGS, localize, overlayFromEntries, textEntries, translationState, withTranslation, type Lang, type TargetLang } from "@/deck/i18n";
import { fieldLabel } from "@/deck/fields";
import { themeStyle, type ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { copyAction } from "../actions";
import { CopyDialog } from "./CopyDialog";
import { ContentFields } from "./ContentFields";
import { ConfirmDialog, Menu } from "./Menu";
import { PublishDialog, PublishSplit } from "./Publish";
import {
  saveTranslationAction, setLanguageAction,
  discardDraftAction, draftChangesAction, hideSlideAction, moveSlideAction, removeSlideAction, renameDeckAction, resetSlideAction, sendForReviewAction,
  saveDeckStateAction, saveSlideAction, setTagsAction, setThemeAction,
} from "./actions";
import type { SeedSlide } from "@/content/resolve";
import { DeckId } from "../../../DeckId";
import { CommentOverlay, CommentsPanel, openCount, type Comment, type CommentsState } from "./Comments";
import { ApproveSlide, CHANGE_LABEL, ReviewButtons, ReviewDialog, reviewLabel, reviewMenuItems, reviewTitle, slideChange, summaryFor, type Dialog, type ReviewProps, type StatusCtx } from "./Review";

export interface EditorSlide {
  slide: SlideData;
  name: string;
  section: string;
  layout: string;
  /** Master slide: follows a company deck. */
  from: { block: string; deck: string } | null;
}
interface ThemeOption { id: string; name: string; tokens: ThemeTokens }
interface Tag { id: string; name: string }
/** What undo/redo restores: the slides (order, content, hidden, links to approved slides) and the theme. */
interface Snapshot { slides: EditorSlide[]; themeId: string }
const HISTORY_LIMIT = 100;
const EDIT_BURST_MS = 1200; // typing pauses longer than this start a new undo step

/* "Show hidden slides" is remembered on this computer (off on the server render and when storage is unavailable). */
const SHOW_HIDDEN_KEY = "dekiru.showHidden";
const showHiddenListeners = new Set<() => void>();
let showHiddenMemory = false; // used when the browser won't store it
const readShowHidden = () => { try { const v = localStorage.getItem(SHOW_HIDDEN_KEY); return v == null ? showHiddenMemory : v === "1"; } catch { return showHiddenMemory; } };
function setShowHidden(on: boolean) {
  showHiddenMemory = on;
  try { localStorage.setItem(SHOW_HIDDEN_KEY, on ? "1" : "0"); } catch { /* storage unavailable */ }
  showHiddenListeners.forEach((l) => l());
}
function useShowHidden() {
  return useSyncExternalStore(
    (l) => { showHiddenListeners.add(l); return () => { showHiddenListeners.delete(l); }; },
    readShowHidden,
    () => false,
  );
}

/** Back to the stored form: approved slides that still follow their master are saved as references. */
const toSeed = (list: EditorSlide[]): SeedSlide[] => list.map(({ slide, from }) => {
  if (from && slide.ref) return { id: slide.id, ref: slide.ref, ...(slide.hidden ? { hidden: true } : {}) };
  const { ref: _ref, ...own } = slide; // eslint-disable-line @typescript-eslint/no-unused-vars
  return own;
});

type SaveState = { kind: "saved" } | { kind: "saving" } | { kind: "error"; message: string } | { kind: "published"; version: number };

/** Opening and closing slides are always presented: they can't be hidden. */
const ALWAYS_SHOWN = new Set(["cover", "closing"]);

export const ICON = (name: string, size = 16) => <img src={`/editor/${name}.svg`} alt="" width={size} height={size} />;
const pad2 = (n: number) => String(n).padStart(2, "0");
const SAVE_DELAY = 700;
const SLIDE_W = 1920;
const SLIDE_H = 1080;

export function DeckEditor({ deck, slides: initialSlides, initialSlide, theme: initialTheme, themes, departments = [], readOnly = false, review, initialComments = [], initialLang = "en" }: {
  deck: { id: string; title: string; kind: "master" | "copy"; hasDraft: boolean; versionNumber: number | null; sentVersion: number | null; approvedVersion: number | null;
    /** Languages the deck offers besides English: null = company master (every language it holds); else what the owner turned on. */
    languages: TargetLang[] | null;
    /** Departments the deck is tagged for. */
    tags: Tag[] };
  /** Every department, for the Tags picker. */
  departments?: Tag[];
  /** Review state and what the signed-in person may do about it (spec §7a). */
  review: ReviewProps;
  /** Comments on every slide of the deck (Comments tab). */
  initialComments?: Comment[];
  initialLang?: Lang;
  /** People who can see but not change the deck (members on company decks): view, present, share, copy. */
  readOnly?: boolean;
  slides: EditorSlide[];
  initialSlide: string | null;
  theme: { id: string; name: string; tokens: ThemeTokens };
  themes: ThemeOption[];
}) {
  const [slides, setSlides] = useState(initialSlides);
  const [selectedId, setSelectedRaw] = useState(initialSlide);
  const [title, setTitle] = useState(deck.title);
  const [themeId, setThemeId] = useState(initialTheme.id);
  const [hasDraft, setHasDraft] = useState(deck.hasDraft);
  const [save, setSave] = useState<SaveState>({ kind: "saved" });
  const [navOpen, setNavOpen] = useState(true);
  // Preview language: translations are made with Claude (connector); the editor shows them and their status.
  // People's own decks offer only the languages their owner turned on (Language picker → Add); masters offer all.
  const [languages, setLanguages] = useState<TargetLang[] | null>(deck.languages);
  const offers = (l: Lang) => l === "en" || !languages || languages.includes(l);
  const [lang, setLang] = useState<Lang>(offers(initialLang) ? initialLang : "en");
  const toggleLanguage = async (l: TargetLang, on: boolean) => {
    const before = languages;
    setLanguages((cur) => (cur ? (on ? [...cur.filter((x) => x !== l), l] : cur.filter((x) => x !== l)) : cur));
    setLang(on ? l : "en");
    const r = await setLanguageAction(deck.id, l, on);
    if (r.error) { setLanguages(before); setLang("en"); setSave({ kind: "error", message: r.error }); }
  };
  // Tags apply straight away (they belong to the deck, not the draft), so they aren't part of undo.
  const [tags, setTags] = useState<Tag[]>(deck.tags);
  const toggleTag = async (t: Tag, on: boolean) => {
    const before = tags;
    const next = on ? [...tags, t].sort((a, b) => a.name.localeCompare(b.name)) : tags.filter((x) => x.id !== t.id);
    setTags(next);
    const r = await setTagsAction(deck.id, next.map((x) => x.id));
    if (r.error) { setTags(before); setSave({ kind: "error", message: r.error }); }
  };
  // Make a copy: asks whether to keep the translations the deck offers; English-only decks copy straight away.
  const [copyAsk, setCopyAsk] = useState(false);
  const copyLangs = availableLangs(slides.map((s) => s.slide)).filter((l) => !languages || languages.includes(l));
  const startCopy = () => { if (copyLangs.length) setCopyAsk(true); else void copyAction(deck.id); };
  const [reviewDialog, setReviewDialog] = useState<Dialog | null>(null);
  const [panelWidth, setPanelWidth] = useState(360);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [publishing, setPublishing] = useState(false);
  /* Right panel: Editor or Comments. Comments keep their own list and pin/selection state, shared with the canvas. */
  const [tab, setTab] = useState<"editor" | "comments">("editor");
  const [cm, setCm] = useState<CommentsState>({ comments: initialComments, userId: review.userId, admin: review.admin, activeId: null, pinMode: false, draftAnchor: null });
  const patchCm = useCallback((p: Partial<CommentsState>) => setCm((c) => ({ ...c, ...p })), []);
  const setComments = useCallback((fn: (all: Comment[]) => Comment[]) => setCm((c) => ({ ...c, comments: fn(c.comments) })), []);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const focusComposer = useCallback(() => { requestAnimationFrame(() => composerRef.current?.focus()); }, []);
  const showHidden = useShowHidden();
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const lastEdit = useRef<{ slideId: string; t: number } | null>(null);
  const [historySize, setHistorySize] = useState({ undo: 0, redo: 0 });
  const syncHistory = () => setHistorySize({ undo: past.current.length, redo: future.current.length });
  /** Call before any change: remembers the current state as an undo step and clears redo. */
  const record = () => {
    past.current.push({ slides, themeId });
    if (past.current.length > HISTORY_LIMIT) past.current.shift();
    future.current = [];
    syncHistory();
  };

  const toggleShowHidden = setShowHidden;

  const theme = themes.find((t) => t.id === themeId) ?? initialTheme;
  const themeVars = useMemo(() => themeStyle(theme.tokens), [theme.tokens]);
  const selectedIndex = slides.findIndex((s) => s.slide.id === selectedId);
  const selected = selectedIndex >= 0 ? slides[selectedIndex] : null;
  const presentNumber = (i: number) => slides.slice(0, i).filter((s) => !s.slide.hidden).length + 1;

  // Changing slide drops the comment selection and any pin being placed.
  const setSelectedId = useCallback((id: string | null) => { setSelectedRaw(id); setCm((c) => ({ ...c, activeId: null, pinMode: false, draftAnchor: null })); }, []);

  // Keep ?slide= in the address so a reload (or a shared link) opens the same slide.
  useEffect(() => {
    if (!selectedId) return;
    const url = new URL(window.location.href);
    url.searchParams.set("slide", selectedId);
    window.history.replaceState(null, "", url);
  }, [selectedId]);

  /* ---------- autosave ---------- */
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  /** Keyed by slide id (English content) or "slideId|lang" (a translation's text by path). */
  type Pending = { kind: "props"; props: Record<string, unknown> } | { kind: "translation"; slideId: string; lang: TargetLang; text: Record<string, string> };
  const pending = useRef(new Map<string, Pending>());
  const inflight = useRef(new Set<Promise<unknown>>());

  const flushOne = useCallback((key: string) => {
    const item = pending.current.get(key);
    if (!item) return;
    pending.current.delete(key);
    clearTimeout(timers.current.get(key));
    timers.current.delete(key);
    setSave({ kind: "saving" });
    const done = (r: { error?: string }) => {
      if (r.error) { setSave({ kind: "error", message: r.error }); return false; }
      setHasDraft(true);
      if (!pending.current.size) setSave({ kind: "saved" });
      return true;
    };
    const p = (item.kind === "props"
      ? saveSlideAction(deck.id, key, item.props).then((r) => {
        if (done(r) && r.unlinked) setSlides((all) => all.map((s) => (s.slide.id === key ? { ...s, from: null, slide: { ...s.slide, ref: undefined } } : s)));
      })
      : saveTranslationAction(deck.id, item.slideId, item.lang, item.text).then(done)
    ).finally(() => inflight.current.delete(p));
    inflight.current.add(p);
  }, [deck.id]);

  const flushAll = useCallback(async () => {
    for (const id of [...pending.current.keys()]) flushOne(id);
    await Promise.all([...inflight.current]);
  }, [flushOne]);

  const editProps = (slideId: string, props: Record<string, unknown>) => {
    // One undo step per burst of typing on a slide.
    const now = Date.now();
    if (!lastEdit.current || lastEdit.current.slideId !== slideId || now - lastEdit.current.t > EDIT_BURST_MS) record();
    lastEdit.current = { slideId, t: now };
    setSlides((all) => all.map((s) => (s.slide.id === slideId ? { ...s, slide: { ...s.slide, props } } : s)));
    pending.current.set(slideId, { kind: "props", props });
    clearTimeout(timers.current.get(slideId));
    timers.current.set(slideId, setTimeout(() => flushOne(slideId), SAVE_DELAY));
    setSave({ kind: "saving" });
  };

  /**
   * Typing in the form while previewing a translation edits that translation: the form shows the translated
   * text, and whatever differs from the English becomes the slide's overlay for that language. A field put
   * back to the English wording simply stops being translated.
   */
  const editTranslation = (slideId: string, lang: TargetLang, merged: Record<string, unknown>) => {
    const item = slides.find((s) => s.slide.id === slideId);
    if (!item) return;
    const english = new Map(textEntries(item.slide.props).map((e) => [e.path, e.text]));
    const text: Record<string, string> = {};
    for (const e of textEntries(merged)) if (english.has(e.path) && english.get(e.path) !== e.text) text[e.path] = e.text;
    const now = Date.now();
    if (!lastEdit.current || lastEdit.current.slideId !== slideId || now - lastEdit.current.t > EDIT_BURST_MS) record();
    lastEdit.current = { slideId, t: now };
    const overlay = overlayFromEntries(item.slide.props, text);
    setSlides((all) => all.map((s) => {
      if (s.slide.id !== slideId) return s;
      if (!Object.keys(text).length) { const { [lang]: _gone, ...rest } = s.slide.i18n ?? {}; return { ...s, slide: { ...s.slide, i18n: Object.keys(rest).length ? rest : undefined } }; } // eslint-disable-line @typescript-eslint/no-unused-vars
      return { ...s, slide: withTranslation(s.slide, lang, overlay) };
    }));
    const key = `${slideId}|${lang}`;
    pending.current.set(key, { kind: "translation", slideId, lang, text });
    clearTimeout(timers.current.get(key));
    timers.current.set(key, setTimeout(() => flushOne(key), SAVE_DELAY));
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
    record();
    lastEdit.current = null;
    setSlides(next);
    await flushAll();
    setSave({ kind: "saving" });
    const r = await action();
    if (r.error) { setSlides(before); past.current.pop(); syncHistory(); setSave({ kind: "error", message: r.error }); return false; }
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
  /** An edited approved slide goes back to the approved content and follows its master again. */
  const reset = async (id: string) => {
    const item = slides.find((x) => x.slide.id === id);
    if (!item) return;
    // Unlocked but untouched: nothing was saved, so just lock it again.
    if (item.from) { setUnlocked((u) => { const n = new Set(u); n.delete(id); return n; }); return; }
    clearTimeout(timers.current.get(id));
    pending.current.delete(id);
    record();
    lastEdit.current = null;
    await flushAll();
    setSave({ kind: "saving" });
    const r = await resetSlideAction(deck.id, id);
    if (r.error || !r.slide || !r.from) { past.current.pop(); syncHistory(); setSave({ kind: "error", message: r.error ?? "Couldn't reset the slide." }); return; }
    const { slide, from } = r;
    setSlides((all) => all.map((x) => (x.slide.id === id ? { ...x, slide: { ...slide, hidden: x.slide.hidden }, from } : x)));
    setUnlocked((u) => { const n = new Set(u); n.delete(id); return n; });
    setHasDraft(true);
    setSave({ kind: "saved" });
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
    record();
    lastEdit.current = null;
    setThemeId(id);
    await flushAll();
    const r = await setThemeAction(deck.id, id);
    if (r.error) { setThemeId(before); past.current.pop(); syncHistory(); setSave({ kind: "error", message: r.error }); return; }
    setHasDraft(true);
  };

  /* ---------- undo / redo ---------- */
  const restore = async (from: Snapshot[], to: Snapshot[]) => {
    const target = from.pop();
    if (!target) return;
    // Pending typing belongs to the state being left; the restored state is saved as a whole instead.
    for (const t of timers.current.values()) clearTimeout(t);
    timers.current.clear();
    pending.current.clear();
    await Promise.all([...inflight.current]);
    to.push({ slides, themeId });
    lastEdit.current = null;
    syncHistory();
    setSlides(target.slides);
    setThemeId(target.themeId);
    if (!target.slides.some((s) => s.slide.id === selectedId)) setSelectedId(target.slides[0]?.slide.id ?? null);
    setSave({ kind: "saving" });
    const r = await saveDeckStateAction(deck.id, toSeed(target.slides), target.themeId);
    if (r.error) { setSave({ kind: "error", message: r.error }); return; }
    setHasDraft(true);
    setSave({ kind: "saved" });
  };
  const undo = () => void restore(past.current, future.current);
  const redo = () => void restore(future.current, past.current);

  // ⌘Z / Ctrl+Z undo, ⇧⌘Z / Ctrl+Y redo — except while typing, where the browser undoes the text itself.
  useEffect(() => {
    if (readOnly) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((k === "z" && e.shiftKey) || k === "y") { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  // C opens Comments and arms a pin: the next click/drag on the slide places it; typing meanwhile goes to the composer.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape" && (cm.pinMode || cm.activeId)) { patchCm({ pinMode: false, activeId: null }); return; }
      if (!selected) return;
      if (e.key.toLowerCase() === "c") { e.preventDefault(); setTab("comments"); patchCm({ pinMode: true, activeId: null }); focusComposer(); return; }
      // Already pinning and started typing: the text belongs in the comment box.
      if (cm.pinMode && tab === "comments" && e.key.length === 1) { composerRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cm.pinMode, cm.activeId, tab, selected, patchCm, focusComposer]);

  /**
   * Drag-to-place (PlaceLayer): writes a placed item's x / y back into the slide's props ("callouts.2" → callouts[2]).
   * Positions aren't text, so they're edited in English only, on slides the person can edit.
   */
  const canPlace = Boolean(selected) && !readOnly && lang === "en" && tab !== "comments" && !(selected?.from && !unlocked.has(selected.slide.id));
  const placeAt = (path: string, x: number, y: number) => {
    if (!selected) return;
    const [key, index] = path.split(".");
    const props = selected.slide.props as Record<string, unknown>;
    const list = props[key];
    if (!Array.isArray(list) || !list[Number(index)]) return;
    editProps(selected.slide.id, { ...props, [key]: list.map((it, i) => (i === Number(index) ? { ...it, x, y } : it)) });
  };

  /** "Send for review": freezes the draft as the version reviewers see (review v2) and opens the review for the preview language. */
  const publishNow = async () => {
    setPublishing(true);
    await flushAll();
    const r = await sendForReviewAction(deck.id, lang);
    setPublishing(false);
    if (r.error) { setSave({ kind: "error", message: r.error }); return; }
    window.location.reload(); // the editor shows the new status and version
  };
  /** The confirmation lists what will go live: save pending edits first so the list is complete. */
  const [publishAsk, setPublishAsk] = useState(false);
  const loadChanges = useCallback(async () => { await flushAll(); return draftChangesAction(deck.id); }, [flushAll, deck.id]);
  const discard = async () => {
    for (const t of timers.current.values()) clearTimeout(t);
    pending.current.clear();
    await Promise.all([...inflight.current]);
    const r = await discardDraftAction(deck.id);
    if (r.error) { setSave({ kind: "error", message: r.error }); return; }
    window.location.reload(); // start again from the published version
  };

  /* ---------- the slide list (hidden slides only when asked for) ---------- */
  const listed = showHidden ? slides : slides.filter((s) => !s.slide.hidden);
  /** Move to where the listed slide at `i` is (positions in the full deck, hidden slides included). */
  const moveListed = (id: string, i: number) => {
    const target = listed[i];
    if (target) move(id, slides.indexOf(target));
  };

  /* ---------- keyboard: ↑/↓ choose a slide, Alt+↑/↓ move it ---------- */
  const onNavKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    const d = e.key === "ArrowUp" ? -1 : 1;
    const at = listed.findIndex((s) => s.slide.id === selectedId);
    if (at < 0) return;
    if (e.altKey) { if (!readOnly) moveListed(listed[at].slide.id, at + d); }
    else {
      const next = listed[at + d];
      if (next) { setSelectedId(next.slide.id); document.getElementById(`thumb-${next.slide.id}`)?.focus(); }
    }
  };

  return (
    <div className="ed" style={{ ["--ed-panel" as string]: `${panelWidth}px` }}>
      <TopBar
        deck={deck} readOnly={readOnly} title={title} onRename={rename} themes={themes} theme={theme} onTheme={chooseTheme}
        save={save} hasDraft={hasDraft} publishing={publishing} onPublish={() => setPublishAsk(true)} onDiscard={discard}
        canUndo={historySize.undo > 0} canRedo={historySize.redo > 0} onUndo={undo} onRedo={redo}
        lang={lang} onLang={setLang} translations={deckTranslationStatus(slides.map((s) => s.slide))}
        languages={languages} onToggleLanguage={readOnly ? undefined : toggleLanguage} onCopy={startCopy}
        tags={tags} departments={departments} onToggleTag={readOnly ? undefined : toggleTag}
        review={review} onReviewDialog={setReviewDialog} onReviewError={(m) => setSave({ kind: "error", message: m })}
        presentHref={`/decks/${deck.id}/present${lang !== "en" ? `?lang=${lang}` : ""}${selected && !selected.slide.hidden ? `#${presentNumber(selectedIndex)}` : ""}`}
      />
      <div className="ed-work" style={themeVars}>
        <Navigator deckKind={deck.kind} review={review}
          open={navOpen} onToggle={() => setNavOpen((o) => !o)} deckId={deck.id} slides={listed} selectedId={selectedId} readOnly={readOnly}
          presented={slides.length - slides.filter((s) => s.slide.hidden).length} hiddenCount={slides.filter((s) => s.slide.hidden).length}
          showHidden={showHidden} onShowHidden={toggleShowHidden} numberOf={(s) => (s.slide.hidden ? null : presentNumber(slides.indexOf(s)))}
          onSelect={setSelectedId} onMove={moveListed} onRemove={remove} onKey={onNavKey} lang={lang}
        />
        <Canvas selected={selected} number={selected ? (selected.slide.hidden ? "Hidden" : pad2(presentNumber(selectedIndex))) : ""} lang={lang}
          overlay={tab === "comments" && selected ? <CommentOverlay slideId={selected.slide.id} state={cm} onState={patchCm} onPlaced={focusComposer} /> : null}
          onPlace={selected && canPlace ? placeAt : undefined} />
        <ContentPanel
          key={selected?.slide.id}
          deckId={deck.id}
          item={selected}
          readOnly={readOnly}
          locked={!readOnly && Boolean(selected?.from) && !unlocked.has(selected!.slide.id)}
          onUnlock={() => selected && setUnlocked((u) => new Set(u).add(selected.slide.id))}
          onChange={(props) => selected && (lang === "en" ? editProps(selected.slide.id, props) : editTranslation(selected.slide.id, lang, props))}
          onToggleHidden={() => selected && toggleHidden(selected.slide.id)}
          canReset={Boolean(selected && !readOnly && (selected.from ? unlocked.has(selected.slide.id) : selected.slide.source?.copiedFrom))}
          onReset={() => selected && void reset(selected.slide.id)}
          onResize={setPanelWidth}
          width={panelWidth}
          lang={lang}
          review={review}
          onReviewError={(m) => setSave({ kind: "error", message: m })}
          onCopy={startCopy}
          tab={tab} onTab={(t) => { setTab(t); if (t === "editor") patchCm({ pinMode: false, activeId: null }); }}
          commentCount={selected ? openCount(cm.comments, selected.slide.id) : 0}
          comments={<CommentsPanel deckId={deck.id} slideId={selected?.slide.id ?? null} state={cm} onState={patchCm} onComments={setComments} composerRef={composerRef}
            onError={(m) => setSave({ kind: "error", message: m })} />}
        />
      </div>
      {publishAsk && <PublishDialog load={loadChanges} onCancel={() => setPublishAsk(false)} onConfirm={() => { setPublishAsk(false); publishNow(); }} />}
      {reviewDialog && <ReviewDialog deckId={deck.id} dialog={reviewDialog} onClose={() => setReviewDialog(null)} onError={(m) => setSave({ kind: "error", message: m })} />}
      {copyAsk && <CopyDialog deckId={deck.id} title={title} langs={copyLangs} onClose={() => setCopyAsk(false)} />}
    </div>
  );
}

/* ================= Top bar ================= */

function TopBar({ deck, readOnly, title, onRename, themes, theme, onTheme, save, hasDraft, publishing, onPublish, onDiscard, presentHref, canUndo, canRedo, onUndo, onRedo, lang, onLang, translations, languages, onToggleLanguage, onCopy, tags, departments, onToggleTag, review, onReviewDialog, onReviewError }: {
  deck: { id: string; kind: "master" | "copy"; versionNumber: number | null; sentVersion: number | null; approvedVersion: number | null }; readOnly: boolean;
  title: string; onRename: (t: string) => void;
  themes: ThemeOption[]; theme: ThemeOption; onTheme: (id: string) => void;
  save: SaveState; hasDraft: boolean; publishing: boolean; onPublish: () => void; onDiscard: () => void; presentHref: string;
  canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void;
  lang: Lang; onLang: (l: Lang) => void; translations: ReturnType<typeof deckTranslationStatus>;
  languages: TargetLang[] | null; onToggleLanguage?: (l: TargetLang, on: boolean) => void; onCopy: () => void;
  tags: Tag[]; departments: Tag[]; onToggleTag?: (t: Tag, on: boolean) => void;
  review: ReviewProps; onReviewDialog: (d: Dialog) => void; onReviewError: (m: string) => void;
}) {
  const mac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const commit = () => { setEditing(false); onRename(draft); };
  return (
    <header className="ed-top">
      <div className="ed-identity">
        <Link href="/" className="ed-icon-btn" aria-label="Back to decks">{ICON("arrow-left")}</Link>
        <span className="ed-divider" aria-hidden />
        <div className="ed-title-block">
          <span className="ed-crumb"><span><Link href="/">Decks</Link> / {deck.kind === "master" ? "Company-wide" : "My decks"}</span><DeckId id={deck.id} className="deck-id-sm" /></span>
          {readOnly ? (
            <h1 className="ed-title ed-title-static"><span>{title}</span></h1>
          ) : editing ? (
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

      <div className="ed-pickers">
      {readOnly ? (
        <span className="ed-theme"><span className="ed-theme-btn static"><span>Theme</span><i className="ed-theme-dot" style={{ background: theme.tokens.accent[0] }} aria-hidden /><span>{theme.name}</span></span></span>
      ) : <ThemePicker themes={themes} theme={theme} onTheme={onTheme} />}
        <LanguagePicker lang={lang} onLang={onLang} translations={translations} languages={languages} onToggle={onToggleLanguage} review={review}
          ctx={{ kind: deck.kind, hasDraft: !readOnly && hasDraft, sentVersion: deck.sentVersion, approvedVersion: deck.approvedVersion }} />
        <TagPicker tags={tags} departments={departments} onToggle={onToggleTag} />
      </div>

      <div className="ed-actions">
        {readOnly ? <span className="ed-save">{review.canReview[lang] ? "Reviewing" : "View only"}</span> : <span className={`ed-save ${save.kind}`} role="status" aria-live="polite">
          {save.kind === "error" ? <span className="ed-save-error" title={save.message}>Couldn&apos;t save: {save.message}</span>
            : <>{ICON("cloud-check", 15)}<span>{save.kind === "saving" ? "Saving…" : save.kind === "published" ? `Sent v${save.version} for review` : hasDraft ? "Draft saved" : "All changes saved"}</span></>}
        </span>}
        {!readOnly && (
          <span className="ed-history">
            <button type="button" className="ed-icon-btn" aria-label="Undo" title={`Undo (${mac ? "⌘Z" : "Ctrl+Z"})`} disabled={!canUndo} onClick={onUndo}>{ICON("undo")}</button>
            <button type="button" className="ed-icon-btn" aria-label="Redo" title={`Redo (${mac ? "⇧⌘Z" : "Ctrl+Y"})`} disabled={!canRedo} onClick={onRedo}>{ICON("redo")}</button>
          </span>
        )}
        {/* One slot: "Send for review" (with Discard) while there are unsent changes; otherwise the review action, if any. */}
        {!readOnly && hasDraft ? (
          <PublishSplit publishing={publishing} onPublish={onPublish} onDiscard={onDiscard} />
        ) : <ReviewButtons deckId={deck.id} review={review} lang={lang} hasDraft={hasDraft} onError={onReviewError} />}
        <PresentButton href={presentHref} />
        <Link className="ed-icon-btn ed-share" href={`/decks/${deck.id}/share`} aria-label="Share" title="Share">{ICON("share")}</Link>
        <Menu label="More deck actions" trigger={ICON("ellipsis")} items={[
          ...reviewMenuItems(deck.id, review, lang, deck.kind, hasDraft, onReviewDialog),
          { label: "Make a copy", onSelect: onCopy },
          { label: "Version history", href: `/decks/${deck.id}/history` },
          { label: "Presentations", href: `/decks/${deck.id}/presentations` },
          { label: "Compare with Figma", href: `/decks/${deck.id}/compare`, hidden: deck.kind !== "master" },
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
          <p className="ed-menu-note">Switching saves to the draft. Send for review to make it live.</p>
        </div>
      )}
    </div>
  );
}

/**
 * "Tags: Legal, Training" — the departments the deck is for (People page keeps the list). Editors tick them
 * here; it saves straight away. People who can't edit see the tags, or nothing when there are none.
 */
function TagPicker({ tags, departments, onToggle }: { tags: Tag[]; departments: Tag[]; onToggle?: (t: Tag, on: boolean) => void }) {
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
  const label = tags.length === 0 ? "None" : tags.length <= 2 ? tags.map((t) => t.name).join(", ") : `${tags[0].name} +${tags.length - 1}`;
  if (!onToggle) {
    if (!tags.length) return null;
    return <span className="ed-theme"><span className="ed-theme-btn static" title={tags.map((t) => t.name).join(", ")}><span>Tags</span><span className="ed-tags-val">{label}</span></span></span>;
  }
  const on = new Set(tags.map((t) => t.id));
  return (
    <div className="ed-theme" ref={ref}>
      <button type="button" className="ed-theme-btn" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((o) => !o)} title={tags.map((t) => t.name).join(", ") || undefined}>
        <span>Tags</span><span className={`ed-tags-val${tags.length ? "" : " none"}`}>{label}</span>
      </button>
      {open && (
        <div className="ed-menu-list center ed-tags-list" role="group" aria-label="Tags">
          {departments.map((d) => (
            <label key={d.id} className="ed-menu-item ed-tag-opt">
              <input type="checkbox" checked={on.has(d.id)} onChange={(e) => onToggle(d, e.target.checked)} />
              <span>{d.name}</span>
            </label>
          ))}
          <p className="ed-menu-note">{departments.length
            ? "Who the deck is for. Saves straight away; tags don't need a review."
            : "No departments yet. Admins add them on the People page."}</p>
        </div>
      )}
    </div>
  );
}

/**
 * "Language: EN 🇬🇧" — which language the slides are previewed in, with how complete each translation is.
 * Company masters offer every language they hold. People's own decks start in English: the owner adds a
 * language here (translations that came with master slides show up straight away) and can remove it again.
 */
function LanguagePicker({ lang, onLang, translations, languages, onToggle, review, ctx }: {
  lang: Lang; onLang: (l: Lang) => void; translations: ReturnType<typeof deckTranslationStatus>;
  languages: TargetLang[] | null; onToggle?: (l: TargetLang, on: boolean) => void; review: ReviewProps; ctx: StatusCtx;
}) {
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
  const noteOf = (t: (typeof translations)[number]) => {
    const n = t.fresh + t.stale + t.missing;
    const note = t.fresh === n ? `${n} of ${n} slides` : `${t.fresh} of ${n} slides${t.stale ? ` · ${t.stale} out of date` : ""}`;
    return { note, state: t.fresh === n ? "ok" as const : t.fresh + t.stale === 0 ? "none" as const : "part" as const };
  };
  const on = (l: TargetLang) => !languages || languages.includes(l);
  const options: { lang: Lang; note: string; state: "ok" | "part" | "none" }[] = [
    { lang: "en", note: "Original", state: "ok" },
    ...translations.filter((t) => on(t.lang)).map((t) => ({ lang: t.lang, ...noteOf(t) })),
  ];
  // Own decks: languages the owner can add (in the deck's language order).
  const addable = languages && onToggle ? TARGET_LANGS.filter((l) => !on(l)) : [];
  const current = LANGUAGES[lang];
  // Reviews are per language, so the button carries this language's review state and the list shows every language's.
  const status = reviewLabel(summaryFor(review, lang), ctx, lang);
  return (
    <div className="ed-theme ed-lang" ref={ref}>
      <button type="button" className="ed-theme-btn" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        title={`Preview language · ${reviewTitle(summaryFor(review, lang), lang, ctx)}`}>
        <span>Language</span><span className="ed-lang-flag" aria-hidden>{current.flag}</span><span>{current.short}</span>
        <span className={`ed-lang-status ${status.tone}`}><i aria-hidden />{status.text}</span>
      </button>
      {open && (
        <div className="ed-menu-list end" role="listbox" aria-label="Preview language">
          {options.map((o) => (
            <button key={o.lang} type="button" role="option" aria-selected={o.lang === lang} className={`ed-menu-item ed-lang-opt${o.lang === lang ? " on" : ""}`}
              onClick={() => { setOpen(false); onLang(o.lang); }}>
              <span className="ed-lang-flag" aria-hidden>{LANGUAGES[o.lang].flag}</span>
              <span className="ed-lang-name"><span lang={o.lang}>{LANGUAGES[o.lang].name}</span>{o.lang !== "en" && <small>{LANGUAGES[o.lang].english}</small>}</span>
              <span className={`ed-lang-note ${o.state}`}>{o.note}</span>
              {(() => { const r = reviewLabel(summaryFor(review, o.lang), ctx, o.lang); return <span className={`ed-lang-status ${r.tone}`} title={reviewTitle(summaryFor(review, o.lang), o.lang, ctx)}><i aria-hidden />{r.text}</span>; })()}
            </button>
          ))}
          {addable.length > 0 && <p className="ed-menu-label">Add a language</p>}
          {addable.map((l) => {
            const t = translations.find((x) => x.lang === l);
            const ready = t ? t.fresh : 0;
            return (
              <button key={l} type="button" className="ed-menu-item ed-lang-opt ed-lang-add" onClick={() => { setOpen(false); onToggle!(l, true); }}>
                <span className="ed-lang-flag" aria-hidden>{LANGUAGES[l].flag}</span>
                <span className="ed-lang-name"><span lang={l}>{LANGUAGES[l].name}</span><small>{LANGUAGES[l].english}</small></span>
                <span className="ed-lang-hint">{ready ? `${ready} slide${ready === 1 ? "" : "s"} already translated` : "Not translated yet"}</span>
                <span className="ed-lang-plus" aria-hidden>Add</span>
              </button>
            );
          })}
          {languages && onToggle && lang !== "en" && (
            <button type="button" className="ed-menu-item danger ed-lang-remove" onClick={() => { setOpen(false); onToggle(lang, false); }}>
              Remove {LANGUAGES[lang].english} from this deck
            </button>
          )}
          <p className="ed-menu-note">{languages
            ? "Only the languages listed above show in Present and share links. Translations are made with Claude (Dekiru connector) or typed here; removing a language keeps them."
            : "Translations are made with Claude (Dekiru connector). Share links offer every language the deck has."}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Present: goes full screen straight away (allowed here because it's a click), then opens the presentation
 * with a loading state over the editor until the slides arrive. Full screen survives the page change because
 * it's a client-side navigation.
 */
function PresentButton({ href }: { href: string }) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);
  const open = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // new tab: let the browser do it
    e.preventDefault();
    setOpening(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
    router.push(href);
  };
  return (
    <>
      <Link className="ed-btn ed-btn-primary" href={href} onClick={open} aria-disabled={opening} aria-busy={opening}>
        {ICON("play")}<span>{opening ? "Opening…" : "Present"}</span>
      </Link>
      {opening && (
        <div className="ed-opening" role="status" aria-live="polite">
          <div className="ed-opening-card"><span className="ed-spinner" aria-hidden />Opening presentation…</div>
        </div>
      )}
    </>
  );
}

/* ================= Slide navigator ================= */

function Navigator({ open, onToggle, deckId, deckKind, slides, selectedId, readOnly, presented, hiddenCount, showHidden, onShowHidden, numberOf, onSelect, onMove, onRemove, onKey, lang, review }: {
  open: boolean; onToggle: () => void; deckId: string; deckKind: "master" | "copy"; slides: EditorSlide[]; selectedId: string | null; readOnly: boolean; lang: Lang; review: ReviewProps;
  presented: number; hiddenCount: number; showHidden: boolean; onShowHidden: (on: boolean) => void;
  numberOf: (s: EditorSlide) => number | null;
  onSelect: (id: string) => void; onMove: (id: string, to: number) => void; onRemove: (id: string) => void;
  onKey: (e: React.KeyboardEvent) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  // Reviewing a revision (spec §7b): untouched slides are dimmed, the rest say what changed.
  const reviewing = summaryFor(review, lang)?.status === "for_review" && Boolean(review.diff[lang]);
  const diff = reviewing ? review.diff[lang] : null;
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
        <div className="ed-nav-row">
          <span><b>Slides</b><span className="ed-count">{presented}</span></span>
          <button type="button" className="ed-icon-btn" aria-label="Hide slides" onClick={onToggle}>{ICON("panel-left-close")}</button>
        </div>
        {diff && (
          <p className="ed-nav-diff">
            Changes since v{diff.against}: {Object.values(diff.slides).filter((c) => c.kind !== "unchanged").length} slide{Object.values(diff.slides).filter((c) => c.kind !== "unchanged").length === 1 ? "" : "s"}
            {diff.removed.length > 0 && <> · {diff.removed.length} removed ({diff.removed.join(", ")})</>}
            {diff.theme && <> · theme</>}
          </p>
        )}
        {hiddenCount > 0 && (
          <label className="ed-nav-row ed-show-hidden">
            <span>Show hidden slides<span className="ed-count">{hiddenCount}</span></span>
            <input type="checkbox" checked={showHidden} onChange={(e) => onShowHidden(e.target.checked)} />
          </label>
        )}
      </div>
      <ol className="ed-thumbs" onKeyDown={onKey}>
        {slides.map((s, i) => {
          const number = numberOf(s);
          const on = s.slide.id === selectedId;
          const change = reviewing ? slideChange(review, lang, s.slide.id) : null;
          return (
            <li key={s.slide.id}
              className={["ed-thumb", on ? "on" : "", s.slide.hidden ? "is-hidden" : "", dragId === s.slide.id ? "dragging" : "", over === i && dragId !== s.slide.id ? "drop" : "", change?.kind === "unchanged" ? "unchanged" : ""].join(" ")}
              draggable={!readOnly}
              onDragStart={(e) => { setDragId(s.slide.id); e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => { setDragId(null); setOver(null); }}
              onDragOver={(e) => { e.preventDefault(); setOver(i); }}
              onDrop={(e) => { e.preventDefault(); if (dragId) onMove(dragId, i); setDragId(null); setOver(null); }}
            >
              <button type="button" id={`thumb-${s.slide.id}`} className="ed-thumb-btn" aria-current={on ? "true" : undefined}
                aria-label={`${number ? `Slide ${number}` : "Hidden slide"}: ${s.name}`} onClick={() => onSelect(s.slide.id)}>
                <ScaledSlide><RenderSlide slide={s.slide} lang={lang} /></ScaledSlide>
              </button>
              <span className="ed-thumb-n" aria-hidden>{number ? pad2(number) : "—"}</span>
              {change && change.kind !== "unchanged" && (
                <span className={`ed-thumb-change ${change.kind}`} title={[change.detail, change.moved && change.kind !== "moved" ? "moved" : null, change.visibility && change.kind !== change.visibility ? change.visibility : null].filter(Boolean).join(" · ") || undefined}>
                  {CHANGE_LABEL[change.kind]}{change.kind === "edited" && (change.moved || change.visibility) ? " +" : ""}
                </span>
              )}
              {/* "Master slide": follows a company deck (spec §7b — masters are component libraries). Not shown inside masters, where every slide is one. "Approved" is reserved for review status. */}
              {(s.slide.hidden || (s.from && deckKind === "copy")) && <span className="ed-thumb-tag" title={s.slide.hidden ? "Hidden from the presentation" : `Master slide from ${s.from?.deck}. It updates when that deck's changes are approved.`}>{s.slide.hidden ? "Hidden" : "Master slide"}</span>}
              {!readOnly && slides.length > 1 && (confirm === s.slide.id ? (
                <button type="button" className="ed-thumb-del armed" onClick={() => { setConfirm(null); onRemove(s.slide.id); }} onBlur={() => setConfirm(null)} autoFocus>Delete?</button>
              ) : (
                <button type="button" className="ed-thumb-del" aria-label={`Delete ${s.name}`} onClick={() => setConfirm(s.slide.id)}>{ICON("trash-2", 12)}</button>
              ))}
            </li>
          );
        })}
      </ol>
      {!readOnly && <div className="ed-nav-f">
        <Menu className="ed-add" label="Add slide" align="start"
          trigger={<span className="ed-btn ed-btn-block">{ICON("plus")}<span>Add slide</span></span>}
          items={[
            { label: "Master slide", href: `/library?deck=${encodeURIComponent(deckId)}` },
            { label: "From a template", href: `/library/templates?deck=${encodeURIComponent(deckId)}` },
          ]} />
        <p className="ed-hint">Drag slides to reorder</p>
      </div>}
    </nav>
  );
}

/* ================= Canvas ================= */

const ZOOMS = [0.25, 0.33, 0.42, 0.5, 0.67, 0.75, 1];

export function Canvas({ selected, number, lang, overlay, onPlace }: {
  selected: EditorSlide | null; number: string; lang: Lang; overlay: React.ReactNode;
  /** Drag-to-place markers (see PlaceLayer); off when not given. */
  onPlace?: (path: string, x: number, y: number) => void;
}) {
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
              <span>{number ? `${number} / ` : ""}{selected.section.toUpperCase()}</span>
              <span className="ed-layout">{ICON("panels-top-left", 12)}{selected.layout}</span>
            </div>
            <div className="ed-slide" style={{ width: SLIDE_W * scale, height: SLIDE_H * scale }}>
              <div style={{ transform: `scale(${scale})`, transformOrigin: "0 0", width: SLIDE_W, height: SLIDE_H }}>
                {/* Preview-only: flags images that don't fit their slot. Never shown when presenting. */}
                <PlaceLayer key={selected.slide.id} onPlace={onPlace}><PreviewChecks key={`${selected.slide.id}/${lang}`}><RenderSlide slide={selected.slide} lang={lang} /></PreviewChecks></PlaceLayer>
              </div>
              {overlay}
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

function ContentPanel({ deckId, item, readOnly, locked, onUnlock, onChange, onToggleHidden, canReset, onReset, onResize, width, lang, review, onReviewError, onCopy, tab, onTab, commentCount, comments }: {
  deckId: string; onCopy: () => void; item: EditorSlide | null; readOnly: boolean; locked: boolean; onUnlock: () => void; lang: Lang;
  tab: "editor" | "comments"; onTab: (t: "editor" | "comments") => void; commentCount: number; comments: React.ReactNode;
  review: ReviewProps; onReviewError: (m: string) => void;
  onChange: (props: Record<string, unknown>) => void; onToggleHidden: () => void;
  /** The slide is an approved one edited for this deck: it can go back to the approved content. */
  canReset: boolean; onReset: () => void;
  onResize: (w: number) => void; width: number;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const warnings = item ? checkOverflow(item.slide, lang) : [];
  const trState = item && lang !== "en" ? translationState(item.slide, lang) : "fresh";
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
        <h2>Slide content</h2>
        {item && <ApproveSlide deckId={deckId} slideId={item.slide.id} review={review} lang={lang} onError={onReviewError} />}
        {item && !readOnly && canReset && (
          <button type="button" className="ed-btn ed-btn-sm ed-reset" onClick={() => setConfirmReset(true)}>Reset</button>
        )}
        {confirmReset && (
          <ConfirmDialog title="Reset to the approved slide?" body="Your edits to this slide are dropped and it follows the approved slide again, so updates from the master reach it." action="Reset slide"
            onCancel={() => setConfirmReset(false)} onConfirm={() => { setConfirmReset(false); onReset(); }} />
        )}
      </div>
      <div className="tabs ed-tabs" role="tablist" aria-label="Panel">
        <button type="button" role="tab" aria-selected={tab === "editor"} className={tab === "editor" ? "on" : ""} onClick={() => onTab("editor")}>Editor</button>
        <button type="button" role="tab" aria-selected={tab === "comments"} className={tab === "comments" ? "on" : ""} onClick={() => onTab("comments")}>Comments <span>{commentCount}</span></button>
      </div>
      {tab === "comments" ? comments : (
      <div className="ed-form" role="tabpanel">
        {!item ? <p className="ed-hint">Choose a slide on the left.</p> : (
          <>
            {readOnly && !review.canReview[lang] && (
              <div className="ed-note">
                <p>You can view, present and share this deck. To change it, make your own copy.</p>
                <button type="button" className="ed-btn ed-btn-sm" onClick={onCopy}>Make a copy</button>
              </div>
            )}
            {readOnly && review.canReview[lang] && (
              <div className="ed-note">
                <p>You&apos;re reviewing this {lang === "en" ? "deck" : `${LANGUAGES[lang].english} translation`}. Check each slide and approve it, or approve the whole deck from the top bar. Use Request changes (⋯ menu) to send it back.</p>
              </div>
            )}
            {readOnly ? (item.slide.hidden && <p className="ed-note">Hidden: kept in the deck but not presented or shared.</p>) : ALWAYS_SHOWN.has(item.slide.pattern) ? null : (
              <label className="ed-check">
                <input type="checkbox" checked={!!item.slide.hidden} onChange={onToggleHidden} />
                <span>Hide from presentation</span>
                <small>Kept in the deck but not presented or shared.</small>
              </label>
            )}
            {lang !== "en" && (
              <div className={`ed-note${trState === "fresh" ? "" : " ed-note-warn"}`}>
                <p>
                  {trState === "fresh" ? <>You&apos;re editing the <b>{LANGUAGES[lang].english}</b> translation. Corrections save as you type; switch to English to change the original.</>
                    : trState === "stale" ? <><b>{LANGUAGES[lang].english}</b>: the English changed after this slide was translated. Fix the translation below, or ask Claude to translate the deck again (it updates only the slides that changed).</>
                    : <><b>{LANGUAGES[lang].english}</b>: not translated yet, so the slide shows in English. Type the translation below, or ask Claude (Dekiru connector) to translate the deck.</>}
                </p>
              </div>
            )}
            {locked && item.from && (
              <div className="ed-note">
                <p>Master slide from <b>{item.from.deck}</b>. It updates when that deck&apos;s changes are approved.</p>
                <button type="button" className="ed-btn ed-btn-sm" onClick={onUnlock}>Edit for this deck only</button>
                <p className="ed-note-sub">Editing makes it this deck&apos;s own slide; updates from {item.from.deck} won&apos;t reach it.</p>
              </div>
            )}
            {(() => {
              const c = summaryFor(review, lang)?.status === "for_review" ? slideChange(review, lang, item.slide.id) : null;
              if (!c) return null;
              return c.kind === "unchanged"
                ? <p className="ed-note ed-note-ok">Unchanged since the last approved version{review.diff[lang] ? ` (v${review.diff[lang]!.against})` : ""}.</p>
                : <p className="ed-note ed-note-change"><b>{CHANGE_LABEL[c.kind]}</b>{c.detail ? <>: {c.detail}</> : null}{c.moved && c.kind !== "moved" ? " · moved" : ""}{c.visibility && c.kind !== c.visibility ? ` · ${c.visibility}` : ""}</p>;
            })()}
            {warnings.length > 0 && (
              <ul className="ed-warn">
                {warnings.map((w, i) => <li key={i}><b>{fieldLabel(w.slot.split(".").pop()!.split(" ")[0])}</b>: {w.message}</li>)}
              </ul>
            )}
            <ContentFields key={lang} pattern={item.slide.pattern} value={localize(item.slide, lang).props as Record<string, unknown>} onChange={onChange} disabled={locked || readOnly}
              changed={summaryFor(review, lang)?.status === "for_review" ? new Set(slideChange(review, lang, item.slide.id)?.fields ?? []) : undefined} />
          </>
        )}
      </div>
      )}
      <div className="ed-panel-f">{ICON("info", 12)}<span>{tab === "comments" ? "Press C, then click or drag on the slide to pin a comment" : readOnly ? "View only" : "Changes appear on your slide automatically"}</span></div>
    </aside>
  );
}
