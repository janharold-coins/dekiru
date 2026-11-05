"use client";
import { useState, type ReactNode } from "react";
import { effect, token, type } from "@/ui/tokens";
import { Icon, type IconName } from "@/ui/components/Icon";
import { Tag } from "@/ui/components/Tag";

/**
 * Proposed pattern (Studio, under review): Accordion card. Taken from its origin, the KYC verification level card
 * (src/ui/patterns/VerificationLevelCard.tsx, Figma file-local set "Component 2"), with everything KYC-specific
 * moved out: the header is an icon, a tag, a title and a description; the body is whatever goes inside.
 * Every style here is the origin's; nothing is added. Tones are the three the origin's Status variant draws:
 *   selected = Active (blue border, shadow) · muted = Inactive (grey, secondary text, dimmed tag)
 *   error = Failed (grey border, shadow, red description).
 * Interactive: the header is a button that opens and closes the card. `expanded` is where it starts.
 */
export type AccordionTone = "selected" | "muted" | "error";

export interface AccordionCardProps {
  tone?: AccordionTone;
  icon?: IconName;
  tag?: string;
  title: string;
  description?: string;
  /** Open when first drawn (the Figma frame's state); people can open and close it from there. */
  expanded?: boolean;
  /** Draws the chevron and opens on tap (the origin always does). Off for a plain card. */
  collapsible?: boolean;
  /** Width in px; the origin is 328 (a 360 screen less 16 each side). */
  width?: number | "100%";
  children?: ReactNode;
}

export function AccordionCard({ tone = "selected", icon, tag, title, description, expanded = false, collapsible = true, width = 328, children }: AccordionCardProps) {
  const [open, setOpen] = useState(expanded);
  const selected = tone === "selected";
  const error = tone === "error";
  const muted = tone === "muted";
  const hasBody = Boolean(children);
  const toggles = collapsible;
  return (
    <section style={{
      display: "flex", flexDirection: "column", gap: 16, width, boxSizing: "border-box", borderRadius: 8,
      padding: selected && open ? 16 : open ? "16px 16px 20px" : 16,
      background: token("Fill/Page (0)"), border: `1px solid ${selected ? token("Core/Blue") : token("Line/Strong")}`,
      boxShadow: selected || error ? effect("Light- Shadow 1") : undefined,
    }}>
      <button type="button" aria-expanded={toggles ? open : undefined} onClick={toggles ? () => setOpen((o) => !o) : undefined}
        className="ui-accordion-head"
        style={{ display: "flex", alignItems: "center", gap: 16, width: "100%", padding: 0, margin: 0, border: 0, background: "none", font: "inherit", color: "inherit", textAlign: "left", cursor: toggles ? "pointer" : "default" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          {icon && <Icon name={icon} size={24} />}
          <span style={{ display: "flex", flexDirection: "column", gap: selected ? 2 : 4, flex: 1, minWidth: 0 }}>
            <span style={{ display: "flex", flexDirection: "column", gap: selected ? 2 : 4, alignItems: "flex-start" }}>
              {tag && <Tag dimmed={muted}>{tag}</Tag>}
              <span style={{ ...type(muted ? "Line Auto/H4 16px-600" : "Web/Subtitle 16px-600"), color: muted ? token("Text/Secondary (500)") : token("Text/Primary (950)"), whiteSpace: "nowrap" }}>{title}</span>
            </span>
            {description && (
              <span style={{ ...type(error ? "Line 1.5x/Body 12px-500" : "Web/Subtext 12px-500"), color: error ? token("Core/Red") : muted ? token("Text/Secondary (500)") : token("Text/Subtitle (700)") }}>{description}</span>
            )}
          </span>
        </span>
        {toggles && <Icon name={open ? "ChevronUp" : "ChevronDown"} size={16} />}
      </button>
      {hasBody && (open || !toggles) && (
        <>
          <div style={{ height: 1, width: "100%", background: token("Line/Strong") }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>{children}</div>
        </>
      )}
    </section>
  );
}

/* Body pieces, from the origin's "Requirement:" and "Unlocks:" lists. */

const rowText = () => ({ ...type("Web/body 14px-500"), color: token("Text/Subtitle (700)"), whiteSpace: "nowrap" as const });

/** A labelled list inside the card: a bold label, then its rows 8 apart. */
export function ListSection({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <span style={{ ...type("Line Auto/Subtitle 14px-700"), color: token("Text/Primary (950)") }}>{label}</span>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

/** Icon + text row (the origin's requirements). */
export function IconRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
      <span style={{ display: "grid", placeItems: "center", width: 20, height: 20 }}><Icon name={icon} size={icon === "Income" ? 20 : 16} /></span>
      <span style={rowText()}>{text}</span>
    </div>
  );
}

/** Label, optional value on the right, optional check (the origin's unlocks). */
export function ValueRow({ label, value, check = true }: { label: string; value?: string; check?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: value ? 20 : 8, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 0 }}>
        <span style={rowText()}>{label}</span>
        {value && <span style={{ ...rowText(), textAlign: "right" }}>{value}</span>}
      </div>
      {check && <Icon name="Check" size={20} />}
    </div>
  );
}
