import Link from "next/link";
import { notFound } from "next/navigation";
import { templates } from "@/content/templates";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import { requireUser } from "@/lib/auth";
import { canEditThemes, publishedThemes, themeUsage } from "@/lib/themes";
import { db, hasDb } from "@/db/client";
import { themeVersions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Nav } from "../../Nav";
import { blockGroups, slideCount } from "../../decks/blocks";
import { LibraryTabs } from "../Tabs";
import { NewTheme } from "./NewTheme";
import { glanceSamples, layoutSamples } from "./samples";

/** Themes: the looks decks can use. Admins and people with theme access only. */
export default async function ThemesPage() {
  const user = await requireUser("/library/themes");
  if (!canEditThemes(user) || !hasDb()) notFound();
  const [themes, usage, groups, samples, drafts] = await Promise.all([
    publishedThemes(), themeUsage(), blockGroups(user), layoutSamples(user?.id ?? null),
    db().select({ themeId: themeVersions.themeId }).from(themeVersions).where(eq(themeVersions.status, "draft")),
  ]);
  const approved = slideCount(groups);
  const glance = glanceSamples(samples);
  const drafted = new Set(drafts.map((d) => d.themeId));
  return (
    <main className="shell">
      <Nav on="library" user={user} />
      <div className="page-head">
        <h1 className="page">Library</h1>
        <LibraryTabs on="themes" counts={{ approved, templates: templates.length, themes: themes.length }} themes />
      </div>
      <NewTheme themes={themes.map((t) => ({ id: t.id, name: t.name }))} />
      <div className="theme-list">
        {themes.map((t) => (
          <section key={t.id} className="theme-row">
            <header>
              <b>{t.name}</b>
              {t.version && <span className="mono">v{t.version}</span>}
              {drafted.has(t.id) && <span className="tag warn">draft</span>}
              <span className="mono">· used by {usage[t.id] ?? 0} deck{usage[t.id] === 1 ? "" : "s"}</span>
              <span className="spacer" style={{ flex: 1 }} />
              <Link className="btn" href={`/library/themes/${t.id}`}>Edit</Link>
            </header>
            <ThemeScope tokens={t.tokens}>
              <div className="theme-strip">
                {glance.map((s) => <div key={s.id} className="frame"><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></div>)}
              </div>
            </ThemeScope>
          </section>
        ))}
      </div>
    </main>
  );
}
