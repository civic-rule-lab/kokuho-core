/**
 * 制度別 個別ページ生成（後期高齢者医療 / 介護保険・第1号）
 *
 * registry/index.json に system が登録され、かつ自治体データが揃う自治体について、
 * テンプレートを {prefSlug}/{citySlug}/{system}/index.html に生成する。
 * （国保・住民税の generate-official-pages.js と同じ作法。URLはサブフォルダ規約 /{pref}/{slug}/{system}/）
 *
 * 実行:
 *   node scripts/generate-system-pages.js kouki                # 後期 全自治体
 *   node scripts/generate-system-pages.js kaigo                # 介護 全自治体（verified/inferredのみ）
 *   node scripts/generate-system-pages.js kouki shinjuku       # 特定自治体
 *   node scripts/generate-system-pages.js kouki --dry-run      # 書き出しせず件数のみ
 *   GEN_SLICE=0:400 node scripts/generate-system-pages.js kouki  # 分割実行
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, "..");
const TMPL_DIR  = path.join(ROOT, "templates");
const REGISTRY  = path.join(ROOT, "registry", "index.json");
const BASE_URL  = "https://seido-keisan.jp";   // アンブレラ（制度計算.jp）
const YEAR      = 2026;

const SYSTEM = process.argv[2];
const ARGS   = process.argv.slice(3);
const DRY    = ARGS.includes("--dry-run");
const TARGET_SLUG = ARGS.find(a => !a.startsWith("--")) || null;

// 制度ごとの設定
const CONFIG = {
  kouki: {
    template: "kouki-simple.html",
    incomeTemplate: "kouki-income.html",           // 詳しく計算版（世帯対応）
    dataPlaceholder: "__KOUKI_DATA__",
    engineFiles: ["js/core/shared/income.js", "js/core/kouki.js"],
    portalName: "制度計算ポータル",
    appName: (city, fy) => `${city} 後期高齢者医療保険料計算ツール（${fy}）`,
    meta: (city, pref, fy, d) =>
      `${city}（${pref}）の${fy}後期高齢者医療保険料を無料で計算。医療分の均等割${fmtYen(d.perCapita.medical)}・所得割${fmtRate(d.rate.medical)}。年金や給与の収入から年間保険料の目安がわかります。`,
    intro: (city, fy, d) =>
      `${city}の${fy}の後期高齢者医療保険料を、公的年金や給与の収入から概算できます。医療分の均等割（加入者全員の定額）は${fmtYen(d.perCapita.medical)}、所得割（所得に応じた率）は${fmtRate(d.rate.medical)}です。`,
    metaIncome: (city, pref, fy, d) =>
      `${city}（${pref}）の${fy}後期高齢者医療保険料を世帯の被保険者ごとに詳しく計算。複数の被保険者・被扶養者軽減・世帯合算の軽減判定に対応した精密シミュレーション。`,
    introIncome: (city, fy, d) =>
      `${city}の${fy}の後期高齢者医療保険料を、世帯の被保険者ごとに詳しく計算できます。複数人の収入を入れると、世帯の所得を合算した軽減判定（7.2割・5割・2割）まで反映します。`,
    eligible: (m, d) => !!d,                       // 後期は全自治体（県均一）
  },
  kaigo: {
    template: "kaigo-simple.html",
    dataPlaceholder: "__KAIGO_DATA__",
    engineFiles: ["js/core/shared/income.js", "js/core/kaigo.js"],
    portalName: "制度計算ポータル",
    appName: (city, fy) => `${city} 介護保険料（第1号）計算ツール（${fy}）`,
    meta: (city, pref, fy, d) =>
      `${city}（${pref}）の${fy}介護保険料（第1号・65歳以上）を無料で計算。基準額${fmtYen(d.baseAmount)}。所得と住民税の課税状況から段階別の保険料がわかります。`,
    intro: (city, fy, d) =>
      `${city}の65歳以上（介護保険・第1号被保険者）の保険料を概算できます。基準額（第5段階）は${fmtYen(d.baseAmount)}で、所得と住民税の課税状況に応じた段階の倍率で決まります。`,
    eligible: (m, d) => !!d && (d.status === "verified" || d.status === "inferred"),  // 検証済みのみ点灯
  },
};

if (!SYSTEM || !CONFIG[SYSTEM]) {
  console.error("使い方: node scripts/generate-system-pages.js <kouki|kaigo> [citySlug] [--dry-run]");
  process.exit(1);
}
const cfg = CONFIG[SYSTEM];

// ── ヘルパー ──
function fmtFY(fy) { return `令和${fy - 2018}年度（${fy}年度）`; }
function fmtRate(r) { return (r * 100).toFixed(2).replace(/\.?0+$/, "") + "%"; }
function fmtYen(n) { return Number(n || 0).toLocaleString("ja-JP") + "円"; }
function fileHash(...files) {
  const h = createHash("sha256");
  for (const f of files) h.update(readFileSync(path.join(ROOT, f)));
  return h.digest("hex").slice(0, 8);
}
function loadData(slug) {
  const p = path.join(ROOT, "data", "municipalities", slug, `${SYSTEM}-${YEAR}.json`);
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, "utf-8")); } catch (e) { console.warn(`⚠️ JSON parse: ${p} ${e.message}`); return null; }
}

const CSS_V = fileHash("css/common.css");
const JS_V  = fileHash(...cfg.engineFiles);
const template = readFileSync(path.join(TMPL_DIR, cfg.template), "utf-8");
const incomeTemplate = cfg.incomeTemplate ? readFileSync(path.join(TMPL_DIR, cfg.incomeTemplate), "utf-8") : null;
const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));

function buildJsonLd(city, pref, prefSlug, citySlug, desc, fy) {
  const pageUrl = `${BASE_URL}/${prefSlug}/${citySlug}/${SYSTEM}/`;
  const breadcrumb = { "@type": "BreadcrumbList", "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": cfg.portalName, "item": BASE_URL + "/" },
    { "@type": "ListItem", "position": 2, "name": pref, "item": `${BASE_URL}/#${prefSlug}` },
    { "@type": "ListItem", "position": 3, "name": city, "item": `${BASE_URL}/${prefSlug}/${citySlug}/` },
  ]};
  const app = { "@type": "WebApplication", "name": cfg.appName(city, fy), "description": desc,
    "url": pageUrl, "applicationCategory": "FinanceApplication", "operatingSystem": "Web",
    "inLanguage": "ja", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" } };
  return JSON.stringify({ "@context": "https://schema.org", "@graph": [breadcrumb, app] });
}

function render(m, prefSlug, data, { isIncome = false, tmpl = template } = {}) {
  const fy = fmtFY(YEAR);
  const meta = (isIncome && cfg.metaIncome ? cfg.metaIncome : cfg.meta)(m.cityName, m.prefecture, fy, data);
  const intro = (isIncome && cfg.introIncome ? cfg.introIncome : cfg.intro)(m.cityName, fy, data);
  const canonical = `${BASE_URL}/${prefSlug}/${m.citySlug}/${SYSTEM}/${isIncome ? "income.html" : ""}`;
  let out = tmpl
    .replaceAll("__CITY_SLUG__",         m.citySlug)
    .replaceAll("__CITY_NAME__",         m.cityName)
    .replaceAll("__META_DESC__",         meta)
    .replaceAll("__CANONICAL_URL__",     canonical)
    .replaceAll("__JSON_LD__",           buildJsonLd(m.cityName, m.prefecture, prefSlug, m.citySlug, meta, fy))
    .replaceAll("__INTRO_TEXT__",        intro)
    .replaceAll("__FISCAL_YEAR_LABEL__", fy)
    .replaceAll("__PUBLISH_YEAR__",      String(YEAR))
    .replaceAll("__PORTAL_LINK__",       "../kakeibo/")
    .replaceAll("__PLAN_PERIOD__",       data.planPeriod || "")
    .replaceAll("__CSS_V__",             CSS_V)
    .replaceAll("__JS_V__",              JS_V)
    .replaceAll(cfg.dataPlaceholder,     JSON.stringify(data));
  return out;
}

const targets = TARGET_SLUG
  ? registry.municipalities.filter(m => m.citySlug === TARGET_SLUG)
  : registry.municipalities.filter(m => (m.systems || []).includes(SYSTEM));

let runTargets = targets;
if (process.env.GEN_SLICE) {
  const [s, c] = process.env.GEN_SLICE.split(":").map(Number);
  runTargets = targets.slice(s, s + c);
  console.log(`▶ GEN_SLICE=${process.env.GEN_SLICE}: ${runTargets.length}件`);
}

let generated = 0, skippedNoData = 0, skippedNoPref = 0;
for (const m of runTargets) {
  const prefSlug = m.prefectureSlug;
  if (!prefSlug) { skippedNoPref++; continue; }
  const data = loadData(m.citySlug);
  if (!cfg.eligible(m, data)) { skippedNoData++; continue; }
  if (DRY) { generated++; continue; }
  const dir = path.join(ROOT, prefSlug, m.citySlug, SYSTEM);
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "index.html"), render(m, prefSlug, data, { isIncome: false, tmpl: template }), "utf-8");
  if (incomeTemplate) writeFileSync(path.join(dir, "income.html"), render(m, prefSlug, data, { isIncome: true, tmpl: incomeTemplate }), "utf-8");
  generated++;
}

console.log(`\n✅ ${SYSTEM}: ${generated}自治体のページを${DRY ? "生成予定（dry-run）" : "生成"}`);
console.log(`   出力先: {prefSlug}/{citySlug}/${SYSTEM}/index.html`);
if (skippedNoData) console.log(`   スキップ（データ未整備/未検証）: ${skippedNoData}`);
if (skippedNoPref) console.log(`   スキップ（prefSlug未定義）: ${skippedNoPref}`);
