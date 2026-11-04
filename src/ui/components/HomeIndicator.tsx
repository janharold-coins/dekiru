import type { FigmaOrigin } from "../types";

/**
 * ui-device: the iOS home indicator (the 100×4 bar at the bottom). In Figma it sits inside the "Bottom" component
 * as "Bottom Drawer"; in Dekiru it is device chrome, drawn after the design's footer.
 */
export const homeIndicatorOrigin: FigmaOrigin = {
  // No mainNode: the indicator is a child of the Bottom set (20587:26257), and that node must resolve to `bottom`.
  sources: [{ status: "canonical", library: "[App] Component library V2", set: "Bottom → Bottom Drawer (home indicator)", note: "child of the Bottom set, node 20587:26257", preview: "/ui/sources/bottom-app-3436-20116.png", url: "https://www.figma.com/design/praz6iby9CKDJfCBHew816/-App--Component-library-V2?node-id=3436-20116" }],
};

export function HomeIndicator() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "22px 0 8px", overflow: "hidden", background: "#fff" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src="/ui/chrome/home-indicator.svg" width={100} height={4} style={{ display: "block" }} />
    </div>
  );
}
