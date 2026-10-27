/**
 * Editing decks: who may change what, and slide-level operations on a deck's draft.
 * Used by the Claude connector (src/app/api/mcp) and the app's Publish / Make a copy buttons.
 *
 * Rules
 * - Masters (company decks): admins and managers edit; everyone can copy.
 * - Copies: only the owner edits (admins can see them).
 * - Every edit lands in the deck's draft; nothing is visible to others until published.
 * - Approved content (blocks) = slides of the master decks, inserted as references ("dk-1a2b3c4d/s04")
 *   so they keep following the master. Editing a referenced slide turns it into the deck's own
 *   slide (an override) and the response says so.
 */
import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { renderToStaticMarkup } from "react-dom/server.edge";
import { db } from "@/db/client";
import { deckVersions, decks, users } from "@/db/schema";
import { createElement } from "react";
import { isRef, resolveSlides, type SeedSlide } from "@/content/resolve";
import { RenderSlide } from "@/deck/RenderSlide";
import { checkOverflow, type OverflowWarning } from "@/deck/overflow";
import { LANGUAGES, overlayFromEntries, textEntries, translationState, withTranslation, type TargetLang } from "@/deck/i18n";
import { patterns } from "@/deck/registry";
import type { SlideData } from "@/deck/types";
import { copyDeck, createDeck, getDeckVersions, publishDraft, saveDraft } from "./decks";
import type { SignedInUser } from "./auth";
import { canEdit, canView, deckRow } from "./access";
import { pickTheme, publishedThemes } from "./themes";
import { DEFAULT_THEME_ID } from "@/deck/theme";
import { getTemplate } from "@/content/templates";
import { EditError } from "./errors";
import { coverTitle } from "@/content/cover";
import { agendaFor, analyzeMaster, arrange, sectionNumbers } from "@/content/structure";

export { canEdit, canView, deckRow };

export { EditError };

async function editable(id: string, user: SignedInUser | null) {
  const row = await deckRow(id);
  if (!row || !canView(row, user)) throw new EditError(`No deck called "${id}". Use list_decks to see what's available.`);
  if (!canEdit(row, user)) {
    throw new EditError(row.kind === "master"
      ? `"${row.title}" is a company master; only admins and managers can change it. Make your own copy with copy_deck and edit that.`
      : `"${row.title}" belongs to someone else.`);
  }
  return row;
}

/** The slides edits apply to: the draft if there is one, else the newest published version. */
async function working(id: string) {
  const { draft, published } = await getDeckVersions(id);
  const v = draft ?? published;
  if (!v) throw new EditError(`Deck "${id}" has no content yet.`);
  return { slides: structuredClone(v.slides) as SeedSlide[], isDraft: Boolean(draft) };
}

const lookup = async (deckId: string) => (await getDeckVersions(deckId)).published?.slides;

/** Resolve, render and budget-check slides. Rendering errors are returned, never thrown. */
export async function checkSlides(slides: SeedSlide[]) {
  const resolved = await resolveSlides(slides, lookup);
  return resolved.map((s) => {
    let renderError: string | null = null;
    if (!patterns[s.pattern]) renderError = `Unknown pattern "${s.pattern}". Use list_patterns.`;
    else {
      // The glow is chrome (same on every slide, uses a hook this renderer can't run), so it's left out of the check.
      try { renderToStaticMarkup(createElement(RenderSlide, { slide: { ...s, chrome: { ...s.chrome, overlay: false } } })); }
      catch (e) {
        // On the server, client-only pieces (the measured title cage) can't render; everything up to them did.
        const msg = (e as Error).message;
        if (!/from the server but \w+ is on the client/.test(msg)) renderError = msg;
      }
    }
    return { slide: s, renderError, overflow: checkOverflow(s) as OverflowWarning[] };
  });
}

/** Validates one candidate slide before it is saved. */
async function validate(slide: SeedSlide) {
  const [r] = await checkSlides([slide]);
  if (r.renderError) {
    throw new EditError(`That slide doesn't render: ${r.renderError}. Check the props against get_pattern("${r.slide.pattern}").`);
  }
  return r;
}

async function save(id: string, slides: SeedSlide[], user: SignedInUser | null, note: string) {
  await saveDraft(id, slides, { userId: user?.id ?? null, note });
}

const newSlideId = () => `n${randomBytes(4).toString("hex")}`;

export type SlideInput =
  | { block: string }
  | { pattern: string; props: Record<string, unknown>; hidden?: boolean; chrome?: SlideData["chrome"] };

