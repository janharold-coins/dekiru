/**
 * View tracking for share links.
 *
 * The public presenter reports visible time per slide in small increments (see TrackedPresenter).
 * Each visit is a view_session; each slide's time accumulates in slide_views. Visits by people signed
 * in to Dekiru are marked internal and left out of the numbers reps see.
 */
import { and, desc, eq, inArray, max, sql, sum } from "drizzle-orm";
import { db } from "@/db/client";
import { shareLinks, slideViews, viewSessions } from "@/db/schema";

/** One report can't add more than this, so a sleeping laptop can't inflate a slide's time. */
export const MAX_BEAT_MS = 60_000;

export async function startVisit(linkId: string, internal: boolean) {
  const [v] = await db().insert(viewSessions).values({ linkId, internal }).returning({ id: viewSessions.id });
  return v.id;
}

/** Adds visible time to one slide of a visit. Ignores visits that don't belong to the link. */
export async function recordTime(linkId: string, sessionId: string, slideId: string, ms: number) {
  const add = Math.max(0, Math.min(MAX_BEAT_MS, Math.round(ms)));
  const q = db();
  const touched = await q.update(viewSessions).set({ lastSeenAt: new Date() })
    .where(and(eq(viewSessions.id, sessionId), eq(viewSessions.linkId, linkId))).returning({ id: viewSessions.id });
  if (!touched.length || add === 0) return Boolean(touched.length);
  await q.insert(slideViews).values({ sessionId, slideId, ms: add })
    .onConflictDoUpdate({ target: [slideViews.sessionId, slideViews.slideId], set: { ms: sql`${slideViews.ms} + ${add}` } });
  return true;
}

/** Opens and last-open per link, external visits only (for the link list). */
export async function opensByLink(linkIds: string[]) {
  if (!linkIds.length) return new Map<string, { opens: number; lastOpened: Date | null }>();
  const rows = await db().select({ linkId: viewSessions.linkId, opens: sql<number>`count(*)`.mapWith(Number), last: max(viewSessions.startedAt) })
    .from(viewSessions).where(and(inArray(viewSessions.linkId, linkIds), eq(viewSessions.internal, false)))
    .groupBy(viewSessions.linkId);
  return new Map(rows.map((r) => [r.linkId, { opens: r.opens, lastOpened: r.last }]));
}

export interface LinkReport {
  opens: number; internalOpens: number; totalMs: number; avgMs: number; lastOpened: Date | null;
  slides: { slideId: string; ms: number; reach: number }[];
  visits: { startedAt: Date; ms: number; slidesSeen: number }[];
}

/** Everything for one link's report page (external visits only). */
export async function linkReport(linkId: string): Promise<LinkReport> {
  const q = db();
  const visits = await q.select({
      id: viewSessions.id, startedAt: viewSessions.startedAt, internal: viewSessions.internal,
      ms: sql<number>`coalesce(sum(${slideViews.ms}), 0)`.mapWith(Number),
      slidesSeen: sql<number>`count(${slideViews.slideId})`.mapWith(Number),
    })
    .from(viewSessions).leftJoin(slideViews, eq(slideViews.sessionId, viewSessions.id))
    .where(eq(viewSessions.linkId, linkId)).groupBy(viewSessions.id).orderBy(desc(viewSessions.startedAt));
  const external = visits.filter((v) => !v.internal);
  const perSlide = await q.select({
      slideId: slideViews.slideId, ms: sum(slideViews.ms).mapWith(Number),
      reach: sql<number>`count(distinct ${slideViews.sessionId})`.mapWith(Number),
    })
    .from(slideViews).innerJoin(viewSessions, eq(viewSessions.id, slideViews.sessionId))
    .where(and(eq(viewSessions.linkId, linkId), eq(viewSessions.internal, false)))
    .groupBy(slideViews.slideId);
  const totalMs = external.reduce((a, v) => a + v.ms, 0);
  return {
    opens: external.length, internalOpens: visits.length - external.length, totalMs,
    avgMs: external.length ? Math.round(totalMs / external.length) : 0,
    lastOpened: external[0]?.startedAt ?? null,
    slides: perSlide,
    visits: external.slice(0, 50).map(({ startedAt, ms, slidesSeen }) => ({ startedAt, ms, slidesSeen })),
  };
}

export async function getLinkForReport(linkId: string) {
  const [l] = await db().select().from(shareLinks).where(eq(shareLinks.id, linkId)).limit(1);
  return l ?? null;
}

/** 1h 4m · 3m 20s · 45s · <1s */
export function duration(ms: number) {
  if (ms > 0 && ms < 1000) return "<1s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
