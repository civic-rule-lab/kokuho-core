/**
 * js/core/jumin.js ユニットテスト
 * 実行: node scripts/test-jumin.js
 */
'use strict';

const path = require('path');
const { calculateJumin, JUMIN_DEFAULTS, calcTokuteiShinzokuDeduction } =
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
  // 調整控除 = 2,500（課税所得>200万・基礎控除差5万 → 最低額5万×5%）
  // 所得割 = 3,130,000 × 10% - 2,500 = 310,500
  // 均等割 = 1,000 + 3,000 + 1,000(国の森林環境税) = 5,000（令和6年度以降）
  // total = 310,500 + 5,000 = 315,500
  const r = calculateJumin(null, { salary: 5_000_000 });
  eq('taxableIncome = 3,130,000', r.taxableIncome, 3_130_000);
  eq('incomeLevy = 310,500',      r.incomeLevy,    310_500);
  eq('perCapita = 5,000',         r.perCapita,      5_000);
  eq('total = 315,500',           r.total,         315_500);
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
  // incomeLevy = 2,930,000 × 10% - 調整控除2,500 = 290,500 / 均等割 = 5,000
  const r = calculateJumin(null, { salary: 5_000_000, socialInsurance: 200_000 });
  eq('taxableIncome（社保控除後） = 2,930,000', r.taxableIncome, 2_930_000);
  eq('incomeLevy = 290,500',                    r.incomeLevy,    290_500);
  eq('total = 295,500',                         r.total,         295_500);
}

// ─────────────────────────────────────────────────────────────
// 4. 差分データ（超過課税自治体）
// ─────────────────────────────────────────────────────────────
console.log('\n== 差分データ（超過課税自治体） ==');

{
  // 神奈川県民税率が標準より高い想定
  const customData = { prefRate: 0.045, prefPerCapita: 2_000 };
  const r = calculateJumin(customData, { salary: 5_000_000 });
  // 所得割 = 3,130,000 × (0.045 + 0.06) = 328,650 - 調整控除2,500 = 326,150 → 100円未満切捨て 326,100
  eq('incomeLevy（超過課税） = 326,100', r.incomeLevy, 326_100);
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
  // incomeLevy = 470,000 × 10% - 調整控除2,500（min(5万,47万)×5%） = 44,500
  const r = calculateJumin(null, { pension: 2_000_000, age: 65 });
  eq('taxableIncome = 470,000', r.taxableIncome, 470_000);
  eq('incomeLevy = 44,500',     r.incomeLevy,    44_500);
  eq('isTaxable = true',        r.isTaxable,     true);
  eq('totalIncome = 900,000',   r.totalIncome,   900_000);
}

// ─────────────────────────────────────────────────────────────
// 7. 特定親族特別控除（令和8年度〜）: 控除額テーブルの境界値
//    出典: 横浜市・大阪市・西宮市 R8税制改正ページ（7段階）
// ─────────────────────────────────────────────────────────────
console.log('\n== 特定親族特別控除: 控除額テーブル境界値 ==');

{
  eq('所得58万（特定扶養の領域）= 0',        calcTokuteiShinzokuDeduction(580_000),   0);
  eq('所得58万+1円 = 45万',                  calcTokuteiShinzokuDeduction(580_001),   450_000);
  eq('所得95万 = 45万',                      calcTokuteiShinzokuDeduction(950_000),   450_000);
  eq('所得95万+1円 = 41万',                  calcTokuteiShinzokuDeduction(950_001),   410_000);
  eq('所得100万 = 41万',                     calcTokuteiShinzokuDeduction(1_000_000), 410_000);
  eq('所得100万+1円 = 31万',                 calcTokuteiShinzokuDeduction(1_000_001), 310_000);
  eq('所得105万+1円 = 21万',                 calcTokuteiShinzokuDeduction(1_050_001), 210_000);
  eq('所得110万+1円 = 11万',                 calcTokuteiShinzokuDeduction(1_100_001), 110_000);
  eq('所得115万+1円 = 6万',                  calcTokuteiShinzokuDeduction(1_150_001), 60_000);
  eq('所得120万+1円 = 3万',                  calcTokuteiShinzokuDeduction(1_200_001), 30_000);
  eq('所得123万 = 3万',                      calcTokuteiShinzokuDeduction(1_230_000), 30_000);
  eq('所得123万+1円（対象外）= 0',           calcTokuteiShinzokuDeduction(1_230_001), 0);
}

// ─────────────────────────────────────────────────────────────
// 8. 特定親族特別控除（B案: 子の給与収入から自動判定）
// ─────────────────────────────────────────────────────────────
console.log('\n== 特定親族特別控除: 給与収入からの自動判定 ==');

{
  // 親: 給与500万 / 子: 給与150万（所得85万 → 控除45万）
  // taxableIncome = 3,560,000 - 430,000 - 450,000 = 2,680,000
  // 調整控除: 課税所得>200万 → max(5万-(268万-200万), 5万)×5% = 2,500
  //   ※特定親族特別控除は人的控除差に算入しない（境港市・倉敷市R8調整控除一覧）
  // 所得割 = 268,000 - 2,500 = 265,500
  const r = calculateJumin(null, { salary: 5_000_000, specialDependentSalaries: [1_500_000] });
  eq('控除45万適用: specialDependentDeduction', r.specialDependentDeduction, 450_000);
  eq('taxableIncome = 2,680,000', r.taxableIncome, 2_680_000);
  eq('adjustmentCredit = 2,500（特別控除は控除差に算入しない）', r.adjustmentCredit, 2_500);
  eq('incomeLevy = 265,500', r.incomeLevy, 265_500);
}

