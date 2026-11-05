import type { PatternEntry } from "@/deck/registry";
import type { ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { ClientQuote, clientQuoteMeta } from "@/deck/patterns/ClientQuote";
import type { Extra } from "@/ui/RenderScreen";
import type { Node } from "@/ui/types";
import { AccordionCard, IconRow, ListSection, ValueRow } from "./ui/AccordionCard";

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
/**
 * A UI pattern: a generic, reusable piece drawn out of something built for one screen (its origin). The review
 * shows the origin as it is today, the origin rebuilt with the pattern (it must look the same), and other uses.
 * Proposed code lives in ./ui/ while reviewed. On approval Claude moves it to src/ui/patterns, registers it (and
 * its parts) in src/ui/registry.ts with the origin's Figma source, rebuilds the origin's screens with it, and
 * retires the origin entry, without asking again. The proposal stays here, pointing at the registry id.
 */
export interface PatternProposal extends Base {
  kind: "pattern";
  /** Registry id the pattern gets on approval. */
  entryId: string;
  /** The pattern and its parts, by the ids the example trees use. */
  components: Extra;
  /** What it was drawn out of: a registry entry, the screens using it, and the Figma set. */
  origin: { entry: string; screens: string[]; figma: { name: string; url: string } };
  /** How the pattern works: props and parts, in plain words. */
  description: string;
  /** Node trees (like screens). `was`: the origin as screens draw it today, for an example that rebuilds it. */
  examples: { id: string; label: string; was?: Node; tree: Node }[];
}
export type Proposal = LayoutProposal | ThemeProposal | PatternProposal;

const levelBody = (requirements: [string, string][], unlocks: [string, string?][]): Node[] => [
  { component: "list-section", props: { label: "Requirement:" }, children: requirements.map(([icon, text]) => ({ component: "icon-row", props: { icon, text } })) },
  { component: "list-section", props: { label: "Unlocks:" }, children: unlocks.map(([label, value]) => ({ component: "value-row", props: { label, value } })) },
];
const body = (text: string): Node => ({ component: "Text", props: { text, style: "Web/body 14px-500", color: "Text/Subtitle (700)" } });

export const proposals: Proposal[] = [
  {
    id: "accordion-card", kind: "pattern", name: "Accordion card", revision: 1, date: "2026-11-05", entryId: "accordion-card",
    brief: "From the verification level card (KYC screens): an accordion card any screen can use. Open and close it by tapping the header; the body takes any content.",
    components: { "accordion-card": AccordionCard, "list-section": ListSection, "icon-row": IconRow, "value-row": ValueRow },
    origin: {
      entry: "verification-level-card",
      screens: ["kyc-levels", "kyc-failed"],
      figma: { name: "KYC - KYB → Component 2 (file-local set)", url: "https://www.figma.com/design/sm9kOVLwixDucqoX7etLI4/KYC---KYB?node-id=21099-34179" },
    },
    description: "Header: optional icon, optional tag, title, optional description, and a chevron. Tap the header to open or close; `expanded` sets how it starts (the Figma frame's state). Body: any content, 16 apart, under a divider. Tones are the three the origin draws: selected (blue border, shadow), muted (grey, secondary text, dimmed tag) and error (red description). Parts for the body: List section (bold label over rows), Icon row (icon and text) and Value row (label, optional value, optional check). Every style is the origin's; none is new.",
    exceptions: "Studio rules are for slides; this follows the Figma origin instead. A plain neutral tone (grey border, regular text) isn't in Figma, so it isn't here; it can be added when a frame draws one. Figma only draws the error tone closed; opened, it is the error header over the usual body.",
    examples: [
      {
        id: "origin-active", label: "Level 1, active and open (Verification levels screen)",
        was: { component: "verification-level-card", props: { level: "L1", status: "Active", expanded: true, tag: "Level 1", title: "Basic verification", description: "1-2 mins to kickstart your crypto and daily payments journey.", requirements: [{ icon: "IdCard", text: "Basic info" }, { icon: "Selfie", text: "Quick selfie check" }], unlocks: [{ label: "Cash in", amount: "₱10,000/day" }, { label: "Scan to pay" }, { label: "Pay bills" }, { label: "Buy load" }, { label: "Loyalty rewards & Rewards hub" }, { label: "One-click buy, sell & convert (OCBS)" }] } },
        tree: { component: "accordion-card", props: { tone: "selected", icon: "Locked", tag: "Level 1", title: "Basic verification", description: "1-2 mins to kickstart your crypto and daily payments journey.", expanded: true },
          children: levelBody([["IdCard", "Basic info"], ["Selfie", "Quick selfie check"]], [["Cash in", "₱10,000/day"], ["Scan to pay"], ["Pay bills"], ["Buy load"], ["Loyalty rewards & Rewards hub"], ["One-click buy, sell & convert (OCBS)"]]) },
      },
      {
        id: "origin-failed", label: "Level 1, failed (Account verification screen)",
        was: { component: "verification-level-card", props: { level: "L1", status: "Failed", expanded: false, tag: "Level 1", title: "Basic verification", description: "Your address information has been rejected due to your street being invalid.", requirements: [{ icon: "IdCard", text: "Basic info" }, { icon: "Selfie", text: "Quick selfie check" }], unlocks: [{ label: "Cash in", amount: "₱10,000/day" }, { label: "Scan to pay" }, { label: "Pay bills" }, { label: "Buy load" }, { label: "Loyalty rewards & Rewards hub" }, { label: "One-click buy, sell & convert (OCBS)" }] } },
        tree: { component: "accordion-card", props: { tone: "error", icon: "Failed", tag: "Level 1", title: "Basic verification", description: "Your address information has been rejected due to your street being invalid." },
          children: levelBody([["IdCard", "Basic info"], ["Selfie", "Quick selfie check"]], [["Cash in", "₱10,000/day"], ["Scan to pay"], ["Pay bills"], ["Buy load"], ["Loyalty rewards & Rewards hub"], ["One-click buy, sell & convert (OCBS)"]]) },
      },
      {
        id: "origin-inactive", label: "Level 2, not yet available (Account verification screen)",
        was: { component: "verification-level-card", props: { level: "L2", status: "Inactive", expanded: false, tag: "Level 2", title: "Identity verification", description: "3-5 mins to enjoy full withdrawal access and trade like a pro.", requirements: [{ icon: "IdCard", text: "Government-issued ID" }, { icon: "Selfie", text: "Quick selfie check" }], unlocks: [{ label: "Cash in", amount: "₱1,000,000/day" }, { label: "Cash out", amount: "₱1,000,000/day" }, { label: "Spot trading" }, { label: "Send money" }, { label: "Launchpool" }, { label: "Crypto deposit & withdrawal" }] } },
        tree: { component: "accordion-card", props: { tone: "muted", icon: "Locked", tag: "Level 2", title: "Identity verification", description: "3-5 mins to enjoy full withdrawal access and trade like a pro." },
          children: levelBody([["IdCard", "Government-issued ID"], ["Selfie", "Quick selfie check"]], [["Cash in", "₱1,000,000/day"], ["Cash out", "₱1,000,000/day"], ["Spot trading"], ["Send money"], ["Launchpool"], ["Crypto deposit & withdrawal"]]) },
      },
      {
        id: "question", label: "A question and its answer (no icon, no tag)",
        tree: { component: "accordion-card", props: { tone: "selected", title: "Question title", expanded: true }, children: [body("The answer, in a few lines of body text. Tap the question to close it.")] },
      },
      {
        id: "summary", label: "A summary with values",
        tree: { component: "accordion-card", props: { tone: "muted", icon: "Income", title: "Summary title", description: "One line about what is inside." },
          children: [{ component: "list-section", props: { label: "Section label:" }, children: [{ component: "value-row", props: { label: "Label", value: "Value", check: false } }, { component: "value-row", props: { label: "Label", value: "Value", check: false } }, { component: "value-row", props: { label: "Included item" } }] }] },
      },
    ],
  },
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
