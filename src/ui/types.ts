/**
 * UI screens are data (like decks): a tree of nodes. A node is either a layout (`Stack`, `Text`) or a component
 * from src/ui/registry.ts (keyed by its Figma identity) with props taken from the Figma instance's overrides.
 */
export interface Node {
  /** "Stack" | "Text" | a registry id such as "button", "verification-level-card". */
  component: string;
  props?: Record<string, unknown>;
  children?: Node[];
  /** The Figma node this came from, for the compare view and the audit. */
  figma?: string;
}

export interface Screen {
  id: string;
  title: string;
  figma: { file: string; node: string; name: string };
  device: { width: number; height: number };
  tree: Node;
}

/** Where a coded component came from: the Figma identity the audit matches on. */
export interface FigmaOrigin {
  /** Library the main component lives in, as Figma names it. */
  library: string;
  /** Component set name in the library. */
  set: string;
  /** Component set key (from the library search); the stable identity across files. */
  setKey?: string;
  /** Main component node id as seen from the screen's file (from the Code Connect pass). */
  mainNode?: string;
  /** The same component's node id inside the library file that defines it (Figma reports it when a mapping is attempted from a consuming file). Where Code Connect is set. */
  libraryNode?: string;
  /** Variant axes the set has, so the audit can map instance properties to props. */
  variants?: string[];
}
