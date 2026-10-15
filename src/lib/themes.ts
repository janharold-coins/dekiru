/**
 * Themes in the database: list, read, draft → publish, history, restore.
 * Decks use a theme's newest published version; the editor works on its draft.
 * Who may edit: admins, and people given "Can edit themes" on the People page.
 */
import { and, desc, eq, inArray, isNull, max, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, hasDb } from "@/db/client";
import { deckVersions, themes, themeVersions, users } from "@/db/schema";
import { DEFAULT_THEME_ID, DEFAULT_TOKENS, checkTheme, normalizeTokens, type ThemeTokens } from "@/deck/theme";
import type { SignedInUser } from "./auth";

export class ThemeError extends Error {}

export const canEditThemes = (u: SignedInUser | null) => !u || u.role === "admin" || Boolean(u.canEditThemes);

function mustEdit(u: SignedInUser | null) {
  if (!canEditThemes(u)) throw new ThemeError("Only admins and people with theme access can change themes.");
}

export interface ThemeInfo { id: string; name: string; tokens: ThemeTokens; version: number | null }

export const DEFAULT_THEME: ThemeInfo = { id: DEFAULT_THEME_ID, name: "Coins.ph", tokens: DEFAULT_TOKENS, version: null };

/** Creates the default theme from the approved look if it doesn't exist (run by scripts/prepare-db.ts). */
export async function seedDefaultTheme(log: (m: string) => void = console.log) {
  const q = db();
  const [row] = await q.select().from(themes).where(eq(themes.id, DEFAULT_THEME_ID)).limit(1);
  if (row) return;
  await q.transaction(async (tx) => {
    await tx.insert(themes).values({ id: DEFAULT_THEME_ID, name: DEFAULT_THEME.name });
    await tx.insert(themeVersions).values({
      themeId: DEFAULT_THEME_ID, number: 1, status: "published", tokens: DEFAULT_TOKENS, note: "The approved Figma look", publishedAt: new Date(),
    });
  });
  log(`theme ${DEFAULT_THEME_ID}: created v1`);
}

/** Newest published version of every live theme, in one query. */
export async function publishedThemes(): Promise<ThemeInfo[]> {
  if (!hasDb()) return [DEFAULT_THEME];
  const q = db();
  const rows = await q
    .selectDistinctOn([themeVersions.themeId], { id: themes.id, name: themes.name, tokens: themeVersions.tokens, version: themeVersions.number })
    .from(themeVersions)
    .innerJoin(themes, eq(themes.id, themeVersions.themeId))
    .where(and(eq(themeVersions.status, "published"), isNull(themes.archivedAt)))
    .orderBy(themeVersions.themeId, desc(themeVersions.number));
  const out: ThemeInfo[] = rows.map((r) => ({ ...r, tokens: normalizeTokens(r.tokens) }));
  if (!out.some((t) => t.id === DEFAULT_THEME_ID)) out.unshift(DEFAULT_THEME);
  return out.sort((a, b) => (a.id === DEFAULT_THEME_ID ? -1 : b.id === DEFAULT_THEME_ID ? 1 : a.name.localeCompare(b.name)));
}

/** The look for a deck version's theme id (null → default). */
export function pickTheme(all: ThemeInfo[], id: string | null | undefined): ThemeInfo {
  return all.find((t) => t.id === (id ?? DEFAULT_THEME_ID)) ?? all.find((t) => t.id === DEFAULT_THEME_ID) ?? DEFAULT_THEME;
}

async function versionsOf(themeId: string) {
  const q = db();
  const [published] = await q.select().from(themeVersions)
    .where(and(eq(themeVersions.themeId, themeId), eq(themeVersions.status, "published")))
    .orderBy(desc(themeVersions.number)).limit(1);
  const [draft] = await q.select().from(themeVersions)
    .where(and(eq(themeVersions.themeId, themeId), eq(themeVersions.status, "draft"))).limit(1);
  return { published, draft };
}

/** One theme for the editor: its draft if there is one, else the published version. */
export async function themeForEditor(id: string) {
  const [row] = await db().select().from(themes).where(eq(themes.id, id)).limit(1);
  if (!row || row.archivedAt) return null;
  const { published, draft } = await versionsOf(id);
  const v = draft ?? published;
  if (!v) return null;
  return {
    id: row.id, name: row.name, tokens: normalizeTokens(v.tokens), hasDraft: Boolean(draft),
    publishedVersion: published?.number ?? null, publishedTokens: published ? normalizeTokens(published.tokens) : null,
  };
}

/** How many decks use each theme in their newest published version or draft. */
export async function themeUsage(): Promise<Record<string, number>> {
  if (!hasDb()) return {};
  const rows = await db().execute(sql`
    select coalesce(theme_id, ${DEFAULT_THEME_ID}) as theme, count(distinct deck_id)::int as n
    from (
      select distinct on (deck_id) deck_id, theme_id from deck_versions
      where status = 'published' order by deck_id, number desc
    ) latest group by 1`);
  return Object.fromEntries((rows.rows as { theme: string; n: number }[]).map((r) => [r.theme, r.n]));
}

