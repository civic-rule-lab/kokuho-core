/**
 * 石川県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典（各市町村公式サイト・石川県資料）:
 *   金沢市:    https://www4.city.kanazawa.lg.jp/11130/kokuho/zeiritu.html
 *   七尾市:    https://www.city.nanao.lg.jp/kenko/kokuho/hokenzei/
 *   小松市:    https://www.city.komatsu.lg.jp/soshiki/1036/kokuminkenkouhoken/kokuhozei/2301.html
 *   輪島市:    https://www.city.wajima.ishikawa.jp/docs/2026030200027/
 *   珠洲市:    https://www.city.suzu.lg.jp/soshiki/4/1282.html
 *   加賀市:    （kokuho-keisan.com参照）
 *   羽咋市:    https://www.city.hakui.lg.jp/soshiki/shiminfukushibu/shimin/5/2/2402.html
 *   かほく市:  https://www.city.kahoku.lg.jp/003/352/356/d010256.html
 *   白山市:    https://www.city.hakusan.lg.jp/kurashi/kenpo/1006695/1006697/1001490.html
 *   能美市:    （第三者サイト参照）
 *   野々市市:  （第三者サイト参照）
 *   川北町:    https://www.town.kawakita.ishikawa.jp/gyosei1/jumin/entry-266.html
 *   津幡町:    石川県R6資料参照
 *   内灘町:    https://www.town.uchinada.lg.jp/soshiki/hokennenkin/1407.html
 *   志賀町:    石川県R6資料参照
 *   宝達志水町: 石川県R6資料参照
 *   中能登町:  石川県R6資料参照
 *   穴水町:    石川県R6資料参照
 *   能登町:    https://www.town.noto.lg.jp/kakuka/1004/gyomu/2/4/1108.html
 *   石川県運営協議会資料: https://www.pref.ishikawa.lg.jp/iryou/kokuhounkyour6.html
 *
 * 使用: node scripts/generate-pref-kokuho.js ishikawa
 *
 * 特記事項:
 *   - 全19市町村 令和7年度実際の保険税率を使用
 *   - 資産割なし（全市町村）
 *   - 金沢市: 保険「料」方式（計算構造は同一）
 *   - 津幡町・志賀町・宝達志水町・中能登町・穴水町: R6税率を使用（R7公式未確認）
 *   - 宝達志水町: 介護分は2方式（所得割＋均等割のみ、平等割なし）
 *   - 賦課限度額:
 *       全国標準（660/260/170万）: 七尾市・輪島市・羽咋市・かほく市・白山市・能美市・川北町・内灘町・能登町・志賀町・中能登町・穴水町・宝達志水町
 *       650/240/170万: 金沢市・小松市・野々市市・津幡町
 *       650/220/170万: 加賀市
 *       630/200/170万: 珠洲市
 */

export const PREF_NAME = "石川県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

