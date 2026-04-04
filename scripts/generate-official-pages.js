/**
 * 正式版ページ生成スクリプト
 *
 * registry/index.json に登録された全自治体の正式版HTMLページを
 * {prefSlug}/{citySlug}/ 以下に生成する。
 *
 * 生成されるファイル（自治体ごと）:
 *   {prefSlug}/{citySlug}/index.html    かんたん計算ページ
 *   {prefSlug}/{citySlug}/income.html   所得ベース計算ページ
 *
 * URL例:
 *   kokuho-keisan.jp/kanagawa/chigasaki/
 *   kokuho-keisan.jp/tokyo/shinjuku/income.html
 *
 * テンプレート:
 *   templates/kokuho-simple.html
 *   templates/kokuho-income.html
 *
 * 実行:
 *   node scripts/generate-official-pages.js
 *   node scripts/generate-official-pages.js chigasaki  （特定自治体のみ）
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const TMPL_DIR  = path.join(ROOT, "templates");
const REGISTRY  = path.join(ROOT, "registry", "index.json");
const BASE_URL  = "https://kokuho-keisan.jp";

// 都道府県名 → スラグ
const PREF_SLUG = {
  "北海道":   "hokkaido",
  "青森県":   "aomori",
  "岩手県":   "iwate",
  "宮城県":   "miyagi",
  "秋田県":   "akita",
  "山形県":   "yamagata",
  "福島県":   "fukushima",
  "茨城県":   "ibaraki",
  "栃木県":   "tochigi",
  "群馬県":   "gunma",
  "埼玉県":   "saitama",
  "千葉県":   "chiba",
  "東京都":   "tokyo",
  "神奈川県": "kanagawa",
  "新潟県":   "niigata",
  "富山県":   "toyama",
  "石川県":   "ishikawa",
  "福井県":   "fukui",
  "山梨県":   "yamanashi",
  "長野県":   "nagano",
  "岐阜県":   "gifu",
  "静岡県":   "shizuoka",
  "愛知県":   "aichi",
  "三重県":   "mie",
  "滋賀県":   "shiga",
  "京都府":   "kyoto",
  "大阪府":   "osaka",
  "兵庫県":   "hyogo",
  "奈良県":   "nara",
  "和歌山県": "wakayama",
  "鳥取県":   "tottori",
  "島根県":   "shimane",
  "岡山県":   "okayama",
  "広島県":   "hiroshima",
  "山口県":   "yamaguchi",
  "徳島県":   "tokushima",
  "香川県":   "kagawa",
  "愛媛県":   "ehime",
  "高知県":   "kochi",
  "福岡県":   "fukuoka",
  "佐賀県":   "saga",
  "長崎県":   "nagasaki",
  "熊本県":   "kumamoto",
  "大分県":   "oita",
  "宮崎県":   "miyazaki",
  "鹿児島県": "kagoshima",
  "沖縄県":   "okinawa",
};

// ─────────────────────────────────────────────────────────────────
// SEO ヘルパー
// ─────────────────────────────────────────────────────────────────

function fmtRate(r) {
  return (r * 100).toFixed(2).replace(/\.?0+$/, "") + "%";
}

function fmtYen(n) {
  return Number(n).toLocaleString("ja-JP") + "円";
}

function fmtMan(n) {
  return Math.round(n / 10000) + "万円";
}

function loadCityData(citySlug) {
  const p = path.join(ROOT, "data", "municipalities", citySlug, "kokuho-2025.json");
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf-8")); } catch { return null; }
}

function buildMetaDesc(cityName, prefecture, data, isIncome) {
  if (!data) {
    return isIncome
      ? `${cityName}（${prefecture}）の令和7年度 国民健康保険料を詳しく計算。未就学児・介護保険・給与年金も考慮した精密シミュレーション。`
      : `${cityName}（${prefecture}）の令和7年度 国民健康保険料を無料で計算。世帯人数と所得を入力するだけで年間保険料の目安がわかります。`;
  }
  const r = data.rate?.medical ?? 0;
  const p = data.perCapita?.medical ?? 0;
  if (isIncome) {
    return `${cityName}（${prefecture}）の令和7年度 国保料を詳しく計算。医療分所得割${fmtRate(r)}・均等割${fmtYen(p)}。未就学児・介護保険・給与年金も考慮した精密シミュレーション。`;
  }
  return `${cityName}（${prefecture}）の令和7年度 国民健康保険料を無料で計算。医療分所得割${fmtRate(r)}・均等割${fmtYen(p)}。所得と世帯人数を入力するだけで年間保険料の目安がわかります。`;
}

function buildCanonicalUrl(prefSlug, citySlug, isIncome) {
  const base = `${BASE_URL}/${prefSlug}/${citySlug}/`;
  return isIncome ? `${base}income.html` : base;
}

function buildJsonLd(cityName, prefecture, prefSlug, citySlug, desc, isIncome) {
  const pageUrl = buildCanonicalUrl(prefSlug, citySlug, isIncome);
  const breadcrumb = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "国保計算ポータル", "item": BASE_URL + "/" },
      { "@type": "ListItem", "position": 2, "name": prefecture, "item": `${BASE_URL}/#${prefSlug}` },
      { "@type": "ListItem", "position": 3, "name": cityName, "item": `${BASE_URL}/${prefSlug}/${citySlug}/` },
    ],
  };
  const app = {
    "@type": "WebApplication",
    "name": `${cityName} 国民健康保険料計算ツール（令和7年度）`,
    "description": desc,
    "url": pageUrl,
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "inLanguage": "ja",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
  };
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [breadcrumb, app] });
}

function buildRateTable(cityName, data) {
  if (!data) return "";

  const rate = data.rate       ?? {};
  const pc   = data.perCapita  ?? {};
  const hh   = data.household  ?? {};
  const caps = data.caps       ?? {};
  const asset = data.assetLevy ?? null;

  const hasHousehold = (hh.medical || 0) + (hh.support || 0) + (hh.care || 0) > 0;
  const hasAsset     = asset && ((asset.medical || 0) + (asset.support || 0) + (asset.care || 0)) > 0;

  const rows = [
    { label: "医療分",          r: rate.medical,  p: pc.medical,  h: hh.medical,  c: caps.medical,  a: asset?.medical },
    { label: "後期高齢者支援金分", r: rate.support, p: pc.support,  h: hh.support,  c: caps.support,  a: asset?.support },
    { label: "介護分（40〜64歳）", r: rate.care,   p: pc.care,     h: hh.care,     c: caps.care,     a: asset?.care },
  ];

  const thStyle = "padding:6px 10px;background:#f3f4f6;font-size:12px;font-weight:600;text-align:center;border:1px solid #e5e7eb;white-space:nowrap;";
  const tdStyle = "padding:6px 10px;font-size:12px;text-align:right;border:1px solid #e5e7eb;";
  const tdLStyle = "padding:6px 10px;font-size:12px;border:1px solid #e5e7eb;font-weight:600;";

  let headerCols = `<th style="${thStyle}">種別</th><th style="${thStyle}">所得割率</th><th style="${thStyle}">均等割額</th>`;
  if (hasHousehold) headerCols += `<th style="${thStyle}">平等割額</th>`;
  if (hasAsset)     headerCols += `<th style="${thStyle}">資産割率</th>`;
  headerCols += `<th style="${thStyle}">賦課限度額</th>`;

  const bodyRows = rows.map(row => {
    let cells = `<td style="${tdLStyle}">${row.label}</td>`;
    cells += `<td style="${tdStyle}">${row.r != null ? fmtRate(row.r) : "—"}</td>`;
    cells += `<td style="${tdStyle}">${row.p != null ? fmtYen(row.p) : "—"}</td>`;
    if (hasHousehold) cells += `<td style="${tdStyle}">${row.h != null ? fmtYen(row.h) : "—"}</td>`;
    if (hasAsset)     cells += `<td style="${tdStyle}">${row.a != null ? fmtRate(row.a) : "—"}</td>`;
    cells += `<td style="${tdStyle}">${row.c != null ? fmtMan(row.c) : "—"}</td>`;
    return `<tr>${cells}</tr>`;
  }).join("\n      ");

  return `
  <section style="margin-top:28px;padding:16px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
    <h2 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 12px;">令和7年度 ${cityName}の国民健康保険料率</h2>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr>${headerCols}</tr></thead>
        <tbody>
      ${bodyRows}
        </tbody>
      </table>
    </div>
  </section>`;
}

// ─────────────────────────────────────────────────────────────────
// render
// ─────────────────────────────────────────────────────────────────

function render(template, { citySlug, cityName, prefecture, prefSlug, data, isIncome }) {
  const metaDesc    = buildMetaDesc(cityName, prefecture, data, isIncome);
  const canonical   = buildCanonicalUrl(prefSlug, citySlug, isIncome);
  const jsonLd      = buildJsonLd(cityName, prefecture, prefSlug, citySlug, metaDesc, isIncome);
  const rateTable   = buildRateTable(cityName, data);

  return template
    .replaceAll("__CITY_SLUG__",    citySlug)
    .replaceAll("__CITY_NAME__",    cityName)
    .replaceAll("__META_DESC__",    metaDesc)
    .replaceAll("__CANONICAL_URL__", canonical)
    .replaceAll("__JSON_LD__",      jsonLd)
    .replaceAll("__RATE_TABLE__",   rateTable);
}

// ─────────────────────────────────────────────────────────────────
// メイン
// ─────────────────────────────────────────────────────────────────

const tmplSimple = readFileSync(path.join(TMPL_DIR, "kokuho-simple.html"), "utf-8");
const tmplIncome = readFileSync(path.join(TMPL_DIR, "kokuho-income.html"), "utf-8");

const registry   = JSON.parse(readFileSync(REGISTRY, "utf-8"));
const targetSlug = process.argv[2] || null;

const targets = targetSlug
  ? registry.municipalities.filter(m => m.citySlug === targetSlug)
  : registry.municipalities;

if (targets.length === 0) {
  console.error(`❌ スラグが見つかりません: ${targetSlug}`);
  process.exit(1);
}

let generated = 0;
const skipped = [];

for (const m of targets) {
  const prefSlug = m.prefectureSlug ?? PREF_SLUG[m.prefecture];
  if (!prefSlug) {
    skipped.push(`${m.cityName}: 都道府県スラグ未定義 (${m.prefecture})`);
    continue;
  }

  const data = loadCityData(m.citySlug);
  const ctx  = { citySlug: m.citySlug, cityName: m.cityName, prefecture: m.prefecture, prefSlug, data };

  const dir = path.join(ROOT, prefSlug, m.citySlug);
  mkdirSync(dir, { recursive: true });

  writeFileSync(path.join(dir, "index.html"),  render(tmplSimple, { ...ctx, isIncome: false }), "utf-8");
  writeFileSync(path.join(dir, "income.html"), render(tmplIncome, { ...ctx, isIncome: true  }), "utf-8");

  generated++;
}

console.log(`\n✅ ${generated}自治体の正式版ページを生成しました`);
console.log(`   出力先: {都道府県スラグ}/{自治体スラグ}/index.html & income.html`);

if (skipped.length > 0) {
  console.warn(`\n⚠️  スキップ:`);
  skipped.forEach(s => console.warn("  ", s));
}

console.log();
