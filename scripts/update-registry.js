/**
 * registry/index.json 自動更新スクリプト
 *
 * data/municipalities/ 以下の kokuho-2025.json を走査し、
 * registry/index.json に未登録の自治体を自動追記する。
 *
 * slug 衝突チェック（POLICIES §9）:
 *   - 同一 slug + 異なる cityCode → ERROR で abort（exit 1）
 *   - 同一 slug + 同一 cityCode → 正当な更新（スキップ）
 *   - 未登録 → 追加
 *
 * 実行: node scripts/update-registry.js
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { checkSlug } from "./check-slug.js";

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, "..");
const DATA_DIR   = path.join(ROOT, "data", "municipalities");
const REGISTRY   = path.join(ROOT, "registry", "index.json");

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));
const existingByCityCode = new Map(
  registry.municipalities.map(m => [String(m.cityCode), m])
);

let added = 0;
const collisions = [];

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

  // ─── slug 衝突チェック（POLICIES §9） ─────────────────────────
  const check = checkSlug(slug, data.cityCode);

  if (!check.ok) {
    // 異なる cityCode で同一 slug → 衝突として収集（最後に一括 abort）
    collisions.push({ slug, attemptedCityCode: data.cityCode, dataPath: jsonPath, conflict: check.conflict });
    continue;
  }

  // 同一 cityCode で既登録 → 正当な更新、スキップ
  if (existingByCityCode.has(String(data.cityCode))) {
    console.log(`⏭  スキップ（既存・同一 cityCode）: ${data.cityName} (${slug})`);
    continue;
  }

  // 新規追加
  registry.municipalities.push({
    cityCode:    data.cityCode,
    citySlug:    data.citySlug,
    cityName:    data.cityName,
    prefecture:  "神奈川県",  // FIXME: data 側に prefecture 情報がないため固定値。要 schema 拡張
    systems:     ["kokuho"],
  });
  existingByCityCode.set(String(data.cityCode), registry.municipalities[registry.municipalities.length - 1]);
  console.log(`✅ 追加: ${data.cityName} (${slug})`);
  added++;
}

// ─── 衝突があれば abort ────────────────────────────────────────
if (collisions.length > 0) {
  console.error("");
  console.error(`❌ slug 衝突を ${collisions.length} 件検出（POLICIES §9）`);
  console.error("");
  for (const c of collisions) {
    console.error(`  📄 ${c.dataPath}`);
    console.error(`     slug="${c.slug}" cityCode=${c.attemptedCityCode} を追加しようとしましたが、`);
    console.error(`     同一 slug が ${c.conflict.prefecture}${c.conflict.cityName} (cityCode=${c.conflict.cityCode}) に既割当です。`);
    console.error(`     → 対処: slug をサフィックス方式（${c.slug}-{prefSlug}）に変更してください`);
    console.error("");
  }
  console.error("registry の更新を abort しました。data/municipalities/ のディレクトリ名と JSON 内の citySlug を訂正してから再実行してください。");
  process.exit(1);
}

// 都市コード順にソート
registry.municipalities.sort((a, b) =>
  String(a.cityCode).localeCompare(String(b.cityCode))
);

writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n", "utf-8");

console.log(`\n登録済み: ${registry.municipalities.length} 自治体 / 今回追加: ${added} 件`);
