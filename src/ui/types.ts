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

/** One Figma set (or component) a coded component has been matched to. */
export interface FigmaSource {
  /** Library the main component lives in, as Figma names it. */
  library: string;
  /** Component set name in the library. */
  set: string;
  /** Component set key (from the library search); the stable identity across files. */
  setKey?: string;
  /** Main component node id as seen from a consuming file (from the Code Connect pass). */
  mainNode?: string;
  /** The same component's node id inside the library file that defines it. Where Code Connect is set. */
  libraryNode?: string;
  updatedAt?: string;
  /**
   * canonical: the source Dekiru considers current (one per component). candidate: also matched, not yet decided
   * (the app and web libraries both ship a Tag; the App library has two Button sets). retired: decided against.
   * Rule (Jan, 2026-11-04): one Dekiru component per real thing, whatever library it came from; keep every source,
   * decide in Dekiru's UI library page once it's known which is which. The audit treats an instance of any
   * non-retired source as Known and reports which source it hit.
   */
  status: "canonical" | "candidate" | "retired";
  note?: string;
  /** A render of the source from Figma (private/ui/sources/*.png, served to signed-in Studio users by /ui-assets), so people can see what they are deciding on. */
  preview?: string;
  /** Where to open it in Figma: the component/set when its node is known, else its library page. */
  url?: string;
}

/** Where a coded component came from: every Figma identity it answers to, one of them canonical. */
export interface FigmaOrigin {
  sources: FigmaSource[];
  /** Variant axes the set has, so the audit can map instance properties to props. */
  variants?: string[];
}

export const canonical = (o: FigmaOrigin) => o.sources.find((s) => s.status === "canonical") ?? o.sources[0];
