/**
 * 住民税データ バリデーション
 *
 * 実行:
 *   node scripts/validate-jumin-data.js
 *   node scripts/validate-jumin-data.js --year=2026
 *   node scripts/validate-jumin-data.js --slug=nagoya
 *   node scripts/validate-jumin-data.js --strict
 *
 * チェック内容:
 *   [構造] 必須フィールド
 *   [数値] 税率・均等割の妥当範囲
 *   [整合] 標準値と同じ値を記載していないか（ファイル不要な自治体の検出）
 *   [整合] status=verified のとき source.url があるか
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const _require = createRequire(import.meta.url);

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const ROOT        = path.join(__dirname, "..");
const DATA_DIR    = path.join(ROOT, "data", "municipalities");

const YEAR_ARG    = process.argv.find(a => a.startsWith("--year="));
const YEAR        = YEAR_ARG ? parseInt(YEAR_ARG.split("=")[1]) : 2026;
const SLUG_FILTER = (process.argv.find(a => a.startsWith("--slug=")) || "").replace("--slug=","") || null;
const STRICT      = process.argv.includes("--strict");

// jumin.js と同一のソースから取得（二重定義を防ぐ）
const DEFAULTS = _require("../js/core/jumin.js").JUMIN_DEFAULTS;

let totalFiles = 0, totalErrors = 0, totalWarnings = 0;
const report = [];

function validateJuminData(slug, data) {
  const errors = [], warnings = [];
  const err  = m => errors.push(m);
  const warn = m => warnings.push(m);

  // ─ 必須フィールド ─
  for (const f of ["cityCode","citySlug","fiscalYear","system","status"]) {
    if (data[f] === undefined) err(`必須フィールドなし: ${f}`);
  }
  if (data.system && data.system !== "jumin") err(`system は "jumin" であること`);

  const validStatuses = ["needs_update","verified","inferred"];
  if (data.status && !validStatuses.includes(data.status)) err(`status 不正: "${data.status}"`);

  // needs_update かつ prefPerCapita が非標準 → 二重課税リスクの警告
  if (data.status === "needs_update" &&
      data.prefPerCapita !== undefined && data.prefPerCapita !== DEFAULTS.prefPerCapita) {
    warn(`⚠️  二重課税リスク: prefPerCapita=${data.prefPerCapita} は未確認。` +
         `2024年度以降に都道府県独自税が廃止された場合、計算が高めに出る。公式確認を最優先で。`);
  }

  // ─ 税率の妥当範囲 ─
  if (data.prefRate !== undefined) {
    if (data.prefRate < 0.01 || data.prefRate > 0.1) err(`prefRate 範囲外: ${data.prefRate}`);
  }
  if (data.cityRate !== undefined) {
    if (data.cityRate < 0.01 || data.cityRate > 0.12) err(`cityRate 範囲外: ${data.cityRate}`);
  }
  if (data.prefPerCapita !== undefined) {
    if (data.prefPerCapita < 0 || data.prefPerCapita > 5_000) err(`prefPerCapita 範囲外: ${data.prefPerCapita}`);
  }
  if (data.cityPerCapita !== undefined) {
    if (data.cityPerCapita < 0 || data.cityPerCapita > 10_000) err(`cityPerCapita 範囲外: ${data.cityPerCapita}`);
  }

  // ─ 差分チェック: 非標準フィールドが1つもない場合はファイル不要 ─
  // ※ 標準値と同じフィールドが含まれていても「確認済み証跡」として許容する。
  //   問題は「差分が1つもない」場合だけ。
  const DIFF_KEYS = ["prefRate","cityRate","prefPerCapita","cityPerCapita","forestTax","basicDeductionJumin"];
  const diffFields = DIFF_KEYS.filter(k => data[k] !== undefined && data[k] !== DEFAULTS[k]);
  if (diffFields.length === 0 && data.status !== "needs_update") {
    warn("非標準フィールドが1つもない → jumin-{year}.json は不要かもしれません");
  }
  // 都道府県均等割の超過課税チェック（見落としやすい軸）
  // inferred（スペック自動生成）は作者がスペックで意図的に省略した差分なのでスキップ。
  // verified（人間が確認済み）のみチェックする。
  if (data.status === "verified") {
    if (data.prefRate !== undefined && data.prefRate !== DEFAULTS.prefRate &&
        data.prefPerCapita === undefined) {
      warn("prefRate が超過課税だが prefPerCapita の確認が必要（水源税系は均等割も変わることが多い）");
    }
    if (data.prefPerCapita !== undefined && data.prefPerCapita !== DEFAULTS.prefPerCapita &&
        data.prefRate === undefined) {
      warn("prefPerCapita が超過だが prefRate の確認が必要（所得割も超過している都道府県あり）");
    }
  }

  // ─ verified の場合は source.url 必須 ─
  if (data.status === "verified" && !data.source?.url) {
    warn("status=verified だが source.url がない");
  }

  return { errors, warnings };
}

// ─── 全件ループ ─────────────────────────────────────────────────

const slugs = SLUG_FILTER
  ? [SLUG_FILTER]
  : readdirSync(DATA_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name).sort();

let fileCount = 0;
const byStatus = { verified: 0, inferred: 0, needs_update: 0 };

for (const slug of slugs) {
  const dataPath = path.join(DATA_DIR, slug, `jumin-${YEAR}.json`);
  if (!existsSync(dataPath)) continue;

  fileCount++;
  let data;
  try {
    data = JSON.parse(readFileSync(dataPath, "utf-8"));
  } catch (e) {
    report.push({ slug, errors: [`JSON parse エラー: ${e.message}`], warnings: [] });
    totalErrors++;
    continue;
  }

  totalFiles++;
  byStatus[data.status] = (byStatus[data.status] || 0) + 1;

  const { errors, warnings } = validateJuminData(slug, data);
  if (errors.length > 0 || warnings.length > 0) {
    report.push({ slug, errors, warnings, status: data.status });
  }
  totalErrors   += errors.length;
  totalWarnings += warnings.length;
}

// ─── 出力 ──────────────────────────────────────────────────────

console.log(`\n${"=".repeat(60)}`);
console.log(`住民税データ バリデーション (${YEAR}年度)`);
console.log(`${"=".repeat(60)}`);
console.log(`\n対象: ${totalFiles}ファイル（1727自治体中 非標準自治体のみ）`);
console.log(`  verified:     ${byStatus.verified}`);
console.log(`  inferred:     ${byStatus.inferred}`);
console.log(`  needs_update: ${byStatus.needs_update}${byStatus.needs_update > 0 ? ' ⚠️  公式確認が必要' : ''}`);
console.log(`  ファイルなし自治体: ${slugs.length - fileCount} → 標準値を自動適用`);

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
  console.log(`❌ ERROR: ${totalErrors} / WARNING: ${totalWarnings}`);
}
console.log();

if (STRICT && (totalErrors + totalWarnings) > 0) process.exit(1);
if (!STRICT && totalErrors > 0) process.exit(1);
