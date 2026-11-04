/**
 * UI library decisions: a coded component keeps every Figma source it has been matched to (declared in
 * src/ui/registry.ts), and people decide on /ui/library which one is canonical and which are retired. Decisions
 * live in ui_source_decisions (migration 0017) and override the declared statuses; without a database the
 * declared statuses stand.
 */
import { desc, eq } from "drizzle-orm";
import { db, hasDb } from "@/db/client";
import { uiSourceDecisions } from "@/db/schema";
import { ui, type UiEntry } from "@/ui/registry";
import type { FigmaSource } from "@/ui/types";
import { canUseStudio } from "./studio";
import type { SignedInUser } from "./auth";

export class UiLibraryError extends Error {}

/** Stable identity of a source: library, set and the best key it has. */
export const sourceKey = (s: FigmaSource) => [s.library, s.set, s.setKey ?? s.libraryNode ?? s.mainNode ?? ""].join("|");

export type Decision = { componentId: string; sourceKey: string; status: FigmaSource["status"]; note: string | null; createdAt: Date };

/** Newest decision per (component, source). */
export async function decisions(): Promise<Map<string, Decision>> {
  const out = new Map<string, Decision>();
  if (!hasDb()) return out;
  const rows = await db().select().from(uiSourceDecisions).orderBy(desc(uiSourceDecisions.createdAt));
  for (const r of rows) {
    const k = `${r.componentId}|${r.sourceKey}`;
    if (!out.has(k)) out.set(k, { componentId: r.componentId, sourceKey: r.sourceKey, status: r.status as FigmaSource["status"], note: r.note, createdAt: r.createdAt });
  }
  return out;
}

/** The registry with decisions applied to each entry's sources. */
export async function libraryWithDecisions(): Promise<Record<string, UiEntry>> {
  const d = await decisions();
  const out: Record<string, UiEntry> = {};
  for (const [id, e] of Object.entries(ui)) {
    const sources = e.figma.sources.map((s) => {
      const dec = d.get(`${id}|${sourceKey(s)}`);
      return dec ? { ...s, status: dec.status, note: dec.note ?? s.note, decidedAt: dec.createdAt } : s;
    });
    // Exactly one canonical: a decision that makes one source canonical demotes the declared one.
    const canon = sources.filter((s) => s.status === "canonical");
    if (canon.length > 1) {
      const chosen = canon.find((s) => d.get(`${id}|${sourceKey(s)}`)?.status === "canonical") ?? canon[0];
      for (const s of sources) if (s.status === "canonical" && s !== chosen) s.status = "candidate";
    }
    out[id] = { ...e, figma: { ...e.figma, sources } };
  }
  return out;
}

export async function decide(u: SignedInUser | null, componentId: string, key: string, status: FigmaSource["status"], note: string) {
  if (!canUseStudio(u)) throw new UiLibraryError("Only Studio users can decide on sources.");
  if (!hasDb()) throw new UiLibraryError("No database: decisions can't be saved here.");
  const e = ui[componentId];
  if (!e) throw new UiLibraryError(`No component "${componentId}".`);
  const src = e.figma.sources.find((s) => sourceKey(s) === key);
  if (!src) throw new UiLibraryError("That source isn't on this component.");
  if (!["canonical", "candidate", "retired"].includes(status)) throw new UiLibraryError("Unknown status.");
  const rows: (typeof uiSourceDecisions.$inferInsert)[] = [{ componentId, sourceKey: key, status, note: note.trim() || null, byId: u?.id ?? null }];
  if (status === "canonical") {
    // Demote whatever is canonical now, declared or decided.
    const current = (await libraryWithDecisions())[componentId].figma.sources.filter((s) => s.status === "canonical" && sourceKey(s) !== key);
    for (const s of current) rows.push({ componentId, sourceKey: sourceKey(s), status: "candidate", note: `Was canonical until ${src.set} (${src.library}) was picked`, byId: u?.id ?? null });
  }
  await db().insert(uiSourceDecisions).values(rows);
}

export const decisionHistory = async (componentId: string) =>
  hasDb() ? db().select().from(uiSourceDecisions).where(eq(uiSourceDecisions.componentId, componentId)).orderBy(desc(uiSourceDecisions.createdAt)) : [];
