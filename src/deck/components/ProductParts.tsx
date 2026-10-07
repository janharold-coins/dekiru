/* Parts shared by product-detail: section header with dash, bullet list, price chip, VIP tier chip. */
import { t, keepBreaks } from "../tokens";

export function SectionHeader({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", gap: 36, alignItems: "center", paddingLeft: 24, height: 50 }}>
      <span style={{ ...t(36, 1.4, -1.08, 700), whiteSpace: "nowrap" }}>{label}</span>
      <span style={{ width: 48, height: 4, background: "rgba(0,0,0,0.2)", marginTop: -4 }} />
    </div>
  );
}

export function Bullets({ items, lineHeight = 1.6 }: { items: string[]; lineHeight?: number }) {
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "disc", ...t(24, lineHeight, -0.72, 400) }}>
      {items.map((b, i) => (
        <li key={i} style={{ marginInlineStart: 36, marginBottom: i === items.length - 1 ? 0 : 12, ...keepBreaks }}>{b}</li>
      ))}
    </ul>
  );
}

/** Key APIs as numbered steps, each with its own bulleted calls (Ramp: QUOTE / CONFIRM / TRACK). */
export interface KeyApiGroup { title: string; items: string[] }

export function NumberedGroups({ groups, lineHeight = 1.6 }: { groups: KeyApiGroup[]; lineHeight?: number }) {
  return (
    <ol style={{ margin: 0, padding: 0, listStyle: "decimal", ...t(24, lineHeight, -0.72, 400) }}>
      {groups.map((g, i) => (
        <li key={i} style={{ marginInlineStart: 36, marginBottom: i === groups.length - 1 ? 0 : 12 }}>
          <span style={keepBreaks}>{g.title}</span>
          <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "disc" }}>
            {g.items.map((it, j) => (
              <li key={j} style={{ marginInlineStart: 36, marginBottom: j === g.items.length - 1 ? 0 : 12, ...keepBreaks }}>{it}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

export interface Chip { label: string; value: string; unit?: string | null }

export function PriceChip({ c }: { c: Chip }) {
  return (
    <div style={{ background: "#fff", boxShadow: "inset 0 0 0 2px #bcbcbc", borderRadius: 8, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <span style={t(24, 1.4, -0.72, 400)}>{c.label}</span>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={t(40, 1.4, 0, 700, "#000", "everett")}>{c.value}</span>
        {c.unit && <span style={t(20, 1.4, -0.6, 700, "#000", "everett")}>{c.unit}</span>}
      </span>
    </div>
  );
}

export interface Tier {
  tierLabel: string; tier: string; value: string; unit?: string;
  conditionPrefix: string; conditionAmount: string; volumeNote: string; highlight?: boolean;
}

/** Tier backgrounds warm from neutral grey to orange; the highlighted tier is solid orange. */
const TIER_BG = [
  "linear-gradient(159.72deg, #FFFFFF 17.66%, #EDEDED 96.685%)",
  "linear-gradient(158.22deg, #FFFFFF 17.66%, #FFF2E8 96.685%)",
  "linear-gradient(158.59deg, #FFFFFF 47.038%, #FDBF92 105.38%)",
  "linear-gradient(148.58deg, #FFFFFF 15.354%, #FCA668 92.801%)",
];
const TIER_HIGHLIGHT = "linear-gradient(146deg, #FCBC8F 0%, #FA7312 95%)";

export function TierChip({ tier, index, count }: { tier: Tier; index: number; count: number }) {
  const ink = tier.highlight ? "#fff" : "#000";
  const bg = tier.highlight ? TIER_HIGHLIGHT : TIER_BG[Math.min(TIER_BG.length - 1, Math.round((index / Math.max(1, count - 2)) * (TIER_BG.length - 1)))];
  return (
    <div style={{ borderRadius: 8, backgroundImage: bg }}>
      <div style={{ boxShadow: "inset 0 0 0 2px #bcbcbc", borderRadius: 8, padding: 24, display: "flex", flexDirection: "column", alignItems: "flex-start", whiteSpace: "nowrap", height: 180, boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", ...t(16, 1.4, 0, 600, ink) }}>
          <span>{tier.tierLabel}</span>
          <span style={{ fontWeight: 700 }}>{tier.tier}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={t(40, 1.4, 0, 700, ink, "everett")}>{tier.value}</span>
          {tier.unit && <span style={t(20, 1.4, -0.6, 700, ink, "everett")}>{tier.unit}</span>}
        </div>
        <div style={{ letterSpacing: -0.72, color: ink }}>
          <div style={t(24, 1.4, -0.72, 600, ink)}>
            {tier.conditionPrefix}<b style={{ fontWeight: 700 }}>{tier.conditionAmount}</b>
          </div>
          <div style={t(16, 1.4, -0.72, 500, ink)}>{tier.volumeNote}</div>
        </div>
      </div>
    </div>
  );
}
