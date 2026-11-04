"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { decide, UiLibraryError } from "@/lib/ui-sources";
import type { FigmaSource } from "@/ui/types";

export type Result = { error?: string; ok?: string };

/** Pick a source as canonical, retire it, or put it back as a candidate. */
export async function decideSourceAction(_prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser("/ui/library");
  try {
    await decide(user, String(form.get("component")), String(form.get("source")), String(form.get("status")) as FigmaSource["status"], String(form.get("note") ?? ""));
  } catch (e) {
    return { error: e instanceof UiLibraryError ? e.message : `Something went wrong: ${(e as Error).message}` };
  }
  revalidatePath("/ui/library");
  revalidatePath("/ui");
  return { ok: "Saved." };
}
