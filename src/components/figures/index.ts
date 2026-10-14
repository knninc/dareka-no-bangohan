/**
 * コラムの図版。本文に `::fig <名前>` と1行だけ書くと、その位置に入る。
 * frontmatter の `hero` に名前を書くと、扉に入る。
 */
import HeroReach from './HeroReach.astro';
import ReachFlow from './ReachFlow.astro';
import NutrientBoxes from './NutrientBoxes.astro';
import PfcBars from './PfcBars.astro';
import RiskCurve from './RiskCurve.astro';
import Interactions from './Interactions.astro';
import SaltMeter from './SaltMeter.astro';
import Errata from './Errata.astro';

export const FIGURES = {
  'hero-reach': HeroReach,
  flow: ReachFlow,
  nutrients: NutrientBoxes,
  pfc: PfcBars,
  risk: RiskCurve,
  interactions: Interactions,
  salt: SaltMeter,
  errata: Errata,
} as const;

export type FigureName = keyof typeof FIGURES;
export const isFigureName = (s: string): s is FigureName => s in FIGURES;
