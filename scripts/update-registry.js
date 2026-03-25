/**
 * registry/index.json 自動更新スクリプト
 *
 * data/municipalities/ 以下の kokuho-2025.json を走査し、
 * registry/index.json に未登録の自治体を自動追記する。
 * 既存エントリは上書きしない。
 *
 * 実行: node scripts/update-registry.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, "..");
const DATA_DIR   = path.join(ROOT, "data", "municipalities");
const REGISTRY   = path.join(ROOT, "registry", "index.json");

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));
const existing = new Set(registry.municipalities.map(m => m.citySlug));

let added = 0;

const slugs = readdirSync(DATA_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

for (const slug of slugs) {
  const jsonPath = path.join(DATA_DIR, slug, "kokuho-2025.json");
  if (!existsSync(jsonPath)) continue;

  const data = JSON.parse(readFileSync(jsonPath, "utf-8"));

  // TODOデータはスキップ
  if (data._status && data._status.includes("TODO")) {
    console.log(`⏭  スキップ（TODO）: ${slug}`);
    continue;
  }

  if (existing.has(slug)) {
    console.log(`⏭  スキップ（既存）: ${data.cityName} (${slug})`);
    continue;
  }

  registry.municipalities.push({
    cityCode:    data.cityCode,
    citySlug:    data.citySlug,
    cityName:    data.cityName,
    prefecture:  "神奈川県",
    systems:     ["kokuho"],
  });
  existing.add(slug);
  console.log(`✅ 追加: ${data.cityName} (${slug})`);
  added++;
}

// 都市コード順にソート
registry.municipalities.sort((a, b) =>
  String(a.cityCode).localeCompare(String(b.cityCode))
);

writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n", "utf-8");

console.log(`\n登録済み: ${registry.municipalities.length} 自治体 / 今回追加: ${added} 件`);
