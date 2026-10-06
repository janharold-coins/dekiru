"use client";
import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from "react";

/** Full-screen presenter: ← → / space / PageUp-Down, Home/End, F for fullscreen. Slide index lives in the URL hash. */
export function Presenter({ slides }: { slides: ReactNode[] }) {
  const n = slides.length;
  const [i, setI] = useState(0);
  const [scale, setScale] = useState(0);

  useLayoutEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    fit();
    window.addEventListener("resize", fit);
    const fromHash = () => {
      const h = parseInt(window.location.hash.slice(1), 10);
      if (h >= 1 && h <= n) setI(h - 1);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [n]);

  const go = useCallback((next: number) => {
    const c = Math.max(0, Math.min(n - 1, next));
    setI(c);
    history.replaceState(null, "", `#${c + 1}`);
  }, [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); go(i + 1); }
      else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); go(i - 1); }
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(n - 1);
      else if (e.key.toLowerCase() === "f") document.documentElement.requestFullscreen?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [i, n, go]);

  return (
    <div className="present" onClick={(e) => go(e.clientX > window.innerWidth / 3 ? i + 1 : i - 1)}>
      <div style={{ width: 1920 * scale, height: 1080 * scale, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `scale(${scale})` }}>{slides[i]}</div>
      </div>
      <div className="hud">{i + 1} / {n} · ← → to move · F for full screen</div>
    </div>
  );
}
