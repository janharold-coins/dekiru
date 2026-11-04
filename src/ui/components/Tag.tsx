import type { ReactNode } from "react";
import { token, type } from "../tokens";
import type { FigmaOrigin } from "../types";

/** [App] Component library V2 → "Tag" (instance name "C-Tag/Rectangle"): Color × Type × Icon. */
export const tagOrigin: FigmaOrigin = {
  library: "[App] Component library V2", set: "Tag", setKey: "b0aeebaa3b8bf017cc28aa148491def9571ac59c", mainNode: "20286:21567",
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
