"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { hideAction, moveAction, removeAction, type Result } from "../actions";

export interface EditorItem {
  id: string; name: string; kind: string; hidden: boolean; follows?: string | null; overflow: number; thumb: ReactNode;
}

/** Reorder by dragging (or ↑ ↓), hide/show, remove. Every change saves to the draft straight away. */
export function SlideEditor({ deckId, items: initial }: { deckId: string; items: EditorItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (optimistic: EditorItem[], action: () => Promise<Result>) => {
    const before = items;
    setItems(optimistic);
    setError(null);
    start(async () => {
      const r = await action();
      if (r.error) { setItems(before); setError(r.error); }
      router.refresh();
    });
  };

  const move = (id: string, to: number) => {
    const from = items.findIndex((x) => x.id === id);
    if (from < 0 || to < 0 || to >= items.length || from === to) return;
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    run(next, () => moveAction(deckId, id, to + 1));
  };

  let n = 0;
  return (
    <>
      {error && <p className="signin-error" role="alert" style={{ marginBottom: 12 }}>{error}</p>}
      <ol className={`slide-editor${pending ? " busy" : ""}`}>
        {items.map((it, i) => {
          const number = it.hidden ? null : ++n;
          return (
            <li
              key={it.id}
              draggable
              onDragStart={(e) => { setDragId(it.id); e.dataTransfer.effectAllowed = "move"; }}
              onDragEnd={() => { setDragId(null); setOverIndex(null); }}
              onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
              onDrop={(e) => { e.preventDefault(); if (dragId) move(dragId, i); setDragId(null); setOverIndex(null); }}
              className={[it.hidden ? "is-hidden" : "", dragId === it.id ? "dragging" : "", overIndex === i && dragId !== it.id ? "drop" : ""].join(" ")}
            >
              <span className="grip" aria-hidden>⋮⋮</span>
              <span className="n">{number ? String(number).padStart(2, "0") : "—"}</span>
              <span className="mini">{it.thumb}</span>
              <span className="what">
                <b>{it.name}</b>
                <span className="mono">
                  {it.kind}
                  {it.follows && <> · <span title={`Approved slide ${it.follows}; it updates when the master changes`}>approved, updates with the {it.follows.split("/")[0]} master</span></>}
                  {it.hidden && " · hidden"}
                </span>
              </span>
              {it.overflow > 0 && <span className="tag warn">{it.overflow} overflow</span>}
              <span className="acts">
                <button className="icon" aria-label="Move up" disabled={i === 0} onClick={() => move(it.id, i - 1)}>↑</button>
                <button className="icon" aria-label="Move down" disabled={i === items.length - 1} onClick={() => move(it.id, i + 1)}>↓</button>
                <button className="btn" onClick={() => run(items.map((x) => (x.id === it.id ? { ...x, hidden: !x.hidden } : x)), () => hideAction(deckId, it.id, !it.hidden))}>
                  {it.hidden ? "Show" : "Hide"}
                </button>
                {confirm === it.id ? (
                  <button className="btn danger" onClick={() => { setConfirm(null); run(items.filter((x) => x.id !== it.id), () => removeAction(deckId, it.id)); }}>Remove?</button>
                ) : (
                  <button className="btn" onClick={() => setConfirm(it.id)} onBlur={() => setConfirm(null)}>Remove</button>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </>
  );
}
