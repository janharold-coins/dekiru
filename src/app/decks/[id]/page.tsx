import { notFound, redirect } from "next/navigation";
import { patterns } from "@/deck/registry";
import { canEdit, deckFor, deckRow, renamedDeckId } from "@/lib/access";
import { canReview, reviewState, type ReviewSummary } from "@/lib/reviews";
import { asLang, TARGET_LANGS, type Lang } from "@/deck/i18n";
import { db, hasDb } from "@/db/client";
import { users } from "@/db/schema";
import { inArray } from "drizzle-orm";
import type { ReviewProps } from "./edit/Review";
import { requireUser } from "@/lib/auth";
import { publishedThemes } from "@/lib/themes";
import { ViewAsBanner } from "../../view-as/ViewAs";
import { slideName } from "./Report";
import { DeckEditor, type EditorSlide } from "./edit/DeckEditor";

/**
 * A deck opens in the editor: slides on the left, the selected slide in the middle, its content on the right.
 * Editors' changes save to the deck's draft as you type; Publish makes them live. People who can't edit
 * the deck (members on company decks) get the same view, read-only, with Present, Share and Make a copy.
 */
export default async function DeckPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ slide?: string; lang?: string }> }) {
  const [{ id }, { slide, lang }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/decks/${id}`);
  const found = await deckFor(id, user);
  if (!found) {
    // Old readable ids ("sales", "my-deck-37f6") still open: send them to the deck's "dk-…" id.
    const renamed = await renamedDeckId(id);
    if (renamed) redirect(`/decks/${renamed}${slide ? `?slide=${encodeURIComponent(slide)}` : ""}`);
    notFound();
  }
  const { deck } = found;
  const themes = await publishedThemes();
  const review = await reviewProps(id, user);

  // Section each slide sits in (the latest section divider before it), and where approved slides come from.
  const masters = new Map<string, string>();
  for (const s of deck.slides) {
    const m = s.ref?.split("/")[0];
    if (m && !masters.has(m)) masters.set(m, (await deckRow(m))?.title ?? m);
  }
  const slides: EditorSlide[] = [];
  let section = "Opening";
  for (const s of deck.slides) {
    if (s.pattern === "section") section = slideName(s);
    slides.push({
      slide: s, name: slideName(s), section, layout: patterns[s.pattern]?.meta.name ?? s.pattern,
      from: s.ref ? { block: s.ref, deck: masters.get(s.ref.split("/")[0]) ?? s.ref } : null,
    });
  }

  return (
    <>
    {user?.realRole && <ViewAsBanner role={user.role} />}
    <DeckEditor
      key={`${deck.versionId}-${deck.status}`}
      deck={{ id: deck.id, title: deck.title, kind: deck.kind, hasDraft: deck.status === "draft", versionNumber: deck.versionNumber ?? null }}
      slides={slides}
      initialSlide={slides.some((s) => s.slide.id === slide) ? slide! : slides[0]?.slide.id ?? null}
      theme={deck.theme}
      themes={themes.map((t) => ({ id: t.id, name: t.name, tokens: t.tokens }))}
      readOnly={!found.canEdit}
      review={review}
      initialLang={asLang(lang)}
    />
    </>
  );
}

/** Review state of the deck plus what this person may do about it, for the editor. */
async function reviewProps(id: string, user: Awaited<ReturnType<typeof requireUser>>): Promise<ReviewProps> {
  const empty: ReviewProps = { content: null, translations: {}, canReview: {}, canSend: false, admin: !user || user.role === "admin", userId: user?.id ?? null, names: {} };
  if (!hasDb()) return empty;
  const row = await deckRow(id);
  if (!row) return empty;
  const state = await reviewState(id);
  const can: Partial<Record<Lang, boolean>> = {};
  const all: ReviewSummary[] = [];
  if (state.content) { all.push(state.content); can.en = state.content.status === "for_review" && canReview(user, { kind: state.content.kind, lang: null, requestedBy: state.content.requestedBy }); }
  for (const l of TARGET_LANGS) {
    const t = state.translations[l];
    if (t) { all.push(t); can[l] = t.status === "for_review" && canReview(user, { kind: "translation", lang: l, requestedBy: t.requestedBy }); }
  }
  const ids = [...new Set(all.flatMap((r) => Object.values(r.slides).flatMap((x) => x.approvers)))];
  const people = ids.length ? await db().select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, ids)) : [];
  return {
    content: state.content, translations: state.translations, canReview: can,
    canSend: canEdit(row, user), admin: empty.admin, userId: empty.userId,
    names: Object.fromEntries(people.map((p) => [p.id, p.name || p.email])),
  };
}
