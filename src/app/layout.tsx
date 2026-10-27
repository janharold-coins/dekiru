import type { Metadata } from "next";
import { Encode_Sans_Semi_Expanded, Inter, Manrope, Noto_Sans_SC, Noto_Sans_Thai, Zalando_Sans, Zalando_Sans_Expanded } from "next/font/google";
import "./globals.css";

// Web fallbacks for the design fonts. If "Cns Manrope" / "TWK Everett" are installed
// on the viewer's machine they win (see src/deck/tokens.ts font stacks).
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["200", "300", "400", "500", "600", "700", "800"] });
const numeral = Inter({ variable: "--font-numeral", subsets: ["latin"], weight: ["200", "300", "400", "500", "600", "700"] });
const encode = Encode_Sans_Semi_Expanded({ variable: "--font-encode", subsets: ["latin"], weight: ["400"] });
// App interface (header, decks home): Zalando Sans; the DEKIRU wordmark: Zalando Sans Expanded Black.
const zalando = Zalando_Sans({ variable: "--font-app", subsets: ["latin"], weight: ["400", "500", "600"] });
const wordmark = Zalando_Sans_Expanded({ variable: "--font-wordmark", subsets: ["latin"], weight: ["900"] });

// Script fonts for translated slides (the design fonts have no Chinese or Thai glyphs). Loaded by unicode
// range, so an English deck downloads none of them. Used after the design font: see src/deck/tokens.ts.
const notoSC = Noto_Sans_SC({ variable: "--font-noto-sc", subsets: ["latin"], weight: "variable", preload: false });
const notoThai = Noto_Sans_Thai({ variable: "--font-noto-thai", subsets: ["thai"], weight: "variable", preload: false });

export const metadata: Metadata = {
  title: "Dekiru",
  description: "Coins.ph deck builder",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${numeral.variable} ${encode.variable} ${zalando.variable} ${wordmark.variable} ${notoSC.variable} ${notoThai.variable}`}>
      <body>{children}</body>
    </html>
  );
}
