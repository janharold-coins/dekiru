import type { ComponentType } from "react";
import type { PatternMeta } from "./types";
import { Agenda, agendaMeta } from "./patterns/Agenda";
import { Bullets, bulletsMeta } from "./patterns/Bullets";
import { CardGrid, cardGridMeta } from "./patterns/CardGrid";
import { ClientQuote, clientQuoteMeta } from "./patterns/ClientQuote";
import { Closing, closingMeta } from "./patterns/Closing";
import { ColumnChart, columnChartMeta } from "./patterns/ColumnChart";
import { Cover, coverMeta } from "./patterns/Cover";
import { CtaContact, ctaMeta } from "./patterns/CtaContact";
import { DataTable, dataTableMeta } from "./patterns/DataTable";
import { DoDont, doDontMeta } from "./patterns/DoDont";
import { FeatureCards, FeatureCardsTop, featureCardsMeta } from "./patterns/FeatureCards";
import { KeyNumbers, keyNumbersMeta } from "./patterns/KeyNumbers";
import { LogoWall, logoWallMeta } from "./patterns/LogoWall";
import { ProductDetail, productDetailMeta } from "./patterns/ProductDetail";
import { ProductFlow, productFlowMeta } from "./patterns/ProductFlow";
import { ProductHero, productHeroMeta } from "./patterns/ProductHero";
import { ProductIndex, productIndexMeta } from "./patterns/ProductIndex";
import { Quiz, quizMeta } from "./patterns/Quiz";
import { ScreenshotWalkthrough, screenshotWalkthroughMeta } from "./patterns/ScreenshotWalkthrough";
import { Section, sectionMeta } from "./patterns/Section";
import { StatementHighlights, statementMeta } from "./patterns/StatementHighlights";
import { Timeline, timelineMeta } from "./patterns/Timeline";
import { ProsCons, prosConsMeta } from "./patterns/ProsCons";
import { Raci, raciMeta } from "./patterns/Raci";
import { StatusUpdate, statusUpdateMeta } from "./patterns/StatusUpdate";
import { Glossary, glossaryMeta } from "./patterns/Glossary";
import { Takeaways, takeawaysMeta } from "./patterns/Takeaways";
import { Objectives, objectivesMeta } from "./patterns/Objectives";
import { TeamIntro, teamIntroMeta } from "./patterns/TeamIntro";
import { Roadmap, roadmapMeta } from "./patterns/Roadmap";
import { Comparison, comparisonMeta } from "./patterns/Comparison";
import { Matrix, matrixMeta } from "./patterns/Matrix";
import { Scenario, scenarioMeta } from "./patterns/Scenario";
import { Faq, faqMeta } from "./patterns/Faq";
import { BeforeAfter, beforeAfterMeta } from "./patterns/BeforeAfter";
import { Persona, personaMeta } from "./patterns/Persona";
import { HeroNumber, heroNumberMeta } from "./patterns/HeroNumber";
import { Funnel, funnelMeta } from "./patterns/Funnel";
import { Checklist, checklistMeta } from "./patterns/Checklist";

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PatternEntry {
  meta: PatternMeta;
  Component: ComponentType<any>;
  Top?: ComponentType<any>; // painted above chrome (e.g. a coin over the logo)
}

export const patterns: Record<string, PatternEntry> = {
  cover: { meta: coverMeta, Component: Cover },
  agenda: { meta: agendaMeta, Component: Agenda },
  section: { meta: sectionMeta, Component: Section },
  "key-numbers": { meta: keyNumbersMeta, Component: KeyNumbers },
  timeline: { meta: timelineMeta, Component: Timeline },
  "logo-wall": { meta: logoWallMeta, Component: LogoWall },
  "statement-highlights": { meta: statementMeta, Component: StatementHighlights },
  "client-quote": { meta: clientQuoteMeta, Component: ClientQuote },
  "column-chart": { meta: columnChartMeta, Component: ColumnChart },
  bullets: { meta: bulletsMeta, Component: Bullets },
  "do-dont": { meta: doDontMeta, Component: DoDont },
  quiz: { meta: quizMeta, Component: Quiz },
  "data-table": { meta: dataTableMeta, Component: DataTable },
  "screenshot-walkthrough": { meta: screenshotWalkthroughMeta, Component: ScreenshotWalkthrough },
  "pros-cons": { meta: prosConsMeta, Component: ProsCons },
  raci: { meta: raciMeta, Component: Raci },
  "status-update": { meta: statusUpdateMeta, Component: StatusUpdate },
  glossary: { meta: glossaryMeta, Component: Glossary },
  takeaways: { meta: takeawaysMeta, Component: Takeaways },
  objectives: { meta: objectivesMeta, Component: Objectives },
  "team-intro": { meta: teamIntroMeta, Component: TeamIntro },
  roadmap: { meta: roadmapMeta, Component: Roadmap },
  comparison: { meta: comparisonMeta, Component: Comparison },
  matrix: { meta: matrixMeta, Component: Matrix },
  scenario: { meta: scenarioMeta, Component: Scenario },
  faq: { meta: faqMeta, Component: Faq },
  "before-after": { meta: beforeAfterMeta, Component: BeforeAfter },
  persona: { meta: personaMeta, Component: Persona },
  "hero-number": { meta: heroNumberMeta, Component: HeroNumber },
  funnel: { meta: funnelMeta, Component: Funnel },
  checklist: { meta: checklistMeta, Component: Checklist },
  "product-index": { meta: productIndexMeta, Component: ProductIndex },
  "product-hero": { meta: productHeroMeta, Component: ProductHero },
  "product-detail": { meta: productDetailMeta, Component: ProductDetail },
  "product-flow": { meta: productFlowMeta, Component: ProductFlow },
  "card-grid": { meta: cardGridMeta, Component: CardGrid },
  "feature-cards": { meta: featureCardsMeta, Component: FeatureCards, Top: FeatureCardsTop },
  "cta-contact": { meta: ctaMeta, Component: CtaContact },
  closing: { meta: closingMeta, Component: Closing },
};

export const patternOrder = Object.keys(patterns);