const CAPS_65_24 = { medical: 650000, support: 240000, care: 170000 };
const CAPS_65_22 = { medical: 650000, support: 220000, care: 170000 };
const CAPS_63_20 = { medical: 630000, support: 200000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 石川県 全19市町村（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（11市）───────────────────────────────────────────────

  { cityCode: "17201", citySlug: "kanazawa",        cityName: "金沢市",     caps: CAPS_65_24, note: "保険料方式。R7公式確認中（R6据え置きの可能性）。", rates: { rate: { medical: 0.0740, support: 0.0258, care: 0.0234 }, perCapita: { medical: 24000, support: 10320, care: 11880 }, household: { medical: 19800, support: 6720, care: 6000 } } },
  { cityCode: "17202", citySlug: "nanao",           cityName: "七尾市",     caps: CAPS,       rates: { rate: { medical: 0.0650, support: 0.0240, care: 0.0210 }, perCapita: { medical: 26900, support:  9500, care: 10600 }, household: { medical: 17600, support: 6600, care: 5300 } } },
  { cityCode: "17203", citySlug: "komatsu",         cityName: "小松市",     caps: CAPS_65_24, rates: { rate: { medical: 0.0700, support: 0.0220, care: 0.0190 }, perCapita: { medical: 30600, support:  9800, care:  9900 }, household: { medical: 28700, support: 8600, care: 6700 } } },
  { cityCode: "17204", citySlug: "wajima",          cityName: "輪島市",     caps: CAPS,       rates: { rate: { medical: 0.0700, support: 0.0275, care: 0.0238 }, perCapita: { medical: 28000, support: 11200, care: 12200 }, household: { medical: 20000, support: 7300, care: 6000 } } },
  { cityCode: "17205", citySlug: "suzu",            cityName: "珠洲市",     caps: CAPS_63_20, rates: { rate: { medical: 0.0700, support: 0.0240, care: 0.0210 }, perCapita: { medical: 23500, support:  9800, care: 11000 }, household: { medical: 21300, support: 6800, care: 5500 } } },
  { cityCode: "17206", citySlug: "kaga",            cityName: "加賀市",     caps: CAPS_65_22, rates: { rate: { medical: 0.0736, support: 0.0220, care: 0.0188 }, perCapita: { medical: 27600, support:  8900, care:  9700 }, household: { medical: 20800, support: 6200, care: 4400 } } },
  { cityCode: "17207", citySlug: "hakui",           cityName: "羽咋市",     caps: CAPS,       rates: { rate: { medical: 0.0750, support: 0.0260, care: 0.0220 }, perCapita: { medical: 30000, support: 10000, care: 11000 }, household: { medical: 19000, support: 7000, care: 6000 } } },
  { cityCode: "17209", citySlug: "kahoku",          cityName: "かほく市",   caps: CAPS,       rates: { rate: { medical: 0.0842, support: 0.0265, care: 0.0232 }, perCapita: { medical: 35400, support: 10900, care: 11800 }, household: { medical: 23400, support: 7200, care: 5800 } } },
  { cityCode: "17210", citySlug: "hakusan",         cityName: "白山市",     caps: CAPS,       rates: { rate: { medical: 0.0755, support: 0.0200, care: 0.0190 }, perCapita: { medical: 32100, support:  8300, care:  9800 }, household: { medical: 29000, support: 6300, care: 6500 } } },
  { cityCode: "17211", citySlug: "nomi",            cityName: "能美市",     caps: CAPS,       rates: { rate: { medical: 0.0764, support: 0.0239, care: 0.0211 }, perCapita: { medical: 32100, support:  9900, care: 10800 }, household: { medical: 21300, support: 6600, care: 5300 } } },
  { cityCode: "17212", citySlug: "nonoichi",        cityName: "野々市市",   caps: CAPS_65_24, rates: { rate: { medical: 0.0803, support: 0.0290, care: 0.0252 }, perCapita: { medical: 33700, support: 11900, care: 12900 }, household: { medical: 22100, support: 7800, care: 6300 } } },

  // ── 町村（8町）────────────────────────────────────────────

  { cityCode: "17322", citySlug: "kawakita",        cityName: "川北町",     caps: CAPS,       rates: { rate: { medical: 0.0940, support: 0.0270, care: 0.0220 }, perCapita: { medical: 38000, support: 11000, care: 11000 }, household: { medical: 26000, support: 8000, care: 5000 } } },
  { cityCode: "17361", citySlug: "tsubata",         cityName: "津幡町",     caps: CAPS_65_24, note: "R6税率を使用。R7公式未確認。", rates: { rate: { medical: 0.0712, support: 0.0239, care: 0.0199 }, perCapita: { medical: 28700, support:  9600, care: 10200 }, household: { medical: 20100, support: 6700, care: 5100 } } },
  { cityCode: "17362", citySlug: "uchinada",        cityName: "内灘町",     caps: CAPS,       rates: { rate: { medical: 0.0866, support: 0.0276, care: 0.0243 }, perCapita: { medical: 37800, support: 11400, care: 12000 }, household: { medical: 24600, support: 7200, care: 6000 } } },
  { cityCode: "17384", citySlug: "shika",           cityName: "志賀町",     caps: CAPS,       note: "R6税率を使用。R7公式未確認。", rates: { rate: { medical: 0.0650, support: 0.0240, care: 0.0190 }, perCapita: { medical: 27000, support:  9600, care:  9000 }, household: { medical: 18000, support: 6700, care: 5100 } } },
  { cityCode: "17386", citySlug: "hodatsushimizu", cityName: "宝達志水町", caps: CAPS,       note: "R6税率を使用。R7公式未確認。介護分は2方式（平等割なし）。", rates: { rate: { medical: 0.0700, support: 0.0185, care: 0.0150 }, perCapita: { medical: 22000, support:  7500, care: 10600 }, household: { medical: 20500, support: 5500, care: 0 } } },
  { cityCode: "17407", citySlug: "nakanoto",        cityName: "中能登町",   caps: CAPS,       note: "R6税率を使用。R7公式未確認。", rates: { rate: { medical: 0.0650, support: 0.0220, care: 0.0170 }, perCapita: { medical: 26300, support:  9200, care:  8900 }, household: { medical: 18400, support: 6400, care: 4000 } } },
  { cityCode: "17461", citySlug: "anamizu",         cityName: "穴水町",     caps: CAPS,       note: "R6税率を使用。R7公式未確認。", rates: { rate: { medical: 0.0730, support: 0.0210, care: 0.0180 }, perCapita: { medical: 25500, support:  8400, care:  8400 }, household: { medical: 26400, support: 5400, care: 4500 } } },
  { cityCode: "17463", citySlug: "notocho",         cityName: "能登町",     caps: CAPS,       rates: { rate: { medical: 0.0700, support: 0.0240, care: 0.0200 }, perCapita: { medical: 28000, support: 10000, care: 11000 }, household: { medical: 20000, support: 7000, care: 6000 } } },
];
