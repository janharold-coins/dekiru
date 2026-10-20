"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

export interface MenuItem {
  label: string;
  href?: string;
  onSelect?: () => void;
  danger?: boolean;
  /** Ask once more before running (the item's label changes to this). */
  confirm?: string;
  hidden?: boolean;
}

/** A small popover menu: opens from its trigger, closes on outside click, Escape or after choosing. */
export function Menu({ trigger, label, items, align = "end", className }: {
  trigger: ReactNode; label: string; items: MenuItem[]; align?: "start" | "end"; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) { setOpen(false); setArmed(null); }
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
            const isArmed = armed === i.label;
            const text = isArmed ? i.confirm! : i.label;
            const cls = `ed-menu-item${i.danger ? " danger" : ""}${isArmed ? " armed" : ""}`;
            if (i.href) return <Link key={i.label} role="menuitem" className={cls} href={i.href} onClick={() => setOpen(false)}>{text}</Link>;
            return (
              <button key={i.label} type="button" role="menuitem" className={cls}
                onClick={() => {
                  if (i.confirm && !isArmed) { setArmed(i.label); return; }
                  setOpen(false); setArmed(null); i.onSelect?.();
                }}>
                {text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
