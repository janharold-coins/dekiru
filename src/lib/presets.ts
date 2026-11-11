/**
 * Design token sets in the database (called "presets" in the code: typography or colours, see src/deck/presets.ts): list, read,
 * draft → publish, history, restore. Works like themes (./themes.ts): decks use a preset's newest published
 * version; the editor works on its draft. Who may see and edit them: Studio reviewers (admins always can).
 */
import { and, desc, eq, isNull, max, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db, hasDb } from "@/db/client";
import { presets, presetVersions, users } from "@/db/schema";
import {
  DEFAULT_COLORS, DEFAULT_TYPOGRAPHY, PRESET_KINDS, checkPreset, normalizePreset,
  type AppliedPresets, type DeckPresets, type PresetKind, type PresetTokens,
} from "@/deck/presets";
import type { SignedInUser } from "./auth";
import { canUseStudio } from "./studio";
import type { ThemeInfo } from "./themes";

export class PresetError extends Error {}

/** Presets live in the Studio: reviewers (and admins) manage them. */
export const canEditPresets = (u: SignedInUser | null) => canUseStudio(u);

function mustEdit(u: SignedInUser | null) {
  if (!canEditPresets(u)) throw new PresetError("Only Studio reviewers can change design tokens.");
}

/** The approved look as presets, one per kind: where new presets are measured from. They can't be deleted. */
export const DEFAULT_PRESETS: { id: string; kind: PresetKind; name: string; tokens: PresetTokens }[] = [
  { id: "coins-typography", kind: "typography", name: "Coins.ph", tokens: DEFAULT_TYPOGRAPHY },
  { id: "coins-colors", kind: "colors", name: "Coins.ph", tokens: DEFAULT_COLORS },
];
const isDefault = (id: string) => DEFAULT_PRESETS.some((p) => p.id === id);
const kindOrder = (k: PresetKind) => PRESET_KINDS.findIndex((x) => x.id === k);

/** Creates the approved-look presets if missing (run by scripts/prepare-db.ts, like the default theme). */
export async function seedDefaultPresets(log: (m: string) => void = console.log) {
  const q = db();
  for (const p of DEFAULT_PRESETS) {
    const [row] = await q.select({ id: presets.id }).from(presets).where(eq(presets.id, p.id)).limit(1);
    if (row) continue;
    await q.transaction(async (tx) => {
      await tx.insert(presets).values({ id: p.id, kind: p.kind, name: p.name });
      await tx.insert(presetVersions).values({
        presetId: p.id, number: 1, status: "published", tokens: normalizePreset(p.kind, p.tokens), note: "The approved Figma look", publishedAt: new Date(),
      });
    });
    log(`preset ${p.id}: created v1`);
  }
}

const isKind = (k: string): k is PresetKind => PRESET_KINDS.some((p) => p.id === k);

export interface PresetInfo { id: string; kind: PresetKind; name: string; tokens: PresetTokens; version: number }

/** Newest published version of every live preset (optionally one kind), in one query. */
export async function publishedPresets(kind?: PresetKind): Promise<PresetInfo[]> {
  if (!hasDb()) return [];
  const rows = await db()
    .selectDistinctOn([presetVersions.presetId], { id: presets.id, kind: presets.kind, name: presets.name, tokens: presetVersions.tokens, version: presetVersions.number })
    .from(presetVersions)
    .innerJoin(presets, eq(presets.id, presetVersions.presetId))
    .where(and(eq(presetVersions.status, "published"), isNull(presets.archivedAt), kind ? eq(presets.kind, kind) : undefined))
    .orderBy(presetVersions.presetId, desc(presetVersions.number));
  return rows
    .map((r) => ({ ...r, tokens: normalizePreset(r.kind, r.tokens) }))
    // Typography first, then colours; the Coins.ph preset first within each, then A–Z.
    .sort((a, b) => kindOrder(a.kind) - kindOrder(b.kind) || Number(isDefault(b.id)) - Number(isDefault(a.id)) || a.name.localeCompare(b.name));
}

async function versionsOf(presetId: string) {
  const q = db();
  const [published] = await q.select().from(presetVersions)
    .where(and(eq(presetVersions.presetId, presetId), eq(presetVersions.status, "published")))
    .orderBy(desc(presetVersions.number)).limit(1);
  const [draft] = await q.select().from(presetVersions)
    .where(and(eq(presetVersions.presetId, presetId), eq(presetVersions.status, "draft"))).limit(1);
  return { published, draft };
}

