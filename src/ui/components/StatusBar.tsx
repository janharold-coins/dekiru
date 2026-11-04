import { token, FONT_STACK } from "../tokens";
import type { FigmaOrigin } from "../types";

/**
 * ui-device: the phone's status bar ("Status Bar 状态栏" in Figma: "ios时间栏"). OS chrome that designers drop into
 * mockups, not part of our design: Dekiru draws it, never audits, maps or hands it off. Sources kept only so the
 * audit recognises the instances on screens.
 */
export const statusBarOrigin: FigmaOrigin = {
  variants: ["Dark", "island"],
  sources: [
    { status: "canonical", library: "unknown (not App V2, Foundation V2 or Web Revamp V2)", set: "Status Bar 状态栏", mainNode: "2:18171", libraryNode: "3823:46707" },
    { status: "candidate", library: "[App] Component library V2", set: "Status Bar", setKey: "07d7a4c9dc45c0e4741bf130ae78cff437613098", updatedAt: "2026-10-25" },
  ],
};

export interface StatusBarProps { dark?: boolean; island?: boolean; time?: string }

export function StatusBar({ time = "9:41" }: StatusBarProps) {
  return (
    <div style={{ position: "relative", height: 56, width: "100%", overflow: "hidden" }}>
      <span style={{ position: "absolute", left: 33.6, top: 19.2, width: 51.84, textAlign: "center", fontFamily: FONT_STACK, fontWeight: 600, fontSize: 16.32, lineHeight: "21.12px", letterSpacing: -0.408, color: token("Core/Brand"), fontFeatureSettings: '"case" 1' }}>{time}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src="/ui/chrome/status-right.svg" style={{ position: "absolute", right: 27.45, top: 22.3, width: 74.3, height: 13.2 }} />
    </div>
  );
}
