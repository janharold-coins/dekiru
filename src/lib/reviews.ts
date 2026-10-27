/**
 * Review and approval (spec §7a).
 *
 * A review is about one published version of a deck. Its *content* review is "employee" for a personal copy
 * (1 approval) or "company" for a master (2); each *translation* has its own review per language (2 approvals
 * from reviewers of that language). Approvals are per slide; the deck is approved when every presented slide
 * has enough distinct approvers. The person who sent the deck for review never counts. Admins review
 * everything and may "approve for everyone" (override), which history records as such.
 *
 * Publishing stays free. What a review gates: the "Not yet reviewed" notice on Present and share links, and
 * promotion of an employee deck to a company deck. A new published version starts a new review; approvals of
 * slides whose content didn't change carry over (slide fingerprints).
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { decks, deckVersions, reviewEvents, reviews, slideApprovals, users } from "@/db/schema";
import { resolveSlides } from "@/content/resolve";
import { fingerprint, isTargetLang, LANGUAGES, TARGET_LANGS, type Lang, type TargetLang } from "@/deck/i18n";
import type { SlideData } from "@/deck/types";
import type { SignedInUser } from "./auth";
import { canEdit, deckRow, type DeckRow } from "./access";
import { getDeckVersions } from "./decks";
import { EditError } from "./errors";

export type ReviewKind = "employee" | "company" | "translation";
export type ReviewStatus = "for_review" | "changes_requested" | "approved" | "withdrawn";
/** What a person may review: content of employee decks, content of company decks, a language. */
export type Scope = "employee" | "company" | `lang:${string}`;

export const REQUIRED: Record<ReviewKind, number> = { employee: 1, company: 2, translation: 2 };

/** All scopes, for the People page (languages come from LANGUAGES so new ones appear by themselves). */
export const ALL_SCOPES: { scope: Scope; label: string; group: "content" | "translation" }[] = [
  { scope: "employee", label: "Employee slides and decks", group: "content" },
  { scope: "company", label: "Company-wide slides and decks", group: "content" },
  ...TARGET_LANGS.map((l) => ({ scope: `lang:${l}` as Scope, label: `${LANGUAGES[l].english} (${LANGUAGES[l].name})`, group: "translation" as const })),
];

const isAdmin = (user: SignedInUser | null) => !user || user.role === "admin";

/** Content review kind of a deck: its copies are employee decks, masters are company decks. */
export const contentKind = (row: { kind: "master" | "copy" }): ReviewKind => (row.kind === "master" ? "company" : "employee");

/** Scope a review needs. */
export const scopeFor = (kind: ReviewKind, lang?: string | null): Scope => (kind === "translation" ? `lang:${lang}` : kind);

export function hasScope(user: SignedInUser | null, scope: Scope) {
  return isAdmin(user) || (user?.reviewScopes ?? []).includes(scope);
}

/** May this person approve slides of this review? Admins yes; others need the scope. Nobody reviews what they sent. */
export function canReview(user: SignedInUser | null, review: { kind: ReviewKind; lang: string | null; requestedBy: string | null }) {
  if (!hasScope(user, scopeFor(review.kind, review.lang))) return false;
  return !user || review.requestedBy !== user.id;
}

/* ---------- reading ---------- */

export interface SlideReview { approvers: string[]; ok: boolean }
export interface ReviewSummary {
  id: string;
  kind: ReviewKind;
  lang: Lang;
  status: ReviewStatus;
  required: number;
  requestedBy: string | null;
  requestedAt: Date;
  note: string | null;
  /** Per presented slide (translation reviews: per translated slide). */
  slides: Record<string, SlideReview>;
  approvedSlides: number;
  totalSlides: number;
  /** Approvals the least-approved slide has — "1 of 2 approvals" for the deck. */
  level: number;
  /** Names of everyone who approved anything, for the list. */
  approverNames: string[];
}

/** Review state of a deck's newest published version: the content review and one per translation. */
export interface DeckReviewState {
  versionId: string | null;
  content: ReviewSummary | null;
  translations: Partial<Record<TargetLang, ReviewSummary | null>>;
  /** Layers approved on this version: "en" for content, "zh"/"th" for translations. */
  approved: Lang[];
}

