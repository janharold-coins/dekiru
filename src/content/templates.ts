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
];

export const templates = [...(data as unknown as SlideTemplate[]), ...studio];

export const getTemplate = (id: string) => templates.find((t) => t.id === id);
