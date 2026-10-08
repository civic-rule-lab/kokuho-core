#!/usr/bin/env node
/**
 * stub-seido-copies.cjs — kokuho-keisan.jp に載った seido-keisan.jp のページの写しを、転送ページに置き換える
 *
 * 背景（TASKS X173-15 / X173-19・2026-10-08 オーナー決定）:
 *   deploy.sh は都道府県ディレクトリを丸ごと kokuho-keisan へ同期するため、kokuho-core にある
 *   seido-keisan.jp 用のページ（住民税 jumin/・家計簿 kakeibo/・後期 kouki/・介護 kaigo/・保育料 hoiku/、
 *   県版の {pref}/kouki/）も kokuho-keisan.jp に載る。ところが計算エンジン（js/core/jumin.js など）は
 *   kokuho-keisan へコピーしていないため 404 になり、写しのページでは計算が動かない
 *   （2026-10-08 本番で「計算エラー calculateJumin is not defined」を確認）。
 *   写しは検索や写し同士の相対リンクから来た人だけが見るので、同じパスの seido-keisan.jp へ転送する。
 *
 * 使い方: node scripts/stub-seido-copies.cjs <公開リポジトリのパス>   （deploy.sh が rsync の直後に呼ぶ）
 *   同じ入力なら同じ出力（何度実行しても差分は出ない）。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = process.argv[2];
if (!PUBLIC_DIR || !fs.existsSync(PUBLIC_DIR)) {
  console.error('使い方: node scripts/stub-seido-copies.cjs <公開リポジトリのパス>');
  process.exit(2);
}

const SEIDO_ORIGIN = 'https://seido-keisan.jp';
const CITY_SYSTEMS = ['jumin', 'kakeibo', 'kouki', 'kaigo', 'hoiku'];   // {pref}/{slug}/{system}/
const PREF_SYSTEMS = ['kouki'];                                         // {pref}/{system}/
const PAGES = ['index.html', 'income.html'];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function stub(url) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>移転しました｜制度計算（seido-keisan.jp）</title>
<link rel="canonical" href="${esc(url)}">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${esc(url)}">
<script>location.replace(${JSON.stringify(url)} + location.search + location.hash);</script>
</head>
<body>
<p>このページは <a href="${esc(url)}">${esc(url)}</a> に移りました。自動で移動しない場合は、リンクを押してください。</p>
</body>
</html>
`;
}

function isDir(p) { try { return fs.statSync(p).isDirectory(); } catch (e) { return false; } }

let written = 0;
function stubDir(relDir) {
  const abs = path.join(PUBLIC_DIR, relDir);
  if (!isDir(abs)) return;
  for (const page of PAGES) {
    const f = path.join(abs, page);
    if (!fs.existsSync(f)) continue;
    const url = SEIDO_ORIGIN + '/' + relDir + '/' + (page === 'index.html' ? '' : page);
    const body = stub(url);
    if (fs.readFileSync(f, 'utf8') !== body) fs.writeFileSync(f, body);
    written++;
  }
}

const prefs = fs.readdirSync(PUBLIC_DIR).filter((p) => !p.startsWith('.') && isDir(path.join(PUBLIC_DIR, p)) &&
  fs.existsSync(path.join(PUBLIC_DIR, p, 'index.html')));
for (const pref of prefs) {
  for (const sys of PREF_SYSTEMS) stubDir(pref + '/' + sys);
  for (const slug of fs.readdirSync(path.join(PUBLIC_DIR, pref))) {
    if (!isDir(path.join(PUBLIC_DIR, pref, slug))) continue;
    for (const sys of CITY_SYSTEMS) stubDir(pref + '/' + slug + '/' + sys);
  }
}
console.log(`✅ seido-keisan.jp 用ページの写し ${written} 件を転送ページにしました`);
