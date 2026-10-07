import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

/** Neon's Vercel integration sets DATABASE_URL (and POSTGRES_URL as an alias). */
export const databaseUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || "";

export const MISSING_DB_HELP =
  "No DATABASE_URL found. In Vercel: Storage → your Neon database → Connected Projects → make sure the dekiru project " +
  "is connected with the Development environment ticked. Then run `npx vercel env pull .env.local` again.";

/** True when a database URL is set (Neon, or a local Postgres). */
export const hasDb = () => Boolean(databaseUrl());

// One pool per server process; kept on globalThis so dev hot-reloads don't leak connections.
const g = globalThis as unknown as { dekiruDb?: Db };

export function db(): Db {
  if (!g.dekiruDb) {
    const url = databaseUrl();
    if (!url) throw new Error(MISSING_DB_HELP);
    g.dekiruDb = drizzle(new Pool({ connectionString: url, max: 5 }), { schema });
  }
  return g.dekiruDb;
}
