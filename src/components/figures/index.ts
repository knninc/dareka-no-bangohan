/**
 * コラムの図版。本文に `::fig <名前>` と1行だけ書くと、その位置に入る。
 * frontmatter の `hero` に名前を書くと、扉に入る。
 */
import HeroTray from './HeroTray.astro';
import BalanceDay from './BalanceDay.astro';
import Servings from './Servings.astro';
import WhoChart from './WhoChart.astro';
import DayPlan from './DayPlan.astro';
import Protein from './Protein.astro';
import SaltMeter from './SaltMeter.astro';
import Interactions from './Interactions.astro';
import Errata from './Errata.astro';

export const FIGURES = {
  'hero-tray': HeroTray,
  balance: BalanceDay,
  servings: Servings,
  who: WhoChart,
  day: DayPlan,
  protein: Protein,
  salt: SaltMeter,
  interactions: Interactions,
  errata: Errata,
} as const;

export type FigureName = keyof typeof FIGURES;
export const isFigureName = (s: string): s is FigureName => s in FIGURES;
