/**
 * 奈良県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 奈良市「令和7年度 国民健康保険料算定」
 *   https://www.city.nara.lg.jp/site/kokuminkenkouhoken/9305.html
 *   香芝市でも同一レートを確認
 *
 * 使用: node scripts/generate-pref-kokuho.js nara
 *
 * 特記事項:
 *   - 奈良県は令和6年度より全39市町村で保険料率を完全統一
 *   - 全市町村 同一レート（所得割7.64%/3.27%/3.03%、均等割27600/11500/16900円）
 *   - 医療分・後期分: 3方式（所得割+均等割+平等割）
 *   - 介護分: 2方式（所得割+均等割、平等割=0）
 *   - 資産割なし（全市町村）
 *   - 賦課限度額: 医療65万円・後期24万円・介護17万円（全国標準より低い旧水準）
 *   - slug競合: 川西町→kawanishimachi（兵庫川西市がkawanishiを使用）
 *             川上村→kawakamimura（長野川上村がkawakamiを使用）
 */

export const PREF_NAME = "奈良県";

// 奈良県は全市町村統一の賦課限度額（旧水準：650/240/170万円）
export const CAPS = { medical: 650000, support: 240000, care: 170000 };

// 奈良県統一保険料率（令和7年度）
const UNIFIED = {
  rate:      { medical: 0.0764, support: 0.0327, care: 0.0303 },
  perCapita: { medical: 27600,  support: 11500,  care: 16900  },
  household: { medical: 20000,  support: 8400,   care: 0      },
};

// ─────────────────────────────────────────────────────────────────
// 奈良県 全39市町村（令和7年度 県統一保険料率）
// 医療分・後期分: 3方式 / 介護分: 2方式（平等割=0）/ 資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（12市）───────────────────────────────────────────────

  { cityCode: "29201", citySlug: "nara",            cityName: "奈良市",     rates: UNIFIED },
  { cityCode: "29202", citySlug: "yamatotakada",    cityName: "大和高田市", rates: UNIFIED },
  { cityCode: "29203", citySlug: "yamatokoriyama",  cityName: "大和郡山市", rates: UNIFIED },
  { cityCode: "29204", citySlug: "tenri",           cityName: "天理市",     rates: UNIFIED },
  { cityCode: "29205", citySlug: "kashihara",       cityName: "橿原市",     rates: UNIFIED },
  { cityCode: "29206", citySlug: "sakurai",         cityName: "桜井市",     rates: UNIFIED },
  { cityCode: "29207", citySlug: "gojo",            cityName: "五條市",     rates: UNIFIED },
  { cityCode: "29208", citySlug: "gose",            cityName: "御所市",     rates: UNIFIED },
  { cityCode: "29209", citySlug: "ikoma",           cityName: "生駒市",     rates: UNIFIED },
  { cityCode: "29210", citySlug: "kashiba",         cityName: "香芝市",     rates: UNIFIED },
  { cityCode: "29211", citySlug: "katsuragi",       cityName: "葛城市",     rates: UNIFIED },
  { cityCode: "29212", citySlug: "uda",             cityName: "宇陀市",     rates: UNIFIED },

  // ── 町村（27町村）───────────────────────────────────────────

  { cityCode: "29322", citySlug: "yamazoe",         cityName: "山添村",     rates: UNIFIED },
  { cityCode: "29341", citySlug: "heguri",          cityName: "平群町",     rates: UNIFIED },
  { cityCode: "29342", citySlug: "sango",           cityName: "三郷町",     rates: UNIFIED },
  { cityCode: "29343", citySlug: "ikaruga",         cityName: "斑鳩町",     rates: UNIFIED },
  { cityCode: "29344", citySlug: "ando",            cityName: "安堵町",     rates: UNIFIED },
  { cityCode: "29361", citySlug: "kawanishimachi",  cityName: "川西町",     rates: UNIFIED },
  { cityCode: "29362", citySlug: "miyake",          cityName: "三宅町",     rates: UNIFIED },
  { cityCode: "29363", citySlug: "tawaramoto",      cityName: "田原本町",   rates: UNIFIED },
  { cityCode: "29381", citySlug: "soni",            cityName: "曽爾村",     rates: UNIFIED },
  { cityCode: "29382", citySlug: "mitsue",          cityName: "御杖村",     rates: UNIFIED },
  { cityCode: "29401", citySlug: "takatori",        cityName: "高取町",     rates: UNIFIED },
  { cityCode: "29402", citySlug: "asuka",           cityName: "明日香村",   rates: UNIFIED },
  { cityCode: "29421", citySlug: "kamimaki",        cityName: "上牧町",     rates: UNIFIED },
  { cityCode: "29422", citySlug: "oji",             cityName: "王寺町",     rates: UNIFIED },
  { cityCode: "29423", citySlug: "koryo",           cityName: "広陵町",     rates: UNIFIED },
  { cityCode: "29424", citySlug: "kawai",           cityName: "河合町",     rates: UNIFIED },
  { cityCode: "29441", citySlug: "yoshino",         cityName: "吉野町",     rates: UNIFIED },
  { cityCode: "29442", citySlug: "oyodo",           cityName: "大淀町",     rates: UNIFIED },
  { cityCode: "29443", citySlug: "shimoichi",       cityName: "下市町",     rates: UNIFIED },
  { cityCode: "29444", citySlug: "kurotaki",        cityName: "黒滝村",     rates: UNIFIED },
  { cityCode: "29446", citySlug: "tenkawa",         cityName: "天川村",     rates: UNIFIED },
  { cityCode: "29447", citySlug: "nosegawa",        cityName: "野迫川村",   rates: UNIFIED },
  { cityCode: "29449", citySlug: "totsukawa",       cityName: "十津川村",   rates: UNIFIED },
  { cityCode: "29450", citySlug: "shimokitayama",   cityName: "下北山村",   rates: UNIFIED },
  { cityCode: "29451", citySlug: "kamikitayama",    cityName: "上北山村",   rates: UNIFIED },
  { cityCode: "29452", citySlug: "kawakamimura",    cityName: "川上村",     rates: UNIFIED },
  { cityCode: "29453", citySlug: "higashiyoshino",  cityName: "東吉野村",   rates: UNIFIED },
];
