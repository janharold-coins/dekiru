/**
 * Departments (Legal, Sales, Training…): one list, kept by admins on the People page. Each person belongs to
 * one; decks are tagged with any number of them. Tags belong to the deck, not a version, so changing them
 * never makes a new version or review.
 */
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db, hasDb, type Db } from "@/db/client";
import { deckTags, departments, users } from "@/db/schema";
import type { SignedInUser } from "./auth";
import { EditError } from "./errors";

export interface Department { id: string; name: string }

/** Shown to the person as is (the Claude connector and the app treat EditError as a plain message). */
export class DepartmentError extends EditError {}

const adminOnly = (actor: SignedInUser | null, what: string) => {
  if (actor && actor.role !== "admin") throw new DepartmentError(`Only admins can ${what}`);
};

const clean = (name: string) => name.trim().replace(/\s+/g, " ");

/** Every department, A–Z. Empty without a database. */
export async function listDepartments(): Promise<Department[]> {
  if (!hasDb()) return [];
  return db().select({ id: departments.id, name: departments.name }).from(departments).orderBy(asc(sql`lower(${departments.name})`));
}

/** Names are unique ignoring case, so "Legal" and "legal" can't both exist. */
async function checkName(name: string, except?: string) {
  if (!name) throw new DepartmentError("A department needs a name.");
  if (name.length > 40) throw new DepartmentError("Keep the name under 40 characters.");
  const [clash] = await db().select({ id: departments.id, name: departments.name }).from(departments).where(sql`lower(${departments.name}) = lower(${name})`).limit(1);
  if (clash && clash.id !== except) throw new DepartmentError(`There's already a department called "${clash.name}".`);
}

export async function addDepartment(actor: SignedInUser | null, name: string) {
  adminOnly(actor, "add departments");
  const n = clean(name);
  await checkName(n);
  const [d] = await db().insert(departments).values({ name: n }).returning({ id: departments.id, name: departments.name });
  return d;
}

/** Renaming keeps everyone's department and every deck's tag. */
export async function renameDepartment(actor: SignedInUser | null, id: string, name: string) {
  adminOnly(actor, "rename departments");
  const n = clean(name);
  await checkName(n, id);
  await db().update(departments).set({ name: n }).where(eq(departments.id, id));
}

/** Removing a department clears it from people and takes the tag off every deck. */
export async function deleteDepartment(actor: SignedInUser | null, id: string) {
  adminOnly(actor, "remove departments");
  await db().delete(departments).where(eq(departments.id, id));
}

/** Admins only. null = no department. */
export async function setDepartment(actor: SignedInUser | null, userId: string, departmentId: string | null) {
  adminOnly(actor, "change departments");
  await db().update(users).set({ departmentId }).where(eq(users.id, userId));
}

/** Tags of each deck, by deck id (A–Z). Decks without tags are absent. */
export async function tagsOf(ids: string[], q: Db = db()): Promise<Map<string, Department[]>> {
  const out = new Map<string, Department[]>();
  if (!hasDb() || !ids.length) return out;
  const rows = await q.select({ deckId: deckTags.deckId, id: departments.id, name: departments.name })
    .from(deckTags).innerJoin(departments, eq(departments.id, deckTags.departmentId))
    .where(inArray(deckTags.deckId, ids)).orderBy(asc(sql`lower(${departments.name})`));
  for (const r of rows) out.set(r.deckId, [...(out.get(r.deckId) ?? []), { id: r.id, name: r.name }]);
  return out;
}

/**
 * Departments by id or name (case-insensitive), for tools that take names. Unknown ones are an error that
 * lists what exists, so Claude can pick again rather than invent a tag.
 */
export async function resolveDepartments(refs: string[]): Promise<Department[]> {
  const all = await listDepartments();
  const found: Department[] = [];
  const missing: string[] = [];
  for (const r of refs) {
    const d = all.find((x) => x.id === r || x.name.toLowerCase() === r.trim().toLowerCase());
    if (d) { if (!found.includes(d)) found.push(d); } else missing.push(r);
  }
  if (missing.length) {
    throw new DepartmentError(`No department called ${missing.map((m) => `"${m}"`).join(", ")}. ${all.length ? `Departments: ${all.map((d) => d.name).join(", ")}.` : "No departments have been set up yet (admins add them on the People page)."}`);
  }
  return found;
}

/** Replace a deck's tags. Callers check the person may edit the deck. */
export async function writeDeckTags(deckId: string, departmentIds: string[], q: Db = db()) {
  await q.delete(deckTags).where(eq(deckTags.deckId, deckId));
  const ids = [...new Set(departmentIds)];
  if (ids.length) await q.insert(deckTags).values(ids.map((departmentId) => ({ deckId, departmentId })));
}

/** How many people and decks use each department, by id: the People page warns before removing one. */
export async function departmentUsage(): Promise<Record<string, { people: number; decks: number }>> {
  if (!hasDb()) return {};
  const [people, tagged] = await Promise.all([
    db().select({ id: users.departmentId, n: sql<number>`count(*)`.mapWith(Number) }).from(users).groupBy(users.departmentId),
    db().select({ id: deckTags.departmentId, n: sql<number>`count(*)`.mapWith(Number) }).from(deckTags).groupBy(deckTags.departmentId),
  ]);
  const out: Record<string, { people: number; decks: number }> = {};
  for (const r of people) if (r.id) out[r.id] = { people: r.n, decks: 0 };
  for (const r of tagged) out[r.id] = { people: out[r.id]?.people ?? 0, decks: r.n };
  return out;
}
