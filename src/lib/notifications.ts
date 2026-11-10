/**
 * In-app notifications (spec §7b). Who hears about what:
 *   review_sent        → everyone who can review it (that scope, or admins), minus the sender
 *   approved           → the person who sent it
 *   changes_requested  → the person who sent it
 *   master_changed     → owners and editors of decks that follow a slide of this master, once its revision is approved
 *   shared             → the person a deck was shared with
 *   studio             → Studio tickets: the requester at each step, reviewers when a decision is needed (src/lib/studio.ts)
 * Delivery is the bell in the header; Slack and email can hang off `notify` later.
 */
import { and, desc, eq, inArray, isNull, like, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { deckMembers, deckVersions, decks, notifications, users } from "@/db/schema";
import { LANGUAGES, type Lang } from "@/deck/i18n";
import type { SignedInUser } from "./auth";

export type NotificationKind = "review_sent" | "approved" | "changes_requested" | "master_changed" | "shared" | "studio";

export interface Notification {
  id: string; kind: NotificationKind; text: string; href: string; readAt: Date | null; createdAt: Date; deckId: string | null;
}

/** Write one notification per recipient (never to the actor, never twice to the same person). */
export async function notify(recipients: (string | null | undefined)[], input: { kind: NotificationKind; deckId?: string | null; lang?: Lang | null; text: string; href: string; actor?: SignedInUser | null }) {
  const ids = [...new Set(recipients.filter((id): id is string => Boolean(id) && id !== input.actor?.id))];
  if (!ids.length) return;
  await db().insert(notifications).values(ids.map((userId) => ({
    userId, kind: input.kind, deckId: input.deckId ?? null, lang: input.lang ?? null, text: input.text, href: input.href, actorId: input.actor?.id ?? null,
  })));
}

/** People who may review a scope: admins plus anyone with that scope ticked on People. */
export async function reviewersFor(scope: string): Promise<string[]> {
  const rows = await db().select({ id: users.id }).from(users)
    .where(sql`${users.role} = 'admin' or ${users.reviewScopes} @> ${JSON.stringify([scope])}::jsonb`);
  return rows.map((r) => r.id);
}

/** Owners and editors of decks whose live version follows a slide of this master. */
export async function dependentsOf(masterId: string): Promise<string[]> {
  const q = db();
  const versions = await q.select({ deckId: deckVersions.deckId }).from(deckVersions)
    .where(and(eq(deckVersions.status, "published"), like(sql`${deckVersions.slides}::text`, `%"ref":"${masterId}/%`)));
  const deckIds = [...new Set(versions.map((v) => v.deckId))].filter((id) => id !== masterId);
  if (!deckIds.length) return [];
  const [owners, editors] = await Promise.all([
    q.select({ id: decks.ownerId }).from(decks).where(inArray(decks.id, deckIds)),
    q.select({ id: deckMembers.userId }).from(deckMembers).where(and(inArray(deckMembers.deckId, deckIds), eq(deckMembers.role, "editor"))),
  ]);
  return [...owners.map((o) => o.id), ...editors.map((e) => e.id)].filter((id): id is string => Boolean(id));
}

export const layerName = (lang: Lang | null | undefined) => (!lang || lang === "en" ? "" : ` (${LANGUAGES[lang].english} translation)`);

/* ---------- reading ---------- */

export async function listNotifications(userId: string, limit = 30): Promise<Notification[]> {
  const rows = await db().select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(limit);
  return rows.map((r) => ({ id: r.id, kind: r.kind as NotificationKind, text: r.text, href: r.href, readAt: r.readAt, createdAt: r.createdAt, deckId: r.deckId }));
}

export async function unreadCount(userId: string) {
  const [row] = await db().select({ n: sql<number>`count(*)::int` }).from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.n ?? 0;
}

export async function markRead(userId: string, ids?: string[]) {
  const where = ids?.length ? and(eq(notifications.userId, userId), inArray(notifications.id, ids)) : and(eq(notifications.userId, userId), isNull(notifications.readAt));
  await db().update(notifications).set({ readAt: new Date() }).where(where);
}
