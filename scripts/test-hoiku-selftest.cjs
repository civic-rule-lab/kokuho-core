#!/usr/bin/env node
// hoiku エンジンの自己テスト。
// 元は js/core/hoiku.js の末尾に同梱していたが、配信JS（seido-keisan.jp の /js/core/hoiku.js）に
// ブラウザで実行されない死にコードを載せないため 2026-07-26 に分離した。
// アサーション本体は分離前と同一（hoiku.js 338-423行をそのまま移設）。
// 実行: node scripts/test-hoiku-selftest.cjs
'use strict';
const { calcHoiku, resolveIndex, validateBrackets, pickFiscalYear } = require('../js/core/hoiku.js');

function runSelfTest() {
  let pass = 0, fail = 0;
  const eq = (label, got, want) => {
    const ok = JSON.stringify(got) === JSON.stringify(want);
    console.log(`${ok ? '  ✓' : '✗ FAIL'} ${label}  got=${JSON.stringify(got)}${ok ? '' : ` want=${JSON.stringify(want)}`}`);
    ok ? pass++ : fail++;
  };

  // フィクスチャ: 一般市(非政令市・0歳別額・ひとり親軽減あり)
  const cityA = {
    slug: 'test-city-a', system: 'hoiku', year: 2026, status: 'verified',
    fiscalSwitch: 9,
    brackets: [
      { level: 1, criteria: 'seikatsuhogo', standard: 0, short: 0 },
      { level: 2, criteria: 'hikazei', standard: 0, short: 0 },
      { level: 3, maxShotokuwari: 48600, standard: 19500, short: 19100, reduced: { hitorioya: 9000 } },
      { level: 4, maxShotokuwari: 97000, standard: 30000, short: 29600, byAge: { age0: 31000 } },
      { level: 5, maxShotokuwari: 169000, standard: 44500, short: 43900 },
      { level: 6, standard: 61000, short: 60100 },
    ],
    multiChild: { second: 0.5, third: 0, countScope: 'preschool' },
  };

  // フィクスチャ: 政令市(6/8補正)
  const seirei = {
    slug: 'test-seirei', system: 'hoiku', year: 2026, status: 'verified',
    seireiConversion: true, fiscalSwitch: 9,
    brackets: [
      { level: 2, criteria: 'hikazei', standard: 0, short: 0 },
      { level: 3, maxShotokuwari: 48600, standard: 20000, short: 19600 },
      { level: 4, maxShotokuwari: 97000, standard: 33000, short: 32500 },
    ],
    multiChild: { second: 0.5, third: 0 },
  };

  // フィクスチャ: 東京free(第1子無償)
  const tokyo = { slug: 'test-free', system: 'hoiku', year: 2026, status: 'free',
    freePolicy: { firstChild: true, since: '2025-09' } };

  console.log('— 非課税/生活保護 —');
  eq('生活保護→0', calcHoiku({ seikatsuhogo: true }, cityA).monthly, 0);
  eq('非課税→0', calcHoiku({ hikazei: true }, cityA).monthly, 0);

  console.log('— 通常階層(標準/短時間) —');
  // 父40000+母30000=70000 → level4(≤97000) 標準30000
  eq('level4標準', calcHoiku({ father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 } }, cityA).monthly, 30000);
  eq('level4短時間', calcHoiku({ father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 }, timeType: 'short' }, cityA).monthly, 29600);

  console.log('— 0歳別額 —');
  eq('level4・0歳', calcHoiku({ father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 }, age: 'age0' }, cityA).monthly, 31000);

  console.log('— ひとり親軽減 —');
  // 母のみ所得割20000 → level3(≤48600)、ひとり親でreduced 9000
  eq('level3ひとり親', calcHoiku({ mother: { shotokuwari: 20000 }, hitorioya: true }, cityA).monthly, 9000);

  console.log('— 多子軽減 —');
  eq('第2子半額', calcHoiku({ father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 }, childOrder: 2 }, cityA).monthly, 15000);
  eq('第3子無償', calcHoiku({ father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 }, childOrder: 3 }, cityA).monthly, 0);

  console.log('— 政令市6/8補正 —');
  // 通知書8%基準 父80000+母40000=120000 → ×6/8=90000 → level4(≤97000) 33000
  eq('政令市補正後level4', calcHoiku({ father: { shotokuwari: 80000 }, mother: { shotokuwari: 40000 }, isSeireiNotice: true }, seirei).monthly, 33000);
  // 補正なし入力(年収連動想定)なら 120000 → 上限段が97000までなので該当なし→例外を確認
  eq('政令市: 6/8前の指数', resolveIndex({ father: { shotokuwari: 80000 }, mother: { shotokuwari: 40000 }, isSeireiNotice: true }, seirei).index, 90000);

  console.log('— 無償化(東京free) —');
  eq('free→0', calcHoiku({ father: { shotokuwari: 999999 } }, tokyo).monthly, 0);
  eq('free→freeフラグ', calcHoiku({ father: { shotokuwari: 999999 } }, tokyo).free, true);

  console.log('— brackets不変条件検証 —');
  eq('cityA検証エラー0', validateBrackets(cityA).length, 0);
  eq('seirei検証エラー0', validateBrackets(seirei).length, 0);
  // わざと壊したデータ: standard<short & 上限超 & 非昇順
  const broken = { slug: 'broken', brackets: [
    { level: 3, maxShotokuwari: 97000, standard: 100, short: 200 },       // standard<short
    { level: 3, maxShotokuwari: 48600, standard: 200000, short: 100 },    // level非昇順 & maxShotokuwari非昇順 & 上限超
  ] };
  eq('broken検証エラー検出', validateBrackets(broken).length >= 3, true);

  console.log('— pickFiscalYear —');
  eq('4月=前年度', pickFiscalYear(4, 9), 'prev');
  eq('9月=当年度', pickFiscalYear(9, 9), 'current');

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

runSelfTest();
