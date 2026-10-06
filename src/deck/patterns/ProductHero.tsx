import { t, keepBreaks } from "../tokens";
import type { PatternMeta } from "../types";

export interface ProductHeroProps {
  product?: string;
  eyebrow: string;
  title: string;
  tagline: string;
  image: { src: string; variant: "mockup" | "photo"; x: number; y: number; w: number; h: number };
}

export const productHeroMeta: PatternMeta = {
  id: "product-hero", name: "Product hero", shape: "statement",
  description: "Eyebrow, product name and tagline left; one large visual right (mockup or full-height photo).",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "bottom-left", accentBar: true },
  budgets: [{ slot: "title", maxChars: 22, maxLines: 1 }, { slot: "tagline", maxChars: 55, maxLines: 2 }],
};

/** Default slot for a new image when no Figma geometry exists. */
export const DEFAULT_HERO_SLOT = { mockup: { x: 794, y: 97, w: 1126, h: 972 }, photo: { x: 711, y: 0, w: 1209, h: 1080 } };

export function ProductHero({ eyebrow, title, tagline, image }: ProductHeroProps) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={image.src}
        data-slot={`hero-${image.variant}`}
        data-slot-size={`${Math.round(image.w)} × ${Math.round(image.h)}`}
        style={{ position: "absolute", left: image.x, top: image.y, width: image.w, height: image.h, objectFit: "cover" }}
      />
      <div style={{ position: "absolute", left: 79, top: 540, transform: "translateY(-50%)", maxWidth: 751, display: "flex", flexDirection: "column", gap: 11 }}>
        <span style={t(28, 1.15, -0.84, 700, "#545454")}>{eyebrow}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={t(60, 1.15, -1.8, 700)}>{title}</span>
          <span style={{ ...t(40, 1.4, -1.2, 400), ...keepBreaks }}>{tagline}</span>
        </div>
      </div>
    </>
  );
}
