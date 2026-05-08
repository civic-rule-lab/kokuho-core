/**
 * スナップショット生成スクリプト
 *
 * 全1727自治体 × 8世帯パターンの計算結果を保存する。
 * リファクタリングや年度移行後に snapshot-verify.js と比較することで
 * 意図しない計算結果の変化を検知できる。
 *
 * 実行:
 *   node scripts/snapshot-generate.js
 *   node scripts/snapshot-generate.js --slug chigasaki  （1自治体のみ更新）
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { calculateKokuho } = require("../js/core/kokuho.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT       = path.join(__dirname, "..");
const REGISTRY   = path.join(ROOT, "registry", "index.json");
const MUNI_DIR   = path.join(ROOT, "data", "municipalities");
const SNAP_FILE  = path.join(ROOT, "snapshots", "kokuho.json");

// ── 8世帯パターン ──────────────────────────────────────────────
export const PATTERNS = [
  { id: "s1-low",       income:  600000, family: 1, care: 0, preschool: 0, salaryPensionCount: 1 },
  { id: "s1-mid",       income: 2000000, family: 1, care: 0, preschool: 0, salaryPensionCount: 1 },
  { id: "s2-mid",       income: 3000000, family: 2, care: 0, preschool: 0, salaryPensionCount: 1 },
  { id: "s3-mid",       income: 4000000, family: 3, care: 0, preschool: 0, salaryPensionCount: 1 },
  { id: "s4-high",      income: 6000000, family: 4, care: 0, preschool: 0, salaryPensionCount: 1 },
  { id: "s1-reduce",    income:  400000, family: 1, care: 0, preschool: 0, salaryPensionCount: 0 },
  { id: "s3-care",      income: 3000000, family: 3, care: 1, preschool: 0, salaryPensionCount: 1 },
  { id: "s4-preschool", income: 3000000, family: 4, care: 0, preschool: 1, salaryPensionCount: 1 },
];

// ── データロード ───────────────────────────────────────────────
function loadData(slug) {
  for (const yr of [2026, 2025]) {
    const p = path.join(MUNI_DIR, slug, `kokuho-${yr}.json`);
    if (existsSync(p)) {
      try { return JSON.parse(readFileSync(p, "utf-8")); } catch { /* skip */ }
    }
  }
  return null;
}

// ── 計算実行 ────────────────────────────────────────────────────
function runPatterns(data) {
  return PATTERNS.map(pat => {
    try {
      const r = calculateKokuho(data, {
        income:             pat.income,
        family:             pat.family,
        preschool:          pat.preschool,
        under18:            0,
        care:               pat.care,
        salaryPensionCount: pat.salaryPensionCount,
        fixedAssetTax:      0,
      });
      return r.total;
    } catch {
      return null;
    }
  });
}

// ── メイン（直接実行時のみ動作） ────────────────────────────────
const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (!isMain) { /* importされた場合はここで終了 */ }
else {

const registry  = JSON.parse(readFileSync(REGISTRY, "utf-8"));
const targetArg = process.argv.indexOf("--slug");
const targetSlug = targetArg !== -1 ? process.argv[targetArg + 1] : null;

const targets = targetSlug
  ? registry.municipalities.filter(m => m.citySlug === targetSlug)
  : registry.municipalities;

if (targets.length === 0) {
  console.error(`❌ スラグが見つかりません: ${targetSlug}`);
  process.exit(1);
}

// 既存スナップショットをロード（部分更新時に使用）
let existing = {};
if (existsSync(SNAP_FILE) && targetSlug) {
  try { existing = JSON.parse(readFileSync(SNAP_FILE, "utf-8")).data ?? {}; } catch { /* skip */ }
}

let ok = 0, skip = 0;
const data = { ...existing };

for (const m of targets) {
  const cityData = loadData(m.citySlug);
  if (!cityData) { skip++; continue; }
  data[m.citySlug] = runPatterns(cityData);
  ok++;
}

const snapshot = {
  generated:    new Date().toISOString().slice(0, 10),
  municipalities: Object.keys(data).length,
  patterns:     PATTERNS.map(p => p.id),
  data,
};

writeFileSync(SNAP_FILE, JSON.stringify(snapshot, null, 2), "utf-8");

console.log(`✅ スナップショット生成完了`);
console.log(`   対象: ${ok}自治体 × ${PATTERNS.length}パターン = ${ok * PATTERNS.length}ケース`);
if (skip > 0) console.log(`   スキップ: ${skip}自治体（データなし）`);
console.log(`   保存先: snapshots/kokuho.json`);

} // end isMain
