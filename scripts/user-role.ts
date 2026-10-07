/**
 * Change someone's role. They must have signed in once.
 *   npm run user:role -- name@coins.ph manager      (admin | manager | member)
 *   npm run user:role                               lists everyone
 */
import { eq } from "drizzle-orm";
import { db, hasDb, MISSING_DB_HELP } from "@/db/client";
import { role, users } from "@/db/schema";

async function main() {
  try { process.loadEnvFile(".env.local"); } catch { /* env may come from the shell */ }
  if (!hasDb()) { console.error(`\n${MISSING_DB_HELP}\n`); process.exit(1); }
  const [email, next] = process.argv.slice(2);
  if (email && next) {
    if (!(role.enumValues as readonly string[]).includes(next)) throw new Error(`Role must be one of ${role.enumValues.join(", ")}`);
    const rows = await db().update(users).set({ role: next as (typeof role.enumValues)[number] })
      .where(eq(users.email, email.toLowerCase())).returning();
    if (!rows.length) throw new Error(`${email} hasn't signed in yet`);
    console.log(`${email} is now ${next}`);
  }
  for (const u of await db().select().from(users).orderBy(users.createdAt)) console.log(`${u.role.padEnd(8)} ${u.email}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message ?? e); process.exit(1); });
