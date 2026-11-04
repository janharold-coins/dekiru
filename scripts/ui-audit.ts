/**
 * UI audit (docs/figma-first-plan.md, step 1): the gate before any screen is coded.
 *
 *   npm run ui:audit -- docs/ui-audits/raw/<frame>.json            report to docs/ui-audits/<slug>.md
 *   npm run ui:audit -- <raw.json> --write-tokens                  also merge new variables into src/ui/tokens.json
 *
 * The raw file holds what the Figma connector returns for one frame (captured by Claude in chat until the REST API
 * runs it unattended): get_metadata, get_code_connect_suggestions, get_variable_defs, get_libraries, and the
 * get_design_context code. This script does everything after the reads: it matches instances to the registry by
 * Figma identity (never by name), separates patterns and device chrome, runs the hygiene flags, diffs the tokens
 * and writes the report. It never writes code.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { ui as declared, type UiEntry, type UiKind } from "@/ui/registry";
import { hasDb } from "@/db/client";
import { libraryWithDecisions } from "@/lib/ui-sources";
import tokens from "@/ui/tokens.json";

/** The registry with /ui/library decisions applied when a database is configured; the declared statuses otherwise. */
let ui: Record<string, UiEntry> = declared;
const byMainNode = (node: string) =>
  Object.entries(ui).find(([, e]) => e.figma.sources.some((s) => s.status !== "retired" && s.mainNode === node))?.[0];

interface Raw {
  file: string; node: string; name: string; url?: string; captured: string;
  metadata: string;
  suggestions: { componentName: string; mainComponentNodeId: string; instanceNodeId: string; properties?: Record<string, string> }[];
  variables: Record<string, string>;
  libraries: { name: string; libraryKey?: string }[];
  designContext?: string;
}

interface MNode { tag: string; id: string; name: string; w: number; h: number; hidden: boolean; depth: number; parent?: MNode; children: MNode[] }

