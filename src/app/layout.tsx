import type { Metadata } from "next";
import {
  DM_Sans, Encode_Sans_Semi_Expanded, Figtree, Fraunces, IBM_Plex_Sans, Inter, Manrope, Newsreader, Noto_Sans_SC, Noto_Sans_Thai,
  Playfair_Display, Plus_Jakarta_Sans, Source_Serif_4, Zalando_Sans, Zalando_Sans_Expanded,
} from "next/font/google";
import "./globals.css";
import { ThemeScript } from "./ThemeScript";
// Web fallback for the design font: slides use "Cns Manrope" (public/fonts); Google Manrope shows while it loads.
// Inter (--font-numeral) is the editor UI font, not a slide font.
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["200", "300", "400", "500", "600", "700", "800"] });
const numeral = Inter({ variable: "--font-numeral", subsets: ["latin"], weight: ["200", "300", "400", "500", "600", "700"] });
const encode = Encode_Sans_Semi_Expanded({ variable: "--font-encode", subsets: ["latin"], weight: ["400"] });
// App interface (header, decks home): Zalando Sans; the DEKIRU wordmark: Zalando Sans Expanded Black.
// Next has no fallback metrics for the Zalando families yet, so it can't build a size-matched fallback font
// (it warned on every request). Use a plain system fallback instead.
const zalando = Zalando_Sans({ variable: "--font-app", subsets: ["latin"], weight: ["400", "500", "600"], adjustFontFallback: false, fallback: ["system-ui", "sans-serif"] });
const wordmark = Zalando_Sans_Expanded({ variable: "--font-wordmark", subsets: ["latin"], weight: ["900"], adjustFontFallback: false, fallback: ["system-ui", "sans-serif"] });

// Script fonts for translated slides (the design fonts have no Chinese or Thai glyphs). Loaded by unicode
// range, so an English deck downloads none of them. Used after the design font: see src/deck/tokens.ts.
const notoSC = Noto_Sans_SC({ variable: "--font-noto-sc", subsets: ["latin"], weight: "variable", preload: false });
const notoThai = Noto_Sans_Thai({ variable: "--font-noto-thai", subsets: ["thai"], weight: "variable", preload: false });

// Fonts typography presets can choose (the approved list: src/deck/fonts.ts). Not preloaded: a page downloads
// one only when a slide on it uses it. Inter is above (--font-numeral).
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: "variable", preload: false });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: "variable", preload: false });
const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"], weight: "variable", preload: false });
const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: "variable", preload: false });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], weight: "variable", preload: false });
const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"], weight: "variable", preload: false });
const newsreader = Newsreader({ variable: "--font-newsreader", subsets: ["latin"], weight: "variable", preload: false });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], weight: "variable", preload: false });
const presetFonts = [dmSans, jakarta, figtree, plexSans, fraunces, sourceSerif, newsreader, playfair].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: "Dekiru",
  description: "Coins.ph deck builder",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the inline theme script sets data-theme on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${numeral.variable} ${encode.variable} ${zalando.variable} ${wordmark.variable} ${notoSC.variable} ${notoThai.variable} ${presetFonts}`}>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
