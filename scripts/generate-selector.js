/**
 * test/js/selector.js 自動生成スクリプト
 *
 * registry/index.json を読み込み、
 * test/js/selector.js を自動生成する。
 * 手動編集は不要になる。
 *
 * 実行: node scripts/generate-selector.js
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const REGISTRY  = path.join(ROOT, "registry", "index.json");
const OUT       = path.join(ROOT, "test", "js", "selector.js");

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));

// 都道府県ごとにグループ化
const prefGroups = {};
for (const m of registry.municipalities) {
  const pref = m.prefecture || "神奈川県";
  const prefSlug = prefSlugMap(pref);
  if (!prefGroups[prefSlug]) {
    prefGroups[prefSlug] = { name: pref, municipalities: {} };
  }
  prefGroups[prefSlug].municipalities[m.citySlug] = buildMuniEntry(m);
}

function prefSlugMap(name) {
  const map = { "神奈川県": "kanagawa", "長野県": "nagano", "東京都": "tokyo" };
  return map[name] || name;
}

function buildMuniEntry(m) {
  const systems = {};
  for (const sys of (m.systems || [])) {
    systems[sys] = buildSystemEntry(m.citySlug, sys);
  }
  return { name: m.cityName, systems };
}

function buildSystemEntry(slug, system) {
  if (system === "kokuho") {
    return {
      name: "国民健康保険",
      pages: {
        simple: { name: "かんたん計算",   url: `./${slug}-kokuho.html` },
        income: { name: "所得ベース計算", url: `./${slug}-kokuho-income.html` },
      },
    };
  }
  return { name: system, pages: {} };
}

// selector.js 出力
const js = `// このファイルは自動生成されます。
// 編集: scripts/generate-selector.js を実行してください。
// 生成元: registry/index.json
// 最終生成: ${new Date().toISOString().slice(0, 10)}

const registry = ${JSON.stringify(prefGroups, null, 2)};

function updateMunicipalities() {
  const pref = document.getElementById("prefecture").value;
  const sel  = document.getElementById("municipality");
  const municipalities = registry[pref]?.municipalities || {};
  sel.innerHTML = Object.entries(municipalities)
    .map(function(e) { return '<option value="' + e[0] + '">' + e[1].name + '</option>'; })
    .join("");
}

function goPage() {
  const prefecture   = document.getElementById("prefecture").value;
  const municipality = document.getElementById("municipality").value;
  const system       = document.getElementById("system").value;

  const url =
    registry[prefecture]
      ?.municipalities[municipality]
      ?.systems[system]
      ?.pages["simple"]
      ?.url;

  if (url) {
    window.location.href = url;
  } else {
    alert("ページが見つかりませんでした。");
  }
}
`;

writeFileSync(OUT, js, "utf-8");

// selector.html のドロップダウンも自動更新
updateSelectorHtml(prefGroups);

function updateSelectorHtml(groups) {
  const htmlPath = path.join(ROOT, "test", "selector.html");
  let html = readFileSync(htmlPath, "utf-8");

  // 都道府県ドロップダウンを置換
  const prefOptions = Object.entries(groups)
    .map(([slug, g]) => `    <option value="${slug}">${g.name}</option>`)
    .join("\n");
  html = html.replace(
    /<select id="prefecture"[^>]*>[\s\S]*?<\/select>/,
    `<select id="prefecture" onchange="updateMunicipalities()">\n${prefOptions}\n  </select>`
  );

  // 自治体ドロップダウンは最初の都道府県の自治体で初期化
  const firstPrefSlug = Object.keys(groups)[0];
  const firstMunis = groups[firstPrefSlug]?.municipalities || {};
  const muniOptions = Object.entries(firstMunis)
    .map(([slug, m]) => `<option value="${slug}">${m.name}</option>`)
    .join("\n");
  html = html.replace(
    /<select id="municipality"[^>]*>[\s\S]*?<\/select>/,
    `<select id="municipality" onchange="updateSystems()">\n${muniOptions}\n</select>`
  );

  writeFileSync(htmlPath, html, "utf-8");
}

console.log(`\n✅ selector.js 生成完了 (${registry.municipalities.length} 自治体)`);
console.log(`✅ selector.html ドロップダウン更新完了`);
