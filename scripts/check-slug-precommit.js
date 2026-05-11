/**
 * pre-commit hook 用 slug 衝突チェッカ
 *
 * git でステージされた kokuho-*.json を走査し、
 * citySlug + cityCode の組合せが registry/index.json と衝突しないか確認する。
 *
 * pre-commit hook から呼び出されることを想定（exit 1 で commit を拒否）。
 *
 * 単独実行も可能:
 *   node scripts/check-slug-precommit.js
 *
 * 終了コード:
 *   0 — 衝突なし（commit 続行可）
 *   1 — 衝突あり（commit 拒否）
 *   2 — 環境エラー（git 不在など）
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { checkSlug } from "./check-slug.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// ─── git でステージされたファイル一覧を取得 ─────────────────────
let staged;
try {
  staged = execSync("git diff --cached --name-only --diff-filter=AM", {
    cwd: ROOT,
    encoding: "utf-8",
  })
    .split("\n")
    .filter(Boolean);
} catch (e) {
  console.error("❌ git diff --cached の取得に失敗:", e.message);
  process.exit(2);
}

// ─── data/municipalities/{slug}/kokuho-*.json のみフィルタ ───
const targets = staged.filter(p =>
  /^data\/municipalities\/[^/]+\/kokuho-\d{4}\.json$/.test(p)
);

if (targets.length === 0) {
  // 対象ファイル変更なし、即座に通す
  process.exit(0);
}

// ─── 各ファイルの citySlug + cityCode を registry と照合 ───────
const collisions = [];

for (const rel of targets) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) continue;

  let data;
  try {
    data = JSON.parse(readFileSync(abs, "utf-8"));
  } catch (e) {
    console.error(`⚠️  JSON parse error: ${rel} — ${e.message}`);
    // parse 失敗はここでは止めない（他のチェックで検出される）
    continue;
  }

  const slug = data.citySlug;
  const cityCode = data.cityCode;

  if (!slug || !cityCode) {
    console.error(`⚠️  citySlug または cityCode が空: ${rel}`);
    continue;
  }

  const result = checkSlug(slug, cityCode);

  if (!result.ok) {
    collisions.push({ file: rel, slug, cityCode, conflict: result.conflict });
  }
}

// ─── 結果報告 ──────────────────────────────────────────────────
if (collisions.length > 0) {
  console.error("");
  console.error(`❌ pre-commit: slug 衝突を ${collisions.length} 件検出（POLICIES §9）`);
  console.error("");
  for (const c of collisions) {
    console.error(`  📄 ${c.file}`);
    console.error(`     citySlug="${c.slug}" cityCode=${c.cityCode}`);
    console.error(`     既存: ${c.conflict.prefecture}${c.conflict.cityName} (cityCode=${c.conflict.cityCode})`);
    console.error(`     → 対処: citySlug を {base}-{prefSlug} 形式に変更（例: ${c.slug}-${c.slug}）してから再 commit`);
    console.error("");
  }
  console.error("registry 既存例: hokuto-yamanashi / kashima-saga / konan-kochi 等");
  console.error("詳細: POLICIES.md §9 slug 衝突拒否ルール");
  process.exit(1);
}

process.exit(0);
