/**
 * kokuho-2025.json → kokuho-2026.json 移行スクリプト
 *
 * 令和8年度（2026年度）の主な変更点:
 *   - 医療分賦課限度額: 660,000円 → 670,000円
 *   - 子ども・子育て支援金分: 新設（上限30,000円）
 *   - 5割・2割軽減基準: 変更なし
 *
 * 実行: node scripts/migrate-2025-to-2026.js
 * オプション: node scripts/migrate-2025-to-2026.js --overwrite  （既存の2026を上書き）
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "municipalities");
const REGISTRY_PATH = path.join(ROOT, "registry", "index.json");

const OVERWRITE = process.argv.includes("--overwrite");

const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));

let created = 0;
let skipped = 0;
let errors = 0;

for (const m of registry.municipalities) {
  const slug = m.citySlug;
  const src = path.join(DATA_DIR, slug, "kokuho-2025.json");
  const dst = path.join(DATA_DIR, slug, "kokuho-2026.json");

  if (!existsSync(src)) {
    console.warn(`⚠️  kokuho-2025.json なし: ${slug}`);
    errors++;
    continue;
  }

  if (existsSync(dst) && !OVERWRITE) {
    skipped++;
    continue;
  }

  let data;
  try {
    data = JSON.parse(readFileSync(src, "utf-8"));
  } catch (e) {
    console.error(`❌ parse error: ${slug} — ${e.message}`);
    errors++;
    continue;
  }

  // ── 令和8年度へ更新 ───────────────────────────────────────────

  // fiscalYear
  data.fiscalYear = 2026;

  // 医療分上限: 660,000 → 670,000
  if (data.caps) {
    data.caps.medical = 670000;
    // 子ども・子育て支援金分 上限追加
    data.caps.childcare = 30000;
  }

  // 子ども・子育て支援金分 新設（料率は自治体ごとに要確認）
  if (!data.childcare) {
    data.childcare = {
      rate: 0,
      perCapita: 0,
      household: 0
    };
  }

  // meta 更新
  if (data.meta) {
    data.meta.schemaVersion = "2.0";
    data.meta.dataVersion = "2.0.0";
    data.meta.status = "needs_update";
    data.meta.lifecycle = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      validFrom: "2026-04-01",
      validUntil: "2027-03-31",
      expiresAt: "2027-04-30",
    };
    data.meta.source = {
      type: "estimated",
      title: "",
      url: "",
      publishedAt: "",
    };
    data.meta.audit = {
      verifiedBy: "",
      verifiedAt: "",
      method: "",
    };
    data.meta.quality = {
      confidenceScore: 0.5,
      completeness: "partial",
    };
    data.meta.notes =
      "R7→R8移行。医療分上限+1万円。子ども・子育て支援金分新設（料率要確認）。";
  }

  // _source フィールドは引き継がない
  delete data._source;

  try {
    writeFileSync(dst, JSON.stringify(data, null, 2), "utf-8");
    created++;
  } catch (e) {
    console.error(`❌ write error: ${slug} — ${e.message}`);
    errors++;
  }
}

console.log("\n" + "=".repeat(60));
console.log("kokuho-2025 → kokuho-2026 移行完了");
console.log("=".repeat(60));
console.log(`✅ 生成: ${created} 件`);
console.log(`⏭  スキップ（既存）: ${skipped} 件`);
if (errors > 0) console.log(`❌ エラー: ${errors} 件`);
console.log("\n次のステップ:");
console.log("  1. 主要自治体の子ども・子育て支援金分料率を公式で確認・更新");
console.log("  2. node scripts/generate-official-pages.js（2026対応後）");
console.log("  3. validate-kokuho-data.js を2026対応に更新");
console.log("=".repeat(60) + "\n");
