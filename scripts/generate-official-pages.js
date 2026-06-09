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
import { createHash } from "crypto";
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
const { calculateKokuho } = _require("../js/core/kokuho.js");
const { calcSalaryIncome, calcPensionIncome } = _require("../js/core/shared/income.js");

// 世帯モデル別の計算例（市ごとに数字が変わる固有コンテンツ＝SEO索引対策）。
// かんたん計算と同じ入力前提（所得＋世帯人数のみ・care/preschool等は0）で一致させる。
const CALC_EXAMPLE_MODELS = [
  { label: "単身（年収300万円）",          salary: 3_000_000, pension: 0,         age: 40, family: 1 },
  { label: "夫婦2人（年収500万円）",       salary: 5_000_000, pension: 0,         age: 40, family: 2 },
  { label: "夫婦＋子ども2人（年収600万円）", salary: 6_000_000, pension: 0,         age: 40, family: 4 },
  { label: "年金暮らしの夫婦（年金250万円・65歳）", salary: 0,   pension: 2_500_000, age: 65, family: 2 },
];

function buildCalcExamples(cityName, data, publishYear) {
  if (!data) return "";
  const rows = CALC_EXAMPLE_MODELS.map(m => {
    const income = calcSalaryIncome(m.salary) + calcPensionIncome(m.pension, m.age);
    const r = calculateKokuho(
      { income, family: m.family, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0 },
      data
    );
    return { label: m.label, total: r.total, monthly: r.monthly };
  });

  const thStyle = "padding:6px 10px;background:#f3f4f6;font-size:12px;font-weight:600;text-align:left;border:1px solid #e5e7eb;";
  const tdStyle = "padding:6px 10px;font-size:12px;border:1px solid #e5e7eb;";
  const tdR     = tdStyle + "text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;";

  const body = rows.map(r =>
    `<tr><td style="${tdStyle}">${r.label}</td>` +
    `<td style="${tdR}">約 ${fmtYen(r.total)}</td>` +
    `<td style="${tdR}">約 ${fmtYen(r.monthly)}</td></tr>`
  ).join("\n      ");

  return `
  <section style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
    <h2 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 6px;">${cityName}の国民健康保険料の計算例（${buildFiscalYearLabel(publishYear)}）</h2>
    <p style="font-size:12px;color:#6b7280;margin:0 0 12px;">${cityName}の料率で、代表的な世帯モデルの年間保険料の目安を試算しました（前年所得・世帯人数のみの概算）。</p>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr><th style="${thStyle}">世帯モデル</th><th style="${thStyle}">年間保険料（概算）</th><th style="${thStyle}">月額目安</th></tr></thead>
        <tbody>
      ${body}
        </tbody>
      </table>
    </div>
  </section>`;
}

// ─────────────────────────────────────────────────────────────────
// 計算例 enrichment ①: R7→R8 料率変化（市固有コンテンツ＝SEO索引対策）
// ─────────────────────────────────────────────────────────────────

// 近隣比較・前年比較で同じ JSON を何度も読むためのキャッシュ
const _cityDataCache = new Map();
function loadCityDataCached(citySlug, publishYear) {
  const key = `${citySlug}:${publishYear}`;
  if (!_cityDataCache.has(key)) _cityDataCache.set(key, loadCityData(citySlug, publishYear));
  return _cityDataCache.get(key);
}

// 比較用の代表モデル（既存の計算例と同じ前提）
const COMPARE_MODEL = { label: "夫婦2人（年収500万円・40代）", salary: 5_000_000, age: 40, family: 2 };

function calcModelTotal(data, model = COMPARE_MODEL) {
  const income = calcSalaryIncome(model.salary);
  const r = calculateKokuho(
    { income, family: model.family, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0 },
    data
  );
  return r.total;
}

function sumRate(data)      { const r = data?.rate ?? {};      return (r.medical || 0) + (r.support || 0) + (r.care || 0); }
function sumPerCapita(data) { const p = data?.perCapita ?? {}; return (p.medical || 0) + (p.support || 0) + (p.care || 0); }

