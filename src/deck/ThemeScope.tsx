import type { ReactNode } from "react";
import { themeStyle, type ThemeTokens } from "./theme";

/** Every slide inside takes this theme (CSS variables; the wrapper itself adds no box). */
export function ThemeScope({ tokens, children }: { tokens: Partial<ThemeTokens> | null | undefined; children: ReactNode }) {
  return <div style={{ ...themeStyle(tokens), display: "contents" }}>{children}</div>;
}
