/**
 * Dekiru's tools for Claude (the "Dekiru" custom connector). Every call acts as the signed-in person:
 * they see company masters plus their own decks, edit only what they're allowed to, and every edit
 * lands in a draft until published.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/server";
import { templates } from "@/content/templates";
import { patterns } from "@/deck/registry";
import type { SlideData } from "@/deck/types";
import { appBaseURL, type SignedInUser } from "./auth";
import { getDeck, listDecks } from "./decks";
import { publishedThemes } from "./themes";
import {
  addSlide, canEdit, canView, checkSlides, deckRow, duplicateDeck, EditError, moveSlide, newDeck, publish,
  removeSlide, setDeckTheme, setHidden, updateSlide, type SlideInput,
} from "./editing";

export const INSTRUCTIONS = `Dekiru builds Coins.ph sales decks from an approved design system. Slides are data: each slide is a
pattern (a fixed layout from the library) plus props (its content). You never write HTML or CSS.

How to work
1. Start from what exists. list_decks, then get_deck on a company master (e.g. "sales", "ramp") to see approved slides.
   Reuse approved slides as blocks ("sales/s04") instead of rewriting them: they stay correct when the master changes.
2. Make changes in the person's own deck: copy_deck (start from a master) or create_deck (pick blocks + new slides).
   Company masters can only be changed by admins and managers.
3. For a new slide, call get_pattern first and follow its example props exactly. Omit "figma" keys (pixel overrides).
4. Work one slide at a time. After each change, read the overflow warnings: if text is over budget, suggest a
   shorter phrasing that keeps the meaning; if it can't fit, propose a different pattern. Never shrink text.
5. Never invent figures, rates, corridors or claims. Take them from the masters or from what the person gives you.
   If a number is missing, ask.
6. Share the preview link so the person can review. Publish only when they say so.`;

const ok = (data: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(data, null, 1) }] });
const fail = (message: string) => ({ content: [{ type: "text" as const, text: message }], isError: true });

async function run(fn: () => Promise<unknown>) {
  try { return ok(await fn()); }
  catch (e) { return e instanceof EditError ? fail(e.message) : fail(`Something went wrong: ${(e as Error).message}`); }
}

const deckUrl = (id: string) => `${appBaseURL()}/decks/${id}`;

/** Drop pixel-exact Figma overrides from props shown to Claude as examples. */
function cleanProps(props: Record<string, unknown>) {
  const { figma: _figma, ...rest } = props; // eslint-disable-line @typescript-eslint/no-unused-vars
  return rest;
}

const slideInput = z.union([
  z.object({ block: z.string().describe('An approved master slide, "deck/slideId", e.g. "sales/s04".') }),
  z.object({
    pattern: z.string().describe("Pattern id from list_patterns."),
    props: z.record(z.string(), z.unknown()).describe("Slide content. Shape must match get_pattern's example."),
    hidden: z.boolean().optional(),
  }),
]);

