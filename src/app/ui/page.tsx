import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canUseStudio } from "@/lib/studio";
import { screenList } from "@/content/screens";
import { libraryWithDecisions } from "@/lib/ui-sources";
import { tokenNames } from "@/ui/tokens";
import { Nav } from "../Nav";
import { PageHero } from "../PageHero";

/** UI (wip-alpha test): the screens built from Figma so far, and where the library decisions live. */
export default async function UiHome() {
  const user = await requireUser("/ui");
  if (!canUseStudio(user)) notFound();
  const lib = Object.values(await libraryWithDecisions());
  const n = (kind: string) => lib.filter((e) => e.kind === kind).length;
  const toDecide = lib.filter((e) => e.kind !== "device" && e.figma.sources.some((s) => s.status === "candidate")).length;
  return (
    <main className="shell">
      <Nav on="ui" user={user} />
      <PageHero title="UI (wip-alpha test)">App screens built from Figma, one at a time. The component library grows with them.</PageHero>
      <h2>Screens</h2>
      <ul className="list">
        {screenList().map((s) => (
          <li key={s.id} style={{ marginBottom: 6 }}>
            <Link href={`/ui/${s.id}`}><strong>{s.title}</strong></Link>
            <span className="muted"> · {s.figma.name} · {s.device.width}×{s.device.height} · Figma beside Dekiru</span>
          </li>
        ))}
      </ul>
      <h2>Library</h2>
      <p>
        {n("component")} components, {n("pattern")} pattern{n("pattern") === 1 ? "" : "s"}, {n("device")} pieces of device chrome, {tokenNames().length} tokens.{" "}
        {toDecide ? <><strong>{toDecide} waiting on a decision</strong> about which Figma set to follow. </> : "Nothing waiting on a decision. "}
        <Link href="/ui/library">Open the UI library →</Link>
      </p>
      <p className="muted">How it works: <code>docs/figma-first-plan.md</code>. Every new screen is audited first (<code>npm run ui:audit</code>); nothing is coded until the audit is accepted.</p>
    </main>
  );
}
