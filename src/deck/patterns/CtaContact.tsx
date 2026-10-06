import { TitleCage } from "../components/TitleCage";
import { t, noWrap } from "../tokens";
import type { CageLayout, PatternMeta } from "../types";

export interface CtaContactProps {
  title: string;
  subtitle: string;
  contacts: { label: string; email: string }[];
  figma?: { cage?: CageLayout | null };
}

export const ctaMeta: PatternMeta = {
  id: "cta-contact", name: "Call to action", shape: "statement",
  description: "Caged headline and next step left; contact blocks (label + email) right.",
  defaultChrome: { background: "dark-navy", overlay: true, logo: "white", footer: "bottom-left", accentBar: false },
  budgets: [{ slot: "title", maxChars: 30, maxLines: 2 }, { slot: "contacts", maxItems: 3 }, { slot: "contact.label", maxChars: 64, maxLines: 2 }],
};

const FIGMA_LABEL_TOPS = [343, 653];
const FIGMA_EMAIL_TOPS = [449, 718];

export function CtaContact({ title, subtitle, contacts, figma }: CtaContactProps) {
  const lines = title.split("\n").length;
  return (
    <>
      <TitleCage text={title} left={151} top={310} fontSize={120} bleedX={-168} textStyle={t(120, 1.15, -3.6, 500, "#fff")} layout={figma?.cage} />
      <p style={{ position: "absolute", left: 151, top: 310 + lines * 138 + 53, margin: 0, ...t(48, 1.4, -1.44, 400, "#fff"), ...noWrap }}>{subtitle}</p>
      {contacts.length === 2 ? (
        contacts.map((c, i) => (
          <div key={i}>
            <p style={{ position: "absolute", left: 1078, top: FIGMA_LABEL_TOPS[i], width: 554, margin: 0, ...t(36, 1.15, -1.08, 400, "#fff") }}>{c.label}</p>
            <p style={{ position: "absolute", left: 1078, top: FIGMA_EMAIL_TOPS[i], margin: 0, ...t(48, 1.4, -1.44, 700, "#efa023"), ...noWrap }}>{c.email}</p>
          </div>
        ))
      ) : (
        <div style={{ position: "absolute", left: 1078, top: 540, transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 64 }}>
          {contacts.map((c, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 23 }}>
              <p style={{ margin: 0, width: 554, ...t(36, 1.15, -1.08, 400, "#fff") }}>{c.label}</p>
              <p style={{ margin: 0, ...t(48, 1.4, -1.44, 700, "#efa023"), ...noWrap }}>{c.email}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
