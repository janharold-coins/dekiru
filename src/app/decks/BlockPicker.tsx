"use client";
import { useState, useTransition, type ReactNode } from "react";

/** One card. A product is one card for all its slides (blocks), drawn as a stack. */
export interface PickerItem { block: string; blocks: string[]; name: string; kind: string; thumb: ReactNode; stack?: ReactNode[] }
export interface PickerGroup { deckId: string; deckTitle: string; sections: { title: string; items: PickerItem[] }[] }

/**
 * Tick approved slides in the order you want them. Picked slides keep following the master,
 * so company updates (numbers, pricing, corridors) reach your deck too.
 */
export function BlockPicker({ groups, submitLabel, onSubmit, askTitle = false, defaultTitle = "", targets, defaultTarget = "" }: {
  groups: PickerGroup[];
  submitLabel: string;
  onSubmit: (blocks: string[], title: string, target: string) => Promise<{ error?: string } | void>;
  askTitle?: boolean;
  defaultTitle?: string;
  /** Decks the picked slides can go to; "" means a new deck (asks for its name). */
  targets?: { id: string; title: string }[];
  defaultTarget?: string;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState(defaultTitle);
  const [target, setTarget] = useState(defaultTarget);
  const needTitle = targets ? target === "" : askTitle;
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toggle = (b: string) => setPicked((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));
  const pickSection = (items: PickerItem[]) => {
    const all = items.every((i) => picked.includes(i.block));
    setPicked((p) => (all ? p.filter((x) => !items.some((i) => i.block === x)) : [...p, ...items.map((i) => i.block).filter((b) => !p.includes(b))]));
  };
  const items = new Map(groups.flatMap((g) => g.sections.flatMap((s) => s.items)).map((i) => [i.block, i]));
  const blocks = picked.flatMap((k) => items.get(k)?.blocks ?? [k]);
  const canSubmit = picked.length > 0 && (!needTitle || title.trim().length > 0);

  return (
    <div className="picker">
      <div className="picker-bar">
        {targets && (
          <label className="picker-title">
            <span>Add to</span>
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">A new deck</option>
              {targets.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </label>
        )}
        {needTitle && (
          <label className="picker-title">
            <span>Deck name</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ramp for Acme Exchange" maxLength={80} />
          </label>
        )}
        <span className="mono">{picked.length ? `${blocks.length} slide${blocks.length === 1 ? "" : "s"} picked, in this order` : "Pick slides in the order you want them"}</span>
        <span className="spacer" />
        {picked.length > 0 && <button className="linkish" onClick={() => setPicked([])}>Clear</button>}
        {error && <span className="hint warn">{error}</span>}
        <button className="btn primary" disabled={!canSubmit || pending}
          onClick={() => start(async () => { setError(null); const r = await onSubmit(blocks, title.trim(), target); if (r && r.error) setError(r.error); })}>
          {pending ? "Working…" : submitLabel}
        </button>
      </div>
      {groups.map((g) => (
        <section key={g.deckId}>
          <h2 className="section-h">{g.deckTitle}</h2>
          {g.sections.map((s) => (
            <div key={s.title} className="picker-section">
              <div className="row" style={{ margin: "18px 0 8px" }}>
                <b>{s.title}</b>
                <button className="linkish" onClick={() => pickSection(s.items)}>
                  {s.items.every((i) => picked.includes(i.block)) ? "Unpick section" : "Pick section"}
                </button>
              </div>
              <div className="grid picker-grid">
                {s.items.map((it) => {
                  const order = picked.indexOf(it.block);
                  return (
                    <button key={it.block} className={`card pick${order >= 0 ? " on" : ""}`} onClick={() => toggle(it.block)} aria-pressed={order >= 0}>
                      {it.stack?.length
                        ? <span className="thumbwrap stack">
                            {[...it.stack].reverse().map((t, i) => <span key={i} className={`layer back${it.stack!.length - i}`}>{t}</span>)}
                            <span className="layer front">{it.thumb}</span>
                            {order >= 0 && <span className="badge">{order + 1}</span>}
                          </span>
                        : <span className="thumbwrap">{it.thumb}{order >= 0 && <span className="badge">{order + 1}</span>}</span>}
                      <span className="meta"><b>{it.name}</b><span className="spacer" /><span className="mono">{it.kind}</span></span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
