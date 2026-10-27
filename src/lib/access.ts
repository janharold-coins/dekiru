/** Who may see and change a deck. Masters: everyone sees, admins/managers edit. Copies: owner (admins can see). */
import { eq } from "drizzle-orm";
import { db, hasDb } from "@/db/client";
import { deckIdRenames, decks } from "@/db/schema";
import type { SignedInUser } from "./auth";
import { getDeck } from "./decks";

export type DeckRow = typeof decks.$inferSelect;

/** The current id for an old one (decks were renamed to "dk-…" ids), or null. */
export async function renamedDeckId(oldId: string) {
  if (!hasDb()) return null;
  const [row] = await db().select({ newId: deckIdRenames.newId }).from(deckIdRenames).where(eq(deckIdRenames.oldId, oldId)).limit(1);
  return row?.newId ?? null;
}

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
  if (!row) return null;
  if (!canView(row, user)) {
    // Reviewers may open a deck that's waiting for their review (read-only).
    const { reviewerCanView } = await import("./reviews");
    if (!(await reviewerCanView(row, user))) return null;
  }
  const editable = canEdit(row, user);
  const deck = await getDeck(id, { draft: editable });
  return deck ? { deck, canEdit: editable } : null;
}

/** Decks this person can add slides to: their own decks, plus the company masters for admins and managers. */
export async function editableDecks(user: SignedInUser | null) {
  if (!hasDb()) return [];
  const { listDecks } = await import("./decks");
  const all = await listDecks({ viewerId: user?.id ?? null });
  return all
    .filter((d) => canEdit(d as unknown as DeckRow, user))
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "copy" ? -1 : 1))
    .map((d) => ({ id: d.id, title: d.kind === "master" ? `${d.title} (company master)` : d.title, theme: d.theme.tokens }));
}
