/* Pieces shared by the share-link report and the presentations report. */
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { patterns } from "@/deck/registry";
import type { SlideData } from "@/deck/types";
import { duration } from "@/lib/analytics";

export const when = (d: Date) =>
  d.toLocaleString("en-PH", { timeZone: "Asia/Manila", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function slideName(s: SlideData) {
  const p = s.props as Record<string, unknown>;
  const runs = Array.isArray(p.titleRuns) ? (p.titleRuns as { text: string }[]).map((r) => r.text).join("") : null;
  const t = String(p.title ?? p.titleBold ?? runs ?? "").replace(/\s*\n\s*/g, " ").trim();
  const kind = patterns[s.pattern]?.meta.name ?? s.pattern;
  // Product slides share a title (hero, detail, flow), so say which one.
  return s.pattern.startsWith("product-") && s.pattern !== "product-index" ? `${t} · ${kind.replace(/^Product /, "")}` : t || kind;
}

export function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="tile">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

/** One row per slide: thumbnail, name, a bar for total time, and how many sessions reached it. */
export function SlideBars({ slides, stats, sessions, sessionWord }: {
  slides: SlideData[]; stats: { slideId: string; ms: number; reach: number }[]; sessions: number; sessionWord: string;
}) {
  const bySlide = new Map(stats.map((s) => [s.slideId, s]));
  const peak = Math.max(1, ...stats.map((s) => s.ms));
  return (
    <ol className="slidebars">
      <li className="head" aria-hidden><span /><span /><span>Slide</span><span>Time</span><span>{sessionWord}</span></li>
      {slides.map((s, i) => {
        const v = bySlide.get(s.id);
        const frac = v ? Math.max(0.015, v.ms / peak) : 0;
        return (
          <li key={s.id}>
            <span className="n">{String(i + 1).padStart(2, "0")}</span>
            <ScaledSlide className="mini"><RenderSlide slide={s} /></ScaledSlide>
            <span className="name">{slideName(s)}</span>
            <span className="bar">
              {v && <i style={{ "--p": frac } as React.CSSProperties} />}
              <b>{v ? duration(v.ms) : "not seen"}</b>
            </span>
            <span className="reach">{v ? `${v.reach} of ${sessions}` : "—"}</span>
          </li>
        );
      })}
    </ol>
  );
}
