/**
 * 自治体ページ自動生成スクリプト
 *
 * test/templates/ のテンプレートを使い、
 * registry/index.json に登録された自治体のHTMLページを
 * test/ 以下に一括生成する。
 *
 * 実行: node scripts/generate-city-pages.js
 * 特定自治体のみ: node scripts/generate-city-pages.js hiratsuka
 *
 * ▼ 生成されるファイル（自治体ごと）
 *   test/{slug}-kokuho.html         かんたん計算ページ
 *   test/{slug}-kokuho-income.html  所得ベース計算ページ
 *
 * ▼ テンプレート（変更不要）
 *   test/templates/kokuho-simple.html
 *   test/templates/kokuho-income.html
 *
 * ▼ 自治体追加の手順
 *   1. data/municipalities/{slug}/kokuho-2025.json を作成
 *      （scripts/generate-kanagawa-kokuho.js で一括生成可能）
 *   2. registry/index.json に { citySlug, cityName, ... } を追記
 *   3. このスクリプトを実行
 *   4. git add / commit / push
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const TEST_DIR  = path.join(ROOT, "test");
const TMPL_DIR  = path.join(TEST_DIR, "templates");
const REGISTRY  = path.join(ROOT, "registry", "index.json");

// ─────────────────────────────────────────────────────────────────
// テンプレート読み込み
// ─────────────────────────────────────────────────────────────────
const tmplSimple = readFileSync(path.join(TMPL_DIR, "kokuho-simple.html"), "utf-8");
const tmplIncome = readFileSync(path.join(TMPL_DIR, "kokuho-income.html"), "utf-8");

// ─────────────────────────────────────────────────────────────────
// プレースホルダー置換
// ─────────────────────────────────────────────────────────────────
function render(template, { citySlug, cityName }) {
  return template
    .replaceAll("__CITY_SLUG__", citySlug)
    .replaceAll("__CITY_NAME__", cityName);
}

// ─────────────────────────────────────────────────────────────────
// 対象自治体の取得（引数指定 or 全件）
// ─────────────────────────────────────────────────────────────────
const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));
const targetSlug = process.argv[2] || null;

const targets = targetSlug
  ? registry.municipalities.filter(m => m.citySlug === targetSlug)
  : registry.municipalities;

if (targets.length === 0) {
  console.error(`❌ 自治体が見つかりません: ${targetSlug}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────
// ページ生成
// ─────────────────────────────────────────────────────────────────
let created = 0;
let skipped = 0;

console.log(`\n${"=".repeat(60)}`);
console.log(`自治体ページ自動生成 (${targets.length} 自治体)`);
console.log(`${"=".repeat(60)}\n`);

for (const m of targets) {
  const { citySlug, cityName } = m;
  const vars = { citySlug, cityName };

  const pages = [
    {
      file: path.join(TEST_DIR, `${citySlug}-kokuho.html`),
      template: tmplSimple,
      label: "かんたん計算",
    },
    {
      file: path.join(TEST_DIR, `${citySlug}-kokuho-income.html`),
      template: tmplIncome,
      label: "所得ベース計算",
    },
  ];

  console.log(`📍 ${cityName} (${citySlug})`);

  for (const page of pages) {
    if (existsSync(page.file) && !targetSlug) {
      console.log(`   ⏭  スキップ（既存）: ${path.basename(page.file)}`);
      skipped++;
      continue;
    }
    writeFileSync(page.file, render(page.template, vars), "utf-8");
    console.log(`   ✅ 生成: ${path.basename(page.file)}  [${page.label}]`);
    created++;
  }
}

console.log(`\n${"─".repeat(60)}`);
console.log(`生成: ${created} ページ / スキップ: ${skipped} ページ`);
if (skipped > 0) {
  console.log(`\n※ 既存ファイルを強制上書きするには自治体スラグを指定してください。`);
  console.log(`  例: node scripts/generate-city-pages.js hiratsuka`);
}
console.log();