// R7→R8 の料率変化セクション。publishYear=2026 のページで、2025 データがある場合のみ生成。
function buildRateChangeSection(cityName, citySlug, data, publishYear) {
  if (publishYear !== 2026 || !data) return "";
  const prev = loadCityDataCached(citySlug, 2025);
  if (!prev) return "";

  const isStandard = data.meta?.lifecycle?.r8Stage === "standard_r8" || data.meta?.source?.type === "prefecture_standard";

  const r7Rate = sumRate(prev), r8Rate = sumRate(data);
  const r7Pc   = sumPerCapita(prev), r8Pc = sumPerCapita(data);
  const r7Total = calcModelTotal(prev), r8Total = calcModelTotal(data);

  const trend = (a, b, up = "上昇", down = "引き下げ", flat = "据え置き") =>
    b > a ? up : b < a ? down : flat;

  // 索引対策の核となる固有プローズ（「9.6%→9.87%に上昇」型）
  const rateSentence = r8Rate === r7Rate
    ? `${cityName}の国保の所得割率（医療分＋支援金分＋介護分の合計）は、令和7年度から${fmtRate(r8Rate)}で据え置きです。`
    : `${cityName}の国保の所得割率（医療分＋支援金分＋介護分の合計）は、令和7年度の${fmtRate(r7Rate)}から令和8年度は${fmtRate(r8Rate)}に${trend(r7Rate, r8Rate)}しました。`;
  const diffYen = r8Total - r7Total;
  const totalSentence = diffYen === 0
    ? `${COMPARE_MODEL.label}のモデル世帯では、年間保険料の目安は約${fmtYen(r8Total)}で前年度と同水準です。`
    : `${COMPARE_MODEL.label}のモデル世帯では、年間保険料の目安は約${fmtYen(r7Total)}→約${fmtYen(r8Total)}（${diffYen > 0 ? "＋" : "−"}${fmtYen(Math.abs(diffYen))}）となります。`;

  const standardCaveat = isStandard
    ? `<p style="font-size:11px;color:#6b7280;margin:8px 0 0;">※令和8年度の値は県の標準保険料率（参考値）に基づく比較です。市が決定する実際の料率とは異なる場合があります。</p>`
    : "";

  const thStyle = "padding:6px 10px;background:#f3f4f6;font-size:12px;font-weight:600;text-align:left;border:1px solid #e5e7eb;white-space:nowrap;";
  const tdStyle = "padding:6px 10px;font-size:12px;border:1px solid #e5e7eb;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;";
  const tdL     = "padding:6px 10px;font-size:12px;border:1px solid #e5e7eb;font-weight:600;";

  const row = (label, a, b, fmt) =>
    `<tr><td style="${tdL}">${label}</td><td style="${tdStyle}">${fmt(a)}</td><td style="${tdStyle}">${fmt(b)}</td>` +
    `<td style="${tdStyle}">${b === a ? "→ 据え置き" : (b > a ? "↑ 上昇" : "↓ 低下")}</td></tr>`;

  return `
  <section style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
    <h2 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 6px;">${cityName}の国保料率の推移（令和7年度→令和8年度）</h2>
    <p style="font-size:12px;color:#4b5563;line-height:1.8;margin:0 0 12px;">${rateSentence}${totalSentence}</p>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr><th style="${thStyle}">項目</th><th style="${thStyle}">令和7年度</th><th style="${thStyle}">令和8年度</th><th style="${thStyle}">増減</th></tr></thead>
        <tbody>
      ${row("所得割率（合計）", r7Rate, r8Rate, fmtRate)}
      ${row("均等割額（合計・1人あたり）", r7Pc, r8Pc, fmtYen)}
      ${row(`モデル世帯の年間保険料（${COMPARE_MODEL.label}）`, r7Total, r8Total, n => "約 " + fmtYen(n))}
        </tbody>
      </table>
    </div>${standardCaveat}
  </section>`;
}

// ─────────────────────────────────────────────────────────────────
// 計算例 enrichment ②: 近隣自治体比較（市固有コンテンツ＝SEO索引対策）
// ─────────────────────────────────────────────────────────────────

// 同一都道府県内で cityCode が近い順に最大5自治体を選ぶ
function pickNeighbors(self, municipalities, count = 5) {
  const selfCode = parseInt(self.cityCode, 10);
  return municipalities
    .filter(m => m.prefecture === self.prefecture && m.citySlug !== self.citySlug && m.cityCode)
    .sort((a, b) => Math.abs(parseInt(a.cityCode, 10) - selfCode) - Math.abs(parseInt(b.cityCode, 10) - selfCode))
    .slice(0, count);
}

