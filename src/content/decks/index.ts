import type { Deck, SlideData } from "@/deck/types";
import salesSeed from "./sales.json";
import rampSeed from "./ramp.json";

/**
 * Master decks. Later these live in Postgres; the JSON files are the seed.
 * A deck slide is either a full slide or a reference to another deck's slide ({id, ref: "sales/s01"}).
 * References resolve here, so a fix to a shared slide shows up in every deck that uses it.
 * Hidden is per deck: a referenced slide is presented unless this deck hides it.
 */
type SeedSlide = SlideData | { id: string; ref: string; hidden?: boolean };
type SeedDeck = Omit<Deck, "slides"> & { slides: SeedSlide[] };

const seeds: SeedDeck[] = [salesSeed as unknown as SeedDeck, rampSeed as unknown as SeedDeck];
const byId = Object.fromEntries(seeds.map((d) => [d.id, d]));

function resolveSlide(s: SeedSlide, seen: string[] = []): SlideData {
  if (!("ref" in s) || "pattern" in s) return s as SlideData;
  const [deckId, slideId] = s.ref.split("/");
  if (seen.includes(s.ref)) throw new Error(`Circular slide reference: ${[...seen, s.ref].join(" → ")}`);
  const target = byId[deckId]?.slides.find((x) => x.id === slideId);
  if (!target) throw new Error(`Slide reference ${s.ref} not found`);
  const base = resolveSlide(target, [...seen, s.ref]);
  const { hidden: _ignored, ...shared } = base; // eslint-disable-line @typescript-eslint/no-unused-vars
  return { ...shared, id: s.id, ref: s.ref, ...(s.hidden ? { hidden: true } : {}) };
}

export const decks: Record<string, Deck> = Object.fromEntries(
  seeds.map((d) => [d.id, { ...d, slides: d.slides.map((s) => resolveSlide(s)) }]),
);

export function getDeck(id: string): Deck | undefined {
  return decks[id];
}
