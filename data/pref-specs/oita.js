/**
 * 大分県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典（各市町村公式サイト）:
 *   大分市: https://www.city.oita.oita.jp/o052/kurashi/kokumin/1193625759256.html
 *   別府市: https://www.city.beppu.oita.jp/seikatu/hokennenkin/kokuminkenkouhoken/detail7.html
 *   中津市: https://www.city-nakatsu.jp/doc/2014071600074/
 *   日田市: https://www.city.hita.oita.jp/soshiki/somubu/zeimuka/shiminzei/zei_hoken/3422.html
 *   佐伯市: https://www.city.saiki.oita.jp/kiji0032145/index.html
 *   臼杵市: https://www.city.usuki.oita.jp/docs/2014020600070/
 *   津久見市: https://www.city.tsukumi.oita.jp/soshiki/4/86.html
 *   竹田市: https://www.city.taketa.oita.jp/soshiki/zeimuka/sizeinosyurui/251.html
 *   豊後高田市: https://www.city.bungotakada.oita.jp/soshiki/6/1630.html
 *   杵築市: https://www.city.kitsuki.lg.jp/material/files/group/8/R7kokuhotirasi.pdf
 *   宇佐市: https://www.city.usa.oita.jp/sougo/soshiki/11/zeimu/1/2/2/21416.html
 *   国東市: https://www.city.kunisaki.oita.jp/soshiki/shimin-kenko/kokuhozei.html
 *   由布市: https://www.city.yufu.oita.jp/kurashi/nenkinhoken/kokuminkenkouhoken/hokenzei
 *   日出町: https://www.town.hiji.lg.jp/iryo_kenko_fukushi/hoken_nenkin/kokuminkenkohoken/3817.html
 *   玖珠町: https://www.town.kusu.oita.jp/soshiki/zeimuka/2/3/2/981.html
 *
 * 使用: node scripts/generate-pref-kokuho.js oita
 *
 * 特記事項:
 *   - 全18市町村 令和7年度実際の保険税率を使用
 *   - 資産割なし（全市町村）
 *   - 賦課限度額: 全市町村で全国標準（660/260/170万円）
 *   - 豊後大野市・姫島村: 令和7年度公式情報未確認のため令和5年度データを参照（要確認）
 *   - 九重町: 令和7年度公式ページ未更新のため令和6年度税率を使用（限度額は令和7年度基準）
 */

