/**
 * 処理済みsourceマニフェスト再構築スクリプト
 *
 * scripts/output/.processed-sources.json を以下から復元する:
 *   1. 現在の出力JSON
 *   2. git履歴に存在した全ての出力JSON（＝過去に一度でも抽出されたもの）
 *
 * 2 が重要で、重複として削除されたレコードのsourceもここで拾える。
 * これがないと extract-receipts.ts が「未処理」と誤認し、
 * 削除したはずの重複レコードを再生成してしまう。
 *
 * 使い方:
 *   node scripts/rebuild-processed-manifest.mjs
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SCRIPTS_DIR = path.dirname(new URL(import.meta.url).pathname);
const OUTPUT_DIR = path.join(SCRIPTS_DIR, 'output');
const MANIFEST_PATH = path.join(OUTPUT_DIR, '.processed-sources.json');
const REPO_ROOT = path.resolve(SCRIPTS_DIR, '..');

const OUTPUT_PREFIX = 'scripts/output/';

const git = (args) =>
  execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf-8', maxBuffer: 512 * 1024 * 1024 });

/** 現在の出力JSONから source → 出力パス */
function collectCurrent() {
  const found = new Map();
  if (!fs.existsSync(OUTPUT_DIR)) return found;

  for (const dir of fs.readdirSync(OUTPUT_DIR, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const categoryDir = path.join(OUTPUT_DIR, dir.name);
    for (const file of fs.readdirSync(categoryDir)) {
      if (!file.endsWith('.json')) continue;
      try {
        const rec = JSON.parse(fs.readFileSync(path.join(categoryDir, file), 'utf-8'));
        if (rec.source) found.set(rec.source, `output/${dir.name}/${file}`);
      } catch {
        // skip invalid
      }
    }
  }
  return found;
}

/** git履歴に存在した全出力JSONの source */
function collectHistorical() {
  const sources = new Set();

  // "<sha> <path>" の一覧から scripts/output 配下のJSONだけ拾う
  const listing = git(['rev-list', '--objects', '--all']);
  const shas = [];
  for (const line of listing.split('\n')) {
    const sp = line.indexOf(' ');
    if (sp === -1) continue;
    const filePath = line.slice(sp + 1);
    if (filePath.startsWith(OUTPUT_PREFIX) && filePath.endsWith('.json')) {
      shas.push(line.slice(0, sp));
    }
  }

  if (shas.length === 0) return sources;

  // blobをまとめて読む。サイズはバイト単位なのでBufferのまま扱う
  const batch = execFileSync('git', ['cat-file', '--batch'], {
    cwd: REPO_ROOT,
    input: shas.join('\n') + '\n',
    maxBuffer: 512 * 1024 * 1024,
  });

  // 出力形式: "<sha> <type> <size>\n<content>\n" の繰り返し
  let pos = 0;
  while (pos < batch.length) {
    const nl = batch.indexOf('\n', pos);
    if (nl === -1) break;
    const header = batch.subarray(pos, nl).toString('utf-8').split(' ');
    if (header.length < 3 || header[1] !== 'blob') break;
    const size = Number(header[2]);
    const content = batch.subarray(nl + 1, nl + 1 + size).toString('utf-8');
    pos = nl + 1 + size + 1;

    try {
      const rec = JSON.parse(content);
      if (rec.source) sources.add(rec.source);
    } catch {
      // skip non-record JSON (マニフェスト自身など)
    }
  }

  return sources;
}

const current = collectCurrent();
const historical = collectHistorical();

const sources = {};
for (const src of historical) sources[src] = null; // 過去に抽出→現在は破棄
for (const [src, out] of current) sources[src] = out; // 現存するものは出力パスで上書き

const sorted = {};
for (const key of Object.keys(sources).sort()) sorted[key] = sources[key];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(MANIFEST_PATH, JSON.stringify({ version: 1, sources: sorted }, null, 2) + '\n', 'utf-8');

const discarded = Object.values(sorted).filter((v) => v === null).length;
console.log(`マニフェストを再構築しました: ${MANIFEST_PATH}`);
console.log(`  合計 ${Object.keys(sorted).length}件`);
console.log(`  現存 ${Object.keys(sorted).length - discarded}件 / 破棄済み ${discarded}件`);
