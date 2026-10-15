"use client";
import { useState, useTransition } from "react";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { patterns } from "@/deck/registry";
import {
  DEFAULT_TOKENS, ROLES, bestText, checkTheme, designedText, gradientCss, themeStyle,
  type BackgroundRole, type Gradient, type TextTone, type ThemeTokens,
} from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { archiveThemeAction, discardThemeAction, publishThemeAction, saveThemeAction, type Result } from "../actions";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Controls on the left, every layout on the right in the theme being edited.
 * "Show live" swaps the preview to the published version for comparison.
 */
export function ThemeEditor({ id, name: initialName, tokens: initial, live, hasDraft, samples, canArchive }: {
  id: string; name: string; tokens: ThemeTokens; live: ThemeTokens | null; hasDraft: boolean; samples: SlideData[]; canArchive: boolean;
}) {
  const [tokens, setTokens] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [name, setName] = useState(initialName);
  const [showLive, setShowLive] = useState(false);
  const [result, setResult] = useState<Result>({});
  const [confirm, setConfirm] = useState<"discard" | "archive" | null>(null);
  const [pending, start] = useTransition();
  const issues = checkTheme(tokens);
  const dirty = !same(tokens, saved) || name !== initialName;
  const draftExists = hasDraft || !same(saved, initial) || (live != null && !same(saved, live));

  // Changing a colour picks the readable text tone automatically; the Text switch can still override it.
  const setBg = (role: BackgroundRole, patch: Partial<Gradient>) =>
    setTokens((t) => {
      const next = { ...t.backgrounds[role], ...patch };
      if (!("text" in patch) && /^#[0-9a-f]{6}$/i.test(next.from) && /^#[0-9a-f]{6}$/i.test(next.to)) next.text = bestText(next);
      return { ...t, backgrounds: { ...t.backgrounds, [role]: next } };
    });
  const run = (fn: () => Promise<Result>, after?: () => void) => start(async () => {
    setResult({});
    const r = await fn();
    setResult(r ?? {});
    if (!r?.error) after?.();
  });

  return (
    <div className="theme-editor">
      <div className="te-controls">
        <label className="field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></label>

        {ROLES.map((r) => {
          const g = tokens.backgrounds[r.id];
          return (
            <fieldset key={r.id} className="sf-group">
              <legend>{r.name} background</legend>
              <p className="hint">{r.use}.</p>
              <div className="te-swatch" style={{ backgroundImage: gradientCss(g), color: g.text === "dark" ? "#17191d" : "#fff" }}>
                <span>Aa Text on this background</span>
              </div>
              <div className="field">
                <span>Text</span>
                <div className="seg te-seg" role="radiogroup" aria-label={`${r.name} text`}>
                  {(["light", "dark"] as TextTone[]).map((tone) => (
                    <button key={tone} type="button" role="radio" aria-checked={g.text === tone} className={g.text === tone ? "on" : ""}
                      onClick={() => setBg(r.id, { text: tone })}>
                      {tone === "light" ? "White" : "Dark"}{tone === designedText(r.id) ? " (as designed)" : ""}
                    </button>
                  ))}
                </div>
              </div>
              <div className="te-row">
                <Color label="Start" value={g.from} onChange={(v) => setBg(r.id, { from: v })} />
                <Num label="at %" value={g.fromAt} min={0} max={100} onChange={(v) => setBg(r.id, { fromAt: v })} />
              </div>
              <div className="te-row">
                <Color label="End" value={g.to} onChange={(v) => setBg(r.id, { to: v })} />
                <Num label="at %" value={g.toAt} min={0} max={100} onChange={(v) => setBg(r.id, { toAt: v })} />
              </div>
              <label className="field">
                <span>Direction {Math.round(g.angle)}°</span>
                <input type="range" min={0} max={360} step={1} value={g.angle} onChange={(e) => setBg(r.id, { angle: Number(e.target.value) })} />
              </label>
            </fieldset>
          );
        })}

        <fieldset className="sf-group">
          <legend>Glow</legend>
          <p className="hint">The soft colour clouds on covers, section dividers and closing slides.</p>
          <div className="te-row">
            <Color label="Warm (bottom left)" value={tokens.glow.warm} onChange={(v) => setTokens((t) => ({ ...t, glow: { ...t.glow, warm: v } }))} />
            <Color label="Cool (top right)" value={tokens.glow.cool} onChange={(v) => setTokens((t) => ({ ...t, glow: { ...t.glow, cool: v } }))} />
          </div>
          <label className="field">
            <span>Strength {Math.round(tokens.glow.strength * 100)}%</span>
            <input type="range" min={0} max={1.5} step={0.05} value={tokens.glow.strength}
              onChange={(e) => setTokens((t) => ({ ...t, glow: { ...t.glow, strength: Number(e.target.value) } }))} />
          </label>
        </fieldset>

        <fieldset className="sf-group">
          <legend>Accent bar</legend>
          <p className="hint">The three-colour rule along the bottom of light slides.</p>
          <div className="te-swatch bar" style={{ background: `linear-gradient(90deg, ${tokens.accent[0]} 0 24%, ${tokens.accent[1]} 24% 45%, ${tokens.accent[2]} 45% 95%, ${tokens.accent[1]} 95%)` }} />
          <div className="te-row">
            {tokens.accent.map((c, i) => (
              <Color key={i} label={["Left", "Middle", "Right"][i]} value={c}
                onChange={(v) => setTokens((t) => ({ ...t, accent: t.accent.map((x, j) => (j === i ? v : x)) as ThemeTokens["accent"] }))} />
            ))}
          </div>
        </fieldset>

        <button className="linkish" onClick={() => setTokens(DEFAULT_TOKENS)}>Reset to the approved Coins.ph look</button>
      </div>

      <div className="te-preview">
        <div className="te-bar">
          {issues.length > 0
            ? (
              <ul className="sf-warn">
                {issues.map((i, k) => (
                  <li key={k}>
                    {i.message}{" "}
                    {i.fix && i.role !== "accent" && i.role !== "glow" && (
                      <button className="linkish" onClick={() => setBg(i.role as BackgroundRole, { text: i.fix })}>Use {i.fix === "dark" ? "dark" : "white"} text</button>
                    )}
                  </li>
                ))}
              </ul>
            )
            : <p className="hint ok">All text stays readable.</p>}
          {result.error && <p className="hint warn" role="alert">{result.error}</p>}
          {result.ok && <p className="hint ok" role="status">{result.ok}</p>}
          <div className="te-actions">
            {live && (
              <label className="check"><input type="checkbox" checked={showLive} onChange={(e) => setShowLive(e.target.checked)} /><span>Show live version</span></label>
            )}
            <span className="spacer" style={{ flex: 1 }} />
            {draftExists && (confirm === "discard"
              ? <button className="btn danger" disabled={pending} onClick={() => { setConfirm(null); run(() => discardThemeAction(id)); }}>Discard draft?</button>
              : <button className="btn" disabled={pending} onClick={() => setConfirm("discard")} onBlur={() => setConfirm(null)}>Discard draft</button>)}
            <button className="btn" disabled={pending || !dirty} onClick={() => run(() => saveThemeAction(id, tokens, name), () => setSaved(tokens))}>Save draft</button>
            <button className="btn primary" disabled={pending || (!dirty && !draftExists)}
              onClick={() => run(() => publishThemeAction(id, tokens, name), () => setSaved(tokens))}>
              {pending ? "Working…" : "Publish"}
            </button>
          </div>
        </div>
        <div className="te-grid" style={themeStyle(showLive && live ? live : tokens)}>
          {samples.map((s) => (
            <figure key={s.id}>
              <div className="frame"><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></div>
              <figcaption className="mono">{patterns[s.pattern]?.meta.name}</figcaption>
            </figure>
          ))}
        </div>
        {canArchive && (
          <p style={{ marginTop: 24 }}>
            {confirm === "archive"
              ? <button className="btn danger" onClick={() => run(() => archiveThemeAction(id))}>Remove this theme?</button>
              : <button className="linkish" onClick={() => setConfirm("archive")}>Remove this theme</button>}
          </p>
        )}
      </div>
    </div>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const valid = /^#[0-9a-f]{6}$/i.test(value);
  return (
    <label className="field te-color">
      <span>{label}</span>
      <span className="te-color-in">
        <input type="color" value={valid ? value : "#000000"} onChange={(e) => onChange(e.target.value)} aria-label={`${label} colour`} />
        <input value={value} onChange={(e) => onChange(e.target.value.trim())} maxLength={7} spellCheck={false} aria-invalid={!valid} />
      </span>
    </label>
  );
}

function Num({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="field te-num">
      <span>{label}</span>
      <input type="number" min={min} max={max} step={1} value={Math.round(value * 10) / 10}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || 0)))} />
    </label>
  );
}
