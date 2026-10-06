/* One partner logo in a fixed box. Modes: fill (SVG at size), cover, crop (Figma image crop), chip (white pill). */
export interface LogoData {
  name: string; file: string; w: number; h: number;
  fit?: "fill" | "cover"; objectPosition?: string;
  crop?: { w: string; h: string; left: string; top: string };
  chip?: { w: number; h: number; bg: string; radius: number; padding: number };
  /** Multi-part logos (icon + wordmark): image parts with Figma crops, or text parts. */
  composite?: CompositePart[];
}
export type CompositePart =
  | { file: string; x: number; y: number; w: number; h: number; crop?: { w: string; h: string; left: string; top: string } }
  | { text: string; font: string; weight: number; size: number; lineHeight: number; tracking: number; color: string; x: number; y: number };

export function LogoItem({ logo }: { logo: LogoData }) {
  if (logo.composite) {
    return (
      <div aria-label={logo.name} style={{ position: "relative", width: logo.w, height: logo.h, flexShrink: 0 }}>
        {logo.composite.map((part, i) =>
          "text" in part ? (
            <span key={i} style={{ position: "absolute", left: part.x, top: part.y, fontFamily: "var(--font-encode), sans-serif", fontWeight: part.weight, fontSize: part.size, lineHeight: part.lineHeight, letterSpacing: part.tracking, color: part.color, whiteSpace: "nowrap" }}>{part.text}</span>
          ) : (
            <div key={i} style={{ position: "absolute", left: part.x, top: part.y, width: part.w, height: part.h, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src={part.file} style={part.crop ? { position: "absolute", maxWidth: "none", width: part.crop.w, height: part.crop.h, left: part.crop.left, top: part.crop.top } : { width: "100%", height: "100%", display: "block" }} />
            </div>
          ),
        )}
      </div>
    );
  }
  const inner = (
    <div style={{ position: "relative", width: logo.w, height: logo.h, overflow: "hidden", flexShrink: 0 }}>
      {logo.crop ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={logo.name} src={logo.file} style={{ position: "absolute", maxWidth: "none", width: logo.crop.w, height: logo.crop.h, left: logo.crop.left, top: logo.crop.top }} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={logo.name} src={logo.file} style={{ display: "block", width: "100%", height: "100%", objectFit: logo.fit === "cover" ? "cover" : "fill", objectPosition: logo.objectPosition ?? "center" }} />
      )}
    </div>
  );
  if (!logo.chip) return inner;
  const c = logo.chip;
  return (
    <div style={{ width: c.w, height: c.h, background: c.bg, borderRadius: c.radius, padding: c.padding, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      {inner}
    </div>
  );
}
