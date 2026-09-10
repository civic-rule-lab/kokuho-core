/**
 * selector.js / index.html 自動生成スクリプト
 *
 * registry/index.json を読み込み、以下を自動生成する:
 *   - js/selector.js   (絶対URL /{pref}/{slug}/)
 *   - index.html       (正式版ポータル)
 *
 * 実行: node scripts/generate-selector.js
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const REGISTRY  = path.join(ROOT, "registry", "index.json");
const OUT_ROOT  = path.join(ROOT, "js", "selector.js");

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));

// 都道府県ごとにグループ化（test用・正式版両方）
// プルダウンの並びは registry の登録順ではなく JIS 市区町村コード順に統一する。
// cityCode の先頭2桁が都道府県コードのため、このソートだけで
// 都道府県（北海道→沖縄）・自治体（政令市→市→町村）の両方が標準順になる。
function buildPrefGroups(official = false) {
  const groups = {};
  const sorted = [...registry.municipalities].sort((a, b) =>
    String(a.cityCode).localeCompare(String(b.cityCode))
  );
  for (const m of sorted) {
    const pref = m.prefecture || "神奈川県";
    const prefSlug = m.prefectureSlug || pref;
    if (!groups[prefSlug]) {
      groups[prefSlug] = { name: pref, municipalities: {} };
    }
    groups[prefSlug].municipalities[m.citySlug] = buildMuniEntry(m, official);
  }
  return groups;
}

const prefGroupsOfficial = buildPrefGroups(true);

function buildMuniEntry(m, official = false) {
  const prefSlug = m.prefectureSlug || m.prefecture;
  const systems = {};
  for (const sys of (m.systems || [])) {
    systems[sys] = buildSystemEntry(m.citySlug, sys, prefSlug, official);
  }
  // jumin 公開自治体は統合シミュレーター（家計簿）も利用可能
  if (systems.jumin) {
    systems.kakeibo = buildSystemEntry(m.citySlug, "kakeibo", prefSlug, official);
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
  // 住民税・家計簿は制度ポータル（seido-keisan.jp）側で公開
  if (system === "jumin") {
    return {
      name: "住民税",
      pages: {
        simple: {
          name: "かんたん計算",
          url: `https://seido-keisan.jp/${prefSlug}/${slug}/jumin/`,
        },
        income: {
          name: "詳しく計算",
          url: `https://seido-keisan.jp/${prefSlug}/${slug}/jumin/income.html`,
        },
      },
    };
  }
  if (system === "kakeibo") {
    return {
      name: "まとめて試算（家計簿）",
      pages: {
        simple: {
          name: "家計簿シミュレーター",
          url: `https://seido-keisan.jp/${prefSlug}/${slug}/kakeibo/`,
        },
      },
    };
  }
  if (system === "kouki") {
    return {
      name: "後期高齢者医療",
      pages: {
        simple: {
          name: "かんたん計算",
          url: `https://seido-keisan.jp/${prefSlug}/${slug}/kouki/`,
        },
      },
    };
  }
  if (system === "kaigo") {
    return {
      name: "介護保険（第1号）",
      pages: {
        simple: {
          name: "かんたん計算",
          url: `https://seido-keisan.jp/${prefSlug}/${slug}/kaigo/`,
        },
      },
    };
  }
  if (system === "hoiku") {
    return { name: "保育料", pages: { simple: {
      name: "かんたん計算",
      url: `https://seido-keisan.jp/${prefSlug}/${slug}/hoiku/`,
    } } };
  }
  return { name: system, pages: {} };
}

// js/selector.js 出力
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
  updateSystems();
}

// 選択中の自治体で利用できる制度だけ選択可能にする
// （住民税・家計簿は制度ポータル公開済み自治体のみ）
function updateSystems() {
  const prefecture   = document.getElementById("prefecture").value;
  const municipality = document.getElementById("municipality").value;
  const sysSel       = document.getElementById("system");
  const available    = registry[prefecture]?.municipalities[municipality]?.systems || {};
  for (const opt of sysSel.options) {
    // 社保(shaho)は別サイト shaho-keisan.jp・registry非登録＝常に選択可（goPageで外部遷移）
    if (opt.value === "shaho") { opt.disabled = false; opt.textContent = opt.dataset.label; continue; }
    const ok = !!available[opt.value];
    opt.disabled = !ok;
    opt.textContent = opt.dataset.label + (ok ? "" : "（この自治体は準備中）");
  }
  if (sysSel.selectedOptions[0] && sysSel.selectedOptions[0].disabled) {
    sysSel.value = "kokuho";
  }
}
document.addEventListener("DOMContentLoaded", updateSystems);

function goPage() {
  const prefecture   = document.getElementById("prefecture").value;
  const municipality = document.getElementById("municipality").value;
  const system       = document.getElementById("system").value;

  // 社保(shaho)は別サイト shaho-keisan.jp。県別ページ /{pref}/ へ（47県公開済み・2026-07-12）。
  if (system === "shaho") { window.location.href = "https://shaho-keisan.jp/" + prefecture + "/"; return; }

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

// ─── 国保の検証状況（data の lifecycle から導出）───────────────────
// トップの注記に使う。フラグを持たせず毎回データから数える。
const kokuhoStats = (() => {
  const out = { total: 0, verified: 0, standard: 0, other: 0, y2025: 0 };
  for (const m of registry.municipalities) {
    if (!m.systems?.includes("kokuho")) continue; // 北方領土の泊村など kokuho 非対象を除外
    out.total++;
    const y = m.publishYear?.kokuho ?? 2025;
    if (y !== 2026) { out.y2025++; continue; }
    const f = path.join(ROOT, "data", "municipalities", m.citySlug, "kokuho-2026.json");
    if (!existsSync(f)) { out.other++; continue; }
    let j;
    try { j = JSON.parse(readFileSync(f, "utf-8")); } catch { out.other++; continue; }
    const stage = j?.meta?.lifecycle?.r8Stage;
    if (stage === "verified_r8")      out.verified++;
    else if (stage === "standard_r8") out.standard++;
    else                              out.other++;
  }
  return out;
})();

// 正式版 index.html 更新
updateIndexHtml(prefGroupsOfficial);

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
<meta name="google-site-verification" content="sNhNkkuSVSIT42t3RZtxpO-SY-YqjmCel9R4mD2e7C0">
<title>国保計算ツール｜Civic Rule Lab</title>
<link rel="stylesheet" href="/css/selector.css?v=3">
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-H15R1TNWD2"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-H15R1TNWD2');
</script>
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
<option value="kokuho" data-label="国民健康保険">国民健康保険</option>
<option value="jumin" data-label="住民税">住民税</option>
<option value="kakeibo" data-label="まとめて試算（家計簿シミュレーター）">まとめて試算（家計簿シミュレーター）</option>
<option value="kaigo" data-label="介護保険">介護保険</option>
<option value="shaho" data-label="社会保険（会社員）">社会保険（会社員）</option>
</select>

<button type="button" onclick="goPage()">
  計算ページを開く
</button>

<div class="note">
  ※全国${kokuhoStats.total}自治体の国民健康保険に対応しています。<br>
  ※${(() => {
    // publishYear は「どの年度のファイルを配信するか」であって検証状態ではない。
    // これを根拠に「令和8年度の公式値を使用しています」と書いていたため、実際には
    // 県標準保険料率（法定外繰入ゼロ前提の理論値）を出している自治体まで
    // 公式値と称していた（2026-09-10 実測: standard_r8 が 895 件）。
    // 検証状態は data の lifecycle から導出する。
    const { total, verified, standard, other, y2025 } = kokuhoStats;
    if (y2025 > 0) return `令和8年度データ: ${total - y2025}自治体 / 令和7年度継続中: ${y2025}自治体（順次更新）`;
    if (verified === total) return "料率は令和8年度の公式値を使用しています。";
    const parts = [`公式データ確認済み ${verified}自治体`];
    if (standard) parts.push(`県の標準保険料率（参考値）${standard}自治体`);
    if (other)    parts.push(`一次資料と照合中 ${other}自治体`);
    return `令和8年度の内訳（全${total}自治体）: ${parts.join(" / ")}`;
  })()}<br>
  ※実際の保険料は各自治体の通知でご確認ください。
</div>

<div style="margin-top:32px;border-top:1px solid #e5e7eb;padding-top:24px;">
  <div style="font-size:13px;font-weight:700;color:#6b7280;letter-spacing:0.08em;margin-bottom:12px;">都道府県から探す</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:6px;">
${Object.entries(groups).map(([slug, g]) =>
  `    <a href="/${slug}/" style="display:block;padding:6px 8px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;font-size:12px;color:#374151;text-decoration:none;text-align:center;white-space:nowrap;">${g.name}</a>`
).join('\n')}
  </div>
</div>

</div>

<script src="/js/selector.js?v=${new Date().toISOString().slice(0, 10).replace(/-/g, '')}"></script>

</body>
</html>
`;

  const htmlPath = path.join(ROOT, "index.html");
  writeFileSync(htmlPath, html, "utf-8");
}

console.log(`\n✅ js/selector.js 生成完了 (${registry.municipalities.length} 自治体)`);
console.log(`✅ index.html 更新完了`);
