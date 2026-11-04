import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canUseStudio } from "@/lib/studio";
import { screens } from "@/content/screens";
import { ui } from "@/ui/registry";
import type { Node } from "@/ui/types";
import { Nav } from "../../Nav";
import { PageHero } from "../../PageHero";

function used(node: Node, acc = new Map<string, number>()) {
  if (ui[node.component]) acc.set(node.component, (acc.get(node.component) ?? 0) + 1);
  node.children?.forEach((c) => used(c, acc));
  return acc;
}

/** Compare: the Figma render beside Dekiru's render of the same screen (an iframe at the device width). */
export default async function UiScreenPage({ params }: PageProps<"/ui/[id]">) {
  const user = await requireUser("/ui");
  if (!canUseStudio(user)) notFound();
  const { id } = await params;
  const screen = screens[id];
  if (!screen) notFound();
  const figmaUrl = `https://www.figma.com/design/${screen.figma.file}?node-id=${screen.figma.node.replace(":", "-")}`;
  const counts = used(screen.tree);
  return (
    <main className="shell">
      <Nav on="ui" user={user} />
      <p className="crumb"><Link href="/ui">← UI</Link></p>
      <PageHero title={screen.title}>{screen.figma.name} · <a href={figmaUrl} target="_blank" rel="noreferrer">open in Figma</a> · {screen.device.width}×{screen.device.height}</PageHero>
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start", flexWrap: "wrap", padding: "16px 0" }}>
        <figure style={{ margin: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/ui/ref/${screen.id}.png`} alt="Figma render" width={screen.device.width} height={screen.device.height} style={{ display: "block", border: "1px solid #ddd" }} />
          <figcaption className="muted" style={{ textAlign: "center", marginTop: 8 }}>Figma</figcaption>
        </figure>
        <figure style={{ margin: 0 }}>
          <iframe title="Dekiru render" src={`/ui/${screen.id}/frame`} width={screen.device.width} height={screen.device.height} style={{ display: "block", border: "1px solid #ddd", background: "#fff" }} />
          <figcaption className="muted" style={{ textAlign: "center", marginTop: 8 }}>Dekiru</figcaption>
        </figure>
        <div style={{ maxWidth: 360 }}>
          <h2 style={{ marginTop: 0 }}>Built from</h2>
          <ul className="list">
            {[...counts].map(([k, n]) => (
              <li key={k}><strong>{ui[k].name}</strong> <span className="muted">× {n} · {ui[k].kind} · {ui[k].figma.set} ({ui[k].figma.library})</span></li>
            ))}
          </ul>
          <p className="muted">Layout and text nodes carry no component; they come from the auto-layout of the frame.</p>
        </div>
      </div>
    </main>
  );
}
