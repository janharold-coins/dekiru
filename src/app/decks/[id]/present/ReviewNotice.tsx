"use client";
import { LANGUAGES, type Lang } from "@/deck/i18n";

/**
 * Floating "Not yet reviewed" over a presented deck (spec §7a). Team members see it for the English
 * content; everyone, recipients included, sees it for an unreviewed translation.
 */
export function ReviewNotice({ approved, lang, team }: { approved: string[]; lang: Lang; team: boolean }) {
  const content = !approved.includes("en") && team;
  const translation = lang !== "en" && !approved.includes(lang);
  if (!content && !translation) return null;
  const text = translation
    ? `${LANGUAGES[lang].english} translation not yet reviewed`
    : "Not yet reviewed";
  const title = translation
    ? "This translation was made with Claude and hasn't been approved by a reviewer yet."
    : "This version of the deck hasn't been approved by reviewers yet.";
  return <div className="review-notice" role="status" title={title}><i aria-hidden />{text}</div>;
}