function buildNeighborCompareSection(self, data, publishYear, municipalities) {
  if (!data || !self.cityCode) return "";
  const neighbors = pickNeighbors(self, municipalities);
  if (neighbors.length === 0) return "";

  const selfTotal = calcModelTotal(data);
  const rows = [];
  for (const n of neighbors) {
    const ny = n.publishYear?.kokuho ?? 2025;
    const nd = loadCityDataCached(n.citySlug, ny);
    if (!nd) continue;
    rows.push({ name: n.cityName, year: ny, total: calcModelTotal(nd), diff: calcModelTotal(nd) - selfTotal });
  }
  if (rows.length < 2) return "";

  const thStyle = "padding:6px 10px;background:#f3f4f6;font-size:12px;font-weight:600;text-align:left;border:1px solid #e5e7eb;white-space:nowrap;";
  const tdStyle = "padding:6px 10px;font-size:12px;border:1px solid #e5e7eb;text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;";
  const tdL     = "padding:6px 10px;font-size:12px;border:1px solid #e5e7eb;";

  const selfRow =
    `<tr style="background:#eef2ff;"><td style="${tdL}font-weight:700;">${self.cityName}（このページ）</td>` +
    `<td style="${tdStyle}font-weight:700;">約 ${fmtYen(selfTotal)}</td><td style="${tdStyle}">—</td></tr>`;
  const body = rows.map(r =>
    `<tr><td style="${tdL}">${r.name}</td><td style="${tdStyle}">約 ${fmtYen(r.total)}</td>` +
    `<td style="${tdStyle}">${r.diff === 0 ? "同額" : (r.diff > 0 ? "＋" : "−") + fmtYen(Math.abs(r.diff))}</td></tr>`
  ).join("\n      ");

  const cheaper = rows.filter(r => r.diff > 0).length;
  const position =
    cheaper === rows.length ? `近隣${rows.length}自治体のいずれと比べても低い水準です` :
    cheaper === 0           ? `近隣${rows.length}自治体と比べると高めの水準です` :
                              `近隣${rows.length}自治体のうち${cheaper}自治体より低い水準です`;
  const prose = `${COMPARE_MODEL.label}のモデル世帯で比較すると、${self.cityName}の年間保険料の目安は約${fmtYen(selfTotal)}で、${position}。国民健康保険料は自治体ごとに料率が異なるため、同じ収入・世帯構成でも金額に差が出ます。`;

  return `
  <section style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
    <h2 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 6px;">${self.cityName}と近隣自治体の国保料比較</h2>
    <p style="font-size:12px;color:#4b5563;line-height:1.8;margin:0 0 12px;">${prose}</p>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead><tr><th style="${thStyle}">自治体</th><th style="${thStyle}">年間保険料（概算）</th><th style="${thStyle}">${self.cityName}との差</th></tr></thead>
        <tbody>
      ${selfRow}
      ${body}
        </tbody>
      </table>
    </div>
    <p style="font-size:11px;color:#6b7280;margin:8px 0 0;">※各自治体の公開年度の料率（令和7年度または令和8年度）に基づく概算です。減免・軽減の適用条件は自治体により異なります。</p>
  </section>`;
}

function fileHash(...filePaths) {
  const h = createHash("sha256");
  for (const p of filePaths) h.update(readFileSync(p));
  return h.digest("hex").slice(0, 8);
}
const CSS_V = fileHash(path.join(ROOT, "css", "common.css"));
const JS_V  = fileHash(
  path.join(ROOT, "js", "core", "kokuho.js"),
  path.join(ROOT, "js", "engine.js")
);

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

function buildFiscalYearLabel(publishYear) {
  const reiwa = publishYear - 2018;  // 2025→令和7, 2026→令和8
  return `令和${reiwa}年度`;
}

function fmtRate(r) {
  return (r * 100).toFixed(2).replace(/\.?0+$/, "") + "%";
}

function fmtYen(n) {
  return Number(n).toLocaleString("ja-JP") + "円";
}

function fmtMan(n) {
  return Math.round(n / 10000) + "万円";
}

