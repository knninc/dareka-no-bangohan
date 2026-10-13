#!/usr/bin/env node
/**
 * 新しい号のひな形を作る：
 *   npm run new-issue -- --genre past --date 2026-10-20
 * 省略時：号数は最新号+1、日付は最新号の7日後、ジャンルは最新号の次（現代人→昔の人→ファンタジー→海外の宗教）。
 * 作られた号は draft: true（下書き）。書き終わったら false にする。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { readIssues, normDate, pad3, GENRES, GENRE_NAMES, ISSUES_DIR, ROOT } from './lib.mjs';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

const issues = (await readIssues()).filter((i) => !i.error && Number.isInteger(i.data?.vol));
const latest = issues.sort((a, b) => b.data.vol - a.data.vol)[0];

const vol = Number(opt('vol') ?? (latest ? latest.data.vol + 1 : 1));
if (!Number.isInteger(vol) || vol < 1) throw new Error('--vol は1以上の整数で指定してください');

let date = opt('date');
if (!date) {
  const base = latest ? new Date(`${normDate(latest.data.date)}T00:00:00Z`) : new Date();
  if (latest) base.setUTCDate(base.getUTCDate() + 7);
  date = base.toISOString().slice(0, 10);
}
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('--date は YYYY-MM-DD で指定してください');

let genre = opt('genre');
if (!genre) genre = latest ? GENRES[(GENRES.indexOf(latest.data.genre) + 1) % GENRES.length] : GENRES[0];
if (!GENRES.includes(genre)) throw new Error(`--genre は ${GENRES.join(' / ')} のどれかで指定してください`);

const dir = path.join(ISSUES_DIR, pad3(vol));
try {
  await fs.access(dir);
  console.error(`✗ ${path.relative(ROOT, dir)} はすでにあります。`);
  process.exit(1);
} catch {
  /* なければ作る */
}

const template = await fs.readFile(path.join(ROOT, 'templates/issue.md'), 'utf8');
const body = template.replace('__VOL__', String(vol)).replace('__DATE__', date).replace('__GENRE__', genre);
await fs.mkdir(path.join(dir, 'photos'), { recursive: true });
await fs.writeFile(path.join(dir, 'index.md'), body);
await fs.writeFile(path.join(dir, 'photos/.gitkeep'), '');

console.log(`✓ VOL.${pad3(vol)}（${GENRE_NAMES[genre]}・${date}）のひな形を作りました`);
console.log(`  ${path.relative(ROOT, path.join(dir, 'index.md'))}`);
console.log('  書き終わったら draft: false にして公開します。');
