"use client";
import { createElement, useEffect, useRef, useState } from "react";
import { g, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";

const ACCENT = onBg("#fa7312", "accent");
const LINE = onBg("rgba(0,0,0,0.16)", "rule");
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;
/** Icons sit on the middle of the first line's capitals (body cap ≈ 23): optical. */
const ICON = g(3);
const ICON_TOP = Math.round(32 * 0.36 - ICON / 2);

const Icon = ({ ok, color }: { ok: boolean; color: string }) => createElement("svg", { "aria-hidden": true, viewBox: "0 0 24 24", width: ICON, height: ICON, style: { display: "block", flex: "none", marginTop: ICON_TOP } },
  createElement("path", { d: ok ? "M5 12.5l4.5 4.5L19 7.5" : "M6.5 6.5l11 11M17.5 6.5l-11 11", fill: "none", stroke: color, strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" }));

/**
 * The recommended response card. While presenting, clicking it or pressing R reveals it (its size is kept, so
 * nothing moves); anywhere else it stays covered unless showAnswer is set.
 */
export function ScenarioResponse({ response, avoid, showAnswer = false }: { response: string[]; avoid?: string; showAnswer?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const revealed = showAnswer || open;
  const presenting = () => !!ref.current?.closest(".present");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!presenting() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === "r") { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={ref} role="button" tabIndex={-1}
      onClick={(e) => { if (!presenting() || revealed) return; e.stopPropagation(); setOpen(true); }}
      style={{
        position: "relative", borderRadius: g(4), padding: g(5), cursor: revealed ? undefined : "pointer",
        border: `2px ${revealed ? "solid" : "dashed"} ${revealed ? ACCENT : LINE}`, background: revealed ? "rgba(250,115,18,0.06)" : undefined,
        transition: "background .2s, border-color .2s",
      }}>
      <div style={{ display: "flex", flexDirection: "column", gap: g(4), visibility: revealed ? "visible" : "hidden" }}>
        <span style={{ ...type("caption", 700), color: ACCENT, ...noWrap }}>Recommended response</span>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: g(3) }}>
          {response.slice(0, 3).map((r, i) => (
            <li key={i} style={{ display: "flex", gap: g(2), alignItems: "flex-start" }}>
              <Icon ok color="#15803d" />
              <span style={{ ...type("body", 600), ...keepBreaks, minWidth: 0 }}>{r}</span>
            </li>
          ))}
        </ul>
        {avoid && (
          <div style={{ display: "flex", gap: g(2), alignItems: "flex-start", paddingTop: g(3), borderTop: `2px solid ${LINE}` }}>
            <Icon ok={false} color="#dc2626" />
            <span style={{ ...type("body", 500, "#545454"), ...keepBreaks, minWidth: 0 }}>{`Avoid: ${avoid}`}</span>
          </div>
        )}
      </div>
      {!revealed && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <span style={{ ...type("body", 600, "#757575"), ...noWrap, ...LETTERS }}>Click or press R to reveal</span>
        </div>
      )}
    </div>
  );
}
