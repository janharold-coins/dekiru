"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { addRequest, decide, dismissRequest, isStudioDecision, type RequestKind } from "@/lib/studio";

export type Result = { error?: string; ok?: string };

export async function requestAction(_prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser("/studio");
  try {
    await addRequest(user, String(form.get("kind")) as RequestKind, String(form.get("prompt") ?? ""));
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/studio");
  return { ok: "Sent. Ask Claude to check the Studio and it will build this as a proposal here." };
}

export async function dismissAction(id: string): Promise<void> {
  const user = await requireUser("/studio");
  await dismissRequest(user, id);
  revalidatePath("/studio");
}

export async function decideAction(id: string, _prev: Result, form: FormData): Promise<Result> {
  const user = await requireUser(`/studio/${id}`);
  const decision = String(form.get("decision"));
  if (!isStudioDecision(decision)) return { error: "Unknown decision." };
  try {
    const { themeId } = await decide(user, id, decision, String(form.get("note") ?? ""));
    revalidatePath("/studio");
    revalidatePath(`/studio/${id}`);
    if (themeId) revalidatePath("/library/themes");
    return {
      ok: decision === "approved"
        ? themeId ? "Approved and added to Library → Themes." : "Approved. Ask Claude to add it to the library."
        : decision === "changes_requested" ? "Sent back. Ask Claude to revise it; the new revision shows up here." : "Rejected.",
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
