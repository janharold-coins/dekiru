import Link from "next/link";
import { notFound } from "next/navigation";
import { PRESET_KINDS } from "@/deck/presets";
import { DEFAULT_THEME_ID } from "@/deck/theme";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { DEFAULT_PRESETS, canEditPresets, presetForEditor, presetHistory, presetUsage } from "@/lib/presets";
import { publishedThemes } from "@/lib/themes";
import { Nav } from "../../../Nav";
import { when } from "../../../decks/[id]/Report";
import { restorePresetAction } from "../actions";
import { layoutSamples } from "../../../library/themes/samples";
import { PresetEditor } from "./PresetEditor";

/** Edit a design token set with a live preview of every layout. Saves to a draft; publishing updates every deck using it. */
export default async function PresetEditorPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const user = await requireUser(`/studio/tokens/${id}`);
  if (!canEditPresets(user) || !hasDb()) notFound();
  const preset = await presetForEditor(id);
  if (!preset) notFound();
  const [history, usage, samples, themes] = await Promise.all([presetHistory(id), presetUsage(), layoutSamples(user?.id ?? null), publishedThemes()]);
  const live = history.find((v) => v.status === "published")?.number;
  const kind = PRESET_KINDS.find((k) => k.id === preset.kind)!;
  // The default theme first: it's what most decks use.
  const ordered = [...themes].sort((a, b) => Number(b.id === DEFAULT_THEME_ID) - Number(a.id === DEFAULT_THEME_ID));
  return (
    <main className="shell">
      <Nav on="library" user={user} />
      <p className="crumb"><Link href="/studio?show=tokens">← Design tokens</Link></p>
      <h1 className="page">{preset.name}</h1>
      <p className="page-meta">Design tokens · {preset.kind === "typography" ? "Typography" : "Colour"} set · {kind.use}, on top of any theme</p>
      {error && <p className="signin-error" role="alert">{error}</p>}
      <PresetEditor
        id={id} kind={preset.kind} name={preset.name} tokens={preset.tokens} live={preset.publishedTokens} hasDraft={preset.hasDraft}
        samples={samples} themes={ordered.map((t) => ({ id: t.id, name: t.name, tokens: t.tokens }))} usedBy={DEFAULT_PRESETS.some((p) => p.id === id) ? null : usage[id] ?? 0}
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
                  <form action={restorePresetAction.bind(null, id, v.number)}><button className="btn" type="submit">Restore</button></form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
