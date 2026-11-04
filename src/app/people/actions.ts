"use server";
import { refresh, revalidatePath } from "next/cache";
import { requireUser, type Role } from "@/lib/auth";
import { setReviewScopes, setRole, setStudioAccess, setThemeAccess } from "@/lib/people";
import { addDepartment, deleteDepartment, renameDepartment, setDepartment } from "@/lib/departments";

// Each action ends with refresh() so the People page shows the change without a reload (revalidatePath alone doesn't).

export async function setRoleAction(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const actor = await requireUser("/people");
  try {
    await setRole(actor, String(form.get("userId")), String(form.get("role")) as Role);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/people");
  refresh();
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
  refresh();
  return {};
}

export async function setStudioAccessAction(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const actor = await requireUser("/people");
  try {
    await setStudioAccess(actor, String(form.get("userId")), form.get("allowed") === "on");
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/people");
  refresh();
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
  refresh();
  return {};
}

export async function setDepartmentAction(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const actor = await requireUser("/people");
  try {
    await setDepartment(actor, String(form.get("userId")), String(form.get("departmentId") ?? "") || null);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/people");
  refresh();
  return {};
}

/* Departments: one list, used for people and for deck tags (src/lib/departments.ts). */

async function departments(fn: (actor: Awaited<ReturnType<typeof requireUser>>) => Promise<unknown>): Promise<{ error?: string }> {
  const actor = await requireUser("/people");
  try {
    await fn(actor);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/people");
  refresh();
  revalidatePath("/");
  return {};
}

export async function addDepartmentAction(name: string) {
  return departments((a) => addDepartment(a, name));
}
export async function renameDepartmentAction(id: string, name: string) {
  return departments((a) => renameDepartment(a, id, name));
}
export async function deleteDepartmentAction(id: string) {
  return departments((a) => deleteDepartment(a, id));
}
