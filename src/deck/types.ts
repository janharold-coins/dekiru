import type { BackgroundVariant } from "./tokens";

export type LogoVariant = "white-lg" | "white" | "dark";
export type FooterPosition = "cover" | "bottom-left" | "top-right";

/** Per-slide chrome. Patterns supply defaults; a slide may override any field. */
export interface Chrome {
  background: BackgroundVariant;
  overlay: boolean; // the blurred blue/orange "BG" blobs
  overlayOpacity?: number; // 1 by default
  logo: LogoVariant | null;
  footer: FooterPosition | null;
  accentBar: boolean;
  coBrandLogo?: string | null; // merchant logo (cover & closing only)
}

export interface SlideData<P = Record<string, unknown>> {
  id: string;
  pattern: string;
  props: P;
  chrome?: Partial<Chrome>;
  /** Kept in the deck (and the library) but skipped when presenting or sharing. */
  hidden?: boolean;
  source?: { figmaNode?: string; visualNode?: string; slide?: number };
  /** Set when the slide is shared from another master deck ("sales/s01"); edit it there. */
  ref?: string;
}

export interface Deck {
  id: string;
  title: string;
  version?: string;
  slides: SlideData[];
}

/** Title "type cage" — the hairline guides drawn around big titles (section L1, CTA, closing). */
export interface CageLayout {
  x: number; // where the horizontal rules start (bleeds off the left edge)
  width: number;
  ys: number[]; // y of each horizontal rule (rule occupies [y - stroke, y])
  stroke: number;
  vLeft?: { x: number; top: number; height: number } | null;
  vRight?: { x: number; top: number; height: number }[];
}

/** Character budgets per slot — used to flag overflow (never to block). */
export interface SlotBudget {
  slot: string;
  maxChars?: number;
  maxLines?: number;
  maxItems?: number;
}

export interface PatternMeta {
  id: string;
  name: string;
  description: string;
  shape?: "sequence" | "set" | "hierarchy" | "comparison" | "statement" | "chrome";
  defaultChrome: Chrome;
  budgets?: SlotBudget[];
}
