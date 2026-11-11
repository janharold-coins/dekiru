"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  addBlocks, duplicateDeck, EditError, restoreVersion, setArchived, setDeckPreset, setDeckTheme,
} from "@/lib/editing";
import type { PresetKind } from "@/deck/presets";

/** Make a copy. It starts in English only unless the person chose to keep the source's translations. */
export async function copyAction(deckId: string, keepTranslations = false) {
  const user = await requireUser(`/decks/${deckId}`);
  const id = await duplicateDeck(user, deckId, undefined, keepTranslations);
  redirect(`/decks/${id}`);
}

/* ---------- in-app editing (edit page, slide picker, history) ---------- */

export type Result = { error?: string };
const message = (e: unknown) => (e instanceof EditError ? e.message : (e as Error).message);

function refresh(deckId: string) {
  for (const p of ["", "/history", "/present"]) revalidatePath(`/decks/${deckId}${p}`);
  revalidatePath("/");
}

async function attempt(deckId: string, fn: (user: Awaited<ReturnType<typeof requireUser>>) => Promise<unknown>): Promise<Result> {
  const user = await requireUser(`/decks/${deckId}`);
  try { await fn(user); } catch (e) { return { error: message(e) }; }
  refresh(deckId);
  return {};
}

export async function restoreAction(deckId: string, number: number) {
  const r = await attempt(deckId, (u) => restoreVersion(u, deckId, number));
  if (!r.error) redirect(`/decks/${deckId}`);
  return r;
}
export async function addBlocksAction(deckId: string, blocks: string[], position?: number) {
  const r = await attempt(deckId, (u) => addBlocks(u, deckId, blocks, position, "app"));
  if (!r.error) redirect(`/decks/${deckId}`);
  return r;
}

/** Archive or unarchive one of your own decks (home page, My Decks). */
export async function archiveAction(deckId: string, archived: boolean) {
  return attempt(deckId, (u) => setArchived(u, deckId, archived));
}

/** Switch the deck's theme (draft), then back to the deck to review and publish. */
export async function themeAction(deckId: string, themeId: string) {
  const r = await attempt(deckId, (u) => setDeckTheme(u, deckId, themeId, "app"));
  if (r.error) redirect(`/decks/${deckId}/theme?error=${encodeURIComponent(r.error)}`);
  redirect(`/decks/${deckId}`);
}

/** Apply a typography or colour preset on top of the deck's theme (draft), or go back to the theme's own (null). */
export async function presetAction(deckId: string, kind: PresetKind, presetId: string | null) {
  const r = await attempt(deckId, (u) => setDeckPreset(u, deckId, kind, presetId, "app"));
  const back = `/decks/${deckId}/theme`;
  redirect(r.error ? `${back}?error=${encodeURIComponent(r.error)}` : `${back}#${kind}`);
}
