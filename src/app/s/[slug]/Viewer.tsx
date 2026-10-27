"use client";
import { useState } from "react";
import { RenderSlide } from "@/deck/RenderSlide";
import { asLang, availableLangs, LANGUAGES, type Lang } from "@/deck/i18n";
import type { SlideData } from "@/deck/types";
import { TrackedPresenter } from "../../decks/[id]/present/TrackedPresenter";
import { ReviewNotice } from "../../decks/[id]/present/ReviewNotice";

/**
 * The shared deck with its language selector. Languages are offered only when the link holds a
 * translation for them (translations are frozen with the link, like the slides and the theme).
 * `?lang=zh` on the URL opens the deck in that language; switching updates the URL so the viewer can share it.
 */
export function SharedDeckViewer({ slides, trackUrl, initialLang, approved, team }: {
  slides: SlideData[]; trackUrl: string; initialLang: string; approved: string[]; team: boolean;
}) {
  const langs = availableLangs(slides);
  const [lang, setLang] = useState<Lang>(() => {
    const l = asLang(initialLang);
    return l === "en" || langs.includes(l) ? l : "en";
  });
  const choose = (l: Lang) => {
    setLang(l);
    const url = new URL(window.location.href);
    if (l === "en") url.searchParams.delete("lang"); else url.searchParams.set("lang", l);
    history.replaceState(null, "", url);
  };
  return (
    <>
      <TrackedPresenter
        trackUrl={trackUrl}
        slideIds={slides.map((s) => s.id)}
        slides={slides.map((s) => <RenderSlide key={s.id} slide={s} lang={lang} />)}
        hudExtra={langs.length ? <LanguageSwitch langs={["en", ...langs]} value={lang} onChange={choose} /> : undefined}
      />
      <ReviewNotice approved={approved} lang={lang} team={team} />
    </>
  );
}

/** "English · 中文 · ไทย" in the presenter's bottom bar. */
export function LanguageSwitch({ langs, value, onChange }: { langs: Lang[]; value: Lang; onChange: (l: Lang) => void }) {
  return (
    <span className="langs" role="radiogroup" aria-label="Language">
      {langs.map((l) => (
        <button
          key={l} type="button" role="radio" aria-checked={value === l} lang={l}
          className={value === l ? "on" : undefined}
          onClick={() => onChange(l)}
          title={LANGUAGES[l].english}
        >
          {LANGUAGES[l].name}
        </button>
      ))}
    </span>
  );
}
