import { Band, g, gap, SAFE, type, type TypeStep } from "@/studio/grid";
import { scaleSizes } from "@/studio/scales";
import { noWrap, keepBreaks } from "@/deck/tokens";
import type { PatternMeta } from "@/deck/types";

export interface Person {
  name: string;
  role: string;
  /** Optional one-line focus or fun fact. */
  note?: string;
  /** Optional round photo; without one, their initials. */
  photo?: string;
}
export interface TeamIntroProps {
  title?: string;
  /** Up to 6. With 1 or 2, the cards grow into a speaker intro. */
  people: Person[];
}

export const teamIntroMeta: PatternMeta = {
  id: "team-intro", name: "Team intro", shape: "set",
  description: "Optional title, centred on the logo's line at the top; up to 6 people, each with a round photo (their initials when there's none), name, role and an optional one-line focus or fun fact. With 1 or 2 people the cards grow larger, as a speaker intro; 3 or 4 sit in one row; 5 or 6 in two rows of three.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 30, maxLines: 1 }, { slot: "people", maxItems: 6 },
    { slot: "person.name", maxChars: 28, maxLines: 1 }, { slot: "person.role", maxChars: 40, maxLines: 1 }, { slot: "person.note", maxChars: 60, maxLines: 1 },
  ],
};

/** Perfect Fifth scale, from the Tune line on revision 1 (h1 88/104, h2 72/88, h3 48/56, lead 39/56, body 32/48, caption 26/40). */
const SIZES = scaleSizes("fifth");
/** The logo's box (Chrome.tsx): top 125, height 52, right edge ≈ 300. */
const LOGO = { top: 125, right: 300 };
/** The title keeps 64 clear of the logo on both sides, so it stays centred on the slide. */
const TITLE_INSET = LOGO.right + g(8);

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

/** Sizes by how many people share the slide. */
function sizing(n: number): { photo: number; name: TypeStep; role: TypeStep; note: TypeStep; width: number } {
  const across = (k: number) => (SAFE.width - (k - 1) * g(4)) / k; // card width with k per row, 32 apart
  if (n <= 2) return { photo: g(30), name: "h3", role: "lead", note: "body", width: g(80) };
  if (n <= 4) return { photo: g(20), name: "lead", role: "body", note: "caption", width: across(n) };
  return { photo: g(16), name: "lead", role: "body", note: "caption", width: across(3) };
}

/** Approved in the Studio 2026-11-09 (revision 2). Built to the Studio rules (src/studio/STUDIO.md). */
export function TeamIntro({ title, people }: TeamIntroProps) {
  const list = people.slice(0, 6);
  const s = sizing(list.length);
  return (
    <>
      {/* Centred on the slide, on the logo's line (asked for on revision 1): trimmed to cap height and baseline,
          its capitals start at the logo's top. */}
      {title && (
        <h2 style={{ position: "absolute", left: TITLE_INSET, right: TITLE_INSET, top: LOGO.top, margin: 0, textAlign: "center", ...type("h2", 600, "#204680", undefined, SIZES), ...noWrap, textBox: "trim-both cap alphabetic" }}>{title}</h2>
      )}
      <Band gap={gap(g(6))}>
      {/* Cards wrap and centre, so a last row of 2 under 3 sits in the middle. */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: g(4), rowGap: g(6) }}>
        {list.map((p, i) => (
          <div key={i} style={{ width: s.width, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: g(3), minWidth: 0 }}>
            {p.photo
              // eslint-disable-next-line @next/next/no-img-element
              ? <img alt="" src={p.photo} style={{ width: s.photo, height: s.photo, borderRadius: "50%", objectFit: "cover", display: "block" }} />
              : (
                <span aria-hidden style={{ width: s.photo, height: s.photo, borderRadius: "50%", background: "rgba(32,70,128,0.10)", display: "grid", placeItems: "center" }}>
                  <span style={{ ...type(s.photo >= g(30) ? "h1" : s.photo >= g(20) ? "h3" : "lead", 600, "#204680", undefined, SIZES), textBox: "trim-both cap alphabetic" }}>{initials(p.name)}</span>
                </span>
              )}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: g(1), minWidth: 0, maxWidth: "100%" }}>
              <span style={{ ...type(s.name, 700, undefined, undefined, SIZES), ...keepBreaks }}>{p.name}</span>
              <span style={{ ...type(s.role, 500, "#545454", undefined, SIZES), ...keepBreaks }}>{p.role}</span>
              {p.note && <span style={{ ...type(s.note, 400, "#757575", undefined, SIZES), ...keepBreaks, marginTop: g(1) }}>{p.note}</span>}
            </div>
          </div>
        ))}
      </div>
      </Band>
    </>
  );
}
