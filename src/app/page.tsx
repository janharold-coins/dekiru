import { listDecks } from "@/lib/decks";
import { requireUser } from "@/lib/auth";
import { Nav } from "./Nav";
import { HomeDecks, type HomeDeck } from "./HomeDecks";
import { ALL_SCOPES, hasScope, reviewQueue } from "@/lib/reviews";
import { LANGUAGES } from "@/deck/i18n";

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Manila" });

/** Decks home (Figma "Dekiru" 23:496): company decks and the person's own, with search and sort. */
export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await requireUser("/");
  const { tab } = await searchParams;
  const decks = await listDecks({ viewerId: user?.id ?? null, includeArchived: true });
  const reviewer = ALL_SCOPES.some((s) => hasScope(user, s.scope));
  const queue = reviewer ? await reviewQueue(user) : [];
  // Decks waiting for review may belong to other people, so they aren't in `decks`; load them by id.
  const { getDeck } = await import("@/lib/decks");
  const forReview = (await Promise.all(queue.map(async (q) => {
    const d = decks.find((x) => x.id === q.deckId) ?? (await getDeck(q.deckId));
    if (!d) return null;
    const what = q.kind === "translation" ? `${LANGUAGES[q.lang].english} translation` : q.kind === "company" ? "Company deck" : `Employee deck${q.requestedByName ? ` by ${q.requestedByName}` : ""}`;
    const progress = `${q.summary.level} of ${q.summary.required} approvals · ${q.summary.approvedSlides}/${q.summary.totalSlides} slides`;
    return { deck: d, review: { what, progress, lang: q.lang } };
  }))).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const canEditMasters = user?.role === "admin" || user?.role === "manager";
  const toCard = (d: (typeof decks)[number], review?: HomeDeck["review"]): HomeDeck => ({
    review,
    id: d.id,
    title: d.title,
    kind: d.kind,
    cover: d.slides.find((s) => !s.hidden) ?? d.slides[0],
    tokens: d.theme.tokens,
    slideCount: d.slides.filter((s) => !s.hidden).length,
    updated: d.updatedAt ? d.updatedAt.getTime() : 0,
    updatedLabel: d.updatedAt ? `Last updated ${fmt.format(d.updatedAt)}${d.updatedBy ? ` by ${d.updatedBy}` : ""}` : "",
    // Only people who can edit see that changes are waiting to be published.
    hasDraft: d.hasDraft && (d.kind === "master" ? canEditMasters : d.ownerId === user?.id),
    archived: Boolean(d.archivedAt),
  });
  return (
    <div className="home">
      <Nav on="decks" user={user} />
      <HomeDecks
        company={decks.filter((d) => d.kind === "master" && !d.archivedAt).map((d) => toCard(d))}
        mine={decks.filter((d) => d.kind !== "master").map((d) => toCard(d))}
        review={forReview.map((x) => toCard(x.deck, x.review))}
        reviewer={reviewer}
        initialTab={tab === "mine" ? "mine" : tab === "review" ? "review" : "company"}
      />
    </div>
  );
}
