import { listDecks } from "@/lib/decks";
import { requireUser } from "@/lib/auth";
import { Nav } from "./Nav";
import { HomeDecks, type HomeDeck } from "./HomeDecks";

const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Manila" });

/** Decks home (Figma "Dekiru" 23:496): company decks and the person's own, with search and sort. */
export default async function Home({ searchParams }: PageProps<"/">) {
  const user = await requireUser("/");
  const { tab } = await searchParams;
  const decks = await listDecks({ viewerId: user?.id ?? null, includeArchived: true });
  const canEditMasters = user?.role === "admin" || user?.role === "manager";
  const toCard = (d: (typeof decks)[number]): HomeDeck => ({
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
        company={decks.filter((d) => d.kind === "master" && !d.archivedAt).map(toCard)}
        mine={decks.filter((d) => d.kind !== "master").map(toCard)}
        initialTab={tab === "mine" ? "mine" : "company"}
      />
    </div>
  );
}
