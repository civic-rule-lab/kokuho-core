/**
 * 群馬県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 群馬県「令和7年度 実際の市町村別国民健康保険税率」
 *   https://www.pref.gunma.jp/uploaded/attachment/662282.pdf
 *   掲載元: https://www.pref.gunma.jp/page/3163.html
 *
 * 使用: node scripts/generate-pref-kokuho.js gunma
 *
 * 特記事項:
 *   - 全35市町村実際値（令和7年5月作成版PDF）
 *   - 資産割あり（4方式）: 安中市・昭和村・上野村 の3市村
 *   - 賦課限度額: 全市町村で全国標準（660/260/170万円）
 *   - slug競合: 太田市→ota-gunma、沼田市→numatashi、高山村→takayamamura
 */

export const PREF_NAME = "群馬県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 群馬県 全35市町村（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（12市）───────────────────────────────────────────────

  {
    cityCode: "10201", citySlug: "maebashi", cityName: "前橋市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0310, care: 0.0250 },
      perCapita: { medical: 29000,  support: 12600,  care: 12200  },
      household: { medical: 19400,  support: 8400,   care: 6200   },
    },
  },
  {
    cityCode: "10202", citySlug: "takasaki", cityName: "高崎市",
    rates: {
      rate:      { medical: 0.0640, support: 0.0220, care: 0.0200 },
      perCapita: { medical: 24200,  support: 7400,   care: 9400   },
      household: { medical: 21400,  support: 5800,   care: 6100   },
    },
  },
  {
    cityCode: "10203", citySlug: "kiryu", cityName: "桐生市",
    rates: {
      rate:      { medical: 0.0680, support: 0.0260, care: 0.0220 },
      perCapita: { medical: 25800,  support: 10300,  care: 10900  },
      household: { medical: 19600,  support: 7600,   care: 5600   },
    },
  },
  {
    cityCode: "10204", citySlug: "isesaki", cityName: "伊勢崎市",
    rates: {
      rate:      { medical: 0.0690, support: 0.0260, care: 0.0210 },
      perCapita: { medical: 26000,  support: 10000,  care: 11000  },
      household: { medical: 20500,  support: 7500,   care: 6100   },
    },
  },
  {
    cityCode: "10205", citySlug: "ota-gunma", cityName: "太田市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0260, care: 0.0210 },
      perCapita: { medical: 25000,  support: 10600,  care: 11400  },
      household: { medical: 23000,  support: 7700,   care: 5400   },
    },
  },
  {
    cityCode: "10206", citySlug: "numatashi", cityName: "沼田市",
    rates: {
      rate:      { medical: 0.0730, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 27800,  support: 9800,   care: 11900  },
      household: { medical: 22500,  support: 7700,   care: 6700   },
    },
  },
  {
    cityCode: "10207", citySlug: "tatebayashi", cityName: "館林市",
    rates: {
      rate:      { medical: 0.0690, support: 0.0260, care: 0.0220 },
      perCapita: { medical: 27600,  support: 10400,  care: 10800  },
      household: { medical: 20600,  support: 7600,   care: 5600   },
    },
  },
  {
    cityCode: "10208", citySlug: "shibukawa", cityName: "渋川市",
    rates: {
      rate:      { medical: 0.0770, support: 0.0270, care: 0.0210 },
      perCapita: { medical: 26000,  support: 9000,   care: 10000  },
      household: { medical: 24000,  support: 9000,   care: 7000   },
    },
  },
  {
    cityCode: "10209", citySlug: "fujioka", cityName: "藤岡市",
    rates: {
      rate:      { medical: 0.0725, support: 0.0291, care: 0.0244 },
      perCapita: { medical: 30700,  support: 11900,  care: 12600  },
      household: { medical: 21300,  support: 8300,   care: 6400   },
    },
  },
  {
    cityCode: "10210", citySlug: "tomioka", cityName: "富岡市",
    rates: {
      rate:      { medical: 0.0696, support: 0.0298, care: 0.0250 },
      perCapita: { medical: 26000,  support: 11100,  care: 10700  },
      household: { medical: 25000,  support: 9000,   care: 6800   },
    },
  },
  {
    cityCode: "10211", citySlug: "annaka", cityName: "安中市",
    assetLevy: { medical: 0.2400, support: 0.0900, care: 0.0500 },
    rates: {
      rate:      { medical: 0.0670, support: 0.0200, care: 0.0120 },
      perCapita: { medical: 24000,  support: 6000,   care: 6000   },
      household: { medical: 23000,  support: 5000,   care: 4000   },
    },
  },
  {
    cityCode: "10212", citySlug: "midori", cityName: "みどり市",
    rates: {
      rate:      { medical: 0.0760, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 27600,  support: 9800,   care: 11600  },
      household: { medical: 30000,  support: 8500,   care: 6000   },
    },
  },

  // ── 北群馬郡（2町村）────────────────────────────────────────

  {
    cityCode: "10301", citySlug: "shinto", cityName: "榛東村",
    rates: {
      rate:      { medical: 0.0652, support: 0.0226, care: 0.0192 },
      perCapita: { medical: 24000,  support: 8400,   care: 9000   },
      household: { medical: 19000,  support: 7000,   care: 5000   },
    },
  },
  {
    cityCode: "10302", citySlug: "yoshioka", cityName: "吉岡町",
    rates: {
      rate:      { medical: 0.0670, support: 0.0220, care: 0.0160 },
      perCapita: { medical: 27400,  support: 8400,   care: 6700   },
      household: { medical: 25800,  support: 9200,   care: 7600   },
    },
  },

  // ── 多野郡（2町村）──────────────────────────────────────────

  {
    cityCode: "10321", citySlug: "ueno", cityName: "上野村",
    assetLevy: { medical: 0.1500, support: 0.0500, care: 0.0500 },
    rates: {
      rate:      { medical: 0.0720, support: 0.0130, care: 0.0100 },
      perCapita: { medical: 16300,  support: 4000,   care: 6500   },
      household: { medical: 19500,  support: 4000,   care: 3500   },
    },
  },
  {
    cityCode: "10322", citySlug: "kanna", cityName: "神流町",
    rates: {
      rate:      { medical: 0.0700, support: 0.0200, care: 0.0190 },
      perCapita: { medical: 26000,  support: 11500,  care: 11000  },
      household: { medical: 23000,  support: 6500,   care: 6000   },
    },
  },

  // ── 甘楽郡（3町村）──────────────────────────────────────────

  {
    cityCode: "10341", citySlug: "shimonita", cityName: "下仁田町",
    rates: {
      rate:      { medical: 0.0665, support: 0.0297, care: 0.0251 },
      perCapita: { medical: 27800,  support: 11900,  care: 12700  },
      household: { medical: 22600,  support: 8300,   care: 6300   },
    },
  },
  {
    cityCode: "10342", citySlug: "namoku", cityName: "南牧村",
    rates: {
      rate:      { medical: 0.0600, support: 0.0200, care: 0.0150 },
      perCapita: { medical: 17000,  support: 5000,   care: 6000   },
      household: { medical: 15000,  support: 3000,   care: 3000   },
    },
  },
  {
    cityCode: "10343", citySlug: "kanra", cityName: "甘楽町",
    rates: {
      rate:      { medical: 0.0680, support: 0.0240, care: 0.0180 },
      perCapita: { medical: 23200,  support: 8000,   care: 8400   },
      household: { medical: 20000,  support: 7400,   care: 5200   },
    },
  },

  // ── 吾妻郡（6町村）──────────────────────────────────────────

  {
    cityCode: "10421", citySlug: "nakanojo", cityName: "中之条町",
    rates: {
      rate:      { medical: 0.0700, support: 0.0280, care: 0.0220 },
      perCapita: { medical: 24000,  support: 9200,   care: 8500   },
      household: { medical: 21200,  support: 8400,   care: 8000   },
    },
  },
  {
    cityCode: "10423", citySlug: "naganohara", cityName: "長野原町",
    rates: {
      rate:      { medical: 0.0667, support: 0.0260, care: 0.0234 },
      perCapita: { medical: 28000,  support: 11000,  care: 13000  },
      household: { medical: 20000,  support: 8000,   care: 7000   },
    },
  },
  {
    cityCode: "10424", citySlug: "tsumagoi", cityName: "嬬恋村",
    rates: {
      rate:      { medical: 0.0580, support: 0.0180, care: 0.0170 },
      perCapita: { medical: 27000,  support: 9000,   care: 10000  },
      household: { medical: 27000,  support: 8000,   care: 8000   },
    },
  },
  {
    cityCode: "10425", citySlug: "kusatsu", cityName: "草津町",
    rates: {
      rate:      { medical: 0.0730, support: 0.0220, care: 0.0190 },
      perCapita: { medical: 25000,  support: 7200,   care: 8000   },
      household: { medical: 30000,  support: 8200,   care: 9000   },
    },
  },
  {
    cityCode: "10427", citySlug: "takayamamura", cityName: "高山村",
    rates: {
      rate:      { medical: 0.0630, support: 0.0260, care: 0.0190 },
      perCapita: { medical: 25000,  support: 9500,   care: 8500   },
      household: { medical: 28000,  support: 10600,  care: 9500   },
    },
  },
  {
    cityCode: "10428", citySlug: "higashiagatsuma", cityName: "東吾妻町",
    rates: {
      rate:      { medical: 0.0710, support: 0.0300, care: 0.0245 },
      perCapita: { medical: 30000,  support: 12000,  care: 12000  },
      household: { medical: 21000,  support: 8000,   care: 6000   },
    },
  },

  // ── 利根郡（4町村）──────────────────────────────────────────

  {
    cityCode: "10521", citySlug: "katashina", cityName: "片品村",
    rates: {
      rate:      { medical: 0.0720, support: 0.0320, care: 0.0300 },
      perCapita: { medical: 22000,  support: 7000,   care: 7000   },
      household: { medical: 30000,  support: 9000,   care: 7200   },
    },
  },
  {
    cityCode: "10522", citySlug: "kawaba", cityName: "川場村",
    rates: {
      rate:      { medical: 0.0700, support: 0.0230, care: 0.0220 },
      perCapita: { medical: 30300,  support: 10800,  care: 13100  },
      household: { medical: 29000,  support: 9600,   care: 10000  },
    },
  },
  {
    cityCode: "10524", citySlug: "showa", cityName: "昭和村",
    assetLevy: { medical: 0.1000, support: 0.0500, care: 0.0400 },
    rates: {
      rate:      { medical: 0.0690, support: 0.0270, care: 0.0190 },
      perCapita: { medical: 23500,  support: 10500,  care: 9000   },
      household: { medical: 26000,  support: 10500,  care: 9000   },
    },
  },
  {
    cityCode: "10525", citySlug: "minakami", cityName: "みなかみ町",
    rates: {
      rate:      { medical: 0.0660, support: 0.0240, care: 0.0180 },
      perCapita: { medical: 26000,  support: 9700,   care: 9500   },
      household: { medical: 19000,  support: 7000,   care: 4500   },
    },
  },

  // ── 佐波郡（1町）────────────────────────────────────────────

  {
    cityCode: "10601", citySlug: "tamamura", cityName: "玉村町",
    rates: {
      rate:      { medical: 0.0700, support: 0.0300, care: 0.0270 },
      perCapita: { medical: 29500,  support: 11500,  care: 10000  },
      household: { medical: 23000,  support: 9000,   care: 8000   },
    },
  },

  // ── 邑楽郡（5町）────────────────────────────────────────────

  {
    cityCode: "10621", citySlug: "itakura", cityName: "板倉町",
    rates: {
      rate:      { medical: 0.0620, support: 0.0250, care: 0.0220 },
      perCapita: { medical: 29000,  support: 11000,  care: 12000  },
      household: { medical: 25000,  support: 10000,  care: 7000   },
    },
  },
  {
    cityCode: "10622", citySlug: "meiwa", cityName: "明和町",
    rates: {
      rate:      { medical: 0.0700, support: 0.0180, care: 0.0130 },
      perCapita: { medical: 28000,  support: 9600,   care: 7900   },
      household: { medical: 21800,  support: 7600,   care: 6200   },
    },
  },
  {
    cityCode: "10623", citySlug: "chiyodamachi", cityName: "千代田町",
    rates: {
      rate:      { medical: 0.0650, support: 0.0260, care: 0.0215 },
      perCapita: { medical: 27000,  support: 10500,  care: 10900  },
      household: { medical: 27700,  support: 7900,   care: 7000   },
    },
  },
  {
    cityCode: "10624", citySlug: "oizumi", cityName: "大泉町",
    rates: {
      rate:      { medical: 0.0790, support: 0.0260, care: 0.0100 },
      perCapita: { medical: 15000,  support: 7000,   care: 4700   },
      household: { medical: 19000,  support: 6000,   care: 2500   },
    },
  },
  {
    cityCode: "10625", citySlug: "ora", cityName: "邑楽町",
    rates: {
      rate:      { medical: 0.0720, support: 0.0280, care: 0.0180 },
      perCapita: { medical: 24000,  support: 9000,   care: 9000   },
      household: { medical: 22000,  support: 6000,   care: 6000   },
    },
  },
];
