import type { Deck } from "@/deck/types";
import sales from "./sales.json";

/** Master decks. Later these live in Postgres; the JSON files are the seed. */
export const decks: Record<string, Deck> = {
  sales: sales as unknown as Deck,
};

export function getDeck(id: string): Deck | undefined {
  return decks[id];
}
