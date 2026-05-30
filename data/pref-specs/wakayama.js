/**
 * 和歌山県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 和歌山県 国民健康保険標準保険料率（令和6年度）
 *   https://www.pref.wakayama.lg.jp/ （R6標準保険料率PDFより算出）
 *   ※ 令和7年度公式PDFが未取得のため R6標準保険料率を使用
 *
 * 使用: node scripts/generate-pref-kokuho.js wakayama
 *
 * 特記事項:
 *   - 全30市町村 独自料率（各市町村で異なる）
 *   - 全市町村 3方式（所得割+均等割+平等割）/ 資産割なし
 *   - 賦課限度額: R7全国標準 医療66万円・後期26万円・介護17万円
 *   - slug競合:
 *       新宮市     → shingushi    （福岡新宮町が shingu を使用）
 *       かつらぎ町 → katsuragimachi（奈良葛城市が katsuragi を使用）
 *       美浜町     → mihamawakayama（愛知美浜町が mihama、兵庫香美町が mihamacho、三重御浜町が mihamachomie を使用）
 *       日高町     → hidakacho    （埼玉日高市が hidaka を使用）
 *       印南町     → inamicho     （兵庫稲美町が inami を使用）
 */

export const PREF_NAME = "和歌山県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 和歌山県 全30市町村（令和6年度 標準保険料率）
// 全市町村 3方式（所得割+均等割+平等割）/ 資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（9市）───────────────────────────────────────────────

  { cityCode: "30201", citySlug: "wakayama",       cityName: "和歌山市",   rates: { rate: { medical: 0.0764, support: 0.0313, care: 0.0253 }, perCapita: { medical: 27544, support: 10947, care: 11102 }, household: { medical: 19094, support: 7589,  care: 5633 } } },
  { cityCode: "30202", citySlug: "kainan",          cityName: "海南市",     rates: { rate: { medical: 0.0785, support: 0.0316, care: 0.0262 }, perCapita: { medical: 28303, support: 11079, care: 11501 }, household: { medical: 19620, support: 7680,  care: 5836 } } },
  { cityCode: "30203", citySlug: "hashimoto",       cityName: "橋本市",     rates: { rate: { medical: 0.0768, support: 0.0307, care: 0.0256 }, perCapita: { medical: 27686, support: 10770, care: 11197 }, household: { medical: 19192, support: 7466,  care: 5682 } } },
  { cityCode: "30204", citySlug: "arida",           cityName: "有田市",     rates: { rate: { medical: 0.0916, support: 0.0312, care: 0.0257 }, perCapita: { medical: 33020, support: 10928, care: 11274 }, household: { medical: 22890, support: 7576,  care: 5720 } } },
  { cityCode: "30205", citySlug: "gobo",            cityName: "御坊市",     rates: { rate: { medical: 0.0752, support: 0.0305, care: 0.0247 }, perCapita: { medical: 27122, support: 10683, care: 10817 }, household: { medical: 18801, support: 7406,  care: 5489 } } },
  { cityCode: "30206", citySlug: "tanabe",          cityName: "田辺市",     rates: { rate: { medical: 0.0731, support: 0.0310, care: 0.0255 }, perCapita: { medical: 26380, support: 10859, care: 11160 }, household: { medical: 18287, support: 7528,  care: 5663 } } },
  { cityCode: "30207", citySlug: "shingushi",       cityName: "新宮市",     rates: { rate: { medical: 0.0682, support: 0.0309, care: 0.0258 }, perCapita: { medical: 24596, support: 10825, care: 11322 }, household: { medical: 17050, support: 7504,  care: 5745 } } },
  { cityCode: "30208", citySlug: "kinokawa",        cityName: "紀の川市",   rates: { rate: { medical: 0.0829, support: 0.0311, care: 0.0257 }, perCapita: { medical: 29887, support: 10883, care: 11256 }, household: { medical: 20719, support: 7544,  care: 5712 } } },
  { cityCode: "30209", citySlug: "iwade",           cityName: "岩出市",     rates: { rate: { medical: 0.0791, support: 0.0312, care: 0.0260 }, perCapita: { medical: 28516, support: 10933, care: 11392 }, household: { medical: 19768, support: 7579,  care: 5780 } } },

  // ── 町村（21町村）───────────────────────────────────────────

  { cityCode: "30304", citySlug: "kimino",          cityName: "紀美野町",   rates: { rate: { medical: 0.0823, support: 0.0310, care: 0.0257 }, perCapita: { medical: 29674, support: 10870, care: 11279 }, household: { medical: 20570, support: 7536,  care: 5723 } } },
  { cityCode: "30341", citySlug: "katsuragimachi",  cityName: "かつらぎ町", rates: { rate: { medical: 0.0852, support: 0.0310, care: 0.0267 }, perCapita: { medical: 30732, support: 10845, care: 11697 }, household: { medical: 21304, support: 7518,  care: 5935 } } },
  { cityCode: "30343", citySlug: "kudoyama",        cityName: "九度山町",   rates: { rate: { medical: 0.0831, support: 0.0282, care: 0.0252 }, perCapita: { medical: 29965, support:  9861, care: 11032 }, household: { medical: 20772, support: 6836,  care: 5598 } } },
  { cityCode: "30344", citySlug: "koya",            cityName: "高野町",     rates: { rate: { medical: 0.0883, support: 0.0316, care: 0.0270 }, perCapita: { medical: 31831, support: 11054, care: 11813 }, household: { medical: 22066, support: 7663,  care: 5994 } } },
  { cityCode: "30361", citySlug: "yuasa",           cityName: "湯浅町",     rates: { rate: { medical: 0.0698, support: 0.0313, care: 0.0255 }, perCapita: { medical: 25173, support: 10952, care: 11178 }, household: { medical: 17450, support: 7592,  care: 5672 } } },
  { cityCode: "30362", citySlug: "hirogawa",        cityName: "広川町",     rates: { rate: { medical: 0.0736, support: 0.0309, care: 0.0258 }, perCapita: { medical: 26532, support: 10808, care: 11295 }, household: { medical: 18393, support: 7493,  care: 5731 } } },
  { cityCode: "30366", citySlug: "aridagawa",       cityName: "有田川町",   rates: { rate: { medical: 0.0834, support: 0.0310, care: 0.0256 }, perCapita: { medical: 30090, support: 10872, care: 11224 }, household: { medical: 20859, support: 7537,  care: 5695 } } },
  { cityCode: "30381", citySlug: "mihamawakayama",  cityName: "美浜町",     rates: { rate: { medical: 0.0843, support: 0.0310, care: 0.0256 }, perCapita: { medical: 30418, support: 10853, care: 11206 }, household: { medical: 21086, support: 7523,  care: 5686 } } },
  { cityCode: "30382", citySlug: "hidakacho",       cityName: "日高町",     rates: { rate: { medical: 0.0767, support: 0.0307, care: 0.0236 }, perCapita: { medical: 27649, support: 10738, care: 10318 }, household: { medical: 19167, support: 7444,  care: 5236 } } },
  { cityCode: "30383", citySlug: "yura",            cityName: "由良町",     rates: { rate: { medical: 0.0856, support: 0.0299, care: 0.0255 }, perCapita: { medical: 30875, support: 10480, care: 11165 }, household: { medical: 21403, support: 7265,  care: 5666 } } },
  { cityCode: "30392", citySlug: "hidakagawa",      cityName: "日高川町",   rates: { rate: { medical: 0.0838, support: 0.0309, care: 0.0252 }, perCapita: { medical: 30221, support: 10814, care: 11048 }, household: { medical: 20950, support: 7497,  care: 5606 } } },
  { cityCode: "30391", citySlug: "minabe",          cityName: "みなべ町",   rates: { rate: { medical: 0.0731, support: 0.0277, care: 0.0192 }, perCapita: { medical: 26369, support:  9688, care:  8429 }, household: { medical: 18279, support: 6716,  care: 4277 } } },
  { cityCode: "30390", citySlug: "inamicho",        cityName: "印南町",     rates: { rate: { medical: 0.0795, support: 0.0308, care: 0.0254 }, perCapita: { medical: 28665, support: 10790, care: 11122 }, household: { medical: 19871, support: 7480,  care: 5644 } } },
  { cityCode: "30401", citySlug: "shirahama",       cityName: "白浜町",     rates: { rate: { medical: 0.0791, support: 0.0308, care: 0.0259 }, perCapita: { medical: 28523, support: 10794, care: 11349 }, household: { medical: 19773, support: 7483,  care: 5759 } } },
  { cityCode: "30404", citySlug: "kamitonda",       cityName: "上富田町",   rates: { rate: { medical: 0.0829, support: 0.0306, care: 0.0252 }, perCapita: { medical: 29890, support: 10708, care: 11050 }, household: { medical: 20720, support: 7423,  care: 5607 } } },
  { cityCode: "30406", citySlug: "susami",          cityName: "すさみ町",   rates: { rate: { medical: 0.0759, support: 0.0312, care: 0.0257 }, perCapita: { medical: 27381, support: 10945, care: 11248 }, household: { medical: 18981, support: 7588,  care: 5707 } } },
  { cityCode: "30421", citySlug: "nachikatsuura",   cityName: "那智勝浦町", rates: { rate: { medical: 0.0723, support: 0.0309, care: 0.0256 }, perCapita: { medical: 26076, support: 10823, care: 11194 }, household: { medical: 18077, support: 7503,  care: 5680 } } },
  { cityCode: "30422", citySlug: "taiji",           cityName: "太地町",     rates: { rate: { medical: 0.0750, support: 0.0296, care: 0.0263 }, perCapita: { medical: 27048, support: 10374, care: 11528 }, household: { medical: 18750, support: 7192,  care: 5850 } } },
  { cityCode: "30424", citySlug: "kozagawa",        cityName: "古座川町",   rates: { rate: { medical: 0.0761, support: 0.0315, care: 0.0264 }, perCapita: { medical: 27439, support: 11022, care: 11578 }, household: { medical: 19021, support: 7641,  care: 5875 } } },
  { cityCode: "30427", citySlug: "kitayama",        cityName: "北山村",     rates: { rate: { medical: 0.0852, support: 0.0261, care: 0.0170 }, perCapita: { medical: 30721, support:  9149, care:  7442 }, household: { medical: 21297, support: 6342,  care: 3776 } } },
  { cityCode: "30428", citySlug: "kushimoto",       cityName: "串本町",     rates: { rate: { medical: 0.0718, support: 0.0308, care: 0.0256 }, perCapita: { medical: 25909, support: 10789, care: 11211 }, household: { medical: 17961, support: 7479,  care: 5689 } } },
];
