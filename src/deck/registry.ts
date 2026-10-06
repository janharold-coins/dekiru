import type { ComponentType } from "react";
import type { PatternMeta } from "./types";
import { Agenda, agendaMeta } from "./patterns/Agenda";
import { CardGrid, cardGridMeta } from "./patterns/CardGrid";
import { Closing, closingMeta } from "./patterns/Closing";
import { Cover, coverMeta } from "./patterns/Cover";
import { CtaContact, ctaMeta } from "./patterns/CtaContact";
import { FeatureCards, FeatureCardsTop, featureCardsMeta } from "./patterns/FeatureCards";
import { KeyNumbers, keyNumbersMeta } from "./patterns/KeyNumbers";
import { LogoWall, logoWallMeta } from "./patterns/LogoWall";
import { ProductDetail, productDetailMeta } from "./patterns/ProductDetail";
import { ProductFlow, productFlowMeta } from "./patterns/ProductFlow";
import { ProductHero, productHeroMeta } from "./patterns/ProductHero";
import { ProductIndex, productIndexMeta } from "./patterns/ProductIndex";
import { Section, sectionMeta } from "./patterns/Section";
import { StatementHighlights, statementMeta } from "./patterns/StatementHighlights";
import { Timeline, timelineMeta } from "./patterns/Timeline";

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
