/**
 * 6件 legacy slug 衝突への統一命名規約 v1 適用スクリプト（POLICIES §9）
 *
 * registry/legacy-slug-collisions.json の namingConvention.appliedDecisions に
 * 沿って、registry citySlug の更新 + data/municipalities/ ディレクトリの
 * リネーム + 必要なデータ移動 + JSON 内 citySlug 更新を一括実施。
 *
 * 利用:
 *   node scripts/fix-slug-collisions.js              # dry-run
 *   node scripts/fix-slug-collisions.js --apply      # 実適用
 *
 * 注意：
 *   - 実行前に `git status` でクリーンな状態であることを確認
 *   - 適用後は `node engines/kokuho/generate.js` と
 *     `node scripts/generate-official-pages.js` で HTML 再生成必須
 *   - 旧 URL は Cloudflare Worker で 301 redirect を別途設定すること
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, renameSync, mkdirSync, rmdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REGISTRY = path.join(ROOT, "registry", "index.json");
const LEGACY = path.join(ROOT, "registry", "legacy-slug-collisions.json");
const DATA_DIR = path.join(ROOT, "data", "municipalities");

const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");

const reg = JSON.parse(readFileSync(REGISTRY, "utf-8"));
const legacy = JSON.parse(readFileSync(LEGACY, "utf-8"));

const decisions = legacy.namingConvention?.appliedDecisions || {};

// 各 decision から: {oldSlug, prefecture, cityName, newSlug} のフラットリスト生成
const ops = [];
for (const [oldSlug, dec] of Object.entries(decisions)) {
  // base 側
  if (dec.base.newSlug !== oldSlug) {
    ops.push({
      role: "base",
      oldSlug,
      newSlug: dec.base.newSlug,
      prefecture: dec.base.prefecture,
      cityName: dec.base.cityName,
      rationale: dec.rationale,
    });
  }
  // suffixed 側
  for (const s of dec.suffixed) {
    ops.push({
      role: "suffixed",
      oldSlug,
      newSlug: s.newSlug,
      prefecture: s.prefecture,
      cityName: s.cityName,
      rationale: dec.rationale,
    });
  }
}

console.log(`# slug 衝突 6件の統一命名規約 v1 適用`);
console.log(`モード: ${APPLY ? "🔧 APPLY" : "🔍 DRY-RUN"}`);
console.log(``);
console.log(`計 ${ops.length} 件の操作:`);
console.log(``);

// ─── 計画策定 ────────────────────────────────────────────────
const plan = [];
for (const op of ops) {
  const planItem = {
    op,
    registryUpdate: null,
    dirOps: [],
    fileOps: [],
  };

  // registry update
  const m = reg.municipalities.find(x => x.prefecture === op.prefecture && x.cityName === op.cityName);
  if (m) {
    planItem.registryUpdate = { from: m.citySlug, to: op.newSlug };
  }

  // data dir operations
  // 新 slug から prefSlug を抽出（"ichinomiya-chiba" → "chiba"）
  const prefSlug = op.newSlug.includes("-") ? op.newSlug.split("-").slice(1).join("-") : null;
  // 対象自治体の cityCode を registry から取得（安全な照合用）
  const targetCityCode = m ? String(m.cityCode).padStart(5, "0") : null;

  const candidates = [
    op.newSlug,                                     // 既に新名称
    prefSlug ? `${prefSlug}-${op.oldSlug}` : null,  // {prefSlug}-{old}（5/11 の hokkaido-* 命名）
    `hokkaido-${op.oldSlug}`,                        // 既存命名 fallback
    `chiba-${op.oldSlug}`,
    `${op.oldSlug}-hokkaido`, `${op.oldSlug}-chiba`,
    op.oldSlug,                                     // base 名そのまま
  ].filter(Boolean);

  let foundDir = null;
  for (const c of candidates) {
    const p = path.join(DATA_DIR, c);
    if (!existsSync(p)) continue;
    // cityCode で正確判定（cityName が同じ自治体が混在する可能性に対応）
    for (const fn of readdirSync(p)) {
      if (!fn.endsWith(".json")) continue;
      try {
        const d = JSON.parse(readFileSync(path.join(p, fn), "utf-8"));
        const fileCode = String(d.cityCode || "").padStart(5, "0");
        if (targetCityCode && fileCode === targetCityCode) {
          foundDir = c;
          break;
        }
      } catch { }
    }
    if (foundDir) break;
  }

  if (foundDir && foundDir !== op.newSlug) {
    planItem.dirOps.push({ rename: foundDir, to: op.newSlug });
  }

  // JSON 内 citySlug 更新（rename 後）
  if (foundDir) {
    const finalDir = foundDir === op.newSlug ? op.newSlug : op.newSlug;
    planItem.fileOps.push({ dir: finalDir, newSlug: op.newSlug });
  }

  plan.push(planItem);
}

// ─── プラン出力 ──────────────────────────────────────────────
for (const item of plan) {
  console.log(`■ ${item.op.prefecture}${item.op.cityName} (${item.op.role})`);
  console.log(`   旧 slug: \`${item.op.oldSlug}\`  →  新 slug: \`${item.op.newSlug}\``);
  if (item.registryUpdate) {
    console.log(`   registry: citySlug ${item.registryUpdate.from} → ${item.registryUpdate.to}`);
  } else {
    console.log(`   ⚠️ registry エントリ見つからず`);
  }
  for (const d of item.dirOps) {
    console.log(`   dir: data/municipalities/${d.rename}/ → data/municipalities/${d.to}/`);
  }
  for (const f of item.fileOps) {
    console.log(`   files: data/municipalities/${f.dir}/*.json の citySlug を ${f.newSlug} に更新`);
  }
  console.log("");
}

console.log("ℹ️ ichinomiya/kaigo-2026.json の千葉一宮町データ混入は本スクリプト範囲外。");
console.log("   別途 手動 mv で chiba-ichinomiya/ に移動してください。");
console.log("");

// ─── 適用 ────────────────────────────────────────────────────
if (APPLY) {
  console.log("🔧 適用開始...");
  console.log("");

  for (const item of plan) {
    // 1. dir rename
    for (const d of item.dirOps) {
      const from = path.join(DATA_DIR, d.rename);
      const to = path.join(DATA_DIR, d.to);
      if (existsSync(to)) {
        console.log(`  ⚠️ ${to} 既存 — スキップ`);
        continue;
      }
      renameSync(from, to);
      console.log(`  ✅ ディレクトリ rename: ${d.rename} → ${d.to}`);
    }
    // 2. JSON 内 citySlug 更新
    for (const f of item.fileOps) {
      const dir = path.join(DATA_DIR, f.dir);
      if (!existsSync(dir)) continue;
      for (const fn of readdirSync(dir)) {
        if (!fn.endsWith(".json")) continue;
        const fp = path.join(dir, fn);
        try {
          const d = JSON.parse(readFileSync(fp, "utf-8"));
          if (d.cityName === item.op.cityName && d.citySlug !== f.newSlug) {
            d.citySlug = f.newSlug;
            writeFileSync(fp, JSON.stringify(d, null, 2) + "\n", "utf-8");
            console.log(`  ✅ JSON 内 citySlug 更新: ${fn} → ${f.newSlug}`);
          }
        } catch { }
      }
    }
    // 3. registry update
    if (item.registryUpdate) {
      const m = reg.municipalities.find(x => x.prefecture === item.op.prefecture && x.cityName === item.op.cityName);
      if (m) {
        m.citySlug = item.op.newSlug;
      }
    }
  }
  writeFileSync(REGISTRY, JSON.stringify(reg, null, 2) + "\n", "utf-8");
  console.log("");
  console.log("  ✅ registry/index.json 更新完了");
  console.log("");
  console.log("📌 次のステップ:");
  console.log("   1. data/municipalities/ichinomiya/kaigo-2026.json を chiba-ichinomiya/ に手動 mv");
  console.log("   2. node engines/kokuho/generate.js");
  console.log("   3. node scripts/generate-official-pages.js");
  console.log("   4. Cloudflare Worker で 301 redirect ルール追加");
  console.log("   5. bash scripts/deploy.sh --push");
}
