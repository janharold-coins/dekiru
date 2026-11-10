import { Band, g, gap, pair, QuoteMark, SAFE, type } from "@/studio/grid";
import { onBg } from "@/deck/theme";
import { keepBreaks, noWrap } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface PersonaProps {
  name: string;
  /** One line: Online seller, 28, Manila. */
  description: string;
  /** Up to 3 small tags. */
  tags?: string[];
  /** Optional round photo; without one, initials. */
  photo?: string;
  /** Up to 3 each. */
  goals: string[];
  pains: string[];
  help: string[];
  /** Section names, if not Goals / Pain points / How we help. */
  labels?: [string, string, string];
  /** Optional quote in the persona's own words. */
  quote?: string;
}

export const personaMeta: PatternMeta = {
  id: "persona", name: "Customer persona", shape: "set",
  description: "A persona card on the left: round photo (initials without one), name, a one-line description (Online seller, 28, Manila) and up to 3 tags. On the right, three columns, Goals, Pain points and How we help (names editable), each with up to 3 short bullets, and an optional quote in the persona's own words under them. For sales and product kick-offs, design reviews and support trainings.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "name", maxChars: 20, maxLines: 2 }, { slot: "description", maxChars: 48, maxLines: 2 },
    { slot: "tags", maxItems: 3 }, { slot: "tag", maxChars: 14, maxLines: 1 },
    { slot: "goals", maxItems: 3 }, { slot: "pains", maxItems: 3 }, { slot: "help", maxItems: 3 }, { slot: "bullet", maxChars: 44, maxLines: 2 },
    { slot: "quote", maxChars: 110, maxLines: 2 },
  ],
};

const NAVY = "#204680";
const ACCENT = onBg("#fa7312", "accent");
const LINE = onBg("rgba(0,0,0,0.12)", "rule");
const LETTERS = { textBox: "trim-both cap alphabetic" } as const;
const CARD = g(56); // 448
const GUTTER = g(8); // 64
const PHOTO = g(20); // 160

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

function Section({ label, items }: { label: string; items: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: g(3), minWidth: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: g(2) }}>
        <span style={{ ...type("body", 700, NAVY), ...noWrap, ...LETTERS }}>{label}</span>
        <div style={{ height: g(0.5), borderRadius: 2, background: LINE }} />
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: g(3) }}>
        {items.slice(0, 3).map((t, i) => (
          <li key={i} style={{ display: "flex", gap: g(2), alignItems: "flex-start" }}>
            <span style={{ flex: "none", width: g(1), height: g(1), borderRadius: "50%", background: ACCENT, marginTop: g(1) }} />
            <span style={{ ...type("body", 500), ...keepBreaks, minWidth: 0 }}>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Persona({ name, description, tags = [], photo, goals, pains, help, labels = ["Goals", "Pain points", "How we help"], quote }: PersonaProps) {
  return (
    <>
      <Band style={{ width: CARD }}>
        <div style={{ borderRadius: g(4), padding: g(5), background: "rgba(32,70,128,0.06)", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: g(4) }}>
          {photo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={photo} alt="" width={PHOTO} height={PHOTO} style={{ borderRadius: "50%", objectFit: "cover" }} />
            : <span style={{ width: PHOTO, height: PHOTO, borderRadius: "50%", background: NAVY, display: "grid", placeItems: "center" }}>
                <span style={{ ...type("h2", 600, "#ffffff"), ...noWrap, ...LETTERS }}>{initials(name)}</span>
              </span>}
          <div style={{ display: "flex", flexDirection: "column", gap: pair(g(2)) }}>
            <span style={{ ...type("h3", 700, NAVY), ...keepBreaks }}>{name}</span>
            <span style={{ ...type("body", 500, "#545454"), ...keepBreaks }}>{description}</span>
          </div>
          {tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: g(1) }}>
              {tags.slice(0, 3).map((t, i) => (
                <span key={i} style={{ padding: `${g(1)}px ${g(2)}px`, borderRadius: g(5), background: "#ffffff", border: `2px solid ${LINE}` }}>
                  <span style={{ ...type("caption", 600, NAVY), ...noWrap, ...LETTERS, display: "block" }}>{t}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </Band>
      <Band gap={gap(g(6))} style={{ left: SAFE.left + CARD + GUTTER, width: SAFE.width - CARD - GUTTER }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: g(5), alignItems: "start" }}>
          <Section label={labels[0]} items={goals} />
          <Section label={labels[1]} items={pains} />
          <Section label={labels[2]} items={help} />
        </div>
        {quote && (
          <div style={{ display: "flex", gap: g(3), alignItems: "flex-start" }}>
            <QuoteMark height={g(4)} color={ACCENT} />
            <p style={{ margin: 0, ...type("lead", 500, NAVY), ...keepBreaks }}>{quote}</p>
          </div>
        )}
      </Band>
    </>
  );
}
