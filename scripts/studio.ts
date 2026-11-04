/**
 * What the Studio is waiting on Claude for (run it when asked to "check the Studio"):
 *   npm run studio
 * Lists open requests (build each as a proposal in src/studio/proposals.ts, with `request` set to its id;
 * a remix becomes a new proposal with `remixOf` set, built from the request and all its remix prompts),
 * prompts on drafts and proposals sent back with changes (revise, bump `revision`, fill `changes`), and approved layouts
 * still to move into the library (move them straight away: approval means it ships, see src/studio/proposals.ts). Every proposal follows src/studio/STUDIO.md (rule-change requests edit it).
 *   npm run studio -- close <request id>    closes a request answered without a proposal (a rule change)
 * Images attached to a change request are saved to .studio/attachments/ (git-ignored) so Claude can open them.
 */
import { hasDb, MISSING_DB_HELP } from "@/db/client";
import { mkdir, writeFile } from "node:fs/promises";
import { attachment, closeRequest, decisionsOf, openRequests, statusOf } from "@/lib/studio";
import { patterns } from "@/deck/registry";
import { proposals } from "@/studio/proposals";

async function main() {
  try { process.loadEnvFile(".env.local"); } catch { /* env may come from the shell */ }
  if (!hasDb()) { console.error(`\n${MISSING_DB_HELP}\n`); process.exit(1); }
  const [cmd, id] = process.argv.slice(2);
  if (cmd === "close" && id) { await closeRequest(id); console.log(`Closed ${id}`); return; }
  const [requests, decisions] = await Promise.all([openRequests(), decisionsOf()]);
  const rows = proposals.map((p) => ({ p, ...statusOf(p, decisions) }));
  console.log(`\nOpen requests (${requests.length})`);
  // Prompts for Claude, oldest first, with their images saved where Claude can open them.
  const prompts = async (target: string, revision: number, name: string) => {
    const list = decisions.filter((d) => d.proposalId === target && d.revision === revision && d.decision === "changes_requested").reverse();
    for (const [k, d] of list.entries()) {
      if (d.note) console.log(`    prompt: ${d.note.replace(/\n/g, "\n      ")}`);
      for (const [n, img] of d.images.entries()) {
        const file = await attachment(img);
        if (!file) continue;
        await mkdir(".studio/attachments", { recursive: true });
        const path = `.studio/attachments/${name}-${k + 1}-${n + 1}.${file.mime.split("/")[1]}`;
        await writeFile(path, file.bytes);
        console.log(`    image: ${path}`);
      }
    }
  };
  for (const r of requests) {
    const remix = r.remix ? `  remix of ${r.remix} (build a new proposal with remixOf: "${r.remix}")` : "";
    console.log(`  [${r.kind}] ${r.id}  ${r.email ?? "—"}  ${r.createdAt.toISOString().slice(0, 10)}${remix}\n    ${r.prompt.replace(/\n/g, "\n    ")}`);
    await prompts(`request:${r.id}`, 0, `request-${r.id.slice(0, 8)}`);
  }
  const changes = rows.filter((r) => r.building);
  console.log(`\nPrompts to build (${changes.length}): drafts and proposals sent back with changes`);
  for (const { p } of changes) {
    console.log(`  ${p.id} rev ${p.revision}${p.remixOf ? ` (remix of ${p.remixOf}; stays a draft until they send it for review)` : ""}`);
    await prompts(p.id, p.revision, `${p.id}-rev${p.revision}`);
  }
  const ship = rows.filter((r) => r.status === "approved" && r.p.kind === "layout" && !patterns[r.p.entry.meta.id]);
  console.log(`\nApproved layouts to move into the library now (${ship.length}), with the Tune line from their approval`);
  for (const { p } of ship) console.log(`  ${p.id}`);
  const waiting = rows.filter((r) => r.status === "waiting").map((r) => r.p.id);
  const drafts = rows.filter((r) => r.status === "draft" && !r.building).map((r) => r.p.id);
  if (drafts.length) console.log(`\nDrafts waiting on the person (next prompt or Send for review): ${drafts.join(", ")}`);
  console.log("\nRules: src/studio/STUDIO.md (rule changes: edit it, log the change at the bottom, then close the request)");
  console.log(`\nFor review: ${waiting.join(", ") || "none"}\n`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message ?? e); process.exit(1); });
