import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import type { SlideData } from "@/deck/types";
import { proposal, type Proposal } from "@/studio/proposals";
import { getTemplate } from "@/content/templates";
import type { ThemeInfo } from "@/lib/themes";
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

/** What an unbuilt remix starts from, as a card thumbnail: the template, the theme (2×2) or the approved proposal. */
export function SourceThumb({ of, quad, themes }: { of: string; quad: SlideData[]; themes: ThemeInfo[] }) {
  const [type, id] = of.includes(":") ? of.split(":", 2) : ["proposal", of];
  const tokens = type === "theme" ? themes.find((t) => t.id === id)?.tokens : type === "proposal" ? (proposal(id)?.kind === "theme" ? (proposal(id) as { tokens: ThemeInfo["tokens"] }).tokens : undefined) : undefined;
  if (tokens) {
    return (
      <ThemeScope tokens={tokens}>
        <span className="frame studio-quad">{quad.map((s) => <span key={s.id}><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></span>)}</span>
      </ThemeScope>
    );
  }
  const p = type === "proposal" ? proposal(id) : undefined;
  const slide = type === "template" ? getTemplate(id)?.slide : p?.kind === "layout" ? p.examples[0] : undefined;
  return <span className="frame">{slide && <ScaledSlide><RenderSlide slide={slide} entry={p?.kind === "layout" ? p.entry : undefined} /></ScaledSlide>}</span>;
}
