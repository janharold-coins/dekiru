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
    id: "data-table", name: "Data table", use: "A table of up to 6 columns and 8 rows, with one row or column highlighted.", from: "studio/data-table",
    slide: {
      id: "data-table", pattern: "data-table", props: {
        title: "Table title",
        takeaway: "One line on what the table shows.",
        columns: ["Item", "Column", "Column", "Column"],
        rows: [{ cells: ["Row", "Value", "Value", "Value"] }, { cells: ["Row", "Value", "Value", "Value"], highlight: true }, { cells: ["Row", "Value", "Value", "Value"] }],
        source: "Source: add where the figures come from",
      },
    },
  },
  {
    id: "screenshot-walkthrough", name: "Screenshot walkthrough", use: "A screenshot with up to 5 numbered markers and a matching legend; drag markers into place.", from: "studio/screenshot-walkthrough",
    slide: {
      id: "screenshot-walkthrough", pattern: "screenshot-walkthrough", props: {
        eyebrow: "Eyebrow",
        title: "What this screen does",
        image: "/figma/s35/hero.png",
        callouts: [
          { x: 30, y: 30, title: "First thing to notice", text: "One line about this part of the screen." },
          { x: 60, y: 50, title: "Second thing to notice", text: "One line about this part of the screen." },
          { x: 40, y: 75, title: "Third thing to notice", text: "One line about this part of the screen." },
        ],
      },
    },
  },
  {
    id: "bullets", name: "Title and bullets", use: "The everyday content slide: a title and 3 to 6 bullets, with an optional image.", from: "studio/bullets",
    slide: {
      id: "bullets", pattern: "bullets", props: {
        eyebrow: "Eyebrow",
        title: "Slide title",
        bullets: [{ text: "First point, in a single line" }, { text: "Second point, in a single line" }, { text: "Third point, in a single line" }],
      },
    },
  },
  {
    id: "do-dont", name: "Do and don't", use: "Two columns, Do and Don't, with up to 4 items each and optional example images.", from: "studio/do-dont",
    slide: {
      id: "do-dont", pattern: "do-dont", props: {
        title: "Slide title",
        doLabel: "Do", dontLabel: "Don't",
        dos: ["Something to do", "Something to do", "Something to do"],
        donts: ["Something to avoid", "Something to avoid", "Something to avoid"],
      },
    },
  },
  {
    id: "quiz", name: "Quiz", use: "A knowledge check: a question and 3 or 4 answers, revealed while presenting.", from: "studio/quiz",
    slide: {
      id: "quiz", pattern: "quiz", props: {
        eyebrow: "Quick check",
        question: "The question, in up to two lines?",
        options: [{ text: "First answer" }, { text: "Second answer", correct: true }, { text: "Third answer" }, { text: "Fourth answer" }],
        explanation: "One line on why the right answer is right.",
      },
    },
  },
  {
    id: "column-chart", name: "Column chart", use: "Up to 8 values as columns, one highlighted, with a title and takeaway.", from: "studio/column-chart",
    slide: {
      id: "column-chart", pattern: "column-chart", props: {
        title: "Monthly volume",
        takeaway: "One line on what the chart shows, such as the month that stands out.",
        axisLabel: "Volume, PHP millions",
        bars: [{ label: "Jan", value: "120" }, { label: "Feb", value: "135" }, { label: "Mar", value: "128" }, { label: "Apr", value: "150" }, { label: "May", value: "162" }, { label: "Jun", value: "158" }, { label: "Jul", value: "174" }, { label: "Aug", value: "196" }],
        source: "Source: add where the figures come from",
      },
    },
  },
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
  {
    id: "takeaways", name: "Key takeaways", use: "3 to 5 numbered takeaways to close a section or a talk.", from: "studio/takeaways",
    slide: {
      id: "takeaways", pattern: "takeaways", props: {
        eyebrow: "Session name",
        title: "Key takeaways",
        takeaways: [
          { text: "The first thing to remember, in one line", detail: "One line on why it matters." },
          { text: "The second thing to remember", detail: "One line on why it matters." },
          { text: "The third thing to remember" },
        ],
      },
    },
  },
  {
    id: "objectives", name: "Learning objectives", use: "What people will be able to do by the end: 3 to 5 objectives with check circles.", from: "studio/objectives",
    slide: {
      id: "objectives", pattern: "objectives", props: {
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
  },
  {
    id: "team-intro", name: "Team intro", use: "Up to 6 people with photo, name and role; 1 or 2 become a speaker intro.", from: "studio/team-intro",
    slide: {
      id: "team-intro", pattern: "team-intro", props: {
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
  },
  {
    id: "roadmap", name: "Roadmap", use: "Now / Next / Later or quarters, up to 4 item cards each, with status chips.", from: "studio/roadmap",
    slide: {
      id: "roadmap", pattern: "roadmap", props: {
        title: "Roadmap",
        context: "One line of context, such as what the plan is for.",
        columns: [
          { label: "Now", items: [{ title: "First item", note: "One-line note", status: "In progress" }, { title: "Second item", status: "Done" }, { title: "Third item", note: "One-line note", status: "In progress" }] },
          { label: "Next", items: [{ title: "First item", note: "One-line note", status: "Planned" }, { title: "Second item", status: "Planned" }] },
          { label: "Later", items: [{ title: "First item", note: "One-line note" }, { title: "Second item" }] },
        ],
      },
    },
  },
  {
    id: "comparison", name: "Comparison", use: "Two or three options side by side, up to 5 rows, one column highlighted.", from: "studio/comparison",
    slide: {
      id: "comparison", pattern: "comparison", props: {
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
  },
  {
    id: "matrix", name: "2×2 matrix", use: "Two axes, four named quadrants and up to 8 items, one quadrant highlighted.", from: "studio/matrix",
    slide: {
      id: "matrix", pattern: "matrix", props: {
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
  },
  {
    id: "scenario", name: "Scenario card", use: "A role-play scenario with the recommended response revealed while presenting.", from: "studio/scenario",
    slide: {
      id: "scenario", pattern: "scenario", props: {
        eyebrow: "Scenario 2",
        setup: "One short line setting the scene, such as who is calling and why.",
        quote: "What the customer or colleague says, in their own words, as they'd say it.",
        speaker: "Who says it",
        response: ["The first thing to do or say", "The second thing to do", "The third thing, such as when to hand over"],
        avoid: "One line on what not to do.",
        showAnswer: true,
      },
    },
  },
  {
    id: "faq", name: "FAQ", use: "Up to 6 questions and answers, in one column or two.", from: "studio/faq",
    slide: {
      id: "faq", pattern: "faq", props: {
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
  },
  {
    id: "pros-cons", name: "Pros and cons", use: "The option being weighed: pros and cons, up to 5 each, with an optional verdict.", from: "studio/pros-cons",
    slide: {
      id: "pros-cons", pattern: "pros-cons", props: {
        eyebrow: "Option A",
        title: "The option being weighed",
        pros: ["A short pro, in a few words", "A second pro", "A third pro"],
        cons: ["A short con, in a few words", "A second con"],
        verdict: "Recommendation: one line on what to do, such as going ahead with a pilot first.",
      },
    },
  },
  {
    id: "raci", name: "RACI", use: "Who does what: up to 6 tasks by 5 roles, with R, A, C and I badges.", from: "studio/raci",
    slide: {
      id: "raci", pattern: "raci", props: {
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
  },
  {
    id: "status-update", name: "Status update", use: "Wins, risks and asks under a title with a period label and an overall status.", from: "studio/status-update",
    slide: {
      id: "status-update", pattern: "status-update", props: {
        title: "Team update", period: "Week 45", status: "On track",
        wins: ["A short win, in a few words", "Another win, such as a launch or a milestone", "A third win"],
        risks: [{ text: "A risk to watch", status: "At risk" }, { text: "Something that's stuck", status: "Blocked" }],
        asks: ["What you need from the room", "A second ask, with who it's for"],
      },
    },
  },
  {
    id: "glossary", name: "Glossary", use: "Up to 8 terms with plain-language definitions and optional tags.", from: "studio/glossary",
    slide: {
      id: "glossary", pattern: "glossary", props: {
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
  },
  {
    id: "before-after", name: "Before and after", use: "2 to 4 metrics, each before and after with a signed change in green or red.", from: "studio/before-after",
    slide: {
      id: "before-after", pattern: "before-after", props: {
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
  },
  {
    id: "persona", name: "Customer persona", use: "Who they are, with goals, pain points and how we help, and a quote in their words.", from: "studio/persona",
    slide: {
      id: "persona", pattern: "persona", props: {
        name: "Persona name",
        description: "One line on who they are, such as their work and where they live.",
        tags: ["Tag one", "Tag two", "Tag three"],
        goals: ["What they want to get done", "A second goal", "A third goal"],
        pains: ["What gets in their way today", "A second pain point"],
        help: ["How we help with the first", "How we help with the second"],
        quote: "Something they'd say about it, in their own words.",
      },
    },
  },
  {
    id: "hero-number", name: "Hero number", use: "One very large figure with a label, on the dark statement background.", from: "studio/hero-number",
    slide: {
      id: "hero-number", pattern: "hero-number", props: {
        eyebrow: "The number that matters",
        value: "00.0M",
        label: "What the figure counts",
        context: "One line of context, such as how it compares with last year.",
        source: "Source: add where the figure comes from",
      },
    },
  },
  {
    id: "funnel", name: "Funnel", use: "3 to 6 stages narrowing top to bottom, with values, changes and one highlighted stage.", from: "studio/funnel",
    slide: {
      id: "funnel", pattern: "funnel", props: {
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
  },
  {
    id: "checklist", name: "SOP checklist", use: "Up to 8 numbered steps with notes, and a warning for the step people skip.", from: "studio/checklist",
    slide: {
      id: "checklist", pattern: "checklist", props: {
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
  },
];

export const templates = [...(data as unknown as SlideTemplate[]), ...studio];

export const getTemplate = (id: string) => templates.find((t) => t.id === id);
