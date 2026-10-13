import { renderMarkdown } from './markdown';

/**
 * 本文（Markdown）は「## 見出し」で区切って、決まった欄に流し込む。
 * 使える見出しはここにあるものだけ。それ以外はビルドエラーにして気づけるようにする。
 */
export const BODY_SECTIONS = {
  今夜の誰か: 'someone',
  なぜこの料理なのか: 'why',
  レシピ: 'recipe',
  ふたりの食卓: 'table',
  編集後記: 'afterword',
} as const;

export type BodySectionKey = (typeof BODY_SECTIONS)[keyof typeof BODY_SECTIONS] | 'lead';

export type BodySections = Partial<Record<BodySectionKey, string>>;

export interface SplitResult {
  html: BodySections;
  raw: Partial<Record<BodySectionKey, string>>;
}

export function splitBody(body: string | undefined, label: string): SplitResult {
  const buckets: Record<BodySectionKey, string[]> = {
    lead: [],
    someone: [],
    why: [],
    recipe: [],
    table: [],
    afterword: [],
  };
  const seen = new Set<string>();
  let current: BodySectionKey = 'lead';
  let inFence = false;
  let inComment = false;

  for (const line of (body ?? '').split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    if (!inFence) {
      // コメント内の「## 」は見出しとして扱わない
      const opens = (line.match(/<!--/g) ?? []).length;
      const closes = (line.match(/-->/g) ?? []).length;
      const m = !inComment && line.match(/^##\s+(.+?)\s*#*\s*$/);
      if (opens > closes) inComment = true;
      if (closes > opens) inComment = false;
      if (m) {
        const name = m[1].trim();
        const key = (BODY_SECTIONS as Record<string, BodySectionKey>)[name];
        if (!key) {
          throw new Error(
            `[${label}] 本文の見出し「## ${name}」は使えません。使える見出し: ${Object.keys(BODY_SECTIONS)
              .map((s) => `## ${s}`)
              .join(' / ')}`,
          );
        }
        if (seen.has(key)) throw new Error(`[${label}] 見出し「## ${name}」が2回出てきます`);
        seen.add(key);
        current = key;
        continue;
      }
    }
    buckets[current].push(line);
  }

  const html: BodySections = {};
  const raw: SplitResult['raw'] = {};
  for (const [key, lines] of Object.entries(buckets) as [BodySectionKey, string[]][]) {
    const text = lines.join('\n');
    const rendered = renderMarkdown(text);
    if (rendered) {
      html[key] = rendered;
      raw[key] = text;
    }
  }
  return { html, raw };
}
