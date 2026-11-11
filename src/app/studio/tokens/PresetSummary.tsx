import { INKS } from "@/deck/ink";
import { typographyLabel, type ColorTokens, type PresetKind, type PresetTokens, type TypographyTokens } from "@/deck/presets";

/** What a preset sets, in a few words: its fonts, or swatches of the colours it changes. */
export function PresetSummary({ kind, tokens }: { kind: PresetKind; tokens: PresetTokens }) {
  if (kind === "typography") return <span className="muted">{typographyLabel(tokens as TypographyTokens)}</span>;
  const ink = (tokens as ColorTokens).ink;
  const set = INKS.filter((i) => ink[i.id]);
  if (!set.length) return <span className="muted">No colour changes yet</span>;
  return (
    <span className="muted" style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
      {set.map((i) => (
        <span key={i.id} title={`${i.name} ${ink[i.id]}`} aria-label={`${i.name} ${ink[i.id]}`}
          style={{ width: 14, height: 14, borderRadius: "50%", background: ink[i.id], boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }} />
      ))}
    </span>
  );
}
