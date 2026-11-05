import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canUseStudio } from "@/lib/studio";
import { screenList } from "@/content/screens";
import { libraryWithDecisions } from "@/lib/ui-sources";
import { FONT_STACK, tokenNames, tokenVars } from "@/ui/tokens";
import { ui, type UiKind } from "@/ui/registry";
import type { Node } from "@/ui/types";
import { Nav } from "../Nav";
import { PageHero } from "../PageHero";
import { ScaledScreen } from "./ScaledScreen";

/** How many screens use each registry entry. */
function usage() {
  const out = new Map<string, number>();
  const seen = new Set<string>();
  const walk = (n: Node, screen: string) => {
    const k = `${n.component}|${screen}`;
    if (!seen.has(k)) { seen.add(k); out.set(n.component, (out.get(n.component) ?? 0) + 1); }
    n.children?.forEach((c) => walk(c, screen));
  };
  for (const s of screenList()) walk(s.tree, s.id);
  return out;
}

const KIND: Record<UiKind, string> = { component: "Components", pattern: "Patterns", device: "Device chrome" };
/** The viewport a screen card shows: a phone's worth of the screen; taller screens are cropped, as on the phone. */
const VIEW_H = 780;

/** UI (wip-alpha test): the screens built from Figma and the pieces they are built from, as Dekiru draws them. */
export default async function UiHome() {
  const user = await requireUser("/ui");
  if (!canUseStudio(user)) notFound();
  const lib = await libraryWithDecisions();
  const used = usage();
  const toDecide = Object.values(lib).filter((e) => e.kind !== "device" && e.figma.sources.some((s) => s.status === "candidate")).length;
  const frameStyle = { background: "#fff", color: "#131b26", fontFamily: FONT_STACK, WebkitFontSmoothing: "antialiased" as const, ...tokenVars() };
  return (
    <main className="shell">
      <Nav on="ui" user={user} />
      <PageHero title="UI (wip-alpha test)">App screens built from Figma, one at a time. The component library grows with them.</PageHero>

      <h2 className="section-h" style={{ marginTop: 8 }}>Screens</h2>
      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
        {screenList().map((s) => (
          <Link key={s.id} href={`/ui/${s.id}`} className="card ui-card" style={{ display: "block", color: "inherit", textDecoration: "none" }}>
            <div className="thumb" style={{ aspectRatio: `${s.device.width} / ${VIEW_H}`, overflow: "hidden" }}>
              <ScaledScreen id={s.id} width={s.device.width} height={s.device.height} />
            </div>
            <div className="meta" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
              <strong>{s.title}</strong>
              <span className="muted">{s.figma.name} · {s.device.width}×{s.device.height}</span>
            </div>
          </Link>
        ))}
      </div>

      {(["component", "pattern", "device"] as UiKind[]).map((kind) => (
        <section key={kind}>
          <h2 className="section-h">{KIND[kind]}</h2>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
            {Object.entries(lib).filter(([, e]) => e.kind === kind).map(([id, e]) => {
              const { Component } = ui[id];
              const undecided = kind !== "device" && e.figma.sources.some((s) => s.status === "candidate");
              return (
                <div key={id} className="card">
                  {/* Dekiru's own render of the piece, in the screen's font and tokens, at the phone's width. */}
                  <div className="thumb" style={{ ...frameStyle, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120, padding: 16, overflow: "hidden" }}>
                    <div style={{ width: "100%", maxWidth: 328 }}><Component {...e.example} /></div>
                  </div>
                  <div className="meta" style={{ justifyContent: "space-between" }}>
                    <span><strong>{e.name}</strong> <span className="muted">· {used.get(id) ? `on ${used.get(id)} screen${used.get(id) === 1 ? "" : "s"}` : "inside other pieces"}</span></span>
                    {undecided ? <Link href="/ui/library" className="tag warn">Which Figma set?</Link> : kind !== "device" && <span className="tag">Figma ✓</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="muted" style={{ marginTop: 32 }}>
        {tokenNames().length} tokens from Figma variables. {toDecide ? <><strong>{toDecide}</strong> piece{toDecide === 1 ? "" : "s"} waiting on a decision in the <Link href="/ui/library">UI library</Link>. </> : <><Link href="/ui/library">UI library</Link> · nothing waiting on a decision. </>}
        How it works: <code>docs/figma-first-plan.md</code>; every new screen is audited first (<code>npm run ui:audit</code>).
      </p>
    </main>
  );
}