export const PREF_NAME = "大分県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 大分県 全18市町村（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（14市）───────────────────────────────────────────────

  { cityCode: "44201", citySlug: "oita",        cityName: "大分市",     caps: CAPS, rates: { rate: { medical: 0.0865, support: 0.0249, care: 0.0250 }, perCapita: { medical: 26500, support:  7700, care:  8700 }, household: { medical: 25700, support: 6900, care: 5900 } } },
  { cityCode: "44202", citySlug: "beppu",       cityName: "別府市",     caps: CAPS, rates: { rate: { medical: 0.0930, support: 0.0240, care: 0.0272 }, perCapita: { medical: 25200, support:  7000, care:  9800 }, household: { medical: 20000, support: 4600, care: 7000 } } },
  { cityCode: "44203", citySlug: "nakatsu",     cityName: "中津市",     caps: CAPS, rates: { rate: { medical: 0.0872, support: 0.0253, care: 0.0264 }, perCapita: { medical: 22700, support:  7400, care:  9200 }, household: { medical: 17700, support: 5000, care: 4700 } } },
  { cityCode: "44204", citySlug: "hita",        cityName: "日田市",     caps: CAPS, rates: { rate: { medical: 0.0834, support: 0.0315, care: 0.0226 }, perCapita: { medical: 24800, support:  9100, care:  9600 }, household: { medical: 18500, support: 6800, care: 5100 } } },
  { cityCode: "44205", citySlug: "saiki",       cityName: "佐伯市",     caps: CAPS, rates: { rate: { medical: 0.0950, support: 0.0216, care: 0.0183 }, perCapita: { medical: 26000, support:  6600, care:  7900 }, household: { medical: 23000, support: 5100, care: 4500 } } },
  { cityCode: "44206", citySlug: "usuki",       cityName: "臼杵市",     caps: CAPS, rates: { rate: { medical: 0.0950, support: 0.0210, care: 0.0195 }, perCapita: { medical: 22500, support:  6100, care:  7300 }, household: { medical: 20000, support: 4500, care: 4500 } } },
  { cityCode: "44207", citySlug: "tsukumi",     cityName: "津久見市",   caps: CAPS, rates: { rate: { medical: 0.0950, support: 0.0250, care: 0.0183 }, perCapita: { medical: 26000, support:  7300, care:  6600 }, household: { medical: 17600, support: 4800, care: 4000 } } },
  { cityCode: "44208", citySlug: "taketa",      cityName: "竹田市",     caps: CAPS, rates: { rate: { medical: 0.0960, support: 0.0343, care: 0.0307 }, perCapita: { medical: 28500, support: 10100, care: 10900 }, household: { medical: 18600, support: 6600, care: 5400 } } },
  { cityCode: "44209", citySlug: "bungotakada", cityName: "豊後高田市", caps: CAPS, rates: { rate: { medical: 0.1040, support: 0.0250, care: 0.0185 }, perCapita: { medical: 28000, support:  6500, care:  7400 }, household: { medical: 22300, support: 5200, care: 4700 } } },
  { cityCode: "44210", citySlug: "kitsuki",     cityName: "杵築市",     caps: CAPS, rates: { rate: { medical: 0.1050, support: 0.0280, care: 0.0250 }, perCapita: { medical: 26000, support:  7000, care:  8500 }, household: { medical: 22000, support: 5700, care: 5500 } } },
  { cityCode: "44211", citySlug: "usa",         cityName: "宇佐市",     caps: CAPS, rates: { rate: { medical: 0.0900, support: 0.0332, care: 0.0306 }, perCapita: { medical: 23500, support:  9100, care: 10100 }, household: { medical: 18500, support: 6100, care: 5100 } } },
  { cityCode: "44212", citySlug: "bungoono",    cityName: "豊後大野市", caps: CAPS, note: "R5データ参照。R7要確認。", rates: { rate: { medical: 0.0950, support: 0.0290, care: 0.0270 }, perCapita: { medical: 24000, support:  8600, care:  8800 }, household: { medical: 19000, support: 6600, care: 5000 } } },
  { cityCode: "44213", citySlug: "yufu",        cityName: "由布市",     caps: CAPS, rates: { rate: { medical: 0.0992, support: 0.0349, care: 0.0326 }, perCapita: { medical: 30000, support: 10500, care: 11500 }, household: { medical: 19300, support: 6800, care: 5700 } } },
  { cityCode: "44214", citySlug: "kunisaki",    cityName: "国東市",     caps: CAPS, rates: { rate: { medical: 0.0840, support: 0.0250, care: 0.0220 }, perCapita: { medical: 23600, support:  7900, care:  8300 }, household: { medical: 16200, support: 7200, care: 5800 } } },

  // ── 町村（4町村）───────────────────────────────────────────

  { cityCode: "44322", citySlug: "himeshima",   cityName: "姫島村",     caps: CAPS, note: "R5データ参照。R7要確認。", rates: { rate: { medical: 0.0672, support: 0.0212, care: 0.0116 }, perCapita: { medical: 17400, support:  5600, care:  4000 }, household: { medical: 14900, support: 4600, care: 2700 } } },
  { cityCode: "44341", citySlug: "hiji",        cityName: "日出町",     caps: CAPS, rates: { rate: { medical: 0.0902, support: 0.0308, care: 0.0286 }, perCapita: { medical: 29400, support:  9800, care: 10700 }, household: { medical: 24000, support: 8000, care: 6600 } } },
  { cityCode: "44461", citySlug: "kokonoe",     cityName: "九重町",     caps: CAPS, note: "R6税率を使用。R7公式ページ要確認。", rates: { rate: { medical: 0.0980, support: 0.0350, care: 0.0310 }, perCapita: { medical: 29500, support: 10000, care: 10500 }, household: { medical: 26000, support: 7600, care: 6400 } } },
  { cityCode: "44462", citySlug: "kusu",        cityName: "玖珠町",     caps: CAPS, rates: { rate: { medical: 0.0985, support: 0.0280, care: 0.0230 }, perCapita: { medical: 28000, support:  8100, care:  9000 }, household: { medical: 26000, support: 6800, care: 5500 } } },
];
