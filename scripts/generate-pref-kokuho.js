/**
 * 都道府県 国保データ汎用生成スクリプト
 *
 * 都道府県別データファイル（data/pref-specs/{prefSlug}.js）を読み込み、
 * data/municipalities/{slug}/kokuho-2025.json を自治体ごとに生成する。
 *
 * 実行:          node scripts/generate-pref-kokuho.js <prefSlug>
 * 強制上書き:    node scripts/generate-pref-kokuho.js <prefSlug> --force
 * 全都道府県:    node scripts/generate-pref-kokuho.js --all
 *
 * ▼ データファイルの場所
 *   data/pref-specs/{prefSlug}.js
 *   例: data/pref-specs/aichi.js
 *
 * ▼ データファイルの形式
 *   export const PREF_NAME = "愛知県";
 *   export const MUNICIPALITIES = [ { cityCode, citySlug, cityName, caps, rates, ... }, ... ];
 */

import { writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const OUT_BASE  = path.join(ROOT, "data", "municipalities");
const SPEC_DIR  = path.join(ROOT, "data", "pref-specs");
const FORCE     = process.argv.includes("--force");
const ALL       = process.argv.includes("--all");

// ─────────────────────────────────────────────────────────────────
// 共通定数（2025年度 全国共通）
// ─────────────────────────────────────────────────────────────────
export const COMMON_REDUCTION = {
  enabled: true,
  standards: {
    sevenTenths: { base: 430000, perPersonAdd: 0 },
    fiveTenths:  { base: 430000, perPersonAdd: 305000 },
    twoTenths:   { base: 430000, perPersonAdd: 560000 },
  },
  salaryPensionAdd: 100000,
  ratios: { sevenTenths: 0.7, fiveTenths: 0.5, twoTenths: 0.2 },
};

export const COMMON_PRESCHOOL = {
  enabled: true,
  medicalPerCapitaRate: 0.5,
  supportPerCapitaRate: 0.5,
};

// 賦課限度額プリセット
export const CAPS_NAT = { medical: 660000, support: 260000, care: 170000 }; // 全国標準
export const CAPS_650 = { medical: 650000, support: 240000, care: 170000 }; // 独自上限

// ─────────────────────────────────────────────────────────────────
// JSON ビルド
// ─────────────────────────────────────────────────────────────────
export function buildJson(m) {
  const r = m.rates;
  return {
    cityCode:           m.cityCode,
    citySlug:           m.citySlug,
    cityName:           m.cityName,
    fiscalYear:         2025,
    system:             "kokuho",
    ...(m.note       ? { note: m.note }             : {}),
    basicDeduction:     430000,
    rate:               r.rate,
    perCapita:          r.perCapita,
    household:          r.household,
    caps:               m.caps,
    ...(m.assetLevy  ? { assetLevy: m.assetLevy }   : {}),
    preschoolReduction: COMMON_PRESCHOOL,
    reduction:          COMMON_REDUCTION,
  };
}

// ─────────────────────────────────────────────────────────────────
// 都道府県生成
// ─────────────────────────────────────────────────────────────────
async function generatePref(prefSlug) {
  const specPath = path.join(SPEC_DIR, `${prefSlug}.js`);
  if (!existsSync(specPath)) {
    console.error(`❌ スペックファイルが見つかりません: ${specPath}`);
    console.error(`   data/pref-specs/${prefSlug}.js を作成してください。`);
    return false;
  }

  const spec = await import(specPath);
  const { PREF_NAME, MUNICIPALITIES } = spec;

  if (!PREF_NAME || !Array.isArray(MUNICIPALITIES)) {
    console.error(`❌ スペックファイルの形式が不正です: PREF_NAME と MUNICIPALITIES をエクスポートしてください。`);
    return false;
  }

  let created = 0, skipped = 0;

  console.log(`\n${"=".repeat(60)}`);
  console.log(`${PREF_NAME} 国保データ一括生成 (令和7年度 / 2025年度)`);
  console.log(`スペック: data/pref-specs/${prefSlug}.js`);
  console.log(`${"=".repeat(60)}\n`);

  for (const m of MUNICIPALITIES) {
    const dir  = path.join(OUT_BASE, m.citySlug);
    const file = path.join(dir, "kokuho-2025.json");

    if (existsSync(file) && !FORCE) {
      console.log(`⏭  スキップ  ${m.cityName}`);
      skipped++;
      continue;
    }

    mkdirSync(dir, { recursive: true });
    writeFileSync(file, JSON.stringify(buildJson(m), null, 2) + "\n", "utf-8");
    console.log(`✅ 生成完了  ${m.cityName}`);
    created++;
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`生成: ${created} 件 / スキップ: ${skipped} 件`);
  console.log(`合計: ${MUNICIPALITIES.length} 自治体`);

  return true;
}

// ─────────────────────────────────────────────────────────────────
// エントリポイント
// ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2).filter(a => !a.startsWith("--"));

if (ALL) {
  // --all: data/pref-specs/ 内の全ファイルを処理
  if (!existsSync(SPEC_DIR)) {
    console.error(`❌ ${SPEC_DIR} が存在しません。`);
    process.exit(1);
  }
  const specs = readdirSync(SPEC_DIR)
    .filter(f => f.endsWith(".js"))
    .map(f => f.replace(".js", ""));

  if (specs.length === 0) {
    console.log("data/pref-specs/ にスペックファイルがありません。");
    process.exit(0);
  }

  let success = 0, failed = 0;
  for (const slug of specs) {
    const ok = await generatePref(slug);
    if (ok) success++; else failed++;
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`完了: ${success} 都道府県 / 失敗: ${failed} 都道府県`);
  console.log(`${"=".repeat(60)}\n`);

} else if (args.length > 0) {
  const ok = await generatePref(args[0]);
  if (!ok) process.exit(1);

} else {
  console.log(`
使用方法:
  node scripts/generate-pref-kokuho.js <prefSlug>          特定都道府県を生成
  node scripts/generate-pref-kokuho.js <prefSlug> --force  強制上書き
  node scripts/generate-pref-kokuho.js --all               全都道府県を生成

スペックファイル: data/pref-specs/{prefSlug}.js

利用可能なスペック:`);

  if (existsSync(SPEC_DIR)) {
    const specs = readdirSync(SPEC_DIR).filter(f => f.endsWith(".js"));
    specs.forEach(f => console.log(`  - ${f.replace(".js", "")}`));
    if (specs.length === 0) console.log("  (まだありません)");
  } else {
    console.log("  (data/pref-specs/ ディレクトリがありません)");
  }
  console.log();
}
