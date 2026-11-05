import type { PatternEntry } from "@/deck/registry";
import type { ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { ClientQuote, clientQuoteMeta } from "@/deck/patterns/ClientQuote";
import type { Extra } from "@/ui/RenderScreen";
import type { Node } from "@/ui/types";
import { AccordionCard, IconRow, ListSection, ValueRow } from "./ui/AccordionCard";
import { ColumnChart, columnChartMeta } from "@/deck/patterns/ColumnChart";
import { Bullets, bulletsMeta } from "@/deck/patterns/Bullets";
import { Comparison, comparisonMeta } from "./layouts/Comparison";
import { Objectives, objectivesMeta } from "./layouts/Objectives";
import { Roadmap, roadmapMeta } from "./layouts/Roadmap";
import { Takeaways, takeawaysMeta } from "./layouts/Takeaways";
import { TeamIntro, teamIntroMeta } from "./layouts/TeamIntro";
import { DataTable, dataTableMeta } from "@/deck/patterns/DataTable";
import { DoDont, doDontMeta } from "@/deck/patterns/DoDont";
import { Quiz, quizMeta } from "@/deck/patterns/Quiz";
import { ScreenshotWalkthrough, screenshotWalkthroughMeta } from "@/deck/patterns/ScreenshotWalkthrough";

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
    id: "takeaways", kind: "layout", name: "Key takeaways", revision: 2, date: "2026-11-05",
    changes: "More room between takeaways: each sits 32 above and below its hairline (was 16), so the list breathes. Built in your Tune line: the Perfect Fifth scale, element spacing 64 and pairs 32 are now this layout's defaults. Five takeaways that all have explanations can't keep 32 and still fit between the logo and the footer, so the spacing steps down by 8 only when it has to: 3 takeaways get 32, 4 get 24, and 5 with explanations get 16, with the gap under the title at 48 and the eyebrow pair at 16 so they fit. If 5 should always be roomy, the list could cap at 4.",
    request: "7543ebe1-01c4-4a41-9368-1f64788a5b37",
    brief: "A key takeaways slide. Title (e.g. 'Key takeaways') with an optional eyebrow naming the section or session; 3 to 5 numbered takeaways, each with a bold short line and an optional one-line explanation. Clean and calm, meant to close a section or a whole talk before Q&A. Should work for trainings, internal updates and sales recaps.",
    exceptions: "Numbers are two digits (01, 02) in the accent, in a 96 column, as on the approved numbered slides (Manrope since the 2026-11-05 rule change). Hairlines separate the takeaways; there's no other decoration, to keep it calm.",
    entry: { meta: takeawaysMeta, Component: Takeaways },
    examples: [
      {
        id: "takeaways-three", pattern: "takeaways", props: {
          eyebrow: "Session name",
          title: "Key takeaways",
          takeaways: [
            { text: "The first thing to remember, in one line", detail: "One line on why it matters." },
            { text: "The second thing to remember", detail: "One line on why it matters." },
            { text: "The third thing to remember" },
          ],
        },
      },
      {
        id: "takeaways-long", pattern: "takeaways", props: {
          eyebrow: "Longest eyebrow it takes, 40 characters",
          title: "Longest title it takes, 40 characters",
          takeaways: Array.from({ length: 5 }, () => ({ text: "The longest takeaway it takes: sixty-four characters, one line", detail: "The longest explanation it takes: one line of about a hundred and ten characters, in grey, under the line." })),
        },
      },
    ],
  },
  {
    id: "objectives", kind: "layout", name: "Learning objectives", revision: 2, date: "2026-11-05",
    changes: "The check circles are light blue (#5ba4ff, the Coins blue lightened) instead of orange. Built in your Tune line: objectives are 48 apart (was 40); the eyebrow and title pair stays at 24.",
    request: "e2ea4677-b3ef-4185-8821-b747d71e777e",
    brief: "A learning objectives slide. Eyebrow (e.g. 'In this session') and a title like 'By the end, you'll be able to…' on the left; 3 to 5 objectives on the right, each with a check-circle icon, a short action-led line and an optional one-line detail. Should work for trainings, onboarding, workshops and client enablement sessions.",
    exceptions: "The two sides are centred in the band separately, so a short list and a three-line title both sit in the middle. The check-circle sits on the middle of the objective's capitals (optical).",
    entry: { meta: objectivesMeta, Component: Objectives },
    examples: [
      {
        id: "objectives-four", pattern: "objectives", props: {
          eyebrow: "In this session",
          title: "By the end, you'll be able to…",
          objectives: [
            { text: "Explain what the product does", detail: "In one sentence, to a customer." },
            { text: "Walk a customer through sign-up", detail: "From download to their first payment." },
            { text: "Answer the five most common questions" },
            { text: "Know where to send what you can't answer", detail: "Who to ask, and how fast they reply." },
          ],
        },
      },
      {
        id: "objectives-long", pattern: "objectives", props: {
          eyebrow: "Longest eyebrow it takes, 32 ch",
          title: "Longest title it takes, 48 ch, three lines",
          objectives: Array.from({ length: 5 }, () => ({ text: "The longest objective: fifty-six characters, one line", detail: "The longest detail it takes: one line of about eighty characters." })),
        },
      },
    ],
  },
  {
    id: "team-intro", kind: "layout", name: "Team intro", revision: 2, date: "2026-11-05",
    changes: "The title is centred on the slide and sits on the logo's line: its capitals start at the logo's top. People then get the whole band, centred between the logo and the footer, with 48 between rows. The title keeps 64 clear of the logo, so it takes up to 30 characters. Built in your Tune pick: the Perfect Fifth scale is now this layout's default.",
    request: "de3baa14-3b0a-4fac-a33a-1a5bcd08d266",
    brief: "A team / speaker intro slide. Optional title on top; a row or grid of up to 6 people, each with a round photo (initials if no photo), name, role, and an optional one-line focus or fun fact. With 1 or 2 people the cards grow larger to work as a speaker intro. Should work for sales (account team), internal team intros, onboarding and training facilitators.",
    exceptions: "Cards size themselves by how many people there are: 1 or 2 are a speaker intro (240 photos, h3 names), 3 or 4 share one row (160), 5 or 6 sit three to a row (128) with a last row of two centred. The examples use initials only: no photos of real people until uploads exist. The title sits in the logo's row, outside the band, as asked.",
    entry: { meta: teamIntroMeta, Component: TeamIntro },
    examples: [
      {
        id: "team-six", pattern: "team-intro", props: {
          title: "Your account team",
          people: [
            { name: "First Person", role: "Account lead", note: "Your first call for anything" },
            { name: "Second Person", role: "Solutions engineer", note: "Integration and API questions" },
            { name: "Third Person", role: "Compliance", note: "Onboarding documents" },
            { name: "Fourth Person", role: "Operations", note: "Settlement and payouts" },
            { name: "Fifth Person", role: "Support lead", note: "Day-to-day issues" },
            { name: "Sixth Person", role: "Product manager", note: "Roadmap and feedback" },
          ],
        },
      },
      {
        id: "team-speakers", pattern: "team-intro", props: {
          title: "Today's facilitators",
          people: [
            { name: "First Person", role: "Head of Training", note: "One line on their focus, or a fun fact." },
            { name: "Second Person", role: "Product Specialist", note: "One line on their focus, or a fun fact." },
          ],
        },
      },
      {
        id: "team-five", pattern: "team-intro", props: {
          people: [
            { name: "First Person", role: "Role" }, { name: "Second Person", role: "Role" }, { name: "Third Person", role: "Role" },
            { name: "Fourth Person", role: "Role" }, { name: "Fifth Person", role: "Role" },
          ],
        },
      },
    ],
  },
  {
    id: "roadmap", kind: "layout", name: "Roadmap", revision: 2, date: "2026-11-05",
    changes: "Cards have one padding, 16 on every side, and their text is trimmed to cap height and baseline, so the space above the title and below the note now matches. Each status chip is centred on its title line. In progress is blue now; Blocked and On hold are red, Pending is yellow; Done stays green and Planned grey. The second example shows every status.",
    request: "ac463792-1bf0-4c41-b3ad-c86dfffd4204",
    brief: "A roadmap slide. Title and optional one-line context on top; three columns below labelled Now / Next / Later (labels editable, e.g. Q1 / Q2 / Q3 / Q4 with up to 4 columns). Each column holds up to 4 item cards with a short title, an optional one-line note and an optional status chip (done, in progress, planned). Should work for product roadmaps in sales decks, team plans and project kick-offs.",
    exceptions: "The first column (Now, or the current quarter) takes the accent on its label and rule. Status chips are editable words: Done (green), In progress (orange) and Planned (grey) get their colours, any other word reads as planned. Green, red and yellow are outside the brand palette (status colours people read by meaning), as on Do and don't. Item cards can't be budgeted one by one yet, so the description asks for short titles.",
    entry: { meta: roadmapMeta, Component: Roadmap },
    examples: [
      {
        id: "roadmap-three", pattern: "roadmap", props: {
          title: "Roadmap",
          context: "One line of context, such as what the plan is for.",
          columns: [
            { label: "Now", items: [{ title: "First item", note: "One-line note", status: "In progress" }, { title: "Second item", status: "Done" }, { title: "Third item", note: "One-line note", status: "In progress" }] },
            { label: "Next", items: [{ title: "First item", note: "One-line note", status: "Planned" }, { title: "Second item", status: "Planned" }] },
            { label: "Later", items: [{ title: "First item", note: "One-line note" }, { title: "Second item" }] },
          ],
        },
      },
      {
        id: "roadmap-quarters-full", pattern: "roadmap", props: {
          title: "Plan for the year, by quarter",
          context: "The fullest roadmap it takes: four columns of four cards.",
          columns: [
            ["Done", "In progress", "Pending", "Planned"], ["Done", "In progress", "Blocked", "Planned"],
            ["In progress", "On hold", "Pending", "Planned"], ["Planned", "Planned", "Pending", "Planned"],
          ].map((statuses, q) => ({ label: `Q${q + 1}`, items: statuses.map((status, i) => ({ title: `Item title ${i + 1}`, note: "One-line note", status })) })),
        },
      },
    ],
  },
  {
    id: "comparison", kind: "layout", name: "Comparison", revision: 2, date: "2026-11-05",
    changes: "Row labels and points are centred in their rows by their letters (trimmed to cap height and baseline), so a one-line point sits in the middle beside a two-line one. With the text trimmed to its letters, rows keep 24 above and below the points so they don't get tighter. Built in your Tune line: element spacing 56 and pairs 32 are now this layout's defaults.",
    request: "1940d51f-023f-4f53-b6e1-5622037cb2af",
    brief: "A side-by-side comparison slide. Title on top; two (optionally three) columns with a name header each, and up to 5 rows of short comparison points aligned across columns, with a row label on the left. One column can be highlighted in the brand accent as 'ours' or 'recommended'. Should work for sales (Coins.ph vs. alternatives), internal decisions (option A vs. B) and trainings (old vs. new process).",
    exceptions: "Rows line up across the columns because the whole comparison is one grid; the highlighted column is a tinted card with an accent border behind its cells. The optional tag above the highlighted name (Recommended, Coins.ph) is editable text. Points sit 24 above and below their row lines, measured to their letters, so 5 rows and a tag fit the band. Points can't be budgeted one by one yet, so the description asks for a few words each: at 5 rows each point fits one line, with fewer rows two lines fit. Which column is highlighted is set through the connector for now. The examples' points are placeholders, not claims.",
    entry: { meta: comparisonMeta, Component: Comparison },
    examples: [
      {
        id: "comparison-sales", pattern: "comparison", props: {
          eyebrow: "Why switch",
          title: "Coins.ph and the alternatives",
          columns: ["Coins.ph", "Alternative A", "Alternative B"],
          highlightColumn: 0, highlightLabel: "Recommended",
          rows: [
            { label: "Row label", cells: ["A short point", "A short point", "A short point"] },
            { label: "Row label", cells: ["A short point", "A short point", "A short point"] },
            { label: "Row label", cells: ["A short point", "A short point", "A short point"] },
            { label: "Row label", cells: ["A short point", "A short point", "A short point"] },
          ],
        },
      },
      {
        id: "comparison-two", pattern: "comparison", props: {
          title: "Old process and new process",
          columns: ["Old process", "New process"],
          highlightColumn: 1,
          rows: [
            { label: "Steps", cells: ["Five forms, three approvals", "One form, one approval"] },
            { label: "Who approves", cells: ["Team lead, then finance, then ops", "Team lead"] },
            { label: "Where it lives", cells: ["Email threads and a spreadsheet", "One tracker everyone can see"] },
          ],
        },
      },
      {
        id: "comparison-long", pattern: "comparison", props: {
          eyebrow: "Longest eyebrow it takes, 40 characters",
          title: "Longest title the layout takes, 48 ch",
          columns: ["Name, 16 chars", "Second column", "Third column"],
          highlightColumn: 2, highlightLabel: "Longest tag, 20 ch",
          rows: Array.from({ length: 5 }, (_, i) => ({ label: `Row label ${i + 1}`, cells: ["One-line point", "One-line point", "One-line point"] })),
        },
      },
      {
        id: "comparison-two-lines", pattern: "comparison", props: {
          title: "Option A or option B",
          columns: ["Option A", "Option B"],
          highlightColumn: 0, highlightLabel: "Recommended",
          rows: [
            { label: "Cost", cells: ["A point long enough to need a second line here", "A short point"] },
            { label: "Time", cells: ["A short point", "A point long enough to need a second line here"] },
            { label: "Risk", cells: ["A point long enough to need a second line here", "A point long enough to need a second line"] },
          ],
        },
      },
    ],
  },
  {
    id: "quiz", kind: "layout", name: "Quiz", revision: 1, date: "2026-11-05", // in the library
    request: "c00b3dd8-0a07-407f-81b3-d2210df959d3",
    brief: "A quiz / knowledge check slide. Eyebrow (e.g. 'Quick check') and a question of up to two lines on top; 3 or 4 answer options below as cards. In presenting mode, clicking an option (or pressing a key) reveals the correct answer highlighted in the brand accent, plus a one-line explanation. Should work for trainings, onboarding and team sessions.",
    exceptions: "Four options sit in a 2 × 2 grid (a row of four leaves each card too narrow for two lines); three sit in one row. The explanation's space is kept while hidden, so revealing moves nothing. Option text is trimmed to its baseline (not the descender line) so it centres on the letter badge by its letters: optical. Which option is right is set through the connector for now (the slide form has no checkbox yet). Try it: present a deck with this slide, then click a card or press 1–4. The second example shows the revealed state.",
    entry: { meta: quizMeta, Component: Quiz },
    examples: [
      {
        id: "quiz-four", pattern: "quiz", props: {
          eyebrow: "Quick check",
          question: "A customer wants to pay a store using a QR code. Which product do they use?",
          options: [{ text: "Send money" }, { text: "QRPh", correct: true }, { text: "Cash in at a partner outlet" }, { text: "Buy load" }],
          explanation: "QRPh is the national QR standard: one code works across banks and e-wallets.",
        },
      },
      {
        id: "quiz-revealed", pattern: "quiz", props: {
          eyebrow: "Quick check, answer shown",
          question: "A customer wants to pay a store using a QR code. Which product do they use?",
          options: [{ text: "Send money" }, { text: "QRPh", correct: true }, { text: "Cash in at a partner outlet" }, { text: "Buy load" }],
          explanation: "QRPh is the national QR standard: one code works across banks and e-wallets.",
          showAnswer: true,
        },
      },
      {
        id: "quiz-three-long", pattern: "quiz", props: {
          eyebrow: "Longest eyebrow it takes, 32 ch",
          question: "The longest question the layout takes runs to two full lines: about ninety-six characters here.",
          options: [{ text: "The longest option it takes: sixty characters, on two lines." }, { text: "A second option, also on the long side for a card.", correct: true }, { text: "A short third option." }],
          explanation: "The longest explanation it takes: one line of about a hundred characters, shown after the reveal.",
          showAnswer: true,
        },
      },
    ],
  },
  {
    id: "screenshot-walkthrough", kind: "layout", name: "Screenshot walkthrough", revision: 2, date: "2026-11-05", // in the library
    changes: "Markers are now placed by hand on the slide: in the deck editor, drag a number onto the spot it explains. Its position is kept in % of the screenshot (to 0.1%), so it stays on that spot at any image size or crop of the slide. Click a marker and use the arrow keys to nudge it 0.1% (Shift: 1%); zoom the canvas in for fine work; a readout shows its x / y while you place it. Adding a callout in the form drops it beside the last one, ready to drag. This works for any layout that marks its items as placeable, so later layouts with pins can use it too.",
    request: "79d8eae3-eafd-4e88-8c4d-2481e00c113d",
    brief: "A screenshot walkthrough slide. One large app screenshot or phone mockup on one side, with up to 5 numbered callout markers placed on it; a matching numbered legend on the other side (short title + one-line explanation per number). Optional title and eyebrow above the legend. Should work for app trainings, product demos in sales decks, and internal release notes.",
    exceptions: "The legend title uses h3, not h2, so a two-line title and five callouts fit the narrower legend column. Number badges sit on the middle of each title's capitals and the digits are trimmed to the baseline, both optical. Markers are placed by dragging on the editor canvas and stored in % of the image (the form doesn't show x / y). The examples reuse the Coins Pro screenshot from the Sales master until uploads exist.",
    entry: { meta: screenshotWalkthroughMeta, Component: ScreenshotWalkthrough },
    examples: [
      {
        id: "walkthrough-pro", pattern: "screenshot-walkthrough", props: {
          eyebrow: "Coins Pro",
          title: "Your first trade, screen by screen",
          image: "/figma/s35/hero.png",
          callouts: [
            { x: 13.5, y: 7.5, title: "Pick a pair", text: "Switch markets from the pair menu." },
            { x: 45, y: 42, title: "Read the chart", text: "Candles, volume and indicators in one view." },
            { x: 84, y: 12.5, title: "Check the order book", text: "Live bids and asks before you place an order." },
            { x: 88, y: 38, title: "Place your order", text: "Limit, market or stop-limit, then Buy or Sell." },
            { x: 9, y: 74.5, title: "Track open orders", text: "Edit or cancel orders that haven't filled yet." },
          ],
        },
      },
      {
        id: "walkthrough-right-short", pattern: "screenshot-walkthrough", props: {
          image: "/figma/s35/hero.png", side: "right",
          callouts: [
            { x: 45, y: 42, title: "Price chart", text: "One line about this part of the screen." },
            { x: 95, y: 38, title: "Order panel", text: "One line about this part of the screen." },
          ],
        },
      },
    ],
  },
  {
    id: "do-dont", kind: "layout", name: "Do and don't", revision: 1, date: "2026-11-05", // in the library
    request: "9bcc33d9-9ad7-4538-beb0-5eea3f2c52ff",
    brief: "A Do / Don't slide. Title on top; two equal columns below: a 'Do' column marked with a check and a 'Don't' column marked with a cross, each with up to 4 short items. Optional example image at the top of each column (e.g. a correct vs. incorrect screen). Should work for trainings, guidelines (brand, compliance, customer handling) and internal onboarding.",
    exceptions: "Do and Don't use green (#15803d) and red (#dc2626), outside the brand palette: the check and cross carry the meaning and these are the colours people read them by. They don't change with the theme. Item marks sit on the middle of the first line's capitals (optical). The column headings are editable, so they can be translated or renamed (Correct / Incorrect). The image example reuses Sales master pictures until uploads exist.",
    entry: { meta: doDontMeta, Component: DoDont },
    examples: [
      {
        id: "do-dont-text", pattern: "do-dont", props: {
          title: "Handling a customer complaint",
          doLabel: "Do", dontLabel: "Don't",
          dos: ["Listen to the whole story first", "Repeat the issue back in their words", "Say what happens next and when", "Log the case before you hang up"],
          donts: ["Interrupt or rush to a fix", "Blame another team", "Promise a refund you can't approve", "Ask for their PIN or password"],
        },
      },
      {
        id: "do-dont-images", pattern: "do-dont", props: {
          title: "Using the QRPh standee",
          doLabel: "Do", dontLabel: "Don't",
          doImage: "/figma/s17/hero.jpg", dontImage: "/figma/s11/hero.png",
          dos: ["Place it where customers can scan it", "Keep the code clean and flat"],
          donts: ["Cover the code with other stickers", "Print a copy at a smaller size"],
        },
      },
      {
        id: "do-dont-long", pattern: "do-dont", props: {
          title: "Longest title the layout takes, in one line ok",
          doLabel: "Do this, 16 ch", dontLabel: "Don't do this",
          doImage: "/figma/s17/hero.jpg", dontImage: "/figma/s11/hero.png",
          dos: ["The longest item it takes: 48 characters, 1 line", "Second item", "Third item", "Fourth item"],
          donts: ["The longest item it takes: 48 characters, 1 line", "Second item", "Third item", "Fourth item"],
        },
      },
    ],
  },
  {
    id: "data-table", kind: "layout", name: "Data table", revision: 2, date: "2026-11-05", // in the library, with the Perfect Fifth scale
    changes: "Rows are 20% taller (56 → 68) and their text is centred in the row by its letters: cells are trimmed to cap height and baseline, so descender space no longer pushes the words up. With all 8 rows, rows are 60 and the gap above the table 40, so the table stays inside the band. Built in your Tune pick: the Perfect Fifth scale (h2 72/88, lead 39/56, body 32/48, caption 26/40) is now this layout's default.",
    request: "55ab406c-5f2f-40f8-9ae5-be520535b422",
    brief: "A data table slide. Title and a one-line takeaway on top; a table of up to 6 columns and 8 rows below, with a header row and right-aligned numbers. One row or one column can be highlighted in the brand accent. Optional small source note in the footer. Should work for sales (fees or limits by tier), internal reports (metrics by team) and trainings (reference values).",
    exceptions: "Numbers use Manrope (rule change 2026-11-05, was Everett), and a column is right-aligned when at least half its cells are numbers (so a Custom among fees stays in line). Row height is 68 (56 + 20%, as asked), on the 4 half step inside the table; 8 rows use 60, with 40 above the table, to fit the band. Cells don't wrap: the budget can't check single cells yet, so keep them short (an over-long cell will show past its column in review). The source note sits in the footer row, outside the band, as on the Column chart. Which row or column is highlighted is set through the connector for now. Figures in the examples are sample values for review only.",
    entry: { meta: dataTableMeta, Component: DataTable },
    examples: [
      {
        id: "data-table-tiers", pattern: "data-table", props: {
          title: "Fees by tier",
          takeaway: "One line on what the table shows, such as which tier fits most clients.",
          columns: ["Tier", "Monthly volume", "Fee", "Settlement", "Limit per day"],
          rows: [
            { cells: ["Starter", "PHP 1M", "1.5%", "T+1", "₱500,000"] },
            { cells: ["Growth", "PHP 10M", "1.2%", "T+1", "₱2,000,000"], highlight: true },
            { cells: ["Scale", "PHP 50M", "0.9%", "T+0", "₱10,000,000"] },
            { cells: ["Enterprise", "PHP 100M", "Custom", "T+0", "Custom"] },
          ],
          source: "Source: sample data for layout review",
        },
      },
      {
        id: "data-table-full", pattern: "data-table", props: {
          title: "Signups by team, last quarter",
          takeaway: "A full table: 6 columns, 8 rows, with one column highlighted.",
          columns: ["Team", "Jul", "Aug", "Sep", "Quarter", "Change"],
          highlightColumn: 4,
          rows: [
            { cells: ["North", "1,240", "1,310", "1,402", "3,952", "+8%"] },
            { cells: ["South", "980", "1,020", "1,105", "3,105", "+6%"] },
            { cells: ["East", "760", "742", "801", "2,303", "+2%"] },
            { cells: ["West", "1,105", "1,188", "1,250", "3,543", "+7%"] },
            { cells: ["Central", "640", "702", "755", "2,097", "+9%"] },
            { cells: ["Online", "2,310", "2,480", "2,615", "7,405", "+6%"] },
            { cells: ["Partners", "410", "455", "490", "1,355", "+10%"] },
            { cells: ["Total", "7,445", "7,897", "8,418", "23,760", "+7%"] },
          ],
          source: "Source: sample data for layout review",
        },
      },
    ],
  },
  {
    id: "bullets", kind: "layout", name: "Title and bullets", revision: 1, date: "2026-11-05", // in the library
    request: "04b77e68-4a38-491b-bef4-df32229625af",
    brief: "A title + bullets content slide, the everyday workhorse. Optional eyebrow, a title of up to two lines, then 3 to 6 bullets, each with an optional one-line sub-point. Optional small image or icon on the right; without it, bullets take the full width. Should work for sales talking points, internal updates and training notes.",
    exceptions: "With 5 or 6 bullets that have sub-points, bullets step at 16 instead of 24 and each sub-point sits 4 under its bullet instead of 8 (the half step, inside the bullet), so the longest case stays inside the band. The accent dash sits on the middle of the first line's capitals (optical). The image example reuses a Sales master picture until uploads exist.",
    entry: { meta: bulletsMeta, Component: Bullets },
    examples: [
      {
        id: "bullets-plain", pattern: "bullets", props: {
          eyebrow: "Why Coins.ph",
          title: "Talking points for the first call",
          bullets: [{ text: "First talking point, one benefit in a single line" }, { text: "Second talking point, what makes it different" }, { text: "Third talking point, the next step for the client" }],
        },
      },
      {
        id: "bullets-image", pattern: "bullets", props: {
          eyebrow: "Release notes",
          title: "What changed this sprint",
          image: "/figma/s17/hero.jpg",
          bullets: [
            { text: "First change, in a few words", sub: "One line on what it means for customers." },
            { text: "Second change, in a few words", sub: "One line on what it means for customers." },
            { text: "Third change, in a few words", sub: "One line on what it means for customers." },
            { text: "A change without a sub-point" },
          ],
        },
      },
      {
        id: "bullets-long", pattern: "bullets", props: {
          eyebrow: "Longest eyebrow it takes, 40 characters",
          title: "Longest title the layout takes, on two lines: 60 ch",
          image: "/figma/s17/hero.jpg",
          bullets: Array.from({ length: 6 }, () => ({ text: "The longest bullet it takes: 56 characters, one line ok", sub: "The longest sub-point it takes: one line of about eighty characters, in grey." })),
        },
      },
    ],
  },
  {
    id: "column-chart", kind: "layout", name: "Column chart", revision: 2, date: "2026-11-05", // in the library, with the Golden Ratio scale it was approved with
    request: "b4be7cf2-144c-435d-bafc-5daca45aa53a",
    brief: "A bar/column chart slide. Title and a one-line takeaway on the left; a vertical column chart on the right with up to 8 categories, the value labelled on top of each bar, and one highlighted bar in the brand accent (the rest muted). Optional unit label on the axis and a small source note in the footer. Should work for sales (volume by month), internal reports (signups per quarter) and trainings.",
    changes: "Category labels no longer split a word (\"Categor / y\"): they wrap between words only, and each label may now reach 8 into the gap on either side, so words up to about 8 characters (\"Category\", \"December\") fit at 8 bars and neighbours keep 8 of air. Built in your Tune pick: the Golden Ratio scale (h2 84/104, h3 52/64, body 32/48, caption 25/40) is now this layout's default.",
    exceptions: "The chart fills the band's full height instead of being centred in it, so bars get the most room; the title and takeaway block is centred as usual. The source note sits in the footer row (right-aligned to x 1840, on the confidentiality line's baseline), outside the band, as asked. Value labels step down from h3 to body when there are more than 5 bars, so they fit an 8-bar column. Category labels reach 8 into the gaps, so at 8 bars the first and last can sit up to 8 past the chart edge (x 1848 at most). Figures in the examples are sample values for review only.",
    entry: { meta: columnChartMeta, Component: ColumnChart },
    examples: [
      {
        id: "column-chart-sales", pattern: "column-chart", props: {
          title: "Monthly volume",
          takeaway: "One line on what the chart shows, such as the month that stands out.",
          axisLabel: "Volume, PHP millions",
          bars: [{ label: "Jan", value: "120" }, { label: "Feb", value: "135" }, { label: "Mar", value: "128" }, { label: "Apr", value: "150" }, { label: "May", value: "162" }, { label: "Jun", value: "158" }, { label: "Jul", value: "174" }, { label: "Aug", value: "196" }],
          source: "Source: sample data for layout review",
        },
      },
      {
        id: "column-chart-report", pattern: "column-chart", props: {
          title: "Signups per quarter",
          takeaway: "Q2 was the strongest quarter so far.",
          axisLabel: "Signups",
          bars: [{ label: "Q1 2026", value: "48K" }, { label: "Q2 2026", value: "61K", highlight: true }, { label: "Q3 2026", value: "57K" }, { label: "Q4 2026", value: "52K" }],
          source: "Source: sample data for layout review",
        },
      },
      {
        id: "column-chart-training", pattern: "column-chart", props: {
          title: "Where tickets come from",
          takeaway: "Most questions are about cash in, so the training starts there.",
          bars: [{ label: "Cash in", value: "42%" }, { label: "Cash out", value: "23%" }, { label: "Bills", value: "18%" }, { label: "Load", value: "11%" }, { label: "Other", value: "6%" }],
        },
      },
      {
        id: "column-chart-long", pattern: "column-chart", props: {
          title: "Longest title the layout takes, three lines",
          takeaway: "The longest takeaway the layout takes: one sentence on what the reader should remember.",
          axisLabel: "Longest unit label it takes, 32 ch",
          bars: [{ label: "Category 1", value: "₱1.2B" }, { label: "Two-line label", value: "₱980M" }, { label: "Category 3", value: "₱1.1B" }, { label: "Category 4", value: "₱640M" }, { label: "Category 5", value: "₱720M" }, { label: "Category 6", value: "₱1.4B", highlight: true }, { label: "Category 7", value: "₱860M" }, { label: "Category 8", value: "₱0" }],
          source: "Source: the longest source note the layout takes, about ninety characters in one line.",
        },
      },
    ],
  },
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
