#!/usr/bin/env node
/**
 * scripts/generate-legacy-redirect-pages.js
 *
 * legacy-slug-collisions.json の appliedDecisions に基づき、
 * 旧 slug の dir に meta refresh HTML を配置する（GitHub Pages 配信用の 301 代替）。
 *
 * 生成先: {prefSlug}/{oldSlug}/{index,income}.html
 * 動作  : 0 秒で {prefSlug}/{newSuffixedSlug}/{同名} へ redirect
 *
 * 使い方:
 *   node scripts/generate-legacy-redirect-pages.js          # dry-run（生成内容を表示）
 *   node scripts/generate-legacy-redirect-pages.js --apply  # 適用
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LEGACY = path.join(ROOT, "registry", "legacy-slug-collisions.json");
const REGISTRY = path.join(ROOT, "registry", "index.json");

const APPLY = process.argv.includes("--apply");

const legacy = JSON.parse(readFileSync(LEGACY, "utf-8"));
const reg = JSON.parse(readFileSync(REGISTRY, "utf-8"));

// suffixed.newSlug から prefectureSlug を逆引きするマップ
const slugToPrefSlug = new Map();
for (const m of reg.municipalities) {
  if (m.citySlug && m.prefectureSlug) slugToPrefSlug.set(m.citySlug, m.prefectureSlug);
}

const decisions = legacy?.namingConvention?.appliedDecisions || {};
const pages = [];

for (const [oldSlug, d] of Object.entries(decisions)) {
  for (const sfx of d.suffixed || []) {
    const newSlug = sfx.newSlug;
    const prefSlug = slugToPrefSlug.get(newSlug);
    if (!prefSlug) {
      console.warn(`⚠️  prefectureSlug 解決失敗: ${newSlug}（registry に entry なし）`);
      continue;
    }
    pages.push({
      oldSlug,
      newSlug,
      prefSlug,
      cityName: sfx.cityName,
      prefecture: sfx.prefecture,
    });
  }
}

const renderHtml = (p, fileName) => `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=/${p.prefSlug}/${p.newSlug}/${fileName === "index.html" ? "" : fileName}">
<link rel="canonical" href="https://kokuho-keisan.jp/${p.prefSlug}/${p.newSlug}/${fileName === "index.html" ? "" : fileName}">
<meta name="robots" content="noindex,follow">
<title>${p.prefecture}${p.cityName}（移転）— kokuho-keisan.jp</title>
<script>location.replace('/${p.prefSlug}/${p.newSlug}/${fileName === "index.html" ? "" : fileName}');</script>
</head>
<body>
<p>このページは <a href="/${p.prefSlug}/${p.newSlug}/${fileName === "index.html" ? "" : fileName}">/${p.prefSlug}/${p.newSlug}/${fileName === "index.html" ? "" : fileName}</a> に移転しました。</p>
</body>
</html>
`;

console.log(`# legacy slug redirect ページ生成（${APPLY ? "🔧 APPLY" : "🔍 DRY-RUN"}）`);
console.log(`対象: ${pages.length} ペア × 2 ファイル = ${pages.length * 2} ファイル\n`);

let written = 0;
for (const p of pages) {
  const dir = path.join(ROOT, p.prefSlug, p.oldSlug);
  for (const file of ["index.html", "income.html"]) {
    const target = path.join(dir, file);
    const content = renderHtml(p, file);
    console.log(`  ${APPLY ? "🔧" : "🔍"} ${p.prefSlug}/${p.oldSlug}/${file} → /${p.prefSlug}/${p.newSlug}/${file === "index.html" ? "" : file}`);
    if (APPLY) {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(target, content);
      written++;
    }
  }
}

console.log(`\n${APPLY ? `✅ ${written} 件適用完了` : "🔍 dry-run 完了。--apply で適用"}`);
