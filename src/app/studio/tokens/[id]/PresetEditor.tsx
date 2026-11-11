"use client";
import { useState, useTransition } from "react";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { FONTS, fontById, type FontId } from "@/deck/fonts";
import { INKS, type InkRole } from "@/deck/ink";
import {
  DEFAULT_COLORS, DEFAULT_TYPOGRAPHY, presetIssues,
  type ColorTokens, type LightBackground, type PresetKind, type PresetTokens, type TypographyTokens,
} from "@/deck/presets";
import { patterns } from "@/deck/registry";
import { themeStyle, type ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";
import { Color } from "../../../library/themes/[id]/ThemeEditor";
import { DeletePreset } from "../DeletePreset";
import { discardPresetAction, publishPresetAction, savePresetAction, type Result } from "../actions";

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Controls on the left, every layout on the right with the preset on top of a theme you pick.
 * Mirrors the theme editor: save a draft, publish to update every deck using the set, "Show live" to compare.
 */
export function PresetEditor({ id, kind, name: initialName, tokens: initial, live, hasDraft, samples, themes, usedBy }: {
  id: string; kind: PresetKind; name: string; tokens: PresetTokens; live: PresetTokens | null; hasDraft: boolean;
  samples: SlideData[];
  /** Published themes to preview on (the first is the default). */
  themes: { id: string; name: string; tokens: ThemeTokens }[];
  /** Decks using the preset; null for the Coins.ph presets, which can't be deleted. */
  usedBy: number | null;
}) {
  const [tokens, setTokens] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [name, setName] = useState(initialName);
  const [themeId, setThemeId] = useState(themes[0]?.id);
  const [showLive, setShowLive] = useState(false);
  const [result, setResult] = useState<Result>({});
  const [confirm, setConfirm] = useState<"discard" | null>(null);
  const [pending, start] = useTransition();

  const backgrounds: LightBackground[] = themes.map((t) => ({ theme: t.name, from: t.tokens.backgrounds.light.from, to: t.tokens.backgrounds.light.to }));
  const issues = presetIssues(kind, tokens, backgrounds);
  const dirty = !same(tokens, saved) || name !== initialName;
  const draftExists = hasDraft || !same(saved, initial) || (live != null && !same(saved, live));
  const theme = themes.find((t) => t.id === themeId) ?? themes[0];
  const shown = showLive && live ? live : tokens;

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
        {kind === "typography"
          ? <TypographyControls value={tokens as TypographyTokens} onChange={setTokens} />
          : <ColorControls value={tokens as ColorTokens} onChange={setTokens} />}
        <button className="linkish" onClick={() => setTokens(kind === "typography" ? DEFAULT_TYPOGRAPHY : DEFAULT_COLORS)}>
          Reset to the approved Coins.ph look
        </button>
      </div>

      <div className="te-preview">
        <div className="te-bar">
          {issues.length > 0
            ? <ul className="sf-warn">{issues.map((m, k) => <li key={k}>{m}</li>)}</ul>
            : <p className="hint ok">{kind === "colors" ? "All text stays readable on every theme." : "Every weight the layouts use is available."}</p>}
          {result.error && <p className="hint warn" role="alert">{result.error}</p>}
          {result.ok && <p className="hint ok" role="status">{result.ok}</p>}
          <div className="te-actions">
            {themes.length > 1 && (
              <label className="picker-title">
                <span>Preview on</span>
                <select value={themeId} onChange={(e) => setThemeId(e.target.value)}>
                  {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </label>
            )}
            {live && (
              <label className="check"><input type="checkbox" checked={showLive} onChange={(e) => setShowLive(e.target.checked)} /><span>Show live version</span></label>
            )}
            <span className="spacer" style={{ flex: 1 }} />
            {draftExists && (confirm === "discard"
              ? <button className="btn danger" disabled={pending} onClick={() => { setConfirm(null); run(() => discardPresetAction(id)); }}>Discard draft?</button>
              : <button className="btn" disabled={pending} onClick={() => setConfirm("discard")} onBlur={() => setConfirm(null)}>Discard draft</button>)}
            <button className="btn" disabled={pending || !dirty} onClick={() => run(() => savePresetAction(id, tokens, name), () => setSaved(tokens))}>Save draft</button>
            <button className="btn primary" disabled={pending || (!dirty && !draftExists)}
              onClick={() => run(() => publishPresetAction(id, tokens, name), () => setSaved(tokens))}>
              {pending ? "Working…" : "Publish"}
            </button>
          </div>
        </div>
        <div className="te-grid" style={themeStyle(theme ? { ...theme.tokens, presets: { [kind]: shown } } : null)}>
          {samples.map((s) => (
            <figure key={s.id}>
              <div className="frame"><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></div>
              <figcaption className="mono">{patterns[s.pattern]?.meta.name}</figcaption>
            </figure>
          ))}
        </div>
        {usedBy != null && <div className="te-danger">
          <div>
            <b>Delete this set</b>
            <p className="hint">Removes it from every deck&apos;s Theme page. Share links already sent keep their look.</p>
          </div>
          <DeletePreset id={id} name={initialName} usedBy={usedBy} after="/studio?show=tokens" />
        </div>}
      </div>
    </div>
  );
}

/* ---------- typography ---------- */

function TypographyControls({ value, onChange }: { value: TypographyTokens; onChange: (t: TypographyTokens) => void }) {
  const pairing = value.title !== value.body;
  return (
    <>
      <fieldset className="sf-group">
        <legend>Fonts</legend>
        <div className="te-row" role="radiogroup" aria-label="Fonts">
          <label className="check">
            <input type="radio" name="mode" checked={!pairing} onChange={() => onChange({ ...value, body: value.title })} />
            <span>One font</span>
          </label>
          <label className="check">
            <input type="radio" name="mode" checked={pairing}
              onChange={() => onChange({ ...value, body: value.title === "cns-manrope" ? "inter" : "cns-manrope" })} />
            <span>Title and body pairing</span>
          </label>
        </div>
        <FontPick label={pairing ? "Titles and headings" : "Font"} value={value.title}
          onChange={(id) => onChange(pairing ? { ...value, title: id } : { ...value, title: id, body: id })} sample="Global money. Faster." />
        {pairing && <FontPick label="Body text" value={value.body} onChange={(id) => onChange({ ...value, body: id })}
          sample="Accept payments, move money cross-border, and trade crypto." />}
      </fieldset>
      {pairing && (
        <fieldset className="sf-group">
          <legend>Numbers</legend>
          <p className="hint">Section and agenda numbers, key numbers, prices and years.</p>
          <div className="te-row" role="radiogroup" aria-label="Numbers">
            {(["title", "body"] as const).map((r) => (
              <label key={r} className="check">
                <input type="radio" name="numeral" checked={value.numeral === r} onChange={() => onChange({ ...value, numeral: r })} />
                <span>Like {r === "title" ? "titles" : "body text"} ({fontById(r === "title" ? value.title : value.body)?.name})</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </>
  );
}

function FontPick({ label, value, onChange, sample }: { label: string; value: FontId; onChange: (id: FontId) => void; sample: string }) {
  const f = fontById(value)!;
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as FontId)}>
        {(["sans", "serif"] as const).map((k) => (
          <optgroup key={k} label={k === "sans" ? "Sans serif" : "Serif"}>
            {FONTS.filter((x) => x.kind === k).map((x) => <option key={x.id} value={x.id}>{x.name}{x.id === "cns-manrope" ? " (approved)" : ""}</option>)}
          </optgroup>
        ))}
      </select>
      <span style={{ fontFamily: `${f.stack}, sans-serif`, fontSize: 20, fontWeight: 500, lineHeight: 1.3 }}>{sample}</span>
    </label>
  );
}

/* ---------- colours ---------- */

function ColorControls({ value, onChange }: { value: ColorTokens; onChange: (t: ColorTokens) => void }) {
  const set = (id: InkRole, c: string | undefined) => {
    const ink = { ...value.ink };
    if (c === undefined) delete ink[id]; else ink[id] = c;
    onChange({ ink });
  };
  return (
    <fieldset className="sf-group">
      <legend>Colours</legend>
      <p className="hint">On light backgrounds. Dark backgrounds keep white text; status colours (red, green, amber) stay as they are.</p>
      {INKS.map((ink) => {
        const on = value.ink[ink.id] != null;
        return (
          <div key={ink.id} className="sf-group">
            <label className="check">
              <input type="checkbox" checked={on} onChange={(e) => set(ink.id, e.target.checked ? ink.designed : undefined)} />
              <span><b>{ink.name}</b> · {ink.use}</span>
            </label>
            <div className="te-row">
              <Color label={on ? ink.name : `${ink.name} (approved)`} value={value.ink[ink.id] ?? ink.designed} disabled={!on} onChange={(c) => set(ink.id, c)} />
            </div>
          </div>
        );
      })}
    </fieldset>
  );
}
