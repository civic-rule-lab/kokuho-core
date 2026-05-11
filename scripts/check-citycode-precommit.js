/**
 * pre-commit hook 用 cityCode 一次資料準拠チェッカ（POLICIES §10）
 *
 * staged された registry/index.json および data/municipalities/{slug}/kokuho-{year}.json の
 * cityCode を data/reference/soumu-jichitai-codes.json と照合。
 * ERROR レベルの不一致があれば commit を拒否。
 *
 * 単独実行も可能:
 *   node scripts/check-citycode-precommit.js
 *
 * 終了コード:
 *   0 — 検証OK（warning は許容）
 *   1 — ERROR レベル不一致あり（commit 拒否）
 *   2 — 環境エラー
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateCityCode } from "./validate-citycodes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

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

// 対象ファイル抽出
const munTargets = staged.filter(p =>
  /^data\/municipalities\/[^/]+\/kokuho-\d{4}\.json$/.test(p)
);
const registryStaged = staged.includes("registry/index.json");

if (munTargets.length === 0 && !registryStaged) {
  process.exit(0);
}

const errors = [];

// 1. data/municipalities の検証
for (const rel of munTargets) {
  const abs = path.join(ROOT, rel);
  if (!existsSync(abs)) continue;

  let data;
  try {
    data = JSON.parse(readFileSync(abs, "utf-8"));
  } catch (e) {
    continue; // parse error は別チェックで検出
  }

  const r = validateCityCode(data.cityCode, data.cityName, data.prefecture);
  if (r.level === "ERROR") {
    errors.push({ file: rel, ...r, actual: { cityCode: data.cityCode, cityName: data.cityName } });
  }
}

// 2. registry/index.json の検証（追加分のみではなく全件・コストが許容できる範囲）
if (registryStaged) {
  const reg = JSON.parse(readFileSync(path.join(ROOT, "registry/index.json"), "utf-8"));
  for (const m of reg.municipalities) {
    const r = validateCityCode(m.cityCode, m.cityName, m.prefecture);
    if (r.level === "ERROR") {
      errors.push({
        file: "registry/index.json",
        ...r,
        actual: { cityCode: m.cityCode, cityName: m.cityName, slug: m.citySlug },
      });
    }
  }
}

// 結果報告
if (errors.length > 0) {
  console.error("");
  console.error(`❌ pre-commit: cityCode 一次資料準拠違反を ${errors.length} 件検出（POLICIES §10）`);
  console.error("");
  for (const e of errors) {
    console.error(`  📄 ${e.file}`);
    console.error(`     ${e.reason}`);
    if (e.expected) {
      console.error(`     一次資料: ${e.expected.prefecture}${e.expected.cityName} (cityCode=${e.expected.code5})`);
    }
    console.error("");
  }
  console.error("一次資料: data/reference/soumu-jichitai-codes.json");
  console.error("更新手順: data/reference/README.md");
  process.exit(1);
}

process.exit(0);
