import { t, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

/** `number` is kept in saved data for older slides but ignored: items are numbered by position (01, 02…). */
export interface AgendaItem { number?: string; title: string; description: string }
export interface AgendaProps { title: string; items: AgendaItem[] }

export const agendaMeta: PatternMeta = {
  id: "agenda", name: "Agenda", shape: "sequence",
  description: "Big title left (up to five lines); up to four numbered sections right (title, short description), numbered automatically. Both columns are vertically centred.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "title", maxLines: 5 }, { slot: "items", maxItems: 4 }, { slot: "item.title", maxChars: 22 }, { slot: "item.description", maxChars: 60, maxLines: 2 }],
};

/** The title centres between the logo row and the footer; the item column centres on the slide's full height. */
const BAND_TOP = 177; // logo bottom
const BAND_BOTTOM = 938; // footer top
const pad = (n: number) => String(n).padStart(2, "0");

/** Items sit on a 308px pitch (3 fill the slide as designed); four items use a tighter 236px pitch. */
export function Agenda({ title, items }: AgendaProps) {
  const compact = items.length > 3;
  const pitch = compact ? 236 : 308;
  const inner = compact ? 20 : 71;
  return (
    <>
      <div style={{ position: "absolute", left: 79, width: 720, top: BAND_TOP, height: BAND_BOTTOM - BAND_TOP, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h1 style={{ margin: 0, ...t(120, 1.15, -3.6, 500), ...noWrap }}>{title}</h1>
      </div>
      <div style={{ position: "absolute", left: 825, top: 0, height: 1080, width: 1010, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {items.map((it, i) => (
          <div key={i} style={{ position: "relative", width: 1010, height: pitch, flex: "none" }}>
            <span style={{ position: "absolute", left: 24, top: inner - 47, ...t(120, 1.15, -3.6, 200, "#000", "everett"), opacity: 0.4 }}>{pad(i + 1)}</span>
            <div style={{ position: "absolute", left: 244.7, top: inner, display: "flex", flexDirection: "column", gap: 18 }}>
              <span style={{ ...t(72, 1.15, -2.16, 500), ...noWrap }}>{it.title}</span>
              <span style={{ ...t(40, 1.4, -0.4, 500), width: 622 }}>{it.description}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
