#!/usr/bin/env node
/**
 * 年度の手書き定数 ↔ registry publishYear の突き合わせ（読み取り専用）
 *
 * 背景（S1-1 RF-3・gaps、2026-11-09）:
 *   国保・住民税などのデータ年度（いまは 2026＝令和8年度）が、registry/index.json の publishYear と、
 *   テンプレート・生成器の中の手書き定数（YEARS・KOKUHO_YEAR・TAX_YEAR・YEAR・DEFAULT_YEAR）に分散している。
 *   年度を進めるときに 1 か所でも直し忘れると、ページは新年度の表示のまま旧年度の JSON を読む
 *   （PR #185 と同型）か、存在しない JSON を読んで 404 になる。これまで整合を見る検査が無かった。
 *
 * 既存の test-year-wiring.js との分担:
 *   test-year-wiring.js … 生成済みページ 2 枚の PUBLISH_YEAR が engine.js の fetch 年度に届くか（実行時の配線）
 *   本スクリプト        … 年度の「値」が registry と各所の手書き定数・生成済みページ・データ実在で揃っているか
 *
 * 検査:
 *   [R] registry: 各 entry の publishYear.{system} に対応する data/municipalities/{slug}/{system}-{year}.json が実在する
 *   [T] テンプレの手書き定数が registry の国保年度（publishYear.kokuho の最大値）と一致する
 *       city-integrated.html の YEARS[0]／seido-haito.html・seido-jieigyo.html の KOKUHO_YEAR
 *   [X] 所得税の年分 TAX_YEAR（city-integrated.html・seido-shotoku.html）が互いに一致し、
 *       data/national/shotokuzei-{TAX_YEAR}.json が実在する（国保年度とは別の量なので国保年度とは比べない）
 *   [G] 生成器の手書き年度（generate-jumin/hoiku-pages.js の DEFAULT_YEAR）が、
 *       その生成器が扱う制度の registry publishYear と一致する。
 *       generate-system-pages.js（kaigo・kouki）は 2026-11-10 から自治体ごとに publishYear を読む（介護 R9 D1）。
 *       DEFAULT_YEAR は publishYear の無い自治体にだけ使うので、該当自治体があれば DEFAULT_YEAR の JSON の実在を見る
 *   [K] 家計簿ページ（kakeibo/index.html）の KAIGO_YEAR が、その自治体の registry publishYear.kaigo と一致する
 *       （介護ページと家計簿で介護の年度が割れない。publishYear.kaigo が無い自治体は null）
 *   [P] 生成済みページの PUBLISH_YEAR が、その自治体の registry publishYear.{system} と一致する
 *       （ページが無いものは数えるだけで不合格にしない。ページの有無は validate-kokuho-data.js 等が見る）
 *   [W] 警告のみ: engines/kokuho/generate.js の既定年度（引数なしのとき）が国保年度と違う
 *
 * 実行: node scripts/test-year-consistency.cjs   （exit 0＝合格／1＝不一致あり）
 * ファイルは一切書き換えない。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const rel = (p) => path.relative(ROOT, p);
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

let pass = 0;
let fail = 0;
let warn = 0;
const ok = (msg) => { pass++; console.log(`  ✓ ${msg}`); };
const ng = (msg, details = []) => {
  fail++;
  console.log(`  ✗ ${msg}`);
  for (const d of details.slice(0, 20)) console.log(`      - ${d}`);
  if (details.length > 20) console.log(`      … ほか ${details.length - 20} 件`);
};
const wn = (msg) => { warn++; console.log(`  ⚠ ${msg}`); };

// 手書き定数を 1 つだけ取り出す。0 件・複数件は検査器側の前提が崩れたので不合格にする
function pickOne(file, re, label) {
  const src = read(file);
  const ms = [...src.matchAll(re)];
  if (ms.length !== 1) {
    ng(`${file}: ${label} の宣言が ${ms.length} 件（1 件のはず）。検査器の正規表現かテンプレの書き方を確かめる`);
    return null;
  }
  return Number(ms[0][1]);
}

const registry = JSON.parse(read('registry/index.json')).municipalities;

// ─── 基準: registry の年度 ─────────────────────────────────────
const yearsBySystem = {};
for (const m of registry) {
  for (const [sys, y] of Object.entries(m.publishYear || {})) {
    (yearsBySystem[sys] ||= new Set()).add(y);
  }
}
const kokuhoYears = [...(yearsBySystem.kokuho || [])].filter(Number.isInteger);
if (kokuhoYears.length === 0) {
  console.error('❌ registry に publishYear.kokuho が 1 件もありません');
  process.exit(1);
}
const KOKUHO_CUR = Math.max(...kokuhoYears);
console.log('年度の突き合わせ（registry publishYear ↔ 手書き定数・生成済みページ・データ）');
console.log(`  基準: registry の国保年度（publishYear.kokuho の最大値）= ${KOKUHO_CUR}`);
for (const [sys, set] of Object.entries(yearsBySystem)) {
  console.log(`        publishYear.${sys}: ${[...set].sort().join(', ')}`);
}

// ─── [R] registry ↔ データ実在 ─────────────────────────────────
console.log('\n[R] registry publishYear ↔ data/municipalities/{slug}/{system}-{year}.json');
{
  const missing = [];
  let n = 0;
  for (const m of registry) {
    for (const [sys, y] of Object.entries(m.publishYear || {})) {
      n++;
      const p = path.join(ROOT, 'data', 'municipalities', m.citySlug, `${sys}-${y}.json`);
      if (!fs.existsSync(p)) missing.push(`${m.prefecture}${m.cityName}（${m.citySlug}）: ${rel(p)} が無い`);
    }
  }
  if (missing.length === 0) ok(`${n} 件の publishYear すべてに対応する JSON がある`);
  else ng(`publishYear に対応する JSON が無い ${missing.length} 件`, missing);
}

// ─── [T] テンプレの国保年度 ────────────────────────────────────
console.log(`\n[T] テンプレの手書きの国保年度 = ${KOKUHO_CUR}`);
for (const [file, re, label] of [
  ['templates/city-integrated.html', /var YEARS = \[(\d{4})\b[^\]]*\]/g, 'YEARS[0]（家計簿が最初に読む年度）'],
  ['templates/seido-haito.html', /var KOKUHO_YEAR = (\d{4});/g, 'KOKUHO_YEAR'],
  ['templates/seido-jieigyo.html', /var KOKUHO_YEAR = (\d{4});/g, 'KOKUHO_YEAR'],
]) {
  const y = pickOne(file, re, label);
  if (y === null) continue;
  if (y === KOKUHO_CUR) ok(`${file}: ${label} = ${y}`);
  else ng(`${file}: ${label} = ${y}（registry の国保年度は ${KOKUHO_CUR}）`);
}

// ─── [X] 所得税の年分 ──────────────────────────────────────────
console.log('\n[X] 所得税の年分 TAX_YEAR（2 テンプレで一致・shotokuzei-{年}.json 実在）');
{
  const a = pickOne('templates/city-integrated.html', /var TAX_YEAR = (\d{4});/g, 'TAX_YEAR');
  const b = pickOne('templates/seido-shotoku.html', /var TAX_YEAR = (\d{4});/g, 'TAX_YEAR');
  if (a !== null && b !== null) {
    if (a === b) ok(`city-integrated.html と seido-shotoku.html の TAX_YEAR が一致（${a}）`);
    else ng(`TAX_YEAR が食い違う: city-integrated.html=${a} / seido-shotoku.html=${b}`);
    for (const y of new Set([a, b])) {
      const p = `data/national/shotokuzei-${y}.json`;
      if (fs.existsSync(path.join(ROOT, p))) ok(`${p} がある`);
      else ng(`${p} が無い（TAX_YEAR=${y} のページが読む）`);
    }
  }
}

// ─── [G] 生成器の手書き年度 ────────────────────────────────────
console.log('\n[G] 生成器の手書き年度 ↔ registry publishYear（その生成器が扱う制度）');
for (const [file, re, label, systems] of [
  // 以下 2 本は registry の publishYear を優先し、無いときだけ DEFAULT_YEAR を使う
  ['scripts/generate-jumin-pages.js', /const DEFAULT_YEAR\s*=\s*(\d{4});/g, 'DEFAULT_YEAR', ['jumin']],
  ['scripts/generate-hoiku-pages.js', /const DEFAULT_YEAR\s*=\s*(\d{4});/g, 'DEFAULT_YEAR', ['hoiku']],
]) {
  const y = pickOne(file, re, label);
  if (y === null) continue;
  const bad = systems.filter((s) => yearsBySystem[s] && [...yearsBySystem[s]].some((v) => v !== y));
  if (bad.length === 0) ok(`${file}: ${label} = ${y}（publishYear.${systems.join('/')} と一致）`);
  else ng(`${file}: ${label} = ${y} だが registry の ${bad.map((s) => `publishYear.${s}=${[...yearsBySystem[s]].join(',')}`).join(' / ')}`);
}

// generate-system-pages.js: 自治体ごとに publishYear.{kaigo,kouki} を読み、無い自治体だけ DEFAULT_YEAR
{
  const file = 'scripts/generate-system-pages.js';
  const y = pickOne(file, /const DEFAULT_YEAR\s*=\s*(\d{4});/g, 'DEFAULT_YEAR');
  if (y !== null) {
    if (/const YEAR\s*=\s*\d{4};/.test(read(file))) ng(`${file}: 固定の YEAR が残っている（自治体ごとの publishYear を読む作りに戻っていない）`);
    for (const sys of ['kaigo', 'kouki']) {
      const noPy = registry.filter((m) => (m.systems || []).includes(sys) && !(m.publishYear && m.publishYear[sys]));
      if (noPy.length === 0) { ok(`${file}: ${sys} は全自治体が publishYear を持つ（DEFAULT_YEAR=${y} は使われない）`); continue; }
      const miss = noPy.filter((m) => !fs.existsSync(path.join(ROOT, 'data', 'municipalities', m.citySlug, `${sys}-${y}.json`)));
      if (miss.length === 0) ok(`${file}: ${sys} の publishYear 無し ${noPy.length} 件は DEFAULT_YEAR=${y} の JSON がある`);
      else ng(`${file}: ${sys} の publishYear 無しで ${sys}-${y}.json も無い ${miss.length} 件`, miss.map((m) => m.citySlug));
    }
  }
}

// ─── [K] 家計簿ページの介護年度 ────────────────────────────────
console.log('\n[K] 家計簿ページの KAIGO_YEAR ↔ その自治体の registry publishYear.kaigo');
{
  const RE = /const KAIGO_YEAR = (\d{4}|null);/;
  let checked = 0;
  const bad = [];
  for (const m of registry) {
    if (!m.prefectureSlug) continue;
    const p = path.join(ROOT, m.prefectureSlug, m.citySlug, 'kakeibo', 'index.html');
    if (!fs.existsSync(p)) continue;
    checked++;
    const mm = fs.readFileSync(p, 'utf8').match(RE);
    const want = (m.publishYear && m.publishYear.kaigo) || null;
    if (!mm) bad.push(`${rel(p)}: KAIGO_YEAR の宣言が無い`);
    else if ((mm[1] === 'null' ? null : Number(mm[1])) !== want) bad.push(`${rel(p)}: KAIGO_YEAR=${mm[1]} / registry publishYear.kaigo=${want}`);
  }
  console.log(`    kakeibo: 照合 ${checked} 枚`);
  if (bad.length === 0) ok('家計簿の KAIGO_YEAR がすべて registry と一致');
  else ng(`家計簿の KAIGO_YEAR が registry と違う ${bad.length} 枚`, bad);
}

// ─── [P] 生成済みページの PUBLISH_YEAR ─────────────────────────
console.log('\n[P] 生成済みページの PUBLISH_YEAR ↔ その自治体の registry publishYear');
{
  const PAGES = {
    kokuho: ['index.html', 'income.html'],
    jumin: ['jumin/index.html', 'jumin/income.html'],
    kaigo: ['kaigo/index.html'],
    kouki: ['kouki/index.html', 'kouki/income.html'],
    hoiku: ['hoiku/index.html'],
  };
  const RE = /const PUBLISH_YEAR = (\d{4});/;
  const stats = {};
  const mismatches = [];
  const noDecl = [];
  for (const m of registry) {
    if (!m.prefectureSlug) continue;
    for (const [sys, y] of Object.entries(m.publishYear || {})) {
      for (const page of PAGES[sys] || []) {
        const p = path.join(ROOT, m.prefectureSlug, m.citySlug, page);
        const st = (stats[sys] ||= { checked: 0, absent: 0 });
        if (!fs.existsSync(p)) { st.absent++; continue; }
        st.checked++;
        const mm = fs.readFileSync(p, 'utf8').match(RE);
        if (!mm) noDecl.push(`${rel(p)}: PUBLISH_YEAR の宣言が無い`);
        else if (Number(mm[1]) !== y) mismatches.push(`${rel(p)}: PUBLISH_YEAR=${mm[1]} / registry publishYear.${sys}=${y}`);
      }
    }
  }
  for (const [sys, st] of Object.entries(stats)) {
    console.log(`    ${sys}: 照合 ${st.checked} 枚（ページ無し ${st.absent} 件は対象外）`);
  }
  if (mismatches.length === 0) ok('PUBLISH_YEAR がすべて registry と一致');
  else ng(`PUBLISH_YEAR が registry と違う ${mismatches.length} 枚`, mismatches);
  if (noDecl.length === 0) ok('照合したページすべてに PUBLISH_YEAR の宣言がある');
  else ng(`PUBLISH_YEAR の宣言が無いページ ${noDecl.length} 枚`, noDecl);
}

// ─── [W] 警告のみ ──────────────────────────────────────────────
console.log('\n[W] 警告のみ（不合格にしない）');
{
  const src = read('engines/kokuho/generate.js');
  const m = src.match(/function parseYear\(\)[\s\S]*?\n  return (\d{4});\n\}/);
  if (!m) wn('engines/kokuho/generate.js: parseYear() の既定年度を読み取れない（書き方が変わった）');
  else if (Number(m[1]) !== KOKUHO_CUR) wn(`engines/kokuho/generate.js: 引数なしの既定年度が ${m[1]}（registry の国保年度は ${KOKUHO_CUR}）。--year を渡す前提なら問題ない`);
  else ok(`engines/kokuho/generate.js: 既定年度 = ${m[1]}`);
}

console.log(`\n結果: ${pass} passed, ${fail} failed, ${warn} warning(s)`);
process.exit(fail === 0 ? 0 : 1);
