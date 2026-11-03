/**
 * What the Studio is waiting on Claude for (run it when asked to "check the Studio"):
 *   npm run studio
 * Lists open requests (build each as a proposal in src/studio/proposals.ts, with `request` set to its id),
 * proposals sent back with changes (revise, bump `revision`, fill `changes`), and approved layouts
 * still to move into the library.
 */
import { hasDb, MISSING_DB_HELP } from "@/db/client";
import { decisionsOf, openRequests, statusOf } from "@/lib/studio";
import { patterns } from "@/deck/registry";
import { proposals } from "@/studio/proposals";

async function main() {
  try { process.loadEnvFile(".env.local"); } catch { /* env may come from the shell */ }
  if (!hasDb()) { console.error(`\n${MISSING_DB_HELP}\n`); process.exit(1); }
  const [requests, decisions] = await Promise.all([openRequests(), decisionsOf()]);
  const rows = proposals.map((p) => ({ p, ...statusOf(p, decisions) }));
  console.log(`\nOpen requests (${requests.length})`);
  for (const r of requests) console.log(`  [${r.kind}] ${r.id}  ${r.email ?? "—"}  ${r.createdAt.toISOString().slice(0, 10)}\n    ${r.prompt.replace(/\n/g, "\n    ")}`);
  const changes = rows.filter((r) => r.status === "changes_requested");
  console.log(`\nChanges requested (${changes.length})`);
  for (const { p, latest } of changes) console.log(`  ${p.id} rev ${p.revision}: ${latest?.note ?? ""}`);
  const ship = rows.filter((r) => r.status === "approved" && r.p.kind === "layout" && !patterns[r.p.entry.meta.id]);
  console.log(`\nApproved layouts not yet in the library (${ship.length})`);
  for (const { p } of ship) console.log(`  ${p.id}`);
  const waiting = rows.filter((r) => r.status === "waiting").map((r) => r.p.id);
  console.log(`\nFor review: ${waiting.join(", ") || "none"}\n`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message ?? e); process.exit(1); });
