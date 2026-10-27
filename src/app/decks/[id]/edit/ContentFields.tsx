"use client";
import { editableEntries, fieldLabel, fieldPlaceholder, itemLabel, listLimits } from "@/deck/fields";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Props = Record<string, any>;

/**
 * A slide's editable words as a form (layout, images and colours are not editable here).
 * Lists of short two-part items (value + label) show as compact rows, like "Key metrics" in the design.
 */
export function ContentFields({ pattern, path = pattern, value, onChange, disabled }: {
  pattern: string; path?: string; value: Props; onChange: (v: Props) => void; disabled?: boolean;
}) {
  const set = (key: string, v: unknown) => {
    const next: Props = { ...value, [key]: v };
    if (key === "value" && "valueRuns" in next) delete next.valueRuns; // styled runs would hide the new value
    onChange(next);
  };
  return (
    <>
      {editableEntries(path, value).map(([k, v]: [string, any]) => {
        if (typeof v === "string") return <TextField key={k} label={fieldLabel(k)} value={v} placeholder={fieldPlaceholder(path, k)} disabled={disabled} onChange={(x) => set(k, x)} />;
        if (Array.isArray(v)) return <ListField key={k} pattern={pattern} path={`${path}.${k}[]`} name={k} items={v} disabled={disabled} onChange={(x) => set(k, x)} />;
        return (
          <section key={k} className="ed-group">
            <h3 className="ed-group-h"><span>{fieldLabel(k)}</span></h3>
            <ContentFields pattern={pattern} path={`${path}.${k}`} value={v} disabled={disabled} onChange={(x) => set(k, x)} />
          </section>
        );
      })}
    </>
  );
}

/** Editable string keys of a list item, when every item is a flat object with exactly two short text fields. */
function compactKeys(path: string, items: any[]): [string, string] | null {
  if (!items.length || !items.every((it) => it && typeof it === "object" && !Array.isArray(it))) return null;
  const keys = editableEntries(path, items[0]).map(([k]) => k);
  if (keys.length !== 2) return null;
  const short = items.every((it) => keys.every((k) => typeof it[k] === "string" && !it[k].includes("\n") && it[k].length <= 48)
    && editableEntries(path, it).length === 2);
  return short ? [keys[0], keys[1]] : null;
}

function ListField({ pattern, path, name, items, onChange, disabled }: {
  pattern: string; path: string; name: string; items: any[]; onChange: (v: any[]) => void; disabled?: boolean;
}) {
  const { fixed, max } = listLimits(pattern, name, items);
  const setAt = (i: number, v: unknown) => onChange(items.map((x, j) => (j === i ? v : x)));
  const remove = (i: number) => onChange(items.filter((_, j) => j !== i));
  const add = () => onChange([...items, structuredClone(items[items.length - 1])]);
  const one = itemLabel(name, 0).replace(/ \d+$/, "").toLowerCase();
  const compact = compactKeys(path, items);
  const canRemove = !fixed && items.length > 1 && !disabled;
  return (
    <section className="ed-group">
      <h3 className="ed-group-h">
        <span>{fieldLabel(name)}</span>
        <span className="ed-count">{items.length} {items.length === 1 ? one : `${one}s`.replace(/ys$/, "ies").replace(/ss$/, "s")}</span>
      </h3>
      {compact ? (
        <div className="ed-rows">
          <div className="ed-row ed-row-h" aria-hidden><span>{fieldLabel(compact[0])}</span><span>{fieldLabel(compact[1])}</span></div>
          {items.map((it, i) => (
            <div key={i} className="ed-row">
              <input className="ed-input" value={it[compact[0]]} disabled={disabled} aria-label={`${itemLabel(name, i)} ${fieldLabel(compact[0])}`}
                onChange={(e) => setAt(i, { ...it, [compact[0]]: e.target.value })} />
              <input className="ed-input" value={it[compact[1]]} disabled={disabled} aria-label={`${itemLabel(name, i)} ${fieldLabel(compact[1])}`}
                onChange={(e) => setAt(i, { ...it, [compact[1]]: e.target.value })} />
              {canRemove && <button type="button" className="ed-x" aria-label={`Remove ${itemLabel(name, i)}`} onClick={() => remove(i)}>×</button>}
            </div>
          ))}
        </div>
      ) : (
        items.map((it, i) => (
          <div key={i} className="ed-item">
            <div className="ed-item-h">
              <span>{itemLabel(name, i)}</span>
              {canRemove && <button type="button" className="ed-link" onClick={() => remove(i)}>Remove</button>}
            </div>
            {typeof it === "string"
              ? <TextField label="" value={it} disabled={disabled} onChange={(x) => setAt(i, x)} />
              : <ContentFields pattern={pattern} path={path} value={it} disabled={disabled} onChange={(x) => setAt(i, x)} />}
          </div>
        ))
      )}
      {!fixed && !disabled && items.length < max && items.length > 0 && (
        <button type="button" className="ed-btn ed-btn-sm" onClick={add}>+ Add {one}</button>
      )}
    </section>
  );
}

function TextField({ label, value, placeholder, onChange, disabled }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void; disabled?: boolean }) {
  // Explicit line breaks show on the slide; the box grows with the text where the browser supports it.
  // Short single-line values (years, numbers, labels) get a compact box.
  const short = !value.includes("\n") && value.length <= 24;
  const rows = value.split("\n").reduce((n, line) => n + Math.max(1, Math.ceil(line.length / 40)), 0);
  return (
    <label className="ed-field">
      {label && <span className="ed-label">{label}</span>}
      <textarea className={`ed-input ed-textarea${short ? " short" : ""}`} rows={short ? 1 : rows} value={value} placeholder={placeholder} disabled={disabled} spellCheck
        onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
