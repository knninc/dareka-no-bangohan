import { getCollection, type CollectionEntry } from 'astro:content';
import { pad3, volLabel } from './format';
import { genreById } from './genres';
import { plainText } from './markdown';
import { splitBody } from './sections';

export type Issue = CollectionEntry<'issues'>;

let cache: Promise<Issue[]> | undefined;

/**
 * 公開する号を新しい順で返す。
 * 号数の重複・フォルダ名との不一致はここでビルドエラーにする。
 */
export function getIssues(): Promise<Issue[]> {
  cache ??= (async () => {
    const all = await getCollection('issues', ({ data }) => import.meta.env.DEV || !data.draft);
    const byVol = new Map<number, string>();
    for (const issue of all) {
      const { vol } = issue.data;
      const folder = issue.id.split('/')[0];
      if (folder !== pad3(vol)) {
        throw new Error(
          `[issues/${issue.id}] フォルダ名「${folder}」と号数 vol: ${vol} が一致しません（フォルダ名は「${pad3(vol)}」にしてください）`,
        );
      }
      if (byVol.has(vol)) {
        throw new Error(`号数 ${volLabel(vol)} が重複しています: ${byVol.get(vol)} と ${issue.id}`);
      }
      byVol.set(vol, issue.id);
      // 本文の見出しも検査しておく
      splitBody(issue.body, `issues/${issue.id}`);
    }
    return all.sort((a, b) => b.data.vol - a.data.vol);
  })();
  return cache;
}

export const issueUrl = (issue: Issue) => `/vol/${pad3(issue.data.vol)}/`;

export const issueSections = (issue: Issue) => splitBody(issue.body, `issues/${issue.id}`);

/** 表紙・OGPに使う写真 */
export const coverPhoto = (issue: Issue) =>
  issue.data.photos.find((p) => p.cover) ?? undefined;

/** 実際の記録（写真・ふたりの食卓・編集後記）があるか */
export function hasRecord(issue: Issue) {
  const { html } = issueSections(issue);
  return issue.data.photos.length > 0 || Boolean(html.table) || Boolean(html.afterword);
}

/** 献立をつないだ1行 */
export const menuLine = (issue: Issue, sep = '／') => issue.data.menu.map((m) => m.name).join(sep);

/** meta description 用の説明文 */
export function issueDescription(issue: Issue): string {
  const { data } = issue;
  if (data.summary) return data.summary;
  const genre = genreById(data.genre);
  const parts = [
    `${volLabel(data.vol)}（${genre.name}）`,
    data.title,
    data.subtitle,
    `献立：${menuLine(issue, '、')}。`,
  ].filter(Boolean);
  const someone = issueSections(issue).raw.someone;
  const text = parts.join(' ');
  if (!someone) return text;
  // 150字以内で、文の切れ目（。）まで足す
  let out = text;
  for (const sentence of plainText(someone).match(/[^。]+。?/g) ?? []) {
    const next = `${out}${out === text ? ' ' : ''}${sentence.trim()}`;
    if (next.length > 150) break;
    out = next;
  }
  return out;
}

/** 前後の号（古い号 / 新しい号） */
export async function neighbors(issue: Issue) {
  const all = await getIssues();
  const i = all.findIndex((x) => x.id === issue.id);
  return { newer: i > 0 ? all[i - 1] : undefined, older: i < all.length - 1 ? all[i + 1] : undefined };
}