const lookup = async (deckId: string) => (await getDeckVersions(deckId)).published?.slides;

/** Presented slides of a version, references resolved. */
async function presentedSlides(versionId: string) {
  const [v] = await db().select().from(deckVersions).where(eq(deckVersions.id, versionId)).limit(1);
  if (!v) return [];
  return (await resolveSlides(v.slides, lookup)).filter((s) => !s.hidden);
}

/** Which slides a review covers: all presented ones, or those carrying the language. */
const covered = (slides: SlideData[], lang: Lang) => (lang === "en" ? slides : slides.filter((s) => s.i18n?.[lang as TargetLang]));

async function summarize(review: typeof reviews.$inferSelect, slides: SlideData[]): Promise<ReviewSummary> {
  const lang = (review.lang ?? "en") as Lang;
  const rows = await db().select().from(slideApprovals).where(eq(slideApprovals.reviewId, review.id));
  const mine = covered(slides, lang);
  const out: Record<string, SlideReview> = {};
  let approved = 0;
  let level = mine.length ? Infinity : 0;
  for (const s of mine) {
    const fp = fingerprint(s, lang);
    const approvers = rows.filter((r) => r.slideId === s.id && r.fingerprint === fp).map((r) => r.userId);
    const ok = review.status === "approved" || approvers.length >= review.required;
    out[s.id] = { approvers, ok };
    if (ok) approved++;
    level = Math.min(level, approvers.length);
  }
  const ids = [...new Set(rows.map((r) => r.userId))];
  const names = ids.length ? await db().select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, ids)) : [];
  return {
    id: review.id, kind: review.kind, lang, status: review.status, required: review.required,
    requestedBy: review.requestedBy, requestedAt: review.requestedAt, note: review.note,
    slides: out, approvedSlides: approved, totalSlides: mine.length, level: Number.isFinite(level) ? level : 0,
    approverNames: names.map((u) => u.name || u.email),
  };
}

/** The newest review (any status but withdrawn) of a version for a kind/lang. */
async function reviewOf(versionId: string, kind: ReviewKind, lang: string | null) {
  const rows = await db().select().from(reviews).where(and(eq(reviews.versionId, versionId), eq(reviews.kind, kind))).orderBy(desc(reviews.requestedAt));
  return rows.find((r) => r.lang === lang && r.status !== "withdrawn") ?? null;
}

export async function reviewState(deckId: string): Promise<DeckReviewState> {
  const empty: DeckReviewState = { versionId: null, content: null, translations: {}, approved: [] };
  const row = await deckRow(deckId);
  const { published } = await getDeckVersions(deckId);
  if (!row || !published) return empty;
  const slides = (await resolveSlides(published.slides, lookup)).filter((s) => !s.hidden);
  const content = await reviewOf(published.id, contentKind(row), null);
  const state: DeckReviewState = { versionId: published.id, content: content ? await summarize(content, slides) : null, translations: {}, approved: [] };
  for (const lang of TARGET_LANGS) {
    if (!slides.some((s) => s.i18n?.[lang])) continue;
    const r = await reviewOf(published.id, "translation", lang);
    state.translations[lang] = r ? await summarize(r, slides) : null;
  }
  if (state.content?.status === "approved") state.approved.push("en");
  for (const lang of TARGET_LANGS) if (state.translations[lang]?.status === "approved") state.approved.push(lang);
  return state;
}

/** Layers approved on the newest published version ("en", "zh", …) — two queries, for pages that only need the notice. */
export async function approvedLayers(deckId: string): Promise<Lang[]> {
  const { published } = await getDeckVersions(deckId);
  if (!published) return [];
  const rows = await db().select({ kind: reviews.kind, lang: reviews.lang }).from(reviews)
    .where(and(eq(reviews.versionId, published.id), eq(reviews.status, "approved")));
  return rows.map((r) => (r.kind === "translation" ? (r.lang as Lang) : "en"));
}

