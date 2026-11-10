import { Band, g, gap, pair, SAFE, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";
import { ScenarioResponse } from "./ScenarioResponse";

export interface ScenarioProps {
  /** Scenario 2, Role-play, Customer call. */
  eyebrow: string;
  /** One short line setting the scene. */
  setup: string;
  /** What the customer or colleague says, in their words. */
  quote: string;
  /** Optional: who says it (A merchant, on the phone). */
  speaker?: string;
  /** The question to the room; What would you do? by default. */
  prompt?: string;
  /** The recommended response: up to 3 short points. */
  response: string[];
  /** Optional line on what to avoid. */
  avoid?: string;
  /** Show the response without presenting (a handout, or the answer slide after the question). */
  showAnswer?: boolean;
}

export const scenarioMeta: PatternMeta = {
  id: "scenario", name: "Scenario card", shape: "statement",
  description: "A role-play card for trainings. Left: eyebrow (Scenario 2), a short setup line, what the customer or colleague says in a speech bubble (up to three lines) and the question to the room (What would you do?). Right: the recommended response, up to 3 short points, with an optional line on what to avoid. While presenting, click the response card or press R to reveal it; elsewhere the card stays covered unless showAnswer is set.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "eyebrow", maxChars: 32, maxLines: 1 }, { slot: "setup", maxChars: 90, maxLines: 2 },
    { slot: "quote", maxChars: 120, maxLines: 3 }, { slot: "speaker", maxChars: 40, maxLines: 1 }, { slot: "prompt", maxChars: 32, maxLines: 1 },
    { slot: "response", maxItems: 3 }, { slot: "response.item", maxChars: 64, maxLines: 2 }, { slot: "avoid", maxChars: 72, maxLines: 2 },
  ],
};

const LEFT = g(108); // 864
const GUTTER = g(10); // 80
const BUBBLE = "rgba(32,70,128,0.07)";

/** Approved in the Studio 2026-11-09 (revision 1). Built to the Studio rules (src/studio/STUDIO.md). */
export function Scenario({ eyebrow, setup, quote, speaker, prompt = "What would you do?", response, avoid, showAnswer }: ScenarioProps) {
  return (
    <>
      <Band gap={gap(g(5))} style={{ width: LEFT }}>
        <div style={{ display: "flex", flexDirection: "column", gap: pair(g(2)) }}>
          <span style={{ ...type("caption", 600), color: onBg("#fa7312", "accent"), ...noWrap }}>{eyebrow}</span>
          <p style={{ margin: 0, ...type("body", 500, "#545454"), ...keepBreaks }}>{setup}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: g(2) }}>
          {/* The bubble: one padding on every side, its tail the squared bottom-left corner */}
          <div style={{ background: BUBBLE, borderRadius: `${g(4)}px ${g(4)}px ${g(4)}px ${g(0.5)}px`, padding: g(5) }}>
            <p style={{ margin: 0, ...type("lead", 500, "#204680"), ...keepBreaks, textBox: "trim-both cap alphabetic" }}>{`“${quote}”`}</p>
          </div>
          {speaker && <span style={{ ...type("caption", 500, "#757575"), ...noWrap, paddingLeft: g(5) }}>{speaker}</span>}
        </div>
        <h3 style={{ margin: 0, ...type("h3", 600, "#204680"), ...noWrap }}>{prompt}</h3>
      </Band>
      <Band style={{ left: SAFE.left + LEFT + GUTTER, width: SAFE.width - LEFT - GUTTER }}>
        <ScenarioResponse response={response} avoid={avoid} showAnswer={showAnswer} />
      </Band>
    </>
  );
}
