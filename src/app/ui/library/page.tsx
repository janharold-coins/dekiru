import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import { hasDb } from "@/db/client";
import { requireUser } from "@/lib/auth";
import { canUseStudio } from "@/lib/studio";
import { libraryWithDecisions, sourceKey } from "@/lib/ui-sources";
import { screenList } from "@/content/screens";
import { byMainNode, ui, type UiKind } from "@/ui/registry";
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

/** Which source each audited frame hit, from the raw captures (main-component node → frame names). */
function sourceHits() {
  const hits = new Map<string, Set<string>>();
  const dir = path.join(process.cwd(), "docs/ui-audits/raw");
  let files: string[] = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".json")); } catch { return hits; }
  for (const f of files) {
    try {
      const raw = JSON.parse(readFileSync(path.join(dir, f), "utf8")) as { name: string; suggestions: { mainComponentNodeId: string }[]; designContext?: string };
      const frame = raw.name.replace(/^KYC - KYB → /, "");
      for (const s of raw.suggestions) {
        const id = byMainNode(s.mainComponentNodeId); if (!id) continue;
        hits.set(`${id}|${s.mainComponentNodeId}`, (hits.get(`${id}|${s.mainComponentNodeId}`) ?? new Set()).add(frame));
      }
      // Instances Code Connect resolved to a Dekiru file (the mapped source is the canonical one at mapping time).
      for (const block of (raw.designContext ?? "").matchAll(/<CodeConnectSnippet[^>]*>([\s\S]*?)<\/CodeConnectSnippet>/g)) {
        for (const tag of block[1].matchAll(/<([A-Z][A-Za-z]*)[\s/>]/g)) {
          const entry = Object.entries(ui).find(([, e]) => e.Component.name === tag[1]); if (!entry) continue;
          const canon = entry[1].figma.sources.find((s) => s.status === "canonical" && s.libraryNode); if (!canon) continue;
          hits.set(`${entry[0]}|${canon.mainNode ?? ""}`, (hits.get(`${entry[0]}|${canon.mainNode ?? ""}`) ?? new Set()).add(frame));
        }
      }
    } catch { /* a bad capture doesn't break the page */ }
  }
  return hits;
}

const KIND: Record<UiKind, string> = { component: "Components", pattern: "Patterns", device: "Device chrome (nothing to decide: the phone draws these)" };
const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  canonical: { label: "Canonical", bg: "var(--blue-bg)", fg: "var(--blue)" },
  candidate: { label: "Candidate", bg: "var(--soft-2, #f1f3f6)", fg: "var(--mute)" },
  retired: { label: "Retired", bg: "transparent", fg: "var(--mute)" },
};

/**
 * UI library: the Figma sets each coded entry has been matched to, one per row with a readable picture of the set
 * and the facts that help choose (library, last update, where it's used). Pick the current one as canonical.
 */
