#!/usr/bin/env node
/**
 * test-furusato.cjs — ふるさと納税の控除上限額（js/core/furusato.js）の検証
 *
 * 期待値はすべて手計算（各ケースのコメントに途中の式を書く）。エンジンの出力を期待値に使わない。
 * 対象: 2026年中の寄附 ＝ 住民税 令和9年度分（fiscalYear 2027）・所得税 令和8年分。
 * 制度値の出典は data/national/furusato-2027.json の meta。
 *
 * 実行: node scripts/test-furusato.cjs
 */
'use strict';
const path = require('path');
const ROOT = path.join(__dirname, '..');
const data = require(path.join(ROOT, 'data/national/furusato-2027.json'));
const {
  calcFurusatoLimit, calcFurusatoBreakdown, furusatoSpecialRatio, furusatoMarginalShotokuRate,
} = require(path.join(ROOT, 'js/core/furusato.js'));
const { calculateJumin } = require(path.join(ROOT, 'js/core/jumin.js'));
const Shotoku = require(path.join(ROOT, 'js/core/shotoku.js'));
const shotokuDb = require(path.join(ROOT, 'data/national/shotokuzei-2026.json'));
const shotokuEng = Shotoku.createEngineFromDB(2026, shotokuDb);
const taxTable = Shotoku.loadParams(2026, shotokuDb).taxTable;

