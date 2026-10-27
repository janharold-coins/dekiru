"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface MenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
  /** Ask once more in a modal before running. */
  confirm?: { title: string; body?: string; action: string };
  hidden?: boolean;
}

/** A small popover menu: opens from its trigger, closes on outside click, Escape or after choosing. */
export function Menu({ trigger, label, items, align = "end", className }: {
  trigger: ReactNode; label: string; items: MenuItem[]; align?: "start" | "end"; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [asking, setAsking] = useState<MenuItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);
  return (
    <div className={`ed-menu ${className ?? ""}`} ref={ref}>
      <button type="button" className="ed-icon-btn" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {trigger}
      </button>
      {open && (
        <div role="menu" className={`ed-menu-list ${align}`}>
          {items.filter((i) => !i.hidden).map((i) => {
            const cls = `ed-menu-item${i.danger ? " danger" : ""}`;
            if (i.href) return <Link key={i.label} role="menuitem" className={cls} href={i.href} onClick={() => setOpen(false)}>{i.label}</Link>;
            return (
              <button key={i.label} type="button" role="menuitem" className={cls}
                onClick={() => { setOpen(false); if (i.confirm) setAsking(i); else i.onSelect?.(); }}>
                {i.label}{i.confirm ? "…" : ""}
              </button>
            );
          })}
        </div>
      )}
      {asking?.confirm && (
        <ConfirmDialog {...asking.confirm} danger={asking.danger}
          onCancel={() => setAsking(null)}
          onConfirm={() => { const run = asking.onSelect; setAsking(null); run?.(); }} />
      )}
    </div>
  );
}

/** A modal "are you sure?" built on <dialog>: focus is trapped, Escape and the backdrop cancel. */
export function ConfirmDialog({ title, body, action, danger, onConfirm, onCancel }: {
  title: string; body?: string; action: string; danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog ref={ref} className="ed-dialog" aria-labelledby="ed-dialog-title"
      onCancel={(e) => { e.preventDefault(); onCancel(); }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="ed-dialog-body">
        <h2 id="ed-dialog-title">{title}</h2>
        {body && <p>{body}</p>}
      </div>
      <div className="ed-dialog-actions">
        <button type="button" className="ed-btn" onClick={onCancel} autoFocus>Cancel</button>
        <button type="button" className={`ed-btn ${danger ? "ed-btn-danger" : "ed-btn-primary"}`} onClick={onConfirm}>{action}</button>
      </div>
    </dialog>
  );
}
