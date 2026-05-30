/**
 * 宮城県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 宮城県「令和7年度国民健康保険料(税）率等の状況（実際の保険料(税)率）」
 *   https://www.pref.miyagi.jp/documents/14957/2025_jissai.pdf
 *   掲載ページ: https://www.pref.miyagi.jp/soshiki/kkh-iryou/kokuho04.html
 *
 * 使用: node scripts/generate-pref-kokuho.js miyagi
 *
 * 特記事項:
 *   - 全35市町村 実際の保険料（税）率（令和7年度）
 *   - 全市町村 3方式（所得割+均等割+平等割）
 *   - 資産割なし（全市町村）
 *   - 賦課限度額: 全市町村で全国標準（660/260/170万円）
 *   - slug競合:
 *       大崎市  → osakishi      （鹿児島大崎町が osaki を使用）
 *       柴田町  → shibatacho    （新潟新発田市が shibata を使用）
 *       川崎町  → kawasakimiyagi（神奈川川崎市が kawasaki、福岡川崎町が kawasakimachi を使用）
 *       美里町  → misatomiyagi  （埼玉三郷市が misato、埼玉美里町が misatomachi、熊本美里町が misatokuma を使用）
 */

export const PREF_NAME = "宮城県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 宮城県 全35市町村（令和7年度 実際の保険料（税）率）
// 全市町村 3方式（所得割+均等割+平等割）/ 資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（14市）───────────────────────────────────────────────

  { cityCode: "04100", citySlug: "sendai",           cityName: "仙台市",     rates: { rate: { medical: 0.0826, support: 0.0317, care: 0.0261 }, perCapita: { medical: 26910, support: 10330, care:  9290 }, household: { medical: 26100, support: 10020, care: 6970 } } },
  { cityCode: "04202", citySlug: "ishinomaki",       cityName: "石巻市",     rates: { rate: { medical: 0.0721, support: 0.0251, care: 0.0224 }, perCapita: { medical: 31000, support: 10000, care: 13000 }, household: { medical: 25400, support:  8200, care: 8200 } } },
  { cityCode: "04203", citySlug: "shiogama",         cityName: "塩竈市",     rates: { rate: { medical: 0.0700, support: 0.0250, care: 0.0220 }, perCapita: { medical: 27200, support:  9700, care: 10000 }, household: { medical: 18100, support:  6400, care: 4800 } } },
  { cityCode: "04205", citySlug: "kesennuma",        cityName: "気仙沼市",   rates: { rate: { medical: 0.0663, support: 0.0288, care: 0.0228 }, perCapita: { medical: 29215, support: 12524, care: 11849 }, household: { medical: 18706, support:  8019, care: 5826 } } },
  { cityCode: "04206", citySlug: "shiroishi",        cityName: "白石市",     rates: { rate: { medical: 0.0680, support: 0.0280, care: 0.0200 }, perCapita: { medical: 23000, support:  9600, care:  9400 }, household: { medical: 22000, support:  7000, care: 4800 } } },
  { cityCode: "04207", citySlug: "natori",           cityName: "名取市",     rates: { rate: { medical: 0.0750, support: 0.0300, care: 0.0250 }, perCapita: { medical: 26600, support: 10500, care: 10500 }, household: { medical: 23000, support:  8000, care: 7000 } } },
  { cityCode: "04208", citySlug: "kakuda",           cityName: "角田市",     rates: { rate: { medical: 0.0810, support: 0.0330, care: 0.0270 }, perCapita: { medical: 27300, support: 11000, care: 10600 }, household: { medical: 18600, support:  7500, care: 5600 } } },
  { cityCode: "04209", citySlug: "tagajo",           cityName: "多賀城市",   rates: { rate: { medical: 0.0700, support: 0.0200, care: 0.0140 }, perCapita: { medical: 26880, support:  7680, care:  8640 }, household: { medical: 23520, support:  7680, care: 5400 } } },
  { cityCode: "04211", citySlug: "iwanuma",          cityName: "岩沼市",     rates: { rate: { medical: 0.0703, support: 0.0281, care: 0.0244 }, perCapita: { medical: 27000, support: 10500, care: 10900 }, household: { medical: 18000, support:  6900, care: 5500 } } },
  { cityCode: "04212", citySlug: "tome",             cityName: "登米市",     rates: { rate: { medical: 0.0750, support: 0.0300, care: 0.0250 }, perCapita: { medical: 23000, support:  8000, care:  8500 }, household: { medical: 18000, support:  8000, care: 6200 } } },
  { cityCode: "04213", citySlug: "kurihara",         cityName: "栗原市",     rates: { rate: { medical: 0.0692, support: 0.0296, care: 0.0244 }, perCapita: { medical: 27500, support: 11300, care: 10600 }, household: { medical: 18700, support:  9100, care: 6300 } } },
  { cityCode: "04214", citySlug: "higashimatsushima",cityName: "東松島市",   rates: { rate: { medical: 0.0633, support: 0.0261, care: 0.0227 }, perCapita: { medical: 35000, support: 13000, care: 13000 }, household: { medical: 26000, support: 10000, care: 7000 } } },
  { cityCode: "04215", citySlug: "osakishi",         cityName: "大崎市",     rates: { rate: { medical: 0.0580, support: 0.0225, care: 0.0226 }, perCapita: { medical: 20700, support:  8000, care:  9600 }, household: { medical: 15800, support:  5800, care: 4700 } } },
  { cityCode: "04216", citySlug: "tomiya",           cityName: "富谷市",     rates: { rate: { medical: 0.0550, support: 0.0165, care: 0.0175 }, perCapita: { medical: 22700, support:  7300, care:  9500 }, household: { medical: 20200, support:  6600, care: 7000 } } },

  // ── 町村（21町村）───────────────────────────────────────────

  { cityCode: "04301", citySlug: "zao",              cityName: "蔵王町",     rates: { rate: { medical: 0.0600, support: 0.0200, care: 0.0130 }, perCapita: { medical: 22000, support:  7000, care:  5900 }, household: { medical: 12400, support:  4000, care: 3100 } } },
  { cityCode: "04302", citySlug: "shichigashuku",    cityName: "七ヶ宿町",   rates: { rate: { medical: 0.0680, support: 0.0100, care: 0.0200 }, perCapita: { medical: 26800, support:  4000, care:  8800 }, household: { medical: 17200, support:  2600, care: 4200 } } },
  { cityCode: "04321", citySlug: "ogawara",          cityName: "大河原町",   rates: { rate: { medical: 0.0680, support: 0.0200, care: 0.0170 }, perCapita: { medical: 22500, support:  7000, care:  8500 }, household: { medical: 23000, support:  6500, care: 6000 } } },
  { cityCode: "04322", citySlug: "murata",           cityName: "村田町",     rates: { rate: { medical: 0.0638, support: 0.0237, care: 0.0253 }, perCapita: { medical: 22000, support:  8000, care: 13000 }, household: { medical: 16000, support:  5000, care: 6000 } } },
  { cityCode: "04323", citySlug: "shibatacho",       cityName: "柴田町",     rates: { rate: { medical: 0.0610, support: 0.0250, care: 0.0185 }, perCapita: { medical: 21500, support:  8000, care:  8000 }, household: { medical: 23500, support:  9000, care: 4500 } } },
  { cityCode: "04324", citySlug: "kawasakimiyagi",   cityName: "川崎町",     rates: { rate: { medical: 0.0770, support: 0.0300, care: 0.0140 }, perCapita: { medical: 29500, support: 12000, care:  7000 }, household: { medical: 12500, support:  5000, care: 3000 } } },
  { cityCode: "04341", citySlug: "marumori",         cityName: "丸森町",     rates: { rate: { medical: 0.0520, support: 0.0413, care: 0.0164 }, perCapita: { medical: 19800, support: 11300, care:  9100 }, household: { medical: 16400, support:  9400, care: 5200 } } },
  { cityCode: "04361", citySlug: "watari",           cityName: "亘理町",     rates: { rate: { medical: 0.0640, support: 0.0250, care: 0.0220 }, perCapita: { medical: 25000, support: 10000, care: 11500 }, household: { medical: 17000, support:  7000, care: 5000 } } },
  { cityCode: "04362", citySlug: "yamamoto",         cityName: "山元町",     rates: { rate: { medical: 0.0720, support: 0.0290, care: 0.0230 }, perCapita: { medical: 30000, support: 12000, care: 12000 }, household: { medical: 20000, support:  8000, care: 5500 } } },
  { cityCode: "04401", citySlug: "matsushima",       cityName: "松島町",     rates: { rate: { medical: 0.0660, support: 0.0240, care: 0.0240 }, perCapita: { medical: 18000, support:  6600, care:  7500 }, household: { medical: 13800, support:  5200, care: 4000 } } },
  { cityCode: "04404", citySlug: "shichigahama",     cityName: "七ヶ浜町",   rates: { rate: { medical: 0.0655, support: 0.0255, care: 0.0220 }, perCapita: { medical: 25600, support:  9200, care: 11000 }, household: { medical: 19200, support:  7100, care: 6000 } } },
  { cityCode: "04406", citySlug: "rifu",             cityName: "利府町",     rates: { rate: { medical: 0.0760, support: 0.0310, care: 0.0260 }, perCapita: { medical: 33000, support: 13000, care: 12800 }, household: { medical: 22000, support:  9000, care: 6500 } } },
  { cityCode: "04421", citySlug: "taiwa",            cityName: "大和町",     rates: { rate: { medical: 0.0630, support: 0.0270, care: 0.0230 }, perCapita: { medical: 24400, support: 10700, care: 11100 }, household: { medical: 17900, support:  7800, care: 5900 } } },
  { cityCode: "04422", citySlug: "osato",            cityName: "大郷町",     rates: { rate: { medical: 0.0620, support: 0.0220, care: 0.0200 }, perCapita: { medical: 23000, support:  8500, care:  9300 }, household: { medical: 17000, support:  6000, care: 4700 } } },
  { cityCode: "04424", citySlug: "ohira",            cityName: "大衡村",     rates: { rate: { medical: 0.0590, support: 0.0200, care: 0.0190 }, perCapita: { medical: 24000, support:  8400, care: 11000 }, household: { medical: 18000, support:  6000, care: 5000 } } },
  { cityCode: "04444", citySlug: "shikama",          cityName: "色麻町",     rates: { rate: { medical: 0.0660, support: 0.0250, care: 0.0210 }, perCapita: { medical: 25200, support:  7200, care:  8400 }, household: { medical: 18000, support:  7200, care: 6000 } } },
  { cityCode: "04445", citySlug: "kami",             cityName: "加美町",     rates: { rate: { medical: 0.0760, support: 0.0190, care: 0.0150 }, perCapita: { medical: 22800, support:  6000, care:  7200 }, household: { medical: 17000, support:  8400, care: 6000 } } },
  { cityCode: "04501", citySlug: "wakuya",           cityName: "涌谷町",     rates: { rate: { medical: 0.0700, support: 0.0400, care: 0.0280 }, perCapita: { medical: 17000, support:  7000, care:  8000 }, household: { medical: 23000, support:  9000, care: 7000 } } },
  { cityCode: "04505", citySlug: "misatomiyagi",     cityName: "美里町",     rates: { rate: { medical: 0.0750, support: 0.0285, care: 0.0235 }, perCapita: { medical: 28000, support: 10000, care: 11000 }, household: { medical: 21500, support:  8000, care: 6500 } } },
  { cityCode: "04581", citySlug: "onagawa",          cityName: "女川町",     rates: { rate: { medical: 0.0520, support: 0.0260, care: 0.0250 }, perCapita: { medical: 19100, support:  8600, care: 10800 }, household: { medical: 22800, support: 10200, care: 8800 } } },
  { cityCode: "04606", citySlug: "minamisanriku",    cityName: "南三陸町",   rates: { rate: { medical: 0.0600, support: 0.0230, care: 0.0180 }, perCapita: { medical: 27000, support: 11000, care: 12000 }, household: { medical: 22000, support:  8000, care: 5000 } } },
];