async function toSlide(input: SlideInput): Promise<SeedSlide> {
  if ("block" in input) {
    const [deckId, slideId] = input.block.split("/");
    const master = await deckRow(deckId);
    if (!master || master.kind !== "master") throw new EditError(`"${input.block}" isn't an approved block. Blocks are master slides like "<deck id>/s04" (see get_deck on a master).`);
    const src = (await lookup(deckId))?.find((s) => s.id === slideId);
    if (!src) throw new EditError(`No slide "${slideId}" in master "${deckId}".`);
    return { id: newSlideId(), ref: input.block };
  }
  if (!patterns[input.pattern]) throw new EditError(`Unknown pattern "${input.pattern}". Use list_patterns.`);
  return {
    id: newSlideId(), pattern: input.pattern, props: input.props,
    ...(input.chrome ? { chrome: input.chrome } : {}), ...(input.hidden ? { hidden: true } : {}),
  };
}

function indexOf(slides: SeedSlide[], slideId: string) {
  const i = slides.findIndex((s) => s.id === slideId);
  if (i < 0) throw new EditError(`No slide "${slideId}" in this deck. get_deck lists slide ids.`);
  return i;
}

/** Where an edit came from, recorded as the draft's note (shown in version history). */
export type Via = "claude" | "app";
const editNote = (via: Via) => (via === "claude" ? "Edited with Claude" : "Edited in Dekiru");

/* ---------- operations ---------- */

/** The cover a new deck starts from: the approved master cover when it exists, else the cover template. */
export async function coverBase(): Promise<SlideData | undefined> {
  const cover = getTemplate("cover");
  if (!cover) return undefined;
  const [deckId, slideId] = cover.from.split("/");
  const approved = (await lookup(deckId))?.find((s) => s.id === slideId);
  return approved && !isRef(approved) && approved.pattern === "cover" ? approved : cover.slide;
}

/**
 * Every new deck opens with a title slide and ends with the closing slide, unless the picked slides already have them.
 * The cover is the deck's own (approved cover with the deck's title, editable); the closing stays linked to the master.
 */
async function withCoverAndClosing(title: string, slides: SeedSlide[], applyTitle = true) {
  const patternsUsed = new Set((await resolveSlides(slides, lookup)).map((s) => s.pattern));
  const out = [...slides];
  const closing = getTemplate("closing");
  const base = await coverBase();
  if (!patternsUsed.has("cover") && base) {
    out.unshift({
      id: newSlideId(), pattern: "cover", props: applyTitle ? { ...base.props, title: coverTitle(title) } : { ...base.props },
      ...(base.chrome ? { chrome: base.chrome } : {}),
    });
  }
  if (!patternsUsed.has("closing") && closing) {
    const [deckId, slideId] = closing.from.split("/");
    const approved = (await lookup(deckId))?.some((s) => s.id === slideId);
    out.push(approved
      ? { id: newSlideId(), ref: closing.from }
      : { id: newSlideId(), pattern: "closing", props: closing.slide.props, ...(closing.slide.chrome ? { chrome: closing.slide.chrome } : {}) });
  }
  return out;
}

/** Follows a block that is itself shared from another master to the slide it comes from. */
async function origin(ref: string) {
  for (let hops = 0; hops < 5; hops++) {
    const [deckId, slideId] = ref.split("/");
    const s = (await lookup(deckId))?.find((x) => x.id === slideId);
    if (!s || !isRef(s)) return ref;
    ref = s.ref;
  }
  return ref;
}

/**
 * The New deck rules (see src/content/structure.ts): products bring all their slides, their section divider,
 * the product index (3+ products) and pillar dividers (2+ pillars); with 3+ sections an agenda of exactly those
 * sections is added and the sections are numbered 01, 02…; otherwise no agenda and no numbers.
 */
