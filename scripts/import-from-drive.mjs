#!/usr/bin/env node
/**
 * Google ドライブ（パソコン版）に同期された号のフォルダから、写真をまとめて取り込む：
 *   npm run import-from-drive -- <号数>
 *
 * 探す場所：~/Library/CloudStorage/GoogleDrive-<アカウント>/マイドライブ/週刊・誰かの晩ごはん/VOL.<3桁>…/
 *   台所A の写真/ → kitchen a
 *   台所B の写真/ → kitchen b
 * 取り込み自体は import-photos.mjs（位置情報などを消す）に任せる。取り込み済みの写真はとばす。
 * 感想（「VOL.xxx の記録」ドキュメント）は Google ドキュメントなので、ここでは扱わない。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { pad3, ROOT } from './lib.mjs';

const ROOT_FOLDER = '週刊・誰かの晩ごはん';
const KITCHEN_FOLDERS = { a: '台所A の写真', b: '台所B の写真' };

const vol = Number(process.argv[2]);
if (!Number.isInteger(vol) || vol < 1) {
  console.error('使い方: npm run import-from-drive -- <号数>');
  process.exit(1);
}

const cloud = path.join(os.homedir(), 'Library/CloudStorage');
const drives = (await fs.readdir(cloud).catch(() => [])).filter((n) => n.startsWith('GoogleDrive-'));
if (drives.length === 0) {
  console.error('✗ Google ドライブ（パソコン版）が見つかりません。インストールしてログインしてください。');
  process.exit(1);
}

let issueFolder;
for (const d of drives) {
  for (const my of ['マイドライブ', 'My Drive']) {
    const base = path.join(cloud, d, my, ROOT_FOLDER);
    const names = await fs.readdir(base).catch(() => []);
    const hit = names.find((n) => n.startsWith(`VOL.${pad3(vol)}`));
    if (hit) issueFolder = path.join(base, hit);
  }
}
if (!issueFolder) {
  console.error(`✗ ドライブに「${ROOT_FOLDER}/VOL.${pad3(vol)}…」のフォルダが見つかりません。`);
  process.exit(1);
}
console.log(`ドライブのフォルダ：${issueFolder}`);

let any = false;
for (const [kitchen, folder] of Object.entries(KITCHEN_FOLDERS)) {
  const dir = path.join(issueFolder, folder);
  const files = (await fs.readdir(dir).catch(() => [])).filter((n) => !n.startsWith('.'));
  if (files.length === 0) {
    console.log(`・${folder}：写真なし`);
    continue;
  }
  any = true;
  console.log(`\n・${folder}：${files.length} ファイル`);
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/import-photos.mjs'), String(vol), kitchen, dir], {
    stdio: 'inherit',
  });
}
if (!any) console.log('\n取り込む写真はまだありません。');
