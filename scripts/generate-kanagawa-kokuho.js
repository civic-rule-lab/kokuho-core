/**
 * 神奈川県 国保データ一括生成スクリプト
 *
 * data/municipalities/{slug}/kokuho-2025.json を自治体ごとに生成する。
 * - 既にファイルが存在する場合はスキップ（上書きしない）
 * - レートが未確認の自治体は TODO マーカー付きで生成
 *
 * 実行: node scripts/generate-kanagawa-kokuho.js
 *
 * データ更新方法:
 *   MUNICIPALITIES 配列の rates フィールドに各自治体公式値を入力する。
 *   rates が null の自治体はスケルトンファイル（TODO付き）を生成。
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_BASE = path.join(__dirname, "../data/municipalities");

// ─────────────────────────────────────────────────────────────────
// 共通軽減基準（2025年度・全国共通）
// ─────────────────────────────────────────────────────────────────
const COMMON_REDUCTION = {
  enabled: true,
  standards: {
    sevenTenths:  { base: 430000, perPersonAdd: 0 },
    fiveTenths:   { base: 430000, perPersonAdd: 305000 },
    twoTenths:    { base: 430000, perPersonAdd: 560000 },
  },
  salaryPensionAdd: 100000,
  ratios: {
    sevenTenths: 0.7,
    fiveTenths:  0.5,
    twoTenths:   0.2,
  },
};

const COMMON_PRESCHOOL = {
  enabled: true,
  medicalPerCapitaRate: 0.5,
  supportPerCapitaRate: 0.5,
};

// ─────────────────────────────────────────────────────────────────
// 神奈川県 全自治体リスト（2025年度）
//
// rates: null → 未調査（スケルトン生成）
// rates: {...} → 実調査済みデータ（そのまま生成）
//
// データソース: 各自治体公式サイト・令和7年度国民健康保険料率
// ─────────────────────────────────────────────────────────────────
const MUNICIPALITIES = [
  // ── 政令市 ────────────────────────────────────────────────────
  {
    cityCode: "14100",
    citySlug: "yokohama",
    cityName: "横浜市",
    // 横浜市は区ごとに異なる仕組みあり・要確認
    rates: null,
  },
  {
    cityCode: "14130",
    citySlug: "kawasaki",
    cityName: "川崎市",
    rates: null,
  },
  {
    cityCode: "14150",
    citySlug: "sagamihara",
    cityName: "相模原市",
    rates: null,
  },

  // ── 市 ───────────────────────────────────────────────────────
  {
    cityCode: "14201",
    citySlug: "yokosuka",
    cityName: "横須賀市",
    rates: null,
  },
  {
    cityCode: "14203",
    citySlug: "hiratsuka",
    cityName: "平塚市",
    rates: null,
  },
  {
    cityCode: "14204",
    citySlug: "kamakura",
    cityName: "鎌倉市",
    rates: null,
  },
  {
    cityCode: "14205",
    citySlug: "fujisawa",
    cityName: "藤沢市",
    // 出典: 藤沢市 令和7年度国民健康保険料率
    rates: {
      rate:       { medical: 0.0694, support: 0.0297, care: 0.0255 },
      perCapita:  { medical: 28560,  support: 11880,  care: 12480  },
      household:  { medical: 18480,  support: 7680,   care: 6000   },
      caps:       { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14206",
    citySlug: "odawara",
    cityName: "小田原市",
    rates: null,
  },
  {
    cityCode: "14207",
    citySlug: "chigasaki",
    cityName: "茅ヶ崎市",
    // 出典: 茅ヶ崎市 令和7年度国民健康保険料率
    rates: {
      rate:       { medical: 0.0666, support: 0.0277, care: 0.0262 },
      perCapita:  { medical: 22432,  support: 9231,   care: 9485   },
      household:  { medical: 27755,  support: 11421,  care: 8789   },
      caps:       { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14208",
    citySlug: "zushi",
    cityName: "逗子市",
    rates: null,
  },
  {
    cityCode: "14210",
    citySlug: "miura",
    cityName: "三浦市",
    rates: null,
  },
  {
    cityCode: "14211",
    citySlug: "hadano",
    cityName: "秦野市",
    rates: null,
  },
  {
    cityCode: "14212",
    citySlug: "atsugi",
    cityName: "厚木市",
    rates: null,
  },
  {
    cityCode: "14213",
    citySlug: "yamato",
    cityName: "大和市",
    rates: null,
  },
  {
    cityCode: "14214",
    citySlug: "isehara",
    cityName: "伊勢原市",
    rates: null,
  },
  {
    cityCode: "14215",
    citySlug: "ebina",
    cityName: "海老名市",
    rates: null,
  },
  {
    cityCode: "14216",
    citySlug: "zama",
    cityName: "座間市",
    rates: null,
  },
  {
    cityCode: "14217",
    citySlug: "minamiashigara",
    cityName: "南足柄市",
    rates: null,
  },
  {
    cityCode: "14218",
    citySlug: "ayase",
    cityName: "綾瀬市",
    rates: null,
  },

  // ── 町村 ─────────────────────────────────────────────────────
  {
    cityCode: "14301",
    citySlug: "hayama",
    cityName: "葉山町",
    rates: null,
  },
  {
    cityCode: "14321",
    citySlug: "samukawa",
    cityName: "寒川町",
    rates: null,
  },
  {
    cityCode: "14341",
    citySlug: "oiso",
    cityName: "大磯町",
    rates: null,
  },
  {
    cityCode: "14342",
    citySlug: "ninomiya",
    cityName: "二宮町",
    rates: null,
  },
  {
    cityCode: "14361",
    citySlug: "nakai",
    cityName: "中井町",
    rates: null,
  },
  {
    cityCode: "14362",
    citySlug: "oi",
    cityName: "大井町",
    rates: null,
  },
  {
    cityCode: "14363",
    citySlug: "matsuda",
    cityName: "松田町",
    rates: null,
  },
  {
    cityCode: "14364",
    citySlug: "yamakita",
    cityName: "山北町",
    rates: null,
  },
  {
    cityCode: "14366",
    citySlug: "kaisei",
    cityName: "開成町",
    rates: null,
  },
  {
    cityCode: "14382",
    citySlug: "hakone",
    cityName: "箱根町",
    rates: null,
  },
  {
    cityCode: "14383",
    citySlug: "manazuru",
    cityName: "真鶴町",
    rates: null,
  },
  {
    cityCode: "14384",
    citySlug: "yugawara",
    cityName: "湯河原町",
    rates: null,
  },
  {
    cityCode: "14401",
    citySlug: "aikawa",
    cityName: "愛川町",
    rates: null,
  },
  {
    cityCode: "14402",
    citySlug: "kiyokawa",
    cityName: "清川村",
    rates: null,
  },
];

// ─────────────────────────────────────────────────────────────────
// TODO プレースホルダー値（要調査）
// ─────────────────────────────────────────────────────────────────
const TODO_RATES = {
  rate:      { medical: "TODO", support: "TODO", care: "TODO" },
  perCapita: { medical: "TODO", support: "TODO", care: "TODO" },
  household: { medical: "TODO", support: "TODO", care: "TODO" },
  caps:      { medical: 660000, support: 260000, care: 170000 },
};

// ─────────────────────────────────────────────────────────────────
// JSON生成
// ─────────────────────────────────────────────────────────────────
function buildJson(m) {
  const r = m.rates ?? TODO_RATES;
  return {
    cityCode:       m.cityCode,
    citySlug:       m.citySlug,
    cityName:       m.cityName,
    fiscalYear:     2025,
    system:         "kokuho",
    basicDeduction: 430000,
    rate:           r.rate,
    perCapita:      r.perCapita,
    household:      r.household,
    caps:           r.caps,
    preschoolReduction: COMMON_PRESCHOOL,
    reduction:          COMMON_REDUCTION,
    ...(m.rates == null ? { _status: "TODO: rates未確認。各自治体公式サイトで確認して更新してください。" } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────
// 実行
// ─────────────────────────────────────────────────────────────────
let created = 0;
let skipped = 0;
let todo    = 0;

console.log(`\n${"=".repeat(60)}`);
console.log(`神奈川県 国保データ一括生成 (2025年度)`);
console.log(`${"=".repeat(60)}\n`);

for (const m of MUNICIPALITIES) {
  const dir  = path.join(OUT_BASE, m.citySlug);
  const file = path.join(dir, "kokuho-2025.json");

  if (existsSync(file)) {
    console.log(`⏭  スキップ  ${m.cityName} (既存: ${file.replace(OUT_BASE + "/", "")})`);
    skipped++;
    continue;
  }

  mkdirSync(dir, { recursive: true });
  const json = buildJson(m);
  writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf-8");

  if (m.rates == null) {
    console.log(`📋 TODO生成  ${m.cityName} → data/municipalities/${m.citySlug}/kokuho-2025.json`);
    todo++;
  } else {
    console.log(`✅ 生成完了  ${m.cityName} → data/municipalities/${m.citySlug}/kokuho-2025.json`);
  }
  created++;
}

console.log(`\n${"─".repeat(60)}`);
console.log(`生成: ${created} 件 (うち TODO: ${todo} 件) / スキップ: ${skipped} 件`);
if (todo > 0) {
  console.log(`\n※ TODO付きファイルは rates が未確認です。`);
  console.log(`  各自治体の公式サイトで令和7年度保険料率を確認し、`);
  console.log(`  MUNICIPALITIES 配列の rates フィールドを更新してください。`);
  console.log(`  更新後、該当ファイルを削除してから再実行すると上書き生成されます。`);
}
console.log();
