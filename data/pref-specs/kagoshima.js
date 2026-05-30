/**
 * 鹿児島県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 鹿児島県保健福祉部国民健康保険課
 *   https://www.pref.kagoshima.jp/ae02/kokuhonouhukintou.html
 *   PDF: https://www.pref.kagoshima.jp/ae02/documents/64057_20250206171210-1.pdf
 *   令和7年3月25日確定
 *
 * 使用: node scripts/generate-pref-kokuho.js kagoshima
 *
 * 特記事項:
 *   - 全43市町村 3方式（所得割+均等割+平等割）
 *   - 資産割なし（全市町村）
 *   - 賦課限度額: 医療65万円・後期24万円・介護17万円（旧水準）
 *   - slug競合:
 *       出水市   → izumishi    （大阪府和泉市が izumi を使用）
 *       瀬戸内町 → setouchicho （岡山県瀬戸内市が setouchi を使用）
 */

export const PREF_NAME = "鹿児島県";

export const CAPS = { medical: 650000, support: 240000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 鹿児島県 全43市町村（令和7年度 標準保険料率）
// 全市町村 3方式（所得割+均等割+平等割）/ 資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（19市）───────────────────────────────────────────────

  { cityCode: "46201", citySlug: "kagoshima",      cityName: "鹿児島市",       rates: { rate: { medical: 0.0816, support: 0.0300, care: 0.0255 }, perCapita: { medical: 34904, support: 12594, care: 12724 }, household: { medical: 22610, support: 8158, care: 6332 } } },
  { cityCode: "46203", citySlug: "kanoya",          cityName: "鹿屋市",         rates: { rate: { medical: 0.0649, support: 0.0287, care: 0.0253 }, perCapita: { medical: 27735, support: 12048, care: 12602 }, household: { medical: 17966, support: 7804, care: 6271 } } },
  { cityCode: "46204", citySlug: "makurazaki",      cityName: "枕崎市",         rates: { rate: { medical: 0.0790, support: 0.0290, care: 0.0244 }, perCapita: { medical: 33782, support: 12173, care: 12195 }, household: { medical: 21883, support: 7885, care: 6068 } } },
  { cityCode: "46206", citySlug: "akune",           cityName: "阿久根市",       rates: { rate: { medical: 0.0692, support: 0.0291, care: 0.0250 }, perCapita: { medical: 29598, support: 12219, care: 12468 }, household: { medical: 19173, support: 7915, care: 6204 } } },
  { cityCode: "46208", citySlug: "izumishi",        cityName: "出水市",         rates: { rate: { medical: 0.0506, support: 0.0285, care: 0.0245 }, perCapita: { medical: 21627, support: 11969, care: 12208 }, household: { medical: 14009, support: 7753, care: 6074 } } },
  { cityCode: "46210", citySlug: "ibusuki",         cityName: "指宿市",         rates: { rate: { medical: 0.0709, support: 0.0288, care: 0.0244 }, perCapita: { medical: 30331, support: 12111, care: 12159 }, household: { medical: 19648, support: 7845, care: 6050 } } },
  { cityCode: "46213", citySlug: "nishinoomote",    cityName: "西之表市",       rates: { rate: { medical: 0.0657, support: 0.0284, care: 0.0244 }, perCapita: { medical: 28112, support: 11963, care: 12158 }, household: { medical: 18211, support: 7749, care: 6050 } } },
  { cityCode: "46214", citySlug: "tarumizu",        cityName: "垂水市",         rates: { rate: { medical: 0.0657, support: 0.0285, care: 0.0247 }, perCapita: { medical: 28104, support: 11990, care: 12319 }, household: { medical: 18205, support: 7767, care: 6130 } } },
  { cityCode: "46215", citySlug: "satsumasendai",   cityName: "薩摩川内市",     rates: { rate: { medical: 0.0775, support: 0.0296, care: 0.0254 }, perCapita: { medical: 33155, support: 12432, care: 12662 }, household: { medical: 21477, support: 8053, care: 6301 } } },
  { cityCode: "46216", citySlug: "hioki",           cityName: "日置市",         rates: { rate: { medical: 0.0763, support: 0.0282, care: 0.0245 }, perCapita: { medical: 32626, support: 11853, care: 12202 }, household: { medical: 21134, support: 7678, care: 6071 } } },
  { cityCode: "46217", citySlug: "soo",             cityName: "曽於市",         rates: { rate: { medical: 0.0770, support: 0.0299, care: 0.0250 }, perCapita: { medical: 32906, support: 12558, care: 12479 }, household: { medical: 21316, support: 8135, care: 6210 } } },
  { cityCode: "46218", citySlug: "kirishima",       cityName: "霧島市",         rates: { rate: { medical: 0.0680, support: 0.0287, care: 0.0245 }, perCapita: { medical: 29092, support: 12068, care: 12205 }, household: { medical: 18845, support: 7817, care: 6073 } } },
  { cityCode: "46219", citySlug: "ichikushikino",   cityName: "いちき串木野市", rates: { rate: { medical: 0.0815, support: 0.0291, care: 0.0246 }, perCapita: { medical: 34844, support: 12226, care: 12286 }, household: { medical: 22571, support: 7920, care: 6113 } } },
  { cityCode: "46220", citySlug: "minamisatsuma",   cityName: "南さつま市",     rates: { rate: { medical: 0.0769, support: 0.0288, care: 0.0250 }, perCapita: { medical: 32890, support: 12119, care: 12459 }, household: { medical: 21305, support: 7850, care: 6200 } } },
  { cityCode: "46221", citySlug: "shibushi",        cityName: "志布志市",       rates: { rate: { medical: 0.0664, support: 0.0291, care: 0.0238 }, perCapita: { medical: 28411, support: 12256, care: 11863 }, household: { medical: 18404, support: 7939, care: 5903 } } },
  { cityCode: "46222", citySlug: "amami",           cityName: "奄美市",         rates: { rate: { medical: 0.0625, support: 0.0291, care: 0.0238 }, perCapita: { medical: 26734, support: 12218, care: 11885 }, household: { medical: 17317, support: 7915, care: 5914 } } },
  { cityCode: "46223", citySlug: "minamikyshu",     cityName: "南九州市",       rates: { rate: { medical: 0.0792, support: 0.0288, care: 0.0243 }, perCapita: { medical: 33874, support: 12131, care: 12140 }, household: { medical: 21943, support: 7858, care: 6041 } } },
  { cityCode: "46224", citySlug: "isa",             cityName: "伊佐市",         rates: { rate: { medical: 0.0632, support: 0.0299, care: 0.0250 }, perCapita: { medical: 27045, support: 12573, care: 12490 }, household: { medical: 17519, support: 8145, care: 6215 } } },
  { cityCode: "46225", citySlug: "aira",            cityName: "姶良市",         rates: { rate: { medical: 0.0813, support: 0.0285, care: 0.0251 }, perCapita: { medical: 34762, support: 11970, care: 12542 }, household: { medical: 22518, support: 7754, care: 6241 } } },

  // ── 町村（24町村）───────────────────────────────────────────

  { cityCode: "46303", citySlug: "mishimamura",     cityName: "三島村",         rates: { rate: { medical: 0.0541, support: 0.0311, care: 0.0275 }, perCapita: { medical: 23113, support: 13087, care: 13713 }, household: { medical: 14972, support: 8478, care: 6823 } } },
  { cityCode: "46304", citySlug: "toshimamura",     cityName: "十島村",         rates: { rate: { medical: 0.0896, support: 0.0285, care: 0.0247 }, perCapita: { medical: 38320, support: 11977, care: 12331 }, household: { medical: 24823, support: 7758, care: 6136 } } },
  { cityCode: "46392", citySlug: "satsuma",         cityName: "さつま町",       rates: { rate: { medical: 0.0807, support: 0.0281, care: 0.0243 }, perCapita: { medical: 34495, support: 11796, care: 12123 }, household: { medical: 22345, support: 7641, care: 6032 } } },
  { cityCode: "46404", citySlug: "nagashima",       cityName: "長島町",         rates: { rate: { medical: 0.0555, support: 0.0287, care: 0.0244 }, perCapita: { medical: 23731, support: 12077, care: 12166 }, household: { medical: 15373, support: 7823, care: 6054 } } },
  { cityCode: "46452", citySlug: "yusui",           cityName: "湧水町",         rates: { rate: { medical: 0.0775, support: 0.0284, care: 0.0242 }, perCapita: { medical: 33161, support: 11949, care: 12056 }, household: { medical: 21481, support: 7741, care: 5999 } } },
  { cityCode: "46468", citySlug: "osaki",           cityName: "大崎町",         rates: { rate: { medical: 0.0676, support: 0.0282, care: 0.0243 }, perCapita: { medical: 28926, support: 11866, care: 12137 }, household: { medical: 18737, support: 7687, care: 6039 } } },
  { cityCode: "46482", citySlug: "higashikushira",  cityName: "東串良町",       rates: { rate: { medical: 0.0686, support: 0.0286, care: 0.0239 }, perCapita: { medical: 29325, support: 12020, care: 11928 }, household: { medical: 18996, support: 7786, care: 5935 } } },
  { cityCode: "46490", citySlug: "kinko",           cityName: "錦江町",         rates: { rate: { medical: 0.0687, support: 0.0283, care: 0.0233 }, perCapita: { medical: 29379, support: 11895, care: 11631 }, household: { medical: 19031, support: 7705, care: 5787 } } },
  { cityCode: "46491", citySlug: "minamiosumi",     cityName: "南大隅町",       rates: { rate: { medical: 0.0726, support: 0.0290, care: 0.0240 }, perCapita: { medical: 31030, support: 12204, care: 11960 }, household: { medical: 20100, support: 7905, care: 5951 } } },
  { cityCode: "46492", citySlug: "kimotsuki",       cityName: "肝付町",         rates: { rate: { medical: 0.0772, support: 0.0282, care: 0.0245 }, perCapita: { medical: 32991, support: 11860, care: 12209 }, household: { medical: 21371, support: 7683, care: 6075 } } },
  { cityCode: "46501", citySlug: "nakatane",        cityName: "中種子町",       rates: { rate: { medical: 0.0634, support: 0.0293, care: 0.0245 }, perCapita: { medical: 27093, support: 12324, care: 12244 }, household: { medical: 17550, support: 7983, care: 6093 } } },
  { cityCode: "46502", citySlug: "minamitane",      cityName: "南種子町",       rates: { rate: { medical: 0.0610, support: 0.0277, care: 0.0224 }, perCapita: { medical: 26091, support: 11637, care: 11169 }, household: { medical: 16901, support: 7538, care: 5558 } } },
  { cityCode: "46505", citySlug: "yakushima",       cityName: "屋久島町",       rates: { rate: { medical: 0.0654, support: 0.0288, care: 0.0249 }, perCapita: { medical: 27947, support: 12110, care: 12431 }, household: { medical: 18104, support: 7844, care: 6186 } } },
  { cityCode: "46523", citySlug: "yamatomura",      cityName: "大和村",         rates: { rate: { medical: 0.0516, support: 0.0284, care: 0.0255 }, perCapita: { medical: 22055, support: 11959, care: 12701 }, household: { medical: 14287, support: 7747, care: 6320 } } },
  { cityCode: "46524", citySlug: "uken",            cityName: "宇検村",         rates: { rate: { medical: 0.0459, support: 0.0281, care: 0.0240 }, perCapita: { medical: 19640, support: 11820, care: 11974 }, household: { medical: 12723, support: 7657, care: 5958 } } },
  { cityCode: "46525", citySlug: "setouchicho",     cityName: "瀬戸内町",       rates: { rate: { medical: 0.0647, support: 0.0293, care: 0.0243 }, perCapita: { medical: 27656, support: 12302, care: 12117 }, household: { medical: 17915, support: 7969, care: 6029 } } },
  { cityCode: "46527", citySlug: "tatsugou",        cityName: "龍郷町",         rates: { rate: { medical: 0.0367, support: 0.0283, care: 0.0245 }, perCapita: { medical: 15682, support: 11879, care: 12221 }, household: { medical: 10158, support: 7695, care: 6081 } } },
  { cityCode: "46529", citySlug: "kikai",           cityName: "喜界町",         rates: { rate: { medical: 0.0502, support: 0.0292, care: 0.0247 }, perCapita: { medical: 21486, support: 12281, care: 12317 }, household: { medical: 13918, support: 7956, care: 6129 } } },
  { cityCode: "46530", citySlug: "tokunoshima",     cityName: "徳之島町",       rates: { rate: { medical: 0.0547, support: 0.0286, care: 0.0250 }, perCapita: { medical: 23374, support: 12043, care: 12472 }, household: { medical: 15141, support: 7801, care: 6206 } } },
  { cityCode: "46531", citySlug: "amagi",           cityName: "天城町",         rates: { rate: { medical: 0.0473, support: 0.0294, care: 0.0267 }, perCapita: { medical: 20220, support: 12360, care: 13344 }, household: { medical: 13098, support: 8006, care: 6640 } } },
  { cityCode: "46532", citySlug: "isen",            cityName: "伊仙町",         rates: { rate: { medical: 0.0408, support: 0.0306, care: 0.0266 }, perCapita: { medical: 17441, support: 12865, care: 13253 }, household: { medical: 11298, support: 8334, care: 6595 } } },
  { cityCode: "46533", citySlug: "wadomari",        cityName: "和泊町",         rates: { rate: { medical: 0.0700, support: 0.0289, care: 0.0243 }, perCapita: { medical: 29914, support: 12142, care: 12126 }, household: { medical: 19377, support: 7865, care: 6034 } } },
  { cityCode: "46534", citySlug: "china",           cityName: "知名町",         rates: { rate: { medical: 0.0718, support: 0.0286, care: 0.0241 }, perCapita: { medical: 30701, support: 12021, care: 12035 }, household: { medical: 19888, support: 7787, care: 5989 } } },
  { cityCode: "46535", citySlug: "yoron",           cityName: "与論町",         rates: { rate: { medical: 0.0506, support: 0.0284, care: 0.0239 }, perCapita: { medical: 21652, support: 11927, care: 11944 }, household: { medical: 14026, support: 7726, care: 5943 } } },
];
