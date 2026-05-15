/**
 * スナップショット照合スクリプト
 *
 * 現在の計算結果を保存済みスナップショットと比較し、
 * 意図しない変化を検知する。
 *
 * 実行:
 *   node scripts/snapshot-verify.js              # 全自治体を照合
 *   node scripts/snapshot-verify.js --slug chigasaki  # 1自治体のみ
 *   node scripts/snapshot-verify.js --update     # 差分を確認してスナップショットを更新
 *   node scripts/snapshot-verify.js --summary    # 差分の自治体一覧のみ表示
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { PATTERNS } from "./snapshot-generate.js";

const require = createRequire(import.meta.url);
// scripts/lib/kokuho-loader.cjs 経由で calculateKokuho を取得（issue #3 fix）。
// 詳細は loader のヘッダ comment 参照。
const { calculateKokuho } = require("./lib/kokuho-loader.cjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const REGISTRY  = path.join(ROOT, "registry", "index.json");
const MUNI_DIR  = path.join(ROOT, "data", "municipalities");
const SNAP_FILE = path.join(ROOT, "snapshots", "kokuho.json");

if (!existsSync(SNAP_FILE)) {
  console.error("❌ snapshots/kokuho.json が見つかりません。先に snapshot-generate.js を実行してください。");
  process.exit(1);
}

const UPDATE  = process.argv.includes("--update");
const SUMMARY = process.argv.includes("--summary");
const targetArg  = process.argv.indexOf("--slug");
const targetSlug = targetArg !== -1 ? process.argv[targetArg + 1] : null;

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

// silent catch 防止: 計算失敗を _failedCases に記録（issue #3 acceptance criteria）
const _failedCases = [];

function runPatterns(data, slug) {
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
    } catch (e) {
      _failedCases.push({ slug: slug || "(unknown)", pattern: pat.id, error: e.message });
      return null;
    }
  });
}

// ── 照合 ────────────────────────────────────────────────────────
const snapshot  = JSON.parse(readFileSync(SNAP_FILE, "utf-8"));
const registry  = JSON.parse(readFileSync(REGISTRY, "utf-8"));

const targets = targetSlug
  ? registry.municipalities.filter(m => m.citySlug === targetSlug)
  : registry.municipalities;

let pass = 0, fail = 0, skip = 0;
const diffs = [];
const updatedData = { ...snapshot.data };

for (const m of targets) {
  const cityData = loadData(m.citySlug);
  if (!cityData) { skip++; continue; }

  const saved   = snapshot.data[m.citySlug];
  const current = runPatterns(cityData, m.citySlug);

  if (!saved) {
    // スナップショットに存在しない（新自治体）
    diffs.push({ slug: m.citySlug, name: m.cityName, type: "new", changes: [] });
    updatedData[m.citySlug] = current;
    fail++;
    continue;
  }

  const changes = [];
  for (let i = 0; i < PATTERNS.length; i++) {
    if (saved[i] !== current[i]) {
      changes.push({ pattern: PATTERNS[i].id, before: saved[i], after: current[i] });
    }
  }

  if (changes.length > 0) {
    diffs.push({ slug: m.citySlug, name: m.cityName, type: "changed", changes });
    updatedData[m.citySlug] = current;
    fail++;
  } else {
    pass++;
  }
}

// ── 結果表示 ────────────────────────────────────────────────────
console.log(`\n▶ スナップショット照合: ${snapshot.generated} 版`);
console.log(`  ✅ 一致: ${pass}件  ❌ 差分: ${fail}件  スキップ: ${skip}件\n`);

if (diffs.length === 0) {
  console.log("✅ 全ケース一致。計算結果に変化はありません。");
} else {
  console.log(`❌ ${diffs.length}自治体で差分あり:\n`);

  for (const d of diffs) {
    if (d.type === "new") {
      console.log(`  [NEW] ${d.name}（${d.slug}）: スナップショットに未登録`);
      continue;
    }
    console.log(`  [DIFF] ${d.name}（${d.slug}）`);
    if (!SUMMARY) {
      for (const c of d.changes) {
        const delta = c.after != null && c.before != null
          ? ` (${c.after > c.before ? "+" : ""}${(c.after - c.before).toLocaleString()}円)`
          : "";
        console.log(`    ${c.pattern}: ${c.before?.toLocaleString() ?? "null"}円 → ${c.after?.toLocaleString() ?? "null"}円${delta}`);
      }
    }
  }
}

// ── スナップショット更新 ─────────────────────────────────────────
if (UPDATE && diffs.length > 0) {
  const newSnapshot = {
    generated:     new Date().toISOString().slice(0, 10),
    municipalities: Object.keys(updatedData).length,
    patterns:      PATTERNS.map(p => p.id),
    data:          updatedData,
  };
  writeFileSync(SNAP_FILE, JSON.stringify(newSnapshot, null, 2), "utf-8");
  console.log(`\n✅ スナップショットを更新しました (${diffs.length}自治体)`);
} else if (diffs.length > 0 && !UPDATE) {
  console.log(`\n  差分を意図的な変更として受け入れる場合は --update を付けて再実行してください。`);
}

// silent catch 防止: 計算失敗が出た場合は明示報告（exit code 2）
if (_failedCases.length > 0) {
  console.error(`\n❌ 計算失敗 ${_failedCases.length} ケース（verify 比較結果は信頼不可）:`);
  _failedCases.slice(0, 10).forEach(f => console.error(`   ${f.slug} / ${f.pattern}: ${f.error}`));
  if (_failedCases.length > 10) console.error(`   ...（残り ${_failedCases.length - 10} 件略）`);
  process.exit(2);
}

process.exit(diffs.length > 0 ? 1 : 0);
