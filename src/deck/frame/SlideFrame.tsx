import type { ReactNode } from "react";
import { AccentBar, Background, CoBrandLogo, Footer, Logo } from "../chrome/Chrome";
import type { Chrome } from "../types";

/**
 * A 1920×1080 slide in design pixels. Paint order:
 * background → BG blobs → pattern content → logo / footer → accent bar → `top` layer.
 */
export function SlideFrame({ chrome, children, top }: { chrome: Chrome; children: ReactNode; top?: ReactNode }) {
  const onDark = chrome.background !== "light";
  return (
    <div
      className="dk-slide"
      style={{ position: "relative", width: 1920, height: 1080, overflow: "hidden", isolation: "isolate" }}
    >
      <Background variant={chrome.background} overlay={chrome.overlay} opacity={chrome.overlayOpacity} />
      {children}
      {chrome.logo && <Logo variant={chrome.logo} />}
      {chrome.coBrandLogo && <CoBrandLogo src={chrome.coBrandLogo} onDark={onDark} large={chrome.logo === "white-lg"} />}
      {chrome.footer && <Footer position={chrome.footer} onDark={onDark} />}
      {chrome.accentBar && <AccentBar />}
      {top}
    </div>
  );
}
