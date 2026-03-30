/**
 * generate.js — kokuho 自動生成パイプライン
 *
 * 役割:
 *   - registry/index.json から全自治体データを読み込む
 *   - normalize → signature → classify の順でパイプラインを実行
 *   - 分類結果を generated/kokuho/{year}/ 以下に出力する:
 *       classification.json   分類サマリー
 *       templates/            各型のベーステンプレート
 *       overrides/            テンプレートとの差分（差分なしの自治体はスキップ）
 *
 * 実行:
 *   node engines/kokuho/generate.js
 *   node engines/kokuho/generate.js --dry-run  (ファイル書き出しなし)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { normalize } from "./normalize.js";
import { generateSignature, describeSignature } from "./signature.js";
import { classify } from "./classify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, "../..");
const DATA_DIR   = path.join(ROOT, "data", "municipalities");
const REGISTRY   = path.join(ROOT, "registry", "index.json");
const YEAR       = 2025;
const OUT_DIR    = path.join(ROOT, "generated", "kokuho", String(YEAR));

const isDryRun = process.argv.includes("--dry-run");

// ─── 1. データ読み込み ─────────────────────────────────────────

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));
const municipalities = [];
const loadErrors = [];

for (const m of registry.municipalities) {
  if (!m.systems?.includes("kokuho")) continue;

  const jsonPath = path.join(DATA_DIR, m.citySlug, `kokuho-${YEAR}.json`);
  if (!existsSync(jsonPath)) {
    loadErrors.push(`${m.cityName} (${m.citySlug}): ファイルなし`);
    continue;
  }

  let raw;
  try {
    raw = JSON.parse(readFileSync(jsonPath, "utf-8"));
  } catch (e) {
    loadErrors.push(`${m.cityName} (${m.citySlug}): JSON parse error - ${e.message}`);
    continue;
  }

  let data;
  try {
    data = normalize(raw);
  } catch (e) {
    loadErrors.push(`${m.cityName} (${m.citySlug}): normalize error - ${e.message}`);
    continue;
  }

  municipalities.push({
    slug: m.citySlug,
    name: m.cityName,
    pref: m.prefecture,
    data,
  });
}

if (loadErrors.length > 0) {
  console.warn("\n⚠️  読み込みエラー:");
  loadErrors.forEach(e => console.warn("  ", e));
}

// ─── 2. 分類 ──────────────────────────────────────────────────

const classification = classify(municipalities);

// ─── 3. サマリー表示 ──────────────────────────────────────────

console.log("\n" + "=".repeat(72));
console.log(`Civic Rule Engine — kokuho ${YEAR} 分類結果`);
console.log("=".repeat(72));
console.log(`対象自治体: ${municipalities.length}件\n`);

// 署名グループを件数の多い順にソート
const sortedGroups = Object.values(classification).sort((a, b) => b.count - a.count);

for (const group of sortedGroups) {
  const desc  = describeSignature(group.signature);
  const exact = group.exactCount;
  const over  = group.count - exact;

  console.log(`【${group.signature}】 ${group.count}件`);
  console.log(`  計算方式: ${desc.calcType}`);
  if (desc.assetSections) console.log(`  資産割:   ${desc.assetSections}`);
  console.log(`  上限:     ${desc.caps}`);
  console.log(`  軽減:     ${desc.reduction}`);
  console.log(`  特例:     ${desc.special}`);
  console.log(`  テンプレ完全一致: ${exact}件 / オーバーライド要: ${over}件`);

  // オーバーライドが必要な自治体を列挙
  if (over > 0) {
    const overrides = Object.entries(group.members)
      .filter(([, m]) => !m.isExact)
      .map(([slug, m]) => `${m.name}(${slug})`);
    console.log(`  差分あり: ${overrides.join(", ")}`);
  }
  console.log();
}

// 全体集計
const totalExact    = sortedGroups.reduce((s, g) => s + g.exactCount, 0);
const totalOverride = municipalities.length - totalExact;
console.log("─".repeat(72));
console.log(`グループ数: ${sortedGroups.length}種`);
console.log(`完全テンプレ一致: ${totalExact}件 (${(totalExact/municipalities.length*100).toFixed(1)}%)`);
console.log(`オーバーライド要: ${totalOverride}件 (${(totalOverride/municipalities.length*100).toFixed(1)}%)`);
console.log("=".repeat(72));

// ─── 4. ファイル出力 ───────────────────────────────────────────

if (isDryRun) {
  console.log("\n[dry-run] ファイル書き出しをスキップ\n");
  process.exit(0);
}

mkdirSync(path.join(OUT_DIR, "templates"), { recursive: true });
mkdirSync(path.join(OUT_DIR, "overrides"), { recursive: true });

// 4a. 分類サマリー
const summaryPath = path.join(OUT_DIR, "classification.json");
const summary = {
  generatedAt: new Date().toISOString(),
  fiscalYear: YEAR,
  totalMunicipalities: municipalities.length,
  groups: Object.fromEntries(
    sortedGroups.map(g => [
      g.signature,
      {
        count: g.count,
        exactCount: g.exactCount,
        description: describeSignature(g.signature),
        municipalities: Object.entries(g.members).map(([slug, m]) => ({
          slug, name: m.name, pref: m.pref, hasOverride: !m.isExact,
        })),
      },
    ])
  ),
};
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
console.log(`\n✅ classification.json → ${path.relative(ROOT, summaryPath)}`);

// 4b. テンプレート
for (const group of sortedGroups) {
  const safeSig  = group.signature.replace(/[|\/\[\]]/g, "_");
  const tmplPath = path.join(OUT_DIR, "templates", `${safeSig}.json`);
  writeFileSync(tmplPath, JSON.stringify(group.template, null, 2), "utf-8");
  console.log(`✅ template: ${safeSig}.json`);
}

// 4c. オーバーライド（差分がある自治体のみ）
let overrideCount = 0;
for (const group of sortedGroups) {
  for (const [slug, m] of Object.entries(group.members)) {
    if (m.isExact) continue;
    const overridePath = path.join(OUT_DIR, "overrides", `${slug}.json`);
    const override = {
      citySlug:  slug,
      cityName:  m.name,
      signature: group.signature,
      override:  m.override,
    };
    writeFileSync(overridePath, JSON.stringify(override, null, 2), "utf-8");
    overrideCount++;
  }
}
console.log(`✅ overrides: ${overrideCount}件`);
console.log(`\n出力先: ${path.relative(ROOT, OUT_DIR)}/\n`);