function loadCityData(citySlug, publishYear = 2025) {
  const p = path.join(ROOT, "data", "municipalities", citySlug, `kokuho-${publishYear}.json`);
  if (existsSync(p)) {
    try { return JSON.parse(readFileSync(p, "utf-8")); } catch (e) { console.warn(`⚠️  JSON parse error: ${p}\n   ${e.message}`); }
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
function buildTrustBadge(data, publishYear) {
  const currentFY = getFiscalYear();
  const disclaimer = `<span class="result-note__text">実際の保険料は各自治体の窓口でご確認ください。</span>`;

  if (!data) {
    return `
  <p class="result-note">${disclaimer}<span class="result-note__badge result-note__badge--inferred">ⓘ 参考計算（公式データ未収録）</span></p>`;
  }

  // 県標準保険料率（参考値）= standard_r8: バッジは出さない。
  // 同じ内容を結果直下の青枠カード（buildStandardNote / __STANDARD_NOTE__）で丁寧に表示するため、
  // 小バッジ＋免責行は重複になるので省略する。
  if (data.meta?.lifecycle?.r8Stage === "standard_r8" || data.meta?.source?.type === "prefecture_standard") {
    return "";
  }

  if (publishYear >= currentFY) {
    return `
  <p class="result-note">${disclaimer}<span class="result-note__badge result-note__badge--verified">✓ ${fmtFY(publishYear)}公式データ確認済み</span></p>`;
  }

  return `
  <p class="result-note">${disclaimer}<span class="result-note__badge result-note__badge--old">⚠ ${fmtFY(publishYear)}データ使用中 / 令和8年度は順次更新中</span></p>`;
}

// 県標準保険料率（参考値 = standard_r8）採用ページにのみ表示する青枠の注意書き。
// 計算結果直下（バッジの近く）に置く。verified / R7 ページでは空文字。
function buildStandardNote(data, cityName, prefecture) {
  const isStandard = data?.meta?.lifecycle?.r8Stage === "standard_r8" || data?.meta?.source?.type === "prefecture_standard";
  if (!isStandard) return "";
  return `
  <div class="standard-note" style="margin-top:16px;padding:14px 16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1d4ed8;">【ご注意】令和8年度の料率について</p>
    <p style="margin:0;font-size:13px;line-height:1.8;color:#374151;">このページの令和8年度の保険料率は、${prefecture}が公表した<strong>標準保険料率（参考値）</strong>です。${cityName}が実際に決定・告示する保険料率とは異なる場合があります。標準保険料率は、各市町村の法定外繰入等を行わない前提で県が算定した理論上の値です。確定した料率は${cityName}の公式案内をご確認ください。</p>
  </div>`;
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

function buildMetaDesc(cityName, prefecture, data, isIncome, publishYear) {
  const fy = buildFiscalYearLabel(publishYear);
  if (!data) {
    return isIncome
      ? `${cityName}（${prefecture}）の${fy} 国民健康保険料を詳しく計算。未就学児・介護保険・給与年金も考慮した精密シミュレーション。`
      : `${cityName}（${prefecture}）の${fy} 国民健康保険料を無料で計算。世帯人数と所得を入力するだけで年間保険料の目安がわかります。`;
  }
  const r = data.rate?.medical ?? 0;
  const p = data.perCapita?.medical ?? 0;
  if (isIncome) {
    return `${cityName}（${prefecture}）の${fy} 国保料を詳しく計算。医療分所得割${fmtRate(r)}・均等割${fmtYen(p)}。未就学児・介護保険・給与年金も考慮した精密シミュレーション。`;
  }
  return `${cityName}（${prefecture}）の${fy} 国民健康保険料を無料で計算。医療分所得割${fmtRate(r)}・均等割${fmtYen(p)}。所得と世帯人数を入力するだけで年間保険料の目安がわかります。`;
}

function buildCanonicalUrl(prefSlug, citySlug, isIncome) {
  const base = `${BASE_URL}/${prefSlug}/${citySlug}/`;
  return isIncome ? `${base}income.html` : base;
}

function buildSelfUrl(prefSlug, citySlug, isIncome) {
  const base = `${BASE_URL}/${prefSlug}/${citySlug}/`;
  return isIncome ? `${base}income.html` : base;
}

function buildJsonLd(cityName, prefecture, prefSlug, citySlug, desc, isIncome, publishYear) {
  const pageUrl = buildSelfUrl(prefSlug, citySlug, isIncome);
  const fy = buildFiscalYearLabel(publishYear);
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
    "name": `${cityName} 国民健康保険料計算ツール（${fy}）`,
    "description": desc,
    "url": pageUrl,
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "inLanguage": "ja",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
  };
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [breadcrumb, app] });
}

