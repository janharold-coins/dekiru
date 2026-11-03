"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { SCALES, scaleSizes, scaleVars, type ScaleId } from "@/studio/scales";

/**
 * The Tune card on a layout proposal: try another type scale, element spacing or text edge, previewed live on
 * every example (CSS variables read by src/studio/grid.ts). What's picked is sent with the decision for Claude.
 */
interface Tuning { scale: ScaleId; gap: number | null; under: "text" | "alphabetic" }
const DEFAULT: Tuning = { scale: "default", gap: null, under: "text" };
const Ctx = createContext<{ tuning: Tuning; set: (t: Partial<Tuning>) => void; summary: string | null } | null>(null);

export function useTuning() { return useContext(Ctx); }

/** What changed from the layout's own values, in words, or null when nothing did. */
function describe(t: Tuning, defaultGap: number): string | null {
  const parts: string[] = [];
  if (t.scale !== "default") {
    const s = SCALES.find((x) => x.id === t.scale)!;
    const z = scaleSizes(t.scale);
    parts.push(`${s.name} type scale (×${s.ratio}: h2 ${z.h2.size}/${z.h2.line}, h3 ${z.h3.size}/${z.h3.line}, body ${z.body.size}/${z.body.line}, caption ${z.caption.size}/${z.caption.line})`);
  }
  if (t.gap != null && t.gap !== defaultGap) parts.push(`element spacing ${t.gap} (pairs ${pairOf(t.gap)})`);
  if (t.under !== DEFAULT.under) parts.push("text trimmed to the baseline (descenders hang below)");
  return parts.length ? parts.join("; ") : null;
}

const pairOf = (gap: number) => Math.max(8, Math.round(gap / 16) * 8); // half the gap, on the grid

export function TuneProvider({ defaultGap, children }: { defaultGap: number; children: ReactNode }) {
  const [tuning, setTuning] = useState<Tuning>(DEFAULT);
  const value = useMemo(() => ({
    tuning, set: (t: Partial<Tuning>) => setTuning((cur) => ({ ...cur, ...t })), summary: describe(tuning, defaultGap),
  }), [tuning, defaultGap]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/**
 * Wraps the previews: sets the variables the layout's type() / gap() / pair() read, and flags any example whose
 * content no longer fits between the logo and the footer at these settings (Studio rule: nothing overlaps).
 */
export function TunedPreview({ children }: { children: ReactNode }) {
  const t = useContext(Ctx)?.tuning ?? DEFAULT;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      for (const band of ref.current?.querySelectorAll<HTMLElement>("[data-st-band]") ?? []) {
        const box = band.getBoundingClientRect();
        const kids = [...band.children].map((c) => c.getBoundingClientRect());
        const over = kids.length > 0 && (kids[0].top < box.top - 0.5 || kids[kids.length - 1].bottom > box.bottom + 0.5);
        band.closest(".studio-big")?.toggleAttribute("data-too-tall", over);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [t]);
  const style = {
    ...scaleVars(t.scale),
    ...(t.gap != null ? { "--st-gap": `${t.gap}px`, "--st-pair": `${pairOf(t.gap)}px` } : {}),
    "--st-under": t.under,
  } as CSSProperties;
  return <div ref={ref} style={style} className="studio-tuned">{children}</div>;
}

export function TuneCard({ defaultGap }: { defaultGap: number }) {
  const ctx = useContext(Ctx);
  if (!ctx) return null;
  const { tuning, set, summary } = ctx;
  const gapNow = tuning.gap ?? defaultGap;
  const z = scaleSizes(tuning.scale);
  return (
    <section className="card studio-box studio-tune">
      <div className="studio-tune-head">
        <b>Tune</b>
        <button type="button" className="studio-rules-link" disabled={!summary} onClick={() => set(DEFAULT)}>Reset</button>
      </div>
      <p className="hint">Previews live on the slides. Your picks are sent with your decision.</p>

      <fieldset>
        <legend>Type scale</legend>
        <div className="studio-seg">
          {SCALES.map((s) => (
            <label key={s.id} className={tuning.scale === s.id ? "on" : ""}>
              <input type="radio" name="tune-scale" checked={tuning.scale === s.id} onChange={() => set({ scale: s.id })} />
              {s.name}{s.ratio && <span className="mono"> ×{s.ratio}</span>}
            </label>
          ))}
        </div>
        <span className="hint mono">h2 {z.h2.size} · h3 {z.h3.size} · body {z.body.size} · caption {z.caption.size}</span>
      </fieldset>

      <fieldset>
        <legend>Element spacing <span className="mono">{gapNow}px · pairs {tuning.gap == null ? `${defaultGap / 2}` : pairOf(gapNow)}px</span></legend>
        <input type="range" min={16} max={80} step={8} value={gapNow} onChange={(e) => set({ gap: Number(e.currentTarget.value) })} aria-label="Element spacing" />
      </fieldset>

      <fieldset>
        <legend>Text bottom edge</legend>
        <div className="studio-seg">
          <label className={tuning.under === "text" ? "on" : ""}><input type="radio" name="tune-under" checked={tuning.under === "text"} onChange={() => set({ under: "text" })} />Descender</label>
          <label className={tuning.under === "alphabetic" ? "on" : ""}><input type="radio" name="tune-under" checked={tuning.under === "alphabetic"} onChange={() => set({ under: "alphabetic" })} />Baseline</label>
        </div>
      </fieldset>
    </section>
  );
}
