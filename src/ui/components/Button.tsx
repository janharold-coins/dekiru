import type { ReactNode } from "react";
import { token, type } from "../tokens";
import type { FigmaOrigin } from "../types";

/** [App] Component library V2 → "Button": Type × Size × Status. The set in use on the KYC screens is main node 20531:26780. */
export const buttonOrigin: FigmaOrigin = {
  library: "[App] Component library V2", set: "Button", mainNode: "20531:26780", libraryNode: "3196:22767",
  variants: ["Type", "Size", "Status"],
};

export interface ButtonProps {
  type?: "Primary" | "Text-only";
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
      background: primary ? token("Core/Blue") : "transparent",
      ...(primary ? type("Line 1.5x/Subtitle 14px-700") : type("Line 1.5x/Subtitle 14px-600")),
      color: primary ? token("Text/Inverse") : token("Core/Brand"), textAlign: "center",
    }}>
      <span style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>{children}</span>
    </button>
  );
}