/** get_metadata's XML is flat and regular enough for a small parser: one element per line, self-closing or not. */
function parseMetadata(xml: string): MNode[] {
  const all: MNode[] = []; const stack: MNode[] = [];
  for (const m of xml.matchAll(/<(\/?)(frame|instance|text|symbol|line|vector|rectangle|group|ellipse|component)\b([^>]*?)(\/?)>/g)) {
    if (m[1]) { stack.pop(); continue; }
    const a = m[3]; const attr = (k: string) => a.match(new RegExp(`\\b${k}="([^"]*)"`))?.[1];
    const n: MNode = { tag: m[2], id: attr("id") ?? "", name: (attr("name") ?? "").replace(/&amp;/g, "&").replace(/&gt;/g, ">").replace(/&lt;/g, "<"), w: Number(attr("width")), h: Number(attr("height")), hidden: attr("hidden") === "true", depth: stack.length, parent: stack.at(-1), children: [] };
    stack.at(-1)?.children.push(n); all.push(n);
    if (!m[4]) stack.push(n);
  }
  return all;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const props = (p?: Record<string, string>) => Object.entries(p ?? {}).filter(([k]) => !k.startsWith("VARIANT:")).map(([k, v]) => `${k}=${v}`).join(" · ");
const insideInstance = (n: MNode) => { for (let p = n.parent; p; p = p.parent) if (p.tag === "instance") return true; return false; };

async function main() {
  const [rawPath, ...flags] = process.argv.slice(2);
  if (!rawPath) { console.error("usage: npm run ui:audit -- docs/ui-audits/raw/<frame>.json [--write-tokens]"); process.exit(2); }
  if (hasDb()) ui = await libraryWithDecisions();
  const raw: Raw = JSON.parse(readFileSync(rawPath, "utf8"));
  const nodes = parseMetadata(raw.metadata);
  const root = nodes[0];
  const subscribed = new Set(raw.libraries.map((l) => l.name));

  // Instances Code Connect already resolved to Dekiru files (the design context wraps them in CodeConnectSnippet).
  const connected = new Map<string, string>();
  for (const m of (raw.designContext ?? "").matchAll(/<CodeConnectSnippet data-node-id="([^"]+)" data-name="([^"]+)">\s*<([A-Z][A-Za-z]*)/g)) connected.set(m[1], m[3]);
  const byExport = new Map(Object.entries(ui).map(([id, e]) => [e.Component.name, id]));

  type Hit = { node: MNode; id?: string; kind?: UiKind; via: string; main?: string; variants?: string };
  const known: Hit[] = [], fresh: Hit[] = [], unresolved: MNode[] = [];
  const bySuggestion = new Map(raw.suggestions.map((s) => [s.instanceNodeId, s]));

  // get_code_connect_suggestions lists each main component once; sibling instances of the same component share it.
  // That inference goes by the instance's name equalling the suggested componentName (Figma's own dedup), and is
  // labelled as such; the REST API gives every instance its own componentId and retires it.
  const byComponentName = new Map(raw.suggestions.map((s) => [s.componentName, s]));

  for (const n of nodes.filter((n) => n.tag === "instance" && !insideInstance(n) && !n.hidden)) {
    const s = bySuggestion.get(n.id);
    const cc = connected.get(n.id);
    if (cc && byExport.has(cc)) { const id = byExport.get(cc)!; known.push({ node: n, id, kind: ui[id].kind, via: "Code Connect", variants: props(s?.properties) }); continue; }
    const sib = s ?? byComponentName.get(n.name);
    if (sib) {
      const id = byMainNode(sib.mainComponentNodeId);
      const how = s ? `main node ${sib.mainComponentNodeId}` : `main node ${sib.mainComponentNodeId} (sibling suggestion, same component name; variants unknown)`;
      const hit: Hit = { node: n, id, kind: id ? ui[id].kind : undefined, via: id ? how : "no match", main: sib.mainComponentNodeId, variants: s ? props(s.properties) : "" };
      (id ? known : fresh).push(hit); continue;
    }
    unresolved.push(n);
  }
  // Instances inside other instances that Code Connect resolved on their own (a Tag inside a pattern). get_metadata
  // doesn't expand instance children, so these come from the design context alone.
  for (const [nodeId, exp] of connected) {
    if (!byExport.has(exp) || known.some((k) => k.node.id === nodeId)) continue;
    const inTree = nodes.find((n) => n.id === nodeId);
    if (inTree && !insideInstance(inTree)) continue;
    const name = (raw.designContext ?? "").match(new RegExp(`data-node-id="${nodeId.replace(/[:;]/g, "\\$&")}" data-name="([^"]+)"`))?.[1] ?? exp;
    const id = byExport.get(exp)!;
    known.push({ node: inTree ?? { tag: "instance", id: nodeId, name, w: 0, h: 0, hidden: false, depth: 0, children: [] }, id, kind: ui[id].kind, via: "Code Connect (inside a pattern)" });
  }

  // Flags: what a designer should look at in Figma.
  const flagsOut: string[] = [];
  const defaultNamed = [...new Set(raw.suggestions.filter((s) => /^Component \d+$/.test(s.componentName)).map((s) => s.mainComponentNodeId))];
  for (const main of defaultNamed) {
    const names = [...new Set(nodes.filter((n) => n.tag === "instance" && /^Component \d+$/.test(n.name)).map((n) => n.name))];
    flagsOut.push(`**Default name.** Main component ${main} is named \`${names.join("` / `")}\` (Figma's default); name it after what it is (Dekiru calls it \`${byMainNode(main) ?? "?"}\`).`);
  }
  for (const n of nodes) {
    if (n.hidden && n.parent && n.parent.children.filter((c) => !c.hidden).length >= 1 && n.parent.children.filter((c) => c.hidden).length >= 2) {
      if (!flagsOut.some((f) => f.includes(n.parent!.id))) flagsOut.push(`**Hidden alternatives.** \`${n.parent.name}\` (${n.parent.id}) holds ${n.parent.children.filter((c) => c.hidden).length} hidden layers beside the visible one: a variant chooser done by hand; should be an instance swap or a variant property.`);
    }
    if (n.tag === "frame" && !n.hidden && /^Frame( \d+)?$/.test(n.name) && n.w > 0 && !(n.parent && n.parent.children.some((c) => c.hidden))) flagsOut.push(`**Unnamed frame.** \`${n.name}\` (${n.id}, ${n.w}×${n.h}) — fine if it is pure layout; a flag if it stands in for a component.`);
  }
  for (const s of raw.suggestions) if (s.properties && Object.keys(s.properties).length === 0) flagsOut.push(`**No variant properties.** \`${s.componentName}\` (main ${s.mainComponentNodeId}) is a plain component, likely file-local; if it is a reusable thing it should be a set in a library.`);
  for (const [id, e] of Object.entries(ui)) {
    const cands = e.figma.sources.filter((s) => s.status === "candidate");
    if (cands.length && known.some((k) => k.id === id)) flagsOut.push(`**Undecided sources.** \`${id}\` is used here and still has ${cands.length} candidate source(s) beside the canonical one; pick on the library page.`);
  }
  for (const k of known) for (const src of ui[k.id!].figma.sources) if (src.status === "canonical" && !subscribed.has(src.library) && !src.library.startsWith("KYC") && e2(src.library)) flagsOut.push(`**Library not subscribed.** \`${k.id}\`'s canonical source is in "${src.library}", which this file does not subscribe to.`);
  // Text that can spill out of its box. get_design_context writes a hugging text layer as `w-[min-content] min-w-full`
  // (it grows past its parent when a line can't break) and a no-wrap one as `whitespace-nowrap`. Either, with a long
  // sentence, is worth a measure; the KYC Failed reason (261px in a 228px column) is the known case.
  for (const m of (raw.designContext ?? "").matchAll(/<p className="([^"]*)"[^>]*data-node-id="([^"]+)"[^>]*>([^<]*)<\/p>/g)) {
    const text = m[3].replace(/\s+/g, " ").replace(/^\{`|`\}$/g, "").trim(); if (text.length < 50) continue;
    if (/w-\[min-content\]/.test(m[1]) && /min-w-full/.test(m[1])) flagsOut.push(`**Text may overflow its box.** Node ${m[2]} hugs its content inside a fixed-width parent (${text.length} chars: "${text.slice(0, 50)}…"); if a line can't break it spills past the frame. Measure, shorten, or let the box size it.`);
    else if (/whitespace-nowrap/.test(m[1])) flagsOut.push(`**Long single-line text.** Node ${m[2]} is set not to wrap (${text.length} chars: "${text.slice(0, 50)}…"); check it fits its container.`);
  }

  // Tokens.
  const have = tokens.variables as Record<string, string>;
  const tNew = Object.entries(raw.variables).filter(([k]) => !(k in have));
  const tChanged = Object.entries(raw.variables).filter(([k, v]) => k in have && have[k] !== v);
  const tSame = Object.keys(raw.variables).filter((k) => k in have && have[k] === raw.variables[k]);
  if (flags.includes("--write-tokens") && (tNew.length || tChanged.length)) {
    const next = { ...tokens, source: { ...tokens.source, nodes: [...new Set([...tokens.source.nodes, raw.node])], read: raw.captured.slice(0, 10) }, variables: { ...have, ...Object.fromEntries([...tNew, ...tChanged]) } };
    writeFileSync(path.join(process.cwd(), "src/ui/tokens.json"), JSON.stringify(next, null, 2) + "\n");
  }

  // Report.
  const row = (h: Hit) => `| \`${h.node.name}\` ${h.node.id} | \`${h.id ?? "—"}\` (${h.kind ?? "?"}) | ${h.via} | ${h.variants || "—"} |`;
  const kinds = (k: UiKind) => known.filter((h) => h.kind === k);
  const lines = [
    `# UI audit: ${raw.name}`, ``,
    `*Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/ui-audit.ts\` from \`${path.relative(process.cwd(), rawPath)}\` (captured ${raw.captured}). Nothing is coded until this is accepted.*`, ``,
    `- File \`${raw.file}\`, node \`${raw.node}\`${raw.url ? ` · [open in Figma](${raw.url})` : ""} · ${root.w}×${root.h}`,
    `- Subscribed libraries: ${raw.libraries.map((l) => l.name).join(", ")}`, ``,
    `## Known (${kinds("component").length} component instances) — reused, nothing to build`, ``,
    `| Instance | Dekiru entry | Matched via | Variant properties |`, `|---|---|---|---|`, ...kinds("component").map(row), ``,
    `## Patterns (${kinds("pattern").length})`, ``,
    `| Instance | Dekiru entry | Matched via | Variant properties on this screen |`, `|---|---|---|---|`, ...kinds("pattern").map(row), ``,
    `## Device chrome (${kinds("device").length}) — drawn by Dekiru, never mapped`, ``,
    `| Instance | Dekiru entry | Matched via | Variant properties |`, `|---|---|---|---|`, ...kinds("device").map(row), ``,
    `## New (${fresh.length}) — would be built, once accepted`, ``,
    ...(fresh.length ? [`| Instance | Main component | Variant properties |`, `|---|---|---|`, ...fresh.map((h) => `| \`${h.node.name}\` ${h.node.id} | ${h.main} | ${h.variants || "—"} |`)] : [`None.`]), ``,
    `## Unresolved (${unresolved.length}) — instances the capture gave no identity for`, ``,
    ...(unresolved.length ? unresolved.map((n) => {
      const hint = /^Component \d+$/.test(n.name) && defaultNamed.length ? ` — probably the default-named set ${defaultNamed.join(" / ")} (\`${byMainNode(defaultNamed[0]) ?? "?"}\`) under another default name; unverifiable without a per-instance id (REST API)` : "";
      return `- \`${n.name}\` ${n.id} (${n.w}×${n.h})${hint}`;
    }) : [`None.`]), ``,
    `## Flags (${flagsOut.length}) — look at these in Figma`, ``, ...(flagsOut.length ? flagsOut.map((f) => `- ${f}`) : [`None.`]), ``,
    `## Tokens — ${tNew.length} new, ${tChanged.length} changed, ${tSame.length} already held`, ``,
    ...tNew.map(([k, v]) => `- new \`${k}\` = \`${v}\``), ...tChanged.map(([k, v]) => `- changed \`${k}\`: \`${have[k]}\` → \`${v}\``),
    ...(tNew.length || tChanged.length ? [``, flags.includes("--write-tokens") ? `Written to \`src/ui/tokens.json\`.` : `Run with \`--write-tokens\` to merge them into \`src/ui/tokens.json\`.`] : []), ``,
  ];
  const out = path.join(process.cwd(), "docs/ui-audits", `${slug(raw.name)}-${raw.node.replace(":", "-")}.audit.md`);
  mkdirSync(path.dirname(out), { recursive: true });
  writeFileSync(out, lines.join("\n"));
  console.log(lines.join("\n"));
  console.log(`\n→ ${path.relative(process.cwd(), out)}`);
}

/** Libraries we can't check against the subscription list (unknown / file-local) don't raise the flag. */
const e2 = (lib: string) => !/unknown|file-local/i.test(lib);

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
