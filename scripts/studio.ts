/**
 * What the Studio is waiting on Claude for (run it when asked to "check the Studio"):
 *   npm run studio
 * Lists open requests (build each as a proposal in src/studio/proposals.ts, with `request` set to its id;
 * a remix becomes a new proposal with `remixOf` set, built from the request and all its remix prompts),
 * prompts on drafts and proposals sent back with changes (revise, bump `revision`, fill `changes`), and approved layouts
 * still to move into the library (move them straight away: approval means it ships, see src/studio/proposals.ts). Every proposal follows src/studio/STUDIO.md (rule-change requests edit it).
 *   npm run studio -- close <request id>    closes a request answered without a proposal (a rule change)
 *   npm run studio -- watch [--until 19:00] waits (checking every 10s) until there's work it hasn't reported yet, prints
 *                                           it and exits. Run in the background: when it exits, Claude's session wakes up
 *                                           to do the work, then starts it again ("watch the Studio"). With --until (local
 *                                           time), it stops for the day at that time and prints STUDIO_LISTENER_DONE:
 *                                           Claude doesn't start it again.
 * Images attached to prompts are saved to .studio/attachments/ (git-ignored) so Claude can open them.
 */
import { hasDb, MISSING_DB_HELP } from "@/db/client";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { attachment, closeRequest, studioQueue, workKeys, type StudioQueue } from "@/lib/studio";

const SEEN = process.env.STUDIO_SEEN ?? ".studio/watch-seen.json"; // what watch has already reported
const EVERY_MS = 10_000;

async function report(q: StudioQueue) {
  // Prompts for Claude, oldest first, with their images saved where Claude can open them.
  const prompts = async (list: StudioQueue["revise"][number]["prompts"], name: string) => {
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
  console.log(`\nOpen requests (${q.requests.length})`);
  for (const r of q.requests) {
    const remix = r.remix ? `  remix of ${r.remix} (build a new proposal with remixOf: "${r.remix}")` : "";
    console.log(`  [${r.kind}] ${r.id}  ${r.email ?? "—"}  ${r.createdAt.toISOString().slice(0, 10)}${remix}\n    ${r.prompt.replace(/\n/g, "\n    ")}`);
    await prompts(r.prompts, `request-${r.id.slice(0, 8)}`);
  }
  console.log(`\nPrompts to build (${q.revise.length}): drafts and proposals sent back with changes`);
  for (const r of q.revise) {
    console.log(`  ${r.id} rev ${r.revision}${r.remixOf ? ` (remix of ${r.remixOf}; stays a draft until they send it for review)` : ""}`);
    await prompts(r.prompts, `${r.id}-rev${r.revision}`);
  }
  console.log(`\nApproved layouts to move into the library now (${q.ship.length}), with the Tune line from their approval`);
  for (const id of q.ship) console.log(`  ${id}`);
  if (q.drafts.length) console.log(`\nDrafts waiting on the person (next prompt or Send for review): ${q.drafts.join(", ")}`);
  console.log("\nRules: src/studio/STUDIO.md (rule changes: edit it, log the change at the bottom, then close the request)");
  console.log(`\nFor review: ${q.waiting.join(", ") || "none"}\n`);
}

/** Today at "HH:MM" local time, or null without one. */
function today(at: string | undefined) {
  const m = at?.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const d = new Date();
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return d;
}

/**
 * Waits for work not reported before, then reports it. What's reported is remembered, so the next watch waits for
 * newer work. `until`: stop for the day at that time (work found before then is still reported first).
 */
async function watch(until: Date | null) {
  const seen = new Set<string>(JSON.parse(await readFile(SEEN, "utf8").catch(() => "[]")));
  const stop = () => console.log(`\nSTUDIO_LISTENER_DONE: it's past ${until!.toTimeString().slice(0, 5)}, so the Studio listener has stopped for the day. Don't start it again.`);
  if (until && Date.now() >= until.getTime()) return stop();
  console.log(`Watching the Studio (every ${EVERY_MS / 1000}s)${until ? ` until ${until.toTimeString().slice(0, 5)}` : ""}…`);
  for (;;) {
    try {
      const q = await studioQueue();
      const keys = workKeys(q);
      const fresh = keys.filter((k) => !seen.has(k));
      if (fresh.length) {
        await mkdir(path.dirname(SEEN), { recursive: true });
        await writeFile(SEEN, JSON.stringify(keys));
        console.log(`\nNew Studio work (${fresh.length}): ${fresh.join(", ")}`);
        await report(q);
        return;
      }
    } catch (e) {
      console.error(`Couldn't check the Studio (${(e as Error).message}); trying again.`);
    }
    if (until && Date.now() >= until.getTime()) return stop();
    await new Promise((r) => setTimeout(r, EVERY_MS));
  }
}

async function main() {
  try { process.loadEnvFile(".env.local"); } catch { /* env may come from the shell */ }
  if (!hasDb()) { console.error(`\n${MISSING_DB_HELP}\n`); process.exit(1); }
  const [cmd, id, ...rest] = process.argv.slice(2);
  if (cmd === "close" && id) { await closeRequest(id); console.log(`Closed ${id}`); return; }
  if (cmd === "watch") {
    const args = [id, ...rest];
    const at = args[args.indexOf("--until") + 1];
    const until = args.includes("--until") ? today(at) : null;
    if (args.includes("--until") && !until) throw new Error(`--until wants a local time like 19:00, not "${at}".`);
    return watch(until);
  }
  await report(await studioQueue());
}

main().then(() => process.exit(0)).catch((e) => { console.error(e.message ?? e); process.exit(1); });
