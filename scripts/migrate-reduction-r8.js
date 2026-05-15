#!/usr/bin/env node
/**
 * scripts/migrate-reduction-r8.js
 *
 * 全自治体の kokuho-2026.json で reduction.standards.{fiveTenths,twoTenths}.perPersonAdd
 * を R7 国基準値 (305000 / 560000) から R8 国基準値 (310000 / 570000) に一括更新。
 * issue #6 対応。
 *
 * 設計:
 * - 既に R8 値の自治体は skip（idempotent、再実行安全）
 * - R7/R8 以外の非標準値の自治体は警告表示のみで skip（survey 時点で 0 件確認済）
 * - text-based replacement で JSON フォーマットを完全保持（whitespace 差分ゼロ）
 *
 * 使い方:
 *   node scripts/migrate-reduction-r8.js          # dry-run（変更内容のみ表示）
 *   node scripts/migrate-reduction-r8.js --apply  # 適用
 *
 * 軽減判定基準は国の統一基準で自治体ごとには変わらないため、本 migration は
 * 都道府県・市町村に関係なく一律適用する。
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "municipalities");

const APPLY = process.argv.includes("--apply");

const FIVE_R7 = '"perPersonAdd": 305000';
const FIVE_R8 = '"perPersonAdd": 310000';
const TWO_R7  = '"perPersonAdd": 560000';
const TWO_R8  = '"perPersonAdd": 570000';

let scanned = 0;
let modified = 0;
let alreadyR8 = 0;
let neither = 0;
const modifiedSlugs = [];
const partialMigration = [];

const dirs = readdirSync(DATA_DIR).filter(d => {
  try { return statSync(path.join(DATA_DIR, d)).isDirectory(); } catch { return false; }
});

for (const slug of dirs) {
  const file = path.join(DATA_DIR, slug, "kokuho-2026.json");
  let txt;
  try { txt = readFileSync(file, "utf-8"); }
  catch { continue; }
  scanned++;

  const hadFiveR7 = txt.includes(FIVE_R7);
  const hadTwoR7  = txt.includes(TWO_R7);
  const hadFiveR8 = txt.includes(FIVE_R8);
  const hadTwoR8  = txt.includes(TWO_R8);

  if (!hadFiveR7 && !hadTwoR7) {
    if (hadFiveR8 && hadTwoR8) alreadyR8++;
    else if (hadFiveR8 || hadTwoR8) {
      // 片方だけ R8 という half-migrated state（理論上 survey で 0 件確認済）
      partialMigration.push(`${slug}: fiveR8=${hadFiveR8} twoR8=${hadTwoR8}`);
      alreadyR8++;
    } else neither++;
    continue;
  }

  let newTxt = txt;
  if (hadFiveR7) newTxt = newTxt.split(FIVE_R7).join(FIVE_R8);
  if (hadTwoR7)  newTxt = newTxt.split(TWO_R7).join(TWO_R8);

  if (APPLY) {
    writeFileSync(file, newTxt, "utf-8");
  }
  modified++;
  modifiedSlugs.push(slug);
}

console.log(`📊 reduction.standards R7→R8 migration ${APPLY ? "🔧 APPLY" : "🔍 DRY-RUN"}`);
console.log(`  scanned:    ${scanned}`);
console.log(`  modified:   ${modified}  ← R7 → R8 に更新${APPLY ? "" : "（dry-run、未適用）"}`);
console.log(`  already R8: ${alreadyR8}`);
console.log(`  neither:    ${neither}  ← reduction.standards 非定義 or 完全非標準`);

if (partialMigration.length > 0) {
  console.warn(`\n⚠️  半端 migration state（要調査）:`);
  partialMigration.forEach(s => console.warn(`  ${s}`));
}

if (!APPLY) {
  console.log(`\n  --apply 付きで実行すると ${modified} ファイルを更新します。`);
}
