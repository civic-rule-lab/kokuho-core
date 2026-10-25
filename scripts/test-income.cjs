/**
 * js/core/shared/income.js ユニットテスト
 *
 * 実行: node scripts/test-income.cjs
 *
 * 給与所得控除: 令和8年度（2026年度）個人住民税ルール
 *   最低保障額 65万円（≤190万円）、162.5万〜180万区間を廃止
 *   出典: 総務省「個人住民税について」令和7年5月15日
 * 年金所得控除: 令和2年以降の現行制度（変更なし）
 */

'use strict';

const path = require('path');
const {
  calcSalaryIncome,
  calcPensionIncome,
  calcTaxableIncomeForKokuho,
  calcTaxableIncomeForJumin,
  calcKeigenPensionDeduction,
  calcIncomeAdjustmentDeduction,
  calcSalaryPensionIncome,
  isKyuyoShotokushaTou,
} = require(path.join(__dirname, '../js/core/shared/income.js'));

let passed = 0;
let failed = 0;

function eq(label, actual, expected) {
  if (actual === expected) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
    console.log(`     期待: ${expected.toLocaleString()}  実際: ${actual.toLocaleString()}  差: ${actual - expected}`);
  }
}

// ─── calcSalaryIncome ──────────────────────────────────────────

console.log('\n== calcSalaryIncome ==');

// ─ ゼロ・異常系 ─
eq('salary=0 → 0',         calcSalaryIncome(0),         0);
eq('salary=-100（負値）→ 0', calcSalaryIncome(-100),      0);
eq('salary=NaN → 0',       calcSalaryIncome(NaN),        0);
eq('salary=undefined → 0', calcSalaryIncome(undefined),  0);

// ─ 最低保障額65万円の確認（令和8年度ルール）─
// 65万円控除後にゼロになる境界
eq('salary=650,000（控除= 所得0） → 0',   calcSalaryIncome(650_000),   0);
// 65万円控除が適用される範囲の中間
eq('salary=1,000,000（≤190万）→ 350,000', calcSalaryIncome(1_000_000), 350_000);
// 旧ルールで162.5万が区間1上限だったが新ルールでは65万控除が続く
eq('salary=1,625,000（≤190万）→ 975,000', calcSalaryIncome(1_625_000), 975_000);
// 旧ルールで×40%-10万が適用されていた区間も65万控除に統合
eq('salary=1,800,000（≤190万）→ 1,150,000', calcSalaryIncome(1_800_000), 1_150_000);
// 190万円ジャスト: 190万×30%+8万=65万 → 所得=125万（区間境界で連続）
eq('salary=1,900,000（区間境界）→ 1,250,000', calcSalaryIncome(1_900_000), 1_250_000);

// ─ 190万超（令和8年度でも旧来と同じ計算式）─
// 給与200万: 200万×30%+8万=68万 → 所得=132万
eq('salary=2,000,000 → 1,320,000',  calcSalaryIncome(2_000_000),  1_320_000);
// 給与300万: 300万×30%+8万=98万 → 所得=202万
eq('salary=3,000,000 → 2,020,000',  calcSalaryIncome(3_000_000),  2_020_000);
// 給与500万: 500万×20%+44万=144万 → 所得=356万
eq('salary=5,000,000 → 3,560,000',  calcSalaryIncome(5_000_000),  3_560_000);
// 給与700万: 700万×10%+110万=180万 → 所得=520万
eq('salary=7,000,000 → 5,200,000',  calcSalaryIncome(7_000_000),  5_200_000);
// 給与850万: 850万×10%+110万=195万 → 所得=655万
eq('salary=8,500,000 → 6,550,000',  calcSalaryIncome(8_500_000),  6_550_000);
// 給与1000万: 控除上限195万 → 所得=805万
eq('salary=10,000,000 → 8,050,000', calcSalaryIncome(10_000_000), 8_050_000);

// ─── calcPensionIncome ────────────────────────────────────────

console.log('\n== calcPensionIncome ==');

