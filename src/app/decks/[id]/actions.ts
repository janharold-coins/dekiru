"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  addBlocks, duplicateDeck, EditError, restoreVersion, setDeckTheme,
} from "@/lib/editing";

export async function copyAction(deckId: string) {
  const user = await requireUser(`/decks/${deckId}`);
  const id = await duplicateDeck(user, deckId);
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

/** Switch the deck's theme (draft), then back to the deck to review and publish. */
export async function themeAction(deckId: string, themeId: string) {
  const r = await attempt(deckId, (u) => setDeckTheme(u, deckId, themeId, "app"));
  if (r.error) redirect(`/decks/${deckId}/theme?error=${encodeURIComponent(r.error)}`);
  redirect(`/decks/${deckId}`);
}
