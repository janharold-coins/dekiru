import type { SlideData } from "@/deck/types";
import data from "./templates.json";

/**
 * Slide templates: approved slides with their words swapped for placeholders, to fill in with your own.
 * Built from the Sales master by scripts/build-templates.py, plus layouts approved in the Studio (below).
 * Images stay as approved until uploads exist.
 */
export interface SlideTemplate {
  id: string;
  name: string;
  /** What it's for, one line. */
  use: string;
  /** The approved slide it was made from ("dk-645bd167/s01"), or the Studio proposal ("studio/client-quote"). */
  from: string;
  slide: SlideData;
}

/** Layouts approved in the Studio (src/studio/proposals.ts): each one's first example, as its template. */
const studio: SlideTemplate[] = [
  {
    id: "client-quote", name: "Client quote", use: "One client's words, large, with their name and role.", from: "studio/client-quote",
    slide: {
      id: "client-quote", pattern: "client-quote", props: {
        eyebrow: "What clients say",
        quote: "A short quote from the client about the result they got, in their own words, in two or three lines.",
        name: "Client name",
        role: "Role, Company",
      },
    },
  },
];

export const templates = [...(data as unknown as SlideTemplate[]), ...studio];

export const getTemplate = (id: string) => templates.find((t) => t.id === id);
