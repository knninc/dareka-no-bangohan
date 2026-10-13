/**
 * 日付の書式。frontmatter の日付（YYYY-MM-DD）は UTC 0時の Date になるため、
 * すべて UTC の値で読む（タイムゾーンで日付がずれないように）。
 */
const WEEK_JA = ['日', '月', '火', '水', '木', '金', '土'];
const WEEK_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const two = (n: number) => String(n).padStart(2, '0');

export const pad3 = (n: number) => String(n).padStart(3, '0');

export const volLabel = (n: number) => `VOL.${pad3(n)}`;

/** 2026.10.13 */
export const dateDots = (d: Date) => `${d.getUTCFullYear()}.${two(d.getUTCMonth() + 1)}.${two(d.getUTCDate())}`;

/** 10.13 */
export const dateShort = (d: Date) => `${two(d.getUTCMonth() + 1)}.${two(d.getUTCDate())}`;

/** 2026年10月13日（火） */
export const dateJa = (d: Date, withWeekday = true) =>
  `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日${withWeekday ? `（${WEEK_JA[d.getUTCDay()]}）` : ''}`;

/** TUE */
export const weekdayEn = (d: Date) => WEEK_EN[d.getUTCDay()];

/** 2026-10-13（<time datetime> 用） */
export const isoDate = (d: Date) => `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())}`;

/** 漢数字（献立の番号など、小さな数用） */
const KANJI = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
export const kanjiNum = (n: number) => (n <= 10 ? KANJI[n] : String(n));
