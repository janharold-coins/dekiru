/**
 * Loads the Figma-built master decks (src/content/decks/*.json) into the database.
 *
 *   npm run db:seed            create any master deck that doesn't exist yet (v1, published)
 *   npm run db:seed -- --update  also publish a new version of a master whose JSON changed
 *
 * Re-run after `python3 scripts/build-seed.py` while Figma is still the source for masters.
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { decks } from "@/db/schema";
import { seedDecks } from "@/content/decks";
import { createDeck, getDeckVersions, publishDraft, saveDraft } from "@/lib/decks";

/** JSON with sorted keys — Postgres jsonb doesn't keep key order, so compare canonically. */
const canon = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(canon).join(",")}]`
  : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon((v as Record<string, unknown>)[k])}`).join(",")}}`
  : JSON.stringify(v);

async function main() {
  try { process.loadEnvFile(".env.local"); } catch { /* env may come from the shell */ }
  const update = process.argv.includes("--update");
  for (const d of seedDecks) {
    const [row] = await db().select().from(decks).where(eq(decks.id, d.id)).limit(1);
    if (!row) {
      await createDeck({ id: d.id, title: d.title, kind: "master", slides: d.slides, note: `Seeded from Figma build (${d.version ?? "json"})` });
      console.log(`created ${d.id} v1 (${d.slides.length} slides)`);
      continue;
    }
    const { published } = await getDeckVersions(d.id);
    const same = published && canon(published.slides) === canon(d.slides);
    if (same) { console.log(`${d.id}: up to date (v${published.number})`); continue; }
    if (!update) { console.log(`${d.id}: JSON differs from v${published?.number}; run with --update to publish it`); continue; }
    await saveDraft(d.id, d.slides, { note: "Re-seeded from Figma build" });
    const v = await publishDraft(d.id);
    console.log(`${d.id}: published v${v.number}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
