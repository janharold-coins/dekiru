/**
 * Sync master decks from the Figma build. Runs automatically with `npm run dev` / `npm run build`;
 * run it by hand only to overwrite masters that were edited in the app:
 *
 *   npm run db:seed -- --force
 */
import { hasDb, MISSING_DB_HELP } from "@/db/client";
import { seedMasters } from "@/db/seed";

async function main() {
  try { process.loadEnvFile(".env.local"); } catch { /* env may come from the shell */ }
  if (!hasDb()) { console.error(`\n${MISSING_DB_HELP}\n`); process.exit(1); }
  await seedMasters({ force: process.argv.includes("--force") });
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
