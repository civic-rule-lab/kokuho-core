/**
 * 長崎県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 各市町公式サイト・5kuho.com
 * R7確認済: 長崎市・佐世保市・島原市・諫早市・大村市・平戸市・松浦市・対馬市
 *           五島市・西海市・雲仙市・南島原市・波佐見町
 * R6参考値: 壱岐市・長与町・時津町・東彼杵町・川棚町・新上五島町
 * 旧データ: 小値賀町・佐々町
 *
 * 使用: node scripts/generate-pref-kokuho.js nagasaki
 *
 * 特記事項:
 *   - 全21市町 3方式（所得割+均等割+平等割）
 *   - 資産割なし（全市町）
 *   - 賦課限度額: 全市町で全国標準（660/260/170万円）
 *   - 対馬市: tsushima が愛知県津島市と競合 → tsushimashi
 */

export const PREF_NAME = "長崎県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

export const MUNICIPALITIES = [

  // ── 市（13市）───────────────────────────────────────────────

  // 長崎市 R7確認
  { cityCode: "42201", citySlug: "nagasaki",        cityName: "長崎市",    caps: CAPS, rates: { rate: { medical: 0.093,  support: 0.033,  care: 0.027  }, perCapita: { medical: 27700, support:  9700, care:  9500 }, household: { medical: 19800, support: 6900, care: 5400 } } },
  // 佐世保市 R7確認
  { cityCode: "42202", citySlug: "sasebo",           cityName: "佐世保市",  caps: CAPS, rates: { rate: { medical: 0.08,   support: 0.034,  care: 0.028  }, perCapita: { medical: 24600, support: 10600, care: 10600 }, household: { medical: 18000, support: 7300, care: 5000 } } },
  // 島原市 R7確認
  { cityCode: "42203", citySlug: "shimabara",        cityName: "島原市",    caps: CAPS, rates: { rate: { medical: 0.103,  support: 0.035,  care: 0.029  }, perCapita: { medical: 28600, support:  9800, care: 10900 }, household: { medical: 23200, support: 7600, care: 6100 } } },
  // 諫早市 R7確認
  { cityCode: "42204", citySlug: "isahaya",          cityName: "諫早市",    caps: CAPS, rates: { rate: { medical: 0.0914, support: 0.0349, care: 0.0282 }, perCapita: { medical: 30340, support: 11540, care: 11420 }, household: { medical: 20180, support: 7670, care: 5780 } } },
  // 大村市 R7確認
  { cityCode: "42205", citySlug: "omura",            cityName: "大村市",    caps: CAPS, rates: { rate: { medical: 0.086,  support: 0.03,   care: 0.022  }, perCapita: { medical: 23000, support:  9800, care:  8500 }, household: { medical: 22000, support: 10000, care: 6000 } } },
  // 平戸市 R7確認
  { cityCode: "42206", citySlug: "hirado",           cityName: "平戸市",    caps: CAPS, rates: { rate: { medical: 0.0935, support: 0.028,  care: 0.025  }, perCapita: { medical: 27000, support:  7800, care: 10000 }, household: { medical: 20400, support: 6100, care: 5600 } } },
  // 松浦市 R7確認
  { cityCode: "42207", citySlug: "matsuura",         cityName: "松浦市",    caps: CAPS, rates: { rate: { medical: 0.097,  support: 0.038,  care: 0.02   }, perCapita: { medical: 32000, support: 12000, care: 11000 }, household: { medical: 22000, support: 12000, care: 5600 } } },
  // 対馬市 R7確認（slug競合 tsushima→tsushimashi）
  { cityCode: "42208", citySlug: "tsushimashi",      cityName: "対馬市",    caps: CAPS, rates: { rate: { medical: 0.083,  support: 0.028,  care: 0.026  }, perCapita: { medical: 26000, support:  8500, care:  9700 }, household: { medical: 22000, support: 7300, care: 6000 } } },
  // 壱岐市 R6参考
  { cityCode: "42209", citySlug: "iki",              cityName: "壱岐市",    caps: CAPS, note: "R6参考値。R7実際値は要確認。", rates: { rate: { medical: 0.085,  support: 0.037,  care: 0.03   }, perCapita: { medical: 22100, support:  9800, care: 11000 }, household: { medical: 21600, support: 9300, care: 7300 } } },
  // 五島市 R7確認
  { cityCode: "42210", citySlug: "goto",             cityName: "五島市",    caps: CAPS, rates: { rate: { medical: 0.0808, support: 0.0354, care: 0.0211 }, perCapita: { medical: 20500, support:  8000, care:  8200 }, household: { medical: 15700, support: 6600, care: 4800 } } },
  // 西海市 R7確認
  { cityCode: "42211", citySlug: "saikai",           cityName: "西海市",    caps: CAPS, rates: { rate: { medical: 0.084,  support: 0.024,  care: 0.023  }, perCapita: { medical: 24000, support:  8000, care: 10000 }, household: { medical: 22000, support: 7000, care: 6000 } } },
  // 雲仙市 R7確認
  { cityCode: "42212", citySlug: "unzen",            cityName: "雲仙市",    caps: CAPS, rates: { rate: { medical: 0.089,  support: 0.031,  care: 0.026  }, perCapita: { medical: 28700, support: 11000, care: 11000 }, household: { medical: 27800, support: 9600, care: 7600 } } },
  // 南島原市 R7確認
  { cityCode: "42213", citySlug: "minamishimabara",  cityName: "南島原市",  caps: CAPS, rates: { rate: { medical: 0.095,  support: 0.03,   care: 0.026  }, perCapita: { medical: 27800, support:  8800, care:  9900 }, household: { medical: 24600, support: 8000, care: 8600 } } },

  // ── 町（8町）───────────────────────────────────────────────

  // 長与町 R6参考
  { cityCode: "42307", citySlug: "nagayo",           cityName: "長与町",    caps: CAPS, note: "R6参考値。R7実際値は要確認。", rates: { rate: { medical: 0.081,  support: 0.028,  care: 0.026  }, perCapita: { medical: 25600, support:  8800, care:  9500 }, household: { medical: 22800, support: 7600, care: 5800 } } },
  // 時津町 R6参考
  { cityCode: "42308", citySlug: "togitsu",          cityName: "時津町",    caps: CAPS, note: "R6参考値。R7実際値は要確認。", rates: { rate: { medical: 0.099,  support: 0.021,  care: 0.025  }, perCapita: { medical: 29900, support:  6700, care:  9900 }, household: { medical: 27200, support: 6500, care: 6900 } } },
  // 東彼杵町 R6参考
  { cityCode: "42321", citySlug: "higashisonogi",    cityName: "東彼杵町",  caps: CAPS, note: "R6参考値。R7実際値は要確認。", rates: { rate: { medical: 0.0926, support: 0.0281, care: 0.0223 }, perCapita: { medical: 29900, support:  9000, care:  9800 }, household: { medical: 22500, support: 7100, care: 5200 } } },
  // 川棚町 R6参考
  { cityCode: "42322", citySlug: "kawatana",         cityName: "川棚町",    caps: CAPS, note: "R6参考値。R7実際値は要確認。", rates: { rate: { medical: 0.099,  support: 0.0275, care: 0.0245 }, perCapita: { medical: 28500, support:  8400, care: 10000 }, household: { medical: 26000, support: 8600, care: 5400 } } },
  // 波佐見町 R7確認
  { cityCode: "42323", citySlug: "hasami",           cityName: "波佐見町",  caps: CAPS, rates: { rate: { medical: 0.092,  support: 0.029,  care: 0.024  }, perCapita: { medical: 26600, support:  9000, care:  9600 }, household: { medical: 25000, support: 8000, care: 6200 } } },
  // 小値賀町 旧データ参考
  { cityCode: "42383", citySlug: "ojika",            cityName: "小値賀町",  caps: CAPS, note: "旧データ参考値（R5頃）。R7実際値は要確認。", rates: { rate: { medical: 0.082,  support: 0.027,  care: 0.022  }, perCapita: { medical: 26000, support:  9000, care:  9000 }, household: { medical: 30000, support: 10000, care: 8000 } } },
  // 佐々町 旧データ参考
  { cityCode: "42391", citySlug: "saza",             cityName: "佐々町",    caps: CAPS, note: "旧データ参考値（R5頃）。R7実際値は要確認。", rates: { rate: { medical: 0.065,  support: 0.02,   care: 0.0225 }, perCapita: { medical: 23000, support:  5000, care: 10500 }, household: { medical: 23000, support: 6000, care: 5500 } } },
  // 新上五島町 R6参考
  { cityCode: "42411", citySlug: "shinkamigoto",     cityName: "新上五島町", caps: CAPS, note: "R6参考値。R7実際値は要確認。", rates: { rate: { medical: 0.08,   support: 0.0332, care: 0.0275 }, perCapita: { medical: 24782, support: 10923, care: 11177 }, household: { medical: 16481, support: 7255, care: 5616 } } },
];
