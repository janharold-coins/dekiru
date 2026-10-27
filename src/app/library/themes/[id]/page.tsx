import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canEditThemes, themeForEditor, themeHistory, themeUsage } from "@/lib/themes";
import { DEFAULT_THEME_ID } from "@/deck/theme";
import { hasDb } from "@/db/client";
import { Nav } from "../../../Nav";
import { when } from "../../../decks/[id]/Report";
import { restoreThemeAction } from "../actions";
import { layoutSamples } from "../samples";
import { ThemeEditor } from "./ThemeEditor";

/** Edit a theme with a live preview of every layout. Saves to a draft; publishing updates every deck using it. */
export default async function ThemeEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/library/themes/${id}`);
  if (!canEditThemes(user) || !hasDb()) notFound();
  const theme = await themeForEditor(id);
  if (!theme) notFound();
  const [history, usage, samples] = await Promise.all([themeHistory(id), themeUsage(), layoutSamples(user?.id ?? null)]);
  const live = history.find((v) => v.status === "published")?.number;
  return (
    <main className="shell">
      <Nav on="library" user={user} />
      <p className="crumb"><Link href="/library/themes">← Themes</Link></p>
      <h1 className="page">{theme.name}</h1>
      {error && <p className="signin-error" role="alert">{error}</p>}
      <ThemeEditor
        id={id} name={theme.name} tokens={theme.tokens} live={theme.publishedTokens} hasDraft={theme.hasDraft}
        samples={samples} canArchive={id !== DEFAULT_THEME_ID && !usage[id]}
      />
      <h2 className="section-h">History</h2>
      <table className="links" style={{ maxWidth: 980 }}>
        <thead><tr><th>Version</th><th>What changed</th><th>By</th><th>When</th><th /></tr></thead>
        <tbody>
          {history.map((v) => (
            <tr key={v.number}>
              <td>v{v.number} {v.status === "draft" ? <span className="tag warn">draft</span> : v.number === live ? <span className="tag">live</span> : null}</td>
              <td>{v.note ?? "—"}</td>
              <td>{(v.status === "published" ? v.publishedBy ?? v.createdBy : v.createdBy) ?? <span className="mono">system</span>}</td>
              <td>{when(v.publishedAt ?? v.createdAt)}</td>
              <td>
                {v.status === "published" && v.number !== live && (
                  <form action={restoreThemeAction.bind(null, id, v.number)}><button className="btn" type="submit">Restore</button></form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
