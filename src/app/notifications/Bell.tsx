"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Notification } from "@/lib/notifications";
import { markNotificationsReadAction } from "./actions";

const ago = (d: Date) => {
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  return days < 7 ? `${days}d ago` : new Date(d).toLocaleDateString("en-PH", { day: "numeric", month: "short" });
};

/** The bell in the header (spec §7b): unread count, a list of what happened, mark-read on open. */
export function Bell({ items, unread: initialUnread }: { items: Notification[]; unread: number }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
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
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) { setUnread(0); void markNotificationsReadAction(); }
  };
  return (
    <div className="app-bell" ref={ref}>
      <button type="button" className="app-bell-btn" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`} aria-expanded={open} onClick={toggle}>
        <img src="/app/bell.svg" alt="" width={18} height={18} />
        {unread > 0 && <span className="app-bell-count">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="app-bell-list" role="dialog" aria-label="Notifications">
          {items.length === 0 ? <p className="app-bell-empty">Nothing yet. You&apos;ll hear here when a deck is sent to you for review, approved, or shared with you.</p> : (
            <ul>
              {items.map((n) => (
                <li key={n.id} className={n.readAt ? "" : "unread"}>
                  <Link href={n.href} onClick={() => setOpen(false)}>
                    <span className={`app-bell-kind ${n.kind}`} aria-hidden />
                    <span className="app-bell-text">{n.text}</span>
                    <span className="app-bell-when">{ago(n.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
