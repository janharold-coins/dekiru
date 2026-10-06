import { t, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface AgendaItem { number: string; title: string; description: string }
export interface AgendaProps { title: string; items: AgendaItem[] }

export const agendaMeta: PatternMeta = {
  id: "agenda", name: "Agenda", shape: "sequence",
  description: "Big title left; numbered sections right (number, title, one-line description).",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "items", maxItems: 3 }, { slot: "item.title", maxChars: 22 }, { slot: "item.description", maxChars: 60, maxLines: 2 }],
};

/** Items sit on a fixed 308px pitch starting at y 78 (3 items fill the slide). */
export function Agenda({ title, items }: AgendaProps) {
  const pitch = items.length > 3 ? 924 / items.length : 308;
  return (
    <>
      <h1 style={{ position: "absolute", left: 79, top: 381, margin: 0, ...t(120, 1.15, -3.6, 500), ...noWrap }}>{title}</h1>
      {items.map((it, i) => {
        const top = 78 + i * pitch;
        return (
          <div key={i} style={{ position: "absolute", left: 825, top, width: 1010, height: 308 }}>
            <span style={{ position: "absolute", left: 24, top: 24, ...t(120, 1.15, -3.6, 200, "#000", "everett"), opacity: 0.4 }}>{it.number}</span>
            <div style={{ position: "absolute", left: 244.7, top: 71, display: "flex", flexDirection: "column", gap: 18 }}>
              <span style={{ ...t(72, 1.15, -2.16, 500), ...noWrap }}>{it.title}</span>
              <span style={{ ...t(40, 1.4, -0.4, 500), width: 622 }}>{it.description}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}