/** Review events of a deck for its history page, newest first, with names. */
export async function reviewHistory(deckId: string) {
  const rows = await db().select().from(reviewEvents).where(eq(reviewEvents.deckId, deckId)).orderBy(desc(reviewEvents.createdAt));
  const ids = [...new Set(rows.map((r) => r.userId).filter((x): x is string => Boolean(x)))];
  const names = ids.length ? await db().select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, ids)) : [];
  const nameOf = new Map(names.map((u) => [u.id, u.name || u.email]));
  const versionOf = new Map<string, number>();
  const reviewIds = [...new Set(rows.map((r) => r.reviewId).filter((x): x is string => Boolean(x)))];
  if (reviewIds.length) {
    const rs = await db().select({ id: reviews.id, versionId: reviews.versionId }).from(reviews).where(inArray(reviews.id, reviewIds));
    const vs = await db().select({ id: deckVersions.id, number: deckVersions.number }).from(deckVersions).where(inArray(deckVersions.id, rs.map((r) => r.versionId)));
    const n = new Map(vs.map((v) => [v.id, v.number]));
    for (const r of rs) versionOf.set(r.id, n.get(r.versionId) ?? 0);
  }
  return rows.map((r) => ({
    id: r.id, event: r.event, by: r.userId ? nameOf.get(r.userId) ?? null : null, slideId: r.slideId, lang: r.lang, note: r.note,
    at: r.createdAt, version: r.reviewId ? versionOf.get(r.reviewId) ?? null : null,
  }));
}

/** Decks waiting for this person's review (the For review tab): open reviews in their scope, not their own requests. */
export async function reviewQueue(user: SignedInUser | null) {
  const open = await db().select({ review: reviews, deck: decks }).from(reviews).innerJoin(decks, eq(decks.id, reviews.deckId))
    .where(eq(reviews.status, "for_review")).orderBy(desc(reviews.requestedAt));
  const out: { deckId: string; title: string; kind: ReviewKind; lang: Lang; summary: ReviewSummary; requestedByName: string | null }[] = [];
  const names = new Map<string, string>();
  for (const { review, deck } of open) {
    if (!canReview(user, review)) continue;
    const slides = await presentedSlides(review.versionId);
    const summary = await summarize(review, slides);
    if (review.requestedBy && !names.has(review.requestedBy)) {
      const [u] = await db().select({ name: users.name, email: users.email }).from(users).where(eq(users.id, review.requestedBy)).limit(1);
      names.set(review.requestedBy, u?.name || u?.email || "");
    }
    out.push({ deckId: deck.id, title: deck.title, kind: review.kind, lang: summary.lang, summary, requestedByName: review.requestedBy ? names.get(review.requestedBy) ?? null : null });
  }
  return out;
}

/** May this person open the deck because it's waiting for their review? */
export async function reviewerCanView(row: DeckRow, user: SignedInUser | null) {
  if (!user) return true;
  const open = await db().select().from(reviews).where(and(eq(reviews.deckId, row.id), eq(reviews.status, "for_review")));
  return open.some((r) => canReview(user, r));
}

/* ---------- writing ---------- */

async function event(deckId: string, reviewId: string | null, ev: typeof reviewEvents.$inferInsert.event, user: SignedInUser | null, extra: { slideId?: string; lang?: string | null; note?: string | null } = {}) {
  await db().insert(reviewEvents).values({ deckId, reviewId, event: ev, userId: user?.id ?? null, slideId: extra.slideId, lang: extra.lang ?? null, note: extra.note ?? null });
}

/** Kind and language of the review a `lang` refers to on a deck: "en" → the content review. */
function target(row: DeckRow, lang: Lang): { kind: ReviewKind; lang: string | null } {
  return lang === "en" ? { kind: contentKind(row), lang: null } : { kind: "translation", lang };
}

/**
 * Send the deck's newest published version for review — its content (lang "en") or one translation.
 * Needs no unpublished changes, so what reviewers see is what will go out.
 */
