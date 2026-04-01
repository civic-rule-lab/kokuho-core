/**
 * selector.js / index.html 自動生成スクリプト
 *
 * registry/index.json を読み込み、以下を自動生成する:
 *   - test/js/selector.js   (test/ 用、相対URL)
 *   - js/selector.js        (正式版用、絶対URL /{pref}/{slug}/)
 *   - index.html            (正式版ポータル)
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
const OUT_ROOT  = path.join(ROOT, "js", "selector.js");

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));

// 都道府県ごとにグループ化（test用・正式版両方）
function buildPrefGroups(official = false) {
  const groups = {};
  for (const m of registry.municipalities) {
    const pref = m.prefecture || "神奈川県";
    const prefSlug = prefSlugMap(pref);
    if (!groups[prefSlug]) {
      groups[prefSlug] = { name: pref, municipalities: {} };
    }
    groups[prefSlug].municipalities[m.citySlug] = buildMuniEntry(m, official);
  }
  return groups;
}

const prefGroups = buildPrefGroups(false);
const prefGroupsOfficial = buildPrefGroups(true);

function prefSlugMap(name) {
  const map = { "神奈川県": "kanagawa", "長野県": "nagano", "東京都": "tokyo", "埼玉県": "saitama", "千葉県": "chiba", "大阪府": "osaka", "福岡県": "fukuoka" };
  return map[name] || name;
}

function buildMuniEntry(m, official = false) {
  const prefSlug = prefSlugMap(m.prefecture || "神奈川県");
  const systems = {};
  for (const sys of (m.systems || [])) {
    systems[sys] = buildSystemEntry(m.citySlug, sys, prefSlug, official);
  }
  return { name: m.cityName, systems };
}

function buildSystemEntry(slug, system, prefSlug, official = false) {
  if (system === "kokuho") {
    return {
      name: "国民健康保険",
      pages: {
        simple: {
          name: "かんたん計算",
          url: official ? `/${prefSlug}/${slug}/` : `./${slug}-kokuho.html`,
        },
        income: {
          name: "所得ベース計算",
          url: official ? `/${prefSlug}/${slug}/income.html` : `./${slug}-kokuho-income.html`,
        },
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

// 正式版 js/selector.js 出力（絶対URL版）
const jsOfficial = `// このファイルは自動生成されます。
// 編集: scripts/generate-selector.js を実行してください。
// 生成元: registry/index.json
// 最終生成: ${new Date().toISOString().slice(0, 10)}

const registry = ${JSON.stringify(prefGroupsOfficial, null, 2)};

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
writeFileSync(OUT_ROOT, jsOfficial, "utf-8");

// 正式版 index.html 更新
updateIndexHtml(prefGroupsOfficial);

// test/selector.html のドロップダウンも自動更新
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

function updateIndexHtml(groups) {
  const firstPrefSlug = Object.keys(groups)[0];
  const firstMunis = groups[firstPrefSlug]?.municipalities || {};

  const prefOptions = Object.entries(groups)
    .map(([slug, g]) => `    <option value="${slug}">${g.name}</option>`)
    .join("\n");

  const muniOptions = Object.entries(firstMunis)
    .map(([slug, m]) => `<option value="${slug}">${m.name}</option>`)
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>国保計算ツール｜Civic Rule Lab</title>
<link rel="stylesheet" href="/css/selector.css?v=3">
</head>

<body>

<div class="wrap">
<div class="subtitle">自治体制度の情報サービス</div>

<div class="brand">Civic Rule Lab</div>

<div class="tagline">市民 ↔ 制度</div>

<div class="prefecture-group">
  <label for="prefecture">都道府県</label>
  <select id="prefecture" onchange="updateMunicipalities()">
${prefOptions}
  </select>
</div>

<label for="municipality">自治体</label>

<select id="municipality" onchange="updateSystems()">
${muniOptions}
</select>

<label for="system">制度</label>

<select id="system">
<option value="kokuho">国民健康保険</option>
</select>

<button type="button" onclick="goPage()">
  計算ページを開く
</button>

<div class="note">
  ※神奈川県・長野県・東京都の国民健康保険に対応しています。<br>
  ※料率は令和7年度の公式値を使用しています。<br>
  ※実際の保険料は各自治体の通知でご確認ください。
</div>

</div>

<script src="/js/selector.js"></script>

</body>
</html>
`;

  const htmlPath = path.join(ROOT, "index.html");
  writeFileSync(htmlPath, html, "utf-8");
}

console.log(`\n✅ selector.js 生成完了 (${registry.municipalities.length} 自治体)`);
console.log(`✅ js/selector.js (正式版) 生成完了`);
console.log(`✅ index.html 更新完了`);
console.log(`✅ test/selector.html ドロップダウン更新完了`);
