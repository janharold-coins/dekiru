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

/** Pillars stack top-down. The original 5/1/2 split keeps its exact Figma positions; any other split is centred with 48px between pillars. */
export function ProductIndex({ titleRuns, subtitle, pillars }: ProductIndexProps) {
  const FIGMA_TOPS = [182, 596, 778];
  const useFigma = pillars.length === 3 && pillars.map((p) => p.products.length).join() === "5,1,2";
  // Pillar height: header 46 + 30 gap + rows on a 57.6 pitch (33.6 row + 24 gap).
  const heights = pillars.map((p) => 76 + p.products.length * 57.6 - 24);
  const GAP = 48;
  const total = heights.reduce((a, h) => a + h, 0) + GAP * (pillars.length - 1);
  const start = 540 - total / 2; // centred on the slide, like Figma's 7-product frame (797:33192)
  const tops = useFigma
    ? FIGMA_TOPS
    : heights.map((_, i) => start + heights.slice(0, i).reduce((a, h) => a + h, 0) + GAP * i);

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
