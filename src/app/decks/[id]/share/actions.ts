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
