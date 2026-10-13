/** Who may see and change a deck. Masters: everyone sees, admins/managers edit. Copies: owner (admins can see). */
import { eq } from "drizzle-orm";
import { db, hasDb } from "@/db/client";
import { decks } from "@/db/schema";
import type { SignedInUser } from "./auth";
import { getDeck } from "./decks";

export type DeckRow = typeof decks.$inferSelect;

export async function deckRow(id: string) {
  const [row] = await db().select().from(decks).where(eq(decks.id, id)).limit(1);
  return row ?? null;
}

export function canView(row: DeckRow, user: SignedInUser | null) {
  return row.kind === "master" || !user || user.role === "admin" || row.ownerId === user.id;
}

export function canEdit(row: DeckRow, user: SignedInUser | null) {
  if (!user) return true; // local development without sign-in
  return row.kind === "master" ? user.role === "admin" || user.role === "manager" : row.ownerId === user.id;
}

/** A deck as this person should see it: the draft for people who can edit it, else the published version. */
export async function deckFor(id: string, user: SignedInUser | null) {
  if (!hasDb()) {
    const deck = await getDeck(id);
    return deck ? { deck, canEdit: false } : null;
  }
  const row = await deckRow(id);
  if (!row || !canView(row, user)) return null;
  const editable = canEdit(row, user);
  const deck = await getDeck(id, { draft: editable });
  return deck ? { deck, canEdit: editable } : null;
}
