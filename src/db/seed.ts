/**
 * Keeps the database's master decks in step with the Figma-built JSON (src/content/decks/*.json).
 *
 * - A master that doesn't exist yet is created (v1, published).
 * - A master whose JSON changed gets a new published version — but only while the newest version
 *   still came from the Figma build. Once someone edits a master in the app, the seed leaves it alone
 *   (pass `force` to overwrite anyway).
 */
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { decks } from "@/db/schema";
import { seedDecks } from "@/content/decks";
import { createDeck, getDeckVersions, publishDraft, saveDraft } from "@/lib/decks";

const FROM_FIGMA = /^(Seeded|Re-seeded) from Figma build/;

/** JSON with sorted keys — Postgres jsonb doesn't keep key order, so compare canonically. */
const canon = (v: unknown): string =>
  Array.isArray(v) ? `[${v.map(canon).join(",")}]`
  : v && typeof v === "object" ? `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon((v as Record<string, unknown>)[k])}`).join(",")}}`
  : JSON.stringify(v);

export async function seedMasters({ force = false, log = console.log }: { force?: boolean; log?: (m: string) => void } = {}) {
  for (const d of seedDecks) {
    const [row] = await db().select().from(decks).where(eq(decks.id, d.id)).limit(1);
    if (!row) {
      await createDeck({ id: d.id, title: d.title, kind: "master", slides: d.slides, note: `Seeded from Figma build (${d.version ?? "json"})` });
      log(`${d.id}: created v1 (${d.slides.length} slides)`);
      continue;
    }
    const { published, draft } = await getDeckVersions(d.id);
    if (published && canon(published.slides) === canon(d.slides)) { log(`${d.id}: up to date (v${published.number})`); continue; }
    const editedInApp = draft || (published && !FROM_FIGMA.test(published.note ?? ""));
    if (editedInApp && !force) {
      log(`${d.id}: Figma build changed, but v${published?.number} was edited in the app — left as is (npm run db:seed -- --force to overwrite)`);
      continue;
    }
    await saveDraft(d.id, d.slides, { note: "Re-seeded from Figma build" });
    const v = await publishDraft(d.id);
    log(`${d.id}: published v${v.number} from the Figma build`);
  }
}
