"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PresetTokens } from "@/deck/presets";
import { requireUser } from "@/lib/auth";
import {
  archivePreset, createPreset, discardPresetDraft, PresetError, publishPreset, restorePresetVersion, savePresetDraft,
} from "@/lib/presets";

export type Result = { error?: string; ok?: string };
const message = (e: unknown) => (e instanceof PresetError ? e.message : (e as Error).message);

function refresh(id?: string) {
  revalidatePath("/studio");
  if (id) revalidatePath(`/studio/tokens/${id}`);
  revalidatePath("/", "layout"); // decks using the preset
}

export async function savePresetAction(id: string, tokens: PresetTokens, name: string): Promise<Result> {
  const user = await requireUser(`/studio/tokens/${id}`);
  try { await savePresetDraft(user, id, { tokens, name }); } catch (e) { return { error: message(e) }; }
  refresh(id);
  return { ok: "Saved as a draft. Decks still use the live version until you publish." };
}

export async function publishPresetAction(id: string, tokens: PresetTokens, name: string): Promise<Result> {
  const user = await requireUser(`/studio/tokens/${id}`);
  try {
    await savePresetDraft(user, id, { tokens, name });
    const n = await publishPreset(user, id);
    refresh(id);
    return { ok: `Published v${n}. Every deck using this set now shows it; links already sent keep their look.` };
  } catch (e) { return { error: message(e) }; }
}

export async function discardPresetAction(id: string): Promise<Result> {
  const user = await requireUser(`/studio/tokens/${id}`);
  try { await discardPresetDraft(user, id); } catch (e) { return { error: message(e) }; }
  refresh(id);
  redirect(`/studio/tokens/${id}`);
}

export async function restorePresetAction(id: string, number: number) {
  const user = await requireUser(`/studio/tokens/${id}`);
  try { await restorePresetVersion(user, id, number); } catch (e) { redirect(`/studio/tokens/${id}?error=${encodeURIComponent(message(e))}`); }
  refresh(id);
  redirect(`/studio/tokens/${id}`);
}

/** New preset of one kind (the form's hidden "kind"), starting from the approved look. Opens it in the editor. */
export async function createPresetAction(_prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser("/studio?show=tokens");
  let id: string;
  try { id = await createPreset(user, String(form.get("kind") ?? ""), String(form.get("name") ?? "")); }
  catch (e) { return { error: message(e) }; }
  refresh();
  redirect(`/studio/tokens/${id}`);
}

/** Delete = archive: the set leaves every picker; its versions stay for history and sent links. */
export async function deletePresetAction(id: string): Promise<Result> {
  const user = await requireUser("/studio?show=tokens");
  try { await archivePreset(user, id); } catch (e) { return { error: message(e) }; }
  refresh(id);
  return { ok: "Set deleted." };
}
