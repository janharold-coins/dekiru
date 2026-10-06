import { TitleCage } from "../components/TitleCage";
import { t, noWrap } from "../tokens";
import type { CageLayout, PatternMeta } from "../types";

export interface SectionProps {
  level: 1 | 2;
  number: string;
  title: string;
  subtitle: string;
  parentTitle?: string; // level 2: the parent section's name
  figma?: {
    titleWeight?: number; subtitleLineHeight?: number; subtitleTracking?: number;
    titleTop?: number; subtitleTop?: number; cage?: CageLayout | null;
  };
}

export const sectionMeta: PatternMeta = {
  id: "section", name: "Section divider", shape: "chrome",
  description: "Opens a section. Level 1: ghost number + caged title. Level 2: parent label eyebrow + sub-section title.",
  defaultChrome: { background: "dark", overlay: true, logo: "white", footer: "bottom-left", accentBar: false },
  budgets: [{ slot: "title", maxChars: 26, maxLines: 2 }, { slot: "subtitle", maxChars: 70, maxLines: 2 }],
};

export function Section(p: SectionProps) {
  return p.level === 2 ? <SectionL2 {...p} /> : <SectionL1 {...p} />;
}

function SectionL1({ number, title, subtitle, figma = {} }: SectionProps) {
  const lines = title.split("\n").length;
  const titleTop = figma.titleTop ?? (lines > 1 ? 357 : 432);
  const subLh = figma.subtitleLineHeight ?? 1.15;
  const subtitleTop = figma.subtitleTop ?? titleTop + lines * 138 + 18;
  return (
    <>
      <span style={{ position: "absolute", left: 103, top: titleTop, ...t(120, 1.15, -3.6, 400, "#fff", "everett"), opacity: 0.2, ...noWrap }}>{number}</span>
      <TitleCage
        text={title}
        left={279}
        top={titleTop}
        fontSize={120}
        bleedX={-40}
        textStyle={t(120, 1.15, -3.6, figma.titleWeight ?? 500, "#fff")}
        layout={figma.cage}
      />
      <p style={{ position: "absolute", left: 279, top: subtitleTop, margin: 0, ...t(64, subLh, figma.subtitleTracking ?? -1.92, 400, "#fff"), ...noWrap }}>{subtitle}</p>
    </>
  );
}

function SectionL2({ number, parentTitle, title, subtitle }: SectionProps) {
  const rule = "rgba(255,255,255,0.3)";
  const h = (y: number) => <div style={{ position: "absolute", left: 0, top: y - 0.5, width: 728, height: 0.5, background: rule }} />;
  const v = (x: number) => <div style={{ position: "absolute", left: x - 0.5, top: 252, width: 0.5, height: 70, background: rule }} />;
  return (
    <>
      <div aria-hidden>
        {h(265.5)}{h(292)}{h(311)}{v(159.5)}{v(728)}
      </div>
      <span style={{ position: "absolute", left: 71.5, top: 252.5, ...t(60, 1.15, -1.8, 400, "#fff", "everett"), opacity: 0.2, ...noWrap }}>{number}</span>
      <span style={{ position: "absolute", left: 159.5, top: 252.5, ...t(60, 1.15, -1.8, 400, "#fff"), opacity: 0.6, ...noWrap }}>{parentTitle}</span>
      <h1 style={{ position: "absolute", left: 150, top: 472, margin: 0, ...t(120, 1.15, -3.6, 600, "#fff"), ...noWrap }}>{title}</h1>
      <p style={{ position: "absolute", left: 150, top: 622, margin: 0, ...t(48, 1.4, -0.72, 400, "#fff"), ...noWrap }}>{subtitle}</p>
    </>
  );
}