function buildIntroText(cityName, prefecture, data, isIncome, publishYear) {
  const fy = buildFiscalYearLabel(publishYear);
  if (isIncome) {
    if (!data) {
      return `${cityName}（${prefecture}）の${fy} 国民健康保険料を詳しく計算できます。未就学児・介護保険対象者・給与年金所得者の人数も入力して、より正確な保険料を試算します。`;
    }
    const r = data.rate?.medical ?? 0;
    const p = data.perCapita?.medical ?? 0;
    return `${cityName}（${prefecture}）の${fy} 国民健康保険料を詳しく計算できます。医療分の所得割率は${fmtRate(r)}、均等割額は${fmtYen(p)}です。未就学児・介護保険対象者・給与年金所得者の人数も入力して、より正確な保険料を試算します。`;
  }
  if (!data) {
    return `${cityName}（${prefecture}）の${fy} 国民健康保険料を無料でシミュレーションできます。前年所得と世帯人数を入力するだけで年間保険料の目安を計算します。`;
  }
  const r = data.rate?.medical ?? 0;
  const p = data.perCapita?.medical ?? 0;
  return `${cityName}（${prefecture}）の${fy} 国民健康保険料を無料でシミュレーションできます。医療分の所得割率は${fmtRate(r)}、均等割額は${fmtYen(p)}です。前年所得と世帯人数を入力するだけで年間保険料の目安を計算します。`;
}

