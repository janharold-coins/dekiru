import type { ReactNode } from "react";
import { token } from "../tokens";
import type { FigmaOrigin } from "../types";
import { Button } from "./Button";

/**
 * [App] Component library V2 → "Bottom" (Status × Type × Keyboard × Left icon): the sticky footer that holds the
 * primary button, an optional text-only button, and the home indicator. Type 2_TextOnly = primary + text-only.
 */
export const bottomOrigin: FigmaOrigin = {
  library: "[App] Component library V2", set: "Bottom", mainNode: "20587:26257",
  variants: ["Status", "Type", "Keyboard", "Left icon"],
};

export interface BottomProps {
  type?: "2_TextOnly" | "Primary";
  status?: "Default";
  primary: ReactNode;
  /** The text-only button's content. On the KYC screen it is two lines: a grey lead and an underlined link. */
  secondary?: ReactNode;
  secondaryLead?: string;
  secondaryLink?: string;
}

export function Bottom({ type: kind = "2_TextOnly", primary, secondary, secondaryLead, secondaryLink }: BottomProps) {
  const text = secondary ?? (secondaryLink && (
    <>
      {secondaryLead && <span style={{ color: token("Text/Secondary (500)") }}>{secondaryLead}</span>}
      <span style={{ color: token("base/Grey/Grey 950"), textDecoration: "underline", textDecorationSkipInk: "none", textUnderlinePosition: "from-font" }}>{secondaryLink}</span>
    </>
  ));
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", background: token("Fill/Float (25)") }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 16px 8px" }}>
        <Button fullWidth>{primary}</Button>
        {kind === "2_TextOnly" && text && <Button type="Text-only" fullWidth>{text}</Button>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "22px 0 8px", overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/ui/chrome/home-indicator.svg" width={100} height={4} style={{ display: "block" }} />
      </div>
    </div>
  );
}
