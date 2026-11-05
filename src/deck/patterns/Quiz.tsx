import { Band, g, gap, pair, type } from "@/studio/grid";
import { keepBreaks, noWrap } from "../tokens";
import type { PatternMeta } from "../types";
import { QuizCards } from "./QuizCards";

export interface QuizOption {
  text: string;
  /** The right answer (one per question). */
  correct?: boolean;
}
export interface QuizProps {
  eyebrow: string;
  question: string;
  /** 3 or 4. */
  options: QuizOption[];
  /** One line, shown once the answer is revealed. */
  explanation: string;
  /** Show the answer without presenting (a handout, or the answer slide after the question). */
  showAnswer?: boolean;
}

export const quizMeta: PatternMeta = {
  id: "quiz", name: "Quiz", shape: "set",
  description: "A knowledge check: eyebrow and a question of up to two lines on top; 3 or 4 answer cards below. While presenting, click a card or press 1–4 (or A–D) to reveal the answer: the right card lights up in the accent, a wrong pick shows a cross, and a one-line explanation appears. Elsewhere the slide shows the question only, unless showAnswer is set.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 32, maxLines: 1 }, { slot: "question", maxChars: 96, maxLines: 2 },
    { slot: "options", maxItems: 4 }, { slot: "option.text", maxChars: 60, maxLines: 2 }, { slot: "explanation", maxChars: 100, maxLines: 1 },
  ],
};

/** Approved in the Studio 2026-11-05 (revision 1). Built to the Studio rules (src/studio/STUDIO.md). */
export function Quiz({ eyebrow, question, options, explanation, showAnswer }: QuizProps) {
  return (
    <Band gap={gap(g(6))}>
      <div style={{ display: "flex", flexDirection: "column", gap: pair(g(3)) }}>
        <span style={{ ...type("caption", 600, "#757575"), ...noWrap }}>{eyebrow}</span>
        <h2 style={{ margin: 0, ...type("h2", 600, "#204680"), ...keepBreaks }}>{question}</h2>
      </div>
      <QuizCards options={options} explanation={explanation} showAnswer={showAnswer} />
    </Band>
  );
}
