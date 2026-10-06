import { t, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface StatCardData {
  icon: string; tone: "orange" | "blue"; value: string;
  valueRuns?: { text: string; font: string; weight: number }[] | null;
  eyebrow: string; label: string; description: string; variant?: string;
}
export interface InlineStat {
  value: string; label: string; note?: string | null;
  valueSize?: number; valueWeight?: number; noteWidth?: number; itemWidth?: number; labelWidth?: number | null;
}
export interface KeyNumbersProps {
  title: string; subtitle: string;
  callout: { lead: string; lines: string[] };
  statCards: StatCardData[];
  primaryStats: InlineStat[];
  secondaryStats: InlineStat[];
}

export const keyNumbersMeta: PatternMeta = {
  id: "key-numbers", name: "Key numbers", shape: "set",
  description: "Pitch + callout left; two hero stat cards right; a row of headline numbers and a row of supporting numbers below.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "statCards", maxItems: 2 }, { slot: "primaryStats", maxItems: 3 }, { slot: "secondaryStats", maxItems: 3 }, { slot: "statCard.description", maxChars: 140, maxLines: 4 }],
};

const TONE = { orange: "#fa7312", blue: "#1f7aff" };

function StatCard({ c, left, width, inset }: { c: StatCardData; left: number; width: number; inset: number }) {
  return (
    <div style={{ position: "absolute", left, top: 146, width, height: 618, border: "1px solid #000", borderRadius: 24, boxSizing: "border-box" }}>
      <div style={{ position: "absolute", left: 35 + inset, top: 35, width: 90, height: 90 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={c.icon} style={{ display: "block", maxWidth: "none", width: c.variant === "enterprise" ? 103.31 : 85.89, marginLeft: c.variant === "enterprise" ? 0 : 3.18, marginTop: c.variant === "enterprise" ? 0 : 2.81 }} />
      </div>
      <div style={{ position: "absolute", left: 35, top: 35 + 77, ...t(120, 1.4, c.variant === "enterprise" ? -6 : -3.6, 600, TONE[c.tone]), ...noWrap }}>
        {c.valueRuns
          ? c.valueRuns.map((r, i) => (
              <span key={i} style={{ fontFamily: r.font === "TWK Everett" ? t(1, 1, 0, 400, "", "everett").fontFamily : undefined, fontWeight: r.weight }}>{r.text}</span>
            ))
          : c.value}
      </div>
      <div style={{ position: "absolute", left: 35 + inset, top: 35 + 243, width: 251 }}>
        <div style={{ ...t(20, 1.2, 1.4, 800), opacity: 0.5 }}>{c.eyebrow}</div>
        <div style={{ marginTop: 15, ...t(32, 1.2, -0.32, 600), whiteSpace: "pre" }}>{c.label}</div>
      </div>
      <p style={{ position: "absolute", left: 35 + inset, top: 35 + 390, width: 431, margin: 0, ...t(28, 1.4, -0.28, 400) }}>{c.description}</p>
    </div>
  );
}

export function KeyNumbers({ title, subtitle, callout, statCards, primaryStats, secondaryStats }: KeyNumbersProps) {
  return (
    <>
      <h1 style={{ position: "absolute", left: 79, top: 214, margin: 0, ...t(72, 1.15, -2.16, 600, "#204680"), ...noWrap }}>{title}</h1>
      <p style={{ position: "absolute", left: 79, top: 314, width: 678, margin: 0, ...t(48, 1.4, -1.44, 600) }}>{subtitle}</p>
      <div style={{ position: "absolute", left: 79, top: 542, width: 12, height: 266, background: "#000" }} />
      <div style={{ position: "absolute", left: 126, top: 561, width: 526, ...t(32, 1.4, 0, 400) }}>
        <div style={{ fontWeight: 700 }}>{callout.lead}</div>
        {callout.lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
      {statCards[0] && <StatCard c={statCards[0]} left={794} width={509} inset={6} />}
      {statCards[1] && <StatCard c={statCards[1]} left={1339} width={503} inset={0} />}
      <div style={{ position: "absolute", left: 374, width: 1468, top: 873.7, transform: "translateY(-50%)", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 60 }}>
        {primaryStats.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20.4, width: s.itemWidth }}>
            <span style={{ ...t(s.valueSize ?? 60, 1.4, -0.03 * (s.valueSize ?? 60), s.valueWeight ?? 700, "#17191d"), ...noWrap }}>{s.value}</span>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <span style={{ ...t(23.8, 1.2, -0.238, 600, "#17191d"), ...(s.labelWidth ? { width: s.labelWidth } : noWrap) }}>{s.label}</span>
              {s.note && <span style={{ ...t(12, 1.4, -0.12, 600, "#5b6572"), width: s.noteWidth }}>{s.note}</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 374, width: 1468, top: 963.7, transform: "translateY(-50%)", display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 61.2 }}>
        {secondaryStats.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, width: s.itemWidth }}>
            <span style={{ ...t(40.8, 1.4, -1.224, 700, "#17191d"), ...noWrap }}>{s.value}</span>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ ...t(19.04, 1.2, -0.1904, 600, "#17191d"), ...(s.labelWidth ? { width: s.labelWidth } : { whiteSpace: "pre" }) }}>{s.label}</span>
              {s.note && <span style={{ ...t(12, 1.4, -0.12, 600, "#5b6572"), ...noWrap }}>{s.note}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
