import { Marked } from 'marked';

const md = new Marked({ gfm: true, breaks: false, async: false });

/** 根拠の種類を示すしるし。段落の先頭に【史実】などと書くとバッジになる */
export const BASIS_TAGS = ['史実', '推定', '再現', '創作', '設定', '記録', '伝承'] as const;
const BASIS_RE = new RegExp(`<p>【(${BASIS_TAGS.join('|')})】\\s*`, 'g');

/** Markdown を HTML にする。コメント（<!-- -->）は出力しない。空なら undefined */
export function renderMarkdown(src: string): string | undefined {
  const text = src.replace(/<!--[\s\S]*?-->/g, '').trim();
  if (!text) return undefined;
  let html = md.parse(text) as string;
  html = html.replace(
    BASIS_RE,
    (_m, tag: string) => `<p class="basis" data-basis="${tag}"><span class="basis__tag">${tag}</span>`,
  );
  // 外部リンクは安全のため rel を付ける
  html = html.replace(/<a href="(https?:\/\/[^"]+)"/g, '<a href="$1" rel="noopener"');
  return html;
}

/** Markdown を1行の素のテキストにする（meta description 用） */
export function plainText(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/【[^】]+】/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
