import { effect, token, type } from "../tokens";
import type { FigmaOrigin } from "../types";
import { Icon, type IconName } from "../components/Icon";
import { Tag } from "../components/Tag";

/**
 * Pattern: the verification level card on the KYC screens. In Figma it is a file-local component set with Figma's
 * default name ("Component 2"), variants Style × Status × Type (L1/L2/L3) × Expand × Device. Built from library
 * components (Tag, 1 Color icons) plus layout; see docs/ui-audits/.
 *
 * Variants met so far: Status Active (blue border, shadow, dark text) · Inactive (grey border, secondary text, tag
 * dimmed) · Failed (grey border + shadow, red "Failed" icon, red description); Expand On (requirements + unlocks) ·
 * Off (header only).
 */
export const verificationLevelCardOrigin: FigmaOrigin = {
  variants: ["Style", "Status", "Type", "Expand", "Device"],
  sources: [{ status: "canonical", library: "KYC - KYB (file-local, unpublished)", set: "Component 2", mainNode: "21099:34179", preview: "/ui/sources/level-card-kyc-21099-34179.png", url: "https://www.figma.com/design/sm9kOVLwixDucqoX7etLI4/KYC---KYB?node-id=21099-34179" }],
};

export interface Requirement { icon: IconName; text: string }
export interface Unlock { label: string; amount?: string; done?: boolean }

export interface VerificationLevelCardProps {
  level: "L1" | "L2" | "L3";
  status?: "Active" | "Inactive" | "Failed";
  expanded?: boolean;
  tag: string;
  title: string;
  /** For Failed, the rejection reason (drawn in red). */
  description: string;
  requirements?: Requirement[];
  unlocks?: Unlock[];
}

export function VerificationLevelCard({ status = "Active", expanded = true, tag, title, description, requirements = [], unlocks = [] }: VerificationLevelCardProps) {
  const active = status === "Active";
  const failed = status === "Failed";
  const inactive = status === "Inactive";
  const bodyColor = token("Text/Subtitle (700)");
  const row = { display: "flex", alignItems: "center", gap: 8, width: "100%" } as const;
  const rowText = { ...type("Web/body 14px-500"), color: bodyColor, whiteSpace: "nowrap" } as const;
  return (
    <section style={{
      display: "flex", flexDirection: "column", gap: 16, width: 328, boxSizing: "border-box", padding: active && expanded ? 16 : expanded ? "16px 16px 20px" : 16, borderRadius: 8,
      background: token("Fill/Page (0)"), border: `1px solid ${active ? token("Core/Blue") : token("Line/Strong")}`,
      boxShadow: active || failed ? effect("Light- Shadow 1") : undefined,
    }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <Icon name={failed ? "Failed" : "Locked"} size={24} />
          <div style={{ display: "flex", flexDirection: "column", gap: active ? 2 : 4, flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: active ? 2 : 4, alignItems: "flex-start" }}>
              <Tag dimmed={inactive}>{tag}</Tag>
              <span style={{ ...type(active || failed ? "Web/Subtitle 16px-600" : "Line Auto/H4 16px-600"), color: inactive ? token("Text/Secondary (500)") : token("Text/Primary (950)"), whiteSpace: "nowrap" }}>{title}</span>
            </div>
            <span style={{ ...type(failed ? "Line 1.5x/Body 12px-500" : "Web/Subtext 12px-500"), color: failed ? token("Core/Red") : inactive ? token("Text/Secondary (500)") : bodyColor }}>{description}</span>
          </div>
        </div>
        <Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={16} />
      </header>
      {expanded && (
        <>
          <div style={{ height: 1, width: "100%", background: token("Line/Strong") }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ ...type("Line Auto/Subtitle 14px-700"), color: token("Text/Primary (950)") }}>Requirement:</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {requirements.map((r) => (
                  <div key={r.text} style={row}>
                    <span style={{ display: "grid", placeItems: "center", width: 20, height: 20 }}><Icon name={r.icon} size={r.icon === "Income" ? 20 : 16} /></span>
                    <span style={rowText}>{r.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <span style={{ ...type("Line Auto/Subtitle 14px-700"), color: token("Text/Primary (950)") }}>Unlocks:</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {unlocks.map((u) => (
                  <div key={u.label} style={{ ...row, gap: u.amount ? 20 : 8 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flex: 1, minWidth: 0 }}>
                      <span style={rowText}>{u.label}</span>
                      {u.amount && <span style={{ ...rowText, textAlign: "right" }}>{u.amount}</span>}
                    </div>
                    {u.done !== false && <Icon name="Check" size={20} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
