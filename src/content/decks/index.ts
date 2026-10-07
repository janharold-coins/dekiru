import type { Deck } from "@/deck/types";
import type { SeedSlide } from "../resolve";
import salesSeed from "./sales.json";
import rampSeed from "./ramp.json";

/**
 * Master decks as built from Figma by scripts/build-seed.py.
 * With a database connected these are only the seed (`npm run db:seed`);
 * without one, the app reads them directly (see src/lib/decks.ts).
 */
export type SeedDeck = Omit<Deck, "slides"> & { slides: SeedSlide[] };

export const seedDecks: SeedDeck[] = [salesSeed as unknown as SeedDeck, rampSeed as unknown as SeedDeck];
