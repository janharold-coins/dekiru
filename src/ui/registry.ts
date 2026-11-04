import type { ComponentType } from "react";
import type { FigmaOrigin } from "./types";
import { Bottom, bottomOrigin } from "./components/Bottom";
import { Button, buttonOrigin } from "./components/Button";
import { CoinsLogo, coinsLogoOrigin } from "./components/CoinsLogo";
import { HomeIndicator, homeIndicatorOrigin } from "./components/HomeIndicator";
import { Icon, iconOrigin } from "./components/Icon";
import { StatusBar, statusBarOrigin } from "./components/StatusBar";
import { Tag, tagOrigin } from "./components/Tag";
import { TopBar, topBarOrigin } from "./components/TopBar";
import { VerificationLevelCard, verificationLevelCardOrigin } from "./patterns/VerificationLevelCard";

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * component: a library component, coded once from Figma, keyed by its Figma sources.
 * pattern: a repeated arrangement built from components (a file-local set, or a copied frame).
 * device: OS chrome beyond our design (status bar, home indicator, the system keyboard): Dekiru draws it as frame
 *         chrome; it is never audited against the libraries, mapped with Code Connect, or handed off.
 */
export type UiKind = "component" | "pattern" | "device";

export interface UiEntry {
  name: string;
  kind: UiKind;
  Component: ComponentType<any>;
  figma: FigmaOrigin;
  /** Props for a representative render of the entry (the library page shows Dekiru's own version beside Figma's). */
  example: Record<string, unknown>;
}

/** Coded UI entries, by Dekiru id. The audit matches a screen's instances to these by Figma identity, never by name. */
export const ui: Record<string, UiEntry> = {
  "status-bar": { name: "Status bar", kind: "device", Component: StatusBar, figma: statusBarOrigin, example: {} },
  "home-indicator": { name: "Home indicator", kind: "device", Component: HomeIndicator, figma: homeIndicatorOrigin, example: {} },
  "top-bar": { name: "Top bar", kind: "component", Component: TopBar, figma: topBarOrigin, example: { left: true, title: "Title" } },
  "coins-logo": { name: "Coins logo", kind: "component", Component: CoinsLogo, figma: coinsLogoOrigin, example: {} },
  icon: { name: "Icon (1 Color)", kind: "component", Component: Icon, figma: iconOrigin, example: { name: "Locked", size: 24 } },
  tag: { name: "Tag", kind: "component", Component: Tag, figma: tagOrigin, example: { children: "Level 1" } },
  button: { name: "Button", kind: "component", Component: Button, figma: buttonOrigin, example: { children: "Button", fullWidth: true } },
  bottom: { name: "Bottom", kind: "component", Component: Bottom, figma: bottomOrigin, example: { primary: "Primary", secondaryLead: "Lead", secondaryLink: "Text-only link" } },
  "verification-level-card": {
    name: "Verification level card", kind: "pattern", Component: VerificationLevelCard, figma: verificationLevelCardOrigin,
    example: { level: "L1", status: "Active", expanded: true, tag: "Level 1", title: "Basic verification", description: "1-2 mins to kickstart your crypto and daily payments journey.", requirements: [{ icon: "IdCard", text: "Basic info" }, { icon: "Selfie", text: "Quick selfie check" }], unlocks: [{ label: "Cash in", amount: "₱10,000/day" }, { label: "Scan to pay" }] },
  },
};

const live = (e: UiEntry) => e.figma.sources.filter((s) => s.status !== "retired");

/** Registry id for a Figma main-component node, through any non-retired source. */
export const byMainNode = (node: string) => Object.entries(ui).find(([, e]) => live(e).some((s) => s.mainNode === node))?.[0];

/** Registry id for a Figma component-set key, through any non-retired source. */
export const bySetKey = (key: string) => Object.entries(ui).find(([, e]) => live(e).some((s) => s.setKey === key))?.[0];
