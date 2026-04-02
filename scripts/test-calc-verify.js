/**
 * 国保計算 公式値照合テスト（複数自治体）
 *
 * 各自治体の公式サイト・公式PDFに掲載された計算例と
 * エンジンの出力を照合する。
 *
 * 実行: node scripts/test-calc-verify.js
 * 特定自治体のみ: node scripts/test-calc-verify.js shinjuku
 *
 * ※ 「income」は前年の総所得金額等（給与所得・事業所得など）
 *    エンジンが内部で basicDeduction(43万) を差し引く。
 * ※ 複数所得者世帯は所得割が簡易計算（各人ごとの控除が1回になる）。
 *    公式計算例は単一所得者のケースを対象とすること。
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT     = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "municipalities");

// ─── 計算エンジン（engine.js と同一ロジック） ──────────────────
function calcKokuho(data, { income, family, preschool = 0, care = 0, salaryPensionCount = 1 }) {
  const baseIncome = Math.max(income - data.basicDeduction, 0);

  const medicalIncome = Math.round(baseIncome * data.rate.medical);
  const supportIncome = Math.round(baseIncome * data.rate.support);
  const careIncome    = care > 0 ? Math.round(baseIncome * data.rate.care) : 0;

  const medicalPerCapita = family * data.perCapita.medical;
  const supportPerCapita = family * data.perCapita.support;
  const carePerCapita    = care   * data.perCapita.care;

  const medicalHousehold = data.household?.medical || 0;
  const supportHousehold = data.household?.support || 0;
  const careHousehold    = care > 0 ? (data.household?.care || 0) : 0;

  const preschoolReductionMedical = Math.round(
    preschool * data.perCapita.medical * (data.preschoolReduction?.medicalPerCapitaRate || 0)
  );
  const preschoolReductionSupport = Math.round(
    preschool * data.perCapita.support * (data.preschoolReduction?.supportPerCapitaRate || 0)
  );
  const preschoolReduction = preschoolReductionMedical + preschoolReductionSupport;

  const B = Math.max(salaryPensionCount, 1);
  const extra = (data.reduction?.salaryPensionAdd || 0) * (B - 1);

  const sevenTenthsLimit =
    (data.reduction?.standards?.sevenTenths?.base || 0) +
    (data.reduction?.standards?.sevenTenths?.perPersonAdd || 0) * family + extra;
  const fiveTenthsLimit =
    (data.reduction?.standards?.fiveTenths?.base || 0) +
    (data.reduction?.standards?.fiveTenths?.perPersonAdd || 0) * family + extra;
  const twoTenthsLimit =
    (data.reduction?.standards?.twoTenths?.base || 0) +
    (data.reduction?.standards?.twoTenths?.perPersonAdd || 0) * family + extra;

  let reductionLabel = "軽減なし";
  let reductionRate  = 0;
  if      (income <= sevenTenthsLimit) { reductionLabel = "7割軽減"; reductionRate = data.reduction?.ratios?.sevenTenths || 0; }
  else if (income <= fiveTenthsLimit)  { reductionLabel = "5割軽減"; reductionRate = data.reduction?.ratios?.fiveTenths  || 0; }
  else if (income <= twoTenthsLimit)   { reductionLabel = "2割軽減"; reductionRate = data.reduction?.ratios?.twoTenths   || 0; }

  const medicalReduction = Math.round((medicalPerCapita + medicalHousehold) * reductionRate);
  const supportReduction = Math.round((supportPerCapita + supportHousehold) * reductionRate);
  const careReduction    = Math.round((carePerCapita    + careHousehold)    * reductionRate);

  let medicalTotal = medicalIncome + medicalPerCapita + medicalHousehold - preschoolReductionMedical - medicalReduction;
  let supportTotal = supportIncome + supportPerCapita + supportHousehold - preschoolReductionSupport - supportReduction;
  let careTotal    = careIncome    + carePerCapita    + careHousehold    - careReduction;

  medicalTotal = Math.min(Math.max(medicalTotal, 0), data.caps.medical);
  supportTotal = Math.min(Math.max(supportTotal, 0), data.caps.support);
  careTotal    = Math.min(Math.max(careTotal,    0), data.caps.care);

  return {
    medical: medicalTotal, support: supportTotal, care: careTotal,
    total: medicalTotal + supportTotal + careTotal,
    reductionLabel, preschoolReduction,
    totalReduction: medicalReduction + supportReduction + careReduction,
  };
}

// ─── テストケース定義 ──────────────────────────────────────────
//
// source: 出典（公式サイト・PDF等）
// tolerance: 許容誤差（円）。デフォルト1円。
// expected.medical/support/care/total: null は照合スキップ
//
const TEST_SUITES = [

  // ============================================================
  // 新宿区（東京都）
  // 出典: https://www.city.shinjuku.lg.jp/hoken/hoken01_002029.html
  // ============================================================
  {
    slug: "shinjuku",
    label: "新宿区",
    cases: [
      {
        label: "【公式例1】単身・給与所得160万円（20歳・介護なし）",
        note:  "給与収入240万円 → 給与所得160万円",
        input: { income: 1600000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { medical: 137507, support: 48273, care: 0, total: 185780, reductionLabel: "軽減なし" },
        source: "新宿区公式サイト 計算例",
      },
      {
        label: "【公式例2】4人家族・給与所得340万（45歳・未就学1人・介護1人）",
        note:  "給与収入480万 → 給与所得340万。子2歳（未就学）1人含む",
        input: { income: 3400000, family: 4, preschool: 1, care: 1, salaryPensionCount: 1 },
        expected: { medical: 394537, support: 138693, care: 83425, total: 616655, reductionLabel: "軽減なし" },
        source: "新宿区公式サイト 計算例",
      },
    ],
  },

  // ============================================================
  // 長野市（長野県）
  // 出典: 長野市 令和7年度 国民健康保険料 目安表（PDF）
  //       https://www.city.nagano.nagano.jp/documents/3682/meyasuhyou.pdf
  //
  // ※ 目安表は法定軽減を適用しない「総額」の表。
  //    軽減が生じないケース（所得高め）のみを照合対象とする。
  // ※ 「介護あり」列 = 世帯内に40〜64歳が2名いる想定（care=2）。
  //    ただし1人世帯（介護あり）は care=1。
  // ※ income = 総所得金額等（給与所得控除後）を入力する。
  // ============================================================
  {
    slug: "nagano",
    label: "長野市",
    cases: [
      {
        label: "【公式目安表】総所得202万・1人世帯・介護なし",
        note:  "給与収入300万 → 総所得金額等202万。twoTenthsLimit=99万 < 202万 → 軽減なし",
        input: { income: 2020000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { medical: 167820, support: 58320, care: 0, total: 226140, reductionLabel: "軽減なし" },
        source: "長野市 R7 目安表（給与収入300万・1人・その他）",
      },
      {
        label: "【公式目安表】総所得202万・1人世帯・介護あり（care=1）",
        note:  "給与収入300万 → 総所得金額等202万",
        input: { income: 2020000, family: 1, preschool: 0, care: 1, salaryPensionCount: 1 },
        expected: { medical: 167820, support: 58320, care: 57180, total: 283320, reductionLabel: "軽減なし" },
        source: "長野市 R7 目安表（給与収入300万・1人・介護あり）",
      },
      {
        label: "【公式目安表】総所得202万・2人世帯・介護なし",
        note:  "twoTenthsLimit=155万 < 202万 → 軽減なし",
        input: { income: 2020000, family: 2, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { medical: 185580, support: 64560, care: 0, total: 250140, reductionLabel: "軽減なし" },
        source: "長野市 R7 目安表（給与収入300万・2人・その他）",
      },
      {
        label: "【公式目安表】総所得202万・2人世帯・介護あり（care=2）",
        note:  "介護あり列は40〜64歳2名想定。twoTenthsLimit=155万 < 202万 → 軽減なし",
        input: { income: 2020000, family: 2, preschool: 0, care: 2, salaryPensionCount: 1 },
        expected: { medical: 185580, support: 64560, care: 65940, total: 316080, reductionLabel: "軽減なし" },
        source: "長野市 R7 目安表（給与収入300万・2人・介護あり）",
      },
      {
        label: "【公式目安表】総所得132万・1人世帯・介護なし",
        note:  "給与収入200万 → 総所得金額等132万。twoTenthsLimit=99万 < 132万 → 軽減なし",
        input: { income: 1320000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 149140, reductionLabel: "軽減なし" },
        source: "長野市 R7 目安表（給与収入200万・1人・その他）",
      },
      {
        label: "7割軽減判定（総所得43万・1人）",
        note:  "sevenTenthsLimit=43万。43万 ≤ 43万 → 7割軽減。合計額は目安表の51,240（軽減前）ではなく軽減後を検証",
        input: { income: 430000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "7割軽減" },
        source: "法定軽減判定確認",
      },
      {
        label: "5割軽減判定（総所得80万・2人・給与所得者1人）",
        note:  "fiveTenthsLimit=43万+30.5万×2=104万。80万 ≤ 104万 → 5割軽減",
        input: { income: 800000, family: 2, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "5割軽減" },
        source: "法定軽減判定確認",
      },
    ],
  },

  // ============================================================
  // 藤沢市（神奈川県）
  // 料率は公式サイトで確認済み。計算例はPNG画像のため目視不可。
  // 軽減判定の確認のみ行う。
  // ============================================================
  {
    slug: "fujisawa",
    label: "藤沢市",
    cases: [
      {
        label: "単身・所得0円（7割軽減）",
        input: { income: 0, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "7割軽減" },
        source: "手計算（軽減判定確認）",
      },
      {
        label: "2人世帯・所得43万（7割軽減ボーダー）",
        note: "sevenTenthsLimit=43万。所得43万=ジャスト7割軽減",
        input: { income: 430000, family: 2, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得43.1万（7割軽減外・5割軽減内）",
        note: "fiveTenthsLimit=43万+30.5万×2=104万。所得43.1万 → 5割軽減",
        input: { income: 431000, family: 2, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "5割軽減" },
        source: "手計算",
      },
      {
        label: "1人世帯・所得300万（軽減なし）",
        note:  "twoTenthsLimit=43万+56万=99万 < 300万 → 軽減なし",
        input: { income: 3000000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "軽減なし" },
        source: "手計算",
      },
    ],
  },

  // ============================================================
  // さいたま市（埼玉県）
  // 料率: 医療7.13% 支援2.60% 介護2.24%
  // 均等割: 医療38,300 支援13,500 介護14,600 / 平等割なし
  // 上限: 医療66万 支援26万 介護17万
  // 手計算による軽減判定・計算確認
  // ============================================================
  {
    slug: "saitama",
    label: "さいたま市",
    cases: [
      {
        label: "単身・所得0円（7割軽減）",
        note:  "sevenTenthsLimit=43万。所得0 → 7割軽減。医療=38300×0.3=11490、支援=13500×0.3=4050",
        input: { income: 0, family: 1, preschool: 0, care: 0 },
        expected: { medical: 11490, support: 4050, care: 0, total: 15540, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "単身・所得200万（軽減なし）",
        note:  "twoTenthsLimit=43万+56万=99万 < 200万 → 軽減なし。baseIncome=157万",
        input: { income: 2000000, family: 1, preschool: 0, care: 0 },
        expected: { medical: 150241, support: 54320, care: 0, total: 204561, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得43万（7割軽減ボーダー）",
        note:  "sevenTenthsLimit=43万（perPersonAdd=0）。43万 ≤ 43万 → 7割軽減",
        input: { income: 430000, family: 2, preschool: 0, care: 0 },
        expected: { reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得43.1万（5割軽減）",
        note:  "fiveTenthsLimit=43万+30.5万×2=104万。43.1万 ≤ 104万 → 5割軽減",
        input: { income: 431000, family: 2, preschool: 0, care: 0 },
        expected: { reductionLabel: "5割軽減" },
        source: "手計算",
      },
    ],
  },

  // ============================================================
  // 千葉市（千葉県）
  // 料率: 医療7.14% 支援2.85% 介護2.36%
  // 均等割: 医療21,840 支援8,640 介護10,680
  // 平等割: 医療25,800 支援10,320 介護8,040
  // 上限: 医療66万 支援26万 介護17万
  // 手計算による確認（平等割あり自治体の動作検証）
  // ============================================================
  {
    slug: "chiba",
    label: "千葉市",
    cases: [
      {
        label: "単身・所得0円（7割軽減・平等割あり）",
        note:  "均等割+平等割=47,640。7割軽減=33,348。医療=14,292。支援=5,688",
        input: { income: 0, family: 1, preschool: 0, care: 0 },
        expected: { medical: 14292, support: 5688, care: 0, total: 19980, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "単身・所得200万（軽減なし・平等割あり）",
        note:  "twoTenthsLimit=99万 < 200万 → 軽減なし。医療=112,098+21,840+25,800=159,738",
        input: { income: 2000000, family: 1, preschool: 0, care: 0 },
        expected: { medical: 159738, support: 63705, care: 0, total: 223443, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得0円（7割軽減・平等割あり）",
        note:  "均等割2人分+平等割: 医療69,480 支援27,600。7割軽減後: 医療20,844 支援8,280",
        input: { income: 0, family: 2, preschool: 0, care: 0 },
        expected: { medical: 20844, support: 8280, care: 0, total: 29124, reductionLabel: "7割軽減" },
        source: "手計算",
      },
    ],
  },

  // ============================================================
  // 大阪市（大阪府）
  // 料率: 医療9.30% 支援3.02% 介護2.56%（府統一料率）
  // 均等割: 医療34,424 支援11,034 介護18,784
  // 平等割: 医療33,574 支援10,761 介護0
  // 上限: 医療65万 支援24万 介護17万
  // 大阪府統一保険料率（R6〜）の動作確認
  // ============================================================
  {
    slug: "osaka",
    label: "大阪市",
    cases: [
      {
        label: "単身・所得0円（7割軽減・府統一料率）",
        note:  "均等割+平等割=67,998。7割軽減=47,599。医療=20,399、支援=6,538",
        input: { income: 0, family: 1, preschool: 0, care: 0 },
        expected: { medical: 20399, support: 6538, care: 0, total: 26937, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "単身・所得200万（軽減なし・府統一料率）",
        note:  "twoTenthsLimit=99万 < 200万 → 軽減なし。医療=146,010+34,424+33,574=214,008",
        input: { income: 2000000, family: 1, preschool: 0, care: 0 },
        expected: { medical: 214008, support: 69209, care: 0, total: 283217, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得43万（7割軽減ボーダー）",
        note:  "sevenTenthsLimit=43万（perPersonAdd=0）。43万 ≤ 43万 → 7割軽減",
        input: { income: 430000, family: 2, preschool: 0, care: 0 },
        expected: { reductionLabel: "7割軽減" },
        source: "手計算",
      },
    ],
  },

  // ============================================================
  // 福岡市（福岡県）
  // 料率: 医療5.96% 支援3.28% 介護2.81%
  // 均等割: 医療19,980 支援10,334 介護10,386
  // 平等割: 医療18,863 支援9,757 介護7,912
  // 上限: 医療66万 支援26万 介護17万
  // 手計算による確認
  // ============================================================
  {
    slug: "fukuoka",
    label: "福岡市",
    cases: [
      {
        label: "単身・所得0円（7割軽減）",
        note:  "均等割+平等割: 医療38,843 支援20,091。7割軽減後: 医療11,653 支援6,027",
        input: { income: 0, family: 1, preschool: 0, care: 0 },
        expected: { medical: 11653, support: 6027, care: 0, total: 17680, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "単身・所得200万（軽減なし）",
        note:  "twoTenthsLimit=99万 < 200万 → 軽減なし。医療=93,572+19,980+18,863=132,415",
        input: { income: 2000000, family: 1, preschool: 0, care: 0 },
        expected: { medical: 132415, support: 71587, care: 0, total: 204002, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得43万（7割軽減ボーダー）",
        note:  "sevenTenthsLimit=43万（perPersonAdd=0）。43万 ≤ 43万 → 7割軽減",
        input: { income: 430000, family: 2, preschool: 0, care: 0 },
        expected: { reductionLabel: "7割軽減" },
        source: "手計算",
      },
    ],
  },
];

// ─── テスト実行 ────────────────────────────────────────────────
const targetSlug = process.argv[2] || null;
const suites = targetSlug
  ? TEST_SUITES.filter(s => s.slug === targetSlug)
  : TEST_SUITES;

if (suites.length === 0) {
  console.error(`❌ テストスイートが見つかりません: ${targetSlug}`);
  process.exit(1);
}

let totalPassed = 0;
let totalFailed = 0;

for (const suite of suites) {
  const dataPath = path.join(DATA_DIR, suite.slug, "kokuho-2025.json");
  if (!existsSync(dataPath)) {
    console.log(`\n❌ ${suite.label}: kokuho-2025.json が存在しません`);
    continue;
  }
  const data = JSON.parse(readFileSync(dataPath, "utf-8"));

  console.log(`\n${"=".repeat(64)}`);
  console.log(`${suite.label} (${suite.slug})`);
  console.log(`${"=".repeat(64)}`);

  for (const tc of suite.cases) {
    const result = calcKokuho(data, tc.input);
    const exp    = tc.expected;
    const tol    = tc.tolerance ?? 1;
    const issues = [];

    for (const key of ["medical", "support", "care", "total"]) {
      if (exp[key] != null) {
        const diff = Math.abs(result[key] - exp[key]);
        if (diff > tol) {
          issues.push(`${key}: 期待=${exp[key].toLocaleString()} 実際=${result[key].toLocaleString()} 差=${diff}`);
        }
      }
    }
    if (exp.reductionLabel != null && result.reductionLabel !== exp.reductionLabel) {
      issues.push(`軽減判定: 期待=${exp.reductionLabel} 実際=${result.reductionLabel}`);
    }

    const ok = issues.length === 0;
    if (ok) totalPassed++; else totalFailed++;

    const icon   = ok ? "✅" : "❌";
    const inputs = `所得${(tc.input.income/10000).toFixed(0)}万 / ${tc.input.family}人 / 介護${tc.input.care} / 未就学${tc.input.preschool}`;
    console.log(`${icon} ${tc.label}`);
    if (tc.note) console.log(`   補足: ${tc.note}`);
    console.log(`   入力: ${inputs}`);
    console.log(`   結果: 医療${result.medical.toLocaleString()} + 支援${result.support.toLocaleString()} + 介護${result.care.toLocaleString()} = 年間${result.total.toLocaleString()}円 [${result.reductionLabel}]`);
    console.log(`   出典: ${tc.source}`);
    if (!ok) issues.forEach(i => console.log(`   ⚠️  ${i}`));
  }
}

console.log(`\n${"─".repeat(64)}`);
console.log(`結果: PASS ${totalPassed} / FAIL ${totalFailed}`);
if (totalFailed === 0) console.log("✅ 全テスト通過");
console.log();
