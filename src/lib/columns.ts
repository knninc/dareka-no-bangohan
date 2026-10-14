import { getCollection, type CollectionEntry } from 'astro:content';
import { pad3 } from './format';
import { renderMarkdown } from './markdown';

export type Column = CollectionEntry<'columns'>;

let cache: Promise<Column[]> | undefined;

/** 公開するコラムを新しい順で返す。番号とフォルダ名の不一致・重複はビルドエラーにする */
export function getColumns(): Promise<Column[]> {
  cache ??= (async () => {
    const all = await getCollection('columns', ({ data }) => import.meta.env.DEV || !data.draft);
    const seen = new Set<number>();
    for (const c of all) {
      const folder = c.id.split('/')[0];
      if (folder !== pad3(c.data.no)) {
        throw new Error(`コラム ${c.id}: フォルダ名（${folder}）と no（${c.data.no}）が一致していません`);
      }
      if (seen.has(c.data.no)) throw new Error(`コラム no: ${c.data.no} が重複しています`);
      seen.add(c.data.no);
    }
    return all.sort((a, b) => b.data.no - a.data.no);
  })();
  return cache;
}

export const columnUrl = (c: Column) => `/column/${pad3(c.data.no)}/`;

export const columnLabel = (n: number) => `COLUMN ${pad3(n)}`;

/** 本文を HTML にし、h2 に id を振って目次を返す */
export function columnBody(c: Column): { html: string; toc: { id: string; title: string }[] } {
  const toc: { id: string; title: string }[] = [];
  const html = (renderMarkdown(c.body ?? '') ?? '').replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner: string) => {
    const id = `c${toc.length + 1}`;
    toc.push({ id, title: inner.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&') });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html, toc };
}
