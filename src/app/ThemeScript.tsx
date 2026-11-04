"use client";
import { themeScript } from "./theme-script";

/**
 * The saved Light/Dark choice, applied before the page paints. The server sends a plain script, which the browser
 * runs at once. If React ever creates this element in the browser (a browser extension that edits <head> makes it
 * re-render), it's a data block instead: the theme is already set by then, and React only warns about real scripts.
 */
export function ThemeScript() {
  const server = typeof window === "undefined";
  return <script suppressHydrationWarning type={server ? undefined : "text/plain"} dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
