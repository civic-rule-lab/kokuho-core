/**
 * 介護保険 データバリデーションスクリプト
 *
 * 実行:
 *   node scripts/validate-kaigo-data.js                   # 2026年度全件
 *   node scripts/validate-kaigo-data.js --year=2026
 *   node scripts/validate-kaigo-data.js --slug=yokohama   # 特定自治体
 *   node scripts/validate-kaigo-data.js --verified-only   # verified のみ
 *   node scripts/validate-kaigo-data.js --strict          # warning も FAIL 扱い
 *
 * チェック内容:
 *   [構造] 必須フィールドの存在・型
 *   [数値] baseAmount の妥当範囲（30,000〜150,000円/年）
 *   [段階] brackets 配列の構造・criteria の整合性
 *   [境界] 段階間の境界値が連続しているか（gaps / overlaps）
 *   [感覚] baseAmount が全国相場から大きく外れていないか
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const DATA_DIR  = path.join(ROOT, "data", "municipalities");

const YEAR_ARG      = process.argv.find(a => a.startsWith("--year="));
const YEAR          = YEAR_ARG ? parseInt(YEAR_ARG.split("=")[1]) : 2026;
const SLUG_FILTER   = (process.argv.find(a => a.startsWith("--slug=")) || "").replace("--slug=", "") || null;
const VERIFIED_ONLY = process.argv.includes("--verified-only");
const STRICT        = process.argv.includes("--strict");

// ─── 集計 ─────────────────────────────────────────────────────

let totalFiles = 0, totalErrors = 0, totalWarnings = 0;
const report = [];

// ─── バリデーション関数 ────────────────────────────────────────

function validateKaigoData(slug, data) {
  const errors   = [];
  const warnings = [];

  function err(msg)  { errors.push(msg); }
  function warn(msg) { warnings.push(msg); }

  // ── 必須フィールド ──
  const required = ["cityCode", "citySlug", "fiscalYear", "system",
                    "schemaVersion", "status", "baseAmount", "brackets", "fallbackLevel"];
  for (const f of required) {
    if (data[f] === undefined) err(`必須フィールドなし: ${f}`);
  }
  if (data.system && data.system !== "kaigo") err(`system は "kaigo" であること (実際: "${data.system}")`);

  // ── status ──
  const validStatuses = ["needs_update", "verified", "inferred"];
  if (data.status && !validStatuses.includes(data.status)) {
    err(`status が不正: "${data.status}" (許可値: ${validStatuses.join(", ")})`);
  }
  if (VERIFIED_ONLY && data.status !== "verified") return { errors, warnings, skipped: true };

  // needs_update の場合は baseAmount/brackets が null でも警告のみ
  if (data.status === "needs_update") {
    if (data.baseAmount === null) warn("baseAmount 未収集 (status=needs_update)");
    if (data.brackets === null)   warn("brackets 未収集 (status=needs_update)");
    return { errors, warnings };
  }

  // ── baseAmount ──
  if (typeof data.baseAmount !== "number" || !Number.isFinite(data.baseAmount)) {
    err("baseAmount が数値でない");
  } else {
    if (data.baseAmount < 30_000)  err(`baseAmount が低すぎる: ${data.baseAmount.toLocaleString()}円`);
    if (data.baseAmount > 150_000) err(`baseAmount が高すぎる: ${data.baseAmount.toLocaleString()}円`);
    // 感覚値チェック
    if (data.baseAmount < 50_000)  warn(`baseAmount が全国相場より低め: ${data.baseAmount.toLocaleString()}円`);
    if (data.baseAmount > 120_000) warn(`baseAmount が全国相場より高め: ${data.baseAmount.toLocaleString()}円`);
  }

  // ── brackets ──
  if (!Array.isArray(data.brackets) || data.brackets.length === 0) {
    err("brackets が空または配列でない");
    return { errors, warnings };
  }

  if (data.brackets.length < 5)  warn(`段階数が少ない: ${data.brackets.length}段階（通常9〜16）`);
  if (data.brackets.length > 20) warn(`段階数が多い: ${data.brackets.length}段階（要確認）`);

  // fallbackLevel が brackets に存在するか
  if (data.fallbackLevel !== undefined) {
    const hasFallback = data.brackets.some(b => String(b.level) === String(data.fallbackLevel));
    if (!hasFallback) err(`fallbackLevel "${data.fallbackLevel}" が brackets に存在しない`);
  }

  // 各 bracket の構造チェック
  for (const [i, b] of data.brackets.entries()) {
    const prefix = `brackets[${i}](level=${b.level})`;

    if (b.level === undefined)    err(`${prefix}: level がない`);
    if (b.label === undefined)    err(`${prefix}: label がない`);
    if (b.rate  === undefined && b.annual === undefined)
      err(`${prefix}: rate または annual が必要`);
    if (b.rate  !== undefined && (typeof b.rate !== "number" || b.rate <= 0))
      err(`${prefix}: rate が不正 (${b.rate})`);
    if (b.annual !== undefined && (typeof b.annual !== "number" || b.annual <= 0))
      err(`${prefix}: annual が不正 (${b.annual})`);
    if (!b.criteria && i < data.brackets.length - 1)
      warn(`${prefix}: criteria がない（最終段階以外）`);

    // criteria フィールドの型チェック
    if (b.criteria) {
      const c = b.criteria;
      for (const key of ["householdAllNonTaxable", "selfTaxable"]) {
        if (c[key] !== undefined && typeof c[key] !== "boolean")
          err(`${prefix}.criteria.${key} は boolean であること`);
      }
      for (const key of ["pensionIncomeMax", "pensionIncomeMin", "totalIncomeMax", "totalIncomeMin"]) {
        if (c[key] !== undefined && (typeof c[key] !== "number" || !Number.isFinite(c[key])))
          err(`${prefix}.criteria.${key} は有限数値であること`);
      }
      // 最小 ≤ 最大チェック
      if (c.pensionIncomeMin !== undefined && c.pensionIncomeMax !== undefined &&
          c.pensionIncomeMin > c.pensionIncomeMax)
        err(`${prefix}: pensionIncomeMin > pensionIncomeMax`);
      if (c.totalIncomeMin !== undefined && c.totalIncomeMax !== undefined &&
          c.totalIncomeMin > c.totalIncomeMax)
        err(`${prefix}: totalIncomeMin > totalIncomeMax`);
    }
  }

  // ── 境界の連続性チェック（totalIncome 系のみ、課税者段階） ──
  const taxableBrackets = data.brackets
    .filter(b => b.criteria?.selfTaxable === true)
    .filter(b => b.criteria?.totalIncomeMax !== undefined || b.criteria?.totalIncomeMin !== undefined);

  if (taxableBrackets.length >= 2) {
    const sorted = [...taxableBrackets].sort(
      (a, b) => (a.criteria.totalIncomeMin ?? 0) - (b.criteria.totalIncomeMin ?? 0)
    );
    for (let i = 0; i < sorted.length - 1; i++) {
      const cur  = sorted[i];
      const next = sorted[i + 1];
      const curMax  = cur.criteria.totalIncomeMax;
      const nextMin = next.criteria.totalIncomeMin;
      if (curMax !== undefined && nextMin !== undefined && curMax + 1 !== nextMin) {
        warn(`課税段階の境界に gap/overlap: ${cur.level}(max=${curMax}) → ${next.level}(min=${nextMin})`);
      }
    }
  }

  // ── source チェック（verified の場合は URL 必須） ──
  if (data.status === "verified") {
    if (!data.source?.url) warn("status=verified だが source.url がない");
    if (!data.source?.retrievedAt) warn("source.retrievedAt がない");
  }

  return { errors, warnings };
}

// ─── 全件ループ ─────────────────────────────────────────────────

const slugs = SLUG_FILTER
  ? [SLUG_FILTER]
  : readdirSync(DATA_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort();

const byStatus = { verified: 0, inferred: 0, needs_update: 0, missing: 0 };

for (const slug of slugs) {
  const dataPath = path.join(DATA_DIR, slug, `kaigo-${YEAR}.json`);

  if (!existsSync(dataPath)) {
    byStatus.missing++;
    continue;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(dataPath, "utf-8"));
  } catch (e) {
    report.push({ slug, errors: [`JSON parse エラー: ${e.message}`], warnings: [], skipped: false });
    totalErrors++;
    continue;
  }

  totalFiles++;
  byStatus[data.status] = (byStatus[data.status] || 0) + 1;

  const { errors, warnings, skipped } = validateKaigoData(slug, data);
  if (skipped) continue;

  if (errors.length > 0 || warnings.length > 0) {
    report.push({ slug, errors, warnings, status: data.status });
  }
  totalErrors   += errors.length;
  totalWarnings += warnings.length;
}

// ─── 結果表示 ─────────────────────────────────────────────────

console.log(`\n${"=".repeat(60)}`);
console.log(`介護保険データ バリデーション (${YEAR}年度)`);
console.log(`${"=".repeat(60)}`);
console.log(`\n対象: ${totalFiles}ファイル | missing: ${byStatus.missing}`);
console.log(`  verified:     ${byStatus.verified}`);
console.log(`  inferred:     ${byStatus.inferred}`);
console.log(`  needs_update: ${byStatus.needs_update}`);

if (report.length > 0) {
  console.log(`\n${"─".repeat(60)}`);
  for (const r of report) {
    console.log(`\n📍 ${r.slug} (${r.status || "?"})`);
    for (const e of r.errors)   console.log(`   ❌ [ERROR]   ${e}`);
    for (const w of r.warnings) console.log(`   ⚠️  [WARNING] ${w}`);
  }
}

console.log(`\n${"─".repeat(60)}`);
const failCount = STRICT ? totalErrors + totalWarnings : totalErrors;
if (failCount === 0) {
  console.log(`✅ エラーなし (warning: ${totalWarnings}件)`);
} else {
  console.log(`❌ ERROR: ${totalErrors}件 / WARNING: ${totalWarnings}件`);
}
console.log();

if (STRICT && (totalErrors + totalWarnings) > 0) process.exit(1);
if (!STRICT && totalErrors > 0) process.exit(1);
