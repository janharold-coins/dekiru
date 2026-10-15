/* Shared slide chrome: background, BG blobs, logo, confidentiality footer, accent bar. */
import { DEFAULT_TOKENS, onBg, VAR } from "../theme";
import { backgrounds, t, type BackgroundVariant } from "../tokens";
import { Glow } from "./Glow";
import type { FooterPosition, LogoVariant } from "../types";

const abs = { position: "absolute" } as const;

export function Background({ variant, overlay, opacity = 1 }: { variant: BackgroundVariant; overlay: boolean; opacity?: number }) {
  return (
    <>
      {/* The deck's theme sets these variables; without one, the approved look. */}
      <div style={{ ...abs, inset: 0, backgroundImage: `var(${VAR.bg(variant)}, ${backgrounds[variant]})` }} />
      {overlay && <Glow opacity={opacity} />}
    </>
  );
}

const LOGOS: Record<LogoVariant, { src: string; left: number; top: number; w: number; h: number }> = {
  "white-lg": { src: "/figma/shared/logo-white.svg", left: 80.125, top: 82, w: 299.41, h: 71.0006 },
  white: { src: "/figma/shared/logo-white-sm.svg", left: 79, top: 125, w: 220.725, h: 52.3417 },
  dark: { src: "/figma/shared/logo-dark.svg", left: 79, top: 125, w: 220.725, h: 52.3417 },
};

/** The other logo colour, for when the theme switches the slide's text tone (same size and place). */
const ALT_SRC: Record<LogoVariant, string> = {
  "white-lg": "/figma/shared/logo-dark.svg", white: "/figma/shared/logo-dark.svg", dark: "/figma/shared/logo-white-sm.svg",
};

export function Logo({ variant }: { variant: LogoVariant }) {
  const l = LOGOS[variant];
  const box = { ...abs, left: l.left, top: l.top, width: l.w, height: l.h };
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="coins.ph" src={l.src} style={{ ...box, display: "var(--dk-flip-logo-designed, block)" }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="" aria-hidden src={ALT_SRC[variant]} style={{ ...box, display: "var(--dk-flip-logo-alt, none)" }} />
    </>
  );
}

const FOOTER_POS: Record<FooterPosition, { left: number; top: number }> = {
  cover: { left: 81, top: 981 },
  "bottom-left": { left: 79, top: 938 },
  "top-right": { left: 1417, top: 74 },
};

export function Footer({ position, onDark }: { position: FooterPosition; onDark: boolean }) {
  return (
    <p
      style={{
        ...abs,
        ...FOOTER_POS[position],
        margin: 0,
        whiteSpace: "nowrap",
        ...t(24, "normal", 2.4, 400, onDark ? "#ffffff" : "#000000"),
      }}
    >
      Strictly Private And Confidential
    </p>
  );
}

/** Blue → navy → orange rule flush with the bottom of light slides. */
export function AccentBar() {
  const bar = (left: number, width: number, bg: string) => (
    <div style={{ ...abs, top: 0, left, width, height: 11, background: bg }} />
  );
  return (
    <div style={{ ...abs, left: 0, top: 1069, width: 1920, height: 11 }}>
      {bar(0, 1920, `var(${VAR.accent(0)}, ${DEFAULT_TOKENS.accent[0]})`)}
      {bar(464, 1432, `var(${VAR.accent(1)}, ${DEFAULT_TOKENS.accent[1]})`)}
      {bar(867, 968, `var(${VAR.accent(2)}, ${DEFAULT_TOKENS.accent[2]})`)}
    </div>
  );
}

/** Merchant co-brand logo — fixed slot, cover and closing only. Sits right of the Coins logo. */
export function CoBrandLogo({ src, onDark, large }: { src: string; onDark: boolean; large: boolean }) {
  const pos = large ? { left: 410, top: 79.5 } : { left: 330, top: 113 };
  return (
    <div style={{ ...abs, ...pos, height: 76, display: "flex", alignItems: "center", gap: 28 }}>
      <span style={{ width: 2, height: 52, background: onBg(onDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.3)", "rule") }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="Partner logo" src={src} style={{ maxHeight: 64, maxWidth: 280, objectFit: "contain" }} />
    </div>
  );
}
