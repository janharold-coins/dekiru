import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canUseStudio } from "@/lib/studio";
import { screenList } from "@/content/screens";
import { ui } from "@/ui/registry";
import { tokenNames } from "@/ui/tokens";
import { Nav } from "../Nav";
import { PageHero } from "../PageHero";

/** UI (wip-alpha test): screens built from Figma, and the components and tokens grown from them so far. */
export default async function UiHome() {
  const user = await requireUser("/ui");
  if (!canUseStudio(user)) notFound();
  const entries = Object.entries(ui);
  return (
    <main className="shell">
      <Nav on="ui" user={user} />
      <PageHero title="UI (wip-alpha test)">Screens are built from Figma, one at a time; the component library grows with them. Plan: <code>docs/figma-first-plan.md</code>.</PageHero>
      <h2>Screens</h2>
      <ul className="list">
        {screenList().map((s) => (
          <li key={s.id}>
            <Link href={`/ui/${s.id}`}><strong>{s.title}</strong></Link>
            <span className="muted"> · {s.figma.name} · {s.device.width}×{s.device.height}</span>
          </li>
        ))}
      </ul>
      <h2>Components ({entries.filter(([, e]) => e.kind === "component").length}) and patterns ({entries.filter(([, e]) => e.kind === "pattern").length})</h2>
      <table className="table">
        <thead><tr><th>Dekiru id</th><th>Kind</th><th>Figma set</th><th>Library</th><th>Main node</th><th>Variants</th></tr></thead>
        <tbody>
          {entries.map(([id, e]) => (
            <tr key={id}><td><code>{id}</code></td><td>{e.kind}</td><td>{e.figma.set}</td><td className="muted">{e.figma.library}</td><td><code>{e.figma.mainNode ?? "—"}</code></td><td className="muted">{e.figma.variants?.join(" × ")}</td></tr>
          ))}
        </tbody>
      </table>
      <h2>Tokens ({tokenNames().length})</h2>
      <p className="muted">{tokenNames().join(" · ")}</p>
    </main>
  );
}
