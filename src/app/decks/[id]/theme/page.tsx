import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { ThemeScope } from "@/deck/ThemeScope";
import { patterns } from "@/deck/registry";
import { deckFor } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { PRESET_KINDS } from "@/deck/presets";
import { PresetSummary } from "../../../studio/tokens/PresetSummary";
import { publishedPresets, withPresets, type PresetInfo } from "@/lib/presets";
import { publishedThemes } from "@/lib/themes";
import { Nav } from "../../../Nav";
import { presetAction, themeAction } from "../actions";

/**
 * Pick the deck's theme. Every slide in the deck takes it, approved slides from other decks included.
 * The switch saves to the draft; publish to make it live. History can bring an earlier theme back.
 *
 * Below the themes: typography and colour presets, applied on top of whichever theme the deck uses. Every
 * preview shows the deck's real slides with the deck's other choices kept, so each option is judged as it would look.
 */
export default async function DeckThemePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/decks/${id}/theme`);
  const found = await deckFor(id, user);
  if (!found) notFound();
  if (!found.canEdit) redirect(`/decks/${id}`);
  const { deck } = found;
  const [themes, presetList] = await Promise.all([publishedThemes(), publishedPresets()]);
  const baseTheme = themes.find((t) => t.id === deck.theme.id) ?? deck.theme;
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
      <p className="crumb"><Link href={`/decks/${id}`}>← {deck.title}</Link></p>
      <h1 className="page">Theme</h1>
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
              <ThemeScope tokens={withPresets(t, deck.presets, presetList).tokens}>
                <div className="theme-strip">
                  {samples.map((s) => <div key={s.id} className="frame"><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></div>)}
                </div>
              </ThemeScope>
            </section>
          );
        })}
      </div>

      {PRESET_KINDS.map((kind) => {
        const options = presetList.filter((p) => p.kind === kind.id);
        const chosen = options.find((p) => p.id === deck.presets[kind.id])?.id ?? null;
        const rows: (PresetInfo | null)[] = [null, ...options];
        return (
          <section key={kind.id} id={kind.id}>
            <h2 className="section-h">{kind.name}</h2>
            <p className="hint">{kind.use}, on top of the theme. The theme itself doesn&apos;t change.</p>
            {!options.length ? (
              <p className="muted">No {kind.name.toLowerCase()} sets yet. Studio reviewers add them under Design tokens.</p>
            ) : (
              <div className="theme-list">
                {rows.map((p) => {
                  const current = (p?.id ?? null) === chosen;
                  const look = withPresets(baseTheme, { ...deck.presets, [kind.id]: p?.id }, presetList);
                  return (
                    <section key={p?.id ?? "none"} className={`theme-row${current ? " on" : ""}`}>
                      <header>
                        <b>{p ? p.name : "Theme's own"}</b>
                        {p && <PresetSummary kind={kind.id} tokens={p.tokens} />}
                        {current && <span className="tag">current</span>}
                        <span className="spacer" style={{ flex: 1 }} />
                        {!current && (
                          <form action={presetAction.bind(null, id, kind.id, p?.id ?? null)}>
                            <button className="btn primary" type="submit">{p ? "Use this" : "Use the theme's own"}</button>
                          </form>
                        )}
                      </header>
                      <ThemeScope tokens={look.tokens}>
                        <div className="theme-strip">
                          {samples.map((s) => <div key={s.id} className="frame"><ScaledSlide><RenderSlide slide={s} /></ScaledSlide></div>)}
                        </div>
                      </ThemeScope>
                    </section>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
