import type { ReactNode } from "react";
import { getTemplate } from "@/content/templates";
import { patterns } from "@/deck/registry";
import { RenderSlide } from "@/deck/RenderSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import { decisionsOf } from "@/lib/studio";
import { publishedThemes } from "@/lib/themes";
import { proposal, type Proposal } from "@/studio/proposals";
import { layoutSamples } from "../library/themes/samples";
import type { ThreadItem } from "./PromptPanel";

/** Slides for the remix editor's canvas, rendered here (Studio layouts aren't in the registry yet), with labels. */
export interface CanvasSlides { slides: ReactNode[]; labels: string[] }

/** A proposal's examples (layout), or every master layout in its tokens (theme). */
export async function proposalSlides(p: Proposal, viewerId: string | null): Promise<CanvasSlides> {
  if (p.kind === "layout") {
    return {
      slides: p.examples.map((s) => <RenderSlide key={s.id} slide={s} entry={p.entry} />),
      labels: p.examples.map((_, i) => `Example ${i + 1} · ${p.entry.meta.name} layout`),
    };
  }
  if (p.kind === "pattern") return { slides: [], labels: [] }; // not remixable; never opens in the remix editor
  return themeSlides(p.tokens, viewerId);
}

async function themeSlides(tokens: Parameters<typeof ThemeScope>[0]["tokens"], viewerId: string | null): Promise<CanvasSlides> {
  const samples = await layoutSamples(viewerId);
  return {
    slides: samples.map((s) => <ThemeScope key={s.id} tokens={tokens}><RenderSlide slide={s} /></ThemeScope>),
    labels: samples.map((s) => `${patterns[s.pattern]?.meta.name ?? s.pattern} layout`),
  };
}

/** What a remix starts from, before Claude has built the variant: the template, theme or approved proposal. */
export async function sourceSlides(ref: string, viewerId: string | null): Promise<CanvasSlides> {
  const [type, id] = ref.includes(":") ? ref.split(":", 2) : ["proposal", ref];
  if (type === "template") {
    const t = getTemplate(id);
    return t ? { slides: [<RenderSlide key={t.id} slide={t.slide} />], labels: [`${t.name} template · as it is now`] } : { slides: [], labels: [] };
  }
  if (type === "theme") {
    const t = (await publishedThemes()).find((x) => x.id === id);
    return themeSlides(t?.tokens, viewerId);
  }
  const p = proposal(id);
  return p ? proposalSlides(p, viewerId) : { slides: [], labels: [] };
}

type Row = Awaited<ReturnType<typeof decisionsOf>>[number];
const item = (d: Row): ThreadItem => ({
  id: d.id, who: "person", by: d.by, text: d.decision === "submitted" ? "Sent for review." : d.note ?? "", images: d.images, at: d.createdAt.toISOString(),
});

/**
 * The remix prompts: the first prompt (the request), later prompts, and each revision Claude built, in order.
 * Prompts carry the revision they were made on, so revision n sits before the prompts made on it.
 */
export async function remixThread(first: { id: string; prompt: string; author?: string | null; createdAt: Date } | null, p?: Proposal): Promise<ThreadItem[]> {
  const rows = [
    ...(first ? await decisionsOf(`request:${first.id}`) : []),
    ...(p ? await decisionsOf(p.id) : []),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const out: ThreadItem[] = first ? [{ id: first.id, who: "person", by: first.author, text: first.prompt, images: [], at: first.createdAt.toISOString() }] : [];
  out.push(...rows.filter((r) => r.revision === 0).map(item));
  for (let rev = 1; p && rev <= p.revision; rev++) {
    out.push({ id: `rev-${rev}`, who: "claude", text: rev === p.revision && p.changes && rev > 1 ? `Revision ${rev}: ${p.changes}` : `Revision ${rev} is ready.`, images: [] });
    out.push(...rows.filter((r) => r.revision === rev).map(item));
  }
  return out;
}
