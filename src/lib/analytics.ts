/**
 * View tracking for share links.
 *
 * The public presenter reports visible time per slide in small increments (see TrackedPresenter).
 * Each visit is a view_session; each slide's time accumulates in slide_views.
 *
 * Share links: every visit counts, split by who opened the link —
 *   recipient — not signed in to Dekiru (the client on their own)
 *   team      — signed in (a rep presenting it in a meeting, or checking it); we know who
 * Present mode: a signed-in rep presenting from the deck's Present button, with an optional
 * "Presenting to…" note. Sessions under 30 s are treated as quick checks and hidden by default.
 */
import { and, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import { shareLinks, slideViews, users, viewSessions } from "@/db/schema";

/** One report can't add more than this, so a sleeping laptop can't inflate a slide's time. */
export const MAX_BEAT_MS = 60_000;

export type Who = "all" | "recipients" | "team";
export const WHO: Who[] = ["all", "recipients", "team"];

/** Presentations shorter than this are quick checks, not meetings. */
export const SHORT_PRESENTATION_MS = 30_000;

export async function startVisit(link: { id: string; deckId: string; versionId: string }, viewerId: string | null) {
  const [v] = await db().insert(viewSessions)
    .values({ kind: "link", linkId: link.id, deckId: link.deckId, versionId: link.versionId, internal: Boolean(viewerId), viewerId })
    .returning({ id: viewSessions.id });
  return v.id;
}

export async function startPresentation(deckId: string, versionId: string | null, viewerId: string | null) {
  const [v] = await db().insert(viewSessions)
    .values({ kind: "present", deckId, versionId, internal: true, viewerId })
    .returning({ id: viewSessions.id });
  return v.id;
}

/** Which visits a beacon may write to: one share link's, or one deck's presentations. */
export type Scope = { linkId: string } | { deckId: string };
const inScope = (sessionId: string, scope: Scope) =>
  and(eq(viewSessions.id, sessionId), "linkId" in scope
    ? eq(viewSessions.linkId, scope.linkId)
    : and(eq(viewSessions.deckId, scope.deckId), eq(viewSessions.kind, "present")));

/** "Presenting to…" — only the person presenting can set it. */
export async function setAudience(deckId: string, sessionId: string, viewerId: string | null, audience: string) {
  const text = audience.trim().slice(0, 120) || null;
  const where = viewerId
    ? and(inScope(sessionId, { deckId }), eq(viewSessions.viewerId, viewerId))
    : inScope(sessionId, { deckId });
  const rows = await db().update(viewSessions).set({ audience: text }).where(where).returning({ id: viewSessions.id });
  return rows.length > 0;
}

/** Adds visible time to one slide of a visit. Ignores visits outside the scope. */
export async function recordTime(scope: Scope, sessionId: string, slideId: string, ms: number) {
  const add = Math.max(0, Math.min(MAX_BEAT_MS, Math.round(ms)));
  const q = db();
  const touched = await q.update(viewSessions).set({ lastSeenAt: new Date() })
    .where(inScope(sessionId, scope)).returning({ id: viewSessions.id });
  if (!touched.length || add === 0) return Boolean(touched.length);
  await q.insert(slideViews).values({ sessionId, slideId, ms: add })
    .onConflictDoUpdate({ target: [slideViews.sessionId, slideViews.slideId], set: { ms: sql`${slideViews.ms} + ${add}` } });
  return true;
}

const n = (e: SQL) => sql<number>`${e}`.mapWith(Number);

/** Opens per link, split recipient / team, plus last open (for the link list). */
export async function opensByLink(linkIds: string[]) {
  type Row = { opens: number; recipient: number; team: number; lastOpened: Date | null };
  if (!linkIds.length) return new Map<string, Row>();
  const rows = await db().select({
      linkId: viewSessions.linkId,
      opens: n(sql`count(*)`),
      team: n(sql`count(*) filter (where ${viewSessions.internal})`),
      last: sql<Date | null>`max(${viewSessions.startedAt})`.mapWith((v) => (v ? new Date(v) : null)),
    })
    .from(viewSessions).where(inArray(viewSessions.linkId, linkIds)).groupBy(viewSessions.linkId);
  return new Map<string, Row>(rows.map((r) => [r.linkId!, { opens: r.opens, team: r.team, recipient: r.opens - r.team, lastOpened: r.last }]));
}

export interface Visit { startedAt: Date; ms: number; slidesSeen: number; viewer: string | null }
export interface LinkReport {
  who: Who;
  counts: { all: number; recipients: number; team: number };
  opens: number; totalMs: number; avgMs: number; lastOpened: Date | null;
  slides: { slideId: string; ms: number; reach: number }[];
  visits: Visit[];
}

/** Everything for one link's report page, for all visits or one group. */
export async function linkReport(linkId: string, who: Who = "all"): Promise<LinkReport> {
  const q = db();
  const all = await q.select({
      id: viewSessions.id, startedAt: viewSessions.startedAt, internal: viewSessions.internal,
      viewer: sql<string | null>`coalesce(nullif(${users.name}, ''), ${users.email}, case when ${viewSessions.internal} then 'Someone on the team' end)`,
      ms: n(sql`coalesce(sum(${slideViews.ms}), 0)`),
      slidesSeen: n(sql`count(${slideViews.slideId})`),
    })
    .from(viewSessions)
    .leftJoin(slideViews, eq(slideViews.sessionId, viewSessions.id))
    .leftJoin(users, eq(users.id, viewSessions.viewerId))
    .where(eq(viewSessions.linkId, linkId))
    .groupBy(viewSessions.id, users.name, users.email)
    .orderBy(desc(viewSessions.startedAt));

  const keep = (internal: boolean) => who === "all" || (who === "team") === internal;
  const visits = all.filter((v) => keep(v.internal));
  const ids = new Set(visits.map((v) => v.id));

  const perSession = ids.size
    ? await q.select({ sessionId: slideViews.sessionId, slideId: slideViews.slideId, ms: slideViews.ms })
        .from(slideViews).where(inArray(slideViews.sessionId, [...ids]))
    : [];
  const bySlide = new Map<string, { ms: number; reach: number }>();
  for (const r of perSession) {
    const cur = bySlide.get(r.slideId) ?? { ms: 0, reach: 0 };
    bySlide.set(r.slideId, { ms: cur.ms + r.ms, reach: cur.reach + 1 });
  }

  const totalMs = visits.reduce((a, v) => a + v.ms, 0);
  const team = all.filter((v) => v.internal).length;
  return {
    who,
    counts: { all: all.length, recipients: all.length - team, team },
    opens: visits.length, totalMs,
    avgMs: visits.length ? Math.round(totalMs / visits.length) : 0,
    lastOpened: visits[0]?.startedAt ?? null,
    slides: [...bySlide].map(([slideId, v]) => ({ slideId, ...v })),
    visits: visits.slice(0, 100).map(({ startedAt, ms, slidesSeen, internal, viewer }) => ({
      startedAt, ms, slidesSeen, viewer: internal ? viewer : null,
    })),
  };
}

export interface Presentation { id: string; startedAt: Date; ms: number; slidesSeen: number; presenter: string | null; audience: string | null }
export interface PresentationReport {
  shown: number; short: number; totalMs: number; avgMs: number; last: Date | null;
  slides: { slideId: string; ms: number; reach: number }[];
  sessions: Presentation[];
}

/** Present-mode sessions for a deck. Quick checks (< 30 s) are left out unless asked for. */
export async function presentationReport(deckId: string, { includeShort = false } = {}): Promise<PresentationReport> {
  const q = db();
  const all = await q.select({
      id: viewSessions.id, startedAt: viewSessions.startedAt, audience: viewSessions.audience,
      presenter: sql<string | null>`coalesce(nullif(${users.name}, ''), ${users.email})`,
      ms: n(sql`coalesce(sum(${slideViews.ms}), 0)`),
      slidesSeen: n(sql`count(${slideViews.slideId})`),
    })
    .from(viewSessions)
    .leftJoin(slideViews, eq(slideViews.sessionId, viewSessions.id))
    .leftJoin(users, eq(users.id, viewSessions.viewerId))
    .where(and(eq(viewSessions.deckId, deckId), eq(viewSessions.kind, "present")))
    .groupBy(viewSessions.id, users.name, users.email)
    .orderBy(desc(viewSessions.startedAt));
  const sessions = all.filter((s) => includeShort || s.ms >= SHORT_PRESENTATION_MS);
  const ids = sessions.map((s) => s.id);
  const rows = ids.length
    ? await q.select({ slideId: slideViews.slideId, ms: slideViews.ms }).from(slideViews).where(inArray(slideViews.sessionId, ids))
    : [];
  const bySlide = new Map<string, { ms: number; reach: number }>();
  for (const r of rows) {
    const cur = bySlide.get(r.slideId) ?? { ms: 0, reach: 0 };
    bySlide.set(r.slideId, { ms: cur.ms + r.ms, reach: cur.reach + 1 });
  }
  const totalMs = sessions.reduce((a, s) => a + s.ms, 0);
  return {
    shown: sessions.length, short: all.filter((s) => s.ms < SHORT_PRESENTATION_MS).length,
    totalMs, avgMs: sessions.length ? Math.round(totalMs / sessions.length) : 0, last: sessions[0]?.startedAt ?? null,
    slides: [...bySlide].map(([slideId, v]) => ({ slideId, ...v })),
    sessions: sessions.slice(0, 200),
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
