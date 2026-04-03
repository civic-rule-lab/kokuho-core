/**
 * 山口県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 山口県「令和7年度 標準保険料率・実保険料率比較表」
 *   https://www.pref.yamaguchi.lg.jp/soshiki/46/18915.html
 *   比較表PDF: https://www.pref.yamaguchi.lg.jp/uploaded/attachment/232306.pdf
 *
 * 使用: node scripts/generate-pref-kokuho.js yamaguchi
 *
 * 特記事項:
 *   - 全19市町 実際の保険料（税）率を使用
 *   - 全市町 3方式（所得割+均等割+平等割）
 *   - 資産割なし（全市町）
 *   - 賦課限度額: 全市町で全国標準（660/260/170万円）
 *   - slug競合なし
 */

export const PREF_NAME = "山口県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 山口県 全19市町（令和7年度 実際の保険料（税）率）
// 全市町 3方式（所得割+均等割+平等割）/ 資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（13市）───────────────────────────────────────────────

  { cityCode: "35201", citySlug: "shimonoseki", cityName: "下関市",       caps: CAPS, rates: { rate: { medical: 0.0880, support: 0.0280, care: 0.0270 }, perCapita: { medical: 25000, support:  8100, care:  8800 }, household: { medical: 21900, support: 7100, care: 5800 } } },
  { cityCode: "35202", citySlug: "ube",          cityName: "宇部市",       caps: CAPS, rates: { rate: { medical: 0.0950, support: 0.0300, care: 0.0250 }, perCapita: { medical: 25700, support:  8500, care:  8500 }, household: { medical: 21900, support: 7300, care: 5500 } } },
  { cityCode: "35203", citySlug: "yamaguchi",    cityName: "山口市",       caps: CAPS, rates: { rate: { medical: 0.0930, support: 0.0300, care: 0.0310 }, perCapita: { medical: 24600, support:  8200, care:  9200 }, household: { medical: 23000, support: 7400, care: 6100 } } },
  { cityCode: "35204", citySlug: "hagi",         cityName: "萩市",         caps: CAPS, rates: { rate: { medical: 0.0774, support: 0.0239, care: 0.0215 }, perCapita: { medical: 27100, support:  8500, care:  9400 }, household: { medical: 21000, support: 6500, care: 5400 } } },
  { cityCode: "35205", citySlug: "hofu",         cityName: "防府市",       caps: CAPS, rates: { rate: { medical: 0.0830, support: 0.0170, care: 0.0220 }, perCapita: { medical: 30200, support:  6300, care:  9400 }, household: { medical: 26400, support: 5400, care: 6000 } } },
  { cityCode: "35206", citySlug: "kudamatsu",    cityName: "下松市",       caps: CAPS, rates: { rate: { medical: 0.0730, support: 0.0270, care: 0.0270 }, perCapita: { medical: 23000, support:  7500, care:  8900 }, household: { medical: 20000, support: 7500, care: 6000 } } },
  { cityCode: "35207", citySlug: "iwakuni",      cityName: "岩国市",       caps: CAPS, rates: { rate: { medical: 0.0880, support: 0.0220, care: 0.0220 }, perCapita: { medical: 24960, support:  6000, care:  6960 }, household: { medical: 21120, support: 4800, care: 4200 } } },
  { cityCode: "35208", citySlug: "hikari",       cityName: "光市",         caps: CAPS, rates: { rate: { medical: 0.0750, support: 0.0250, care: 0.0280 }, perCapita: { medical: 22200, support:  8100, care:  8700 }, household: { medical: 19800, support: 7600, care: 6000 } } },
  { cityCode: "35210", citySlug: "nagato",       cityName: "長門市",       caps: CAPS, rates: { rate: { medical: 0.0800, support: 0.0280, care: 0.0250 }, perCapita: { medical: 25200, support:  9000, care:  9900 }, household: { medical: 23400, support: 8400, care: 6300 } } },
  { cityCode: "35211", citySlug: "yanai",        cityName: "柳井市",       caps: CAPS, rates: { rate: { medical: 0.0740, support: 0.0250, care: 0.0250 }, perCapita: { medical: 25800, support:  8700, care:  8000 }, household: { medical: 20400, support: 7400, care: 6600 } } },
  { cityCode: "35212", citySlug: "mine",         cityName: "美祢市",       caps: CAPS, rates: { rate: { medical: 0.0620, support: 0.0250, care: 0.0190 }, perCapita: { medical: 27200, support: 10800, care:  9800 }, household: { medical: 17200, support: 6800, care: 4800 } } },
  { cityCode: "35214", citySlug: "shunan",       cityName: "周南市",       caps: CAPS, rates: { rate: { medical: 0.0722, support: 0.0264, care: 0.0233 }, perCapita: { medical: 25980, support:  9490, care: 10240 }, household: { medical: 21140, support: 7500, care: 6080 } } },
  { cityCode: "35215", citySlug: "sanyoonoda",   cityName: "山陽小野田市", caps: CAPS, rates: { rate: { medical: 0.0830, support: 0.0280, care: 0.0240 }, perCapita: { medical: 23400, support:  8000, care:  7700 }, household: { medical: 21000, support: 7100, care: 5100 } } },

  // ── 町（6町）───────────────────────────────────────────────

  { cityCode: "35305", citySlug: "suooshima",    cityName: "周防大島町",   caps: CAPS, rates: { rate: { medical: 0.0770, support: 0.0310, care: 0.0290 }, perCapita: { medical: 27200, support:  8900, care:  9300 }, household: { medical: 23900, support: 8900, care: 7000 } } },
  { cityCode: "35321", citySlug: "waki",         cityName: "和木町",       caps: CAPS, rates: { rate: { medical: 0.0540, support: 0.0310, care: 0.0290 }, perCapita: { medical: 23600, support: 13400, care: 13600 }, household: { medical: 16400, support: 9200, care: 6400 } } },
  { cityCode: "35341", citySlug: "kaminoseki",   cityName: "上関町",       caps: CAPS, rates: { rate: { medical: 0.0700, support: 0.0250, care: 0.0260 }, perCapita: { medical: 25000, support:  7500, care:  9200 }, household: { medical: 20000, support: 7200, care: 5700 } } },
  { cityCode: "35342", citySlug: "tabuse",       cityName: "田布施町",     caps: CAPS, rates: { rate: { medical: 0.0640, support: 0.0250, care: 0.0210 }, perCapita: { medical: 23000, support:  8000, care: 10000 }, household: { medical: 18000, support: 7000, care: 5000 } } },
  { cityCode: "35343", citySlug: "hirao",        cityName: "平生町",       caps: CAPS, rates: { rate: { medical: 0.0640, support: 0.0290, care: 0.0250 }, perCapita: { medical: 27700, support: 12200, care: 12500 }, household: { medical: 17800, support: 7800, care: 6100 } } },
  { cityCode: "35502", citySlug: "abu",          cityName: "阿武町",       caps: CAPS, rates: { rate: { medical: 0.0550, support: 0.0260, care: 0.0230 }, perCapita: { medical: 21500, support:  9500, care: 12000 }, household: { medical: 16000, support: 7400, care: 5400 } } },
];
