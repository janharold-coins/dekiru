/**
 * Backs up the live database (Neon) to backups/dekiru-neon-<date>.dump, in pg_dump's custom format.
 *
 *   npm run db:backup
 *
 * Always reads the Neon URL from .env.local (or DATABASE_URL in the shell), never the local development
 * database. Connects to Neon directly rather than through its connection pooler, which pg_dump can't use.
 * Needs pg_dump 18 or newer (Homebrew postgresql@18); set PG_BIN to use another install.
 *
 * The dump holds everything people made in the app, including names and emails: keep it private, and out of
 * deploys and shared folders (backups/ is in .gitignore and .vercelignore).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

const BIN = process.env.PG_BIN ?? "/opt/homebrew/opt/postgresql@18/bin";
const tool = (name: string) => (existsSync(join(BIN, name)) ? join(BIN, name) : name);

function liveUrl(): string {
  if (process.env.DATABASE_URL && !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)) return process.env.DATABASE_URL;
  let file: Record<string, string | undefined> = {};
  try { file = parseEnv(readFileSync(".env.local", "utf8")); } catch { /* handled below */ }
  const url = file.DATABASE_URL || file.POSTGRES_URL;
  if (!url) throw new Error("No Neon DATABASE_URL in .env.local. Pull it with `npx vercel env pull .env.local`.");
  return url;
}

function main() {
  const url = new URL(liveUrl());
  url.hostname = url.hostname.replace("-pooler.", "."); // Neon's direct endpoint: pg_dump needs a real session
  const stamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
  mkdirSync("backups", { recursive: true });
  const out = join("backups", `dekiru-neon-${stamp}.dump`);
  console.log(`[backup] ${url.hostname} → ${out}`);
  const r = spawnSync(tool("pg_dump"), ["--format=custom", "--no-owner", "--no-privileges", "--file", out, url.toString()], { stdio: "inherit" });
  if (r.error) throw new Error(`Couldn't run pg_dump (${r.error.message}). Install it with \`brew install postgresql@18\`.`);
  if (r.status !== 0) {
    rmSync(out, { force: true }); // no half-written backups
    throw new Error(`pg_dump failed (exit ${r.status}). If Neon is over its quota, it refuses every connection until it resets.`);
  }
  console.log(`[backup] done: ${out} (${(statSync(out).size / 1024).toFixed(0)} KB). Load it locally with \`npm run db:restore-local\`.`);
}

try { main(); } catch (e) { console.error(`[backup] ${(e as Error).message}`); process.exit(1); }
