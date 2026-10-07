import type { SlideData } from "@/deck/types";

/**
 * A stored slide is either full slide data or a reference to another deck's slide
 * ({id, ref: "sales/s01"}). References resolve at read time, so a fix to a shared slide
 * shows up in every deck that uses it. Hidden is per deck: a referenced slide is
 * presented unless this deck hides it.
 */
export type SlideRef = { id: string; ref: string; hidden?: boolean };
export type SeedSlide = SlideData | SlideRef;

export const isRef = (s: SeedSlide): s is SlideRef => "ref" in s && !("pattern" in s);

/** Looks up the stored slides of another deck (its published version). */
export type DeckLookup = (deckId: string) => SeedSlide[] | undefined | Promise<SeedSlide[] | undefined>;

export async function resolveSlides(slides: SeedSlide[], lookup: DeckLookup): Promise<SlideData[]> {
  const cache = new Map<string, SeedSlide[] | undefined>();
  const get = async (deckId: string) => {
    if (!cache.has(deckId)) cache.set(deckId, await lookup(deckId));
    return cache.get(deckId);
  };
  const one = async (s: SeedSlide, seen: string[]): Promise<SlideData> => {
    if (!isRef(s)) return s;
    if (seen.includes(s.ref)) throw new Error(`Circular slide reference: ${[...seen, s.ref].join(" → ")}`);
    const [deckId, slideId] = s.ref.split("/");
    const target = (await get(deckId))?.find((x) => x.id === slideId);
    if (!target) throw new Error(`Slide reference ${s.ref} not found`);
    const base = await one(target, [...seen, s.ref]);
    const { hidden: _ignored, ...shared } = base; // eslint-disable-line @typescript-eslint/no-unused-vars
    return { ...shared, id: s.id, ref: s.ref, ...(s.hidden ? { hidden: true } : {}) };
  };
  return Promise.all(slides.map((s) => one(s, [])));
}

/** Copies are snapshots: references become full slides, so later master edits don't change them. */
export async function snapshotSlides(slides: SeedSlide[], lookup: DeckLookup): Promise<SlideData[]> {
  const resolved = await resolveSlides(slides, lookup);
  return resolved.map(({ ref, ...s }) => (ref ? { ...s, source: { ...s.source, copiedFrom: ref } } : s));
}
