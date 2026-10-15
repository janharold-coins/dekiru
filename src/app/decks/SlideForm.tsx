"use client";
import { useMemo, useState, useTransition, type ReactNode } from "react";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { countImages, fieldLabel, isEditableKey, itemLabel, listLimits } from "@/deck/fields";
import { checkOverflow } from "@/deck/overflow";
import { themeStyle, type ThemeTokens } from "@/deck/theme";
import type { SlideData } from "@/deck/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = Record<string, any>;

export interface FormTarget { id: string; title: string; theme?: ThemeTokens }

/**
 * Fill in a slide's words with a live preview. Layout, images and styling stay as approved; text that runs
 * over the layout's budget is flagged (never shrunk).
 *
 * With `targets`, the person also picks where the slide goes: one of their decks, or a new deck.
 */
export function SlideForm({ slide, saveLabel, onSave, targets, defaultTarget = "", note }: {
  slide: SlideData;
  saveLabel: string;
  onSave: (props: Props, target: string, title: string) => Promise<{ error?: string } | void>;
  targets?: FormTarget[];
  defaultTarget?: string;
  note?: ReactNode;
}) {
  const [props, setProps] = useState<Props>(() => structuredClone(slide.props) as Props);
  const [target, setTarget] = useState(defaultTarget);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const preview = useMemo(() => ({ ...slide, props }), [slide, props]);
  const warnings = checkOverflow(preview);
  const images = countImages(slide.props);
  const newDeck = targets && target === "";

  const update = (next: Props) => { setProps(next); setDirty(true); };

  return (
    <div className="slide-form">
      <div className="sf-fields">
        {note}
        <Fields pattern={slide.pattern} value={props} onChange={update} />
      </div>
      <aside className="sf-side">
        {/* The slide takes the theme of the deck it goes into. */}
        <div className="frame" style={themeStyle(targets?.find((t) => t.id === target)?.theme)}>
          <ScaledSlide><RenderSlide slide={preview} /></ScaledSlide>
        </div>
        {warnings.length > 0 ? (
          <ul className="sf-warn">
            {warnings.map((w, i) => <li key={i}><b>{fieldLabel(w.slot.split(".").pop()!.split(" ")[0])}</b>: {w.message}</li>)}
          </ul>
        ) : <p className="hint ok">Everything fits.</p>}
        {images > 0 && <p className="hint">{images === 1 ? "The image stays" : `The ${images} images stay`} as in the approved slide. Uploads are coming.</p>}
        <div className="sf-save">
          {targets && (
            <label className="field">
              <span>Add to</span>
              <select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">A new deck</option>
                {targets.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </label>
          )}
          {newDeck && (
            <label className="field">
              <span>Deck name</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ramp for Acme Exchange" maxLength={80} />
            </label>
          )}
          {error && <p className="hint warn" role="alert">{error}</p>}
          <button className="btn primary" disabled={pending || (newDeck && !title.trim()) || (!targets && !dirty)}
            onClick={() => start(async () => { setError(null); const r = await onSave(props, target, title.trim()); if (r && r.error) setError(r.error); })}>
            {pending ? "Saving…" : saveLabel}
          </button>
        </div>
      </aside>
    </div>
  );
}

/** The editable parts of an object, recursively. */
function Fields({ pattern, value, onChange }: { pattern: string; value: Props; onChange: (v: Props) => void }) {
  const set = (key: string, v: unknown) => {
    const next: Props = { ...value, [key]: v };
    if (key === "value" && "valueRuns" in next) delete next.valueRuns; // styled runs would hide the new value
    onChange(next);
  };
  return (
    <>
      {Object.entries(value).filter(([k, v]) => isEditableKey(k, v)).map(([k, v]) => {
        if (typeof v === "string") return <TextField key={k} label={fieldLabel(k)} value={v} onChange={(x) => set(k, x)} />;
        if (Array.isArray(v)) return <ListField key={k} pattern={pattern} name={k} items={v} onChange={(x) => set(k, x)} />;
        return (
          <fieldset key={k} className="sf-group">
            <legend>{fieldLabel(k)}</legend>
            <Fields pattern={pattern} value={v} onChange={(x) => set(k, x)} />
          </fieldset>
        );
      })}
    </>
  );
}

function ListField({ pattern, name, items, onChange }: { pattern: string; name: string; items: any[]; onChange: (v: any[]) => void }) {
  const { fixed, max } = listLimits(pattern, name, items);
  const setAt = (i: number, v: unknown) => onChange(items.map((x, j) => (j === i ? v : x)));
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const add = () => onChange([...items, structuredClone(items[items.length - 1])]);
  return (
    <fieldset className="sf-group">
      <legend>{fieldLabel(name)}</legend>
      {items.map((it, i) => (
        <div key={i} className="sf-item">
          <div className="sf-item-h">
            <span className="mono">{itemLabel(name, i)}</span>
            {!fixed && items.length > 1 && <button className="linkish" onClick={() => remove(i)}>Remove</button>}
          </div>
          {typeof it === "string"
            ? <TextField label="" value={it} onChange={(x) => setAt(i, x)} />
            : <Fields pattern={pattern} value={it} onChange={(x) => setAt(i, x)} />}
        </div>
      ))}
      {!fixed && items.length < max && items.length > 0 && (
        <button className="btn" onClick={add}>+ Add {itemLabel(name, items.length).replace(/ \d+$/, "").toLowerCase()}</button>
      )}
    </fieldset>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  // Explicit line breaks show on the slide; long lines wrap in the box (CSS grows it to fit where supported).
  const rows = value.split("\n").reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 44)), 0);
  return (
    <label className="field">
      {label && <span>{label}</span>}
      <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} spellCheck />
    </label>
  );
}
