/**
 * vendor-shaho.mjs — 社会保険(shaho) / 所得税(shotoku) エンジン＋データを kokuho-core に vendor（同期コピー）する。
 *
 * 正本は shaho-keisan（Private）／ shotoku-keisan。ここにコピーされる kokuho-core 側は「生成物」であり手で編集しない。
 * 家計簿(city-integrated.html)が同一オリジンで社会保険料控除→住民税/所得税/保育料を実額結線するために必要。
 *
 * 変換（冪等）:
 *   1. エンジンは IIFE で内包する（classic <script> 同時読込時の top-level const 字句衝突を回避。
 *      jumin.js の `const _isNode` と shaho/shotoku の `const _isNode/fs/path` がグローバル字句環境で衝突するため）。
 *      正本（単独読込）は無改変のまま。window.Shaho / window.Shotoku は IIFE 内で代入されるので動作不変。
 *   2. 先頭に「正本ポインタ」ヘッダを付与。
 *
 * 前提:
 *   - shotoku 正本 shotoku-engine.js は UMD 化済み（createEngineFromDB と window.Shotoku を持つ）であること。
 *   - shaho 正本 shaho.js は UMD 済み（window.Shaho）。
 *
 * 使い方（Mac 上・kokuho-core リポ内で）:
 *   node scripts/vendor-shaho.mjs
 *   SHAHO_SRC=~/Desktop/制度計算/shaho-keisan SHOTOKU_SRC=~/Desktop/制度計算/shotoku-keisan node scripts/vendor-shaho.mjs
 *   （shaho 正本が未接続のときは配信ミラー shaho-site を SHAHO_SRC に指定可）
 *
 * ⚠️ コピー直後に必ず commit（過去 untracked ガード×git clean で vendored コピーが消失した事故あり）。
 */
'use strict';

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CORE = path.join(__dirname, '..');
const HOME = os.homedir();

const SHAHO_SRC   = process.env.SHAHO_SRC   || path.join(HOME, 'Desktop', '制度計算', 'shaho-keisan');
const SHOTOKU_SRC = process.env.SHOTOKU_SRC || path.join(HOME, 'Desktop', '制度計算', 'shotoku-keisan');

const SHAHO_DATA = ['kenpo-2026.json', 'kosei-nenkin.json', 'koyo-2026.json', 'standard-monthly.json', 'senpo-2026.json'];

// ソース中から最初に見つかった候補パスを返す（正本とミラーでレイアウトが違うため複数候補を許容）。
function findFirst(base, candidates) {
  for (const c of candidates) {
    const p = path.join(base, c);
    if (existsSync(p)) return p;
  }
  return null;
}

// IIFE 内包＋正本ヘッダを付与（既に内包済みなら二重化しない）。
function wrapIIFE(code, srcLabel) {
  if (code.startsWith('/* VENDORED')) return code; // 冪等
  const header = `/* VENDORED from ${srcLabel} — 正本を編集すること。このコピーは scripts/vendor-shaho.mjs が生成（手編集禁止）。\n` +
    `   IIFE 内包＝classic <script> 同時読込時の top-level const 字句衝突回避。window.Shaho / window.Shotoku は IIFE 内で代入。 */\n`;
  return header + '(function(){\n' + code + '\n})();\n';
}

function vendorEngine(srcFile, destFile, srcLabel) {
  if (!existsSync(srcFile)) throw new Error(`ソースが見つからない: ${srcFile}`);
  const code = readFileSync(srcFile, 'utf8');
  mkdirSync(path.dirname(destFile), { recursive: true });
  writeFileSync(destFile, wrapIIFE(code, srcLabel), 'utf8');
  console.log(`  ✓ engine  ${path.relative(CORE, destFile)}  ← ${srcFile}`);
}

function vendorData(srcFile, destFile) {
  if (!existsSync(srcFile)) return false;
  const raw = readFileSync(srcFile, 'utf8');
  JSON.parse(raw); // 破損検知（壊れたJSONを黙って配らない＝SEC-STOP）
  mkdirSync(path.dirname(destFile), { recursive: true });
  writeFileSync(destFile, raw, 'utf8');
  console.log(`  ✓ data    ${path.relative(CORE, destFile)}  ← ${srcFile}`);
  return true;
}

console.log('=== vendor-shaho: shaho / shotoku を kokuho-core に同期 ===');
console.log(`CORE:        ${CORE}`);
console.log(`SHAHO_SRC:   ${SHAHO_SRC}`);
console.log(`SHOTOKU_SRC: ${SHOTOKU_SRC}\n`);

// ── shaho エンジン ──
const shahoEngine = findFirst(SHAHO_SRC, ['js/core/shaho.js', 'shaho.js']);
if (!shahoEngine) throw new Error(`shaho.js が ${SHAHO_SRC} に無い（js/core/shaho.js を確認）`);
vendorEngine(shahoEngine, path.join(CORE, 'js', 'core', 'shaho.js'), 'shaho-keisan/js/core/shaho.js');

// ── shaho データ（正本レイアウトは root か data/shaho の両対応。senpo は任意） ──
let shahoDataCount = 0;
for (const f of SHAHO_DATA) {
  const src = findFirst(SHAHO_SRC, [f, `data/shaho/${f}`, `data/${f}`]);
  if (!src) { if (f === 'senpo-2026.json') { console.log(`  – data    ${f}（任意・ソース無し＝スキップ）`); continue; } throw new Error(`shaho データ ${f} が ${SHAHO_SRC} に無い`); }
  if (vendorData(src, path.join(CORE, 'data', 'shaho', f))) shahoDataCount++;
}

// ── shotoku エンジン＋データ ──
const shotokuEngine = findFirst(SHOTOKU_SRC, ['shotoku-engine.js', 'js/core/shotoku-engine.js']);
if (!shotokuEngine) throw new Error(`shotoku-engine.js が ${SHOTOKU_SRC} に無い`);
const shotokuCode = readFileSync(shotokuEngine, 'utf8');
if (!/createEngineFromDB/.test(shotokuCode) || !/window\.Shotoku/.test(shotokuCode)) {
  throw new Error('shotoku-engine.js が UMD 化されていない（createEngineFromDB / window.Shotoku が必要）。正本を UMD 化してから vendor すること。');
}
vendorEngine(shotokuEngine, path.join(CORE, 'js', 'core', 'shotoku.js'), 'shotoku-keisan/shotoku-engine.js');

const shotokuData = findFirst(SHOTOKU_SRC, ['data/national/shotokuzei-2026.json']);
if (!shotokuData) throw new Error(`shotokuzei-2026.json が ${SHOTOKU_SRC}/data/national に無い`);
vendorData(shotokuData, path.join(CORE, 'data', 'national', 'shotokuzei-2026.json'));

console.log(`\n✅ 完了: shaho エンジン＋データ${shahoDataCount}本・shotoku エンジン＋データ1本を vendor。`);
console.log('⚠️ この直後に必ず commit してください（git clean で消失する事故防止）。');
console.log('   例: git add js/core/shaho.js js/core/shotoku.js data/shaho data/national && git commit -m "vendor: shaho/shotoku エンジン＋データ同期"');