async function withStructure(input: SeedSlide[]) {
  const slides = await Promise.all(input.map(async (s) => (isRef(s) ? { ...s, ref: await origin(s.ref) } : s)));
  const deckIds = [...new Set(slides.filter(isRef).map((s) => s.ref.split("/")[0]))];
  const structures = [];
  for (const d of deckIds) {
    const row = await deckRow(d);
    const stored = row?.kind === "master" ? await lookup(d) : undefined;
    if (stored) structures.push(analyzeMaster(d, stored));
  }
  const own = new Map<string, SeedSlide>();
  const picks = slides.map((s, i) => { if (isRef(s)) return s.ref; own.set(`#own/${i}`, s); return `#own/${i}`; });
  let out: SeedSlide[] = [];
  for (const b of arrange(picks, structures)) {
    if (b.slide) { const s = { ...b.slide, id: newSlideId() }; delete s.ref; await validate(s); out.push(s); }
    else if (b.block && own.has(b.block)) out.push(own.get(b.block)!);
    else if (b.block) out.push({ id: newSlideId(), ref: b.block });
  }
  // Agenda (3+ sections): right after a picked cover, else first (the deck's own cover goes before it).
  const first = await resolveSlides(out, lookup);
  const isL1 = (x: SlideData) => x.pattern === "section" && (x.props as { level?: number }).level !== 2;
  const agenda = agendaFor(first.flatMap((x, i) => (isL1(x) ? [{ block: isRef(out[i]) ? (out[i] as { ref: string }).ref : undefined, slide: x }] : [])), structures);
  if (agenda) {
    const cover = first.findIndex((x) => x.pattern === "cover");
    let slide: SeedSlide;
    if (agenda.slide) { const s = { ...agenda.slide, id: newSlideId() }; delete s.ref; await validate(s); slide = s; }
    else slide = { id: newSlideId(), ref: agenda.block! };
    out.splice(cover + 1, 0, slide);
  }
  // Section numbers: a linked divider whose number changes becomes this deck's own copy.
  const resolved = await resolveSlides(out, lookup);
  const numbers = sectionNumbers(resolved);
  out = out.map((s, i) => {
    const want = numbers.get(i);
    const r = resolved[i];
    if (want === undefined || (r.props as { number?: string }).number === want) return s;
    const { ref, ...data } = r;
    return { ...data, id: s.id, props: { ...data.props, number: want }, ...(ref ? { source: { ...data.source, copiedFrom: ref } } : {}) };
  });
  return out;
}

export interface NewDeckOptions {
  /** false: the deck starts as an unpublished draft ("Save as draft"). Default: published. */
  publish?: boolean;
  /** false: the cover keeps the approved title instead of taking the deck's name. Default: the deck's name. */
  coverTitle?: boolean;
  /** Theme id; null or undefined = the default company theme. */
  themeId?: string | null;
}

export async function newDeck(user: SignedInUser | null, title: string, inputs: SlideInput[], via: Via = "claude", opts: NewDeckOptions = {}) {
  if (!inputs.length) throw new EditError("A deck needs at least one slide.");
  let slides: SeedSlide[] = [];
  for (const i of inputs) { const s = await toSlide(i); await validate(s); slides.push(s); }
  slides = await withStructure(slides);
  slides = await withCoverAndClosing(title, slides, opts.coverTitle !== false);
  if (opts.themeId) {
    const all = await publishedThemes();
    if (!all.some((t) => t.id === opts.themeId)) throw new EditError(`No theme "${opts.themeId}". Themes: ${all.map((t) => t.id).join(", ")}.`);
  }
  const id = await newDeckId();
  await createDeck({
    id, title: title.trim(), kind: "copy", slides, note: via === "claude" ? "Created with Claude" : "Created in Dekiru",
    themeId: opts.themeId && opts.themeId !== DEFAULT_THEME_ID ? opts.themeId : null, status: opts.publish === false ? "draft" : "published",
  }, { userId: user?.id ?? null });
  return id;
}

export async function duplicateDeck(user: SignedInUser | null, sourceId: string, title?: string) {
  const row = await deckRow(sourceId);
  if (!row || !canView(row, user)) throw new EditError(`No deck called "${sourceId}".`);
  const name = title?.trim() || `${row.title} (copy)`;
  const id = await newDeckId();
  await copyDeck(sourceId, { id, title: name }, { userId: user?.id ?? null });
  return id;
}

/** Where slides go when no position is given: at the end, but before a closing slide that ends the deck. */
async function endOf(slides: SeedSlide[]) {
  const last = slides[slides.length - 1];
  if (!last) return 0;
  const [r] = await resolveSlides([last], lookup);
  return r?.pattern === "closing" ? slides.length - 1 : slides.length;
}

export async function addSlide(user: SignedInUser | null, deckId: string, input: SlideInput, position?: number, via: Via = "claude") {
  await editable(deckId, user);
  const { slides } = await working(deckId);
  const slide = await toSlide(input);
  const r = await validate(slide);
  const at = position ? Math.max(0, Math.min(slides.length, position - 1)) : await endOf(slides);
  slides.splice(at, 0, slide);
  await save(deckId, slides, user, editNote(via));
  return { slideId: slide.id, overflow: r.overflow };
}

