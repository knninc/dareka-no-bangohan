/**
 * 「食事バランスガイド」（厚生労働省・農林水産省）の料理区分と1日分の適量。
 * 出典：農林水産省「食事バランスガイド」「適量と料理区分」（ページで確認した値だけを書く）。
 */
import type { FoodName } from './foods';

export type GroupKey = 'staple' | 'side' | 'main' | 'milk' | 'fruit';
export type Tier = 'low' | 'base' | 'high';

export interface Group {
  key: GroupKey;
  name: string;
  /** 表の見出し用の短い名前 */
  short: string;
  sub: string;
  /** 文字色（紙の上で読める色） */
  color: string;
  /** 1つ（SV）の基準 */
  basis: string;
  /** 基本形の1日分を、身近な量で言うと */
  hint: string;
  icons: FoodName[];
  sv: Record<Tier, string>;
  /** 範囲（図の目盛り用） */
  range: Record<Tier, [number, number]>;
}

export const GROUPS: Group[] = [
  {
    key: 'staple', name: '主食', short: '主食', sub: 'ごはん・パン・麺', color: 'var(--g-past)',
    basis: '炭水化物 約40g', hint: 'ごはん（中盛り）なら4杯程度', icons: ['rice', 'bread', 'noodles'],
    sv: { low: '4〜5', base: '5〜7', high: '6〜8' }, range: { low: [4, 5], base: [5, 7], high: [6, 8] },
  },
  {
    key: 'side', name: '副菜', short: '副菜', sub: '野菜・きのこ・いも・海藻の料理', color: 'var(--g-fantasy)',
    basis: '主材料 約70g', hint: '野菜料理5皿程度', icons: ['salad', 'ohitashi', 'miso'],
    sv: { low: '5〜6', base: '5〜6', high: '6〜7' }, range: { low: [5, 6], base: [5, 6], high: [6, 7] },
  },
  {
    key: 'main', name: '主菜', short: '主菜', sub: '肉・魚・卵・大豆の料理', color: 'var(--shu-text)',
    basis: 'たんぱく質 約6g', hint: '肉・魚・卵・大豆料理から3皿程度', icons: ['fish', 'egg', 'tofu'],
    sv: { low: '3〜4', base: '3〜5', high: '4〜6' }, range: { low: [3, 4], base: [3, 5], high: [4, 6] },
  },
  {
    key: 'milk', name: '牛乳・乳製品', short: '牛乳', sub: '牛乳・ヨーグルト・チーズ', color: 'var(--ai)',
    basis: 'カルシウム 約100mg', hint: '牛乳なら1本程度', icons: ['milkbottle', 'yogurt', 'cheese'],
    sv: { low: '2', base: '2', high: '2〜3' }, range: { low: [2, 2], base: [2, 2], high: [2, 3] },
  },
  {
    key: 'fruit', name: '果物', short: '果物', sub: '', color: 'var(--g-faith)',
    basis: '果物 約100g', hint: 'みかんなら2個程度', icons: ['mikan', 'apple', 'grapes'],
    sv: { low: '2', base: '2', high: '2〜3' }, range: { low: [2, 2], base: [2, 2], high: [2, 3] },
  },
];

export const groupBy = (k: GroupKey) => GROUPS.find((g) => g.key === k)!;
