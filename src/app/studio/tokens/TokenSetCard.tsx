"use client";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { fontById } from "@/deck/fonts";
import { INKS } from "@/deck/ink";
import { normalizeTypography, type ColorTokens, type PresetKind, type PresetTokens, type TypographyTokens } from "@/deck/presets";
import { themeStyle, type ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";

/** A deck the set can be previewed on: its look (theme + its own sets) and its slides. */
export interface PreviewDeck { id: string; title: string; master: boolean; tokens: ThemeTokens; slides: SlideData[] }

/** Where design tokens are used. Only Decks exists today; the others are listed so the structure is visible. */
const MEDIA = [
  { id: "all", name: "All" },
  { id: "decks", name: "Decks" },
  { id: "graphics", name: "Graphics", later: true },
  { id: "ui", name: "UI", later: true },
] as const;

/**
 * One design token set: a specimen of what it sets (two thirds), and the set at work on a real deck (one third),
 * picked by medium and deck. Footer: the set's name (opens the editor) and, on the right, its fonts (typography)
 * or where it's used (colours).
 */
export function TokenSetCard({ id, kind, name, tokens, version, footer, decks }: {
  id: string; kind: PresetKind; name: string; tokens: PresetTokens; version: number;
  footer: string;
  /** Decks using the set first, then the company masters. */
  decks: PreviewDeck[];
}) {
  const [medium, setMedium] = useState<string>("all");
  const [deckId, setDeckId] = useState(decks[0]?.id ?? "");
  const deck = decks.find((d) => d.id === deckId) ?? decks[0];
  // The deck's own look, with this set in place of whatever it uses for this kind.
  const look = deck ? { ...deck.tokens, presets: { ...deck.tokens.presets, [kind]: tokens } } : null;

  return (
    <article className="token-card">
      <div className="token-body">
        <div className="token-specimen">
          {kind === "typography" ? <TypeSpecimen tokens={tokens as TypographyTokens} /> : <ColorSpecimen tokens={tokens as ColorTokens} />}
        </div>
        {/* The column takes the specimen's height; its slides scroll inside it. */}
        <aside className="token-side" aria-label={`${name} on a deck`}><div className="token-side-in">
          <select className="token-select" value={medium} onChange={(e) => setMedium(e.target.value)} aria-label="Where it's used">
            {MEDIA.map((m) => (
              <option key={m.id} value={m.id} disabled={"later" in m}>{m.name}{"later" in m ? " (coming later)" : ""}</option>
            ))}
          </select>
          <select className="token-select" value={deck?.id ?? ""} onChange={(e) => setDeckId(e.target.value)} aria-label="Deck to preview on" disabled={!decks.length}>
            {decks.map((d) => <option key={d.id} value={d.id}>{d.title}{d.master ? "" : " (uses this set)"}</option>)}
          </select>
          <div className="token-slides" style={themeStyle(look)}>
            {deck?.slides.map((s) => <div key={s.id} className="frame"><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></div>)}
            {!deck && <p className="hint">No deck to preview on.</p>}
          </div>
        </div></aside>
      </div>
      <footer className="token-foot">
        <Link href={`/studio/tokens/${id}`} className="token-name">{name}</Link>
        <span className="mono">v{version}</span>
        <span className="spacer" style={{ flex: 1 }} />
        <span className="token-meta">{footer}</span>
      </footer>
    </article>
  );
}

/* ---------- typography ---------- */

const TITLE = "Time in the market\nbeats timing the market";
const LEAD = "Diversify across assets, sectors, and borders. Every investment carries risk, and every return should be weighed against the volatility it took to earn it. Rebalance once a year, not every time the headlines change.";
const SMALL = "A sound portfolio is built slowly; it favors low fees over clever trades, steady contributions over lucky guesses, and a written plan over a reaction to the morning’s news. Liquidity matters: keep enough in cash or stablecoins to cover short-term needs without selling at a loss.";

function TypeSpecimen({ tokens }: { tokens: TypographyTokens }) {
  const t = normalizeTypography(tokens);
  const title = fontById(t.title)!.stack;
  const body = fontById(t.body)!.stack;
  return (
    <div className="type-specimen">
      <Guided text={TITLE} style={{ fontFamily: `${title}, sans-serif`, fontWeight: 500 }} className="type-title" />
      <div className="type-columns">
        <p className="type-lead" style={{ fontFamily: `${body}, sans-serif` }}>{LEAD}</p>
        <p className="type-small" style={{ fontFamily: `${body}, sans-serif` }}>{SMALL}</p>
      </div>
    </div>
  );
}

/**
 * Text with its guide lines drawn behind each line: cap height, x-height and baseline, measured from the font
 * itself once it has loaded, so the lines show how this font sits (and differs from Cns Manrope).
 */
function Guided({ text, style, className }: { text: string; style: React.CSSProperties; className: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [lines, setLines] = useState<number[]>([]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    const measure = async () => {
      const cs = getComputedStyle(el);
      const font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      try { await document.fonts.load(font, text); } catch { /* measure with whatever is there */ }
      if (!alive) return;
      const ctx = document.createElement("canvas").getContext("2d");
      if (!ctx) return;
      ctx.font = font;
      const cap = ctx.measureText("H").actualBoundingBoxAscent;
      const x = ctx.measureText("x").actualBoundingBoxAscent;
      const m = ctx.measureText("Hxg");
      const asc = m.fontBoundingBoxAscent, desc = m.fontBoundingBoxDescent;
      const lh = parseFloat(cs.lineHeight);
      const count = Math.round(el.offsetHeight / lh);
      const out: number[] = [];
      for (let i = 0; i < count; i++) {
        const base = i * lh + (lh - (asc + desc)) / 2 + asc;
        out.push(base - cap, base - x, base);
      }
      setLines(out.map((v) => Math.round(v)));
    };
    measure();
    const ro = new ResizeObserver(() => { measure(); });
    ro.observe(el);
    return () => { alive = false; ro.disconnect(); };
  }, [text, style.fontFamily]);

  return (
    <div className="guided">
      {lines.map((y, i) => <span key={i} className="guide" style={{ top: y }} aria-hidden />)}
      <p ref={ref} className={className} style={style}>{text}</p>
    </div>
  );
}

/* ---------- colours ---------- */

function ColorSpecimen({ tokens }: { tokens: ColorTokens }) {
  return (
    <ul className="color-specimen">
      {INKS.map((ink) => {
        const c = tokens.ink[ink.id] ?? ink.designed;
        return (
          <li key={ink.id}>
            <span className="swatch" style={{ background: c }} />
            <b>{ink.name}</b>
            <span className="mono">{c}</span>
            {!tokens.ink[ink.id] && <span className="hint">approved</span>}
          </li>
        );
      })}
    </ul>
  );
}
