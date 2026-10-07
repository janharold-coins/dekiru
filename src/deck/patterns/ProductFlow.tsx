import { t, keepBreaks, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface ProductFlowProps {
  product?: string;
  eyebrow: string;
  titleBold: string;
  titleRegular: string;
  steps: { n: string; title: string; caption: string }[];
}

export const productFlowMeta: PatternMeta = {
  id: "product-flow", name: "Product flow", shape: "sequence",
  description: "Centred title; numbered step cards joined by chevrons. The last step is the payoff (bold).",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "steps", maxItems: 5 }, { slot: "step.title", maxChars: 28, maxLines: 2 }, { slot: "step.caption", maxChars: 50, maxLines: 3 }],
};

function Chevron() {
  return (
    <span style={{ position: "relative", width: 28, height: 48, flexShrink: 0 }}>
      <svg width="30.6034" height="52" viewBox="0 0 30.6034 52.0001" fill="none" style={{ position: "absolute", left: 0, top: -2 }} aria-hidden>
        <path d="M8 2L28 26L8 50" stroke="#0095FF" strokeWidth="4" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function ProductFlow({ eyebrow, titleBold, titleRegular, steps }: ProductFlowProps) {
  return (
    <>
      <span style={{ position: "absolute", left: 0, width: 1920, top: 239, textAlign: "center", ...t(28, 1.15, -0.84, 700, "#757575") }}>{eyebrow}</span>
      <div style={{ position: "absolute", left: "50%", top: 282, transform: "translateX(-50%)", display: "flex", gap: 24, ...noWrap }}>
        <span style={t(48, 1.4, -1.44, 700)}>{titleBold}</span>
        <span style={t(48, 1.4, -1.44, 400)}>{titleRegular}</span>
      </div>
      <div style={{ position: "absolute", left: 0, top: 422, width: 1920, display: "flex", gap: 16, alignItems: "center", justifyContent: "center" }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "contents" }}>
            {i > 0 && <Chevron />}
            <div
              style={{
                position: "relative", width: 300, minHeight: 272, alignSelf: "stretch", boxSizing: "border-box",
                border: "1px solid #000", borderRadius: 8, padding: "60px 30px 30px", display: "flex", flexDirection: "column", gap: 36,
                backgroundImage: "linear-gradient(138.75deg, #FFFFFF 50%, #FBFBFB 94.311%)",
              }}
            >
              <span style={{ position: "absolute", right: 19, top: 7, ...t(24, 1.4, -0.24, 500, "#efa023", "everett") }}>{s.n}</span>
              <span style={{ minHeight: 89.6, ...t(32, 1.4, -0.8, i === steps.length - 1 ? 700 : 500), ...keepBreaks }}>{s.title}</span>
              <span style={{ ...t(20, 1.4, -0.2, 500, "#757575"), ...keepBreaks }}>{s.caption}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