export default async function UiLibraryPage() {
  const user = await requireUser("/ui/library");
  if (!canUseStudio(user)) notFound();
  const lib = await libraryWithDecisions();
  const used = usage();
  const hits = sourceHits();
  const canSave = hasDb();
  const entries = Object.entries(lib);
  const toDecide = entries.filter(([, e]) => e.kind !== "device" && e.figma.sources.some((s) => s.status === "candidate"));
  return (
    <main className="shell">
      <Nav on="ui" user={user} />
      <p className="crumb"><Link href="/ui">← UI</Link></p>
      <PageHero title="UI library">Where Figma holds the same thing more than once, pick which one Dekiru follows.</PageHero>
      <p className="muted" style={{ maxWidth: 720 }}>
        {toDecide.length ? <>Waiting on a decision: <strong>{toDecide.map(([, e]) => e.name).join(", ")}</strong>. </> : "Nothing is waiting on a decision. "}
        Each row is one Figma set, shown as Figma draws it. Mark the current one <strong>Canonical</strong>; <strong>Retire</strong> the rest once you&apos;re sure. Deciding rebuilds nothing.
        {!canSave && " No database here, so decisions can't be saved."}
      </p>
      {(["component", "pattern", "device"] as UiKind[]).map((kind) => (
        <section key={kind}>
          <h2>{KIND[kind]}</h2>
          {entries.filter(([, e]) => e.kind === kind).map(([id, e]) => {
            const undecided = e.figma.sources.filter((s) => s.status === "candidate").length;
            const on = used.get(id);
            return (
              <article key={id} className="card" style={{ padding: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "baseline", marginBottom: 8 }}>
                  <h3 style={{ margin: 0 }}>{e.name}</h3>
                  <span className="muted">
                    {on?.size ? `used on ${[...on].join(", ")}` : "used inside other components"}
                    {e.figma.variants?.length ? ` · ${e.figma.variants.join(" × ")}` : ""}
                    {kind !== "device" && (undecided ? ` · ${undecided} to decide` : " · decided")}
                  </span>
                </div>
                {e.figma.sources.map((s) => {
                  const key = sourceKey(s);
                  const seen = [...(hits.get(`${id}|${s.mainNode ?? ""}`) ?? [])];
                  const st = STATUS[s.status];
                  return (
                    <div key={key} style={{ display: "grid", gridTemplateColumns: "minmax(280px, 560px) 1fr", gap: 16, alignItems: "start", padding: "12px 0", borderTop: "1px solid var(--line)", opacity: s.status === "retired" ? 0.55 : 1 }}>
                      {/* Figma's sheet of the set, at readable width; tall sheets scroll inside the box rather than shrink. */}
                      <a href={s.url} target="_blank" rel="noreferrer" title={s.url ? "Open in Figma" : undefined} style={{ display: "block", background: "#fff", border: `2px solid ${s.status === "canonical" ? "var(--blue)" : "var(--line)"}`, borderRadius: 8, padding: 8, minHeight: 72, maxHeight: 420, overflowY: "auto" }}>
                        {s.preview
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={s.preview} alt={`${s.set} as drawn in Figma`} style={{ display: "block", width: "100%", height: "auto" }} />
                          : <span style={{ display: "block", color: "#677181", fontSize: 13, padding: 8 }}>No picture: this set was found by searching the library, not on a screen. Open it in Figma.</span>}
                      </a>
                      <div style={{ fontSize: 14 }}>
                        <div><span style={{ display: "inline-block", padding: "1px 8px", borderRadius: 10, background: st.bg, color: st.fg, fontWeight: 600, marginRight: 8 }}>{st.label}</span><strong>{s.set}</strong></div>
                        <div className="muted" style={{ marginTop: 4 }}>{s.library}{s.updatedAt ? ` · last updated ${s.updatedAt}` : ""}</div>
                        <div className="muted">{seen.length ? `Seen on: ${seen.join(", ")}` : "Not yet seen on an audited screen"}</div>
                        {s.note && <div className="muted" style={{ marginTop: 4 }}>{s.note}</div>}
                        <div style={{ marginTop: 6, display: "flex", gap: 10, alignItems: "center" }}>
                          {s.url && <a href={s.url} target="_blank" rel="noreferrer">Open in Figma ↗</a>}
                          <details style={{ display: "inline" }}><summary className="muted" style={{ cursor: "pointer" }}>ids</summary>
                            <code style={{ fontSize: 12 }}>{[s.setKey && `set ${s.setKey}`, s.libraryNode && `library node ${s.libraryNode}`, s.mainNode && `main node ${s.mainNode}`].filter(Boolean).join(" · ")}</code>
                          </details>
                        </div>
                        {kind !== "device" && <div style={{ marginTop: 10 }}><SourceDecision component={id} source={key} status={s.status} canSave={canSave} /></div>}
                      </div>
                    </div>
                  );
                })}
              </article>
            );
          })}
        </section>
      ))}
    </main>
  );
}
