import { TitleCage } from "../components/TitleCage";
import { t } from "../tokens";
import type { CageLayout, PatternMeta } from "../types";

export interface ClosingProps { title: string; figma?: { cage?: CageLayout | null } }

export const closingMeta: PatternMeta = {
  id: "closing", name: "Closing", shape: "chrome",
  description: "Dark gradient with an oversized, caged sign-off.",
  defaultChrome: { background: "dark-navy", overlay: true, logo: "white", footer: "bottom-left", accentBar: false },
  budgets: [{ slot: "title", maxChars: 12, maxLines: 1 }],
};

export function Closing({ title, figma }: ClosingProps) {
  return (
    <TitleCage text={title} left={253} top={421} fontSize={240} bleedX={-385} stroke={2} extend={400} textStyle={t(240, 1.15, -7.2, 400, "#fff")} layout={figma?.cage} />
  );
}
