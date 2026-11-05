"use client";
import { useEffect } from "react";

/** A short confirmation at the bottom of the screen that goes away by itself (or on ×). */
export function Toast({ message, tone = "ok", onDone, ms = 5000 }: { message: string; tone?: "ok" | "warn"; onDone: () => void; ms?: number }) {
  useEffect(() => {
    const t = setTimeout(onDone, ms);
    return () => clearTimeout(t);
  }, [message, ms, onDone]);
  return (
    <div className={`toast ${tone}`} role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" aria-label="Dismiss" onClick={onDone}>×</button>
    </div>
  );
}
