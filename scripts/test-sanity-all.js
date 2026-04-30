/**
 * 全自治体 サニティチェック
 *
 * 全1,700+自治体 × 固定パターン4種を機械的に検証。
 * 「計算できる」だけでなく「明らかにおかしい値が出ない」ことを保証する。
 *
 * 実行: node scripts/test-sanity-all.js
 * 特定年度: node scripts/test-sanity-all.js --year=2026
 * 詳細表示: node scripts/test-sanity-all.js --verbose
 *
 * 検証項目:
 *   - NaN / Infinity が出ない
 *   - 各区分が 0 以上
 *   - 各区分が caps を超えない
 *   - 合計 = 各区分の和
 *   - 軽減判定が有効な値のいずれか
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { calculateKokuho } = require("../js/core/kokuho.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT     = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "municipalities");

const args    = process.argv.slice(2);
const verbose = args.includes("--verbose");
const yearArg = args.find(a => a.startsWith("--year="));
const YEAR    = yearArg ? parseInt(yearArg.split("=")[1]) : 2025;

const VALID_LABELS = new Set(["7割軽減", "5割軽減", "2割軽減", "軽減なし"]);

// 4パターン × care あり/なし = 実質8パターン
const PATTERNS = [
  { income: 0,       family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0 },
  { income: 0,       family: 1, preschool: 0, under18: 0, care: 1, salaryPensionCount: 1, fixedAssetTax: 0 },
  { income: 2000000, family: 2, preschool: 1, under18: 1, care: 0, salaryPensionCount: 1, fixedAssetTax: 0 },
  { income: 2000000, family: 2, preschool: 0, under18: 0, care: 1, salaryPensionCount: 1, fixedAssetTax: 0 },
  { income: 5000000, family: 3, preschool: 0, under18: 0, care: 0, salaryPensionCount: 2, fixedAssetTax: 0 },
  { income: 5000000, family: 3, preschool: 0, under18: 0, care: 1, salaryPensionCount: 2, fixedAssetTax: 0 },
  { income: 10000000, family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0 },
  { income: 10000000, family: 1, preschool: 0, under18: 0, care: 1, salaryPensionCount: 1, fixedAssetTax: 0 },
];

function validateResult(r, data, input) {
  const issues = [];

  const keys = ["medicalTotal", "supportTotal", "careTotal", "childcareTotal", "total"];
  for (const k of keys) {
    if (!isFinite(r[k])) issues.push(`${k} が NaN/Infinity`);
    if (r[k] < 0)        issues.push(`${k} が負 (${r[k]})`);
  }

  if (isFinite(r.medicalTotal)   && r.medicalTotal   > data.caps.medical)              issues.push(`医療分が上限超過 (${r.medicalTotal} > ${data.caps.medical})`);
  if (isFinite(r.supportTotal)   && r.supportTotal   > data.caps.support)              issues.push(`支援分が上限超過 (${r.supportTotal} > ${data.caps.support})`);
  if (isFinite(r.careTotal)      && r.careTotal      > data.caps.care)                 issues.push(`介護分が上限超過 (${r.careTotal} > ${data.caps.care})`);
  if (isFinite(r.childcareTotal) && data.childcareLevy?.cap != null
      && r.childcareTotal > (data.childcareLevy.cap ?? 30000))                         issues.push(`子育て分が上限超過 (${r.childcareTotal} > ${data.childcareLevy.cap})`);

  const expectedTotal = r.medicalTotal + r.supportTotal + r.careTotal + r.childcareTotal;
  if (Math.abs(r.total - expectedTotal) > 0)                                           issues.push(`合計不一致 (${r.total} ≠ ${expectedTotal})`);

  if (!VALID_LABELS.has(r.reductionLabel))                                             issues.push(`軽減判定が不正な値 "${r.reductionLabel}"`);

  return issues;
}

// 全自治体スラグを収集
const slugs = readdirSync(DATA_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

let totalFiles   = 0;
let totalCases   = 0;
let totalFailed  = 0;
const failures   = [];

for (const slug of slugs) {
  const dataPath = path.join(DATA_DIR, slug, `kokuho-${YEAR}.json`);
  if (!existsSync(dataPath)) continue;

  let data;
  try {
    data = JSON.parse(readFileSync(dataPath, "utf-8"));
  } catch (e) {
    failures.push({ slug, pattern: "JSON parse", issues: [e.message] });
    totalFailed++;
    continue;
  }
  totalFiles++;

  for (const input of PATTERNS) {
    totalCases++;
    let r;
    try {
      r = calculateKokuho(data, input);
    } catch (e) {
      failures.push({ slug, pattern: JSON.stringify(input), issues: [`例外発生: ${e.message}`] });
      totalFailed++;
      continue;
    }

    const issues = validateResult(r, data, input);
    if (issues.length > 0) {
      totalFailed++;
      failures.push({ slug, pattern: `所得${input.income/10000}万/${input.family}人/介護${input.care}`, issues });
    } else if (verbose) {
      console.log(`  ✅ ${slug} 所得${input.income/10000}万/${input.family}人/介護${input.care} → ${r.total.toLocaleString()}円 [${r.reductionLabel}]`);
    }
  }
}

// ─── 結果表示 ────────────────────────────────────────────────────
console.log(`\n${"=".repeat(60)}`);
console.log(`全件サニティチェック (${YEAR}年度)`);
console.log(`${"=".repeat(60)}`);
console.log(`対象: ${totalFiles}自治体 × ${PATTERNS.length}パターン = ${totalCases}ケース`);

if (failures.length > 0) {
  console.log(`\n❌ FAIL: ${totalFailed}件`);
  for (const f of failures) {
    console.log(`\n  自治体: ${f.slug}`);
    console.log(`  入力:   ${f.pattern}`);
    f.issues.forEach(i => console.log(`  ⚠️  ${i}`));
  }
} else {
  console.log(`\n✅ 全 ${totalCases} ケース通過`);
}

console.log(`\n${"─".repeat(60)}`);
console.log(`PASS: ${totalCases - totalFailed} / FAIL: ${totalFailed}`);
console.log();

if (totalFailed > 0) process.exit(1);
