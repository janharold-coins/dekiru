import type { ReactNode } from "react";
import { token } from "../tokens";
import type { FigmaOrigin } from "../types";
import { Button } from "./Button";

/**
 * [App] Component library V2 → "Bottom" (Status × Type × Keyboard × Left icon): the sticky footer that holds the
 * primary button and an optional text-only button. Type 2_TextOnly = primary + text-only. In Figma the component
 * also contains the home indicator and an optional number keyboard; those are OS chrome (ui-device: HomeIndicator,
 * and a keyboard later), placed by the screen after this footer.
 */
export const bottomOrigin: FigmaOrigin = {
  variants: ["Status", "Type", "Keyboard", "Left icon"],
  sources: [{ status: "canonical", library: "[App] Component library V2", set: "Bottom", mainNode: "20587:26257", libraryNode: "3436:20116" }],
};

export interface BottomProps {
  type?: "2_TextOnly" | "Primary";
  status?: "Default";
  primary: ReactNode;
  /** The text-only button's content. On the KYC screen it is two lines: a grey lead and an underlined link. */
  secondary?: ReactNode;
  secondaryLead?: string;
  secondaryLink?: string;
  /** How the second button is drawn: the library's Text-only, or the grey "Secondary" pill (see Button). */
  secondaryType?: "Text-only" | "Secondary";
}

export function Bottom({ type: kind = "2_TextOnly", primary, secondary, secondaryLead, secondaryLink, secondaryType = "Text-only" }: BottomProps) {
  const text = secondary ?? (secondaryLink && (
    <>
      {secondaryLead && <span style={{ color: token("Text/Secondary (500)") }}>{secondaryLead}</span>}
      <span style={{ color: token("base/Grey/Grey 950"), textDecoration: "underline", textDecorationSkipInk: "none", textUnderlinePosition: "from-font" }}>{secondaryLink}</span>
    </>
  ));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "16px 16px 8px", width: "100%", boxSizing: "border-box", background: token("Fill/Float (25)") }}>
      <Button fullWidth>{primary}</Button>
      {kind === "2_TextOnly" && text && <Button type={secondaryType} fullWidth>{text}</Button>}
    </div>
  );
}
