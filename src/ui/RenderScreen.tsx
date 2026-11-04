import type { CSSProperties, ReactNode } from "react";
import { ui } from "./registry";
import { token, tokenVars, type } from "./tokens";
import type { Node, Screen } from "./types";

/**
 * Renders a screen's node tree. Layout nodes (`Stack`, `Text`) become flex boxes and text with token styles; every
 * other node is a registry component given its props. Children of a component go in as `children`.
 */
function RenderNode({ node }: { node: Node }) {
  const kids: ReactNode = node.children?.map((c, i) => <RenderNode key={i} node={c} />);
  const p = node.props ?? {};
  if (node.component === "Stack") {
    const style: CSSProperties = {
      display: "flex", flexDirection: (p.direction as "row" | "column") ?? "column", gap: p.gap as number, padding: p.padding as string | number,
      alignItems: (p.align as CSSProperties["alignItems"]) ?? "stretch", justifyContent: p.justify as CSSProperties["justifyContent"],
      width: p.width as string | number, flex: p.flex as number, background: typeof p.background === "string" ? token(p.background) : undefined,
      boxSizing: "border-box",
    };
    return <div style={style} data-figma={node.figma}>{kids}</div>;
  }
  if (node.component === "Text") {
    return <p style={{ margin: 0, ...type(p.style as string), color: token(p.color as string), textAlign: p.align as CSSProperties["textAlign"], width: "100%", wordBreak: "break-word" }} data-figma={node.figma}>{String(p.text)}</p>;
  }
  const entry = ui[node.component];
  if (!entry) return <div style={{ padding: 8, background: "#fee", fontSize: 12 }}>Unknown component “{node.component}”</div>;
  const { Component } = entry;
  return <Component {...p}>{kids}</Component>;
}

/** The whole screen at its device width, with every token as a CSS variable on the root. */
export function RenderScreen({ screen }: { screen: Screen }) {
  return (
    <div style={{ width: screen.device.width, minHeight: screen.device.height, display: "flex", flexDirection: "column", background: token("Fixed/White"), ...tokenVars() }} data-screen={screen.id}>
      <RenderNode node={screen.tree} />
    </div>
  );
}
