"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createShareLink, revokeShareLink, type CreateLinkInput } from "@/lib/share";

export interface CreateState {
  ok?: { slug: string; password: string | null; label: string | null; versionNumber: number };
  error?: string;
}

export async function createLinkAction(deckId: string, _prev: CreateState, form: FormData): Promise<CreateState> {
  const user = await requireUser(`/decks/${deckId}/share`);
  const mode = String(form.get("passwordMode") ?? "generate");
  const password: CreateLinkInput["password"] =
    mode === "none" ? "none" : mode === "custom" ? { custom: String(form.get("customPassword") ?? "") } : "generate";
  const days = Number(form.get("expires") ?? 0);
  try {
    const { link, password: plain, versionNumber } = await createShareLink(
      deckId, { label: String(form.get("label") ?? ""), password, expiresInDays: days > 0 ? days : null }, user,
    );
    revalidatePath(`/decks/${deckId}/share`);
    return { ok: { slug: link.slug, password: plain, label: link.label, versionNumber } };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function revokeLinkAction(form: FormData) {
  const user = await requireUser("/");
  const deckId = await revokeShareLink(String(form.get("id")), user);
  revalidatePath(`/decks/${deckId}/share`);
}

/* ---------- people the deck is shared with (spec §7b) ---------- */

export interface PeopleState { ok?: string; error?: string }

export async function addMemberAction(deckId: string, _prev: PeopleState, form: FormData): Promise<PeopleState> {
  const user = await requireUser(`/decks/${deckId}/share`);
  const role = String(form.get("role")) === "editor" ? "editor" : "viewer";
  try {
    const { addMember } = await import("@/lib/members");
    const person = await addMember(user, deckId, String(form.get("email") ?? ""), role);
    revalidatePath(`/decks/${deckId}/share`);
    return { ok: `Shared with ${person.name || person.email} (${role === "editor" ? "can edit" : "view only"}).` };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function setMemberRoleAction(_prev: PeopleState, form: FormData): Promise<PeopleState> {
  const user = await requireUser("/");
  const deckId = String(form.get("deckId"));
  try {
    const { setMemberRole } = await import("@/lib/members");
    await setMemberRole(user, deckId, String(form.get("userId")), String(form.get("role")) === "editor" ? "editor" : "viewer");
    revalidatePath(`/decks/${deckId}/share`);
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function removeMemberAction(form: FormData) {
  const user = await requireUser("/");
  const deckId = String(form.get("deckId"));
  const { removeMember } = await import("@/lib/members");
  await removeMember(user, deckId, String(form.get("userId")));
  revalidatePath(`/decks/${deckId}/share`);
}

export async function changeOwnerAction(_prev: PeopleState, form: FormData): Promise<PeopleState> {
  const user = await requireUser("/");
  const deckId = String(form.get("deckId"));
  try {
    const { changeOwner } = await import("@/lib/members");
    await changeOwner(user, deckId, String(form.get("userId")));
    revalidatePath(`/decks/${deckId}/share`);
    revalidatePath("/");
    return { ok: "Owner changed. The previous owner stays on as an editor." };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
