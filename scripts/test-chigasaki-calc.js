/**
 * 茅ヶ崎市 国保計算 照合テスト
 *
 * engine.js と同一のロジックを Node.js で再現し、
 * 公式計算例・手計算値と比較する。
 *
 * 実行: node scripts/test-chigasaki-calc.js
 *
 * 公式計算例の追加方法:
 *   TEST_CASES の expected フィールドに
 *   茅ヶ崎市公式サイト・通知書の値を記入する。
 *   null のままの場合は「参考値」として表示のみ。
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "../data/municipalities/chigasaki/kokuho-2025.json");
const data = JSON.parse(readFileSync(DATA_PATH, "utf-8"));

// ─────────────────────────────────────────────
// 計算エンジン（engine.js と同一ロジック）
// ─────────────────────────────────────────────

function calcKokuho(data, { income, family, preschool, care, salaryPensionCount }) {
  const baseIncome = Math.max(income - data.basicDeduction, 0);

  // 所得割
  const medicalIncome  = Math.round(baseIncome * data.rate.medical);
  const supportIncome  = Math.round(baseIncome * data.rate.support);
  const careIncome     = Math.round(baseIncome * data.rate.care);

  // 均等割
  const medicalPerCapita  = family * data.perCapita.medical;
  const supportPerCapita  = family * data.perCapita.support;
  const carePerCapita     = care   * data.perCapita.care;

  // 平等割
  const medicalHousehold  = data.household?.medical || 0;
  const supportHousehold  = data.household?.support || 0;
  const careHousehold     = care > 0 ? (data.household?.care || 0) : 0;

  // 未就学児軽減
  const preschoolReductionMedical = Math.round(
    preschool * data.perCapita.medical * (data.preschoolReduction?.medicalPerCapitaRate || 0)
  );
  const preschoolReductionSupport = Math.round(
    preschool * data.perCapita.support * (data.preschoolReduction?.supportPerCapitaRate || 0)
  );
  const preschoolReduction = preschoolReductionMedical + preschoolReductionSupport;

  // 軽減判定
  const B = Math.max(salaryPensionCount, 1);
  const salaryPensionAdd = data.reduction?.salaryPensionAdd || 0;
  const extraForIncomeEarners = salaryPensionAdd * (B - 1);

  const sevenTenthsLimit =
    (data.reduction?.standards?.sevenTenths?.base || 0) +
    (data.reduction?.standards?.sevenTenths?.perPersonAdd || 0) * family +
    extraForIncomeEarners;

  const fiveTenthsLimit =
    (data.reduction?.standards?.fiveTenths?.base || 0) +
    (data.reduction?.standards?.fiveTenths?.perPersonAdd || 0) * family +
    extraForIncomeEarners;

  const twoTenthsLimit =
    (data.reduction?.standards?.twoTenths?.base || 0) +
    (data.reduction?.standards?.twoTenths?.perPersonAdd || 0) * family +
    extraForIncomeEarners;

  let reductionLabel = "軽減なし";
  let reductionRate  = 0;

  if (income <= sevenTenthsLimit) {
    reductionLabel = "7割軽減";
    reductionRate  = data.reduction?.ratios?.sevenTenths || 0;
  } else if (income <= fiveTenthsLimit) {
    reductionLabel = "5割軽減";
    reductionRate  = data.reduction?.ratios?.fiveTenths || 0;
  } else if (income <= twoTenthsLimit) {
    reductionLabel = "2割軽減";
    reductionRate  = data.reduction?.ratios?.twoTenths || 0;
  }

  // 軽減額（均等割＋平等割に適用）
  const medicalReduction = Math.round((medicalPerCapita + medicalHousehold) * reductionRate);
  const supportReduction = Math.round((supportPerCapita + supportHousehold) * reductionRate);
  const careReduction    = Math.round((carePerCapita    + careHousehold)    * reductionRate);

  // 区分別合計
  let medicalTotal = medicalIncome + medicalPerCapita + medicalHousehold - preschoolReductionMedical - medicalReduction;
  let supportTotal = supportIncome + supportPerCapita + supportHousehold - preschoolReductionSupport - supportReduction;
  let careTotal    = careIncome    + carePerCapita    + careHousehold    - careReduction;

  medicalTotal = Math.max(medicalTotal, 0);
  supportTotal = Math.max(supportTotal, 0);
  careTotal    = Math.max(careTotal,    0);

  // 限度額
  medicalTotal = Math.min(medicalTotal, data.caps.medical);
  supportTotal = Math.min(supportTotal, data.caps.support);
  careTotal    = Math.min(careTotal,    data.caps.care);

  const total   = medicalTotal + supportTotal + careTotal;
  const monthly = Math.round(total / 12);
  const totalReduction = medicalReduction + supportReduction + careReduction;

  return {
    medical: medicalTotal,
    support: supportTotal,
    care: careTotal,
    preschoolReduction,
    totalReduction,
    reductionLabel,
    total,
    monthly,
    // 内訳（デバッグ用）
    _detail: {
      baseIncome,
      medicalIncome, supportIncome, careIncome,
      medicalPerCapita, supportPerCapita, carePerCapita,
      medicalHousehold, supportHousehold, careHousehold,
      sevenTenthsLimit, fiveTenthsLimit, twoTenthsLimit,
    }
  };
}

// ─────────────────────────────────────────────
// テストケース定義
//
// expected: 公式・手計算による期待値（null = 参考表示のみ）
// tolerance: 許容誤差（円）
// ─────────────────────────────────────────────

const TEST_CASES = [
  {
    label: "単身・所得300万・給与所得者1人（軽減なし）",
    input: { income: 3000000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
    expected: {
      // ※ 公式値が判明したら記入する
      // total: 380524,
      total: null,
      reductionLabel: "軽減なし",
    },
  },
  {
    label: "単身・所得0円（7割軽減）",
    input: { income: 0, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
    expected: {
      reductionLabel: "7割軽減",
      total: null,
    },
  },
  {
    label: "2人家族・所得100万・給与所得者1人（5割軽減）",
    input: { income: 1000000, family: 2, preschool: 0, care: 0, salaryPensionCount: 1 },
    expected: {
      // sevenTenthsLimit = 430000, fiveTenthsLimit = 430000+305000*2 = 1040000
      // income 1000000 <= 1040000 → 5割軽減
      reductionLabel: "5割軽減",
      total: null,
    },
  },
  {
    label: "3人家族・所得200万・未就学児1人・給与所得者1人",
    input: { income: 2000000, family: 3, preschool: 1, care: 0, salaryPensionCount: 1 },
    expected: {
      reductionLabel: "軽減なし",
      total: null,
    },
  },
  {
    label: "4人家族・所得300万・介護1人・給与所得者2人（軽減なし）",
    input: { income: 3000000, family: 4, preschool: 0, care: 1, salaryPensionCount: 2 },
    expected: {
      reductionLabel: "軽減なし",
      total: null,
    },
  },
  {
    label: "単身・所得430万（上限付近）",
    input: { income: 4300000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
    expected: {
      reductionLabel: "軽減なし",
      total: null,
    },
  },
  // ─── 公式サイト掲載の計算例をここに追加 ───
  // {
  //   label: "【公式】〇〇のケース",
  //   input: { income: ?, family: ?, preschool: ?, care: ?, salaryPensionCount: ? },
  //   expected: { total: ?, reductionLabel: "?" },
  // },
];

// ─────────────────────────────────────────────
// テスト実行
// ─────────────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;

console.log(`\n${"=".repeat(60)}`);
console.log(`茅ヶ崎市 国保計算 照合テスト (${data.fiscalYear}年度)`);
console.log(`${"=".repeat(60)}\n`);

for (const tc of TEST_CASES) {
  const result = calcKokuho(data, tc.input);
  const exp = tc.expected;
  const issues = [];

  // 軽減判定の照合
  if (exp.reductionLabel !== undefined && exp.reductionLabel !== null) {
    if (result.reductionLabel !== exp.reductionLabel) {
      issues.push(`軽減判定: 期待=${exp.reductionLabel} 実際=${result.reductionLabel}`);
    }
  }

  // 年間合計の照合
  if (exp.total !== undefined && exp.total !== null) {
    const diff = Math.abs(result.total - exp.total);
    if (diff > (tc.tolerance || 1)) {
      issues.push(`年間合計: 期待=${exp.total.toLocaleString()} 実際=${result.total.toLocaleString()} 差=${diff}`);
    }
  } else {
    skipped++;
  }

  const status = issues.length === 0 ? "✅ PASS" : "❌ FAIL";
  if (issues.length === 0) passed++; else failed++;

  console.log(`${status}  ${tc.label}`);
  console.log(`       所得=${tc.input.income.toLocaleString()}円 / ${tc.input.family}人家族 / 介護${tc.input.care}人 / 未就学${tc.input.preschool}人 / 給与年金${tc.input.salaryPensionCount}人`);
  console.log(`       → 医療 ${result.medical.toLocaleString()} + 支援 ${result.support.toLocaleString()} + 介護 ${result.care.toLocaleString()} = 年間 ${result.total.toLocaleString()}円 / 月額 ${result.monthly.toLocaleString()}円 [${result.reductionLabel}]`);
  if (result.preschoolReduction > 0) {
    console.log(`          未就学児軽減: -${result.preschoolReduction.toLocaleString()}円`);
  }
  if (result.totalReduction > 0) {
    console.log(`          法定軽減:     -${result.totalReduction.toLocaleString()}円`);
  }
  if (issues.length > 0) {
    issues.forEach(i => console.log(`       ⚠️  ${i}`));
  }
  console.log();
}

console.log(`${"─".repeat(60)}`);
console.log(`結果: PASS ${passed} / FAIL ${failed} / 公式値未設定 ${skipped} ケース`);
if (skipped > 0) {
  console.log(`\n※ 公式値未設定のケースは TEST_CASES の expected.total に`);
  console.log(`  茅ヶ崎市公式サイトの値を記入してください。`);
  console.log(`  https://www.city.chigasaki.kanagawa.jp/`);
}
console.log();
