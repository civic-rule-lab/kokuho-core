/**
 * js/core/kaigo.js ユニットテスト
 * 実行: node scripts/test-kaigo.js
 *
 * 標準9段階の kaigo データをインラインで定義して検証する。
 * 境界値: pensionIncome・totalIncome・課税フラグの組み合わせを全段階で確認。
 */
'use strict';

const path = require('path');
const { calculateKaigo, matchBracket } =
  require(path.join(__dirname, '../js/core/kaigo.js'));

let passed = 0;
let failed = 0;

function eq(label, actual, expected) {
  const ok = actual === expected;
  if (ok) { passed++; console.log(`  ✅ ${label}`); }
  else {
    failed++;
    console.log(`  ❌ ${label}`);
    console.log(`     期待=${JSON.stringify(expected)}  実際=${JSON.stringify(actual)}`);
  }
}

// ─── テスト用データ（標準9段階・baseAmount=80,000円/年） ────────────

const KAIGO_DATA = {
  cityCode: '11100', fiscalYear: 2026, system: 'kaigo',
  planPeriod: '第9期（2024-2026）',
  baseAmount: 80_000,
  brackets: [
    { level: '1', label: '第1段階', rate: 0.285,
      criteria: { householdAllNonTaxable: true, pensionIncomeMax: 800_000 },
      condition: '世帯非課税・年金80万以下' },
    { level: '2', label: '第2段階', rate: 0.485,
      criteria: { householdAllNonTaxable: true, pensionIncomeMin: 800_001, pensionIncomeMax: 1_200_000 },
      condition: '世帯非課税・年金80万超〜120万以下' },
    { level: '3', label: '第3段階', rate: 0.685,
      criteria: { householdAllNonTaxable: true, pensionIncomeMin: 1_200_001 },
      condition: '世帯非課税・年金120万超' },
    { level: '4', label: '第4段階', rate: 0.90,
      criteria: { selfTaxable: false, householdAllNonTaxable: false },
      condition: '本人非課税・世帯課税' },
    { level: '5', label: '第5段階（基準）', rate: 1.00,
      criteria: { selfTaxable: true, totalIncomeMax: 1_199_999 },
      condition: '本人課税・合計所得120万未満' },
    { level: '6', label: '第6段階', rate: 1.20,
      criteria: { selfTaxable: true, totalIncomeMin: 1_200_000, totalIncomeMax: 2_099_999 },
      condition: '本人課税・合計所得120万以上210万未満' },
    { level: '7', label: '第7段階', rate: 1.45,
      criteria: { selfTaxable: true, totalIncomeMin: 2_100_000, totalIncomeMax: 3_199_999 },
      condition: '本人課税・合計所得210万以上320万未満' },
    { level: '8', label: '第8段階', rate: 1.70,
      criteria: { selfTaxable: true, totalIncomeMin: 3_200_000, totalIncomeMax: 4_199_999 },
      condition: '本人課税・合計所得320万以上420万未満' },
    { level: '9', label: '第9段階', rate: 2.00,
      criteria: { selfTaxable: true, totalIncomeMin: 4_200_000 },
      condition: '本人課税・合計所得420万以上' },
  ],
  fallbackLevel: '5',
};

// ─── ヘルパー ──────────────────────────────────────────────────

function calc(pensionIncome, totalIncome, isSelfTaxable, isHouseholdAllNonTaxable) {
  return calculateKaigo(KAIGO_DATA, {
    pensionIncome, totalIncome, isSelfTaxable, isHouseholdAllNonTaxable,
  });
}

// ─── 各段階のマッチング ─────────────────────────────────────────

console.log('\n== 段階判定（全9段階） ==');

// 第1段階: 世帯全非課税・年金80万以下
{
  const r = calc(800_000, 0, false, true);
  eq('第1段階: level = "1"',        r.level, '1');
  eq('第1段階: annual = 22,800',    r.annual, Math.round(80_000 * 0.285));
}

// 第1段階ボーダー: 年金ちょうど80万
{
  const r = calc(800_000, 0, false, true);
  eq('第1段階ボーダー（年金80万ちょうど）', r.level, '1');
}

// 第2段階: 世帯全非課税・年金80万超〜120万以下
{
  const r = calc(800_001, 0, false, true);
  eq('第2段階: level = "2"（80万+1円）', r.level, '2');
}
{
  const r = calc(1_200_000, 0, false, true);
  eq('第2段階: level = "2"（年金120万）', r.level, '2');
}

// 第3段階: 世帯全非課税・年金120万超
{
  const r = calc(1_200_001, 0, false, true);
  eq('第3段階: level = "3"', r.level, '3');
}