export async function saveThemeDraft(user: SignedInUser | null, id: string, input: { tokens?: ThemeTokens; name?: string; note?: string }) {
  mustEdit(user);
  const q = db();
  const [row] = await q.select().from(themes).where(eq(themes.id, id)).limit(1);
  if (!row || row.archivedAt) throw new ThemeError(`No theme "${id}".`);
  if (input.name != null) {
    const name = input.name.trim();
    if (!name) throw new ThemeError("A theme needs a name.");
    await q.update(themes).set({ name }).where(eq(themes.id, id));
  }
  if (!input.tokens) return;
  const tokens = normalizeTokens(input.tokens);
  const bad = checkTheme(tokens).filter((p) => /isn't a 6-digit|between/.test(p.message));
  if (bad.length) throw new ThemeError(bad.map((b) => b.message).join(" "));
  await q.transaction(async (tx) => {
    const [draft] = await tx.select().from(themeVersions).where(and(eq(themeVersions.themeId, id), eq(themeVersions.status, "draft"))).limit(1);
    if (draft) { await tx.update(themeVersions).set({ tokens, note: input.note ?? draft.note }).where(eq(themeVersions.id, draft.id)); return; }
    const [{ n }] = await tx.select({ n: max(themeVersions.number) }).from(themeVersions).where(eq(themeVersions.themeId, id));
    await tx.insert(themeVersions).values({ themeId: id, number: (n ?? 0) + 1, status: "draft", tokens, note: input.note ?? "Edited in Dekiru", createdBy: user?.id ?? null });
  });
}

/** The draft becomes the theme's live version: every deck using the theme updates; share links don't. */
export async function publishTheme(user: SignedInUser | null, id: string, note?: string) {
  mustEdit(user);
  const { draft } = await versionsOf(id);
  if (!draft) throw new ThemeError("Nothing to publish: there are no unpublished changes.");
  await db().update(themeVersions)
    .set({ status: "published", publishedAt: new Date(), publishedBy: user?.id ?? null, ...(note ? { note } : {}) })
    .where(eq(themeVersions.id, draft.id));
  await db().update(themes).set({ updatedAt: new Date() }).where(eq(themes.id, id));
  return draft.number;
}

export async function discardThemeDraft(user: SignedInUser | null, id: string) {
  mustEdit(user);
  const { draft } = await versionsOf(id);
  if (!draft) throw new ThemeError("There are no unpublished changes.");
  await db().delete(themeVersions).where(eq(themeVersions.id, draft.id));
}

export async function themeHistory(id: string) {
  const creator = alias(users, "creator");
  const publisher = alias(users, "publisher");
  return db()
    .select({
      number: themeVersions.number, status: themeVersions.status, note: themeVersions.note,
      createdAt: themeVersions.createdAt, publishedAt: themeVersions.publishedAt, tokens: themeVersions.tokens,
      createdBy: creator.name, publishedBy: publisher.name,
    })
    .from(themeVersions)
    .leftJoin(creator, eq(creator.id, themeVersions.createdBy))
    .leftJoin(publisher, eq(publisher.id, themeVersions.publishedBy))
    .where(eq(themeVersions.themeId, id))
    .orderBy(desc(themeVersions.number));
}

/** Puts an older version's look back as the draft (publish to make it live). */
export async function restoreThemeVersion(user: SignedInUser | null, id: string, number: number) {
  mustEdit(user);
  const [v] = await db().select().from(themeVersions).where(and(eq(themeVersions.themeId, id), eq(themeVersions.number, number))).limit(1);
  if (!v) throw new ThemeError(`Theme "${id}" has no version ${number}.`);
  await saveThemeDraft(user, id, { tokens: v.tokens, note: `Restored v${number}` });
}

/** A new theme, starting from another theme's live look. Published as v1 so decks can use it. */
export async function createTheme(user: SignedInUser | null, name: string, fromId: string = DEFAULT_THEME_ID) {
  mustEdit(user);
  const title = name.trim();
  if (!title) throw new ThemeError("A theme needs a name.");
  const base = pickTheme(await publishedThemes(), fromId);
  const slug = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "theme";
  const q = db();
  const taken = new Set((await q.select({ id: themes.id }).from(themes)).map((r) => r.id));
  let id = slug;
  for (let i = 2; taken.has(id); i++) id = `${slug}-${i}`;
  await q.transaction(async (tx) => {
    await tx.insert(themes).values({ id, name: title, createdBy: user?.id ?? null });
    await tx.insert(themeVersions).values({
      themeId: id, number: 1, status: "published", tokens: base.tokens, note: `Started from ${base.name}`,
      createdBy: user?.id ?? null, publishedBy: user?.id ?? null, publishedAt: new Date(),
    });
  });
  return id;
}

/** Hide a theme from pickers. Not allowed while decks use it, or for the default theme. */
export async function archiveTheme(user: SignedInUser | null, id: string) {
  mustEdit(user);
  if (id === DEFAULT_THEME_ID) throw new ThemeError("The Coins.ph theme can't be removed.");
  const usage = await themeUsage();
  if (usage[id]) throw new ThemeError(`${usage[id]} deck(s) use this theme. Switch them first.`);
  const drafts = await db().select({ id: deckVersions.id }).from(deckVersions)
    .where(and(eq(deckVersions.status, "draft"), inArray(deckVersions.themeId, [id]))).limit(1);
  if (drafts.length) throw new ThemeError("A deck's unpublished draft uses this theme. Switch it first.");
  await db().update(themes).set({ archivedAt: new Date() }).where(eq(themes.id, id));
}
