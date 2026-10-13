#!/usr/bin/env node
/**
 * 号のデータを検査する： npm run check:content
 * - フォルダ名と号数の一致、号数の重複、必須項目、ジャンル、日付
 * - 本文の見出し、写真ファイルの有無と alt
 * エラーがあれば終了コード 1（ビルドの前にも自動で実行される）
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { readIssues, normDate, pad3, GENRES, BODY_HEADINGS, KITCHENS, ROOT } from './lib.mjs';

const errors = [];
const warnings = [];
const issues = await readIssues();
const rel = (p) => path.relative(ROOT, p);

const seenVol = new Map();
for (const it of issues) {
  const where = rel(it.file);
  if (it.error) {
    errors.push(`${where}: ${it.error}`);
    continue;
  }
  const d = it.data;
  const err = (msg) => errors.push(`${where}: ${msg}`);
  const warn = (msg) => warnings.push(`${where}: ${msg}`);

  if (!/^\d{3}$/.test(it.folder)) err(`フォルダ名「${it.folder}」は3桁の号数にしてください（例: 002）`);

  if (!Number.isInteger(d.vol) || d.vol < 1) err('vol（号数）は1以上の整数で書いてください');
  else {
    if (it.folder !== pad3(d.vol)) err(`フォルダ名「${it.folder}」と vol: ${d.vol} が一致しません（「${pad3(d.vol)}」にする）`);
    if (seenVol.has(d.vol)) err(`号数 ${d.vol} が ${seenVol.get(d.vol)} と重複しています`);
    seenVol.set(d.vol, where);
  }

  if (!normDate(d.date)) err('date（開催日）を YYYY-MM-DD で書いてください');
  if (!GENRES.includes(d.genre)) err(`genre は ${GENRES.join(' / ')} のどれかにしてください（いま: ${d.genre}）`);
  if (typeof d.title !== 'string' || !d.title.trim()) err('title（題）がありません');
  if (d.titleLines && (!Array.isArray(d.titleLines) || d.titleLines.join('') !== d.title))
    err('titleLines をつなげた文字列が title と一致していません');
  if (!Array.isArray(d.menu) || d.menu.length === 0 || d.menu.some((m) => !m || typeof m.name !== 'string' || !m.name.trim()))
    err('menu（献立）に name のある品を1つ以上書いてください');

  for (const [i, p] of (Array.isArray(d.photos) ? d.photos : []).entries()) {
    if (!p?.src) {
      err(`photos[${i}] に src がありません`);
      continue;
    }
    try {
      await fs.access(path.join(it.dir, p.src));
    } catch {
      err(`photos[${i}] の写真ファイル ${p.src} が見つかりません`);
    }
    if (!p.alt || !String(p.alt).trim()) err(`photos[${i}] に alt（何が写っているか）を書いてください`);
    if (p.kitchen && !KITCHENS.includes(p.kitchen)) err(`photos[${i}] の kitchen は ${KITCHENS.join(' / ')} のどれか`);
  }
  if (Array.isArray(d.photos) && d.photos.filter((p) => p?.cover).length > 1) warn('cover: true の写真が2枚以上あります（最初の1枚を使います）');

  // photos/ の画像に撮影場所（GPS）などのメタデータが残っていないか（リポジトリは公開なので必須）
  const photoDir = path.join(it.dir, 'photos');
  let photoFiles = [];
  try {
    photoFiles = (await fs.readdir(photoDir)).filter((f) => /\.(jpe?g|png|webp|avif|tiff?)$/i.test(f));
  } catch {
    /* photos/ がなければ何もしない */
  }
  for (const f of photoFiles) {
    if (/\.(heic|heif)$/i.test(f)) continue;
    const meta = await sharp(path.join(photoDir, f)).metadata();
    if (meta.exif || meta.xmp || meta.iptc)
      err(`photos/${f} に撮影場所などのメタデータが残っています。npm run import-photos で取り込み直してください`);
  }
  for (const f of await fs.readdir(photoDir).catch(() => [])) {
    if (/\.(heic|heif)$/i.test(f)) err(`photos/${f} は HEIC です。npm run import-photos で JPEG にして取り込んでください`);
  }

  const allSources = [...(d.sources ?? []), ...(d.recipes ?? []).flatMap((r) => r?.sources ?? [])];
  for (const s of allSources) {
    if (s?.url && !/^https?:\/\//.test(s.url)) err(`参考資料のURLが正しくありません: ${s.url}`);
  }

  // 本文の見出し（コメント内は無視）
  const body = (it.body ?? '').replace(/<!--[\s\S]*?-->/g, '');
  const seenH = new Set();
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const name = m[1].trim();
    if (!BODY_HEADINGS.includes(name)) err(`本文の見出し「## ${name}」は使えません（使える見出し: ${BODY_HEADINGS.join(' / ')}）`);
    if (seenH.has(name)) err(`本文の見出し「## ${name}」が2回あります`);
    seenH.add(name);
  }

  if (d.draft) warnings.push(`${where}: 下書き（draft: true）なので本番には出ません`);
}

// 号数の並びと日付の並び
const ok = issues.filter((i) => !i.error && Number.isInteger(i.data.vol) && normDate(i.data.date));
ok.sort((a, b) => a.data.vol - b.data.vol);
for (let i = 1; i < ok.length; i++) {
  const [a, b] = [ok[i - 1], ok[i]];
  if (b.data.vol !== a.data.vol + 1) warnings.push(`VOL.${pad3(a.data.vol)} の次が VOL.${pad3(b.data.vol)} です（欠番）`);
  if (normDate(b.data.date) < normDate(a.data.date))
    warnings.push(`VOL.${pad3(b.data.vol)} の日付が VOL.${pad3(a.data.vol)} より前になっています`);
}

for (const w of warnings) console.log(`⚠︎ ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error(`\n号のデータに ${errors.length} 件の問題があります。`);
  process.exit(1);
}
console.log(`✓ ${issues.length} 号のデータを確認しました。`);
