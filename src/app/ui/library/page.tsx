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

/** Which source each audited frame hit, from the raw captures (main-component node → frame names). */
function sourceHits() {
  const hits = new Map<string, Set<string>>();
  const dir = path.join(process.cwd(), "docs/ui-audits/raw");
  let files: string[] = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".json")); } catch { return hits; }
  for (const f of files) {
    try {
      const raw = JSON.parse(readFileSync(path.join(dir, f), "utf8")) as { name: string; suggestions: { mainComponentNodeId: string }[] };
      for (const s of raw.suggestions) {
        const id = byMainNode(s.mainComponentNodeId); if (!id) continue;
        hits.set(`${id}|${s.mainComponentNodeId}`, (hits.get(`${id}|${s.mainComponentNodeId}`) ?? new Set()).add(raw.name.replace(/^KYC - KYB → /, "")));
      }
    } catch { /* a bad capture doesn't break the page */ }
  }
  return hits;
}

const KIND: Record<UiKind, { title: string; blurb: string }> = {
  component: { title: "Components", blurb: "Library components coded once from Figma." },
  pattern: { title: "Patterns", blurb: "Repeated arrangements built from components." },
  device: { title: "Device chrome", blurb: "What the phone draws, not our design. Dekiru supplies these; nothing to decide unless the look is wrong." },
};

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  canonical: { label: "Canonical", bg: "var(--blue-bg)", fg: "var(--blue)" },
  candidate: { label: "Candidate", bg: "var(--soft-2, #f1f3f6)", fg: "var(--mute)" },
  retired: { label: "Retired", bg: "transparent", fg: "var(--mute)" },
};

/**
 * UI library: for each coded entry, Dekiru's render beside every Figma source it has been matched to, as pictures,
 * so a designer can see what they are choosing between and pick the canonical one (or retire a source).
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
      <p className="muted" style={{ maxWidth: 720 }}>
        Where Figma holds the same thing twice (two Button sets, a web Tag and an app Tag), Dekiru keeps one component and shows every Figma version it was matched to.
        Compare the pictures, open them in Figma if you need to, and mark the current one <strong>canonical</strong>; retire the rest when you&apos;re sure. Nothing is rebuilt by deciding.
      </p>
      {!canSave && <p className="muted">No database here, so decisions can&apos;t be saved.</p>}
      {(["component", "pattern", "device"] as UiKind[]).map((kind) => (
        <section key={kind}>
          <h2>{KIND[kind].title}</h2>
          <p className="muted">{KIND[kind].blurb}</p>
          {Object.entries(lib).filter(([, e]) => e.kind === kind).map(([id, e]) => {
            const undecided = e.figma.sources.filter((s) => s.status === "candidate").length;
            const on = used.get(id);
            return (
              <article key={id} className="card" style={{ padding: 16, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "baseline", marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>{e.name}</h3>
                  <span className="muted">
                    {on?.size ? `Used on: ${[...on].join(", ")}` : "Used inside other components"}
                    {undecided ? ` · ${undecided} to decide` : " · decided"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <figure style={{ margin: 0, flex: "0 0 auto" }}>
                    <iframe title={`${e.name} in Dekiru`} src={`/ui/library/preview/${id}`} width={300} height={kind === "pattern" ? 360 : 180} style={{ display: "block", border: "1px solid var(--line)", borderRadius: 8, background: "#fff", width: 300 }} />
                    <figcaption className="muted" style={{ textAlign: "center", marginTop: 6, fontSize: 13 }}>Dekiru&apos;s version</figcaption>
                  </figure>
                  {e.figma.sources.map((s) => {
                    const key = sourceKey(s);
                    const seen = [...(hits.get(`${id}|${s.mainNode ?? ""}`) ?? [])];
                    const st = STATUS[s.status];
                    return (
                      <figure key={key} style={{ margin: 0, flex: "0 0 auto", width: 300, opacity: s.status === "retired" ? 0.55 : 1 }}>
                        <div style={{ height: kind === "pattern" ? 360 : 180, border: `1px solid ${s.status === "canonical" ? "var(--blue)" : "var(--line)"}`, borderRadius: 8, background: "#fff", display: "grid", placeItems: "center", overflow: "hidden", padding: 12, boxSizing: "border-box" }}>
                          {s.preview
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={s.preview} alt={`${s.set} in Figma`} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                            : <span className="muted" style={{ textAlign: "center", fontSize: 13, color: "#677181" }}>No picture yet: this version was found by searching the library, not on a screen. Open it in Figma to see it.</span>}
                        </div>
                        <figcaption style={{ marginTop: 6, fontSize: 13 }}>
                          <span style={{ display: "inline-block", padding: "1px 8px", borderRadius: 10, background: st.bg, color: st.fg, fontWeight: 600, marginRight: 6 }}>{st.label}</span>
                          <strong>{s.set}</strong>
                          <div className="muted">{s.library}{s.updatedAt ? ` · updated ${s.updatedAt}` : ""}</div>
                          {seen.length > 0 && <div className="muted">Seen on: {seen.join(", ")}</div>}
                          {s.note && <div className="muted" style={{ marginTop: 4 }}>{s.note}</div>}
                          <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            {s.url && <a href={s.url} target="_blank" rel="noreferrer">Open in Figma ↗</a>}
                            <details style={{ display: "inline" }}><summary className="muted" style={{ cursor: "pointer" }}>ids</summary>
                              <code style={{ fontSize: 12 }}>{[s.setKey && `set ${s.setKey}`, s.libraryNode && `library node ${s.libraryNode}`, s.mainNode && `main node ${s.mainNode}`].filter(Boolean).join(" · ")}</code>
                            </details>
                          </div>
                          {kind !== "device" && <div style={{ marginTop: 8 }}><SourceDecision component={id} source={key} status={s.status} canSave={canSave} /></div>}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>
      ))}
    </main>
  );
}