export function registerTools(server: McpServer, user: SignedInUser) {
  server.registerTool("list_decks", {
    title: "List decks",
    description: "Company master decks plus the person's own decks: id, title, slide count, whether they can edit it, and links.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
  }, async () => run(async () => {
    const decks = await listDecks({ viewerId: user.id });
    return decks.map((d) => ({
      id: d.id, title: d.title, kind: d.kind === "master" ? "company master" : "own deck",
      slides: d.slides.filter((s) => !s.hidden).length, version: d.version, unpublishedChanges: d.hasDraft,
      canEdit: d.kind === "master" ? user.role !== "member" : d.ownerId === user.id,
      url: deckUrl(d.id),
    }));
  }));

  server.registerTool("get_deck", {
    title: "Get a deck",
    description: "All slides of a deck in order, with slide ids, pattern, props (content) and overflow warnings. "
      + "Shows the draft if the person can edit and there are unpublished changes. Slides of a company master can be reused as blocks: \"<deckId>/<slideId>\".",
    inputSchema: z.object({ deck_id: z.string() }),
    annotations: { readOnlyHint: true },
  }, async ({ deck_id }) => run(async () => {
    const row = await deckRow(deck_id);
    if (!row || !canView(row, user)) throw new EditError(`No deck called "${deck_id}".`);
    const editable = canEdit(row, user);
    const deck = await getDeck(deck_id, { draft: editable });
    if (!deck) throw new EditError(`Deck "${deck_id}" has no content yet.`);
    const checks = await checkSlides(deck.slides);
    let n = 0;
    return {
      id: deck.id, title: deck.title, kind: deck.kind, version: deck.version,
      showing: deck.status === "draft" ? "unpublished draft" : "published", canEdit: editable, url: deckUrl(deck.id),
      theme: { id: deck.theme.id, name: deck.theme.name },
      slides: checks.map(({ slide, overflow, renderError }) => ({
        number: slide.hidden ? null : ++n, id: slide.id, pattern: slide.pattern,
        ...(slide.hidden ? { hidden: true } : {}),
        ...(slide.ref ? { followsMaster: slide.ref } : {}),
        ...(deck.kind === "master" ? { block: `${deck.id}/${slide.id}` } : {}),
        props: cleanProps(slide.props as Record<string, unknown>),
        ...(overflow.length ? { overflow } : {}),
        ...(renderError ? { renderError } : {}),
      })),
    };
  }));

  server.registerTool("list_patterns", {
    title: "List slide patterns",
    description: "The layouts slides can use: id, name, what it's for, and text budgets (when Dekiru flags overflow).",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
  }, async () => run(async () => Object.entries(patterns).map(([id, { meta }]) => ({
    id, name: meta.name, shape: meta.shape, use: meta.description, budgets: meta.budgets ?? [],
  }))));

  server.registerTool("get_pattern", {
    title: "Get a pattern",
    description: "A pattern's purpose, budgets and real example props from the company masters. Read this before creating or rewriting a slide with this pattern.",
    inputSchema: z.object({ pattern_id: z.string() }),
    annotations: { readOnlyHint: true },
  }, async ({ pattern_id }) => run(async () => {
    const entry = patterns[pattern_id];
    if (!entry) throw new EditError(`Unknown pattern "${pattern_id}". Use list_patterns.`);
    const masters = (await listDecks({ viewerId: user.id })).filter((d) => d.kind === "master");
    const examples: { block: string; props: Record<string, unknown> }[] = [];
    for (const d of masters) for (const s of d.slides as SlideData[]) {
      if (s.pattern === pattern_id && !s.ref && examples.length < 2 && !examples.some((e) => e.block.endsWith(`/${s.id}`))) {
        examples.push({ block: `${d.id}/${s.id}`, props: cleanProps(s.props as Record<string, unknown>) });
      }
    }
    return {
      id: pattern_id, name: entry.meta.name, use: entry.meta.description, budgets: entry.meta.budgets ?? [],
      templates: templates.filter((t) => t.slide.pattern === pattern_id).map((t) => ({ name: t.name, use: t.use, props: cleanProps(t.slide.props as Record<string, unknown>) })),
      notes: "Copy the example's shape (templates show the same shape with placeholder words). Line breaks are \\n. Image paths must be existing /figma/... assets for now (uploads come later).",
      examples,
    };
  }));

  server.registerTool("copy_deck", {
    title: "Copy a deck",
    description: "Make the person's own copy of a deck (usually a company master) to edit freely. Returns the new deck id.",
    inputSchema: z.object({ source_deck_id: z.string(), title: z.string().optional().describe("e.g. \"Sales deck — Acme Remit\"") }),
  }, async ({ source_deck_id, title }) => run(async () => {
    const id = await duplicateDeck(user, source_deck_id, title);
    return { deckId: id, url: deckUrl(id), next: "Edit slides with update_slide / add_slide / remove_slide, then publish_deck when the person approves." };
  }));

  server.registerTool("create_deck", {
    title: "Create a deck",
    description: "Create a new deck owned by the person from approved blocks and/or new slides, in order. A title slide (cover pattern, with the deck title) is added first and the approved closing slide last, unless the slides already include a cover or closing; edit the cover with update_slide.",
    inputSchema: z.object({ title: z.string(), slides: z.array(slideInput).min(1) }),
  }, async ({ title, slides }) => run(async () => {
    const id = await newDeck(user, title, slides as SlideInput[]);
    return { deckId: id, url: deckUrl(id), note: "Created and published as v1 of the person's own deck. Further edits are drafts." };
  }));

  server.registerTool("add_slide", {
    title: "Add a slide",
    description: "Insert an approved block or a new slide. position is the 1-based place in the deck (default: the end, just before the closing slide).",
    inputSchema: z.object({ deck_id: z.string(), slide: slideInput, position: z.number().int().min(1).optional() }),
  }, async ({ deck_id, slide, position }) => run(async () => {
    const r = await addSlide(user, deck_id, slide as SlideInput, position);
    return { ...r, saved: "draft", preview: deckUrl(deck_id) };
  }));

  server.registerTool("update_slide", {
    title: "Update a slide",
    description: "Replace a slide's props (send the complete props object, not a diff). Optionally switch pattern. "
      + "If the slide follows a master block, it becomes this deck's own slide and stops following the master.",
    inputSchema: z.object({
      deck_id: z.string(), slide_id: z.string(),
      props: z.record(z.string(), z.unknown()), pattern: z.string().optional(),
    }),
  }, async ({ deck_id, slide_id, props, pattern }) => run(async () => {
    const r = await updateSlide(user, deck_id, slide_id, props, pattern);
    return {
      saved: "draft", preview: deckUrl(deck_id), overflow: r.overflow,
      ...(r.overridden ? { warning: `This slide no longer follows ${r.overridden}; master updates won't reach it.` } : {}),
    };
  }));

  server.registerTool("remove_slide", {
    title: "Remove a slide",
    description: "Delete a slide from the person's deck (draft).",
    inputSchema: z.object({ deck_id: z.string(), slide_id: z.string() }),
    annotations: { destructiveHint: true },
  }, async ({ deck_id, slide_id }) => run(async () => { await removeSlide(user, deck_id, slide_id); return { saved: "draft", preview: deckUrl(deck_id) }; }));

  server.registerTool("move_slide", {
    title: "Move a slide",
    description: "Move a slide to a 1-based position.",
    inputSchema: z.object({ deck_id: z.string(), slide_id: z.string(), position: z.number().int().min(1) }),
  }, async ({ deck_id, slide_id, position }) => run(async () => { await moveSlide(user, deck_id, slide_id, position); return { saved: "draft", preview: deckUrl(deck_id) }; }));

  server.registerTool("hide_slide", {
    title: "Hide or show a slide",
    description: "Hidden slides stay in the deck but aren't presented or shared.",
    inputSchema: z.object({ deck_id: z.string(), slide_id: z.string(), hidden: z.boolean() }),
  }, async ({ deck_id, slide_id, hidden }) => run(async () => { await setHidden(user, deck_id, slide_id, hidden); return { saved: "draft", preview: deckUrl(deck_id) }; }));

  server.registerTool("list_themes", {
    title: "List themes",
    description: "Looks a deck can use (backgrounds, glow, accent bar). The deck's theme applies to all its slides, approved blocks included.",
    inputSchema: z.object({}),
    annotations: { readOnlyHint: true },
  }, async () => run(async () => (await publishedThemes()).map((t) => ({ id: t.id, name: t.name, version: t.version }))));

  server.registerTool("set_deck_theme", {
    title: "Set a deck's theme",
    description: "Switch the deck's theme (saved to the draft). Only when the person asks for a different look.",
    inputSchema: z.object({ deck_id: z.string(), theme_id: z.string().describe("From list_themes.") }),
  }, async ({ deck_id, theme_id }) => run(async () => {
    await setDeckTheme(user, deck_id, theme_id, "claude");
    return { saved: "draft", preview: deckUrl(deck_id) };
  }));

  server.registerTool("publish_deck", {
    title: "Publish a deck",
    description: "Make the draft the deck's live version. Only when the person asks. Existing share links keep their old version.",
    inputSchema: z.object({ deck_id: z.string(), note: z.string().optional().describe("What changed, one line.") }),
  }, async ({ deck_id, note }) => run(async () => {
    const v = await publish(user, deck_id, note);
    return { published: `v${v.number}`, url: deckUrl(deck_id), present: `${deckUrl(deck_id)}/present`, share: `${deckUrl(deck_id)}/share` };
  }));
}
