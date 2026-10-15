"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ThemeTokens } from "@/deck/theme";
import { requireUser } from "@/lib/auth";
import {
  archiveTheme, createTheme, discardThemeDraft, publishTheme, restoreThemeVersion, saveThemeDraft, ThemeError,
} from "@/lib/themes";

export type Result = { error?: string; ok?: string };
const message = (e: unknown) => (e instanceof ThemeError ? e.message : (e as Error).message);

function refresh(id?: string) {
  revalidatePath("/library/themes");
  if (id) revalidatePath(`/library/themes/${id}`);
  revalidatePath("/", "layout"); // decks using the theme
}

export async function saveThemeAction(id: string, tokens: ThemeTokens, name: string): Promise<Result> {
  const user = await requireUser(`/library/themes/${id}`);
  try { await saveThemeDraft(user, id, { tokens, name }); } catch (e) { return { error: message(e) }; }
  refresh(id);
  return { ok: "Saved as a draft. Decks still use the live version until you publish." };
}

export async function publishThemeAction(id: string, tokens: ThemeTokens, name: string): Promise<Result> {
  const user = await requireUser(`/library/themes/${id}`);
  try {
    await saveThemeDraft(user, id, { tokens, name });
    const n = await publishTheme(user, id);
    refresh(id);
    return { ok: `Published v${n}. Every deck using this theme now shows it; links already sent keep their look.` };
  } catch (e) { return { error: message(e) }; }
}

export async function discardThemeAction(id: string): Promise<Result> {
  const user = await requireUser(`/library/themes/${id}`);
  try { await discardThemeDraft(user, id); } catch (e) { return { error: message(e) }; }
  refresh(id);
  redirect(`/library/themes/${id}`);
}

export async function restoreThemeAction(id: string, number: number) {
  const user = await requireUser(`/library/themes/${id}`);
  try { await restoreThemeVersion(user, id, number); } catch (e) { redirect(`/library/themes/${id}?error=${encodeURIComponent(message(e))}`); }
  refresh(id);
  redirect(`/library/themes/${id}`);
}

export async function createThemeAction(_prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser("/library/themes");
  let id: string;
  try { id = await createTheme(user, String(form.get("name") ?? ""), String(form.get("from") ?? "") || undefined); }
  catch (e) { return { error: message(e) }; }
  refresh();
  redirect(`/library/themes/${id}`);
}

export async function archiveThemeAction(id: string): Promise<Result> {
  const user = await requireUser(`/library/themes/${id}`);
  try { await archiveTheme(user, id); } catch (e) { return { error: message(e) }; }
  refresh(id);
  redirect("/library/themes");
}
