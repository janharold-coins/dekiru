import { patternOrder } from "@/deck/registry";
import type { SlideData } from "@/deck/types";
import { listDecks } from "@/lib/decks";

/** One approved master slide per layout, in deck order: every layout has to work in every theme. */
export async function layoutSamples(viewerId: string | null): Promise<SlideData[]> {
  const masters = (await listDecks({ viewerId })).filter((d) => d.kind === "master");
  const own = masters.flatMap((d) => d.slides.filter((s) => !s.ref && !s.hidden));
  return patternOrder.map((p) => own.find((s) => s.pattern === p)).filter((s): s is SlideData => Boolean(s));
}

/** Cover, a light content slide and the closing slide: enough to tell themes apart at a glance. */
export function glanceSamples(all: SlideData[]) {
  const pick = (p: string) => all.find((s) => s.pattern === p);
  return [pick("cover"), pick("key-numbers") ?? pick("agenda"), pick("closing")].filter((s): s is SlideData => Boolean(s));
}
