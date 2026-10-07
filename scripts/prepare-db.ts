/**
 * Runs before `npm run dev` and `npm run build`, so nobody has to remember database steps:
 *   1. apply any new migrations in drizzle/ (already-applied ones are skipped)
 *   2. sync master decks from the Figma build (see src/db/seed.ts)
 *
 * No database configured → skips quietly. On Vercel a failure stops the build, so a deployment never
 * runs against a database it doesn't match; locally it only warns, so you can still work offline.
 */
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, hasDb } from "@/db/client";
import { seedMasters } from "@/db/seed";

async function main() {
  try { process.loadEnvFile(".env.local"); } catch { /* env may come from the shell (Vercel) */ }
  if (!hasDb()) { console.log("[db] no DATABASE_URL — skipping migrations (app reads the JSON decks)"); return; }
  const t = Date.now();
  await migrate(db(), { migrationsFolder: "drizzle" });
  await seedMasters({ log: (m) => console.log(`[db] ${m}`) });
  console.log(`[db] ready (${Date.now() - t} ms)`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    const cause = e?.cause?.message ?? e?.cause?.code ?? e?.message ?? String(e);
    console.error(`[db] Couldn't prepare the database: ${cause}`);
    if (process.env.VERCEL) process.exit(1); // stop the deploy; the live site keeps the previous version
    console.error("[db] Starting anyway — pages that need the database won't load until it's reachable.");
    process.exit(0);
  });
