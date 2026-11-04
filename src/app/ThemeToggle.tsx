"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

/** Light, Dark, or System (follow the OS). Stored per browser; the layout's inline script applies it before paint. */
type Theme = "light" | "dark" | "system";

const listeners = new Set<() => void>();
const read = (): Theme => {
  try { const t = localStorage.getItem(THEME_KEY); return t === "light" || t === "dark" ? t : "system"; } catch { return "system"; }
};
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => { if (e.key === THEME_KEY) { apply(read()); fn(); } };
  window.addEventListener("storage", onStorage); // keep other tabs in step
  return () => { listeners.delete(fn); window.removeEventListener("storage", onStorage); };
};
function apply(t: Theme) {
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
}
function choose(t: Theme) {
  try { if (t === "system") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, t); } catch { /* not remembered */ }
  apply(t);
  listeners.forEach((fn) => fn());
}

const ICONS: Record<Theme, React.ReactNode> = {
  light: <><circle cx="8" cy="8" r="3" /><path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85" /></>,
  dark: <path d="M13.5 9.6A5.6 5.6 0 0 1 6.4 2.5a5.6 5.6 0 1 0 7.1 7.1Z" />,
  system: <><rect x="1.75" y="2.5" width="12.5" height="8.5" rx="1.5" /><path d="M5.5 13.5h5M8 11v2.5" /></>,
};
const LABELS: Record<Theme, string> = { light: "Light", dark: "Dark", system: "System" };

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, read, () => "system" as Theme);
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {(["light", "dark", "system"] as const).map((t) => (
        <button key={t} type="button" aria-pressed={theme === t} title={LABELS[t]} aria-label={LABELS[t]} onClick={() => choose(t)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICONS[t]}</svg>
        </button>
      ))}
    </div>
  );
}
