import type { PatternEntry } from "@/deck/registry";
import type { ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { ClientQuote, clientQuoteMeta } from "./layouts/ClientQuote";

/**
 * Studio proposals: layouts and themes Claude built for review, not yet in the library.
 * Add one per request (newest first). When changes are asked for, edit it in place, bump `revision`
 * and say what changed in `changes`: the Studio then shows it as for review again.
 * Once approved, a layout moves into src/deck/patterns + registry.ts (and templates); a theme is
 * created on approval and can be removed here after.
 */
interface Base {
  id: string;
  name: string;
  /** What was asked for, in the requester's words (or a summary when it came from chat). */
  brief: string;
  /** The Studio request this answers (studio_requests.id), when it was typed on the Studio page. */
  request?: string;
  revision: number;
  /** What changed in this revision, for revisions after the first. */
  changes?: string;
  date: string; // YYYY-MM-DD
}
export interface LayoutProposal extends Base { kind: "layout"; entry: PatternEntry; examples: SlideData[] }
export interface ThemeProposal extends Base { kind: "theme"; tokens: ThemeTokens }
export type Proposal = LayoutProposal | ThemeProposal;

export const proposals: Proposal[] = [
  {
    id: "client-quote", kind: "layout", name: "Client quote", revision: 1, date: "2026-11-03",
    brief: "Example to show how the Studio works (not requested): a slide for one client testimonial: their words large, with name and role. Light background, fits the content slides.",
    entry: { meta: clientQuoteMeta, Component: ClientQuote },
    examples: [
      {
        id: "client-quote", pattern: "client-quote", props: {
          eyebrow: "What clients say",
          quote: "A short quote from the client about the result they got, in their own words, in two or three lines.",
          name: "Client name",
          role: "Role, Company",
        },
      },
      {
        id: "client-quote-short", pattern: "client-quote", props: {
          eyebrow: "Topic of the quote",
          quote: "One short line from the client.",
          name: "Client name",
          role: "Role, Company",
        },
      },
    ],
  },
  {
    id: "navy-night", kind: "theme", name: "Coins.ph Navy", revision: 1, date: "2026-11-03",
    brief: "Example to show how the Studio works (not requested): a navy variant of the Coins.ph look: blue-black dark slides, cool light slides, softer glow.",
    tokens: {
      backgrounds: {
        dark: { angle: 144.8, from: "#0b1f3f", fromAt: 17, to: "#060f1f", toAt: 72 },
        "dark-navy": { angle: 139.1, from: "#0d2550", fromAt: 30, to: "#060f1f", toAt: 88 },
        light: { angle: 139.1, from: "#f3f6fb", fromAt: 30, to: "#e9eef6", toAt: 88 },
      },
      glow: { warm: "#fa7312", cool: "#1f7aff", strength: 0.8 },
      accent: ["#1f7aff", "#204680", "#fa7312"],
    },
  },
];

export const proposal = (id: string) => proposals.find((p) => p.id === id);
