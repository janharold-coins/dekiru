"use server";
/**
 * Actions for the deck editor. The editor keeps its own state while open, so these persist without
 * re-rendering the editor; other pages are rendered per request and pick the changes up.
 */
import { revalidatePath } from "next/cache";
import type { OverflowWarning } from "@/deck/overflow";
import { requireUser } from "@/lib/auth";
import {
  discardDraft, EditError, moveSlide, publish, removeSlide, renameDeck, setDeckTheme, setHidden, updateSlide,
} from "@/lib/editing";

export type EditorResult = { error?: string };
const message = (e: unknown) => (e instanceof EditError ? e.message : (e as Error).message);

async function run<T>(deckId: string, fn: (u: Awaited<ReturnType<typeof requireUser>>) => Promise<T>): Promise<{ error?: string; value?: T }> {
  const user = await requireUser(`/decks/${deckId}`);
  try { return { value: await fn(user) }; } catch (e) { return { error: message(e) }; }
}

/** Autosave of one slide's content (to the draft). */
export async function saveSlideAction(deckId: string, slideId: string, props: Record<string, unknown>) {
  const r = await run(deckId, (u) => updateSlide(u, deckId, slideId, props, undefined, "app"));
  return { error: r.error, overflow: (r.value?.overflow ?? []) as OverflowWarning[], unlinked: Boolean(r.value?.overridden) };
}

export async function moveSlideAction(deckId: string, slideId: string, position: number): Promise<EditorResult> {
  return run(deckId, (u) => moveSlide(u, deckId, slideId, position, "app"));
}
export async function hideSlideAction(deckId: string, slideId: string, hidden: boolean): Promise<EditorResult> {
  return run(deckId, (u) => setHidden(u, deckId, slideId, hidden, "app"));
}
export async function removeSlideAction(deckId: string, slideId: string): Promise<EditorResult> {
  return run(deckId, (u) => removeSlide(u, deckId, slideId, "app"));
}
export async function renameDeckAction(deckId: string, title: string) {
  const r = await run(deckId, (u) => renameDeck(u, deckId, title));
  revalidatePath("/");
  return { error: r.error, title: r.value };
}
export async function setThemeAction(deckId: string, themeId: string): Promise<EditorResult> {
  return run(deckId, (u) => setDeckTheme(u, deckId, themeId, "app"));
}
export async function publishDeckAction(deckId: string) {
  const r = await run(deckId, (u) => publish(u, deckId));
  revalidatePath(`/decks/${deckId}`);
  return { error: r.error, version: r.value?.number };
}
export async function discardDraftAction(deckId: string): Promise<EditorResult> {
  const r = await run(deckId, (u) => discardDraft(u, deckId));
  revalidatePath(`/decks/${deckId}`);
  return r;
}
