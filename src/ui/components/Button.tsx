import type { ReactNode } from "react";
import { token, type } from "../tokens";
import type { FigmaOrigin } from "../types";

/** [App] Component library V2 → "Button": Type × Size × Status. The set in use on the KYC screens is main node 20531:26780. */
export const buttonOrigin: FigmaOrigin = {
  variants: ["Type", "Size", "Status"],
  sources: [
    { status: "canonical", library: "[App] Component library V2", set: "Button", mainNode: "20531:26780", libraryNode: "3196:22767", preview: "/ui/sources/button-app-3196-22767.png", url: "https://www.figma.com/design/praz6iby9CKDJfCBHew816/-App--Component-library-V2?node-id=3196-22767", note: "The set the KYC screen uses; Code Connect set here." },
    { status: "candidate", library: "[App] Component library V2", set: "Button", setKey: "8bc60634c74e06391f76a267f4eb3fdf2b7a85e8", updatedAt: "2026-10-15", url: "https://www.figma.com/design/praz6iby9CKDJfCBHew816/-App--Component-library-V2?node-id=19-7764", note: "May be the same set as the canonical one; the set key of node 3196:22767 settles it." },
    { status: "candidate", library: "[App] Component library V2", set: "Button", setKey: "b211b8a82a4af616c95e19faf842471df32587cc", updatedAt: "2025-11-23", url: "https://www.figma.com/design/praz6iby9CKDJfCBHew816/-App--Component-library-V2?node-id=19-7764" },
    { status: "candidate", library: "[App] Component library V2", set: "button", setKey: "172d80af8a5145c1fce2c9a36edafd01e085b136", updatedAt: "2026-08-04", url: "https://www.figma.com/design/praz6iby9CKDJfCBHew816/-App--Component-library-V2?node-id=19-7764" },
  ],
};

export interface ButtonProps {
  /**
   * Primary and Text-only are the variants seen on the KYC screens. "Secondary" is the grey pill the Failed screen
   * draws by overriding a Text-only instance's fill with Fill/Control (75) (audit: hand override, not a variant).
   */
  type?: "Primary" | "Secondary" | "Text-only";
  size?: "L";
  status?: "Default";
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({ type: kind = "Primary", children, fullWidth }: ButtonProps) {
  const primary = kind === "Primary";
  return (
    <button type="button" style={{
      display: "flex", alignItems: "center", justifyContent: "center", height: 44, maxHeight: 44, padding: "12px 32px", borderRadius: 40, border: 0,
      width: fullWidth ? "100%" : undefined, minWidth: fullWidth ? undefined : 158, cursor: "pointer",
      background: primary ? token("Core/Blue") : kind === "Secondary" ? token("Fill/Control (75)") : "transparent",
      ...(primary ? type("Line 1.5x/Subtitle 14px-700") : type("Line 1.5x/Subtitle 14px-600")),
      color: primary ? token("Text/Inverse") : token("Core/Brand"), textAlign: "center",
    }}>
      <span style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</span>
    </button>
  );
}