export async function updateSlide(
  user: SignedInUser | null, deckId: string, slideId: string, props: Record<string, unknown>, pattern?: string, via: Via = "claude",
) {
  await editable(deckId, user);
  const { slides } = await working(deckId);
  const i = indexOf(slides, slideId);
  const current = slides[i];
  const wasRef = isRef(current);
  const base = wasRef ? (await resolveSlides([current], lookup))[0] : (current as SlideData);
  const { ref: _ref, ...rest } = base; // eslint-disable-line @typescript-eslint/no-unused-vars
  const next: SlideData = { ...rest, id: slideId, pattern: pattern ?? base.pattern, props };
  if (pattern && !patterns[pattern]) throw new EditError(`Unknown pattern "${pattern}". Use list_patterns.`);
  const r = await validate(next);
  slides[i] = next;
  await save(deckId, slides, user, editNote(via));
  return { overflow: r.overflow, overridden: wasRef ? (current as { ref: string }).ref : null };
}

export async function removeSlide(user: SignedInUser | null, deckId: string, slideId: string, via: Via = "claude") {
  await editable(deckId, user);
  const { slides } = await working(deckId);
  slides.splice(indexOf(slides, slideId), 1);
  if (!slides.length) throw new EditError("That would leave the deck empty.");
  await save(deckId, slides, user, editNote(via));
}

export async function moveSlide(user: SignedInUser | null, deckId: string, slideId: string, position: number, via: Via = "claude") {
  await editable(deckId, user);
  const { slides } = await working(deckId);
  const [s] = slides.splice(indexOf(slides, slideId), 1);
  slides.splice(Math.max(0, Math.min(slides.length, position - 1)), 0, s);
  await save(deckId, slides, user, editNote(via));
}

export async function setHidden(user: SignedInUser | null, deckId: string, slideId: string, hidden: boolean, via: Via = "claude") {
  await editable(deckId, user);
  const { slides } = await working(deckId);
  const i = indexOf(slides, slideId);
  const s = { ...slides[i] } as SeedSlide & { hidden?: boolean };
  if (hidden) s.hidden = true; else delete s.hidden;
  slides[i] = s;
  await save(deckId, slides, user, editNote(via));
}

export async function publish(user: SignedInUser | null, deckId: string, note?: string) {
  await editable(deckId, user);
  const { draft } = await getDeckVersions(deckId);
  if (!draft) throw new EditError("Nothing to publish: there are no unpublished changes.");
  const checks = await checkSlides(draft.slides);
  const broken = checks.filter((c) => c.renderError);
  if (broken.length) throw new EditError(`Can't publish: ${broken.length} slide(s) don't render (${broken.map((b) => b.slide.id).join(", ")}).`);
  if (note) await saveDraft(deckId, draft.slides, { userId: user?.id ?? null, note });
  return publishDraft(deckId, { userId: user?.id ?? null });
}

/** Add several approved blocks at once (the app's slide picker). position is 1-based; default: end. */
export async function addBlocks(user: SignedInUser | null, deckId: string, blocks: string[], position?: number, via: Via = "app") {
  if (!blocks.length) throw new EditError("Pick at least one slide.");
  await editable(deckId, user);
  const { slides } = await working(deckId);
  const added: SeedSlide[] = [];
  for (const b of blocks) added.push(await toSlide({ block: b }));
  const at = position ? Math.max(0, Math.min(slides.length, position - 1)) : await endOf(slides);
  slides.splice(at, 0, ...added);
  await save(deckId, slides, user, editNote(via));
  return added.map((s) => s.id);
}

/** Throw away unpublished changes. */
export async function discardDraft(user: SignedInUser | null, deckId: string) {
  await editable(deckId, user);
  const { draft } = await getDeckVersions(deckId);
  if (!draft) throw new EditError("There are no unpublished changes.");
  await db().delete(deckVersions).where(eq(deckVersions.id, draft.id));
}

