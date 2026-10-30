/**
 * People a deck is shared with (spec §7b). A copy has an owner plus members: viewers see it, editors change it.
 * Masters are shared with everyone already and don't use this. Who may manage members: the owner, admins and managers.
 * Admins and managers can also hand a deck to a new owner (people leave).
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { deckMembers, decks, users } from "@/db/schema";
import type { SignedInUser } from "./auth";
import { deckRow, type DeckRow } from "./access";
import { EditError } from "./errors";
import { notify } from "./notifications";

export type MemberRole = "editor" | "viewer";
export interface Member { userId: string; role: MemberRole; name: string; email: string; image: string | null }

export function canManageMembers(row: DeckRow, user: SignedInUser | null) {
  if (!user) return true;
  return row.kind === "copy" && (row.ownerId === user.id || user.role === "admin" || user.role === "manager");
}

export function canChangeOwner(user: SignedInUser | null) {
  return !user || user.role === "admin" || user.role === "manager";
}

export async function listMembers(deckId: string): Promise<Member[]> {
  const rows = await db().select({ userId: deckMembers.userId, role: deckMembers.role, name: users.name, email: users.email, image: users.image })
    .from(deckMembers).innerJoin(users, eq(users.id, deckMembers.userId)).where(eq(deckMembers.deckId, deckId)).orderBy(users.name);
  return rows;
}

async function managed(deckId: string, user: SignedInUser | null) {
  const row = await deckRow(deckId);
  if (!row) throw new EditError("No such deck.");
  if (row.kind === "master") throw new EditError("Company decks are already shared with everyone.");
  if (!canManageMembers(row, user)) throw new EditError("Only the deck's owner, admins and managers can change who it's shared with.");
  return row;
}

/** Share with a person by email (they must have signed in to Dekiru once). Read-only unless `role` says editor. */
export async function addMember(user: SignedInUser | null, deckId: string, email: string, role: MemberRole = "viewer") {
  const row = await managed(deckId, user);
  const address = email.trim().toLowerCase();
  if (!address) throw new EditError("Enter an email address.");
  const [person] = await db().select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.email, address)).limit(1);
  if (!person) throw new EditError(`${address} hasn't signed in to Dekiru yet. Ask them to sign in once, then share again.`);
  if (person.id === row.ownerId) throw new EditError(`${person.name || person.email} owns this deck.`);
  await db().insert(deckMembers).values({ deckId, userId: person.id, role, addedBy: user?.id ?? null })
    .onConflictDoUpdate({ target: [deckMembers.deckId, deckMembers.userId], set: { role } });
  await notify([person.id], { kind: "shared", deckId, actor: user, text: `${user?.name || "Someone"} shared “${row.title}” with you (${role === "editor" ? "you can edit" : "view only"})`, href: `/decks/${deckId}` });
  return person;
}

export async function setMemberRole(user: SignedInUser | null, deckId: string, userId: string, role: MemberRole) {
  await managed(deckId, user);
  await db().update(deckMembers).set({ role }).where(and(eq(deckMembers.deckId, deckId), eq(deckMembers.userId, userId)));
}

export async function removeMember(user: SignedInUser | null, deckId: string, userId: string) {
  const row = await deckRow(deckId);
  if (!row) throw new EditError("No such deck.");
  // People can always remove themselves; otherwise the usual managers.
  if (!(user && user.id === userId) && !canManageMembers(row, user)) throw new EditError("Only the deck's owner, admins and managers can change who it's shared with.");
  await db().delete(deckMembers).where(and(eq(deckMembers.deckId, deckId), eq(deckMembers.userId, userId)));
}

/** Hand the deck to someone else (admins and managers). The old owner stays on as an editor. */
export async function changeOwner(user: SignedInUser | null, deckId: string, newOwnerId: string) {
  if (!canChangeOwner(user)) throw new EditError("Only admins and managers can change a deck's owner.");
  const row = await deckRow(deckId);
  if (!row) throw new EditError("No such deck.");
  if (row.kind === "master") throw new EditError("Company decks don't have an owner.");
  const [person] = await db().select({ id: users.id }).from(users).where(eq(users.id, newOwnerId)).limit(1);
  if (!person) throw new EditError("No such person.");
  if (person.id === row.ownerId) return;
  await notify([person.id], { kind: "shared", deckId, actor: user, text: `${user?.name || "Someone"} made you the owner of “${row.title}”`, href: `/decks/${deckId}` });
  await db().transaction(async (tx) => {
    await tx.update(decks).set({ ownerId: person.id, updatedAt: new Date() }).where(eq(decks.id, deckId));
    await tx.delete(deckMembers).where(and(eq(deckMembers.deckId, deckId), eq(deckMembers.userId, person.id)));
    if (row.ownerId) {
      await tx.insert(deckMembers).values({ deckId, userId: row.ownerId, role: "editor", addedBy: user?.id ?? null })
        .onConflictDoUpdate({ target: [deckMembers.deckId, deckMembers.userId], set: { role: "editor" } });
    }
  });
}
