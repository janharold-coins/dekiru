import { redirect } from "next/navigation";
import { templates } from "@/content/templates";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { patternOrder, patterns } from "@/deck/registry";
import { requireUser } from "@/lib/auth";
import { coverBase, EditError, newDeck, type SlideInput } from "@/lib/editing";
import { publishedThemes } from "@/lib/themes";
import type { PickerItem } from "../decks/BlockPicker";
import { blockGroups } from "../decks/blocks";
import { ViewAsBanner } from "../view-as/ViewAs";
import { NewDeckBuilder, type NewDeckOptions } from "./NewDeckBuilder";

const TPL = "tpl:";

/**
 * Create a new deck (Figma "Dekiru" 236:111): name, theme and cover preview on the left; approved slides to pick
 * on the right (Company info, Our products, Templates). Save as draft keeps it unpublished; Publish makes it live.
 */
export default async function NewDeckPage() {
  const user = await requireUser("/new");
  const [groups, themes, cover] = await Promise.all([blockGroups(user, { smart: true, themed: false }), publishedThemes(), coverBase()]);

  // Company info: every non-product slide, by section (empty sections, like Opening once the cover is out, are dropped) (prefixed with the master's name when there are several masters).
  const many = groups.length > 1;
  const company = groups.flatMap((g) => g.sections
    .map((s) => ({ title: many ? `${g.deckTitle} · ${s.title}` : s.title, items: s.items.filter((i) => !i.stack) }))
    .filter((s) => s.items.length));
  const products = groups.flatMap((g) => g.sections.flatMap((s) => s.items.filter((i) => i.stack)));
  // Templates: blank layouts to fill in. Cover and closing are left out (every deck gets its own).
  const tpl: PickerItem[] = [...templates]
    .filter((t) => t.slide.pattern !== "cover" && t.slide.pattern !== "closing")
    .sort((a, b) => patternOrder.indexOf(a.slide.pattern) - patternOrder.indexOf(b.slide.pattern))
    .map((t) => ({
      block: `${TPL}${t.id}`, blocks: [`${TPL}${t.id}`], name: t.name, kind: patterns[t.slide.pattern]?.meta.name ?? t.slide.pattern,
      thumb: <ScaledSlide key={t.id}><RenderSlide slide={t.slide} /></ScaledSlide>,
    }));

  async function create(blocks: string[], title: string, opts: NewDeckOptions) {
    "use server";
    const u = await requireUser("/new");
    const inputs: SlideInput[] = blocks.map((b) => {
      if (!b.startsWith(TPL)) return { block: b };
      const t = templates.find((x) => x.id === b.slice(TPL.length));
      if (!t) throw new EditError(`No template "${b}".`);
      return { pattern: t.slide.pattern, props: t.slide.props, ...(t.slide.chrome ? { chrome: t.slide.chrome } : {}) };
    });
    let id: string;
    try { id = await newDeck(u, title, inputs, "app", { publish: opts.publish, coverTitle: opts.coverTitle, themeId: opts.themeId || null }); }
    catch (e) { return { error: e instanceof EditError ? e.message : (e as Error).message }; }
    redirect(`/decks/${id}`);
  }

  return (
    <>
      {user?.realRole && <ViewAsBanner role={user.role} />}
      <NewDeckBuilder
        company={company} products={products} templates={tpl}
        themes={themes.map((t) => ({ id: t.id, name: t.name, tokens: t.tokens }))}
        cover={cover ?? null}
        onCreate={create}
      />
    </>
  );
}
