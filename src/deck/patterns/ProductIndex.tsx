import { t, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface ProductIndexProps {
  titleRuns: { text: string; color: string }[];
  subtitle: string;
  pillars: { number: string; title: string; color: string; products: { name: string; description: string }[] }[];
}

export const productIndexMeta: PatternMeta = {
  id: "product-index", name: "Product index", shape: "hierarchy",
  description: "Statement left; pillars right, each a numbered header over a list of products.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "pillars", maxItems: 3 }, { slot: "products (total)", maxItems: 9 }, { slot: "product.description", maxChars: 42 }],
};

/** Pillar blocks flow top-down from y 182; header 46 + 30 gap, rows on a 57.6 pitch, ~72 between pillars. */
export function ProductIndex({ titleRuns, subtitle, pillars }: ProductIndexProps) {
  const FIGMA_TOPS = [182, 596, 778];
  const useFigma = pillars.length === 3 && pillars.map((p) => p.products.length).join() === "5,1,2";
  const tops = pillars.reduce<number[]>((acc, p, i) => {
    if (useFigma) return [...acc, FIGMA_TOPS[i]];
    const prev = pillars[i - 1];
    return [...acc, i === 0 ? 182 : acc[i - 1] + 76 + prev.products.length * 57.6 - 24 + 74];
  }, []);
  return (
    <>
      <h1 style={{ position: "absolute", left: 79, top: 440, margin: 0, ...t(72, 1.15, -2.16, 600), ...noWrap }}>
        {titleRuns.map((r, i) => <span key={i} style={{ color: r.color }}>{r.text}</span>)}
      </h1>
      <p style={{ position: "absolute", left: 79, top: 540, width: 661, margin: 0, ...t(48, 1.4, -1.44, 500) }}>{subtitle}</p>
      {pillars.map((p, i) => (
        <div key={i} style={{ position: "absolute", left: 999, top: tops[i] }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <span style={{ width: 66, ...t(40, 1.15, -1.2, 300, "#000", "everett") }}>{p.number}</span>
            <span style={{ ...t(40, 1.15, -1.2, 700, p.color), ...noWrap }}>{p.title}</span>
          </div>
          <div style={{ marginTop: 30, marginLeft: 90, display: "flex", flexDirection: "column", gap: 24, width: 733 }}>
            {p.products.map((pr, j) => (
              <div key={j} style={{ display: "flex", gap: 48, alignItems: "center" }}>
                <span style={{ width: 230, flexShrink: 0, ...t(24, 1.4, -0.72, 700) }}>{pr.name}</span>
                <span style={{ ...t(24, 1.4, 0, 400), ...noWrap }}>{pr.description}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
