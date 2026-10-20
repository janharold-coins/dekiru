/**
 * Editing decks: who may change what, and slide-level operations on a deck's draft.
 * Used by the Claude connector (src/app/api/mcp) and the app's Publish / Make a copy buttons.
 *
 * Rules
 * - Masters (company decks): admins and managers edit; everyone can copy.
 * - Copies: only the owner edits (admins can see them).
 * - Every edit lands in the deck's draft; nothing is visible to others until published.
 * - Approved content (blocks) = slides of the master decks, inserted as references ("sales/s04")
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
import { patterns } from "@/deck/registry";
import type { SlideData } from "@/deck/types";
import { copyDeck, createDeck, getDeckVersions, publishDraft, saveDraft } from "./decks";
import type { SignedInUser } from "./auth";
import { canEdit, canView, deckRow } from "./access";
import { pickTheme, publishedThemes } from "./themes";
import { DEFAULT_THEME_ID } from "@/deck/theme";

export { canEdit, canView, deckRow };

export class EditError extends Error {}

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
    if (!master || master.kind !== "master") throw new EditError(`"${input.block}" isn't an approved block. Blocks are master slides like "sales/s04" (see get_deck on a master).`);
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

export async function newDeck(user: SignedInUser | null, title: string, inputs: SlideInput[], via: Via = "claude") {
  if (!inputs.length) throw new EditError("A deck needs at least one slide.");
  const slides: SeedSlide[] = [];
  for (const i of inputs) { const s = await toSlide(i); await validate(s); slides.push(s); }
  const id = deckSlug(title);
  await createDeck({ id, title: title.trim(), kind: "copy", slides, note: via === "claude" ? "Created with Claude" : "Created in Dekiru" }, { userId: user?.id ?? null });
  return id;
}

export async function duplicateDeck(user: SignedInUser | null, sourceId: string, title?: string) {
  const row = await deckRow(sourceId);
  if (!row || !canView(row, user)) throw new EditError(`No deck called "${sourceId}".`);
  const name = title?.trim() || `${row.title} (copy)`;
  const id = deckSlug(name);
  await copyDeck(sourceId, { id, title: name }, { userId: user?.id ?? null });
  return id;
}

export async function addSlide(user: SignedInUser | null, deckId: string, input: SlideInput, position?: number, via: Via = "claude") {
  await editable(deckId, user);
  const { slides } = await working(deckId);
  const slide = await toSlide(input);
  const r = await validate(slide);
  const at = position ? Math.max(0, Math.min(slides.length, position - 1)) : slides.length;
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
  const at = position ? Math.max(0, Math.min(slides.length, position - 1)) : slides.length;
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

/** Rename a deck. Applies straight away (titles aren't versioned); share links keep the title they were made with. */
export async function renameDeck(user: SignedInUser | null, deckId: string, title: string) {
  await editable(deckId, user);
  const name = title.trim().replace(/\s+/g, " ");
  if (!name) throw new EditError("A deck needs a name.");
  if (name.length > 80) throw new EditError("Keep the name under 80 characters.");
  await db().update(decks).set({ title: name, updatedAt: new Date() }).where(eq(decks.id, deckId));
  return name;
}

/** URL-safe id from a title, with a short random suffix so copies never collide. */
export function deckSlug(title: string) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 40) || "deck";
  return `${base}-${randomBytes(2).toString("hex")}`;
}
