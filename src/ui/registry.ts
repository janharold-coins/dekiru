import type { ComponentType } from "react";
import type { FigmaOrigin } from "./types";
import { Bottom, bottomOrigin } from "./components/Bottom";
import { Button, buttonOrigin } from "./components/Button";
import { CoinsLogo, coinsLogoOrigin } from "./components/CoinsLogo";
import { Icon, iconOrigin } from "./components/Icon";
import { StatusBar, statusBarOrigin } from "./components/StatusBar";
import { Tag, tagOrigin } from "./components/Tag";
import { TopBar, topBarOrigin } from "./components/TopBar";
import { VerificationLevelCard, verificationLevelCardOrigin } from "./patterns/VerificationLevelCard";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface UiEntry {
  name: string;
  kind: "component" | "pattern";
  Component: ComponentType<any>;
  figma: FigmaOrigin;
}

/**
 * Coded UI components and patterns, by Dekiru id. Each carries the Figma identity it was built from; the audit
 * matches a screen's instances to these by main-component node / set key, never by name.
 */
export const ui: Record<string, UiEntry> = {
  "status-bar": { name: "Status bar", kind: "component", Component: StatusBar, figma: statusBarOrigin },
  "top-bar": { name: "Top bar", kind: "component", Component: TopBar, figma: topBarOrigin },
  "coins-logo": { name: "Coins logo", kind: "component", Component: CoinsLogo, figma: coinsLogoOrigin },
  icon: { name: "Icon (1 Color)", kind: "component", Component: Icon, figma: iconOrigin },
  tag: { name: "Tag", kind: "component", Component: Tag, figma: tagOrigin },
  button: { name: "Button", kind: "component", Component: Button, figma: buttonOrigin },
  bottom: { name: "Bottom", kind: "component", Component: Bottom, figma: bottomOrigin },
  "verification-level-card": { name: "Verification level card", kind: "pattern", Component: VerificationLevelCard, figma: verificationLevelCardOrigin },
};

/** Registry id for a Figma main-component node (or an alias's), when we hold it. */
export const byMainNode = (node: string) =>
  Object.entries(ui).find(([, e]) => e.figma.mainNode === node || e.figma.aliases?.some((a) => a.mainNode === node))?.[0];

/** Registry id for a Figma component-set key (or an alias's), when we hold it. */
export const bySetKey = (key: string) =>
  Object.entries(ui).find(([, e]) => e.figma.setKey === key || e.figma.aliases?.some((a) => a.setKey === key))?.[0];
