/**
 * 神奈川県 全自治体ページ一括ビルドスクリプト
 *
 * 以下を順番に実行する：
 *   1. generate-kanagawa-kokuho.js  → data/municipalities/{slug}/kokuho-2025.json
 *   2. update-registry.js           → registry/index.json 自動更新
 *   3. generate-city-pages.js       → test/{slug}-kokuho.html 等
 *   4. generate-selector.js         → test/js/selector.js 自動更新
 *
 * 実行: node scripts/build-all.js
 * 特定市のみ: node scripts/build-all.js hiratsuka
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function run(script, args = "") {
  const cmd = `node ${path.join(__dirname, script)} ${args}`.trim();
  console.log(`\n▶ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

const target = process.argv[2] || "";

console.log(`\n${"=".repeat(60)}`);
console.log(`神奈川県 全自治体ページ一括ビルド`);
if (target) console.log(`対象: ${target}`);
console.log(`${"=".repeat(60)}`);

run("generate-kanagawa-kokuho.js");
run("update-registry.js");
run("generate-city-pages.js", target);
run("generate-selector.js");

console.log(`\n${"=".repeat(60)}`);
console.log(`✅ ビルド完了`);
console.log(`${"=".repeat(60)}\n`);
