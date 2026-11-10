import type { PatternEntry } from "@/deck/registry";
import { DEFAULT_TOKENS, type ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { ClientQuote, clientQuoteMeta } from "@/deck/patterns/ClientQuote";
import type { Extra } from "@/ui/RenderScreen";
import type { Node } from "@/ui/types";
import { AccordionCard, IconRow, ListSection, ValueRow } from "./ui/AccordionCard";
import { ColumnChart, columnChartMeta } from "@/deck/patterns/ColumnChart";
import { Bullets, bulletsMeta } from "@/deck/patterns/Bullets";
import { Comparison, comparisonMeta } from "@/deck/patterns/Comparison";
import { Objectives, objectivesMeta } from "@/deck/patterns/Objectives";
import { Roadmap, roadmapMeta } from "@/deck/patterns/Roadmap";
import { Takeaways, takeawaysMeta } from "@/deck/patterns/Takeaways";
import { TeamIntro, teamIntroMeta } from "@/deck/patterns/TeamIntro";
import { StatusUpdate, statusUpdateMeta } from "@/deck/patterns/StatusUpdate";
import { Matrix, matrixMeta } from "@/deck/patterns/Matrix";
import { Scenario, scenarioMeta } from "@/deck/patterns/Scenario";
import { Glossary, glossaryMeta } from "@/deck/patterns/Glossary";
import { Faq, faqMeta } from "@/deck/patterns/Faq";
import { HeroNumber, heroNumberMeta } from "@/deck/patterns/HeroNumber";
import { Funnel, funnelMeta } from "@/deck/patterns/Funnel";
import { ProsCons, prosConsMeta } from "@/deck/patterns/ProsCons";
import { Checklist, checklistMeta } from "@/deck/patterns/Checklist";
import { Raci, raciMeta } from "@/deck/patterns/Raci";
import { AgendaLong, agendaLongMeta } from "./layouts/AgendaLong";
import { BeforeAfter, beforeAfterMeta } from "@/deck/patterns/BeforeAfter";
import { Testimonials, testimonialsMeta } from "./layouts/Testimonials";
import { Persona, personaMeta } from "@/deck/patterns/Persona";
import { Options, optionsMeta } from "./layouts/Options";
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
 * library alongside the original. A revision (Revise on a library card) is built the same way, with `remixOf`
 * and `revises: true`: once approved it replaces the original (the template's layout and example, or the theme's
 * tokens as a new version) instead of joining the library beside it.
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
  /** With `remixOf`: this revises the original, which it replaces once approved, rather than being a variant. */
  revises?: boolean;
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
    id: "coins-chrome-shift", kind: "theme", name: "Coins.ph: logo and footer moved", revision: 1, date: "2026-11-10",
    request: "992752cb-d526-42d6-a545-09ec26140aae", remixOf: "theme:coins", revises: true,
    brief: "I want the position of the \"Coins\" logo and \"Strictly private and confidential..\" to move from slides 2-15. Move logo to 40px up. Then the text 30px down.",
    exceptions: "The footer moves 30, which is off the 8-point grid, as asked (chrome isn't on the grid anyway). Every slide but the cover moves: the cover keeps its large logo and footer place, since the request names slides 2 onward, and all the other slides share one logo and footer place. Themes can now nudge the chrome (new optional chrome token); source notes in the footer row move with the footer so they stay on its baseline. Colours, glow and accent stay exactly as the published Coins.ph theme.",
    tokens: { ...DEFAULT_TOKENS, chrome: { logoShift: -40, footerShift: 30 } },
  },
  {
    id: "agenda-long", kind: "layout", name: "Long agenda", revision: 2, date: "2026-11-10",
    changes: "The example is a sample training day, with the columns titled Morning and Afternoon (new optional column titles). Breaks get a coffee or lunch mark in place of the number, on a light tint, and aren't counted, so sessions number 01 to 06 around them. The time no longer runs into the text: the title column is narrower (384, was 448, with a 64 gutter) to give the sections more width, and the section budgets are shorter (titles 22, descriptions 32, times 6 characters). Built in your Tune line: the Perfect Fifth scale is now this layout's default.",
    request: "51654aec-2da3-44be-8b69-d817bb6e55ae",
    brief: "A long agenda slide for trainings and workshops. Title on the left; 5 to 8 numbered sections on the right in two columns (filled top to bottom), each with a short title, an optional one-line description and an optional time or duration (e.g. '10:30' or '20 min'). One section can be marked as the current one in the brand accent, so the same slide can return between sections as a 'you are here'.",
    exceptions: "Every section is a box with 24 on every side, even when it isn't current, so marking one current only changes its colour (tint and accent outline) and nothing moves. Numbers are two digits in a 48 column, as on Key takeaways. Section titles and descriptions are one line each so 4 rows and a column title fit a column; times sit at the right of their row. Break marks are emoji, as asked, rather than drawn shapes, in a 48 × 40 box. Column titles are spaced capitals (8% tracking), set in line with the row text. An optional eyebrow was added, as on the other title-left slides. The sample program is an example of the format, not a real schedule.",
    entry: { meta: agendaLongMeta, Component: AgendaLong },
    examples: [
      {
        id: "agenda-long-day", pattern: "agenda-long", props: {
          eyebrow: "New hire onboarding",
          title: "Support Team Training: Day 1",
          columns: ["Morning", "Afternoon"],
          current: 4,
          sections: [
            { title: "Welcome and the team", description: "Meet your trainers and cohort", time: "9:00" },
            { title: "How Coins works", description: "Products, users and our role", time: "9:30" },
            { title: "Our support tools", description: "Tickets, macros, help centre", time: "10:30" },
            { title: "Lunch", time: "12:00", break: "lunch" },
            { title: "Verifying accounts", description: "KYC levels and common issues", time: "13:00" },
            { title: "Handling disputes", description: "From first reply to resolution", time: "14:00" },
            { title: "Coffee break", time: "15:00", break: "coffee" },
            { title: "Practice and Q&A", description: "Live tickets with a buddy", time: "15:15" },
          ],
        },
      },
      {
        id: "agenda-long-full", pattern: "agenda-long", props: {
          eyebrow: "Longest eyebrow it takes, 32 ch",
          title: "Longest title it takes: forty characters",
          columns: ["Longest column title, 24", "Longest column title, 24"],
          current: 5,
          sections: Array.from({ length: 8 }, (_, i) => i === 3
            ? { title: "Coffee break", time: "20 min", break: "coffee" as const }
            : { title: "Longest title, 22 char", description: "Longest description it has, 32 c", time: "20 min" }),
        },
      },
    ],
  },
  {
    id: "before-after", kind: "layout", name: "Before and after", revision: 1, date: "2026-11-09", // in the library
    request: "4e32b2ad-1f5a-4605-9933-22925a08e099",
    brief: "A before / after metrics slide. Title and a one-line takeaway on top; 2 to 4 metric cards below, each showing the metric name, the 'before' value (muted), an arrow, the 'after' value (large) and the change as a signed figure coloured green or red depending on whether it is good (e.g. '-40% time' can be good). Optional source note in the footer. Should work for sales (results after switching), project retros and internal updates.",
    exceptions: "Before, the arrow and after stack top to bottom (a down arrow) so four cards fit across with the after value at h2. The change is green when good and red when not: set good on a metric, or a + change reads as good and a − change as bad. Green and red are status colours read by meaning. The takeaway allows two lines. The examples' figures are placeholders, not claims.",
    entry: { meta: beforeAfterMeta, Component: BeforeAfter },
    examples: [
      {
        id: "before-after-three", pattern: "before-after", props: {
          title: "Before and after the change",
          takeaway: "One line on what changed, such as the result that matters most.",
          metrics: [
            { name: "First metric", before: "00 min", after: "00 min", change: "−40%", good: true },
            { name: "Second metric", before: "00%", after: "00%", change: "+12 pts" },
            { name: "Third metric", before: "00", after: "00", change: "−8%" },
          ],
          source: "Source: add where the figures come from",
        },
      },
      {
        id: "before-after-full", pattern: "before-after", props: {
          title: "Longest title it takes: forty-eight characters",
          takeaway: "The longest takeaway it takes: about ninety-six characters, on up to two lines in grey under it.",
          metrics: Array.from({ length: 4 }, (_, i) => ({ name: "Longest name, 24 chars", before: "PHP 12.5M", after: "PHP 9.5M", change: i % 2 ? "+120.5%" : "−120.5%", good: i % 2 === 0 })),
        },
      },
    ],
  },
  {
    id: "testimonials", kind: "layout", name: "Testimonial grid", revision: 2, date: "2026-11-10",
    changes: "Quotes are set tighter: 32/40 (was 32/48), and 40/48 when featured (was 40/56). The examples use Filipino and Chinese names. Built in your Tune line: element spacing 48 (as before) and pairs 24 (the eyebrow and title, was 16).",
    request: "8e69d06d-7001-42cb-b8b6-37d8ab88775a",
    brief: "A testimonial grid slide. Optional eyebrow and a title on top; 2 to 4 short quotes below as cards, each with the quote (up to three lines), the person's name and their role and company, and an optional small logo or photo. One card can be featured larger. Should work for sales (what clients say), internal recognition (shout-outs from colleagues) and trainings (learner feedback).",
    exceptions: "Quotes run to 90 characters, which takes up to six lines in the narrow cards (asked for three): three lines would allow only about 50 characters at four across. The featured card takes twice the width, a larger quote and the accent, and works with up to 3 quotes; with 4 there's no room, so they stay equal. Names and roles may wrap to two lines in narrow cards. Quote line heights are 1.25× their size (32/40, 40/48), tighter than the body and lead steps (48, 56), as asked; the Tune card's scale preview still changes their size. The names in the examples are made up for the layout and the quotes are placeholders: use real quotes only, with permission.",
    entry: { meta: testimonialsMeta, Component: Testimonials },
    examples: [
      {
        id: "testimonials-three", pattern: "testimonials", props: {
          eyebrow: "What clients say",
          title: "In their words",
          featured: 0,
          quotes: [
            { quote: "A short quote about the result they got, in their own words, in two or three lines.", name: "Maria Santos", role: "Role, Company" },
            { quote: "A shorter quote, in their own words.", name: "Chen Wei Ming", role: "Role, Company" },
            { quote: "A shorter quote, in their own words.", name: "Juan Miguel dela Cruz", role: "Role, Company" },
          ],
        },
      },
      {
        id: "testimonials-four", pattern: "testimonials", props: {
          eyebrow: "Longest eyebrow it takes, 40 characters",
          title: "Longest title it takes: forty-eight characters",
          quotes: ["Ma. Teresa Villanueva-Santos", "Lim Mei Ling Go-Tan", "Francisco Bautista Reyes", "Huang Jia Hui"].map((name) => ({ quote: "The longest quote it takes: about ninety characters, in the person's own words, here.", name, role: "Longest role it takes, 36 characters" })),
        },
      },
    ],
  },
  {
    id: "persona", kind: "layout", name: "Customer persona", revision: 1, date: "2026-11-09", // in the library
    request: "ac732f4e-593e-4d4b-96a2-b128dc9eedcf",
    brief: "A customer persona slide. On the left: a round photo or initials, the persona's name, a one-line description (e.g. 'Online seller, 28, Manila') and up to 3 small tags. On the right: three short sections, Goals, Pain points and How we help, each with up to 3 one-line bullets. An optional quote from the persona in their own words at the bottom. Should work for sales and product kick-offs, design reviews and support trainings.",
    exceptions: "The persona sits on a light navy card (a deliberate container) so it reads as one person. The three sections are side by side, so bullets may wrap to two lines (44 characters); stacked, they wouldn't fit the band with the quote. The name and description allow two lines each in the narrow card. The quote sits under the sections, beside an accent quote mark. Section names are editable (labels). The example persona is made up for the layout.",
    entry: { meta: personaMeta, Component: Persona },
    examples: [
      {
        id: "persona-seller", pattern: "persona", props: {
          name: "Persona name",
          description: "One line on who they are, such as their work and where they live.",
          tags: ["Tag one", "Tag two", "Tag three"],
          goals: ["What they want to get done", "A second goal", "A third goal"],
          pains: ["What gets in their way today", "A second pain point"],
          help: ["How we help with the first", "How we help with the second"],
          quote: "Something they'd say about it, in their own words.",
        },
      },
      {
        id: "persona-full", pattern: "persona", props: {
          name: "Longest name, 20 ch",
          description: "The longest description it takes: 48 characters.",
          tags: ["Longest 14 ch.", "Longest 14 ch.", "Longest 14 ch."],
          goals: Array.from({ length: 3 }, () => "The longest bullet it takes: 44 chars, 2 lines"),
          pains: Array.from({ length: 3 }, () => "The longest bullet it takes: 44 chars, 2 lines"),
          help: Array.from({ length: 3 }, () => "The longest bullet it takes: 44 chars, 2 lines"),
          quote: "The longest quote it takes: about a hundred and ten characters, in the persona's own words, on up to two lines.",
        },
      },
    ],
  },
  {
    id: "options", kind: "layout", name: "Options and recommendation", revision: 2, date: "2026-11-10",
    changes: "More room between the points: 24 between them (was 16), the rule 4 minimum for list items, so each point reads on its own.",
    request: "727f6a4c-abee-4fde-911b-9ec21f75d9b9",
    brief: "An options + recommendation slide for decisions. Title and an optional one-line context on top; 2 or 3 option cards side by side, each with a short name, a one-line summary and up to 3 short points (cost, time, risk). One option is marked as recommended in the brand accent with a short 'why' line under the cards. Should work for management decisions, project proposals, client proposals in sales and workshop read-outs.",
    exceptions: "The Recommended tag sits beside the option's name (it moves under a long name rather than run out of the card), so three cards and the why line fit the band; the recommended card also gets a 4 accent border and a light tint. The tag's word is editable (tag). Summaries may wrap to two lines in three columns. The why line starts with an accent \"Why:\".",
    entry: { meta: optionsMeta, Component: Options },
    examples: [
      {
        id: "options-three", pattern: "options", props: {
          title: "Three ways forward",
          context: "One line of context, such as the decision to make and by when.",
          recommended: 1,
          options: [
            { name: "Option A", summary: "One line on what this option is.", points: ["Cost: a short note", "Time: a short note", "Risk: a short note"] },
            { name: "Option B", summary: "One line on what this option is.", points: ["Cost: a short note", "Time: a short note", "Risk: a short note"] },
            { name: "Option C", summary: "One line on what this option is.", points: ["Cost: a short note", "Time: a short note", "Risk: a short note"] },
          ],
          why: "One line on why this option, such as the trade-off that decides it.",
        },
      },
      {
        id: "options-full", pattern: "options", props: {
          title: "Longest title it takes: forty-eight characters",
          context: "The longest context it takes: about ninety characters, on one line, in grey under it.",
          recommended: 2, tag: "Longest 14 ch.",
          options: Array.from({ length: 3 }, () => ({ name: "Longest name 18 c", summary: "The longest summary it takes: about sixty-four characters, 2 ln.", points: ["Longest point it takes, 30 ch", "Longest point it takes, 30 ch", "Longest point it takes, 30 ch"] })),
          why: "The longest why line it takes: about ninety-six characters, on one line, under the three cards.",
        },
      },
    ],
  },
  {
    id: "hero-number", kind: "layout", name: "Hero number", revision: 2, date: "2026-11-09", // in the library
    changes: "Made it a statement slide: the dark navy background with the brand glow (as on covers and section dividers), a warm orange spotlight behind the figure and a cool blue wash from the top. The figure is filled with a white-to-orange gradient with a soft orange glow under it; the eyebrow is gold capitals, the label white and the context soft white. The layout stays as it was.",
    request: "3eda07fe-8024-48d2-ac84-e8563d531ba6",
    brief: "A single hero number slide. One very large figure (e.g. '2.4M' or '98%') as the focus, with a short label under it and an optional one-line context or comparison (e.g. 'up from 1.8M last year'). Optional eyebrow above and a small source note in the footer. Should work for sales (one proof point), internal updates (the metric that matters) and trainings (a striking fact).",
    exceptions: "The figure is 240/256, twice the display step and outside the type scale, because the request asks for one very large figure. Everything is centred (the only content on the slide). The spotlight and wash are deliberate background layers. The eyebrow is spaced capitals (8% tracking) so it reads as a kicker over the figure. The examples' figures are placeholders, not claims.",
    entry: { meta: heroNumberMeta, Component: HeroNumber },
    examples: [
      {
        id: "hero-number-one", pattern: "hero-number", props: {
          eyebrow: "The number that matters",
          value: "00.0M",
          label: "What the figure counts",
          context: "One line of context, such as how it compares with last year.",
          source: "Source: add where the figure comes from",
        },
      },
      {
        id: "hero-number-long", pattern: "hero-number", props: {
          eyebrow: "Longest eyebrow it takes, 40 characters",
          value: "PHP 1.2B",
          label: "Longest label it takes: forty-eight characters",
          context: "The longest context it takes: about eighty characters, on up to two lines.",
        },
      },
    ],
  },
  {
    id: "funnel", kind: "layout", name: "Funnel", revision: 2, date: "2026-11-09", // in the library
    changes: "Stage names are left-aligned. New variant (labels: top): each stage name sits 16 above its bar, on the bar's left edge, with its change beside it; bars are 56 tall there (72 in the side variant) so six stages still fit. Changes are signed and coloured: start one with + for green with an up arrow, − or - for red with a down arrow; without a sign it stays grey. The examples show both variants.",
    request: "f0a6ab81-5fb7-44c8-aad7-44b488a92a9f",
    brief: "A funnel slide. Title and a one-line takeaway on the left; a funnel on the right with 3 to 6 stages stacked top to bottom, each narrower than the one above, showing the stage name, its value and an optional conversion rate between stages. The stage that matters most can be highlighted in the brand accent. Optional small source note in the footer. Should work for sales (customer journey), growth reviews (sign-up to first transaction) and trainings.",
    exceptions: "Bar widths step down evenly (to 40% of the widest) and show order, not the figures: true-to-scale bars would make late stages too thin to hold their figure. In the side variant stage names sit left of the bars, left-aligned, because the narrowest bars only fit the figure. Green and red are status colours read by meaning. Bars step from navy to a lighter navy so the funnel reads top to bottom; the white figures stay at 3:1 or better (large bold text). The takeaway allows up to three lines because the left column is narrow. The examples' figures are placeholders.",
    entry: { meta: funnelMeta, Component: Funnel },
    examples: [
      {
        id: "funnel-five", pattern: "funnel", props: {
          title: "From sign-up to first transaction",
          takeaway: "One line on what the funnel shows, such as where people drop off.",
          stages: [
            { label: "First stage", value: "100K" }, { label: "Second stage", value: "64K", rate: "−36%" },
            { label: "Third stage", value: "40K", rate: "−37%" }, { label: "Fourth stage", value: "22K", rate: "−45%" },
            { label: "Fifth stage", value: "12K", rate: "−45%" },
          ],
          highlight: 3,
          source: "Source: add where the figures come from",
        },
      },
      {
        id: "funnel-top", pattern: "funnel", props: {
          title: "From sign-up to first transaction",
          takeaway: "One line on what the funnel shows, such as where people drop off.",
          labels: "top",
          stages: [
            { label: "First stage", value: "100K" }, { label: "Second stage", value: "64K", rate: "−36%" },
            { label: "Third stage", value: "40K", rate: "−37%" }, { label: "Fourth stage", value: "44K", rate: "+10%" },
            { label: "Fifth stage", value: "12K", rate: "−73%" },
          ],
          highlight: 3,
        },
      },
      {
        id: "funnel-top-full", pattern: "funnel", props: {
          title: "Longest title it takes, 48 ch, three lines",
          takeaway: "The longest takeaway it takes: about ninety characters, on up to three lines in grey.",
          labels: "top",
          stages: Array.from({ length: 6 }, (_, i) => ({ label: "Longest stage, 22 ch", value: "PHP 120.5M", rate: i ? "−100.0%" : undefined })),
          highlight: 5,
        },
      },
      {
        id: "funnel-full", pattern: "funnel", props: {
          title: "Longest title it takes, 48 ch, three lines",
          takeaway: "The longest takeaway it takes: about ninety characters, on up to three lines in grey.",
          stages: Array.from({ length: 6 }, (_, i) => ({ label: "Longest stage, 22 ch", value: "PHP 120.5M", rate: i ? "+100.0%" : undefined })),
          highlight: 5,
        },
      },
    ],
  },
  {
    id: "pros-cons", kind: "layout", name: "Pros and cons", revision: 1, date: "2026-11-09", // in the library
    request: "2a06ce40-9ecb-46d5-a0f4-614e62844f67",
    brief: "A pros and cons slide. Title (e.g. the option being weighed) with an optional eyebrow; two columns below: Pros marked with a plus and Cons marked with a minus, up to 5 short items each. Optional verdict line at the bottom (e.g. 'Recommendation: go ahead, with a pilot first'). Should work for internal decisions, proposals to management, sales (why switch) and trainings.",
    exceptions: "Pros are green and cons red, status colours read by meaning, as on Do and don't. Items are one line each (48 characters) so 5 per column and the verdict fit the band together. The verdict box takes the accent on its left edge. Column names are editable (labels).",
    entry: { meta: prosConsMeta, Component: ProsCons },
    examples: [
      {
        id: "pros-cons-three", pattern: "pros-cons", props: {
          eyebrow: "Option A",
          title: "The option being weighed",
          pros: ["A short pro, in a few words", "A second pro", "A third pro"],
          cons: ["A short con, in a few words", "A second con"],
          verdict: "Recommendation: one line on what to do, such as going ahead with a pilot first.",
        },
      },
      {
        id: "pros-cons-full", pattern: "pros-cons", props: {
          eyebrow: "Longest eyebrow it takes, 40 characters",
          title: "Longest title it takes: forty-eight characters",
          pros: Array.from({ length: 5 }, () => "The longest item it takes: forty-eight chars"),
          cons: Array.from({ length: 5 }, () => "The longest item it takes: forty-eight chars"),
          verdict: "The longest verdict it takes: about ninety-six characters, on one line, in a box with the accent.",
        },
      },
    ],
  },
  {
    id: "checklist", kind: "layout", name: "SOP checklist", revision: 2, date: "2026-11-09", // in the library
    changes: "Steps go to two columns from 4 (was from 5); up to 3 stay in one column. Built in your Tune line: the Perfect Fifth scale is now this layout's default.",
    request: "90589e4d-4b3e-4be8-afbc-ba034edbb059",
    brief: "An SOP checklist slide. Title and optional one-line context on top; 4 to 8 numbered steps below in one or two columns, each with a checkbox-style marker, a short action-led step and an optional one-line note (e.g. who does it, or what to check). An optional warning line at the bottom for the step people most often skip. Should work for trainings, onboarding, compliance procedures and support playbooks.",
    exceptions: "From 4 steps they split into two columns, half as wide, so the step steps down from lead to body and the note from body to caption (and the checkbox from 48 to 40). The warning uses amber, a status colour read by meaning, outside the brand palette. Steps and notes are one line each so 8 steps and the warning fit the band.",
    entry: { meta: checklistMeta, Component: Checklist },
    examples: [
      {
        id: "checklist-five", pattern: "checklist", props: {
          title: "How to handle the request",
          context: "One line of context, such as when this procedure applies.",
          steps: [
            { text: "Do the first thing", note: "Who does it, or what to check." },
            { text: "Do the second thing", note: "Who does it, or what to check." },
            { text: "Do the third thing" },
            { text: "Do the fourth thing", note: "Who does it, or what to check." },
            { text: "Do the fifth thing" },
          ],
          warning: "One line on the step people most often skip.",
        },
      },
      {
        id: "checklist-eight", pattern: "checklist", props: {
          title: "Longest title it takes: forty-eight characters",
          context: "The longest context it takes: about ninety characters, on one line, in grey under it.",
          steps: Array.from({ length: 8 }, () => ({ text: "The longest step it takes: forty-eight chars", note: "The longest note it takes: about sixty-four characters, one line." })),
          warning: "The longest warning it takes: about ninety-six characters, on one line, in the amber box below.",
        },
      },
    ],
  },
  {
    id: "raci", kind: "layout", name: "RACI", revision: 1, date: "2026-11-09", // in the library
    request: "f30f8afe-21ea-433d-aa38-92a8339124d7",
    brief: "A RACI / ownership slide. Title on top; a grid with up to 6 tasks as rows and up to 5 roles or teams as columns, each cell holding R, A, C or I (or empty) as a small coloured badge, with a legend explaining the four letters. One row can be highlighted. Should work for project kick-offs, cross-team processes, internal handovers and trainings on who does what.",
    exceptions: "Badge colours: R in the accent (does the work), A navy (owns it), C a blue outline (asked), I grey (told). A cell can hold a pair (A/R). The highlighted row is tinted with an accent edge on the left. Rows are 64 tall, the rule 4 minimum, so 6 tasks, the header and the legend fit the band. An optional eyebrow was added for consistency with the other content slides. The examples are placeholders.",
    entry: { meta: raciMeta, Component: Raci },
    examples: [
      {
        id: "raci-team", pattern: "raci", props: {
          title: "Who does what",
          roles: ["Product", "Design", "Engineering", "Legal"],
          tasks: [
            { label: "First task", cells: ["A", "R", "C", "I"] },
            { label: "Second task", cells: ["A", "C", "R", ""] },
            { label: "Third task", cells: ["A/R", "", "C", "C"], highlight: true },
            { label: "Fourth task", cells: ["I", "I", "A/R", "C"] },
          ],
        },
      },
      {
        id: "raci-full", pattern: "raci", props: {
          eyebrow: "Longest eyebrow it takes, 40 characters",
          title: "Longest title it takes: forty-eight characters",
          roles: Array.from({ length: 5 }, () => "Longest role 16c"),
          tasks: Array.from({ length: 6 }, (_, i) => ({ label: "Longest task it takes: 32 chars", cells: ["A/R", "C", "I", "R", "C"], highlight: i === 2 })),
        },
      },
    ],
  },
  {
    id: "status-update", kind: "layout", name: "Status update", revision: 2, date: "2026-11-09", // in the library
    changes: "The period label (Week 45) now sits above the title as an eyebrow, and the overall status chip sits under the title instead of on the right. The chip is the regular size now, since it sits right under the title. With the header a line taller, the columns sit 40 under it (was 48) so four two-line items per column still fit between the logo and the footer.",
    request: "63d283a3-fec8-42be-9558-5603eaea27a9",
    brief: "A status update slide. Title with an optional period label (e.g. 'Week 45' or 'Q4'), and an overall status chip (on track / at risk / off track in green, amber, red). Three columns below: Wins, Risks, Asks, each with up to 4 short items; risks can carry their own status chip. Should work for team updates, project check-ins, management reports and OKR reviews.",
    exceptions: "Green, amber and red are status colours read by meaning, outside the brand palette (as on Roadmap and Do and don't). Status chips are editable words: On track green, At risk amber, Off track and Blocked red, In progress blue, anything else grey. Column names are editable (labels). Items can't be budgeted per column yet, so each is capped at 56 characters (two lines). The examples are placeholders, not real updates.",
    entry: { meta: statusUpdateMeta, Component: StatusUpdate },
    examples: [
      {
        id: "status-update-week", pattern: "status-update", props: {
          title: "Team update", period: "Week 45", status: "On track",
          wins: ["A short win, in a few words", "Another win, such as a launch or a milestone", "A third win"],
          risks: [{ text: "A risk to watch", status: "At risk" }, { text: "Something that's stuck", status: "Blocked" }],
          asks: ["What you need from the room", "A second ask, with who it's for"],
        },
      },
      {
        id: "status-update-full", pattern: "status-update", props: {
          title: "Longest title it takes, 40 characters", period: "Q4 2026", status: "Off track",
          wins: Array.from({ length: 4 }, () => "The longest item it takes: fifty-six characters, 2 lines"),
          risks: [{ text: "The longest risk it takes, fifty-six characters, 2 lines", status: "At risk" }, { text: "A risk with a chip", status: "Off track" }, { text: "A risk being watched", status: "Watching" }, { text: "A risk with no chip" }],
          asks: Array.from({ length: 4 }, () => "The longest item it takes: fifty-six characters, 2 lines"),
        },
      },
    ],
  },
  {
    id: "matrix", kind: "layout", name: "2×2 matrix", revision: 1, date: "2026-11-09", // in the library
    request: "7fa9ccb8-5153-43e2-9c81-58056c9f0784",
    brief: "A 2x2 matrix slide. Title and optional one-line takeaway on the left; a square matrix on the right with a labelled x-axis and y-axis (low to high), four quadrant names, and up to 8 items placed as dots or chips inside the quadrants. One quadrant can be highlighted in the brand accent (e.g. 'do first'). Should work for prioritization (impact vs. effort), market positioning in sales decks, and workshop exercises.",
    exceptions: "Items are chips that flow inside their quadrant (at most 4 per quadrant), not dots at exact x/y positions: exact positions can overlap at some lengths, which rule 2 doesn't allow. If exact placement is needed, it can come as a remix with its own overlap check. The y-axis label reads bottom to top. The takeaway allows up to three lines (asked for one) because the left column is narrower than a full-width line.",
    entry: { meta: matrixMeta, Component: Matrix },
    examples: [
      {
        id: "matrix-priorities", pattern: "matrix", props: {
          eyebrow: "Prioritization",
          title: "Impact vs. effort",
          takeaway: "One line on what the matrix shows, such as where to start.",
          xAxis: { label: "Effort" }, yAxis: { label: "Impact" },
          quadrants: { "top-left": "Do first", "top-right": "Plan", "bottom-left": "Quick wins", "bottom-right": "Skip" },
          highlight: "top-left",
          items: [
            { label: "Item one", quadrant: "top-left" }, { label: "Item two", quadrant: "top-left" },
            { label: "Item three", quadrant: "top-right" }, { label: "Item four", quadrant: "bottom-left" },
            { label: "Item five", quadrant: "bottom-left" }, { label: "Item six", quadrant: "bottom-right" },
          ],
        },
      },
      {
        id: "matrix-full", pattern: "matrix", props: {
          eyebrow: "Longest eyebrow it takes, 32 ch",
          title: "Longest title it takes, 48 ch, three lines",
          takeaway: "The longest takeaway it takes: about ninety characters, on up to three lines in grey.",
          xAxis: { label: "Longest x label", low: "Low", high: "High" }, yAxis: { label: "Longest y label", low: "Low", high: "High" },
          quadrants: { "top-left": "Longest name 18 ch", "top-right": "Longest name 18 ch", "bottom-left": "Longest name 18 ch", "bottom-right": "Longest name 18 ch" },
          highlight: "top-right",
          items: [
            { label: "Longest item 16", quadrant: "top-right" }, { label: "Longest item 16", quadrant: "top-right" },
            { label: "Longest item 16", quadrant: "top-right" }, { label: "Longest item 16", quadrant: "top-right" },
            { label: "Item", quadrant: "top-left" }, { label: "Item", quadrant: "top-left" },
            { label: "Item", quadrant: "bottom-left" }, { label: "Item", quadrant: "bottom-right" },
          ],
        },
      },
    ],
  },
  {
    id: "scenario", kind: "layout", name: "Scenario card", revision: 1, date: "2026-11-09", // in the library
    request: "f9528a6e-4105-45e9-ae47-449ec05ebad4",
    brief: "A scenario card slide for role-play trainings. Eyebrow (e.g. 'Scenario 2'), a short setup line, and a speech-bubble style quote of what the customer or colleague says (up to three lines). Below, a 'What would you do?' prompt; in presenting mode, a click or key press reveals the recommended response (up to 3 short points) with an optional 'avoid' line. Should work for support and sales trainings, onboarding and compliance sessions.",
    exceptions: "The response sits to the right of the scenario rather than below it: below, three points and an avoid line don't fit the band with a three-line quote. The covered card keeps its full size (dashed border, 'Click or press R to reveal'), so revealing it moves nothing. R reveals it because Space, Enter and the arrows already move between slides. The eyebrow takes the accent so the scenario number reads first. The ticks and the cross use the status green and red, as on Do and don't.",
    entry: { meta: scenarioMeta, Component: Scenario },
    examples: [
      {
        id: "scenario-revealed", pattern: "scenario", props: {
          eyebrow: "Scenario 2",
          setup: "One short line setting the scene, such as who is calling and why.",
          quote: "What the customer or colleague says, in their own words, as they'd say it.",
          speaker: "Who says it",
          response: ["The first thing to do or say", "The second thing to do", "The third thing, such as when to hand over"],
          avoid: "One line on what not to do.",
          showAnswer: true,
        },
      },
      {
        id: "scenario-covered", pattern: "scenario", props: {
          eyebrow: "Longest eyebrow it takes, 32 ch",
          setup: "The longest setup it takes: about ninety characters, on up to two lines, in grey text.",
          quote: "The longest quote it takes: about a hundred and twenty characters, in the bubble, on up to three lines.",
          speaker: "Longest speaker line it takes, 40 ch",
          response: ["The longest point it takes: sixty-four characters, two lines", "The longest point it takes: sixty-four characters, two lines", "The longest point it takes: sixty-four characters, two lines"],
          avoid: "The longest avoid line it takes: about seventy-two characters, 2 lines.",
        },
      },
    ],
  },
  {
    id: "glossary", kind: "layout", name: "Glossary", revision: 2, date: "2026-11-09", // in the library
    changes: "More room: each definition sits 24 under its term (was 16), and terms are 48 apart (was 40). With 4 terms in a column they stay 40 apart so 8 terms with two-line definitions still fit between the logo and the footer. Built in your Tune line: the Perfect Fifth scale is now this layout's default.",
    request: "75c15a75-36cc-412c-90d8-8c5bef4bdc46",
    brief: "A glossary slide. Title (e.g. 'Key terms') with an optional eyebrow; up to 8 terms in two columns, each term in bold with a one or two-line plain-language definition below it. Optional small tag per term (e.g. 'Payments', 'Crypto'). Should work for trainings, onboarding, client enablement and the appendix of sales decks.",
    exceptions: "The title sits on the left rather than above the terms: above, 8 terms with two-line definitions don't fit the band at a readable size. Tags use the micro step (20) so they stay smaller than the term they label; terms are capped at 18 characters and tags at 10 so a term and its tag fit one line in a column (a longer tag wraps under the term instead of running out of the column). The examples' terms are placeholders, not definitions.",
    entry: { meta: glossaryMeta, Component: Glossary },
    examples: [
      {
        id: "glossary-six", pattern: "glossary", props: {
          eyebrow: "Before we start",
          title: "Key terms",
          terms: [
            { term: "First term", tag: "Payments", definition: "A plain-language definition, in one or two lines." },
            { term: "Second term", definition: "A plain-language definition, in one line." },
            { term: "Third term", tag: "Crypto", definition: "A plain-language definition, in one or two lines." },
            { term: "Fourth term", definition: "A plain-language definition, in one line." },
            { term: "Fifth term", tag: "Crypto", definition: "A plain-language definition, in one or two lines." },
            { term: "Sixth term", definition: "A plain-language definition, in one line." },
          ],
        },
      },
      {
        id: "glossary-full", pattern: "glossary", props: {
          eyebrow: "Longest eyebrow it takes, 32 ch",
          title: "Longest title it takes, 32 ch",
          terms: Array.from({ length: 8 }, () => ({ term: "Longest term 18 ch", tag: "Tag, 10 ch", definition: "The longest definition it takes: about seventy-two characters, two lines." })),
        },
      },
    ],
  },
  {
    id: "faq", kind: "layout", name: "FAQ", revision: 1, date: "2026-11-09", // in the library
    request: "77f747f8-fa2d-49e1-a447-cad0a1ee860b",
    brief: "An FAQ slide. Title (e.g. 'Frequently asked questions') on the left with an optional one-line note; up to 6 question-and-answer pairs on the right, each question in bold and a short answer of up to two lines. With 4 or fewer pairs, use a single column; with 5 or 6, two columns. Should work for sales (client objections), internal announcements, policy changes and trainings.",
    exceptions: "With 5 or 6 pairs the two columns are half as wide, so questions step down from lead to body and answers from body to caption, a question may wrap to two lines and an answer to three; that keeps 3 rows inside the band without shrinking below the scale. Pairs are separated by hairlines with 24 above and below (32 in two columns). The note allows two lines (asked for one) because the left column is narrow. The examples are placeholders, not real answers.",
    entry: { meta: faqMeta, Component: Faq },
    examples: [
      {
        id: "faq-four", pattern: "faq", props: {
          title: "Frequently asked questions",
          note: "One line on where to ask anything else.",
          pairs: [
            { question: "The first question people ask?", answer: "A short answer, in one or two lines." },
            { question: "The second question people ask?", answer: "A short answer, in one or two lines, such as what changes and when." },
            { question: "The third question?", answer: "A short answer." },
            { question: "The fourth question people ask?", answer: "A short answer, in one or two lines." },
          ],
        },
      },
      {
        id: "faq-six", pattern: "faq", props: {
          title: "Longest title it takes, 40 characters",
          note: "The longest note it takes: about eighty characters, on up to two lines.",
          pairs: Array.from({ length: 6 }, () => ({ question: "The longest question it takes: fifty-six characters, ok?", answer: "The longest answer it takes: about a hundred and twenty characters, which runs to two lines in one column." })),
        },
      },
    ],
  },
  {
    id: "takeaways", kind: "layout", name: "Key takeaways", revision: 2, date: "2026-11-05", // in the library
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
    id: "objectives", kind: "layout", name: "Learning objectives", revision: 2, date: "2026-11-05", // in the library
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
    id: "team-intro", kind: "layout", name: "Team intro", revision: 2, date: "2026-11-05", // in the library
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
    id: "roadmap", kind: "layout", name: "Roadmap", revision: 2, date: "2026-11-05", // in the library
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
    id: "comparison", kind: "layout", name: "Comparison", revision: 2, date: "2026-11-05", // in the library
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
