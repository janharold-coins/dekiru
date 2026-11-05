"use client";
import { createElement, useEffect, useRef, useState } from "react";
import { g, type } from "@/studio/grid";
import { onBg } from "../theme";
import { keepBreaks, noWrap } from "../tokens";
import type { QuizOption } from "./Quiz";

const ACCENT = onBg("#fa7312", "accent");
const LINE = onBg("rgba(0,0,0,0.16)", "rule");
const KEYS = ["1", "2", "3", "4"];
const LETTERS = ["a", "b", "c", "d"];

/** A tick for the right answer, a cross for a wrong pick, as exact-box shapes. */
const Icon = ({ ok, color }: { ok: boolean; color: string }) => createElement("svg", { "aria-hidden": true, viewBox: "0 0 24 24", width: g(3), height: g(3), style: { display: "block" } },
  createElement("path", { d: ok ? "M5 12.5l4.5 4.5L19 7.5" : "M6.5 6.5l11 11M17.5 6.5l-11 11", fill: "none", stroke: color, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }));

/**
 * The answer cards and the explanation. While presenting, clicking a card or pressing 1–4 / A–D picks it and
 * reveals the answer: the right card turns to the accent, a wrong pick shows a cross, and the explanation appears
 * (its space is kept, so nothing moves). Anywhere else the slide shows the question only, unless showAnswer is set.
 */
export function QuizCards({ options, explanation, showAnswer = false }: { options: QuizOption[]; explanation: string; showAnswer?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const list = options.slice(0, 4);
  const revealed = showAnswer || picked !== null;
  const presenting = () => !!ref.current?.closest(".present");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!presenting() || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const i = KEYS.includes(k) ? KEYS.indexOf(k) : LETTERS.indexOf(k);
      if (i >= 0 && i < list.length) { e.preventDefault(); setPicked(i); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [list.length]);

  const cols = list.length === 4 ? 2 : list.length;
  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: g(4) }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: g(4) }}>
        {list.map((o, i) => {
          const right = revealed && !!o.correct;
          const wrong = revealed && picked === i && !o.correct;
          const dim = revealed && !right && !wrong;
          return (
            <div key={i} role="button" tabIndex={-1}
              onClick={(e) => { if (!presenting()) return; e.stopPropagation(); setPicked(i); }}
              style={{
                display: "flex", alignItems: "center", gap: g(3), padding: g(4), borderRadius: g(3), cursor: "pointer",
                border: `2px solid ${right ? ACCENT : LINE}`, background: right ? "rgba(250,115,18,0.10)" : undefined,
                opacity: dim ? 0.48 : 1, transition: "opacity .2s, background .2s, border-color .2s",
              }}>
              <span style={{
                flex: "none", width: g(6), height: g(6), borderRadius: "50%", display: "grid", placeItems: "center", boxSizing: "border-box",
                background: right ? ACCENT : undefined, border: right ? "none" : `2px solid ${LINE}`,
              }}>
                {right ? <Icon ok color="#ffffff" /> : wrong ? <Icon ok={false} color="#dc2626" />
                  : <span style={{ ...type("caption", 600), textBox: "trim-both cap alphabetic", ...noWrap }}>{"ABCD"[i]}</span>}
              </span>
              {/* Trimmed to the baseline here (not the descender line), so the text centres on the badge by its letters. */}
              <span style={{ ...type("body", right ? 700 : 500), ...keepBreaks, minWidth: 0, textBox: "trim-both cap alphabetic" }}>{o.text}</span>
            </div>
          );
        })}
      </div>
      <p style={{ margin: 0, ...type("body", 500, "#545454"), ...keepBreaks, visibility: revealed ? "visible" : "hidden" }}>{explanation}</p>
    </div>
  );
}
