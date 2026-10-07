import { t, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface StatusRow { label: string; status: string; variant: "active" | "live" | "q2" | "q3" | string }
export interface CountryCardData { country: string; flag: string; rail: string; speed: string; statuses: StatusRow[] }
export interface CardGridProps { eyebrow?: string; title: string; subtitle: string; body: string; cards: CountryCardData[] }

export const cardGridMeta: PatternMeta = {
  id: "card-grid", name: "Card grid", shape: "set",
  description: "Pitch left; a 4-column grid of cards right (flag, name, rails, status chips).",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "cards", maxItems: 8 }, { slot: "body", maxChars: 220, maxLines: 6 }],
};

const CHIP: Record<string, string> = { active: "#009a27", live: "#f61414", q2: "#f77b15", q3: "#1449f6" };

export function CardGrid({ eyebrow, title, subtitle, body, cards }: CardGridProps) {
  return (
    <>
      {eyebrow && <span style={{ position: "absolute", left: 1550, top: 145, ...t(28, 1.15, -0.84, 700, "#757575"), ...noWrap }}>{eyebrow}</span>}
      <h1 style={{ position: "absolute", left: 79, top: 323, margin: 0, ...t(48, 1.4, -1.44, 700), ...noWrap }}>{title}</h1>
      <p style={{ position: "absolute", left: 79, top: 398, width: 439, margin: 0, ...t(48, 1.4, -1.44, 400) }}>{subtitle}</p>
      <p style={{ position: "absolute", left: 79, top: 592, width: 426, margin: 0, ...t(28, 1.6, -0.42, 500, "#363636") }}>{body}</p>
      <div style={{ position: "absolute", left: 719, top: 266, width: 1112, display: "flex", flexWrap: "wrap", gap: 24, filter: "drop-shadow(0 0 6px rgba(0,0,0,0.08))" }}>
        {cards.map((c, i) => (
          <div
            key={i}
            style={{
              width: 260, boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", gap: 24, padding: 24,
              border: "1px solid #dbdbdb", borderRadius: 12, backgroundImage: "linear-gradient(155.4799deg, #ffffff 13.016%, #eeeeee 105.99%)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" src={c.flag} style={{ width: 65, height: 65, borderRadius: "50%", objectFit: "cover", filter: "drop-shadow(0 0 6px rgba(0,0,0,0.25))" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", textAlign: "center" }}>
              <span style={t(28, 1.4, -0.84, 700)}>{c.country}</span>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, ...noWrap }}>
                <span style={t(16, 1.4, -0.48, 700)}>{c.rail}</span>
                <span style={t(12, 1.4, -0.36, 400)}>{c.speed}</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {c.statuses.map((s, j) => (
                <div key={j} style={{ width: 200, boxSizing: "border-box", background: "#fff", border: "1px solid #ececec", borderRadius: 4, padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.8 }}>
                  <span style={{ ...t(10, 1.4, 0.1, 700), textTransform: "uppercase" }}>{s.label}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 4, background: CHIP[s.variant] ?? "#1449f6", ...t(12, 1.4, 0.72, 700, "#fff"), ...noWrap }}>{s.status}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
