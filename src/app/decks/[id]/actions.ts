"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { duplicateDeck, EditError, publish } from "@/lib/editing";

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
