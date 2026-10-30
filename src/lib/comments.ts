/**
 * Comments on slides (editor › Comments tab). Anyone who can open a deck can read and write them; the
 * author (or an admin) can edit and delete their own; anyone can resolve or reopen a thread. A thread is
 * a root comment plus its replies; a root may be pinned to a point or an area of the slide.
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { deckComments, users, type CommentAnchor } from "@/db/schema";
import { canView, deckRow } from "./access";
import type { SignedInUser } from "./auth";
import { EditError } from "./errors";
import { reviewerCanView } from "./reviews";

export type { CommentAnchor };

export interface Comment {
  id: string;
  slideId: string;
  parentId: string | null;
  authorId: string | null;
  authorName: string;
  body: string;
  anchor: CommentAnchor | null;
  resolvedAt: string | null;
  editedAt: string | null;
  createdAt: string;
}

const MAX_BODY = 4000;

async function openable(deckId: string, user: SignedInUser | null) {
  const row = await deckRow(deckId);
  if (!row) throw new EditError("This deck no longer exists.");
  if (!canView(row, user) && !(await reviewerCanView(row, user))) throw new EditError("You can't open this deck.");
  return row;
}

function clean(body: string) {
  const text = body.replace(/\r\n/g, "\n").trim();
  if (!text) throw new EditError("Write something first.");
  if (text.length > MAX_BODY) throw new EditError(`Keep a comment under ${MAX_BODY} characters.`);
  return text;
}

function cleanAnchor(a: CommentAnchor | null | undefined): CommentAnchor | null {
  if (!a) return null;
  const f = (n: unknown) => Math.max(0, Math.min(1, Number(n) || 0));
  const out: CommentAnchor = { x: f(a.x), y: f(a.y) };
  if (a.w != null && a.h != null && (Number(a.w) > 0.005 || Number(a.h) > 0.005)) { out.w = Math.min(1 - out.x, f(a.w)); out.h = Math.min(1 - out.y, f(a.h)); }
  return out;
}

const shape = (r: typeof deckComments.$inferSelect, names: Map<string, string>): Comment => ({
  id: r.id, slideId: r.slideId, parentId: r.parentId, authorId: r.authorId,
  authorName: r.authorId ? names.get(r.authorId) ?? "Someone" : "Someone",
  body: r.body, anchor: r.anchor ?? null,
  resolvedAt: r.resolvedAt?.toISOString() ?? null, editedAt: r.editedAt?.toISOString() ?? null, createdAt: r.createdAt.toISOString(),
});

async function namesFor(ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map<string, string>();
  const rows = await db().select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, unique));
  return new Map(rows.map((r) => [r.id, r.name || r.email]));
}

/** Every comment on the deck, oldest first (the editor groups them by slide and thread). */
export async function listComments(deckId: string, user: SignedInUser | null): Promise<Comment[]> {
  await openable(deckId, user);
  const rows = await db().select().from(deckComments).where(eq(deckComments.deckId, deckId)).orderBy(asc(deckComments.createdAt));
  const names = await namesFor(rows.map((r) => r.authorId));
  return rows.map((r) => shape(r, names));
}

export async function addComment(user: SignedInUser | null, deckId: string, input: { slideId: string; body: string; anchor?: CommentAnchor | null; parentId?: string | null }): Promise<Comment> {
  await openable(deckId, user);
  const body = clean(input.body);
  let anchor = cleanAnchor(input.anchor);
  let parentId: string | null = null;
  if (input.parentId) {
    const [parent] = await db().select().from(deckComments).where(and(eq(deckComments.id, input.parentId), eq(deckComments.deckId, deckId))).limit(1);
    if (!parent) throw new EditError("That thread no longer exists.");
    parentId = parent.parentId ?? parent.id; // replies always hang off the root
    anchor = null;
  }
  const [row] = await db().insert(deckComments).values({ deckId, slideId: input.slideId, parentId, authorId: user?.id ?? null, body, anchor }).returning();
  const names = await namesFor([row.authorId]);
  return shape(row, names);
}

async function own(deckId: string, id: string, user: SignedInUser | null) {
  const [row] = await db().select().from(deckComments).where(and(eq(deckComments.id, id), eq(deckComments.deckId, deckId))).limit(1);
  if (!row) throw new EditError("That comment no longer exists.");
  const mine = !user || user.role === "admin" || row.authorId === user.id;
  if (!mine) throw new EditError("Only the person who wrote it (or an admin) can change this comment.");
  return row;
}

export async function editComment(user: SignedInUser | null, deckId: string, id: string, body: string): Promise<Comment> {
  await openable(deckId, user);
  await own(deckId, id, user);
  const [row] = await db().update(deckComments).set({ body: clean(body), editedAt: new Date() }).where(eq(deckComments.id, id)).returning();
  const names = await namesFor([row.authorId]);
  return shape(row, names);
}

/** Deleting a root comment deletes its replies too (database cascade). */
export async function deleteComment(user: SignedInUser | null, deckId: string, id: string) {
  await openable(deckId, user);
  await own(deckId, id, user);
  await db().delete(deckComments).where(eq(deckComments.id, id));
}

export async function setResolved(user: SignedInUser | null, deckId: string, id: string, resolved: boolean) {
  await openable(deckId, user);
  const [row] = await db().select().from(deckComments).where(and(eq(deckComments.id, id), eq(deckComments.deckId, deckId))).limit(1);
  if (!row) throw new EditError("That thread no longer exists.");
  const rootId = row.parentId ?? row.id;
  await db().update(deckComments).set({ resolvedAt: resolved ? new Date() : null, resolvedBy: resolved ? user?.id ?? null : null }).where(eq(deckComments.id, rootId));
}
