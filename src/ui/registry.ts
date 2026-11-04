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
}

/** Coded UI entries, by Dekiru id. The audit matches a screen's instances to these by Figma identity, never by name. */
export const ui: Record<string, UiEntry> = {
  "status-bar": { name: "Status bar", kind: "device", Component: StatusBar, figma: statusBarOrigin },
  "home-indicator": { name: "Home indicator", kind: "device", Component: HomeIndicator, figma: homeIndicatorOrigin },
  "top-bar": { name: "Top bar", kind: "component", Component: TopBar, figma: topBarOrigin },
  "coins-logo": { name: "Coins logo", kind: "component", Component: CoinsLogo, figma: coinsLogoOrigin },
  icon: { name: "Icon (1 Color)", kind: "component", Component: Icon, figma: iconOrigin },
  tag: { name: "Tag", kind: "component", Component: Tag, figma: tagOrigin },
  button: { name: "Button", kind: "component", Component: Button, figma: buttonOrigin },
  bottom: { name: "Bottom", kind: "component", Component: Bottom, figma: bottomOrigin },
  "verification-level-card": { name: "Verification level card", kind: "pattern", Component: VerificationLevelCard, figma: verificationLevelCardOrigin },
};

const live = (e: UiEntry) => e.figma.sources.filter((s) => s.status !== "retired");

/** Registry id for a Figma main-component node, through any non-retired source. */
export const byMainNode = (node: string) => Object.entries(ui).find(([, e]) => live(e).some((s) => s.mainNode === node))?.[0];

/** Registry id for a Figma component-set key, through any non-retired source. */
export const bySetKey = (key: string) => Object.entries(ui).find(([, e]) => live(e).some((s) => s.setKey === key))?.[0];