export async function sendForReview(user: SignedInUser | null, deckId: string, lang: Lang = "en") {
  const row = await deckRow(deckId);
  if (!row) throw new EditError("No such deck.");
  if (!canEdit(row, user)) throw new EditError("Only people who can edit this deck can send it for review.");
  const { published, draft } = await getDeckVersions(deckId);
  if (!published) throw new EditError("Publish the deck first, then send it for review.");
  if (draft) throw new EditError("There are unpublished changes. Publish them first so reviewers see what will go out.");
  if (lang !== "en" && !isTargetLang(lang)) throw new EditError("Unknown language.");
  const t = target(row, lang);
  const slides = (await resolveSlides(published.slides, lookup)).filter((s) => !s.hidden);
  if (lang !== "en" && !slides.some((s) => s.i18n?.[lang])) throw new EditError(`This deck has no ${LANGUAGES[lang].english} translation yet.`);
  const existing = await reviewOf(published.id, t.kind, t.lang);
  if (existing?.status === "for_review") throw new EditError("This version is already waiting for review.");
  if (existing?.status === "approved") throw new EditError("This version is already approved.");

  const q = db();
  const [review] = await q.insert(reviews).values({
    deckId, versionId: published.id, kind: t.kind, lang: t.lang, required: REQUIRED[t.kind], requestedBy: user?.id ?? null,
  }).returning();
  await event(deckId, review.id, "sent", user, { lang: t.lang });

  // Carry over approvals from the deck's previous review of this kind for slides whose content didn't change.
  const previous = await q.select().from(reviews).where(and(eq(reviews.deckId, deckId), eq(reviews.kind, t.kind))).orderBy(desc(reviews.requestedAt));
  const prev = previous.find((r) => r.id !== review.id && r.lang === t.lang);
  if (prev) {
    const old = await q.select().from(slideApprovals).where(eq(slideApprovals.reviewId, prev.id));
    const keep = old.filter((a) => covered(slides, lang).some((s) => s.id === a.slideId && fingerprint(s, lang) === a.fingerprint && a.userId !== user?.id));
    if (keep.length) await q.insert(slideApprovals).values(keep.map((a) => ({ reviewId: review.id, slideId: a.slideId, userId: a.userId, fingerprint: a.fingerprint }))).onConflictDoNothing();
  }
  await settle(review.id, deckId, slides, lang, user);
  return review;
}

/** Approved when every covered slide has enough approvers. */
async function settle(reviewId: string, deckId: string, slides: SlideData[], lang: Lang, user: SignedInUser | null) {
  const [review] = await db().select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!review || review.status !== "for_review") return review;
  const summary = await summarize(review, slides);
  if (summary.totalSlides && summary.approvedSlides === summary.totalSlides) {
    await db().update(reviews).set({ status: "approved", resolvedAt: new Date() }).where(eq(reviews.id, reviewId));
    await event(deckId, reviewId, "approved", user, { lang: review.lang });
    return { ...review, status: "approved" as const };
  }
  return review;
}

/** The open review a person is acting on, with the version's presented slides. */
async function openReview(user: SignedInUser | null, deckId: string, lang: Lang) {
  const row = await deckRow(deckId);
  if (!row) throw new EditError("No such deck.");
  const { published } = await getDeckVersions(deckId);
  if (!published) throw new EditError("Nothing published to review.");
  const t = target(row, lang);
  const review = await reviewOf(published.id, t.kind, t.lang);
  if (!review || review.status !== "for_review") throw new EditError(lang === "en" ? "This deck isn't waiting for review." : `The ${LANGUAGES[lang].english} translation isn't waiting for review.`);
  if (!canReview(user, review)) {
    throw new EditError(user && review.requestedBy === user.id ? "You sent this for review, so someone else has to approve it."
      : lang === "en" ? "You're not set up to review this kind of deck (People → Can review)." : `You're not set up to review ${LANGUAGES[lang].english} translations (People → Can review).`);
  }
  const slides = (await resolveSlides(published.slides, lookup)).filter((s) => !s.hidden);
  return { row, review, slides };
}

export async function approveSlide(user: SignedInUser | null, deckId: string, slideId: string, lang: Lang = "en") {
  const { review, slides } = await openReview(user, deckId, lang);
  const slide = covered(slides, lang).find((s) => s.id === slideId);
  if (!slide) throw new EditError(lang === "en" ? "That slide isn't part of this review." : `That slide has no ${LANGUAGES[lang].english} translation.`);
  if (!user) throw new EditError("Sign in to approve.");
  await db().insert(slideApprovals).values({ reviewId: review.id, slideId, userId: user.id, fingerprint: fingerprint(slide, lang) }).onConflictDoNothing();
  await event(deckId, review.id, "slide_approved", user, { slideId, lang: review.lang });
  return settle(review.id, deckId, slides, lang, user);
}

