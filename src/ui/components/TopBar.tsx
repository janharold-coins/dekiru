import { token, type } from "../tokens";
import type { FigmaOrigin } from "../types";
import { Icon } from "./Icon";

/** [App] Component library V2 → "Nav bar/Top bar": Title × Left × Right. 48px, 16px side padding. */
export const topBarOrigin: FigmaOrigin = {
  variants: ["Title", "Left", "Right"],
  sources: [{ status: "canonical", library: "[App] Component library V2", set: "Nav bar/Top bar", setKey: "e42f4dedde8356f7819cee5cf582634120b98b78", mainNode: "20587:32072", libraryNode: "239:9680", preview: "/ui/sources/top-bar-app-239-9680.png", url: "https://www.figma.com/design/praz6iby9CKDJfCBHew816/-App--Component-library-V2?node-id=239-9680" }],
};

export interface TopBarProps { title?: string; left?: boolean; right?: boolean }

/** Left=On is the 24px "Left" icon (back chevron). On the first KYC screen the slot was empty despite Left=On. */
export function TopBar({ title, left }: TopBarProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: 48, padding: "0 16px", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
      {left && <Icon name="Left" size={24} />}
      {title && <span style={{ ...type("Line Auto/H4 16px-600"), color: token("Text/Primary (950)"), flex: 1, textAlign: "center" }}>{title}</span>}
    </div>
  );
}
