import Link from "next/link";
import { templates } from "@/content/templates";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { patternOrder, patterns } from "@/deck/registry";
import { themeStyle } from "@/deck/theme";
import { editableDecks } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { canEditThemes } from "@/lib/themes";
import { Nav } from "../../Nav";
import { blockGroups } from "../../decks/blocks";
import { LibraryTabs } from "../Tabs";

/** Templates: approved slides with placeholder words, in deck order. Each opens in the slide form. */
export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ deck?: string }> }) {
  const { deck } = await searchParams;
  const user = await requireUser("/library/templates");
  // Opened from a deck: show the templates in that deck's theme, since that's how they'll look there.
  const target = deck ? (await editableDecks(user)).find((t) => t.id === deck) : undefined;
  const approved = (await blockGroups(user)).reduce((n, g) => n + g.sections.reduce((m, s) => m + s.items.length, 0), 0);
  const ordered = [...templates].sort((a, b) => patternOrder.indexOf(a.slide.pattern) - patternOrder.indexOf(b.slide.pattern));
  const q = deck ? `?deck=${encodeURIComponent(deck)}` : "";
  return (
    <main className="shell" style={themeStyle(target?.theme)}>
      <Nav on="library" user={user} />
      <h1 className="page">Library</h1>
      <LibraryTabs on="templates" counts={{ approved, templates: templates.length }} deck={deck} themes={canEditThemes(user)} />
      <p className="lede">
        Approved layouts with placeholder words. Open one, write your own content with a live preview, and add it to a deck.
        Dekiru flags text that runs over a layout&apos;s budget; it never shrinks the type.
        {target && <> Shown in the theme of <b>{target.title}</b>, where they&apos;ll go.</>}
      </p>
      <div className="tpl-grid">
        {ordered.map((t) => (
          <Link key={t.id} href={`/library/templates/${t.id}${q}`} className="card tpl">
            <span className="frame"><ScaledSlide><RenderSlide slide={t.slide} /></ScaledSlide></span>
            <span className="meta">
              <b>{t.name}</b>
              <span>{t.use}</span>
              <span className="mono">{patterns[t.slide.pattern]?.meta.name} layout</span>
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
