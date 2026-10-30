/**
 * Who may see and change a deck. Masters: everyone sees, admins/managers edit. Copies: the owner and the
 * people it's shared with (spec §7b: members are viewers or editors); admins and managers can see (not edit) every deck.
 */
import { eq } from "drizzle-orm";
import { db, hasDb } from "@/db/client";
import { deckIdRenames, deckMembers, decks } from "@/db/schema";
import type { SignedInUser } from "./auth";
import { getDeck } from "./decks";

export type DeckRow = typeof decks.$inferSelect & {
  /** People the deck is shared with; loaded by deckRow(). Absent on rows from other queries (then only the owner counts). */
  members?: { userId: string; role: "editor" | "viewer" }[];
};

/** The current id for an old one (decks were renamed to "dk-…" ids), or null. */
export async function renamedDeckId(oldId: string) {
  if (!hasDb()) return null;
  const [row] = await db().select({ newId: deckIdRenames.newId }).from(deckIdRenames).where(eq(deckIdRenames.oldId, oldId)).limit(1);
  return row?.newId ?? null;
}

export async function deckRow(id: string): Promise<DeckRow | null> {
  const [row] = await db().select().from(decks).where(eq(decks.id, id)).limit(1);
  if (!row) return null;
  if (row.kind === "master") return row;
  const members = await db().select({ userId: deckMembers.userId, role: deckMembers.role }).from(deckMembers).where(eq(deckMembers.deckId, id));
  return { ...row, members };
}

/** The person's membership of a copy: owner, editor, viewer or none. */
export function memberRole(row: DeckRow, user: SignedInUser | null): "owner" | "editor" | "viewer" | null {
  if (!user) return "owner";
  if (row.ownerId === user.id) return "owner";
  return row.members?.find((m) => m.userId === user.id)?.role ?? null;
}

export function canView(row: DeckRow, user: SignedInUser | null) {
  return row.kind === "master" || !user || user.role === "admin" || user.role === "manager" || memberRole(row, user) !== null;
}

export function canEdit(row: DeckRow, user: SignedInUser | null) {
  if (!user) return true; // local development without sign-in
  if (row.kind === "master") return user.role === "admin" || user.role === "manager";
  const r = memberRole(row, user);
  return r === "owner" || r === "editor";
}

/** A deck as this person should see it: the draft for people who can edit it, else the live version. */
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
    .filter((d) => d.shared?.role === "editor" || (!d.shared && canEdit(d as unknown as DeckRow, user)))
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "copy" ? -1 : 1))
    .map((d) => ({ id: d.id, title: d.kind === "master" ? `${d.title} (company master)` : d.title, theme: d.theme.tokens }));
}
