"use client";
import { useState, useTransition, type ReactNode } from "react";

export interface PickerItem { block: string; name: string; kind: string; thumb: ReactNode }
export interface PickerGroup { deckId: string; deckTitle: string; sections: { title: string; items: PickerItem[] }[] }

/**
 * Tick approved slides in the order you want them. Picked slides keep following the master,
 * so company updates (numbers, pricing, corridors) reach your deck too.
 */
export function BlockPicker({ groups, submitLabel, onSubmit, askTitle = false, defaultTitle = "" }: {
  groups: PickerGroup[];
  submitLabel: string;
  onSubmit: (blocks: string[], title: string) => Promise<{ error?: string } | void>;
  askTitle?: boolean;
  defaultTitle?: string;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [title, setTitle] = useState(defaultTitle);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const toggle = (b: string) => setPicked((p) => (p.includes(b) ? p.filter((x) => x !== b) : [...p, b]));
  const pickSection = (items: PickerItem[]) => {
    const all = items.every((i) => picked.includes(i.block));
    setPicked((p) => (all ? p.filter((x) => !items.some((i) => i.block === x)) : [...p, ...items.map((i) => i.block).filter((b) => !p.includes(b))]));
  };
  const canSubmit = picked.length > 0 && (!askTitle || title.trim().length > 0);

  return (
    <div className="picker">
      <div className="picker-bar">
        {askTitle && (
          <label className="picker-title">
            <span>Deck name</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ramp for Acme Exchange" maxLength={80} />
          </label>
        )}
        <span className="mono">{picked.length ? `${picked.length} slide${picked.length === 1 ? "" : "s"} picked, in this order` : "Pick slides in the order you want them"}</span>
        <span className="spacer" />
        {picked.length > 0 && <button className="linkish" onClick={() => setPicked([])}>Clear</button>}
        {error && <span className="hint warn">{error}</span>}
        <button className="btn primary" disabled={!canSubmit || pending}
          onClick={() => start(async () => { setError(null); const r = await onSubmit(picked, title.trim()); if (r && r.error) setError(r.error); })}>
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
                      <span className="thumbwrap">{it.thumb}{order >= 0 && <span className="badge">{order + 1}</span>}</span>
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
