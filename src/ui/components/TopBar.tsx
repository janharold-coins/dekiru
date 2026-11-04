import { token, type } from "../tokens";
import type { FigmaOrigin } from "../types";

/** [App] Component library V2 → "Nav bar/Top bar": Title × Left × Right. 48px, 16px side padding. */
export const topBarOrigin: FigmaOrigin = {
  variants: ["Title", "Left", "Right"],
  sources: [{ status: "canonical", library: "[App] Component library V2", set: "Nav bar/Top bar", setKey: "e42f4dedde8356f7819cee5cf582634120b98b78", mainNode: "20587:32072", libraryNode: "239:9680" }],
};

export interface TopBarProps { title?: string; left?: boolean; right?: boolean }

/** On the KYC screen Left=On renders nothing visible (the slot is empty in the design), so only the title is drawn. */
export function TopBar({ title }: TopBarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: 48, padding: "0 16px", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
      {title && <span style={{ ...type("Line Auto/H4 16px-600"), color: token("Text/Primary (950)"), flex: 1, textAlign: "center" }}>{title}</span>}
    </div>
  );
}
