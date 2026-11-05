import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import type { SlideData } from "@/deck/types";
import type { Proposal } from "@/studio/proposals";
import { PatternFrame } from "./PatternPreview";

/** A theme card shows one slide per background role and a content slide, as a 2×2 the size of a layout card. */
export function quadOf(samples: SlideData[]) {
  const pick = (...ids: string[]) => ids.map((id) => samples.find((s) => s.pattern === id)).find(Boolean);
  return [pick("cover"), pick("key-numbers", "agenda"), pick("section"), pick("closing", "cta-contact")].filter((s) => s != null);
}

/** A proposal's 16:9 thumbnail: a layout's first example, a UI pattern's first example, or a theme's 2×2. */
export function ProposalThumb({ p, quad }: { p: Proposal; quad: SlideData[] }) {
  if (p.kind === "layout") return <span className="frame"><ScaledSlide><RenderSlide slide={p.examples[0]} entry={p.entry} /></ScaledSlide></span>;
  if (p.kind === "pattern") return <span className="frame studio-pattern-thumb"><PatternFrame tree={p.examples[0].tree} extra={p.components} still /></span>;
  return (
    <ThemeScope tokens={p.tokens}>
      <span className="frame studio-quad">
        {quad.map((s) => <span key={s.id}><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></span>)}
      </span>
    </ThemeScope>
  );
}

export const kindLabel = (p: Proposal) => (p.remixOf ? "Remix" : p.kind === "theme" ? "Theme" : p.kind === "pattern" ? "UI pattern" : "Layout");
