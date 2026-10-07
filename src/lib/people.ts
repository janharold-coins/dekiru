import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { role as roleEnum, users } from "@/db/schema";
import type { Role, SignedInUser } from "./auth";

export const ROLES = roleEnum.enumValues as readonly Role[];

export async function listPeople() {
  return db().select({ id: users.id, email: users.email, name: users.name, image: users.image, role: users.role, createdAt: users.createdAt })
    .from(users).orderBy(sql`case ${users.role} when 'admin' then 0 when 'manager' then 1 else 2 end`, users.createdAt);
}

/** Admins only. There must always be at least one admin. */
export async function setRole(actor: SignedInUser | null, userId: string, next: Role) {
  if (actor && actor.role !== "admin") throw new Error("Only admins can change roles");
  if (!ROLES.includes(next)) throw new Error("Unknown role");
  if (next !== "admin") {
    const [{ others }] = await db().select({ others: sql<number>`count(*)`.mapWith(Number) }).from(users)
      .where(and(eq(users.role, "admin"), ne(users.id, userId)));
    if (others === 0) throw new Error("There has to be at least one admin. Make someone else admin first.");
  }
  await db().update(users).set({ role: next }).where(eq(users.id, userId));
}
