import Link from "next/link";
import { ThemeScope } from "@/deck/ThemeScope";
import { pickTheme, publishedThemes } from "@/lib/themes";
import { notFound } from "next/navigation";
import { RenderSlide } from "@/deck/RenderSlide";
import { ScaledSlide } from "@/deck/frame/ScaledSlide";
import { patterns } from "@/deck/registry";
import { deckFor } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { EditError, versionSlides } from "@/lib/editing";
import { Nav } from "../../../../Nav";
import { RestoreButton } from "../../DeckActions";
import { slideName, when } from "../../Report";

/** One past version, read-only. Shared slides show as they look today (they follow their master). */
export default async function VersionPage({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = await params;
  const user = await requireUser(`/decks/${id}/history/${n}`);
  const found = await deckFor(id, user);
  const number = Number(n);
  if (!found || !Number.isInteger(number)) notFound();
  let data;
  try { data = await versionSlides(user, id, number); } catch (e) { if (e instanceof EditError) notFound(); throw e; }
  const { version, slides } = data;
  const theme = pickTheme(await publishedThemes(), version.themeId);
  let k = 0;
  return (
    <main className="shell">
      <Nav on="decks" user={user} />
      <p className="mono" style={{ margin: "0 0 4px" }}><Link href={`/decks/${id}/history`}>← Version history</Link></p>
      <div className="row" style={{ marginBottom: 8 }}>
        <h1 className="page" style={{ margin: 0 }}>{found.deck.title} · v{version.number}</h1>
        <span className="spacer" style={{ flex: 1 }} />
        {found.canEdit && version.status === "published" && <RestoreButton deckId={id} number={version.number} />}
      </div>
      <p className="lede">
        {version.status === "draft" ? "Current draft" : `Published ${when(version.publishedAt ?? version.createdAt)}`}
        {version.note ? ` · ${version.note}` : ""} · Theme: {theme.name}. Approved slides that follow a master, and the theme, are shown as they look today.
      </p>
      <ThemeScope tokens={theme.tokens}><div className="grid">
        {slides.map((s) => (
          <div key={s.id} className="card" style={s.hidden ? { opacity: 0.45 } : undefined}>
            <ScaledSlide className="thumb"><RenderSlide slide={s} /></ScaledSlide>
            <div className="meta">
              <b>{s.hidden ? "—" : String(++k).padStart(2, "0")}</b>
              <span>{slideName(s)}</span>
              <span className="spacer" style={{ flex: 1 }} />
              <span className="mono">{patterns[s.pattern]?.meta.name ?? s.pattern}</span>
            </div>
          </div>
        ))}
      </div></ThemeScope>
    </main>
  );
}