// 65歳未満
eq('pension=0, age=30 → 0',                          calcPensionIncome(0, 30),           0);
eq('pension=600,000（控除超過）, age=30 → 0',         calcPensionIncome(600_000, 30),     0);
eq('pension=1,300,000, age=30 → 700,000',            calcPensionIncome(1_300_000, 30),   700_000);
// 300万×25%+27.5万=102.5万 → 197.5万
eq('pension=3,000,000, age=30 → 1,975,000',          calcPensionIncome(3_000_000, 30),   1_975_000);

// 65歳以上
eq('pension=1,100,000, age=70 → 0（控除110万）',      calcPensionIncome(1_100_000, 70),   0);
eq('pension=2,000,000, age=70 → 900,000',            calcPensionIncome(2_000_000, 70),   900_000);
eq('pension=3,300,000, age=70 → 2,200,000',          calcPensionIncome(3_300_000, 70),   2_200_000);
// 500万×15%+68.5万=143.5万 → 356.5万
eq('pension=5,000,000, age=70 → 3,565,000',          calcPensionIncome(5_000_000, 70),   3_565_000);

// age 未指定 → 65歳未満扱い
// 110万, 65歳未満: 控除60万 → 50万
eq('pension=1,100,000, age=undefined → 500,000',     calcPensionIncome(1_100_000),        500_000);

// ─── calcTaxableIncomeForKokuho ────────────────────────────────

console.log('\n== calcTaxableIncomeForKokuho ==');

// 給与のみ
eq('salary=5,000,000 → 3,560,000',
  calcTaxableIncomeForKokuho({ salary: 5_000_000 }),
  3_560_000);

// 年金のみ（高齢者）: 控除110万 → 90万
eq('pension=2,000,000, age=70 → 900,000',
  calcTaxableIncomeForKokuho({ pension: 2_000_000, age: 70 }),
  900_000);

// 給与＋年金＋事業所得
// salaryIncome=2,020,000 + pensionIncome(150万,68歳)=floor(150万-110万)=400,000 + other=500,000
//   − 所得金額調整控除 100,000（給与・年金とも10万超 → 10万+10万−10万。2026-10-25 修正・旧期待値 2,920,000 は控除漏れ）
eq('salary=3M + pension=1.5M(68歳) + other=50万 → 2,820,000',
  calcTaxableIncomeForKokuho({ salary: 3_000_000, pension: 1_500_000, age: 68, otherIncome: 500_000 }),
  2_820_000);

// 空入力
eq('空 params → 0',
  calcTaxableIncomeForKokuho({}),
  0);

eq('null params → 0',
  calcTaxableIncomeForKokuho(null),
  0);

// ─── calcTaxableIncomeForJumin ─────────────────────────────────

console.log('\n== calcTaxableIncomeForJumin ==');

// 給与500万 / 社保75万 / 扶養38万 / 基礎控除43万（デフォルト）
// 3,560,000 - 750,000 - 380,000 - 430,000 = 2,000,000
eq('salary=5M / 社保75万 / 扶養38万 → 2,000,000',
  calcTaxableIncomeForJumin({
    salary: 5_000_000,
    socialInsurance: 750_000,
    dependentDeduction: 380_000,
  }),
  2_000_000);

// 基礎控除を明示指定
eq('basicDeductionJumin=0 で指定',
  calcTaxableIncomeForJumin({
    salary: 3_000_000,
    basicDeductionJumin: 0,
  }),
  2_020_000);

// 控除が所得を超える場合 → 0
eq('控除過大 → 0',
  calcTaxableIncomeForJumin({
    salary: 1_000_000,
    socialInsurance: 5_000_000,
  }),
  0);

// ─── 軽減判定の年金特別控除（国民健康保険法施行令 附則第5条）─────────────────
// 65歳以上の公的年金所得から15万円（年金所得が上限）。64歳以下・年金なしは0
console.log('\n== 軽減判定の年金特別控除 calcKeigenPensionDeduction ==');
{
  const f = calcKeigenPensionDeduction;
  eq('66歳・年金195万（所得85万）: 15万', f(1_950_000, 66), 150_000);
  eq('65歳ちょうど・年金168万（所得58万）: 15万', f(1_680_000, 65), 150_000);
  eq('64歳・年金195万: 0（65歳未満）', f(1_950_000, 64), 0);
  eq('70歳・年金120万（所得10万）: 年金所得の10万が上限', f(1_200_000, 70), 100_000);
  eq('70歳・年金110万（所得0）: 0', f(1_100_000, 70), 0);
  eq('70歳・年金125万（所得15万）: 15万', f(1_250_000, 70), 150_000);
  eq('年金0: 0', f(0, 70), 0);
  eq('年齢未指定: 0', f(1_950_000, undefined), 0);
}