{
  // 子の給与123万（所得58万）→ 自動的に従来の特定扶養控除45万＋人的控除差18万
  // taxableIncome = 2,680,000（控除額は同じ45万）
  // 調整控除: diff=5万+18万=23万 → max(23万-(268万-200万), 5万)×5% = 2,500（200万超なので最低額）
  const r = calculateJumin(null, { salary: 5_000_000, specialDependentSalaries: [1_230_000] });
  eq('給与123万→特定扶養45万', r.specialDependentDeduction, 450_000);
  eq('taxableIncome = 2,680,000', r.taxableIncome, 2_680_000);
}

{
  // 課税所得200万以下で調整控除の差を確認: 親給与300万
  // 子給与123万（特定扶養）: taxable = 2,020,000-430,000-450,000 = 1,140,000
  //   調整控除 = min(5万+18万, 114万)×5% = 11,500
  // 子給与123万+1円〜160万（特別控除45万）: taxable同額・調整控除 = min(5万,114万)×5% = 2,500
  const rFuyo = calculateJumin(null, { salary: 3_000_000, specialDependentSalaries: [1_230_000] });
  const rToku = calculateJumin(null, { salary: 3_000_000, specialDependentSalaries: [1_600_000] });
  eq('特定扶養: 調整控除 11,500', rFuyo.adjustmentCredit, 11_500);
  eq('特別控除(給与160万・所得95万→45万): 控除額', rToku.specialDependentDeduction, 450_000);
  eq('特別控除: 調整控除 2,500（控除差なし）', rToku.adjustmentCredit, 2_500);
  // 所得割: 114万×10% = 114,000 → 扶養 114,000-11,500=102,500 / 特別 114,000-2,500=111,500
  eq('特定扶養: incomeLevy = 102,500', rFuyo.incomeLevy, 102_500);
  eq('特別控除: incomeLevy = 111,500', rToku.incomeLevy, 111_500);
}

{
  // 給与収入ベースの段階確認（給与所得控除65万）
  // 165万→所得100万→41万 / 170万→105万→31万 / 188万→123万→3万 / 188万+1円→対象外0
  const inc = s => calculateJumin(null, { salary: 5_000_000, specialDependentSalaries: [s] }).specialDependentDeduction;
  eq('子給与165万 → 41万', inc(1_650_000), 410_000);
  eq('子給与170万 → 31万', inc(1_700_000), 310_000);
  eq('子給与188万 → 3万',  inc(1_880_000), 30_000);
  eq('子給与190万 → 0（所得125万・対象外）', inc(1_900_000), 0);
}

{
  // 非課税判定: 特定親族特別控除の対象者は扶養人数に含めない
  // 親給与110万（所得45万）・子給与130万（特別控除45万）
  //   均等割限度 = 35万×1+10万 = 45万 → 所得45万は非課税のまま（子は人数に入らない）
  const r = calculateJumin(null, { salary: 1_100_000, specialDependentSalaries: [1_300_000] });
  eq('特別控除対象の子は非課税判定の扶養人数に含めない → 非課税', r.isTaxable, false);
  // 対して特定扶養（子給与123万）なら扶養1人: 限度 = 35万×2+10万+21万 = 101万 → 非課税
  const r2 = calculateJumin(null, { salary: 1_100_000, specialDependentSalaries: [1_230_000] });
  eq('特定扶養なら扶養人数+1 → 非課税', r2.isTaxable, false);
}

// ─────────────────────────────────────────────────────────────
// 9. 事業所得（otherIncome）のみの入力（個人事業主）
// ─────────────────────────────────────────────────────────────
console.log('\n== 事業所得のみ（個人事業主） ==');

{
  // 事業所得 300万
  // taxableIncome = 3,000,000 - 430,000 = 2,570,000
  // 調整控除: 200万超 → max(5万-57万, 5万)×5% = 2,500
  // 所得割 = 257,000 - 2,500 = 254,500 / 均等割 5,000
  const r = calculateJumin(null, { otherIncome: 3_000_000 });
  eq('totalIncome = 3,000,000',   r.totalIncome,   3_000_000);
  eq('taxableIncome = 2,570,000', r.taxableIncome, 2_570_000);
  eq('incomeLevy = 254,500',      r.incomeLevy,    254_500);
  eq('total = 259,500',           r.total,         259_500);
}

{
  // 給与200万＋事業所得100万の合算
  // calcSalaryIncome(2,000,000) = 2,000,000 - (2,000,000×0.3+80,000) = 1,320,000
  // totalIncome = 1,320,000 + 1,000,000 = 2,320,000
  // taxableIncome = 2,320,000 - 430,000 = 1,890,000
  // 調整控除: 200万以下 → min(5万, 189万)×5% = 2,500
  // 所得割 = 189,000 - 2,500 = 186,500
  const r = calculateJumin(null, { salary: 2_000_000, otherIncome: 1_000_000 });
  eq('totalIncome = 2,320,000',   r.totalIncome,   2_320_000);
  eq('taxableIncome = 1,890,000', r.taxableIncome, 1_890_000);
  eq('incomeLevy = 186,500',      r.incomeLevy,    186_500);
}

// ─────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`);
console.log(`結果: PASS ${passed} / FAIL ${failed}`);
if (failed === 0) console.log('✅ 全テスト通過');
console.log();
if (failed > 0) process.exit(1);