/** Every version of a deck, newest first, with who made / published it. */
export async function listVersions(user: SignedInUser | null, deckId: string) {
  const row = await deckRow(deckId);
  if (!row || !canView(row, user)) throw new EditError(`No deck called "${deckId}".`);
  const editors = alias(users, "editors");
  const publishers = alias(users, "publishers");
  return db().select({
      number: deckVersions.number, status: deckVersions.status, note: deckVersions.note,
      createdAt: deckVersions.createdAt, publishedAt: deckVersions.publishedAt,
      slideCount: sql<number>`jsonb_array_length(${deckVersions.slides})`.mapWith(Number),
      themeId: deckVersions.themeId,
      createdBy: sql<string | null>`coalesce(nullif(${editors.name}, ''), ${editors.email})`,
      publishedBy: sql<string | null>`coalesce(nullif(${publishers.name}, ''), ${publishers.email})`,
    })
    .from(deckVersions)
    .leftJoin(editors, eq(editors.id, deckVersions.createdBy))
    .leftJoin(publishers, eq(publishers.id, deckVersions.publishedBy))
    .where(eq(deckVersions.deckId, deckId))
    .orderBy(desc(deckVersions.number));
}

/** One version's slides, references resolved (for previewing history). */
export async function versionSlides(user: SignedInUser | null, deckId: string, number: number) {
  const row = await deckRow(deckId);
  if (!row || !canView(row, user)) throw new EditError(`No deck called "${deckId}".`);
  const [v] = await db().select().from(deckVersions)
    .where(and(eq(deckVersions.deckId, deckId), eq(deckVersions.number, number))).limit(1);
  if (!v) throw new EditError(`No version ${number}.`);
  return { version: v, slides: await resolveSlides(v.slides, lookup) };
}

/** Bring an old version back as the draft, to review and publish. */
export async function restoreVersion(user: SignedInUser | null, deckId: string, number: number) {
  await editable(deckId, user);
  const { version } = await versionSlides(user, deckId, number);
  await saveDraft(deckId, version.slides, { userId: user?.id ?? null, note: `Restored v${number}`, themeId: version.themeId ?? null });
}

/** Switch the deck's theme (saved to the draft, like any edit). null = the default theme. */
export async function setDeckTheme(user: SignedInUser | null, deckId: string, themeId: string | null, via: Via = "app") {
  await editable(deckId, user);
  const all = await publishedThemes();
  if (themeId && !all.some((t) => t.id === themeId)) throw new EditError(`No theme "${themeId}". Themes: ${all.map((t) => t.id).join(", ")}.`);
  const { slides } = await working(deckId);
  const id = themeId === DEFAULT_THEME_ID ? null : themeId;
  await saveDraft(deckId, slides, { userId: user?.id ?? null, note: `Theme: ${pickTheme(all, id).name}${via === "claude" ? " (with Claude)" : ""}`, themeId: id });
}

/**
 * Replace the whole draft at once (the editor's undo/redo): slides in order plus the theme.
 * Every slide is checked like any other edit: approved references must point at a company deck's slide,
 * own slides must use a known pattern and render.
 */
export async function replaceDraft(user: SignedInUser | null, deckId: string, slides: SeedSlide[], themeId: string | null) {
  await editable(deckId, user);
  if (!Array.isArray(slides) || !slides.length) throw new EditError("A deck needs at least one slide.");
  const ids = new Set<string>();
  for (const s of slides) {
    if (!s || typeof s.id !== "string" || !s.id || ids.has(s.id)) throw new EditError("Every slide needs its own id.");
    ids.add(s.id);
    if (isRef(s)) {
      const [masterId, slideId] = s.ref.split("/");
      const master = await deckRow(masterId);
      if (!master || master.kind !== "master" || !(await lookup(masterId))?.some((x) => x.id === slideId)) {
        throw new EditError(`"${s.ref}" isn't an approved slide.`);
      }
    } else if (!patterns[(s as SlideData).pattern]) throw new EditError(`Unknown pattern "${(s as SlideData).pattern}".`);
  }
  const broken = (await checkSlides(slides)).filter((c) => c.renderError);
  if (broken.length) throw new EditError(`${broken.length} slide(s) don't render.`);
  const all = await publishedThemes();
  const theme = themeId === DEFAULT_THEME_ID ? null : themeId;
  if (theme && !all.some((t) => t.id === theme)) throw new EditError(`No theme "${theme}".`);
  await saveDraft(deckId, slides, { userId: user?.id ?? null, note: editNote("app"), themeId: theme });
}

/* ---------- translations (see src/deck/i18n.ts) ---------- */

/**
 * The deck's translatable text, slide by slide, with each slide's translation status per language.
 * Slides that follow a master are reported with the master they belong to: translate them there.
 */