/** Approve every covered slide at once. */
export async function approveDeck(user: SignedInUser | null, deckId: string, lang: Lang = "en") {
  const { review, slides } = await openReview(user, deckId, lang);
  if (!user) throw new EditError("Sign in to approve.");
  const mine = covered(slides, lang);
  if (mine.length) {
    await db().insert(slideApprovals).values(mine.map((s) => ({ reviewId: review.id, slideId: s.id, userId: user.id, fingerprint: fingerprint(s, lang) }))).onConflictDoNothing();
  }
  await event(deckId, review.id, "deck_approved", user, { lang: review.lang });
  return settle(review.id, deckId, slides, lang, user);
}

export async function requestChanges(user: SignedInUser | null, deckId: string, lang: Lang, note: string) {
  const { review } = await openReview(user, deckId, lang);
  const text = note.trim().slice(0, 500);
  if (!text) throw new EditError("Say what should change.");
  await db().update(reviews).set({ status: "changes_requested", resolvedAt: new Date(), note: text }).where(eq(reviews.id, review.id));
  await event(deckId, review.id, "changes_requested", user, { lang: review.lang, note: text });
}

/** Admins: approve regardless of the number of approvals (recorded as an override). */
export async function approveForEveryone(user: SignedInUser | null, deckId: string, lang: Lang, note?: string) {
  if (user && user.role !== "admin") throw new EditError("Only admins can approve for everyone.");
  const row = await deckRow(deckId);
  if (!row) throw new EditError("No such deck.");
  const { published } = await getDeckVersions(deckId);
  if (!published) throw new EditError("Nothing published to approve.");
  const t = target(row, lang);
  if (lang !== "en") {
    const slides = (await resolveSlides(published.slides, lookup)).filter((s) => !s.hidden);
    if (!slides.some((s) => s.i18n?.[lang as TargetLang])) throw new EditError(`This deck has no ${LANGUAGES[lang].english} translation yet.`);
  }
  let review = await reviewOf(published.id, t.kind, t.lang);
  if (review?.status === "approved") throw new EditError("Already approved.");
  if (!review || review.status !== "for_review") {
    [review] = await db().insert(reviews).values({ deckId, versionId: published.id, kind: t.kind, lang: t.lang, required: REQUIRED[t.kind], requestedBy: user?.id ?? null }).returning();
    await event(deckId, review.id, "sent", user, { lang: t.lang });
  }
  await db().update(reviews).set({ status: "approved", resolvedAt: new Date(), note: note?.trim() || null }).where(eq(reviews.id, review.id));
  await event(deckId, review.id, "override", user, { lang: t.lang, note: note?.trim() || null });
}

export async function withdrawReview(user: SignedInUser | null, deckId: string, lang: Lang) {
  const row = await deckRow(deckId);
  if (!row || !canEdit(row, user)) throw new EditError("Only people who can edit this deck can withdraw its review.");
  const { published } = await getDeckVersions(deckId);
  if (!published) return;
  const t = target(row, lang);
  const review = await reviewOf(published.id, t.kind, t.lang);
  if (!review || review.status !== "for_review") throw new EditError("Nothing is waiting for review.");
  await db().update(reviews).set({ status: "withdrawn", resolvedAt: new Date() }).where(eq(reviews.id, review.id));
  await event(deckId, review.id, "withdrawn", user, { lang: t.lang });
}

/** Admins: an approved employee deck becomes a company deck (master). Its slides become approved blocks. */
export async function promoteDeck(user: SignedInUser | null, deckId: string) {
  if (user && user.role !== "admin") throw new EditError("Only admins can promote a deck to a company deck.");
  const row = await deckRow(deckId);
  if (!row) throw new EditError("No such deck.");
  if (row.kind === "master") throw new EditError("This is already a company deck.");
  const state = await reviewState(deckId);
  if (!state.approved.includes("en")) throw new EditError("The deck has to be approved before it can be promoted.");
  const { draft } = await getDeckVersions(deckId);
  if (draft) throw new EditError("There are unpublished changes. Publish or discard them first.");
  await db().update(decks).set({ kind: "master", ownerId: null, archivedAt: null }).where(eq(decks.id, deckId));
  await event(deckId, state.content?.id ?? null, "promoted", user);
}
