/**
 * Loads a backup into the LOCAL development database, replacing what's there.
 *
 *   npm run db:restore-local                 the newest backups/*.dump
 *   npm run db:restore-local -- <file.dump>  a specific one
 *
 * Only ever touches a database on this machine: it reads DATABASE_URL from .env.development.local and refuses
 * anything that isn't localhost. The local database is dropped and created again (closing the dev server's
 * connections; it reconnects), then the backup is restored into it, migrations table included, so the app sees
 * exactly what the live site had on the day of the backup.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseEnv } from "node:util";

const BIN = process.env.PG_BIN ?? "/opt/homebrew/opt/postgresql@18/bin";
const tool = (name: string) => (existsSync(join(BIN, name)) ? join(BIN, name) : name);

function localUrl(): URL {
  let file: Record<string, string | undefined> = {};
  try { file = parseEnv(readFileSync(".env.development.local", "utf8")); } catch { /* handled below */ }
  const raw = file.DATABASE_URL;
  if (!raw) throw new Error("No DATABASE_URL in .env.development.local (the local database).");
  const url = new URL(raw);
  if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) throw new Error(`Refusing: ${url.hostname} isn't a database on this machine.`);
  return url;
}

function newestDump(): string {
  const files = existsSync("backups") ? readdirSync("backups").filter((f) => f.endsWith(".dump")) : [];
  if (!files.length) throw new Error("No backups yet. Make one with `npm run db:backup`.");
  return join("backups", files.sort((a, b) => statSync(join("backups", b)).mtimeMs - statSync(join("backups", a)).mtimeMs)[0]);
}

function run(cmd: string, args: string[], allowFail = false) {
  const r = spawnSync(tool(cmd), args, { stdio: "inherit" });
  if (r.error) throw new Error(`Couldn't run ${cmd} (${r.error.message}). Install it with \`brew install postgresql@18\`.`);
  if (r.status !== 0 && !allowFail) throw new Error(`${cmd} failed (exit ${r.status}).`);
  return r.status ?? 0;
}

function main() {
  const file = process.argv[2] ?? newestDump();
  if (!existsSync(file)) throw new Error(`No file ${file}.`);
  const url = localUrl();
  const name = url.pathname.slice(1);
  const server = new URL(url); server.pathname = "/postgres";
  console.log(`[restore] ${file} → local database "${name}" (replacing it)`);
  run("dropdb", ["--if-exists", "--force", "--maintenance-db", server.toString(), name]);
  run("createdb", ["--maintenance-db", server.toString(), name]);
  // Neon-only extensions or settings may not exist locally: pg_restore reports them and carries on.
  const status = run("pg_restore", ["--no-owner", "--no-privileges", "--dbname", url.toString(), file], true);
  console.log(status === 0
    ? "[restore] done. Reload the app."
    : "[restore] done with warnings (above). Usually Neon-only extensions; the app's tables are in. Reload the app.");
}

try { main(); } catch (e) { console.error(`[restore] ${(e as Error).message}`); process.exit(1); }
