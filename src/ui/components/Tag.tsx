import type { ReactNode } from "react";
import { token, type } from "../tokens";
import type { FigmaOrigin } from "../types";

/**
 * "C-Tag/Rectangle" (Color × Type × Icon). Code Connect placed its main component in the **[Web] Revamp Library V2**
 * (node 29:736 there), not in the App library, which has its own Tag set (b0aeebaa…): the KYC screen uses a web tag.
 */
export const tagOrigin: FigmaOrigin = {
  library: "[Web] Revamp Library V2", set: "C-Tag/Rectangle", mainNode: "20286:21567", libraryNode: "29:736",
  variants: ["Color", "Type", "Icon"],
};

export interface TagProps {
  color?: "Grey";
  size?: "S";
  children: ReactNode;
  /** The screen fades the tag on inactive cards (opacity 50% set on the instance). */
  dimmed?: boolean;
}

export function Tag({ children, dimmed }: TagProps) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, height: 16, padding: "0 4px", borderRadius: 3, background: token("Special/Tag/Grey Bg"), opacity: dimmed ? 0.5 : 1, whiteSpace: "nowrap" }}>
      <span style={{ ...type("Web/Subtext 10px-600"), color: token("Text/Subtitle (700)"), textAlign: "center" }}>{children}</span>
    </span>
  );
}
