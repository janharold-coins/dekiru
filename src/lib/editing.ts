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
import { renderToStaticMarkup } from "react-dom/server.edge";
import { createElement } from "react";
import { isRef, resolveSlides, type SeedSlide } from "@/content/resolve";
import { RenderSlide } from "@/deck/RenderSlide";
import { checkOverflow, type OverflowWarning } from "@/deck/overflow";
import { patterns } from "@/deck/registry";
import type { SlideData } from "@/deck/types";
import { copyDeck, createDeck, getDeckVersions, publishDraft, saveDraft } from "./decks";
import type { SignedInUser } from "./auth";
import { canEdit, canView, deckRow } from "./access";

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
      try { renderToStaticMarkup(createElement(RenderSlide, { slide: s })); }
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
  | { pattern: string; props: Record<string, unknown>; hidden?: boolean };

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
  return { id: newSlideId(), pattern: input.pattern, props: input.props, ...(input.hidden ? { hidden: true } : {}) };
}

function indexOf(slides: SeedSlide[], slideId: string) {
  const i = slides.findIndex((s) => s.id === slideId);
  if (i < 0) throw new EditError(`No slide "${slideId}" in this deck. get_deck lists slide ids.`);
  return i;
}

/* ---------- operations ---------- */

export async function newDeck(user: SignedInUser | null, title: string, inputs: SlideInput[]) {
  if (!inputs.length) throw new EditError("A deck needs at least one slide.");
  const slides: SeedSlide[] = [];
  for (const i of inputs) { const s = await toSlide(i); await validate(s); slides.push(s); }
  const id = deckSlug(title);
  await createDeck({ id, title: title.trim(), kind: "copy", slides, note: "Created with Claude" }, { userId: user?.id ?? null });
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

export async function addSlide(user: SignedInUser | null, deckId: string, input: SlideInput, position?: number) {
  await editable(deckId, user);
  const { slides } = await working(deckId);
  const slide = await toSlide(input);
  const r = await validate(slide);
  const at = position ? Math.max(0, Math.min(slides.length, position - 1)) : slides.length;
  slides.splice(at, 0, slide);
  await save(deckId, slides, user, "Edited with Claude");
  return { slideId: slide.id, overflow: r.overflow };
}

export async function updateSlide(user: SignedInUser | null, deckId: string, slideId: string, props: Record<string, unknown>, pattern?: string) {
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
  await save(deckId, slides, user, "Edited with Claude");
  return { overflow: r.overflow, overridden: wasRef ? (current as { ref: string }).ref : null };
}

export async function removeSlide(user: SignedInUser | null, deckId: string, slideId: string) {
  await editable(deckId, user);
  const { slides } = await working(deckId);
  slides.splice(indexOf(slides, slideId), 1);
  if (!slides.length) throw new EditError("That would leave the deck empty.");
  await save(deckId, slides, user, "Edited with Claude");
}

export async function moveSlide(user: SignedInUser | null, deckId: string, slideId: string, position: number) {
  await editable(deckId, user);
  const { slides } = await working(deckId);
  const [s] = slides.splice(indexOf(slides, slideId), 1);
  slides.splice(Math.max(0, Math.min(slides.length, position - 1)), 0, s);
  await save(deckId, slides, user, "Edited with Claude");
}

export async function setHidden(user: SignedInUser | null, deckId: string, slideId: string, hidden: boolean) {
  await editable(deckId, user);
  const { slides } = await working(deckId);
  const i = indexOf(slides, slideId);
  const s = { ...slides[i] } as SeedSlide & { hidden?: boolean };
  if (hidden) s.hidden = true; else delete s.hidden;
  slides[i] = s;
  await save(deckId, slides, user, "Edited with Claude");
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

/** URL-safe id from a title, with a short random suffix so copies never collide. */
export function deckSlug(title: string) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 40) || "deck";
  return `${base}-${randomBytes(2).toString("hex")}`;
}
