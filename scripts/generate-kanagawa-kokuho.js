/**
 * 神奈川県 国保データ一括生成スクリプト
 *
 * data/municipalities/{slug}/kokuho-2025.json を自治体ごとに生成する。
 * - 既にファイルが存在する場合はスキップ（上書きしない）
 * - rates が null の自治体は TODO マーカー付きスケルトンを生成
 *
 * 実行:          node scripts/generate-kanagawa-kokuho.js
 * 強制上書き:    node scripts/generate-kanagawa-kokuho.js --force
 *
 * ▼ データ更新手順
 *   1. 各自治体公式サイトで令和7年度保険料率を確認
 *   2. MUNICIPALITIES の rates フィールドに記入（null → オブジェクト）
 *   3. 該当ファイルを削除してから再実行 or --force オプション使用
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
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

// ─────────────────────────────────────────────────────────────────
// 神奈川県 全自治体リスト（令和7年度 = 2025年度）
//
// rates: null → 未調査（TODO スケルトン生成）
// rates: {...} → 調査済み（実データで生成）
//
// データソース: 各自治体公式サイト（令和7年度国民健康保険料率）
// ─────────────────────────────────────────────────────────────────
const MUNICIPALITIES = [

  // ── 政令市 ────────────────────────────────────────────────────

  {
    cityCode: "14100", citySlug: "yokohama", cityName: "横浜市",
    note: "平等割（世帯割）なし。所得割＋均等割のみ。",
    // 既存ファイルあり → スキップ
    rates: null,
  },
  {
    cityCode: "14130", citySlug: "kawasaki", cityName: "川崎市",
    note: "平等割（世帯割）なし。所得割＋均等割のみ。",
    // 出典: https://www.city.kawasaki.jp/350/page/0000177217.html
    rates: {
      rate:      { medical: 0.0786, support: 0.0270, care: 0.0233 },
      perCapita: { medical: 41115,  support: 14798,  care: 14759  },
      household: { medical: 0,      support: 0,      care: 0      },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14150", citySlug: "sagamihara", cityName: "相模原市",
    note: "国民健康保険税方式",
    // 出典: https://www.city.sagamihara.kanagawa.jp/kurashi/1026448/kokuho/1007820/1007822.html
    rates: {
      rate:      { medical: 0.0640, support: 0.0270, care: 0.0232 },
      perCapita: { medical: 27000,  support: 11000,  care: 11500  },
      household: { medical: 17000,  support: 7000,   care: 6000   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },

  // ── 市 ───────────────────────────────────────────────────────

  {
    cityCode: "14201", citySlug: "yokosuka", cityName: "横須賀市",
    // 出典: https://www.city.yokosuka.kanagawa.jp/3155/g_info/l100000578.html
    rates: {
      rate:      { medical: 0.0726, support: 0.0279, care: 0.0270 },
      perCapita: { medical: 22030,  support: 8450,   care: 8400   },
      household: { medical: 33200,  support: 12740,  care: 9420   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14203", citySlug: "hiratsuka", cityName: "平塚市",
    note: "国民健康保険税方式",
    // 出典: https://www.city.hiratsuka.kanagawa.jp/nenkin/page-c_00081.html
    rates: {
      rate:      { medical: 0.0729, support: 0.0299, care: 0.0288 },
      perCapita: { medical: 28530,  support: 11440,  care: 11690  },
      household: { medical: 18500,  support: 7420,   care: 5770   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14204", citySlug: "kamakura", cityName: "鎌倉市",
    rates: null, // TODO: https://www.city.kamakura.kanagawa.jp/hokennenkin/kokuho-fuka.html
  },
  {
    cityCode: "14205", citySlug: "fujisawa", cityName: "藤沢市",
    // 出典: 藤沢市公式サイト 令和7年度
    rates: {
      rate:      { medical: 0.0694, support: 0.0297, care: 0.0255 },
      perCapita: { medical: 28560,  support: 11880,  care: 12480  },
      household: { medical: 18480,  support: 7680,   care: 6000   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14206", citySlug: "odawara", cityName: "小田原市",
    // 出典: https://www.city.odawara.kanagawa.jp/field/welfare/national-h/hokenryou/h28-ryouritu.html
    rates: {
      rate:      { medical: 0.0704, support: 0.0288, care: 0.0269 },
      perCapita: { medical: 26417,  support: 10816,  care: 10822  },
      household: { medical: 18805,  support: 7699,   care: 6167   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14207", citySlug: "chigasaki", cityName: "茅ヶ崎市",
    // 出典: 茅ヶ崎市公式サイト 令和7年度
    rates: {
      rate:      { medical: 0.0666, support: 0.0277, care: 0.0262 },
      perCapita: { medical: 22432,  support: 9231,   care: 9485   },
      household: { medical: 27755,  support: 11421,  care: 8789   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14208", citySlug: "zushi", cityName: "逗子市",
    rates: null, // TODO: https://www.city.zushi.kanagawa.jp/
  },
  {
    cityCode: "14210", citySlug: "miura", cityName: "三浦市",
    rates: null, // TODO: https://www.city.miura.kanagawa.jp/
  },
  {
    cityCode: "14211", citySlug: "hadano", cityName: "秦野市",
    note: "国民健康保険税方式",
    rates: null, // TODO: https://www.city.hadano.kanagawa.jp/www/contents/1743405478927/index.html
  },
  {
    cityCode: "14212", citySlug: "atsugi", cityName: "厚木市",
    // 出典: https://www.city.atsugi.kanagawa.jp/soshiki/kokuhonenkinka/9/22689.html
    rates: {
      rate:      { medical: 0.0624, support: 0.0211, care: 0.0212 },
      perCapita: { medical: 25744,  support: 8887,   care: 10123  },
      household: { medical: 23575,  support: 8138,   care: 6899   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14213", citySlug: "yamato", cityName: "大和市",
    note: "国民健康保険税方式",
    // 出典: https://www.city.yamato.lg.jp/gyosei/soshik/2020/kokuminkenkohoken/kokuho_zeikin/6920.html
    rates: {
      rate:      { medical: 0.0780, support: 0.0295, care: 0.0270 },
      perCapita: { medical: 24600,  support: 10200,  care: 12600  },
      household: { medical: 25200,  support: 10200,  care: 9000   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14214", citySlug: "isehara", cityName: "伊勢原市",
    note: "国民健康保険税方式",
    // 出典: https://www.city.isehara.kanagawa.jp/docs/2025022800047/
    rates: {
      rate:      { medical: 0.0637, support: 0.0233, care: 0.0212 },
      perCapita: { medical: 25900,  support: 9600,   care: 9800   },
      household: { medical: 18200,  support: 6600,   care: 5200   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14215", citySlug: "ebina", cityName: "海老名市",
    note: "国民健康保険税方式",
    // 出典: https://www.city.ebina.kanagawa.jp/guide/hoken/kokuho/1002930.html
    rates: {
      rate:      { medical: 0.0606, support: 0.0260, care: 0.0242 },
      perCapita: { medical: 28000,  support: 12000,  care: 12800  },
      household: { medical: 21500,  support: 9400,   care: 7100   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14216", citySlug: "zama", cityName: "座間市",
    note: "国民健康保険税方式",
    // 出典: https://www.city.zama.kanagawa.jp/kurashi/nenkin/kenkouhoken/zei/1002028.html
    rates: {
      rate:      { medical: 0.0680, support: 0.0270, care: 0.0240 },
      perCapita: { medical: 27800,  support: 10500,  care: 11500  },
      household: { medical: 19100,  support: 7400,   care: 6300   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },
  {
    cityCode: "14217", citySlug: "minamiashigara", cityName: "南足柄市",
    rates: null, // TODO: https://www.city.minamiashigara.kanagawa.jp/
  },
  {
    cityCode: "14218", citySlug: "ayase", cityName: "綾瀬市",
    note: "国民健康保険税方式",
    // 出典: https://www.city.ayase.kanagawa.jp/soshiki/hokennenkinka/hokennenkintanto_hoken/2/5/19710.html
    rates: {
      rate:      { medical: 0.0640, support: 0.0260, care: 0.0230 },
      perCapita: { medical: 22200,  support: 8400,   care: 9000   },
      household: { medical: 20400,  support: 8400,   care: 9000   },
      caps:      { medical: 660000, support: 260000, care: 170000 },
    },
  },

  // ── 町村 ─────────────────────────────────────────────────────

  {
    cityCode: "14301", citySlug: "hayama",          cityName: "葉山町",    rates: null,
    // TODO: https://www.town.hayama.lg.jp/
  },
  {
    cityCode: "14321", citySlug: "samukawa",         cityName: "寒川町",    rates: null,
    // TODO: https://www.town.samukawa.kanagawa.jp/
  },
  {
    cityCode: "14341", citySlug: "oiso",             cityName: "大磯町",    rates: null,
    // TODO: https://www.town.oiso.kanagawa.jp/
  },
  {
    cityCode: "14342", citySlug: "ninomiya",         cityName: "二宮町",    rates: null,
    // TODO: https://www.town.ninomiya.kanagawa.jp/
  },
  {
    cityCode: "14361", citySlug: "nakai",            cityName: "中井町",    rates: null,
    // TODO: https://www.town.nakai.kanagawa.jp/
  },
  {
    cityCode: "14362", citySlug: "oi",               cityName: "大井町",    rates: null,
    // TODO: https://www.town.oi.kanagawa.jp/
  },
  {
    cityCode: "14363", citySlug: "matsuda",          cityName: "松田町",    rates: null,
    // TODO: https://www.town.matsuda.kanagawa.jp/
  },
  {
    cityCode: "14364", citySlug: "yamakita",         cityName: "山北町",    rates: null,
    // TODO: https://www.town.yamakita.kanagawa.jp/
  },
  {
    cityCode: "14366", citySlug: "kaisei",           cityName: "開成町",    rates: null,
    // TODO: https://www.town.kaisei.kanagawa.jp/
  },
  {
    cityCode: "14382", citySlug: "hakone",           cityName: "箱根町",    rates: null,
    // TODO: https://www.town.hakone.kanagawa.jp/
  },
  {
    cityCode: "14383", citySlug: "manazuru",         cityName: "真鶴町",    rates: null,
    // TODO: https://www.town.manazuru.kanagawa.jp/
  },
  {
    cityCode: "14384", citySlug: "yugawara",         cityName: "湯河原町",  rates: null,
    // TODO: https://www.town.yugawara.kanagawa.jp/
  },
  {
    cityCode: "14401", citySlug: "aikawa",           cityName: "愛川町",    rates: null,
    // TODO: https://www.town.aikawa.kanagawa.jp/
  },
  {
    cityCode: "14402", citySlug: "kiyokawa",         cityName: "清川村",    rates: null,
    // TODO: https://www.vill.kiyokawa.kanagawa.jp/
  },
];

// ─────────────────────────────────────────────────────────────────
// TODO プレースホルダー
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
    cityCode:           m.cityCode,
    citySlug:           m.citySlug,
    cityName:           m.cityName,
    fiscalYear:         2025,
    system:             "kokuho",
    ...(m.note ? { note: m.note } : {}),
    basicDeduction:     430000,
    rate:               r.rate,
    perCapita:          r.perCapita,
    household:          r.household,
    caps:               r.caps,
    preschoolReduction: COMMON_PRESCHOOL,
    reduction:          COMMON_REDUCTION,
    ...(m.rates == null ? { _status: "TODO: 公式サイトで料率を確認して更新してください。" } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────
// 実行
// ─────────────────────────────────────────────────────────────────
let created = 0, skipped = 0, todo = 0;

console.log(`\n${"=".repeat(60)}`);
console.log(`神奈川県 国保データ一括生成 (令和7年度 / 2025年度)`);
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

  if (m.rates == null) {
    console.log(`📋 TODO生成  ${m.cityName}`);
    todo++;
  } else {
    console.log(`✅ 生成完了  ${m.cityName}`);
  }
  created++;
}

const confirmed = MUNICIPALITIES.filter(m => m.rates !== null).length;
const todoCount = MUNICIPALITIES.filter(m => m.rates === null).length;

console.log(`\n${"─".repeat(60)}`);
console.log(`生成: ${created} 件 / スキップ: ${skipped} 件`);
console.log(`料率確認済: ${confirmed} 自治体 / 未確認(TODO): ${todoCount} 自治体`);
if (todoCount > 0) {
  console.log(`\n※ TODO の自治体は各公式サイトURLがコメントに記載されています。`);
  console.log(`  料率を記入後、--force オプションで再生成してください。`);
  console.log(`  例: node scripts/generate-kanagawa-kokuho.js --force`);
}
console.log();
