/**
 * data/municipalities/{slug}/*.json の cityCode を registry と一括同期
 *
 * 背景: 5/12 fix-citycodes.js apply は kokuho-*.json のみ対象にしていたため、
 * kaigo-*.json / jumin-*.json / kokuho-{古い年度} などに旧 cityCode が残った。
 *
 * test-integrity.js D-1 で検出された不整合（例: komaki/ の 23218 vs 23219 混在）を解消する。
 *
 * ロジック:
 *   各 data dir について:
 *     - registry の citySlug = dir 名 のエントリの cityCode が正準
 *     - dir 内の全 JSON ファイルの cityCode を正準値に書き換え
 *     - registry に該当 slug がなければスキップ（孤立 dir）
 *
 * 利用:
 *   node scripts/fix-data-cityCode-sync.js              # dry-run
 *   node scripts/fix-data-cityCode-sync.js --apply      # 実適用
 *
 * 終了コード:
 *   0 — 完了
 *   1 — 致命エラー
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REGISTRY = path.join(ROOT, "registry", "index.json");
const DATA_DIR = path.join(ROOT, "data", "municipalities");

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");

const reg = JSON.parse(readFileSync(REGISTRY, "utf-8"));
const regBySlug = new Map(reg.municipalities.map(m => [m.citySlug, m]));

const dirs = readdirSync(DATA_DIR).filter(d => {
  try { return statSync(path.join(DATA_DIR, d)).isDirectory(); } catch { return false; }
});

const updates = [];
const skipped = [];

for (const slug of dirs) {
  const regEntry = regBySlug.get(slug);
  if (!regEntry) {
    skipped.push({ slug, reason: "registry にない slug（孤立 dir）" });
    continue;
  }
  const canonicalCode = String(regEntry.cityCode).padStart(5, "0");
  const dirPath = path.join(DATA_DIR, slug);
  const files = readdirSync(dirPath).filter(f => f.endsWith(".json"));

  for (const fn of files) {
    const fp = path.join(dirPath, fn);
    let d;
    try {
      d = JSON.parse(readFileSync(fp, "utf-8"));
    } catch {
      continue;
    }
    if (!d.cityCode) continue;
    const fileCode = String(d.cityCode).padStart(5, "0");
    if (fileCode !== canonicalCode) {
      updates.push({
        slug,
        file: fn,
        oldCode: fileCode,
        newCode: canonicalCode,
        cityName: regEntry.cityName,
        path: fp,
      });
    }
  }
}

// レポート
console.log(`# data 内 cityCode 同期レポート`);
console.log(`モード: ${APPLY ? "🔧 APPLY" : "🔍 DRY-RUN"}`);
console.log(`生成: ${new Date().toISOString()}`);
console.log("");
console.log(`## サマリ`);
console.log(`- 更新候補: ${updates.length} 件（${new Set(updates.map(u => u.slug)).size} dir）`);
console.log(`- スキップ（孤立 dir）: ${skipped.length} 件`);
console.log("");

if (updates.length > 0) {
  console.log(`## 更新候補一覧`);
  console.log("");
  console.log(`| slug | file | 旧 | 新 | 自治体名 |`);
  console.log(`|---|---|---:|---:|---|`);
  for (const u of updates) {
    console.log(`| \`${u.slug}\` | ${u.file} | ${u.oldCode} | **${u.newCode}** | ${u.cityName} |`);
  }
  console.log("");
}

if (skipped.length > 0 && skipped.length <= 20) {
  console.log(`## スキップ（孤立 dir）`);
  for (const s of skipped) {
    console.log(`- ${s.slug}: ${s.reason}`);
  }
  console.log("");
}

if (APPLY) {
  if (updates.length === 0) {
    console.log("✅ 更新候補なし。終了。");
    process.exit(0);
  }
  console.log(`🔧 ${updates.length} 件の data file を更新中...`);
  let applied = 0;
  for (const u of updates) {
    const d = JSON.parse(readFileSync(u.path, "utf-8"));
    d.cityCode = u.newCode;
    writeFileSync(u.path, JSON.stringify(d, null, 2) + "\n", "utf-8");
    applied++;
  }
  console.log(`✅ ${applied} 件適用完了`);
}

process.exit(0);
