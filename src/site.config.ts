/**
 * サイト全体の設定。文言を変えたいときはここを編集する。
 */
export const SITE = {
  name: '週刊・誰かの晩ごはん',
  /** ロゴ・題字で使う分割表記 */
  masthead: { weekly: '週刊', title: '誰かの晩ごはん' },
  nameEn: 'Weekly Someone’s Dinner',
  copy: ['毎週、誰かの人生を、', '晩ごはんだけ借りてみる。'] as const,
  description:
    '毎週、誰かの人生を、晩ごはんだけ借りてみる。昔の人、遠い国の信仰、存在しない世界、疲れた現代人。誰かの食卓を想像して、実際に作って食べてみる、ふたりの週刊ウェブマガジン。',
  lang: 'ja',
  locale: 'ja_JP',
  themeColor: '#f4eee2',
  /**
   * 参加者の台所の表示名。個人名は載せない方針。
   * 写真の frontmatter では `kitchen: a` / `kitchen: b` で指定する。
   */
  kitchens: {
    a: '台所A',
    b: '台所B',
  },
} as const;

export type KitchenId = keyof typeof SITE.kitchens;
