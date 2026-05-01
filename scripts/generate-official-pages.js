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
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const TMPL_DIR  = path.join(ROOT, "templates");
const REGISTRY  = path.join(ROOT, "registry", "index.json");
const BASE_URL  = "https://kokuho-keisan.jp";

const _require = createRequire(import.meta.url);
const { PREFECTURE_INFO } = _require("../js/core/prefecture-info.js");

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
  // R8（2026）優先、なければ R7（2025）フォールバック
  for (const yr of [2026, 2025]) {
    const p = path.join(ROOT, "data", "municipalities", citySlug, `kokuho-${yr}.json`);
    if (existsSync(p)) {
      try { return JSON.parse(readFileSync(p, "utf-8")); } catch { /* skip */ }
    }
  }
  return null;
}

// 会計年度（4月始まり）を返す
function getFiscalYear(date = new Date()) {
  const m = date.getMonth() + 1;
  return m >= 4 ? date.getFullYear() : date.getFullYear() - 1;
}

// fiscalYear → 表示文字列（例: 2026 → "令和8年度（2026年度）"）
function fmtFY(fy) {
  return `令和${fy - 2018}年度（${fy}年度）`;
}

// 結果直下の免責＋確認済みバッジ（コンパクト版）
function buildTrustBadge(data) {
  const currentFY = getFiscalYear();

  if (!data) {
    return `
  <p class="result-note">実際の保険料は各自治体の窓口でご確認ください。<span class="result-note__badge result-note__badge--inferred">ⓘ 参考計算（公式データ未収録）</span></p>`;
  }

  const dataFY = data.fiscalYear ?? 2025;

  if (dataFY >= currentFY) {
    return `
  <p class="result-note">実際の保険料は各自治体の窓口でご確認ください。<span class="result-note__badge result-note__badge--verified">✓ ${fmtFY(dataFY)}公式データ確認済み</span></p>`;
  }

  return `
  <p class="result-note">実際の保険料は各自治体の窓口でご確認ください。<span class="result-note__badge result-note__badge--old">⚠ ${fmtFY(dataFY)}データ使用中</span></p>`;
}

// 都道府県の住民税補足（※と同列の小テキスト）
function buildPrefectureDesc(prefSlug, prefName, cityName) {
  const info = PREFECTURE_INFO[prefSlug];
  if (!info) return '';

  const body = `${cityName}は${prefName}の住民税が適用されています。${info.description.full}`;
  const sourceUrl = info.sourceUrl ?? null;
  const linkHtml  = sourceUrl && info.surcharge
    ? ` <a class="note-pref__link" href="${sourceUrl}" target="_blank" rel="noopener">${prefName}の住民税（公式）↗</a>`
    : '';

  return `
  <p class="note-pref"><span class="note-pref__label">${prefName}の住民税：</span><br>${body}${linkHtml}</p>`;
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
  // index.html の canonical は income.html を正規版として指定（重複コンテンツ対策）
  return `${base}income.html`;
}

function buildSelfUrl(prefSlug, citySlug, isIncome) {
  const base = `${BASE_URL}/${prefSlug}/${citySlug}/`;
  return isIncome ? `${base}income.html` : base;
}

function buildJsonLd(cityName, prefecture, prefSlug, citySlug, desc, isIncome) {
  const pageUrl = buildSelfUrl(prefSlug, citySlug, isIncome);
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

function buildIntroText(cityName, prefecture, data, isIncome) {
  if (isIncome) {
    if (!data) {
      return `${cityName}（${prefecture}）の令和7年度 国民健康保険料を詳しく計算できます。未就学児・介護保険対象者・給与年金所得者の人数も入力して、より正確な保険料を試算します。`;
    }
    const r = data.rate?.medical ?? 0;
    const p = data.perCapita?.medical ?? 0;
    return `${cityName}（${prefecture}）の令和7年度 国民健康保険料を詳しく計算できます。医療分の所得割率は${fmtRate(r)}、均等割額は${fmtYen(p)}です。未就学児・介護保険対象者・給与年金所得者の人数も入力して、より正確な保険料を試算します。`;
  }
  if (!data) {
    return `${cityName}（${prefecture}）の令和7年度 国民健康保険料を無料でシミュレーションできます。前年所得と世帯人数を入力するだけで年間保険料の目安を計算します。`;
  }
  const r = data.rate?.medical ?? 0;
  const p = data.perCapita?.medical ?? 0;
  return `${cityName}（${prefecture}）の令和7年度 国民健康保険料を無料でシミュレーションできます。医療分の所得割率は${fmtRate(r)}、均等割額は${fmtYen(p)}です。前年所得と世帯人数を入力するだけで年間保険料の目安を計算します。`;
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
  const introText   = buildIntroText(cityName, prefecture, data, isIncome);
  const trustBadge  = buildTrustBadge(data);
  const prefDesc    = buildPrefectureDesc(prefSlug, prefecture, cityName);

  return template
    .replaceAll("__CITY_SLUG__",       citySlug)
    .replaceAll("__CITY_NAME__",       cityName)
    .replaceAll("__META_DESC__",       metaDesc)
    .replaceAll("__CANONICAL_URL__",   canonical)
    .replaceAll("__JSON_LD__",         jsonLd)
    .replaceAll("__RATE_TABLE__",      rateTable)
    .replaceAll("__INTRO_TEXT__",      introText)
    .replaceAll("__TRUST_BADGE__",     trustBadge)
    .replaceAll("__PREFECTURE_DESC__", prefDesc);
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
