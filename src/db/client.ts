import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

/** True when DATABASE_URL is set (Neon in production, or a local Postgres). */
export const hasDb = () => Boolean(process.env.DATABASE_URL);

// One pool per server process; kept on globalThis so dev hot-reloads don't leak connections.
const g = globalThis as unknown as { dekiruDb?: Db };

export function db(): Db {
  if (!g.dekiruDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    g.dekiruDb = drizzle(new Pool({ connectionString: url, max: 5 }), { schema });
  }
  return g.dekiruDb;
}
