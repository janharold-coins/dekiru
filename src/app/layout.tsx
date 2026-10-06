import type { Metadata } from "next";
import { Encode_Sans_Semi_Expanded, Inter, Manrope } from "next/font/google";
import "./globals.css";

// Web fallbacks for the design fonts. If "Cns Manrope" / "TWK Everett" are installed
// on the viewer's machine they win (see src/deck/tokens.ts font stacks).
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["200", "300", "400", "500", "600", "700", "800"] });
const numeral = Inter({ variable: "--font-numeral", subsets: ["latin"], weight: ["200", "300", "400", "500", "700"] });
const encode = Encode_Sans_Semi_Expanded({ variable: "--font-encode", subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  title: "Dekiru",
  description: "Coins.ph deck builder",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${numeral.variable} ${encode.variable}`}>
      <body>{children}</body>
    </html>
  );
}
