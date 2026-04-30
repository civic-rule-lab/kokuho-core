/**
 * 住民税 verified 化支援スクリプト
 *
 * 自治体の現在のスペックを表示し、3点の計算結果と確認チェックリストを出力する。
 * 公式サイトで確認後、--mark で verified に昇格できる。
 *
 * 実行:
 *   node scripts/verify-jumin.js nagoya               # 現在の状態を確認
 *   node scripts/verify-jumin.js --pref=miyagi         # 都道府県内の全自治体を一覧
 *   node scripts/verify-jumin.js nagoya --mark         # verified に昇格（要: source.url 記入済み）
 *   node scripts/verify-jumin.js --list-unverified     # 未confirmed 自治体一覧
 */

'use strict';

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, '..');
const DATA_DIR   = path.join(ROOT, 'data', 'municipalities');

const _require = createRequire(import.meta.url);
const { calculateJumin, JUMIN_DEFAULTS } = _require('../js/core/jumin.js');
const { calcSalaryIncome, calcPensionIncome } = _require('../js/core/shared/income.js');

// ─── 引数解析 ────────────────────────────────────────────────────

const args        = process.argv.slice(2);
const MARK        = args.includes('--mark');
const LIST_UN     = args.includes('--list-unverified');
const PREF_ARG    = (args.find(a => a.startsWith('--pref=')) || '').replace('--pref=', '') || null;
const SLUG        = args.find(a => !a.startsWith('--')) || null;

// ─── 3点の計算 ────────────────────────────────────────────────────

const TEST_CASES = [
  { label: '給与500万円',   salary: 5_000_000, pension: 0,         age: 40 },
  { label: '給与1,000万円', salary: 10_000_000, pension: 0,        age: 40 },
  { label: '年金300万(65歳)',salary: 0,          pension: 3_000_000, age: 65 },
];

function calcAll(data) {
  return TEST_CASES.map(tc => {
    const income = calcSalaryIncome(tc.salary) + calcPensionIncome(tc.pension, tc.age);
    const r = calculateJumin(data, { salary: tc.salary, pension: tc.pension, age: tc.age });
    return { label: tc.label, income, incomeLevy: r.incomeLevy, perCapita: r.perCapita, total: r.total };
  });
}

function showCalc(data, label = '') {
  const results = calcAll(data);
  console.log(`\n  📊 計算結果${label ? ' [' + label + ']' : ''}:`);
  for (const r of results) {
    console.log(
      `    ${r.label.padEnd(14)}: 所得割${r.incomeLevy.toLocaleString().padStart(8)} + 均等割${r.perCapita.toLocaleString().padStart(5)} = ${r.total.toLocaleString().padStart(8)}円`
    );
  }
}

// ─── スペック差分の表示 ────────────────────────────────────────

function showDiff(data) {
  const fields = ['prefRate','cityRate','prefPerCapita','cityPerCapita','forestTax'];
  const diffs = fields.filter(k => data[k] !== undefined && data[k] !== JUMIN_DEFAULTS[k]);
  if (diffs.length === 0) {
    console.log('  差分フィールド: なし（全て標準値）');
  } else {
    for (const k of diffs) {
      console.log(`  ${k}: ${JUMIN_DEFAULTS[k]} → ${data[k]}`);
    }
  }
}

// ─── 単一自治体の確認 ────────────────────────────────────────────

