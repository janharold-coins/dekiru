import { t, keepBreaks, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface StatementHighlightsProps {
  title: string;
  body: string;
  highlights: { title: string; description: string }[];
}

export const statementMeta: PatternMeta = {
  id: "statement-highlights", name: "Statement + highlights", shape: "statement",
  description: "Centred two-line headline, one paragraph, and a 3-column highlight band on the brand gradient.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "title", maxChars: 80, maxLines: 2 }, { slot: "body", maxChars: 420, maxLines: 4 }, { slot: "highlights", maxItems: 3 }],
};

export function StatementHighlights({ title, body, highlights }: StatementHighlightsProps) {
  return (
    <>
      <h1 style={{ position: "absolute", left: 136, top: 190, width: 1649, margin: 0, textAlign: "center", ...t(90, 1.15, -3.6, 600, "#204680"), ...keepBreaks }}>{title}</h1>
      <p style={{ position: "absolute", left: 207, top: 432, width: 1506, margin: 0, textAlign: "center", ...t(32, 1.6, -0.32, 600) }}>{body}</p>
      <div
        style={{
          position: "absolute", left: "50%", top: 786, transform: "translate(-50%, -50%)",
          display: "flex", alignItems: "center", gap: 120, padding: "48px 60px", borderRadius: 16,
          backgroundImage: "linear-gradient(142.8718519294768deg, rgb(44,112,216) 21.64%, rgb(19,27,38) 57.452%, rgb(250,115,18) 88.018%)",
          filter: "drop-shadow(0px 0px 12px rgba(0,0,0,0.08))",
        }}
      >
        {highlights.map((h, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, justifyContent: "center", flexShrink: 0 }}>
            <span style={{ ...t(40, 1.4, -1.2, 600, "#fff"), ...noWrap }}>{h.title}</span>
            <span style={{ ...t(28, 1.2, -0.28, 600, "#fff"), ...(h.description.includes("\n") ? { whiteSpace: "pre" } : { width: 336 }) }}>{h.description}</span>
          </div>
        ))}
      </div>
    </>
  );
}
