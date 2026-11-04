import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { canUseStudio } from "@/lib/studio";
import { libraryWithDecisions, sourceKey } from "@/lib/ui-sources";
import { screenList } from "@/content/screens";
import { byMainNode, type UiKind } from "@/ui/registry";
import type { Node } from "@/ui/types";
import { Nav } from "../../Nav";
import { PageHero } from "../../PageHero";
import { SourceDecision } from "./SourceDecision";

/** Which screens use each registry entry (from the screen trees). */
function usage() {
  const out = new Map<string, Set<string>>();
  const walk = (n: Node, screen: string) => { (out.get(n.component) ?? out.set(n.component, new Set()).get(n.component)!).add(screen); n.children?.forEach((c) => walk(c, screen)); };
  for (const s of screenList()) walk(s.tree, s.title);
  return out;
}

/** Which source each audited frame hit, from the raw captures (main-component node → source). */
function sourceHits() {
  const hits = new Map<string, Set<string>>(); // `${id}|${sourceKey}` → frame names
  const dir = path.join(process.cwd(), "docs/ui-audits/raw");
  let files: string[] = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".json")); } catch { return hits; }
  for (const f of files) {
    try {
      const raw = JSON.parse(readFileSync(path.join(dir, f), "utf8")) as { name: string; suggestions: { mainComponentNodeId: string }[] };
      for (const s of raw.suggestions) {
        const id = byMainNode(s.mainComponentNodeId); if (!id) continue;
        hits.set(`${id}|${s.mainComponentNodeId}`, (hits.get(`${id}|${s.mainComponentNodeId}`) ?? new Set()).add(raw.name));
      }
    } catch { /* a bad capture doesn't break the page */ }
  }
  return hits;
}

const KIND: Record<UiKind, string> = { component: "Components", pattern: "Patterns", device: "Device chrome" };

/**
 * UI library: every coded entry with all the Figma sources it has been matched to, side by side, which screens use
 * it and which frames hit which source, and the decision: canonical, candidate, retired. Deciding rebuilds nothing;
 * it changes what the audit recommends and where Code Connect should point.
 */
export default async function UiLibraryPage() {
  const user = await requireUser("/ui/library");
  if (!canUseStudio(user)) notFound();
  const lib = await libraryWithDecisions();
  const used = usage();
  const hits = sourceHits();
  const canSave = hasDb();
  return (
    <main className="shell">
      <Nav on="ui" user={user} />
      <p className="crumb"><Link href="/ui">← UI</Link></p>
      <PageHero title="UI library">One component per real thing, whatever Figma library it came from.</PageHero>
      <p className="muted" style={{ maxWidth: 720 }}>Each entry keeps every Figma source it has been matched to. Pick the canonical one here once you know which is current; retire the ones that aren&apos;t. Deciding rebuilds nothing: it changes what the audit recommends and where Code Connect should point. The audit flags a component as “undecided” while it has candidates.</p>
      {!canSave && <p className="muted">No database here, so decisions can&apos;t be saved; the declared statuses are shown.</p>}
      {(["component", "pattern", "device"] as UiKind[]).map((kind) => (
        <section key={kind}>
          <h2>{KIND[kind]}</h2>
          {Object.entries(lib).filter(([, e]) => e.kind === kind).map(([id, e]) => {
            const undecided = e.figma.sources.filter((s) => s.status === "candidate").length;
            return (
              <article key={id} className="card" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "baseline" }}>
                  <h3 style={{ margin: 0 }}>{e.name} <code className="muted" style={{ fontWeight: 400 }}>{id}</code></h3>
                  <span className="muted">
                    {used.get(id)?.size ? `on ${[...used.get(id)!].join(", ")}` : "not placed directly on a screen (may be used inside a pattern)"}
                    {e.figma.variants?.length ? ` · ${e.figma.variants.join(" × ")}` : ""}
                    {undecided ? ` · ${undecided} undecided` : ""}
                  </span>
                </div>
                <table className="table" style={{ marginTop: 12, width: "100%" }}>
                  <thead><tr><th>Status</th><th>Figma source</th><th>Identity</th><th>Seen on</th><th>Note</th><th></th></tr></thead>
                  <tbody>
                    {e.figma.sources.map((s) => {
                      const key = sourceKey(s);
                      const seen = [...(hits.get(`${id}|${s.mainNode ?? ""}`) ?? [])];
                      return (
                        <tr key={key} style={{ opacity: s.status === "retired" ? 0.55 : 1 }}>
                          <td><strong>{s.status}</strong></td>
                          <td>{s.set}<div className="muted" style={{ fontSize: 13 }}>{s.library}{s.updatedAt ? ` · ${s.updatedAt}` : ""}</div></td>
                          <td className="muted" style={{ fontSize: 13 }}>
                            {s.setKey && <div>set {s.setKey.slice(0, 10)}…</div>}
                            {s.libraryNode && <div>library node {s.libraryNode}</div>}
                            {s.mainNode && <div>main node {s.mainNode}</div>}
                          </td>
                          <td className="muted" style={{ fontSize: 13 }}>{seen.length ? seen.join(", ") : "—"}</td>
                          <td className="muted" style={{ fontSize: 13, maxWidth: 260 }}>{s.note}</td>
                          <td><SourceDecision component={id} source={key} status={s.status} canSave={canSave} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </article>
            );
          })}
        </section>
      ))}
    </main>
  );
}