// 第4段階: 本人非課税・世帯に課税者あり
{
  const r = calc(2_000_000, 500_000, false, false);
  eq('第4段階: level = "4"', r.level, '4');
  eq('第4段階: annual = 72,000', r.annual, Math.round(80_000 * 0.90));
}

// 第5段階（基準）: 本人課税・合計所得120万未満
{
  const r = calc(0, 1_199_999, true, false);
  eq('第5段階: level = "5"（合計所得119.9999万）', r.level, '5');
}
{
  const r = calc(0, 0, true, false);
  eq('第5段階: level = "5"（合計所得0）', r.level, '5');
}

// 第6段階: 本人課税・120万以上210万未満
{
  const r = calc(0, 1_200_000, true, false);
  eq('第6段階: level = "6"（合計所得120万）', r.level, '6');
}
{
  const r = calc(0, 2_099_999, true, false);
  eq('第6段階: level = "6"（合計所得209.9999万）', r.level, '6');
}

// 第7段階: 210万以上320万未満
{
  const r = calc(0, 2_100_000, true, false);
  eq('第7段階: level = "7"（合計所得210万）', r.level, '7');
}

// 第8段階: 320万以上420万未満
{
  const r = calc(0, 3_200_000, true, false);
  eq('第8段階: level = "8"', r.level, '8');
}

// 第9段階: 420万以上
{
  const r = calc(0, 4_200_000, true, false);
  eq('第9段階: level = "9"', r.level, '9');
}
{
  const r = calc(0, 10_000_000, true, false);
  eq('第9段階: level = "9"（高所得）', r.level, '9');
}

// ─── 保険料計算 ──────────────────────────────────────────────

console.log('\n== 保険料計算 ==');

{
  // 第5段階（基準）: 80,000 × 1.00 = 80,000
  const r = calc(0, 500_000, true, false);
  eq('第5段階: annual = 80,000',      r.annual,  80_000);
  eq('第5段階: monthly ≒ 6,667',      r.monthly, Math.round(80_000 / 12));
  eq('第5段階: baseAmount = 80,000',  r.baseAmount, 80_000);
}

{
  // 第9段階: 80,000 × 2.00 = 160,000
  const r = calc(0, 5_000_000, true, false);
  eq('第9段階: annual = 160,000', r.annual, 160_000);
}

// ─── annual フィールド（絶対額方式の自治体） ───────────────────

console.log('\n== annual フィールド（絶対額自治体） ==');

{
  const dataWithAbsoluteAmount = {
    ...KAIGO_DATA,
    brackets: [
      { level: '5', label: '第5段階（基準）', rate: 1.00, annual: 79_500,
        criteria: { selfTaxable: true, totalIncomeMax: 1_199_999 } },
      { level: '9', label: '第9段階', rate: 2.00,
        criteria: { selfTaxable: true, totalIncomeMin: 4_200_000 } },
    ],
  };
  const r = calculateKaigo(dataWithAbsoluteAmount, {
    pensionIncome: 0, totalIncome: 500_000, isSelfTaxable: true, isHouseholdAllNonTaxable: false,
  });
  eq('annual フィールド優先: 79,500', r.annual, 79_500);
}

// ─── フォールバック ─────────────────────────────────────────────

console.log('\n== フォールバック ==');

{
  // criteria が全部外れる入力（空の criteria）
  const dataWithFallback = {
    ...KAIGO_DATA,
    brackets: [
      { level: '5', label: '第5段階（基準）', rate: 1.00,
        criteria: { selfTaxable: true } },
    ],
    fallbackLevel: '5',
  };
  // selfTaxable: false → criteria not match → fallback へ
  const r = calculateKaigo(dataWithFallback, {
    pensionIncome: 0, totalIncome: 0, isSelfTaxable: false, isHouseholdAllNonTaxable: true,
  });
  eq('fallback: level = "5"', r.level, '5');
}

// ─── null / 不正データ ────────────────────────────────────────

console.log('\n== null / 不正データ ==');

{
  const r = calculateKaigo(null, { pensionIncome: 0, totalIncome: 0,
    isSelfTaxable: false, isHouseholdAllNonTaxable: true });
  eq('data=null → null を返す', r, null);
}
{
  const r = calculateKaigo({ baseAmount: 80_000, brackets: [] },
    { pensionIncome: 0, totalIncome: 0, isSelfTaxable: false, isHouseholdAllNonTaxable: true });
  eq('brackets=[] → null を返す', r, null);
}

// ─── 結果 ─────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`結果: PASS ${passed} / FAIL ${failed}`);
if (failed === 0) console.log('✅ 全テスト通過');
console.log();
if (failed > 0) process.exit(1);
