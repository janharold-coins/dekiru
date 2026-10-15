import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import { patterns } from "@/deck/registry";
import { deckFor } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { canEditThemes, publishedThemes } from "@/lib/themes";
import { Nav } from "../../../Nav";
import { themeAction } from "../actions";

/**
 * Pick the deck's theme. Every slide in the deck takes it, approved slides from other decks included.
 * The switch saves to the draft; publish to make it live. History can bring an earlier theme back.
 */
export default async function DeckThemePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/decks/${id}/theme`);
  const found = await deckFor(id, user);
  if (!found) notFound();
  if (!found.canEdit) redirect(`/decks/${id}`);
  const { deck } = found;
  const themes = await publishedThemes();
  const shown = deck.slides.filter((s) => !s.hidden);
  // A dark, a light and a closing slide from this deck, so each theme is judged on real content.
  const samples = [
    shown[0],
    shown.find((s) => (s.chrome?.background ?? patterns[s.pattern]?.meta.defaultChrome.background) === "light"),
    shown.at(-1),
  ].filter((s, i, a): s is NonNullable<typeof s> => Boolean(s) && a.indexOf(s) === i);
  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <p className="mono" style={{ margin: "0 0 4px" }}><Link href={`/decks/${id}`}>← {deck.title}</Link></p>
      <h1 className="page">Theme</h1>
      <p className="lede">
        The theme sets the look of every slide in this deck, including approved slides from other decks.
        Switching saves to the draft: review it, then publish. Links you already sent keep their look.
        {canEditThemes(user) && <> To change a theme itself, go to <Link href="/library/themes">Library → Themes</Link>.</>}
      </p>
      {error && <p className="signin-error" role="alert">{error}</p>}
      <div className="theme-list">
        {themes.map((t) => {
          const current = t.id === deck.theme.id;
          return (
            <section key={t.id} className={`theme-row${current ? " on" : ""}`}>
              <header>
                <b>{t.name}</b>
                {current && <span className="tag">current</span>}
                <span className="spacer" style={{ flex: 1 }} />
                {!current && (
                  <form action={themeAction.bind(null, id, t.id)}>
                    <button className="btn primary" type="submit">Use this theme</button>
                  </form>
                )}
              </header>
              <ThemeScope tokens={t.tokens}>
                <div className="theme-strip">
                  {samples.map((s) => <div key={s.id} className="frame"><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></div>)}
                </div>
              </ThemeScope>
            </section>
          );
        })}
      </div>
    </main>
  );
}
