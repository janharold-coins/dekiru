/**
 * Loads env files for the database scripts the way `next dev` does: `.env.development.local` first, then
 * `.env.local`. The first value wins, so in development DATABASE_URL comes from `.env.development.local`
 * (the local Postgres) and the Neon URL in `.env.local` (pulled from Vercel) is only a fallback.
 *
 * Production builds (NODE_ENV=production, as on Vercel) skip the development file. DEKIRU_DB=neon does the
 * same for a one-off script run against the live database, e.g. `DEKIRU_DB=neon npm run db:migrate`.
 * Variables already set in the shell always win.
 */
export function loadEnv() {
  const live = process.env.NODE_ENV === "production" || process.env.DEKIRU_DB === "neon";
  for (const file of [...(live ? [] : [".env.development.local"]), ".env.local"]) {
    try { process.loadEnvFile(file); } catch { /* missing file: env may come from the shell */ }
  }
}
