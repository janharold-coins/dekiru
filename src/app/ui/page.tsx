import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canUseStudio } from "@/lib/studio";
import { screenList } from "@/content/screens";
import { type UiKind } from "@/ui/registry";
import { libraryWithDecisions } from "@/lib/ui-sources";
import { tokenNames } from "@/ui/tokens";
import { Nav } from "../Nav";
import { PageHero } from "../PageHero";

const KIND: Record<UiKind, { title: string; blurb: string }> = {
  component: { title: "Components", blurb: "Library components coded once from Figma. A component keeps every Figma set it has been matched to; one is canonical, the others wait for a decision here." },
  pattern: { title: "Patterns", blurb: "Repeated arrangements built from components (file-local sets, copied frames)." },
  device: { title: "Device (ui-device)", blurb: "OS chrome beyond our design: status bar, home indicator, the system keyboard. Dekiru draws these; they are never audited, mapped or handed off." },
};

/** UI (wip-alpha test): screens built from Figma, and the library grown from them so far. */
export default async function UiHome() {
  const user = await requireUser("/ui");
  if (!canUseStudio(user)) notFound();
  const entries = Object.entries(await libraryWithDecisions());
  return (
    <main className="shell">
      <Nav on="ui" user={user} />
      <PageHero title="UI (wip-alpha test)">Screens are built from Figma, one at a time; the component library grows with them. Plan: <code>docs/figma-first-plan.md</code>. <Link href="/ui/library">UI library →</Link></PageHero>
      <h2>Screens</h2>
      <ul className="list">
        {screenList().map((s) => (
          <li key={s.id}>
            <Link href={`/ui/${s.id}`}><strong>{s.title}</strong></Link>
            <span className="muted"> · {s.figma.name} · {s.device.width}×{s.device.height}</span>
          </li>
        ))}
      </ul>
      {(["component", "pattern", "device"] as UiKind[]).map((kind) => {
        const rows = entries.filter(([, e]) => e.kind === kind);
        return (
          <section key={kind}>
            <h2>{KIND[kind].title} ({rows.length})</h2>
            <p className="muted">{KIND[kind].blurb}</p>
            <table className="table">
              <thead><tr><th>Dekiru id</th><th>Figma sources</th><th>Variants</th></tr></thead>
              <tbody>
                {rows.map(([id, e]) => (
                  <tr key={id}>
                    <td><code>{id}</code></td>
                    <td>
                      {e.figma.sources.map((s, i) => (
                        <div key={i} style={{ opacity: s.status === "retired" ? 0.5 : 1 }}>
                          <strong>{s.status}</strong> · {s.set} <span className="muted">({s.library}{s.updatedAt ? `, ${s.updatedAt}` : ""})</span>
                          {s.libraryNode && <code style={{ marginLeft: 6 }}>{s.libraryNode}</code>}
                          {s.setKey && <code style={{ marginLeft: 6 }}>{s.setKey.slice(0, 8)}…</code>}
                          {s.note && <span className="muted"> — {s.note}</span>}
                        </div>
                      ))}
                    </td>
                    <td className="muted">{e.figma.variants?.join(" × ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
      <h2>Tokens ({tokenNames().length})</h2>
      <p className="muted">{tokenNames().join(" · ")}</p>
    </main>
  );
}