export async function deckText(user: SignedInUser | null, deckId: string, lang: TargetLang, only: "all" | "outdated" = "outdated") {
  const row = await deckRow(deckId);
  if (!row || !canView(row, user)) throw new EditError(`No deck called "${deckId}".`);
  const { draft, published } = await getDeckVersions(deckId);
  const v = (canEdit(row, user) && draft) || published;
  if (!v) throw new EditError(`Deck "${deckId}" has no content yet.`);
  const resolved = await resolveSlides(v.slides, lookup);
  let n = 0;
  return resolved.map((slide) => {
    const number = slide.hidden ? null : ++n;
    const state = translationState(slide, lang);
    const entries = textEntries(slide.props);
    const include = only === "all" || state !== "fresh";
    return {
      number, id: slide.id, pattern: slide.pattern, ...(slide.hidden ? { hidden: true } : {}),
      status: state === "fresh" ? "translated" : state === "stale" ? "english changed since translation" : "not translated",
      ...(slide.ref ? { followsMaster: slide.ref, translateIn: slide.ref.split("/")[0] } : {}),
      ...(include && !slide.ref ? { text: Object.fromEntries(entries.map((e) => [e.path, e.text])) } : {}),
      ...(include && state === "stale" && !slide.ref ? { current: slide.i18n?.[lang]?.props } : {}),
    };
  });
}

export interface TranslationInput { slide_id: string; text: Record<string, string> }

/**
 * Stores translations on the deck's own slides (draft). Each slide's overlay is fingerprinted against the
 * English it was made from. Slides that follow a master can't be translated here: translate the master.
 */
export async function setTranslation(user: SignedInUser | null, deckId: string, lang: TargetLang, inputs: TranslationInput[]) {
  await editable(deckId, user);
  const { slides } = await working(deckId);
  const results: { slide_id: string; translated: number; skipped?: string[]; overflow?: OverflowWarning[] }[] = [];
  for (const input of inputs) {
    const i = indexOf(slides, input.slide_id);
    const current = slides[i];
    if (isRef(current)) {
      throw new EditError(`Slide "${input.slide_id}" follows the master slide ${current.ref}; translate that deck (${current.ref.split("/")[0]}) and every deck using it is translated too.`);
    }
    const slide = current as SlideData;
    const known = new Set(textEntries(slide.props).map((e) => e.path));
    const skipped = Object.keys(input.text).filter((k) => !known.has(k));
    const overlay = overlayFromEntries(slide.props, input.text);
    const translated = textEntries(overlay).length;
    if (!translated) throw new EditError(`No translatable text for slide "${input.slide_id}". Paths must match get_deck_text, e.g. "cards[0].title".`);
    const next = withTranslation(slide, lang, overlay);
    slides[i] = next;
    const overflow = checkOverflow(next, lang);
    results.push({ slide_id: input.slide_id, translated, ...(skipped.length ? { skipped } : {}), ...(overflow.length ? { overflow } : {}) });
  }
  await save(deckId, slides, user, `Translated to ${LANGUAGES[lang].english} with Claude`);
  return results;
}

/** Rename a deck. Applies straight away (titles aren't versioned); share links keep the title they were made with. */
export async function renameDeck(user: SignedInUser | null, deckId: string, title: string) {
  await editable(deckId, user);
  const name = title.trim().replace(/\s+/g, " ");
  if (!name) throw new EditError("A deck needs a name.");
  if (name.length > 80) throw new EditError("Keep the name under 80 characters.");
  await db().update(decks).set({ title: name, updatedAt: new Date() }).where(eq(decks.id, deckId));
  return name;
}

/**
 * Archive (or bring back) one of your own decks. Archived decks drop out of My Decks, the Claude connector's
 * list and the "Add to" pickers, but nothing is lost: the deck still opens by its link, share links keep
 * working, and history and analytics stay. Company masters can't be archived.
 */
export async function setArchived(user: SignedInUser | null, deckId: string, archived: boolean) {
  const row = await editable(deckId, user);
  if (row.kind === "master") throw new EditError("Company decks can't be archived.");
  await db().update(decks).set({ archivedAt: archived ? new Date() : null }).where(eq(decks.id, deckId));
}

/** A new deck id: "dk-" + 8 hex characters. The same shape for every deck, and never changed (promoting a deck keeps it). */
export async function newDeckId() {
  for (let i = 0; i < 5; i++) {
    const id = `dk-${randomBytes(4).toString("hex")}`;
    if (!(await deckRow(id))) return id;
  }
  throw new EditError("Couldn't pick a deck id. Try again.");
}