function buildRateTable(cityName, data, publishYear) {
  if (!data) return "";

  const rate = data.rate       ?? {};
  const pc   = data.perCapita  ?? {};
  const hh   = data.household  ?? {};
  const caps = data.caps       ?? {};
  const asset = data.assetLevy ?? null;

  const childcare   = data.childcareLevy ?? null;
  const hasHousehold = (hh.medical || 0) + (hh.support || 0) + (hh.care || 0) + (childcare?.household || 0) > 0;
  const hasAsset     = asset && ((asset.medical || 0) + (asset.support || 0) + (asset.care || 0) + (asset.childcare || 0)) > 0;

  // 子ども・子育て支援金分の均等割表示（18歳未満と18歳以上で異なる場合）
  const childcarePcLabel = childcare
    ? (childcare.perCapitaAdult !== undefined
        ? (childcare.perCapitaAdultScope === 'adults_only'
            ? `${fmtYen(childcare.perCapita)}（18歳未満・全額減額）/ 18歳以上 ${fmtYen(childcare.perCapitaAdult)}`
            : `${fmtYen(childcare.perCapita)}（18歳以上 +${fmtYen(childcare.perCapitaAdult)}）`)
        : fmtYen(childcare.perCapita))
    : null;

  const rows = [
    { label: "医療分",          r: rate.medical,  p: pc.medical,  h: hh.medical,  c: caps.medical,  a: asset?.medical },
    { label: "後期高齢者支援金分", r: rate.support, p: pc.support,  h: hh.support,  c: caps.support,  a: asset?.support },
    { label: "介護分（40〜64歳）", r: rate.care,   p: pc.care,     h: hh.care,     c: caps.care,     a: asset?.care },
    ...(childcare ? [{ label: "子ども・子育て支援金分", r: childcare.rate, pLabel: childcarePcLabel, h: childcare.household, c: childcare.cap ?? 30000, a: asset?.childcare }] : []),
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
    cells += `<td style="${tdStyle}">${row.pLabel ?? (row.p != null ? fmtYen(row.p) : "—")}</td>`;
    if (hasHousehold) cells += `<td style="${tdStyle}">${row.h != null ? fmtYen(row.h) : "—"}</td>`;
    if (hasAsset)     cells += `<td style="${tdStyle}">${row.a != null ? fmtRate(row.a) : "—"}</td>`;
    cells += `<td style="${tdStyle}">${row.c != null ? fmtMan(row.c) : "—"}</td>`;
    return `<tr>${cells}</tr>`;
  }).join("\n      ");

  return `
  <section style="margin-top:28px;padding:16px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;">
    <h2 style="font-size:14px;font-weight:700;color:#374151;margin:0 0 12px;">${buildFiscalYearLabel(publishYear)} ${cityName}の国民健康保険料率</h2>
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

function render(template, { citySlug, cityName, prefecture, prefSlug, data, isIncome, publishYear, regEntry, municipalities }) {
  const metaDesc       = buildMetaDesc(cityName, prefecture, data, isIncome, publishYear);
  const canonical      = buildCanonicalUrl(prefSlug, citySlug, isIncome);
  const jsonLd         = buildJsonLd(cityName, prefecture, prefSlug, citySlug, metaDesc, isIncome, publishYear);
  const rateTable      = buildRateTable(cityName, data, publishYear);
  const calcExamples   = isIncome ? "" : (
    buildCalcExamples(cityName, data, publishYear) +
    buildRateChangeSection(cityName, citySlug, data, publishYear) +
    (regEntry && municipalities ? buildNeighborCompareSection(regEntry, data, publishYear, municipalities) : "")
  );
  const introText      = buildIntroText(cityName, prefecture, data, isIncome, publishYear);
  const trustBadge     = buildTrustBadge(data, publishYear);
  const standardNote   = buildStandardNote(data, cityName, prefecture);
  const prefDesc       = buildPrefectureDesc(prefSlug, prefecture, cityName);
  const fiscalYearLabel = buildFiscalYearLabel(publishYear);

  return template
    .replaceAll("__CITY_SLUG__",          citySlug)
    .replaceAll("__CITY_NAME__",          cityName)
    .replaceAll("__META_DESC__",          metaDesc)
    .replaceAll("__CANONICAL_URL__",      canonical)
    .replaceAll("__JSON_LD__",            jsonLd)
    .replaceAll("__RATE_TABLE__",         rateTable)
    .replaceAll("__CALC_EXAMPLES__",      calcExamples)
    .replaceAll("__INTRO_TEXT__",         introText)
    .replaceAll("__TRUST_BADGE__",        trustBadge)
    .replaceAll("__STANDARD_NOTE__",      standardNote)
    .replaceAll("__PREFECTURE_DESC__",    prefDesc)
    .replaceAll("__FISCAL_YEAR_LABEL__",  fiscalYearLabel)
    .replaceAll("__PUBLISH_YEAR__",       String(publishYear))
    .replaceAll("__CSS_V__",              CSS_V)
    .replaceAll("__JS_V__",              JS_V);
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

// 実行時間に制約がある環境向けの分割実行（例: GEN_SLICE=0:400 → 先頭400件のみ）
let runTargets = targets;
if (process.env.GEN_SLICE) {
  const [s, c] = process.env.GEN_SLICE.split(":").map(Number);
  runTargets = targets.slice(s, s + c);
  console.log(`▶ GEN_SLICE=${process.env.GEN_SLICE}: ${runTargets.length}件を処理`);
}

let generated = 0;
const skipped = [];

for (const m of runTargets) {
  const prefSlug = m.prefectureSlug ?? PREF_SLUG[m.prefecture];
  if (!prefSlug) {
    skipped.push(`${m.cityName}: 都道府県スラグ未定義 (${m.prefecture})`);
    continue;
  }

  const publishYear = m.publishYear?.kokuho ?? 2025;
  const data = loadCityDataCached(m.citySlug, publishYear);
  const ctx  = { citySlug: m.citySlug, cityName: m.cityName, prefecture: m.prefecture, prefSlug, data, publishYear, regEntry: m, municipalities: registry.municipalities };

  const dir = path.join(ROOT, prefSlug, m.citySlug);
  mkdirSync(dir, { recursive: true });

  writeFileSync(path.join(dir, "index.html"),  render(tmplSimple, { ...ctx, isIncome: false }), "utf-8");
  writeFileSync(path.join(dir, "income.html"), render(tmplIncome, { ...ctx, isIncome: true  }), "utf-8");

  generated++;
}

// テンプレートハッシュをスタンプファイルに書き出す（deploy.sh の変更検知に使用）
const tmplHash = fileHash(
  path.join(TMPL_DIR, "kokuho-simple.html"),
  path.join(TMPL_DIR, "kokuho-income.html"),
  path.join(TMPL_DIR, "prefecture-page.html")
);
writeFileSync(path.join(ROOT, ".build-stamp"), tmplHash, "utf-8");

console.log(`\n✅ ${generated}自治体の正式版ページを生成しました`);
console.log(`   出力先: {都道府県スラグ}/{自治体スラグ}/index.html & income.html`);

if (skipped.length > 0) {
  console.warn(`\n⚠️  スキップ:`);
  skipped.forEach(s => console.warn("  ", s));
}

console.log();
