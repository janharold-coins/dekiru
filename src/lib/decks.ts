/**
 * The one place the app reads and writes decks.
 *
 * With DATABASE_URL set, decks come from Postgres (Neon): the newest published version of each,
 * with slide references resolved against the referenced deck's newest published version.
 * Without it, the app reads the Figma-built JSON seed directly, so it still runs with no setup.
 */
import { and, desc, eq, isNull, max } from "drizzle-orm";
import { connection } from "next/server";
import { db, hasDb, type Db } from "@/db/client";
import { deckVersions, decks } from "@/db/schema";
import { resolveSlides, snapshotSlides, type DeckLookup, type SeedSlide } from "@/content/resolve";
import { seedDecks } from "@/content/decks";
import type { Deck } from "@/deck/types";

export interface DeckInfo extends Deck {
  kind: "master" | "copy";
  /** Version number shown in the UI; absent when running from the JSON seed. */
  versionNumber?: number;
  status: "published" | "draft";
  /** True when an unpublished draft exists alongside the version shown. */
  hasDraft: boolean;
}

/** The database, or a transaction on it. */
type Q = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

/* ---------- reads ---------- */

const seedLookup: DeckLookup = (id) => seedDecks.find((d) => d.id === id)?.slides;

async function latestPublished(q: Q, deckId: string) {
  const [v] = await q
    .select()
    .from(deckVersions)
    .where(and(eq(deckVersions.deckId, deckId), eq(deckVersions.status, "published")))
    .orderBy(desc(deckVersions.number))
    .limit(1);
  return v;
}

async function draftOf(q: Q, deckId: string) {
  const [v] = await q
    .select()
    .from(deckVersions)
    .where(and(eq(deckVersions.deckId, deckId), eq(deckVersions.status, "draft")))
    .limit(1);
  return v;
}

const dbLookup = (q: Q): DeckLookup => async (id) => (await latestPublished(q, id))?.slides;

/** Every live deck, newest published version, references resolved. */
export async function listDecks(): Promise<DeckInfo[]> {
  if (!hasDb()) {
    return Promise.all(
      seedDecks.map(async (d) => ({
        ...d, kind: "master" as const, status: "published" as const, hasDraft: false,
        slides: await resolveSlides(d.slides, seedLookup),
      })),
    );
  }
  await connection(); // database reads happen per request, never at build time
  const q = db();
  const rows = await q.select().from(decks).where(isNull(decks.archivedAt)).orderBy(decks.kind, decks.createdAt);
  const out = await Promise.all(rows.map((r) => load(q, r, false)));
  return out.filter((d): d is DeckInfo => Boolean(d));
}

/** One deck. `draft: true` returns the draft when there is one (for editors), else the published version. */
export async function getDeck(id: string, opts: { draft?: boolean } = {}): Promise<DeckInfo | undefined> {
  if (!hasDb()) return (await listDecks()).find((d) => d.id === id);
  await connection();
  const q = db();
  const [row] = await q.select().from(decks).where(eq(decks.id, id)).limit(1);
  return row ? load(q, row, Boolean(opts.draft)) : undefined;
}

async function load(q: Db, row: typeof decks.$inferSelect, wantDraft: boolean): Promise<DeckInfo | undefined> {
  const [pub, draft] = await Promise.all([latestPublished(q, row.id), draftOf(q, row.id)]);
  const v = (wantDraft && draft) || pub;
  if (!v) return undefined;
  return {
    id: row.id, title: row.title, kind: row.kind,
    version: `v${v.number}`, versionNumber: v.number, status: v.status, hasDraft: Boolean(draft),
    slides: await resolveSlides(v.slides, dbLookup(q)),
  };
}

/** Newest published version and current draft of a deck, unresolved (database only). */
export async function getDeckVersions(deckId: string) {
  const q = db();
  const [published, draft] = await Promise.all([latestPublished(q, deckId), draftOf(q, deckId)]);
  return { published, draft };
}

/* ---------- writes (database only) ---------- */

export interface Actor { userId?: string | null }

/** Edits land in the deck's single draft; it is created from the newest published version if needed. */
export async function saveDraft(deckId: string, slides: SeedSlide[], who: Actor & { note?: string } = {}) {
  return db().transaction(async (tx) => {
    const existing = await draftOf(tx, deckId);
    if (existing) {
      const [v] = await tx.update(deckVersions)
        .set({ slides, note: who.note ?? existing.note })
        .where(eq(deckVersions.id, existing.id)).returning();
      return v;
    }
    const [{ n }] = await tx.select({ n: max(deckVersions.number) }).from(deckVersions).where(eq(deckVersions.deckId, deckId));
    const [v] = await tx.insert(deckVersions)
      .values({ deckId, number: (n ?? 0) + 1, status: "draft", slides, note: who.note, createdBy: who.userId ?? null })
      .returning();
    await tx.update(decks).set({ updatedAt: new Date() }).where(eq(decks.id, deckId));
    return v;
  });
}

/** The draft becomes the newest published version. Existing share links keep their own version. */
export async function publishDraft(deckId: string, who: Actor = {}) {
  return db().transaction(async (tx) => {
    const draft = await draftOf(tx, deckId);
    if (!draft) throw new Error(`Deck ${deckId} has no draft to publish`);
    const [v] = await tx.update(deckVersions)
      .set({ status: "published", publishedAt: new Date(), publishedBy: who.userId ?? null })
      .where(eq(deckVersions.id, draft.id)).returning();
    await tx.update(decks).set({ updatedAt: new Date() }).where(eq(decks.id, deckId));
    return v;
  });
}

/** Creates a deck with its first published version (used by the seed and by "new deck"). */
export async function createDeck(
  input: {
    id: string; title: string; kind: "master" | "copy"; slides: SeedSlide[]; note?: string;
    copiedFromDeckId?: string; copiedFromVersionId?: string;
  },
  who: Actor = {},
) {
  return db().transaction(async (tx) => {
    await tx.insert(decks).values({
      id: input.id, title: input.title, kind: input.kind, ownerId: input.kind === "copy" ? who.userId ?? null : null,
      copiedFromDeckId: input.copiedFromDeckId, copiedFromVersionId: input.copiedFromVersionId,
    });
    const [v] = await tx.insert(deckVersions).values({
      deckId: input.id, number: 1, status: "published", slides: input.slides, note: input.note,
      createdBy: who.userId ?? null, publishedAt: new Date(), publishedBy: who.userId ?? null,
    }).returning();
    return v;
  });
}

/** A personal copy: a snapshot of the source's newest published version. Master edits don't reach it. */
export async function copyDeck(sourceId: string, input: { id: string; title: string }, who: Actor = {}) {
  const q = db();
  const src = await latestPublished(q, sourceId);
  if (!src) throw new Error(`Deck ${sourceId} has no published version`);
  const slides = await snapshotSlides(src.slides, dbLookup(q));
  return createDeck({
    ...input, kind: "copy", slides, note: `Copied from ${sourceId} v${src.number}`,
    copiedFromDeckId: sourceId, copiedFromVersionId: src.id,
  }, who);
}
