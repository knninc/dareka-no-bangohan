// scripts 共通：号の読み込み
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

// パスに日本語が含まれていても動くように fileURLToPath を使う
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ISSUES_DIR = path.join(ROOT, 'src/content/issues');

export const GENRES = ['modern', 'past', 'fantasy', 'faith'];
export const GENRE_NAMES = { modern: '現代人', past: '昔の人', fantasy: 'ファンタジー', faith: '海外の宗教' };
// src/lib/sections.ts の BODY_SECTIONS と同じにする
export const BODY_HEADINGS = ['今夜の誰か', 'なぜこの料理なのか', 'レシピ', 'ふたりの食卓', '編集後記'];
// src/site.config.ts の kitchens と同じにする
export const KITCHENS = ['a', 'b'];

export const pad3 = (n) => String(n).padStart(3, '0');

/** すべての号を読む（frontmatter と本文） */
export async function readIssues() {
  let entries = [];
  try {
    entries = await fs.readdir(ISSUES_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const dir = path.join(ISSUES_DIR, e.name);
    const file = path.join(dir, 'index.md');
    let raw;
    try {
      raw = await fs.readFile(file, 'utf8');
    } catch {
      out.push({ folder: e.name, dir, file, error: 'index.md がありません' });
      continue;
    }
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) {
      out.push({ folder: e.name, dir, file, error: '先頭に --- で囲んだ frontmatter がありません' });
      continue;
    }
    try {
      const data = parse(m[1]) ?? {};
      out.push({ folder: e.name, dir, file, data, body: m[2] });
    } catch (err) {
      out.push({ folder: e.name, dir, file, error: `frontmatter の YAML が読めません: ${err.message}` });
    }
  }
  return out.sort((a, b) => a.folder.localeCompare(b.folder));
}

/** YAML の日付（文字列 or Date）を YYYY-MM-DD にそろえる */
export function normDate(v) {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return undefined;
}