// ─── 所得金額調整控除（租税特別措置法 第41条の3の11 第2項・地方税法 第313条第2項）─────
// 給与所得と年金所得の両方がある人: min(給与所得, 10万) + min(年金所得, 10万) − 10万 を給与所得から引く（2026-10-25 追加・全方向試算 A-2）
console.log('\n== 所得金額調整控除 calcIncomeAdjustmentDeduction / calcSalaryPensionIncome ==');
{
  const f = calcIncomeAdjustmentDeduction;
  eq('給与所得132万・年金所得90万: 10万', f(1_320_000, 900_000), 100_000);
  eq('給与所得85万・年金所得5万: 5万', f(850_000, 50_000), 50_000);
  eq('給与所得5万・年金所得2万（合計10万以下）: 0', f(50_000, 20_000), 0);
  eq('給与所得6万・年金所得4万（合計ちょうど10万）: 0', f(60_000, 40_000), 0);
  eq('年金所得0: 0', f(2_020_000, 0), 0);
  eq('給与所得0: 0', f(0, 900_000), 0);
  // 66歳・給与200万（所得132万）・年金200万（所得90万）→ 132万 + 90万 − 10万 = 212万
  eq('66歳・給与200万・年金200万: 212万', calcSalaryPensionIncome(2_000_000, 2_000_000, 66), 2_120_000);
  // 70歳・給与150万（所得85万）・年金115万（所得5万）→ 85万 + 5万 − 5万 = 85万
  eq('70歳・給与150万・年金115万: 85万', calcSalaryPensionIncome(1_500_000, 1_150_000, 70), 850_000);
  // 64歳・給与300万（所得202万）・年金150万（所得85万）→ 202万 + 85万 − 10万 = 277万
  eq('64歳・給与300万・年金150万: 277万', calcSalaryPensionIncome(3_000_000, 1_500_000, 64), 2_770_000);
  eq('給与だけ（300万）: 202万（控除なし）', calcSalaryPensionIncome(3_000_000, 0, 40), 2_020_000);
  eq('国保の総所得金額等: 66歳・給与200万・年金200万・副業10万 → 222万',
    calcTaxableIncomeForKokuho({ salary: 2_000_000, pension: 2_000_000, age: 66, otherIncome: 100_000 }), 2_220_000);
  eq('住民税の課税所得: 66歳・給与200万・年金200万 → 212万 − 基礎控除43万 = 169万',
    calcTaxableIncomeForJumin({ salary: 2_000_000, pension: 2_000_000, age: 66 }), 1_690_000);
}

// ─── 給与所得者等の判定（国民健康保険法施行令 第29条の7 第6項第1号）─────
console.log('\n== 給与所得者等 isKyuyoShotokushaTou ==');
{
  const f = isKyuyoShotokushaTou;
  eq('給与55万ちょうど: 当たらない', f(550_000, 0, 40) ? 1 : 0, 0);
  eq('給与55万1円: 当たる', f(550_001, 0, 40) ? 1 : 0, 1);
  eq('64歳・年金60万ちょうど: 当たらない', f(0, 600_000, 64) ? 1 : 0, 0);
  eq('64歳・年金60万1円: 当たる', f(0, 600_001, 64) ? 1 : 0, 1);
  eq('65歳・年金110万ちょうど: 当たらない', f(0, 1_100_000, 65) ? 1 : 0, 0);
  eq('65歳・年金110万1円: 当たる', f(0, 1_100_001, 65) ? 1 : 0, 1);
  eq('収入なし: 当たらない', f(0, 0, 40) ? 1 : 0, 0);
}

// ─── 結果 ─────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`結果: PASS ${passed} / FAIL ${failed}`);
if (failed === 0) console.log('✅ 全テスト通過');
console.log();

if (failed > 0) process.exit(1);
