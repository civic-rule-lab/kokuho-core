/**
 * js/core/jumin.js ユニットテスト
 * 実行: node scripts/test-jumin.js
 */
'use strict';

const path = require('path');
const { calculateJumin, JUMIN_DEFAULTS } =
  require(path.join(__dirname, '../js/core/jumin.js'));

let passed = 0;
let failed = 0;

function eq(label, actual, expected) {
  if (actual === expected) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}`);
    console.log(`     期待=${JSON.stringify(expected)}  実際=${JSON.stringify(actual)}`);
  }
}
function ok(label, cond, detail = '') {
  if (cond) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.log(`  ❌ ${label}${detail ? '\n     ' + detail : ''}`); }
}

// ─────────────────────────────────────────────────────────────
// 1. 基本計算（標準税率・null data でデフォルト使用）
// ─────────────────────────────────────────────────────────────
console.log('\n== 基本計算（標準税率） ==');

{
  // 給与収入 500万 / 社保控除なし
  // calcSalaryIncome(5,000,000) = 3,560,000
  // taxableIncome = 3,560,000 - 430,000 = 3,130,000
  // 所得割 = 3,130,000 × 10% = 313,000
  // 均等割 = 1,000 + 3,000 + 1,000(国の森林環境税) = 5,000（令和6年度以降）
  // total = 313,000 + 5,000 = 318,000
  const r = calculateJumin(null, { salary: 5_000_000 });
  eq('taxableIncome = 3,130,000', r.taxableIncome, 3_130_000);
  eq('incomeLevy = 313,000',      r.incomeLevy,    313_000);
  eq('perCapita = 5,000',         r.perCapita,      5_000);
  eq('total = 318,000',           r.total,         318_000);
  eq('isTaxable = true',          r.isTaxable,     true);
}

// ─────────────────────────────────────────────────────────────
// 2. 所得ゼロ → 非課税
// ─────────────────────────────────────────────────────────────
console.log('\n== 所得ゼロ（非課税） ==');

{
  const r = calculateJumin(null, { salary: 0 });
  eq('taxableIncome = 0', r.taxableIncome, 0);
  eq('total = 0',         r.total,         0);
  eq('isTaxable = false', r.isTaxable,     false);
}

// ─────────────────────────────────────────────────────────────
// 3. 社会保険料控除（accurate モードで kokuho.total を渡した場合）
// ─────────────────────────────────────────────────────────────
console.log('\n== 社会保険料控除 ==');

{
  // 給与 500万 / 社保控除 20万（仮）
  // taxableIncome = 3,560,000 - 430,000 - 200,000 = 2,930,000
  // incomeLevy = 2,930,000 × 10% = 293,000 / 均等割 = 5,000
  const r = calculateJumin(null, { salary: 5_000_000, socialInsurance: 200_000 });
  eq('taxableIncome（社保控除後） = 2,930,000', r.taxableIncome, 2_930_000);
  eq('incomeLevy = 293,000',                    r.incomeLevy,    293_000);
  eq('total = 298,000',                         r.total,         298_000);
}

// ─────────────────────────────────────────────────────────────
// 4. 差分データ（超過課税自治体）
// ─────────────────────────────────────────────────────────────
console.log('\n== 差分データ（超過課税自治体） ==');

{
  // 神奈川県民税率が標準より高い想定
  const customData = { prefRate: 0.045, prefPerCapita: 2_000 };
  const r = calculateJumin(customData, { salary: 5_000_000 });
  // 所得割 = 3,130,000 × (0.045 + 0.06) = 3,130,000 × 0.105 = 328,650 → floor = 328,650
  eq('incomeLevy（超過課税） = 328,650', r.incomeLevy, 328_650);
  // 均等割 = 2,000 + 3,000 + 1,000 = 6,000（prefPerCapita=2,000 に上書き）
  eq('perCapita（超過課税） = 6,000',    r.perCapita,    6_000);
}

// ─────────────────────────────────────────────────────────────
// 5. totalIncome（合計所得金額）が kaigo 用に正しく返るか
// ─────────────────────────────────────────────────────────────
console.log('\n== totalIncome（介護保険段階判定用） ==');

{
  // 給与 300万 → calcSalaryIncome(3,000,000) = 2,020,000
  const r = calculateJumin(null, { salary: 3_000_000 });
  eq('totalIncome = 2,020,000（基礎控除前の合計所得）', r.totalIncome, 2_020_000);
  // taxableIncome は基礎控除後
  eq('taxableIncome = 1,590,000', r.taxableIncome, 1_590_000);
}

// ─────────────────────────────────────────────────────────────
// 6. 年金受給者（65歳以上）
// ─────────────────────────────────────────────────────────────
console.log('\n== 年金受給者（65歳） ==');

{
  // 年金収入 200万 / 65歳
  // calcPensionIncome(2,000,000, 65) = 2,000,000 - 1,100,000 = 900,000
  // taxableIncome = 900,000 - 430,000 = 470,000
  // incomeLevy = 470,000 × 10% = 47,000
  const r = calculateJumin(null, { pension: 2_000_000, age: 65 });
  eq('taxableIncome = 470,000', r.taxableIncome, 470_000);
  eq('incomeLevy = 47,000',     r.incomeLevy,    47_000);
  eq('isTaxable = true',        r.isTaxable,     true);
  eq('totalIncome = 900,000',   r.totalIncome,   900_000);
}

// ─────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`結果: PASS ${passed} / FAIL ${failed}`);
if (failed === 0) console.log('✅ 全テスト通過');
console.log();
if (failed > 0) process.exit(1);