async function liveRow(id: string) {
  const [row] = await db().select().from(presets).where(eq(presets.id, id)).limit(1);
  if (!row || row.archivedAt) throw new PresetError(`No design token set "${id}".`);
  return row;
}

/** One preset for the editor: its draft if there is one, else the published version. */
export async function presetForEditor(id: string) {
  const [row] = await db().select().from(presets).where(eq(presets.id, id)).limit(1);
  if (!row || row.archivedAt) return null;
  const { published, draft } = await versionsOf(id);
  const v = draft ?? published;
  if (!v) return null;
  return {
    id: row.id, kind: row.kind, name: row.name, tokens: normalizePreset(row.kind, v.tokens), hasDraft: Boolean(draft),
    publishedVersion: published?.number ?? null, publishedTokens: published ? normalizePreset(row.kind, published.tokens) : null,
  };
}

export async function savePresetDraft(user: SignedInUser | null, id: string, input: { tokens?: unknown; name?: string; note?: string }) {
  mustEdit(user);
  const row = await liveRow(id);
  const q = db();
  if (input.name != null) {
    const name = input.name.trim();
    if (!name) throw new PresetError("A set needs a name.");
    await q.update(presets).set({ name }).where(eq(presets.id, id));
  }
  if (input.tokens === undefined) return;
  const bad = checkPreset(row.kind, input.tokens);
  if (bad.length) throw new PresetError(bad.join(" "));
  const tokens = normalizePreset(row.kind, input.tokens);
  await q.transaction(async (tx) => {
    const [draft] = await tx.select().from(presetVersions).where(and(eq(presetVersions.presetId, id), eq(presetVersions.status, "draft"))).limit(1);
    if (draft) { await tx.update(presetVersions).set({ tokens, note: input.note ?? draft.note }).where(eq(presetVersions.id, draft.id)); return; }
    const [{ n }] = await tx.select({ n: max(presetVersions.number) }).from(presetVersions).where(eq(presetVersions.presetId, id));
    await tx.insert(presetVersions).values({ presetId: id, number: (n ?? 0) + 1, status: "draft", tokens, note: input.note ?? "Edited in Dekiru", createdBy: user?.id ?? null });
  });
}

/** The draft becomes the preset's live version: every deck using it updates; share links don't. */
export async function publishPreset(user: SignedInUser | null, id: string, note?: string) {
  mustEdit(user);
  await liveRow(id);
  const { draft } = await versionsOf(id);
  if (!draft) throw new PresetError("Nothing to publish: there are no unpublished changes.");
  await db().update(presetVersions)
    .set({ status: "published", publishedAt: new Date(), publishedBy: user?.id ?? null, ...(note ? { note } : {}) })
    .where(eq(presetVersions.id, draft.id));
  await db().update(presets).set({ updatedAt: new Date() }).where(eq(presets.id, id));
  return draft.number;
}

export async function discardPresetDraft(user: SignedInUser | null, id: string) {
  mustEdit(user);
  const { draft } = await versionsOf(id);
  if (!draft) throw new PresetError("There are no unpublished changes.");
  await db().delete(presetVersions).where(eq(presetVersions.id, draft.id));
}

export async function presetHistory(id: string) {
  const creator = alias(users, "creator");
  const publisher = alias(users, "publisher");
  return db()
    .select({
      number: presetVersions.number, status: presetVersions.status, note: presetVersions.note,
      createdAt: presetVersions.createdAt, publishedAt: presetVersions.publishedAt, tokens: presetVersions.tokens,
      createdBy: creator.name, publishedBy: publisher.name,
    })
    .from(presetVersions)
    .leftJoin(creator, eq(creator.id, presetVersions.createdBy))
    .leftJoin(publisher, eq(publisher.id, presetVersions.publishedBy))
    .where(eq(presetVersions.presetId, id))
    .orderBy(desc(presetVersions.number));
}

/** Puts an older version back as the draft (publish to make it live). */
export async function restorePresetVersion(user: SignedInUser | null, id: string, number: number) {
  mustEdit(user);
  const [v] = await db().select().from(presetVersions).where(and(eq(presetVersions.presetId, id), eq(presetVersions.number, number))).limit(1);
  if (!v) throw new PresetError(`Set "${id}" has no version ${number}.`);
  await savePresetDraft(user, id, { tokens: v.tokens, note: `Restored v${number}` });
}

