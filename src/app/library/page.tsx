import { redirect } from "next/navigation";
import { templates } from "@/content/templates";
import { editableDecks } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { canEditThemes } from "@/lib/themes";
import { EditError, newDeck } from "@/lib/editing";
import { Nav } from "../Nav";
import { BlockPicker } from "../decks/BlockPicker";
import { blockGroups } from "../decks/blocks";
import { addBlocksAction } from "../decks/[id]/actions";
import { LibraryTabs } from "./Tabs";

/** Approved slides: the company masters' real slides. Added slides keep following the master. */
export default async function ApprovedSlidesPage({ searchParams }: { searchParams: Promise<{ deck?: string }> }) {
  const { deck } = await searchParams;
  const user = await requireUser("/library");
  const [groups, targets] = await Promise.all([blockGroups(user), editableDecks(user)]);
  const count = groups.reduce((n, g) => n + g.sections.reduce((m, s) => m + s.items.length, 0), 0);
  async function add(blocks: string[], title: string, target: string) {
    "use server";
    const u = await requireUser("/library");
    if (target) return addBlocksAction(target, blocks);
    let id: string;
    try { id = await newDeck(u, title, blocks.map((block) => ({ block })), "app"); }
    catch (e) { return { error: e instanceof EditError ? e.message : (e as Error).message }; }
    redirect(`/decks/${id}/edit`);
  }
  return (
    <main className="shell">
      <Nav on="library" user={user} />
      <h1 className="page">Library</h1>
      <LibraryTabs on="approved" counts={{ approved: count, templates: templates.length }} deck={deck} themes={canEditThemes(user)} />
      <p className="lede">
        The real slides from the company decks, with approved numbers, pricing and claims. Pick the ones you need, in order.
        They keep following the company deck, so updates reach your deck too. To write your own content, start from a template.
      </p>
      <BlockPicker groups={groups} submitLabel="Add slides" onSubmit={add} targets={targets}
        defaultTarget={deck && targets.some((t) => t.id === deck) ? deck : ""} />
    </main>
  );
}
