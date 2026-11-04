import { token, FONT_STACK } from "../tokens";
import type { FigmaOrigin } from "../types";

/**
 * ui-device: the phone's status bar. OS chrome that designers drop into mockups, not part of our design: Dekiru
 * draws it, never audits, maps or hands it off. Sources kept only so the audit recognises the instances on screens.
 * Two looks seen so far: 56px ("Status Bar 状态栏", 9:41, Cns Manrope) and 44px ("Status Bar", 9:55, Urbanist).
 */
export const statusBarOrigin: FigmaOrigin = {
  variants: ["Dark", "island"],
  sources: [
    { status: "canonical", library: "unknown (not App V2, Foundation V2 or Web Revamp V2)", set: "Status Bar 状态栏", mainNode: "2:18171", libraryNode: "3823:46707", preview: "/ui/sources/status-bar-56-kyc-20638-29176.png", url: "https://www.figma.com/design/sm9kOVLwixDucqoX7etLI4/KYC---KYB?node-id=20638-29176", note: "56px; first KYC screen" },
    { status: "candidate", library: "KYC - KYB (file-local?)", set: "Status Bar", mainNode: "20638:28683", preview: "/ui/sources/status-bar-44-kyc-21100-46630.png", url: "https://www.figma.com/design/sm9kOVLwixDucqoX7etLI4/KYC---KYB?node-id=21100-46630", note: "44px, no variant properties; Failed screen" },
    { status: "candidate", library: "[App] Component library V2", set: "Status Bar", setKey: "07d7a4c9dc45c0e4741bf130ae78cff437613098", updatedAt: "2026-10-25", url: "https://www.figma.com/design/praz6iby9CKDJfCBHew816/-App--Component-library-V2?node-id=24-10989" },
  ],
};

export interface StatusBarProps { dark?: boolean; island?: boolean; time?: string; height?: 56 | 44 }

export function StatusBar({ time, height = 56 }: StatusBarProps) {
  if (height === 44) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 44, padding: "12px 16px", boxSizing: "border-box", width: "100%", background: token("Fill/Page (0)") }}>
        <span style={{ width: 54, textAlign: "center", fontFamily: `Urbanist, ${FONT_STACK}`, fontWeight: 700, fontSize: 15, lineHeight: "18px", letterSpacing: -0.165, color: token("Text/Primary (950)") }}>{time ?? "9:55"}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src="/ui/chrome/status-right-44.svg" style={{ width: 67, height: 11.5 }} />
      </div>
    );
  }
  return (
    <div style={{ position: "relative", height: 56, width: "100%", overflow: "hidden" }}>
      <span style={{ position: "absolute", left: 33.6, top: 19.2, width: 51.84, textAlign: "center", fontFamily: FONT_STACK, fontWeight: 600, fontSize: 16.32, lineHeight: "21.12px", letterSpacing: -0.408, color: token("Core/Brand"), fontFeatureSettings: '"case" 1' }}>{time ?? "9:41"}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" src="/ui/chrome/status-right.svg" style={{ position: "absolute", right: 27.45, top: 22.3, width: 74.3, height: 13.2 }} />
    </div>
  );
}
