#!/usr/bin/env node
/**
 * 写真を号に取り込む：
 *   npm run import-photos -- <号数> <台所 a|b> <写真ファイル or フォルダ>...
 *   例）npm run import-photos -- 1 a ~/Downloads/台所Aの写真
 *
 * - iPhone の HEIC も読める（macOS の sips で JPEG に変換）
 * - 向きを補正し、長辺 2400px に縮小
 * - 撮影場所（GPS）などのメタデータをすべて消す（リポジトリは公開なので必須）
 * - src/content/issues/<3桁>/photos/<台所>-<連番>.jpg に保存し、index.md に貼る YAML を表示する
 * - 取り込んだ元ファイルは photos/.imported.json に記録し、同じ写真を二度取り込まない
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { ISSUES_DIR, KITCHENS, pad3, ROOT } from './lib.mjs';

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|avif|tiff?)$/i;
const MAX_EDGE = 2400;

const [volArg, kitchen, ...inputs] = process.argv.slice(2);
const vol = Number(volArg);
if (!Number.isInteger(vol) || vol < 1 || !KITCHENS.includes(kitchen) || inputs.length === 0) {
  console.error('使い方: npm run import-photos -- <号数> <台所 a|b> <写真ファイル or フォルダ>...');
  console.error('例）   npm run import-photos -- 1 a ~/Downloads/台所Aの写真');
  process.exit(1);
}

const issueDir = path.join(ISSUES_DIR, pad3(vol));
try {
  await fs.access(path.join(issueDir, 'index.md'));
} catch {
  console.error(`✗ VOL.${pad3(vol)} がありません（${path.relative(ROOT, issueDir)}）`);
  process.exit(1);
}
const outDir = path.join(issueDir, 'photos');
await fs.mkdir(outDir, { recursive: true });

// 入力を写真ファイルの一覧にする（フォルダは中身を名前順に）
const files = [];
for (const input of inputs) {
  const stat = await fs.stat(input);
  if (stat.isDirectory()) {
    const names = (await fs.readdir(input)).filter((n) => IMAGE_EXT.test(n) && !n.startsWith('.')).sort();
    files.push(...names.map((n) => path.join(input, n)));
  } else if (IMAGE_EXT.test(input)) {
    files.push(input);
  }
}
if (files.length === 0) {
  console.error('✗ 写真が見つかりませんでした');
  process.exit(1);
}

// 取り込み済みの記録（元のファイル名＋サイズ → 保存名）
const manifestPath = path.join(outDir, '.imported.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8').catch(() => '{}'));
const keyOf = async (file) => `${kitchen}:${path.basename(file)}:${(await fs.stat(file)).size}`;

// すでにある連番の続きから付ける
const existing = (await fs.readdir(outDir)).map((n) => n.match(new RegExp(`^${kitchen}-(\\d+)\\.jpg$`))?.[1]).filter(Boolean);
let n = existing.length ? Math.max(...existing.map(Number)) : 0;

const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'dareka-photos-'));
const added = [];
let skipped = 0;
for (const file of files) {
  const key = await keyOf(file);
  if (manifest[key]) {
    skipped += 1;
    continue;
  }
  let src = file;
  if (/\.(heic|heif)$/i.test(file)) {
    // sharp の標準ビルドは HEIC を読めないので、macOS の sips で JPEG にしてから処理する
    src = path.join(tmp, `${path.basename(file)}.jpg`);
    try {
      execFileSync('sips', ['-s', 'format', 'jpeg', file, '--out', src], { stdio: 'ignore' });
    } catch {
      console.error(`✗ ${path.basename(file)}：HEIC を変換できませんでした（macOS 以外では JPEG にしてから取り込んでください）`);
      continue;
    }
  }
  n += 1;
  const name = `${kitchen}-${n}.jpg`;
  // rotate()：EXIF の向きを反映してから捨てる。withMetadata() を呼ばないので、GPS などは残らない
  await sharp(src)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(path.join(outDir, name));
  const meta = await sharp(path.join(outDir, name)).metadata();
  if (meta.exif || meta.xmp || meta.iptc) throw new Error(`${name} にメタデータが残っています`);
  added.push({ name, from: path.basename(file), w: meta.width, h: meta.height });
  manifest[key] = name;
}
await fs.rm(tmp, { recursive: true, force: true });
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
if (skipped) console.log(`（取り込み済みの ${skipped} 枚はとばしました）`);
if (added.length === 0) {
  console.log('新しく取り込む写真はありませんでした。');
  process.exit(0);
}

console.log(`✓ VOL.${pad3(vol)} に ${added.length} 枚を取り込みました（位置情報などのメタデータは削除済み）`);
for (const a of added) console.log(`  ${a.from} → photos/${a.name}（${a.w}×${a.h}）`);
console.log('\nindex.md の photos: に、次を貼って alt（何が写っているか）を書いてください：\n');
console.log('photos:');
for (const a of added) {
  console.log(`  - src: ./photos/${a.name}`);
  console.log(`    alt: `);
  console.log(`    kitchen: ${kitchen}`);
}
