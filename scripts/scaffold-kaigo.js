/**
 * 介護保険 テンプレートJSON 一括生成スクリプト
 *
 * registry/index.json の全自治体に対して、
 * data/municipalities/{slug}/kaigo-2026.json のスケルトンを生成する。
 *
 * 実行:
 *   node scripts/scaffold-kaigo.js                     # 未作成の自治体のみ
 *   node scripts/scaffold-kaigo.js --force             # 既存も上書き
 *   node scripts/scaffold-kaigo.js --pref=kanagawa     # 特定都道府県のみ
 *   node scripts/scaffold-kaigo.js --slug=yokohama     # 特定自治体のみ
 *
 * 生成後の作業:
 *   1. 各自治体の公式サイトで baseAmount と段階数を確認
 *   2. baseAmount を記入し status を "needs_update" → "verified" に変更
 *   3. 独自細分化がある場合は brackets を上書き
 *   4. node scripts/validate-kaigo-data.js で検証
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT         = path.join(__dirname, "..");
const DATA_DIR     = path.join(ROOT, "data", "municipalities");
const REGISTRY_PATH = path.join(ROOT, "registry", "index.json");

const FORCE      = process.argv.includes("--force");
const PREF_FILTER = (process.argv.find(a => a.startsWith("--pref=")) || "").replace("--pref=", "") || null;
const SLUG_FILTER = (process.argv.find(a => a.startsWith("--slug=")) || "").replace("--slug=", "") || null;

const YEAR = 2026;

const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));

// ─── テンプレートビルド ────────────────────────────────────────

function buildTemplate(m) {
  return {
    cityCode:    m.cityCode,
    citySlug:    m.citySlug,
    cityName:    m.cityName,
    prefSlug:    m.prefectureSlug,
    prefecture:  m.prefecture,
    fiscalYear:  YEAR,
    system:      "kaigo",
    schemaVersion: "1.0",
    planPeriod:  "第9期（2024-2026）",
    status:      "needs_update",
    // ↓ 公式サイトで確認して記入する（円/年）
    baseAmount:  null,
    // null のままにしておくと generate-kaigo-from-spec.js が標準9段階を補完する
    // 独自細分化がある場合のみここに記入する
    brackets:    null,
    fallbackLevel: "5",
    source: {
      url:         null,    // 公式ページURL
      pageTitle:   null,    // ページタイトル（確認用）
      retrievedAt: null,    // 取得日 YYYY-MM-DD
    },
  };
}

// ─── 生成ループ ────────────────────────────────────────────────

let created = 0;
let skipped = 0;
let filtered = 0;

for (const m of registry.municipalities) {
  // フィルタ適用
  if (PREF_FILTER && m.prefectureSlug !== PREF_FILTER) { filtered++; continue; }
  if (SLUG_FILTER && m.citySlug       !== SLUG_FILTER)  { filtered++; continue; }

  const dir     = path.join(DATA_DIR, m.citySlug);
  const outPath = path.join(dir, `kaigo-${YEAR}.json`);

  if (!FORCE && existsSync(outPath)) { skipped++; continue; }

  mkdirSync(dir, { recursive: true });
  writeFileSync(outPath, JSON.stringify(buildTemplate(m), null, 2) + "\n", "utf-8");
  created++;
}

console.log(`\n✅ kaigo-${YEAR}.json スケルトン生成`);
console.log(`   生成: ${created} / スキップ: ${skipped} / フィルタ除外: ${filtered}`);
if (created > 0) {
  console.log(`\n次のステップ:`);
  console.log(`  1. 各自治体の公式サイトで baseAmount を確認`);
  console.log(`  2. data/kaigo-specs/{pref}.js に一覧を記入`);
  console.log(`  3. node scripts/generate-kaigo-from-spec.js <pref> で一括反映`);
  console.log(`  4. node scripts/validate-kaigo-data.js --year=${YEAR} で検証`);
}
