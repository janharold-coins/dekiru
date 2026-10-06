import { Bullets, PriceChip, SectionHeader, TierChip, type Chip, type Tier } from "../components/ProductParts";
import { t, keepBreaks } from "../tokens";
import type { PatternMeta } from "../types";

export interface Pricing {
  kind: "chips" | "text" | "chips+text" | "tiers";
  chips?: Chip[]; text?: string | null; subtext?: string | null; tiers?: Tier[];
}
export interface ProductDetailProps {
  product?: string;
  eyebrow: string; title: string; tagline: string; description: string;
  whoLabel: string; who: string;
  whatLabel: string; what: string[];
  keyApisLabel?: string | null; keyApis: string[];
  pricingLabel: string; pricing: Pricing;
}

export const productDetailMeta: PatternMeta = {
  id: "product-detail", name: "Product detail", shape: "set",
  description: "Name, tagline and audience left; 'What it is' and a boxed 'Key APIs' card right; pricing chips bottom-right. Tiered-pricing variant for VIP tables.",
  defaultChrome: { background: "light", overlay: false, logo: "dark", footer: "top-right", accentBar: true },
  budgets: [
    { slot: "title", maxChars: 22, maxLines: 1 }, { slot: "tagline", maxChars: 55, maxLines: 2 },
    { slot: "description", maxChars: 150, maxLines: 3 }, { slot: "who", maxChars: 160, maxLines: 4 },
    { slot: "what", maxItems: 3 }, { slot: "what.item", maxChars: 85, maxLines: 3 },
    { slot: "keyApis", maxItems: 4 }, { slot: "keyApis.item", maxChars: 50, maxLines: 2 },
    { slot: "pricing.chips", maxItems: 3 }, { slot: "pricing.tiers", maxItems: 5 },
  ],
};

function Head({ eyebrow, title, tagline, description }: ProductDetailProps) {
  return (
    <div style={{ width: 733, display: "flex", flexDirection: "column", gap: 11 }}>
      <span style={t(28, 1.15, -0.84, 700, "#545454")}>{eyebrow}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={t(60, 1.15, -1.8, 700)}>{title}</span>
        <span style={{ ...t(40, 1.4, -1.2, 400), ...keepBreaks }}>{tagline}</span>
        <span style={{ ...t(28, 1.4, -0.42, 500, "#606060"), ...keepBreaks }}>{description}</span>
      </div>
    </div>
  );
}

function Who({ whoLabel, who }: ProductDetailProps) {
  return (
    <div style={{ width: 751, display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={t(36, 1.4, -1.08, 700)}>{whoLabel}</span>
      <span style={{ ...t(40, 1.6, -1.2, 400), ...keepBreaks }}>{who}</span>
    </div>
  );
}

export function ProductDetail(p: ProductDetailProps) {
  if (p.pricing.kind === "tiers") return <ProductDetailTiers {...p} />;
  const { pricing } = p;
  const pricingText = pricing.text && (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
      <span style={t(24, 1.4, -0.72, 500)}>{pricing.text}</span>
      {pricing.subtext && <span style={t(20, 1.4, -0.6, 500, "#898989")}>{pricing.subtext}</span>}
    </div>
  );
  return (
    <>
      <div style={{ position: "absolute", left: 79, top: 229, width: 751, display: "flex", flexDirection: "column", gap: 80 }}>
        <Head {...p} />
        <Who {...p} />
      </div>
      <div style={{ position: "absolute", left: 903, top: 336, width: 940, display: "flex", gap: 60, alignItems: "flex-start" }}>
        <div style={{ width: 420, display: "flex", flexDirection: "column", gap: 24, padding: "36px 0" }}>
          <SectionHeader label={p.whatLabel} />
          <Bullets items={p.what} />
        </div>
        {p.keyApis.length > 0 && (
          <div style={{ width: 460, boxSizing: "border-box", border: "1px solid #000", borderRadius: 12, padding: "35px 23px", display: "flex", flexDirection: "column", gap: 24 }}>
            <SectionHeader label={p.keyApisLabel ?? "Key APIs"} />
            <Bullets items={p.keyApis} />
          </div>
        )}
      </div>
      <div style={{ position: "absolute", right: 77, bottom: 92, display: "flex", gap: 36, alignItems: "center", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
        <span style={t(36, 1.4, 1.08, 700)}>{p.pricingLabel}</span>
        {pricing.chips && pricing.chips.length > 0 && (
          <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
            {pricing.chips.map((c, i) => <PriceChip key={i} c={c} />)}
          </div>
        )}
        {pricingText}
      </div>
    </>
  );
}

/** Variant used by Order Book: audience in the middle, "What it is" right, VIP tier row along the bottom. */
function ProductDetailTiers(p: ProductDetailProps) {
  const tiers = p.pricing.tiers ?? [];
  return (
    <>
      <div style={{ position: "absolute", left: 79, top: 305 }}>
        <Head {...p} />
      </div>
      <div style={{ position: "absolute", left: 717, top: 321 }}>
        <Who {...p} />
      </div>
      <div style={{ position: "absolute", left: 1458, top: 285, width: 420, display: "flex", flexDirection: "column", gap: 24, padding: "36px 0" }}>
        <SectionHeader label={p.whatLabel} />
        <Bullets items={p.what} lineHeight={1.5} />
      </div>
      <div style={{ position: "absolute", left: 79, top: 735, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
        <span style={t(36, 1.4, 1.08, 700)}>{p.pricingLabel}</span>
        <div style={{ display: "flex", gap: 48, alignItems: "flex-start" }}>
          {tiers.map((tier, i) => <TierChip key={i} tier={tier} index={i} count={tiers.length} />)}
        </div>
      </div>
    </>
  );
}