/**
 * A new preset, published as v1 so decks can use it. Starts from the given tokens, or from the approved look
 * (Cns Manrope for everything; no colour changes).
 */
export async function createPreset(user: SignedInUser | null, kind: string, name: string, tokens?: unknown) {
  mustEdit(user);
  if (!isKind(kind)) throw new PresetError(`"${kind}" isn't a kind of design token set (typography, colors).`);
  const title = name.trim();
  if (!title) throw new PresetError("A set needs a name.");
  if (tokens !== undefined) {
    const bad = checkPreset(kind, tokens);
    if (bad.length) throw new PresetError(bad.join(" "));
  }
  const start = normalizePreset(kind, tokens ?? (kind === "typography" ? DEFAULT_TYPOGRAPHY : DEFAULT_COLORS));
  const slug = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || kind;
  const q = db();
  const taken = new Set((await q.select({ id: presets.id }).from(presets)).map((r) => r.id));
  let id = slug;
  for (let i = 2; taken.has(id); i++) id = `${slug}-${i}`;
  await q.transaction(async (tx) => {
    await tx.insert(presets).values({ id, kind, name: title, createdBy: user?.id ?? null });
    await tx.insert(presetVersions).values({
      presetId: id, number: 1, status: "published", tokens: start, note: "Created",
      createdBy: user?.id ?? null, publishedBy: user?.id ?? null, publishedAt: new Date(),
    });
  });
  return id;
}

/**
 * How many decks use each preset: in their newest sent version or their draft (a draft that picked a preset
 * would lose it on publish if the preset were gone).
 */
export async function presetUsage(): Promise<Record<string, number>> {
  if (!hasDb()) return {};
  const rows = await db().execute(sql`
    select p.value as preset, count(distinct v.deck_id)::int as n
    from (
      (select distinct on (deck_id) deck_id, presets from deck_versions where status = 'published' order by deck_id, number desc)
      union all
      (select deck_id, presets from deck_versions where status = 'draft')
    ) v, jsonb_each_text(coalesce(v.presets, '{}'::jsonb)) p
    group by 1`);
  return Object.fromEntries((rows.rows as { preset: string; n: number }[]).map((r) => [r.preset, r.n]));
}

/** Hide a preset from pickers. Not allowed while any deck uses it (switch those decks first). */
export async function archivePreset(user: SignedInUser | null, id: string) {
  mustEdit(user);
  if (isDefault(id)) throw new PresetError("The Coins.ph sets can't be removed.");
  await liveRow(id);
  const n = (await presetUsage())[id];
  if (n) throw new PresetError(`${n} deck(s) use this set. Switch them first.`);
  await db().update(presets).set({ archivedAt: new Date() }).where(eq(presets.id, id));
}

/* ---------- decks ---------- */

/** A deck's preset ids resolved to their live tokens. Archived or unknown ids are skipped (the theme's own look shows). */
export function resolvePresets(ids: DeckPresets | null | undefined, all: PresetInfo[]): AppliedPresets | undefined {
  if (!ids) return undefined;
  const out: AppliedPresets = {};
  for (const kind of ["typography", "colors"] as const) {
    const p = ids[kind] ? all.find((x) => x.id === ids[kind] && x.kind === kind) : undefined;
    if (p) (out as Record<PresetKind, PresetTokens>)[kind] = p.tokens;
  }
  return Object.keys(out).length ? out : undefined;
}

/** The deck's look: its theme with its presets on top. The theme itself is never changed. */
export function withPresets(theme: ThemeInfo, ids: DeckPresets | null | undefined, all: PresetInfo[]): ThemeInfo {
  const presets = resolvePresets(ids, all);
  return presets ? { ...theme, tokens: { ...theme.tokens, presets } } : theme;
}

/** Stored form: only kinds that are set; null when none. */
export function cleanDeckPresets(ids: DeckPresets | null | undefined): DeckPresets | null {
  const out: DeckPresets = {};
  for (const kind of ["typography", "colors"] as const) if (ids?.[kind]) out[kind] = ids[kind];
  return Object.keys(out).length ? out : null;
}

/** "Editorial type, Warm colours": names of a deck's live presets, for history and labels ("" when none). */
export function presetNames(ids: DeckPresets | null | undefined, all: PresetInfo[]): string {
  return (["typography", "colors"] as const)
    .map((k) => (ids?.[k] ? all.find((p) => p.id === ids[k])?.name : undefined))
    .filter(Boolean).join(", ");
}
