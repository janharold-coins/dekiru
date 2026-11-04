import type { FigmaOrigin } from "../types";

/**
 * Foundation Library V2 → "1 Color" icon set (Name × Form). One component, the icon chosen by `name`.
 * SVGs are the library's own, exported from the screen (public/ui/icons); add a file per new name met.
 */
export const iconOrigin: FigmaOrigin = {
  variants: ["Name", "Form"],
  sources: [{ status: "canonical", library: "Foundation Library V2", set: "1 Color", setKey: "36332540b928ba2ac21f1e722d25fe393db0941f", mainNode: "20074:18651", libraryNode: "1:595" }],
};

export const ICONS = {
  Locked: "/ui/icons/locked-outline.svg",
  ChevronDown: "/ui/icons/chevron-down.svg",
  ChevronUp: "/ui/icons/chevron-down.svg", // the design flips the down chevron (scaleY -1)
  Check: "/ui/icons/check.svg",
  IdCard: "/ui/icons/id-card.svg",
  Selfie: "/ui/icons/selfie.svg",
  Income: "/ui/icons/income.svg",
} as const;
export type IconName = keyof typeof ICONS;

export interface IconProps { name: IconName; form?: "Outline"; size?: number }

export function Icon({ name, size = 16 }: IconProps) {
  const flip = name === "ChevronUp";
  // Income is a 15.45×17.24 glyph inside a 20px box in the design (inset 6.9% / 11.4%).
  const inset = name === "Income" ? { width: "77.3%", height: "86.2%" } : { width: "100%", height: "100%" };
  return (
    <span style={{ display: "inline-grid", placeItems: "center", width: size, height: size, flexShrink: 0, transform: flip ? "scaleY(-1)" : undefined }} data-icon={name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src={ICONS[name]} style={{ display: "block", ...inset }} />
    </span>
  );
}
