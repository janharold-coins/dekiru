import { Band, g, gap, pair, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface StatusRisk {
  text: string;
  /** Optional chip on the risk (At risk, Blocked, Watching…). */
  status?: string;
}
export interface StatusUpdateProps {
  title: string;
  /** Optional period label beside the title: Week 45, Q4, November. */
  period?: string;
  /** Optional overall status chip: On track (green), At risk (amber), Off track (red). Any word works. */
  status?: string;
  /** Up to 4 each. */
  wins: string[];
  risks: StatusRisk[];
  asks: string[];
  /** Column names, if not Wins / Risks / Asks. */
  labels?: [string, string, string];
}

export const statusUpdateMeta: PatternMeta = {
  id: "status-update", name: "Status update", shape: "set",
  description: "Optional period label (Week 45, Q4) above the title and an overall status chip under it: On track green, At risk amber, Off track red. Three columns below, Wins, Risks and Asks (names editable), each with up to 4 short items; a risk can carry its own status chip. For team updates, project check-ins, management reports and OKR reviews.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 40, maxLines: 1 }, { slot: "period", maxChars: 16, maxLines: 1 }, { slot: "status", maxChars: 12, maxLines: 1 },
    { slot: "wins", maxItems: 4 }, { slot: "risks", maxItems: 4 }, { slot: "asks", maxItems: 4 },
    { slot: "item.text", maxChars: 56, maxLines: 2 },
  ],
};

const LINE = onBg("rgba(0,0,0,0.12)", "rule");
/** Text in chips and items is trimmed to cap height and baseline, so it centres by its letters (rule 4). */
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;

/** Status colours read by meaning (outside the brand palette, as on Roadmap and Do and don't). */
export function statusTone(status: string) {
  const s = status.toLowerCase();
  if (/off track|block|hold|stuck|late/.test(s)) return { fg: "#dc2626", bg: "rgba(220,38,38,0.12)" }; // red
  if (/risk|watch|pending|delay/.test(s)) return { fg: "#a16207", bg: "rgba(234,179,8,0.20)" }; // amber
  if (/on track|done|live|shipped|good|green/.test(s)) return { fg: "#15803d", bg: "rgba(21,128,61,0.12)" }; // green
  if (/progress|doing|building/.test(s)) return { fg: "#2066ed", bg: "rgba(32,102,237,0.12)" }; // blue
  return { fg: "#545454", bg: "rgba(0,0,0,0.06)" }; // grey
}

/** A status chip: 8 above and below the letters, 16 at the sides (rule 4), with a dot in the status colour. */
function Chip({ status, size = "caption" }: { status: string; size?: "caption" | "body" }) {
  const t = statusTone(status);
  const dot = size === "body" ? g(2) : g(1.5);
  return (
    <span style={{ flex: "none", display: "inline-flex", alignItems: "center", gap: g(1), padding: size === "body" ? `${g(2)}px ${g(3)}px` : `${g(1)}px ${g(2)}px`, borderRadius: g(5), background: t.bg }}>
      <span style={{ width: dot, height: dot, borderRadius: "50%", background: t.fg, flex: "none" }} />
      <span style={{ ...type(size, 600), color: t.fg, ...noWrap, ...LETTERS }}>{status}</span>
    </span>
  );
}

function Column({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: g(3), minWidth: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: g(2) }}>
        <span style={{ ...type("h3", 600, "#204680"), ...noWrap }}>{label}</span>
        <div style={{ height: g(0.5), borderRadius: 2, background: LINE }} />
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: g(3) }}>{children}</ul>
    </div>
  );
}

const Bullet = () => <span style={{ flex: "none", width: g(1), height: g(1), borderRadius: "50%", background: onBg("#fa7312", "accent"), marginTop: g(1) }} />; // centred on the capitals of the first line (cap ≈ 23)

/** Approved in the Studio 2026-11-09 (revision 2). Built to the Studio rules (src/studio/STUDIO.md). */
export function StatusUpdate({ title, period, status, wins, risks, asks, labels = ["Wins", "Risks", "Asks"] }: StatusUpdateProps) {
  const item = (text: string, chip?: string, key?: number) => (
    <li key={key} style={{ display: "flex", alignItems: "flex-start", gap: g(2) }}>
      <Bullet />
      <span style={{ ...type("body", 500), ...keepBreaks, minWidth: 0, flex: 1 }}>{text}</span>
      {chip && <span style={{ marginTop: -g(0.5) }}><Chip status={chip} /></span>}
    </li>
  );
  return (
    <Band gap={gap(g(5))}>
      {/* Revision 2: the period sits above the title, the status chip under it */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: g(3) }}>
        <div style={{ display: "flex", flexDirection: "column", gap: pair(g(2)) }}>
          {period && <span style={{ ...type("caption", 600, "#757575"), ...noWrap }}>{period}</span>}
          <h2 style={{ margin: 0, ...type("h2", 600, "#204680"), ...noWrap }}>{title}</h2>
        </div>
        {status && <Chip status={status} />}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: g(6), alignItems: "start" }}>
        <Column label={labels[0]}>{wins.slice(0, 4).map((w, i) => item(w, undefined, i))}</Column>
        <Column label={labels[1]}>{risks.slice(0, 4).map((r, i) => item(r.text, r.status, i))}</Column>
        <Column label={labels[2]}>{asks.slice(0, 4).map((a, i) => item(a, undefined, i))}</Column>
      </div>
    </Band>
  );
}