let pass = 0, fail = 0;
function eq(label, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? '✓' : '✗'} ${label}${ok ? '' : `  actual=${actual} expected=${expected}`}`);
  ok ? pass++ : fail++;
}

// ── 1. 特例控除の割合の境目（附則第5条の6 の読み替え後の値） ──────────────
const ratioCases = [
  [-1, 90], [0, 84.895],
  [1950000, 84.895], [1950001, 79.79],
  [3300000, 79.79], [3300001, 69.58],
  [6950000, 69.58], [6950001, 66.517],
  [9000000, 66.517], [9000001, 56.307],
  [18000000, 56.307], [18000001, 49.16],
  [40000000, 49.16], [40000001, 44.055],
];
for (const [base, pct] of ratioCases) eq(`割合: 基準額 ${base.toLocaleString()} 円 → ${pct}%`, furusatoSpecialRatio(base, data).percent, pct);

// ── 2. 所得税の限界税率（税率表の境目） ─────────────────────────────────
eq('所得税率: 課税所得 1,950,000 → 5%', furusatoMarginalShotokuRate(1950000, taxTable), 0.05);
eq('所得税率: 課税所得 1,950,001 → 10%', furusatoMarginalShotokuRate(1950001, taxTable), 0.1);
eq('所得税率: 課税所得 3,648,000 → 20%', furusatoMarginalShotokuRate(3648000, taxTable), 0.2);
eq('所得税率: 課税所得 0 → 0', furusatoMarginalShotokuRate(0, taxTable), 0);

// ── 3. 給与500万円・単身・40歳・社会保険料72万円（標準税率 10%） ──────────
// 給与所得: 500万 − (500万×20%+44万) = 356万。
// 住民税(令和9年度): 所得控除 = 社保72万 + 基礎43万 = 115万 → 課税総所得 2,410,000。
//   所得割 = 2,410,000×10% = 241,000 − 調整控除 2,500（課税200万超: max(5万−41万, 5万)=5万 ×5%）= 238,500。
// 所得税(令和8年分): 合計所得356万（489万以下）→ 基礎控除 104万。課税所得 = 356万−72万−104万 = 180万 → 5%。
// 人的控除差調整額 = 5万 + (104万−48万) = 61万。基準額 = 241万−61万 = 180万 → 84.895%。
// 上限 = floor(238,500×20% ×100000 / 84895) + 2,000 = floor(4,770,000,000/84,895) + 2,000 = 56,187 + 2,000 = 58,187。
{
  const j = calculateJumin(null, { salary: 5000000, pension: 0, age: 40, socialInsurance: 720000, fiscalYear: 2027, taxCredits: 0 });
  const st = shotokuEng.calcShotokuzei({ salary: 5000000, socialInsurance: 720000 });
  eq('A 単身500万: 住民税 課税総所得', j.taxableIncome, 2410000);
  eq('A 単身500万: 住民税 所得割（調整控除後）', j.incomeLevy, 238500);
  eq('A 単身500万: 住民税 人的控除差（第37条第1号イ）', j.humanDeductionDiff, 50000);
  eq('A 単身500万: 所得税 基礎控除', st.deductions.kiso, 1040000);
  eq('A 単身500万: 所得税 課税所得', st.kazeiShotoku, 1800000);
  const r = calcFurusatoLimit({ incomeLevy: j.incomeLevy, taxableIncome: j.taxableIncome, humanDeductionDiff: j.humanDeductionDiff, shotokuBasicDeduction: st.deductions.kiso }, data);
  eq('A 単身500万: 人的控除差調整額', r.humanAdjustment, 610000);
  eq('A 単身500万: 割合の基準額', r.base, 1800000);
  eq('A 単身500万: 特例控除の割合', r.ratio.percent, 84.895);
  eq('A 単身500万: 上限額', r.limit, 58187);
  // 上限額ちょうどの内訳: 対象額 56,187。所得税 floor(56,187×5%×1.021)=floor(2,868.35)=2,868、
  // 基本分 floor(5,618.7)=5,618、特例分 min(floor(56,187×0.84895)=47,699, 47,700)=47,699。合計 56,185 → 自己負担 2,002。
  const mr = furusatoMarginalShotokuRate(st.kazeiShotoku, taxTable);
  const b = calcFurusatoBreakdown(r.limit, { incomeLevy: j.incomeLevy, ratio: r.ratio, shotokuMarginalRate: mr, totalIncome: 3560000 }, data);
  eq('A 内訳(上限額): 所得税', b.shotoku, 2868);
  eq('A 内訳(上限額): 住民税 基本分', b.juminBasic, 5618);
  eq('A 内訳(上限額): 住民税 特例分', b.juminSpecial, 47699);
  eq('A 内訳(上限額): 自己負担', b.selfBurden, 2002);
  // 上限を超える寄附（10万円）: 特例分は 所得割×20% = 47,700 で頭打ち。
  // 対象額 98,000。所得税 floor(98,000×0.05105)=5,002、基本分 9,800、特例分 47,700 → 合計 62,502、自己負担 37,498。
  const b2 = calcFurusatoBreakdown(100000, { incomeLevy: j.incomeLevy, ratio: r.ratio, shotokuMarginalRate: mr, totalIncome: 3560000 }, data);
  eq('A 内訳(10万円): 特例分は所得割の20%で頭打ち', b2.juminSpecial, 47700);
  eq('A 内訳(10万円): 自己負担', b2.selfBurden, 37498);
}

// ── 4. 給与500万円・控除対象配偶者あり（配偶者の所得0）・社会保険料72万円 ──────
// 住民税: 所得控除 = 72万 + 基礎43万 + 配偶者33万 = 148万 → 課税総所得 2,080,000。
//   人的控除差（第37条第1号イ）= 基礎の差5万 + 控除対象配偶者5万 = 10万。
//   調整控除: 課税200万超 → max(10万 − 8万, 5万) = 5万 ×5% = 2,500。所得割 = 208,000 − 2,500 = 205,500。
// 人的控除差調整額 = 10万 + (104万−48万) = 66万。基準額 = 208万−66万 = 142万 → 84.895%。
// 上限 = floor(205,500×20% ×100000 / 84895) + 2,000 = floor(4,110,000,000/84,895) + 2,000 = 48,412 + 2,000 = 50,412。
{
  const j = calculateJumin(null, { salary: 5000000, age: 40, socialInsurance: 720000, spouseDeduction: 330000, humanDeductionDiff: 100000, fiscalYear: 2027, taxCredits: 0 });
  eq('B 配偶者あり: 住民税 課税総所得', j.taxableIncome, 2080000);
  eq('B 配偶者あり: 住民税 所得割', j.incomeLevy, 205500);
  const r = calcFurusatoLimit({ incomeLevy: j.incomeLevy, taxableIncome: j.taxableIncome, humanDeductionDiff: j.humanDeductionDiff, shotokuBasicDeduction: 1040000 }, data);
  eq('B 配偶者あり: 人的控除差調整額', r.humanAdjustment, 660000);
  eq('B 配偶者あり: 特例控除の割合', r.ratio.percent, 84.895);
  eq('B 配偶者あり: 上限額', r.limit, 50412);
}

// ── 5. 政令市（横浜市 所得割 10.025%）・給与500万円・単身 ──────────────────
// 所得割 = floor(2,410,000×10.025%) = floor(241,602.5) = 241,602 − 2,500 = 239,102 → 100円未満切捨て 239,100。
// 基準額は A と同じ 180万 → 84.895%。上限 = floor(47,820×100000/84895) + 2,000 = floor(4,782,000,000/84,895) + 2,000
//   = 56,328 + 2,000 = 58,328。（指定都市は県分・市分の按分が変わるだけで合計の式は同じ）
{
  const yd = require(path.join(ROOT, 'data/municipalities/yokohama/jumin-2026.json'));
  const j = calculateJumin(yd, { salary: 5000000, age: 40, socialInsurance: 720000, fiscalYear: 2027, taxCredits: 0 });
  eq('C 横浜市: 住民税 所得割', j.incomeLevy, 239100);
  const r = calcFurusatoLimit({ incomeLevy: j.incomeLevy, taxableIncome: j.taxableIncome, humanDeductionDiff: j.humanDeductionDiff, shotokuBasicDeduction: 1040000 }, data);
  eq('C 横浜市: 上限額', r.limit, 58328);
}

// ── 6. 給与800万円・単身・19〜22歳の子1人（特定扶養・子の所得0）・社会保険料 1,152,000円 ──
// 給与所得: 800万 − (800万×10%+110万) = 610万。
// 住民税: 所得控除 = 1,152,000 + 基礎43万 + 特定扶養45万 = 2,032,000 → 課税総所得 4,068,000。
//   人的控除差 = 5万 + 特定扶養18万 = 23万。調整控除: max(23万 − 206.8万, 5万)=5万 ×5% = 2,500。
//   所得割 = 406,800 − 2,500 = 404,300。
// 所得税(令和8年分): 合計所得610万（489万超655万以下）→ 基礎控除 67万。人的控除差調整額 = 23万 + (67万−48万) = 42万。
// 基準額 = 4,068,000 − 420,000 = 3,648,000 → 330万超695万以下 → 69.58%。
// 上限 = floor(404,300×20% ×100000 / 69580) + 2,000 = floor(8,086,000,000/69,580) + 2,000 = 116,211 + 2,000 = 118,211。
{
  const j = calculateJumin(null, { salary: 8000000, age: 50, socialInsurance: 1152000, dependentDeduction: 450000, dependents: 1, humanDeductionDiff: 230000, fiscalYear: 2027, taxCredits: 0 });
  const st = shotokuEng.calcShotokuzei({ salary: 8000000, socialInsurance: 1152000 });
  eq('D 特定扶養: 住民税 課税総所得', j.taxableIncome, 4068000);
  eq('D 特定扶養: 住民税 所得割', j.incomeLevy, 404300);
  eq('D 特定扶養: 所得税 基礎控除（合計所得610万）', st.deductions.kiso, 670000);
  const r = calcFurusatoLimit({ incomeLevy: j.incomeLevy, taxableIncome: j.taxableIncome, humanDeductionDiff: j.humanDeductionDiff, shotokuBasicDeduction: st.deductions.kiso }, data);
  eq('D 特定扶養: 人的控除差調整額', r.humanAdjustment, 420000);
  eq('D 特定扶養: 割合の基準額', r.base, 3648000);
  eq('D 特定扶養: 特例控除の割合', r.ratio.percent, 69.58);
  eq('D 特定扶養: 上限額', r.limit, 118211);
}

// ── 7. 対象外・特例控除が無い場合 ─────────────────────────────────────
{
  const r1 = calcFurusatoLimit({ incomeLevy: 100000, taxableIncome: 1000000, humanDeductionDiff: 50000, shotokuBasicDeduction: 1040000, hasSanrinOrTaishoku: true }, data);
  eq('課税山林・退職所得あり: 対象外', r1.supported, false);
  eq('課税山林・退職所得あり: 上限は出さない', r1.limit, null);
  const r2 = calcFurusatoLimit({ incomeLevy: 0, taxableIncome: 0, humanDeductionDiff: 50000, shotokuBasicDeduction: 1040000 }, data);
  eq('所得割0円: 上限0（特例控除が生じない）', r2.limit, 0);
  eq('所得割0円: 理由', r2.reason, 'no_income_levy');
  // 基準額が負（課税総所得 40万・人的控除差調整額 61万）→ 90%。
  // 上限 = floor(所得割 38,000×20%=7,600 ×100000 / 90000) + 2,000 = floor(8,444.4) + 2,000 = 10,444。
  const r3 = calcFurusatoLimit({ incomeLevy: 38000, taxableIncome: 400000, humanDeductionDiff: 50000, shotokuBasicDeduction: 1040000 }, data);
  eq('基準額が負: 割合 90%', r3.ratio.percent, 90);
  eq('基準額が負: 上限額', r3.limit, 10444);
}

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
