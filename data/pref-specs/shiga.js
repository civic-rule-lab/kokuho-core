/**
 * 滋賀県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 滋賀県「令和7年度 市町保険料率」
 *   https://www.pref.shiga.lg.jp/file/attachment/5544827.pdf
 *
 * 使用: node scripts/generate-pref-kokuho.js shiga
 *
 * 特記事項:
 *   - 全19市町 実際の賦課率（実際値）
 *   - 全市町 3方式（所得割+均等割+平等割）、資産割なし
 *   - 賦課限度額: 全市町で全国標準（660/260/170万円）
 *   - slug競合: 草津市→kusatsushi（群馬県草津町がkusatsuを使用）
 *             湖南市→konanshi（愛知県江南市がkonanを使用）
 *             日野町→hinocho（東京都日野市がhinoを使用）
 */

export const PREF_NAME = "滋賀県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 滋賀県 全19市町（令和7年度 市町実際保険料率）
// 全市町3方式（所得割+均等割+平等割）、資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（13市）───────────────────────────────────────────────

  {
    cityCode: "25201", citySlug: "otsu", cityName: "大津市",
    rates: {
      rate:      { medical: 0.0710, support: 0.0260, care: 0.0250 },
      perCapita: { medical: 30300,  support: 11100,  care: 10800  },
      household: { medical: 19800,  support: 7500,   care: 5400   },
    },
  },
  {
    cityCode: "25202", citySlug: "hikone", cityName: "彦根市",
    rates: {
      rate:      { medical: 0.0712, support: 0.0272, care: 0.0236 },
      perCapita: { medical: 29800,  support: 11100,  care: 11300  },
      household: { medical: 19800,  support: 7400,   care: 5600   },
    },
  },
  {
    cityCode: "25203", citySlug: "nagahama", cityName: "長浜市",
    rates: {
      rate:      { medical: 0.0670, support: 0.0272, care: 0.0239 },
      perCapita: { medical: 27500,  support: 11400,  care: 11500  },
      household: { medical: 19500,  support: 7800,   care: 5700   },
    },
  },
  {
    cityCode: "25204", citySlug: "omihachiman", cityName: "近江八幡市",
    rates: {
      rate:      { medical: 0.0718, support: 0.0272, care: 0.0231 },
      perCapita: { medical: 28100,  support: 11000,  care: 10800  },
      household: { medical: 19800,  support: 7800,   care: 5300   },
    },
  },
  {
    cityCode: "25206", citySlug: "kusatsushi", cityName: "草津市",
    rates: {
      rate:      { medical: 0.0690, support: 0.0270, care: 0.0240 },
      perCapita: { medical: 29000,  support: 11200,  care: 11500  },
      household: { medical: 19000,  support: 7300,   care: 6100   },
    },
  },
  {
    cityCode: "25207", citySlug: "moriyama", cityName: "守山市",
    rates: {
      rate:      { medical: 0.0657, support: 0.0270, care: 0.0235 },
      perCapita: { medical: 29086,  support: 12193,  care: 12720  },
      household: { medical: 20670,  support: 8583,   care: 6330   },
    },
  },
  {
    cityCode: "25208", citySlug: "ritto", cityName: "栗東市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0268, care: 0.0225 },
      perCapita: { medical: 29700,  support: 11300,  care: 12100  },
      household: { medical: 20300,  support: 7700,   care: 6100   },
    },
  },
  {
    cityCode: "25209", citySlug: "koka", cityName: "甲賀市",
    rates: {
      rate:      { medical: 0.0735, support: 0.0270, care: 0.0235 },
      perCapita: { medical: 25700,  support: 9900,   care: 10800  },
      household: { medical: 20800,  support: 7300,   care: 6000   },
    },
  },
  {
    cityCode: "25210", citySlug: "yasu", cityName: "野洲市",
    rates: {
      rate:      { medical: 0.0724, support: 0.0270, care: 0.0222 },
      perCapita: { medical: 30300,  support: 11100,  care: 11400  },
      household: { medical: 20600,  support: 7500,   care: 5700   },
    },
  },
  {
    cityCode: "25211", citySlug: "konanshi", cityName: "湖南市",
    rates: {
      rate:      { medical: 0.0674, support: 0.0244, care: 0.0209 },
      perCapita: { medical: 27900,  support: 9900,   care: 10800  },
      household: { medical: 20000,  support: 7300,   care: 5300   },
    },
  },
  {
    cityCode: "25212", citySlug: "takashima", cityName: "高島市",
    rates: {
      rate:      { medical: 0.0710, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 26100,  support: 9400,   care: 10700  },
      household: { medical: 19600,  support: 7000,   care: 5600   },
    },
  },
  {
    cityCode: "25213", citySlug: "higashiomi", cityName: "東近江市",
    rates: {
      rate:      { medical: 0.0690, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 29000,  support: 11200,  care: 12000  },
      household: { medical: 20000,  support: 7800,   care: 6000   },
    },
  },
  {
    cityCode: "25214", citySlug: "maibara", cityName: "米原市",
    rates: {
      rate:      { medical: 0.0639, support: 0.0280, care: 0.0236 },
      perCapita: { medical: 27500,  support: 11900,  care: 12100  },
      household: { medical: 18600,  support: 8000,   care: 6000   },
    },
  },

  // ── 町（6町）───────────────────────────────────────────────

  {
    cityCode: "25383", citySlug: "hinocho", cityName: "日野町",
    rates: {
      rate:      { medical: 0.0720, support: 0.0290, care: 0.0235 },
      perCapita: { medical: 28000,  support: 11000,  care: 11500  },
      household: { medical: 20000,  support: 8500,   care: 6500   },
    },
  },
  {
    cityCode: "25384", citySlug: "ryuo", cityName: "竜王町",
    rates: {
      rate:      { medical: 0.0600, support: 0.0250, care: 0.0210 },
      perCapita: { medical: 25100,  support: 10200,  care: 11800  },
      household: { medical: 18900,  support: 7600,   care: 6000   },
    },
  },
  {
    cityCode: "25425", citySlug: "aisho", cityName: "愛荘町",
    rates: {
      rate:      { medical: 0.0656, support: 0.0253, care: 0.0211 },
      perCapita: { medical: 27000,  support: 10000,  care: 11000  },
      household: { medical: 18000,  support: 8000,   care: 6000   },
    },
  },
  {
    cityCode: "25441", citySlug: "toyosato", cityName: "豊郷町",
    rates: {
      rate:      { medical: 0.0724, support: 0.0331, care: 0.0266 },
      perCapita: { medical: 23500,  support: 10500,  care: 11100  },
      household: { medical: 17300,  support: 7700,   care: 5600   },
    },
  },
  {
    cityCode: "25442", citySlug: "kora", cityName: "甲良町",
    rates: {
      rate:      { medical: 0.0683, support: 0.0242, care: 0.0230 },
      perCapita: { medical: 22000,  support: 8000,   care: 9000   },
      household: { medical: 18000,  support: 6000,   care: 5000   },
    },
  },
  {
    cityCode: "25443", citySlug: "taga", cityName: "多賀町",
    rates: {
      rate:      { medical: 0.0787, support: 0.0283, care: 0.0238 },
      perCapita: { medical: 32300,  support: 11500,  care: 12500  },
      household: { medical: 22400,  support: 7900,   care: 6200   },
    },
  },
];
