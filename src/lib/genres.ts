/**
 * 四つの食卓（ジャンル）。毎月この四つを巡る。
 * id はURLとコンテンツの frontmatter（genre:）で使う。
 */
export const GENRE_IDS = ['modern', 'past', 'fantasy', 'faith'] as const;
export type GenreId = (typeof GENRE_IDS)[number];

export interface Genre {
  id: GenreId;
  no: string;
  name: string;
  en: string;
  /** 印（一文字） */
  mark: string;
  /** ジャンルのインク（global.css の --g-* と同じ値。OGP画像で使う） */
  color: string;
  /** 短い説明 */
  lead: string;
  /** 編集の約束 */
  rule: string;
  /** テーマの例（開催済みの号ではない） */
  example: string;
}

export const GENRES: readonly Genre[] = [
  {
    id: 'modern',
    no: '01',
    name: '現代人',
    en: 'Modern Life',
    mark: '今',
    color: '#2a447e',
    lead: 'いまを生きる誰かの、今夜の食卓。',
    rule: '職業や国籍、性別で決めつけず、その人の暮らしの条件から食卓を想像する。',
    example: '終電で帰ってきた人の、日付が変わる前の夕食。',
  },
  {
    id: 'past',
    no: '02',
    name: '昔の人',
    en: 'Old Days',
    mark: '昔',
    color: '#86461f',
    lead: 'その時代、その土地の、ある一日の夕食。',
    rule: '史実、史料にもとづく推定、現代での再現、創作を分けて書く。当時なかった食材を根拠なく使わない。',
    example: '江戸時代の農民、年貢を納めたあとの夕食。',
  },
  {
    id: 'fantasy',
    no: '03',
    name: 'ファンタジー',
    en: 'Fantasy',
    mark: '幻',
    color: '#2e6243',
    lead: '存在しない世界にも、台所はある。',
    rule: '自由に想像する。ただし食料の調達、保存、調理設備には、その世界なりの筋を通す。',
    example: '文明崩壊から3年後、地下避難区の共同厨房。',
  },
  {
    id: 'faith',
    no: '04',
    name: '海外の宗教',
    en: 'Faith Abroad',
    mark: '祈',
    color: '#6b3560',
    lead: '信仰とともにある、遠い国の食卓。',
    rule: '信仰や禁忌、暮らしの習慣を尊重して学ぶ。同じ宗教でも、地域や宗派、人によって食卓は違う。',
    example: 'ジャイナ教徒の家庭料理。',
  },
];

export const genreById = (id: GenreId): Genre => {
  const g = GENRES.find((x) => x.id === id);
  if (!g) throw new Error(`未知のジャンルです: ${id}`);
  return g;
};

export const genreUrl = (id: GenreId) => `/archive/${id}/`;
