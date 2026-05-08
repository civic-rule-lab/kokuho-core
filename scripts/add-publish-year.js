/**
 * registry/index.json に publishYear フィールドを追加する（一回限り使用）
 *
 * ルール:
 *   kokuho-2026.json が存在し meta.status === "verified" → publishYear.kokuho = 2026
 *   それ以外 → publishYear.kokuho = 2025
 *
 * 実行:
 *   node scripts/add-publish-year.js --dry-run  # 結果確認のみ
 *   node scripts/add-publish-year.js            # 実際に registry/index.json を更新
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, "..");
const REGISTRY   = path.join(ROOT, "registry", "index.json");
const MUNI_DIR   = path.join(ROOT, "data", "municipalities");
const DRY_RUN    = process.argv.includes("--dry-run");

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));

let r8count = 0, r7count = 0;
const r8cities = [];

const updated = registry.municipalities.map(m => {
  const p = path.join(MUNI_DIR, m.citySlug, "kokuho-2026.json");
  let kokuhoYear = 2025;

  if (existsSync(p)) {
    try {
      const data = JSON.parse(readFileSync(p, "utf-8"));
      if (data.meta?.status === "verified") {
        kokuhoYear = 2026;
        r8count++;
        r8cities.push(`${m.cityName}（${m.citySlug}）`);
      } else {
        r7count++;
      }
    } catch {
      r7count++;
    }
  } else {
    r7count++;
  }

  return { ...m, publishYear: { kokuho: kokuhoYear } };
});

console.log(`\n▶ publishYear 設定結果:`);
console.log(`  R8（令和8年度）verified: ${r8count}自治体`);
console.log(`  R7（令和7年度）needs_update/未取得: ${r7count}自治体`);
console.log(`  合計: ${r8count + r7count}自治体`);
console.log(`\nR8確定済み自治体 (${r8count}件):`);
r8cities.forEach(c => console.log(`  ${c}`));

if (DRY_RUN) {
  console.log("\n（--dry-run: registry/index.json は変更されていません）");
} else {
  copyFileSync(REGISTRY, REGISTRY + ".bak");
  const out = { ...registry, municipalities: updated };
  writeFileSync(REGISTRY, JSON.stringify(out, null, 2) + "\n", "utf-8");
  console.log("\n✅ registry/index.json を更新しました");
  console.log("   バックアップ: registry/index.json.bak");
}
