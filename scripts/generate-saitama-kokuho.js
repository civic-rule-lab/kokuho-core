/**
 * 埼玉県 国保データ一括生成スクリプト
 *
 * data/municipalities/{slug}/kokuho-2025.json を自治体ごとに生成する。
 * - 既にファイルが存在する場合はスキップ（上書きしない）
 * - rates が null の自治体は TODO マーカー付きスケルトンを生成
 *
 * 実行:          node scripts/generate-saitama-kokuho.js
 * 強制上書き:    node scripts/generate-saitama-kokuho.js --force
 *
 * ▼ データ更新手順
 *   1. 各自治体公式サイトで令和7年度保険料率を確認
 *   2. MUNICIPALITIES の rates フィールドに記入（null → オブジェクト）
 *   3. 該当ファイルを削除してから再実行 or --force オプション使用
 *
 * ▼ 埼玉県の構造的特徴
 *   - 大部分の自治体: 2方式（所得割 + 均等割）、平等割・資産割なし
 *   - 下記8自治体のみ 医療分に 平等割・資産割あり（4h[m]構造）:
 *     秩父市(資産割15%)、本庄市(20%)、狭山市(10%)、深谷市(9%)、
 *     蕨市(10%)、朝霞市(20%)、長瀞町(16%)、神川町(15%)
 *   - 神川町のスラグ: kamikawa（かみかわ）
 *   - 支援分・介護分は全自治体で平等割・資産割なし
 *
 * ▼ スラグ競合（既存スラグとの重複回避）
 *   富士見市 → fujimishi  (長野県富士見町が fujimi を使用)
 *   伊奈町   → inacho     (長野県伊那市が ina を使用)
 *   小川町   → ogawacho   (長野県小川村が ogawa を使用)
 *   美里町   → misatomachi (埼玉県三郷市が misato を使用)
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

// ─────────────────────────────────────────────────────────────────
// 賦課限度額プリセット
// ─────────────────────────────────────────────────────────────────
const CAPS_NAT = { medical: 660000, support: 260000, care: 170000 };  // 全国標準
const CAPS_650 = { medical: 650000, support: 240000, care: 170000 };  // 独自上限

// ─────────────────────────────────────────────────────────────────
// 埼玉県 全自治体リスト（令和7年度 = 2025年度）
//
// rates: null → 未調査（TODO スケルトン生成）
// rates: {...} → 調査済み（実データで生成）
// assetLevy: 資産割率（医療分のみ。該当8自治体のみ設定）
//
// データソース: 各自治体公式サイト（令和7年度国民健康保険料率）
// ─────────────────────────────────────────────────────────────────
const MUNICIPALITIES = [

  // ── 政令市 ────────────────────────────────────────────────────

  {
    cityCode: "11100", citySlug: "saitama", cityName: "さいたま市",
    note: "政令市。区ごとに窓口が異なるが保険料率は市全体で統一。",
    caps: CAPS_NAT,
    // 出典: https://www.city.saitama.lg.jp/003/004/002/003/
    rates: {
      rate:      { medical: 0.0884, support: 0.0280, care: 0.0244 },
      perCapita: { medical: 46200,  support: 13800,  care: 16200  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },

  // ── 市 ───────────────────────────────────────────────────────

  {
    cityCode: "11201", citySlug: "kawagoe", cityName: "川越市",
    caps: CAPS_650,
    // 出典: https://www.city.kawagoe.saitama.jp/
    rates: {
      rate:      { medical: 0.0820, support: 0.0275, care: 0.0237 },
      perCapita: { medical: 44700,  support: 14200,  care: 14500  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "11202", citySlug: "kumagaya", cityName: "熊谷市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.kumagaya.lg.jp/
  },
  {
    cityCode: "11203", citySlug: "kawaguchi", cityName: "川口市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.kawaguchi.lg.jp/
  },
  {
    cityCode: "11206", citySlug: "gyoda", cityName: "行田市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.gyoda.lg.jp/
  },
  {
    cityCode: "11207", citySlug: "chichibu", cityName: "秩父市",
    note: "医療分のみ平等割・資産割あり（4方式）。資産割率15%。",
    caps: CAPS_650,
    assetLevy: { medical: 0.15 },
    rates: null, // TODO: https://www.city.chichibu.lg.jp/
  },
  {
    cityCode: "11208", citySlug: "tokorozawa", cityName: "所沢市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.tokorozawa.saitama.jp/
  },
  {
    cityCode: "11209", citySlug: "hanno", cityName: "飯能市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.hanno.lg.jp/
  },
  {
    cityCode: "11210", citySlug: "kazo", cityName: "加須市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.kazo.lg.jp/
  },
  {
    cityCode: "11211", citySlug: "honjo", cityName: "本庄市",
    note: "医療分のみ平等割・資産割あり（4方式）。資産割率20%。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.20 },
    rates: null, // TODO: https://www.city.honjo.lg.jp/
  },
  {
    cityCode: "11212", citySlug: "higashimatsuyama", cityName: "東松山市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.higashimatsuyama.lg.jp/
  },
  {
    cityCode: "11214", citySlug: "kasukabe", cityName: "春日部市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.kasukabe.lg.jp/
  },
  {
    cityCode: "11215", citySlug: "sayama", cityName: "狭山市",
    note: "医療分のみ平等割・資産割あり（4方式）。資産割率10%。",
    caps: CAPS_650,
    assetLevy: { medical: 0.10 },
    rates: null, // TODO: https://www.city.sayama.saitama.jp/
  },
  {
    cityCode: "11216", citySlug: "hanyu", cityName: "羽生市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.hanyu.lg.jp/
  },
  {
    cityCode: "11217", citySlug: "konosu", cityName: "鴻巣市",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.city.konosu.saitama.jp/
  },
  {
    cityCode: "11219", citySlug: "fukaya", cityName: "深谷市",
    note: "医療分のみ平等割・資産割あり（4方式）。資産割率9%。",
    caps: CAPS_650,
    assetLevy: { medical: 0.09 },
    rates: null, // TODO: https://www.city.fukaya.saitama.jp/
  },
  {
    cityCode: "11220", citySlug: "ageo", cityName: "上尾市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.ageo.lg.jp/
  },
  {
    cityCode: "11222", citySlug: "soka", cityName: "草加市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.soka.saitama.jp/
  },
  {
    cityCode: "11223", citySlug: "koshigaya", cityName: "越谷市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.koshigaya.saitama.jp/
  },
  {
    cityCode: "11224", citySlug: "warabi", cityName: "蕨市",
    note: "医療分のみ平等割・資産割あり（4方式）。資産割率10%。",
    caps: CAPS_650,
    assetLevy: { medical: 0.10 },
    rates: null, // TODO: https://www.city.warabi.saitama.jp/
  },
  {
    cityCode: "11225", citySlug: "toda", cityName: "戸田市",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.city.toda.saitama.jp/
  },
  {
    cityCode: "11227", citySlug: "iruma", cityName: "入間市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.iruma.saitama.jp/
  },
  {
    cityCode: "11229", citySlug: "asaka", cityName: "朝霞市",
    note: "医療分のみ平等割・資産割あり（4方式）。資産割率20%。",
    caps: CAPS_650,
    assetLevy: { medical: 0.20 },
    rates: null, // TODO: https://www.city.asaka.lg.jp/
  },
  {
    cityCode: "11230", citySlug: "shiki", cityName: "志木市",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.city.shiki.lg.jp/
  },
  {
    cityCode: "11231", citySlug: "wako", cityName: "和光市",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.city.wako.lg.jp/
  },
  {
    cityCode: "11232", citySlug: "niiza", cityName: "新座市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.niiza.saitama.jp/
  },
  {
    cityCode: "11233", citySlug: "okegawa", cityName: "桶川市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.okegawa.lg.jp/
  },
  {
    cityCode: "11234", citySlug: "kuki", cityName: "久喜市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.kuki.lg.jp/
  },
  {
    cityCode: "11235", citySlug: "kitamoto", cityName: "北本市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.kitamoto.saitama.jp/
  },
  {
    cityCode: "11236", citySlug: "yashio", cityName: "八潮市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.yashio.lg.jp/
  },
  {
    // slug競合: 長野県富士見町(fujimi)と重複 → fujimishi
    cityCode: "11237", citySlug: "fujimishi", cityName: "富士見市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.fujimi.saitama.jp/
  },
  {
    cityCode: "11239", citySlug: "misato", cityName: "三郷市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.misato.lg.jp/
  },
  {
    cityCode: "11240", citySlug: "hasuda", cityName: "蓮田市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.hasuda.saitama.jp/
  },
  {
    cityCode: "11241", citySlug: "sakado", cityName: "坂戸市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.sakado.lg.jp/
  },
  {
    cityCode: "11242", citySlug: "satte", cityName: "幸手市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.satte.lg.jp/
  },
  {
    cityCode: "11243", citySlug: "tsurugashima", cityName: "鶴ヶ島市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.tsurugashima.lg.jp/
  },
  {
    cityCode: "11244", citySlug: "hidaka", cityName: "日高市",
    caps: CAPS_650,
    rates: null, // TODO: https://www.city.hidaka.lg.jp/
  },
  {
    cityCode: "11245", citySlug: "yoshikawa", cityName: "吉川市",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.city.yoshikawa.saitama.jp/
  },
  {
    cityCode: "11247", citySlug: "fujimino", cityName: "ふじみ野市",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.city.fujimino.saitama.jp/
  },
  {
    cityCode: "11248", citySlug: "shiraoka", cityName: "白岡市",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.city.shiraoka.lg.jp/
  },

  // ── 町村 ─────────────────────────────────────────────────────

  {
    // slug競合: 長野県伊那市(ina)と重複 → inacho
    cityCode: "11301", citySlug: "inacho", cityName: "伊奈町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.ina.saitama.jp/
  },
  {
    cityCode: "11324", citySlug: "miyoshi", cityName: "三芳町",
    caps: CAPS_650,
    rates: null, // TODO: https://www.town.miyoshi.saitama.jp/
  },
  {
    cityCode: "11341", citySlug: "moroyama", cityName: "毛呂山町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.moroyama.saitama.jp/
  },
  {
    cityCode: "11342", citySlug: "ogose", cityName: "越生町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.ogose.saitama.jp/
  },
  {
    cityCode: "11361", citySlug: "namegawa", cityName: "滑川町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.namegawa.saitama.jp/
  },
  {
    cityCode: "11362", citySlug: "ranzan", cityName: "嵐山町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.ranzan.saitama.jp/
  },
  {
    // slug競合: 長野県小川村(ogawa)と重複 → ogawacho
    cityCode: "11363", citySlug: "ogawacho", cityName: "小川町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.ogawa.saitama.jp/
  },
  {
    cityCode: "11365", citySlug: "kawajima", cityName: "川島町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.kawajima.saitama.jp/
  },
  {
    cityCode: "11366", citySlug: "yoshimi", cityName: "吉見町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.yoshimi.saitama.jp/
  },
  {
    cityCode: "11367", citySlug: "hatoyama", cityName: "鳩山町",
    caps: CAPS_650,
    rates: null, // TODO: https://www.town.hatoyama.saitama.jp/
  },
  {
    cityCode: "11369", citySlug: "tokigawa", cityName: "ときがわ町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.tokigawa.lg.jp/
  },
  {
    cityCode: "11381", citySlug: "yokoze", cityName: "横瀬町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.yokoze.saitama.jp/
  },
  {
    cityCode: "11382", citySlug: "minano", cityName: "皆野町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.minano.saitama.jp/
  },
  {
    cityCode: "11383", citySlug: "nagatoro", cityName: "長瀞町",
    note: "医療分のみ平等割・資産割あり（4方式）。資産割率16%。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.16 },
    rates: null, // TODO: https://www.town.nagatoro.saitama.jp/
  },
  {
    cityCode: "11384", citySlug: "ogano", cityName: "小鹿野町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.ogano.saitama.jp/
  },
  {
    cityCode: "11385", citySlug: "higashichichibu", cityName: "東秩父村",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.vill.higashichichibu.saitama.jp/
  },
  {
    // slug競合: 埼玉県三郷市(misato)と重複 → misatomachi
    cityCode: "11401", citySlug: "misatomachi", cityName: "美里町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.misato.saitama.jp/
  },
  {
    cityCode: "11402", citySlug: "kamikawa", cityName: "神川町",
    note: "医療分のみ平等割・資産割あり（4方式）。資産割率15%。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.15 },
    rates: null, // TODO: https://www.town.kamikawa.saitama.jp/
  },
  {
    cityCode: "11404", citySlug: "kamisato", cityName: "上里町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.kamisato.saitama.jp/
  },
  {
    cityCode: "11408", citySlug: "yorii", cityName: "寄居町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.yorii.saitama.jp/
  },
  {
    cityCode: "11442", citySlug: "miyashiro", cityName: "宮代町",
    caps: CAPS_NAT,
    rates: null, // TODO: https://www.town.miyashiro.saitama.jp/
  },
  {
    cityCode: "11464", citySlug: "sugito", cityName: "杉戸町",
    caps: CAPS_650,
    rates: null, // TODO: https://www.town.sugito.lg.jp/
  },
  {
    cityCode: "11465", citySlug: "matsubushi", cityName: "松伏町",
    caps: CAPS_650,
    rates: null, // TODO: https://www.town.matsubushi.saitama.jp/
  },
];

// ─────────────────────────────────────────────────────────────────
// TODO プレースホルダー
// ─────────────────────────────────────────────────────────────────
function getTodoRates(caps) {
  return {
    rate:      { medical: "TODO", support: "TODO", care: "TODO" },
    perCapita: { medical: "TODO", support: "TODO", care: "TODO" },
    household: { medical: "TODO", support: "TODO", care: "TODO" },
    caps,
  };
}

// ─────────────────────────────────────────────────────────────────
// JSON生成
// ─────────────────────────────────────────────────────────────────
function buildJson(m) {
  const r = m.rates ?? getTodoRates(m.caps);
  const json = {
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
    caps:               m.caps,
    ...(m.assetLevy ? { assetLevy: m.assetLevy } : {}),
    preschoolReduction: COMMON_PRESCHOOL,
    reduction:          COMMON_REDUCTION,
    ...(m.rates == null ? { _status: "TODO: 公式サイトで料率を確認して更新してください。" } : {}),
  };
  return json;
}

// ─────────────────────────────────────────────────────────────────
// 実行
// ─────────────────────────────────────────────────────────────────
let created = 0, skipped = 0;

console.log(`\n${"=".repeat(60)}`);
console.log(`埼玉県 国保データ一括生成 (令和7年度 / 2025年度)`);
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
  console.log(`  例: node scripts/generate-saitama-kokuho.js --force`);
}
console.log();
