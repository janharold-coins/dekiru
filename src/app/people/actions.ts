"use server";
import { revalidatePath } from "next/cache";
import { requireUser, type Role } from "@/lib/auth";
import { setReviewScopes, setRole, setThemeAccess } from "@/lib/people";

export async function setRoleAction(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const actor = await requireUser("/people");
  try {
    await setRole(actor, String(form.get("userId")), String(form.get("role")) as Role);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/people");
  return {};
}

export async function setThemeAccessAction(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const actor = await requireUser("/people");
  try {
    await setThemeAccess(actor, String(form.get("userId")), form.get("allowed") === "on");
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/people");
  return {};
}

export async function setReviewScopesAction(userId: string, scopes: string[]): Promise<{ error?: string }> {
  const actor = await requireUser("/people");
  try {
    await setReviewScopes(actor, userId, scopes);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/people");
  return {};
}
