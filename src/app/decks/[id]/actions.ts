"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  addBlocks, discardDraft, duplicateDeck, EditError, moveSlide, publish, removeSlide, restoreVersion, setHidden,
} from "@/lib/editing";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function publishAction(deckId: string, _prev: { error?: string }, _form: FormData): Promise<{ error?: string }> {
  const user = await requireUser(`/decks/${deckId}`);
  try { await publish(user, deckId); }
  catch (e) { return { error: e instanceof EditError ? e.message : (e as Error).message }; }
  revalidatePath(`/decks/${deckId}`);
  return {};
}

export async function copyAction(deckId: string) {
  const user = await requireUser(`/decks/${deckId}`);
  const id = await duplicateDeck(user, deckId);
  redirect(`/decks/${id}`);
}

/* ---------- in-app editing (edit page, slide picker, history) ---------- */

export type Result = { error?: string };
const message = (e: unknown) => (e instanceof EditError ? e.message : (e as Error).message);

function refresh(deckId: string) {
  for (const p of ["", "/edit", "/history", "/present"]) revalidatePath(`/decks/${deckId}${p}`);
  revalidatePath("/");
}

async function attempt(deckId: string, fn: (user: Awaited<ReturnType<typeof requireUser>>) => Promise<unknown>): Promise<Result> {
  const user = await requireUser(`/decks/${deckId}/edit`);
  try { await fn(user); } catch (e) { return { error: message(e) }; }
  refresh(deckId);
  return {};
}

export async function moveAction(deckId: string, slideId: string, position: number) {
  return attempt(deckId, (u) => moveSlide(u, deckId, slideId, position, "app"));
}
export async function hideAction(deckId: string, slideId: string, hidden: boolean) {
  return attempt(deckId, (u) => setHidden(u, deckId, slideId, hidden, "app"));
}
export async function removeAction(deckId: string, slideId: string) {
  return attempt(deckId, (u) => removeSlide(u, deckId, slideId, "app"));
}
export async function discardAction(deckId: string) {
  return attempt(deckId, (u) => discardDraft(u, deckId));
}
export async function restoreAction(deckId: string, number: number) {
  const r = await attempt(deckId, (u) => restoreVersion(u, deckId, number));
  if (!r.error) redirect(`/decks/${deckId}`);
  return r;
}
export async function addBlocksAction(deckId: string, blocks: string[], position?: number) {
  const r = await attempt(deckId, (u) => addBlocks(u, deckId, blocks, position, "app"));
  if (!r.error) redirect(`/decks/${deckId}/edit`);
  return r;
}
