import type { PatternEntry } from "@/deck/registry";
import type { ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { ClientQuote, clientQuoteMeta } from "@/deck/patterns/ClientQuote";

/**
 * Studio proposals: layouts and themes Claude built for review, not yet in the library.
 * Every proposal follows the Studio rules (./STUDIO.md: 8-point grid, centred and non-overlapping content,
 * the type scale; helpers in ./grid.ts). Where one gives way, say so in `exceptions`.
 * Add one per request (newest first). When changes are asked for, edit it in place, bump `revision`
 * and say what changed in `changes`: the Studio then shows it as for review again.
 * New layouts live in ./layouts/ while they're reviewed. Approval puts a layout in the library: Claude moves it to
 * src/deck/patterns, registers it in registry.ts, adds its first example to the templates (src/content/templates.ts)
 * and builds in any Tune line from the approval, without asking again. The proposal stays here, pointing at the
 * library entry, so its review history stays on the Studio. A theme is created and published on approval.
 * A remix (of an approved proposal, a library template or a theme) is a new proposal (new id, `remixOf` set,
 * `request` set to the remix request), kept apart from the original. It's a draft, shown in the remix editor,
 * until someone sends it for review; each remix prompt asks for the next revision. Once approved it joins the
 * library alongside the original.
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
  /** Studio rules this proposal doesn't follow, and why (asked for, a Figma frame, or optical alignment). */
  exceptions?: string;
  /** What this is a variant of, for remix requests: an approved proposal id, "template:<id>" or "theme:<id>". */
  remixOf?: string;
}
export interface LayoutProposal extends Base { kind: "layout"; entry: PatternEntry; examples: SlideData[] }
export interface ThemeProposal extends Base { kind: "theme"; tokens: ThemeTokens }
export type Proposal = LayoutProposal | ThemeProposal;

export const proposals: Proposal[] = [
  {
    id: "client-quote", kind: "layout", name: "Client quote", revision: 3, date: "2026-11-03", // in the library, with the Golden Ratio scale it was approved with
    brief: "Example to show how the Studio works (not requested): a slide for one client testimonial: their words large, with name and role. Light background, fits the content slides.",
    changes: "Balanced spacing: every gap is 32, measured between visible edges (text trimmed to cap height and baseline), so the quote mark and the orange rule each have equal space above and below. The mark is now a shape with an exact 48px height instead of a font glyph with empty space under it. Name and role pair at 16.",
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
        id: "client-quote-long", pattern: "client-quote", props: {
          eyebrow: "Longest quote the layout takes",
          quote: "A longer quote from the client, up to four lines: what they needed, what changed after working with us, and the result they saw in their own words.",
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
