/**
 * 大阪府 国保データ一括生成スクリプト
 *
 * data/municipalities/{slug}/kokuho-2025.json を自治体ごとに生成する。
 * - 既にファイルが存在する場合はスキップ（上書きしない）
 *
 * 実行:          node scripts/generate-osaka-kokuho.js
 * 強制上書き:    node scripts/generate-osaka-kokuho.js --force
 *
 * ▼ 大阪府の構造的特徴
 *   - 令和6年度から府内全43自治体が**統一保険料率**を導入
 *   - 全自治体同一料率：医療9.30% / 支援3.02% / 介護2.56%
 *   - 医療分・支援分: 3方式（所得割+均等割+平等割）
 *   - 介護分: 2方式（所得割+均等割のみ、平等割なし）
 *   - 資産割: 全自治体なし
 *   - 賦課限度額: 独自（医療65万・支援24万・介護17万）
 *
 * ▼ スラグ競合（既存スラグとの重複回避）
 *   池田市 → ikedashi (長野県池田町が ikeda を使用)
 *
 * ▼ データ出典
 *   大阪府「令和7年度大阪府市町村標準保険料率等の算定結果について」
 *   https://www.pref.osaka.lg.jp/o100080/kokuho/iryouseido/hokenryouritsu/hokenryouritsu.html
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_BASE  = path.join(__dirname, "../data/municipalities");
const FORCE     = process.argv.includes("--force");

// ─────────────────────────────────────────────────────────────────
// 共通軽減基準（2025年度・全国共通）
// ─────────────────────────────────────────────────────────────────
const COMMON_REDUCTION = {
  enabled: true,
  standards: {
    sevenTenths: { base: 430000, perPersonAdd: 0 },
    fiveTenths:  { base: 430000, perPersonAdd: 305000 },
    twoTenths:   { base: 430000, perPersonAdd: 560000 },
  },
  salaryPensionAdd: 100000,
  ratios: { sevenTenths: 0.7, fiveTenths: 0.5, twoTenths: 0.2 },
};

const COMMON_PRESCHOOL = {
  enabled: true,
  medicalPerCapitaRate: 0.5,
  supportPerCapitaRate: 0.5,
};

// 大阪府統一賦課限度額（独自: 医療65万・支援24万・介護17万）
const CAPS = { medical: 650000, support: 240000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 大阪府統一料率（令和7年度）
// 全43自治体が同一料率を適用
// ─────────────────────────────────────────────────────────────────
const UNIFIED_RATES = {
  rate:      { medical: 0.0930, support: 0.0302, care: 0.0256 },
  perCapita: { medical: 34424,  support: 11034,  care: 18784  },
  household: { medical: 33574,  support: 10761,  care: 0      },
};

// ─────────────────────────────────────────────────────────────────
// 大阪府 全自治体リスト（令和7年度 = 2025年度）
//
// データ出典: 大阪府「令和7年度大阪府市町村標準保険料率等の算定結果」
// ─────────────────────────────────────────────────────────────────
const MUNICIPALITIES = [

  // ── 政令市 ────────────────────────────────────────────────────
  { cityCode: "27100", citySlug: "osaka",         cityName: "大阪市" },
  { cityCode: "27140", citySlug: "sakai",          cityName: "堺市" },

  // ── 市 ───────────────────────────────────────────────────────
  { cityCode: "27202", citySlug: "kishiwada",      cityName: "岸和田市" },
  { cityCode: "27203", citySlug: "toyonaka",       cityName: "豊中市" },
  // slug競合: 長野県池田町(ikeda)と重複 → ikedashi
  { cityCode: "27204", citySlug: "ikedashi",       cityName: "池田市" },
  { cityCode: "27205", citySlug: "suita",          cityName: "吹田市" },
  { cityCode: "27206", citySlug: "izumiotsu",      cityName: "泉大津市" },
  { cityCode: "27207", citySlug: "takatsuki",      cityName: "高槻市" },
  { cityCode: "27208", citySlug: "kaizuka",        cityName: "貝塚市" },
  { cityCode: "27209", citySlug: "moriguchi",      cityName: "守口市" },
  { cityCode: "27210", citySlug: "hirakata",       cityName: "枚方市" },
  { cityCode: "27211", citySlug: "ibaraki",        cityName: "茨木市" },
  { cityCode: "27212", citySlug: "yao",            cityName: "八尾市" },
  { cityCode: "27213", citySlug: "izumisano",      cityName: "泉佐野市" },
  { cityCode: "27214", citySlug: "tondabayashi",   cityName: "富田林市" },
  { cityCode: "27215", citySlug: "neyagawa",       cityName: "寝屋川市" },
  { cityCode: "27216", citySlug: "kawachinagano",  cityName: "河内長野市" },
  { cityCode: "27217", citySlug: "matsubara",      cityName: "松原市" },
  { cityCode: "27218", citySlug: "daito",          cityName: "大東市" },
  { cityCode: "27219", citySlug: "izumi",          cityName: "和泉市" },
  { cityCode: "27220", citySlug: "minoh",          cityName: "箕面市" },
  { cityCode: "27221", citySlug: "kashiwara",      cityName: "柏原市" },
  { cityCode: "27222", citySlug: "habikino",       cityName: "羽曳野市" },
  { cityCode: "27223", citySlug: "kadoma",         cityName: "門真市" },
  { cityCode: "27224", citySlug: "settsu",         cityName: "摂津市" },
  { cityCode: "27225", citySlug: "takaishi",       cityName: "高石市" },
  { cityCode: "27226", citySlug: "fujiidera",      cityName: "藤井寺市" },
  { cityCode: "27227", citySlug: "higashiosaka",   cityName: "東大阪市" },
  { cityCode: "27228", citySlug: "sennan",         cityName: "泉南市" },
  { cityCode: "27229", citySlug: "shijonawate",    cityName: "四條畷市" },
  { cityCode: "27230", citySlug: "katano",         cityName: "交野市" },
  { cityCode: "27231", citySlug: "osakasayama",    cityName: "大阪狭山市" },
  { cityCode: "27232", citySlug: "hannan",         cityName: "阪南市" },

  // ── 町村 ─────────────────────────────────────────────────────
  { cityCode: "27301", citySlug: "shimamoto",      cityName: "島本町" },
  { cityCode: "27321", citySlug: "toyono",         cityName: "豊能町" },
  { cityCode: "27322", citySlug: "nose",           cityName: "能勢町" },
  { cityCode: "27341", citySlug: "tadaoka",        cityName: "忠岡町" },
  { cityCode: "27361", citySlug: "kumatori",       cityName: "熊取町" },
  { cityCode: "27362", citySlug: "tajiri",         cityName: "田尻町" },
  { cityCode: "27366", citySlug: "misaki",         cityName: "岬町" },
  { cityCode: "27381", citySlug: "taishi",         cityName: "太子町" },
  { cityCode: "27382", citySlug: "kanan",          cityName: "河南町" },
  { cityCode: "27383", citySlug: "chihayaakasaka", cityName: "千早赤阪村" },
];

// ─────────────────────────────────────────────────────────────────
// JSON生成
// ─────────────────────────────────────────────────────────────────
function buildJson(m) {
  return {
    cityCode:           m.cityCode,
    citySlug:           m.citySlug,
    cityName:           m.cityName,
    fiscalYear:         2025,
    system:             "kokuho",
    note:               "大阪府統一保険料率（令和6年度より府内全市町村統一）",
    basicDeduction:     430000,
    rate:               UNIFIED_RATES.rate,
    perCapita:          UNIFIED_RATES.perCapita,
    household:          UNIFIED_RATES.household,
    caps:               CAPS,
    preschoolReduction: COMMON_PRESCHOOL,
    reduction:          COMMON_REDUCTION,
  };
}

// ─────────────────────────────────────────────────────────────────
// 実行
// ─────────────────────────────────────────────────────────────────
let created = 0, skipped = 0;

console.log(`\n${"=".repeat(60)}`);
console.log(`大阪府 国保データ一括生成 (令和7年度 / 2025年度)`);
console.log(`府内全市町村統一料率: 医療9.30% / 支援3.02% / 介護2.56%`);
console.log(`${"=".repeat(60)}\n`);

for (const m of MUNICIPALITIES) {
  const dir  = path.join(OUT_BASE, m.citySlug);
  const file = path.join(dir, "kokuho-2025.json");

  if (existsSync(file) && !FORCE) {
    console.log(`⏭  スキップ  ${m.cityName}`);
    skipped++;
    continue;
  }

  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(buildJson(m), null, 2) + "\n", "utf-8");
  console.log(`✅ 生成完了  ${m.cityName}`);
  created++;
}

console.log(`\n${"─".repeat(60)}`);
console.log(`生成: ${created} 件 / スキップ: ${skipped} 件`);
console.log(`合計: ${MUNICIPALITIES.length} 自治体（府内統一料率）`);
console.log();