function checkSlug(slug) {
  const juminPath = path.join(DATA_DIR, slug, 'jumin-2026.json');

  if (!existsSync(juminPath)) {
    console.log(`\n⚠️  ${slug}: jumin-2026.json なし（標準値を使用）`);
    console.log('  → 超過課税なし自治体のため計算は正確。ファイル不要。');
    showCalc(null, '標準値');
    return;
  }

  const data   = JSON.parse(readFileSync(juminPath, 'utf-8'));
  const status = data.status || '?';
  const icon   = status === 'verified' ? '✅' : status === 'inferred' ? '🔍' : '⚠️ ';

  console.log(`\n${icon} ${slug} (${data.cityName || ''}) — status: ${status}`);
  console.log(`  fiscalYear: ${data.fiscalYear}`);
  showDiff(data);

  if (data.source?.url) {
    console.log(`  source: ${data.source.url}`);
    console.log(`  取得日: ${data.source.retrievedAt || '未記録'}`);
  } else {
    console.log('  source: 未記録 ← verified 化には URL 記録が必要');
  }

  showCalc(data);

  // verified チェックリスト
  if (status !== 'verified') {
    console.log('\n  📋 verified 昇格チェックリスト:');
    console.log(`    [ ] 公式サイトで ${data.fiscalYear || 2026}年度 税率・均等割を確認`);
    console.log(`    [ ] source.url を記入`);
    console.log(`    [ ] 給与500万・1,000万の2点で照合`);
    if (!data.source?.url) {
      console.log('\n  ⚡ URL を spec ファイルに記入後、--mark で昇格できます。');
    }
  }

  // --mark 処理（source.url が記録済みの場合のみ実行）
  if (MARK) {
    if (!data.source?.url) {
      console.log('\n  ❌ --mark には source.url の記録が必要です。スペックファイルに URL を記入してください。');
      return;
    }
    if (status === 'verified') {
      console.log('\n  ℹ️  すでに verified です。');
      return;
    }
    console.log('\n  ✅ verified に昇格します...');
    data.status = 'verified';
    writeFileSync(juminPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    console.log(`  完了: ${juminPath}`);
  }
}

// ─── 都道府県内の全自治体を一覧 ──────────────────────────────────

function listPref(prefSlug) {
  const slugs = readdirSync(DATA_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  const rows = [];
  for (const slug of slugs) {
    const p = path.join(DATA_DIR, slug, 'jumin-2026.json');
    if (!existsSync(p)) continue;
    const data = JSON.parse(readFileSync(p, 'utf-8'));
    if (data.prefSlug !== prefSlug) continue;
    rows.push({ slug, name: data.cityName, status: data.status, hasUrl: !!data.source?.url });
  }

  console.log(`\n== ${prefSlug} の jumin データ（${rows.length}件）==`);
  const byStatus = { verified: [], inferred: [], needs_update: [] };
  for (const r of rows) (byStatus[r.status] || byStatus.inferred).push(r);

  for (const [st, list] of Object.entries(byStatus)) {
    if (list.length === 0) continue;
    const icon = st === 'verified' ? '✅' : st === 'inferred' ? '🔍' : '⚠️ ';
    console.log(`\n${icon} ${st}: ${list.length}件`);
    list.forEach(r => console.log(`  ${r.slug.padEnd(20)} ${r.name}`));
  }
}

// ─── 未 verified 一覧 ────────────────────────────────────────────

function listUnverified() {
  const slugs = readdirSync(DATA_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  const unverified = [];
  for (const slug of slugs) {
    const p = path.join(DATA_DIR, slug, 'jumin-2026.json');
    if (!existsSync(p)) continue;
    const data = JSON.parse(readFileSync(p, 'utf-8'));
    if (data.status !== 'verified') unverified.push({ slug, name: data.cityName, status: data.status, prefSlug: data.prefSlug });
  }

  console.log(`\n未 verified: ${unverified.length}件`);
  const byPref = {};
  for (const r of unverified) {
    if (!byPref[r.prefSlug]) byPref[r.prefSlug] = [];
    byPref[r.prefSlug].push(r);
  }
  for (const [pref, list] of Object.entries(byPref).sort()) {
    console.log(`\n${pref} (${list.length}件):`);
    list.forEach(r => console.log(`  ${r.slug.padEnd(20)} [${r.status}]`));
  }
}

// ─── エントリポイント ─────────────────────────────────────────────

if (LIST_UN) {
  listUnverified();
} else if (PREF_ARG) {
  listPref(PREF_ARG);
} else if (SLUG) {
  checkSlug(SLUG);
} else {
  console.log(`
使い方:
  node scripts/verify-jumin.js <slug>              現在の状態を確認
  node scripts/verify-jumin.js --pref=<prefSlug>   都道府県内の一覧
  node scripts/verify-jumin.js <slug> --mark       verified に昇格
  node scripts/verify-jumin.js --list-unverified   未confirmed 一覧
`);
}
