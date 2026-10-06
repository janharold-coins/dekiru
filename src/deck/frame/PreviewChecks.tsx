"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Preview-only annotations: flags images whose aspect ratio doesn't match their fixed slot
 * (rendered with object-fit: cover). Never shown in present mode or in exported decks.
 */
export function PreviewChecks({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [warnings, setWarnings] = useState<{ x: number; y: number; w: number; text: string }[]>([]);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const check = () => {
      const out: { x: number; y: number; w: number; text: string }[] = [];
      root.querySelectorAll<HTMLImageElement>("img[data-slot]").forEach((img) => {
        if (!img.naturalWidth) return;
        const slotRatio = img.width / img.height;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        if (Math.abs(slotRatio - imgRatio) / slotRatio > 0.02) {
          out.push({ x: img.offsetLeft, y: img.offsetTop, w: img.width, text: `Uploaded image doesn't match the ${img.dataset.slotSize} container` });
        }
      });
      setWarnings(out);
    };
    const imgs = root.querySelectorAll("img[data-slot]");
    imgs.forEach((i) => i.addEventListener("load", check));
    check();
    return () => imgs.forEach((i) => i.removeEventListener("load", check));
  }, []);
  return (
    <div ref={ref} style={{ position: "relative", width: 1920, height: 1080 }}>
      {children}
      {warnings.map((w, i) => (
        <div key={i} style={{ position: "absolute", left: w.x, top: w.y, width: w.w, padding: "14px 20px", background: "rgba(250,115,18,0.95)", color: "#fff", font: "600 26px/1.3 system-ui", zIndex: 10 }}>
          ⚠ {w.text}
        </div>
      ))}
    </div>
  );
}
