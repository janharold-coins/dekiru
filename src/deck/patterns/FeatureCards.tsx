import { t, keepBreaks, noWrap } from "../tokens";
import type { PatternMeta } from "../types";

export interface FeatureCardsProps {
  title: string;
  cards: { number: string; title: string; body: string }[];
  decoration?: "coins" | null;
}

export const featureCardsMeta: PatternMeta = {
  id: "feature-cards", name: "Feature cards", shape: "set",
  description: "Centred title over five staggered numbered cards, with 3D coin decoration.",
  defaultChrome: { background: "light", overlay: true, logo: "dark", footer: "bottom-left", accentBar: false },
  budgets: [{ slot: "cards", maxItems: 5 }, { slot: "card.title", maxChars: 34, maxLines: 3 }, { slot: "card.body", maxChars: 150, maxLines: 8 }],
};

const COINS = {
  back: [
    { file: "/figma/s38/coin-php-4.png", x: 1308, y: 192, size: 293 },
    { file: "/figma/s38/coin-usdc-3.png", x: 1722, y: 577, size: 294 },
    { file: "/figma/s38/coin-thb-6.png", x: -55, y: 152, size: 300 },
  ],
  bottom: { file: "/figma/s38/coin-thb-3.png", x: 436, y: 776, size: 357 },
  top: { file: "/figma/s38/coin-usdt-5.png", x: 810, y: -54, size: 231 },
};

function Coin({ file, x, y, size }: { file: string; x: number; y: number; size: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" src={file} style={{ position: "absolute", left: x, top: y, width: size, height: size }} />;
}

/** The USDT coin sits above the logo — exported so the renderer can paint it after chrome. */
export function FeatureCardsTop({ decoration }: FeatureCardsProps) {
  return decoration === "coins" ? <Coin {...COINS.top} /> : null;
}

export function FeatureCards({ title, cards, decoration }: FeatureCardsProps) {
  const n = cards.length;
  const pitch = 348;
  const startX = 960 - (n * 300 + (n - 1) * 48) / 2;
  return (
    <>
      {decoration === "coins" && <Coin {...COINS.bottom} />}
      <h1 style={{ position: "absolute", left: 0, width: 1920, top: 213, margin: 0, textAlign: "center", ...t(48, 1.4, -1.44, 700), ...noWrap }}>{title}</h1>
      {decoration === "coins" && COINS.back.map((c) => <Coin key={c.file} {...c} />)}
      {cards.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute", left: startX + i * pitch, top: i % 2 === 0 ? 331 : 391, width: 300, height: 475, boxSizing: "border-box",
            border: "1px solid #000", borderRadius: 8, padding: "60px 30px 30px", display: "flex", flexDirection: "column", gap: 36,
            backgroundImage: "linear-gradient(123.1447deg, #ffffff 50%, #fbfbfb 94.311%)", filter: "drop-shadow(0 0 6px rgba(0,0,0,0.12))",
          }}
        >
          <span style={{ position: "absolute", right: 19, top: 7, ...t(24, 1.4, -0.24, 500, "#efa023", "everett") }}>{c.number}</span>
          <span style={{ minHeight: 134.4, ...t(32, 1.4, -0.8, 500), ...keepBreaks }}>{c.title}</span>
          <span style={{ ...t(20, 1.4, -0.2, 500, "#3d3d3d"), ...keepBreaks }}>{c.body}</span>
        </div>
      ))}
    </>
  );
}
