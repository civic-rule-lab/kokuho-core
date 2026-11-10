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
  // 2026-10-31 全方向試算 C088: 1〜3月は4月に始まった年度に属する＝当年度（子ども・子育て支援法施行令 第4条）
  eq('1月=当年度', pickFiscalYear(1, 9), 'current');
  eq('3月=当年度', pickFiscalYear(3, 9), 'current');
  eq('8月=前年度', pickFiscalYear(8, 9), 'prev');

  // 2026-11-03 全方向試算 段7（C089〜C092）: 数でない所得割・Infinity・子の順位・年齢区分は例外
  console.log('— 入力の検査 —');
  const errOf = (input) => { try { calcHoiku(input, cityA); return 'no error'; } catch (e) { return e.name; } };
  const P = (fs) => ({ father: { shotokuwari: fs }, mother: { shotokuwari: 0 } });
  eq('[C089] 所得割 "abc" は TypeError', errOf(P('abc')), 'TypeError');
  eq('[C089] 所得割 "48,600" は TypeError', errOf(P('48,600')), 'TypeError');
  eq('[C089] 所得割 {} は TypeError', errOf(P({})), 'TypeError');
  eq('[C089] 所得割 NaN は RangeError', errOf(P(NaN)), 'RangeError');
  eq('[C090] 所得割 Infinity は RangeError', errOf(P(Infinity)), 'RangeError');
  eq('[C089] 所得割 null は 0（片親）として計算', calcHoiku(P(null), cityA).level, 3);
  eq('[C091] childOrder "2" は TypeError', errOf(Object.assign(P(60000), { childOrder: '2' })), 'TypeError');
  eq('[C091] childOrder 1.5 は RangeError', errOf(Object.assign(P(60000), { childOrder: 1.5 })), 'RangeError');
  eq('[C091] childOrder 0 は RangeError', errOf(Object.assign(P(60000), { childOrder: 0 })), 'RangeError');
  eq('[C091] childOrder 2 は第2子（係数0.5）', calcHoiku(Object.assign(P(60000), { childOrder: 2 }), cityA).monthly, 15000);
  eq('[C092] age "age3" は RangeError', errOf(Object.assign(P(60000), { age: 'age3' })), 'RangeError');
  eq('[C092] age "age0" は0歳別額', calcHoiku(Object.assign(P(60000), { age: 'age0' }), cityA).monthly, 31000);

  // HOIKU-02（2026-11-09 S1-2）: 非課税・生活保護の早期 return も通常経路と同じ breakdown の形（額は 0）
  eq('[HOIKU-02] 非課税の breakdown', calcHoiku({ hikazei: true, father: { shotokuwari: 0 }, childOrder: 2 }, cityA).breakdown, { index: 0, base: 0, firstFinal: 0, childOrder: 2, monthly: 0 });
  eq('[HOIKU-02] 生活保護の breakdown', calcHoiku({ seikatsuhogo: true, father: { shotokuwari: 0 } }, cityA).breakdown, { index: 0, base: 0, firstFinal: 0, childOrder: 1, monthly: 0 });


  // X252（2026-11-10）: 在園していない年上のきょうだいの数え方。
  //   市の基準（multiChild.countScope='household-all'/'allChildren'）か、施行令14条の低所得
  //   （所得割合算額 57,700円未満・ひとり親等 77,101円未満）のときだけ順位に足す。selector を持つ市（新潟型）は足さない。
  //   ひとり親等で 77,101円未満の第2子は 0 円が上限（14条1号かっこ書き）。
  {
    const Q = (s, extra) => Object.assign({ father: { shotokuwari: s }, mother: { shotokuwari: 0 }, childOrder: 1 }, extra || {});
    const cityAll = Object.assign({}, cityA, { multiChild: { second: 0, third: 0, countScope: 'household-all' } });
    const cityAllChildren = Object.assign({}, cityA, { multiChild: { second: 0, third: 0, countScope: 'allChildren' } });
    const cityStd = Object.assign({}, cityA, { multiChild: { second: 0.5, third: 0 } });
    const citySel = Object.assign({}, cityStd, { selector: { olderSiblingNotEnrolled: { appliesTo: 'child2alt' } } });
    eq('[X252] 市が全員数える: 在園外1人 → 第2子(0円)', calcHoiku(Q(100000, { olderNotEnrolled: 1 }), cityAll).monthly, 0);
    eq('[X252] 市が全員数える: 在園外0人 → 第1子', calcHoiku(Q(100000, { olderNotEnrolled: 0 }), cityAll).monthly, 44500);
    eq('[X252] allChildren も同じ扱い', calcHoiku(Q(100000, { olderNotEnrolled: 1 }), cityAllChildren).monthly, 0);
    eq('[X252] 国の基準・所得割合算額 100,000（≥57,700）: 在園外は数えない', calcHoiku(Q(100000, { olderNotEnrolled: 1 }), cityStd).monthly, 44500);
    eq('[X252] 国の基準・30,000（<57,700）: 14条で数えて第2子 ×0.5', calcHoiku(Q(30000, { olderNotEnrolled: 1 }), cityStd).monthly, 9750);
    eq('[X252] 境界 57,700 ちょうどは数えない', calcHoiku(Q(57700, { olderNotEnrolled: 1 }), cityStd).monthly, 30000);
    eq('[X252] 境界 57,699 は数える', calcHoiku(Q(57699, { olderNotEnrolled: 1 }), cityStd).monthly, 15000);
    eq('[X252] ひとり親等・70,000（<77,101）: 在園の兄姉で第2子 → 0円が上限', calcHoiku(Q(70000, { childOrder: 2, hitorioya: true }), cityStd).monthly, 0);
    eq('[X252] ひとり親等・77,101 は上限にかからない（第2子 ×0.5）', calcHoiku(Q(77101, { childOrder: 2, hitorioya: true }), cityStd).monthly, 15000);
    eq('[X252] ひとり親等・70,000・在園外2人 → 第3子 0円', calcHoiku(Q(70000, { olderNotEnrolled: 2, hitorioya: true }), cityStd).monthly, 0);
    eq('[X252] selector を持つ市（新潟型）は一般規則で足さない', calcHoiku(Q(30000, { olderNotEnrolled: 1 }), citySel).monthly, 19500);
    const r = calcHoiku(Q(30000, { olderNotEnrolled: 1 }), cityStd);
    eq('[X252] breakdown の順位は加算後・加算数を記録', [r.breakdown.childOrder, r.breakdown.olderNotEnrolledCounted], [2, 1]);
    const err = (x) => { try { calcHoiku(x, cityStd); return 'no-error'; } catch (e) { return e.constructor.name; } };
    eq('[X252] olderNotEnrolled が負は RangeError', err(Q(30000, { olderNotEnrolled: -1 })), 'RangeError');
    eq('[X252] olderNotEnrolled が文字列は TypeError', err(Q(30000, { olderNotEnrolled: '1' })), 'TypeError');
    eq('[X252] validateBrackets は不明な countScope を拒む', validateBrackets(Object.assign({}, cityA, { multiChild: { countScope: 'everyone' } })).some((m) => /countScope/.test(m)), true);
  }

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

runSelfTest();
