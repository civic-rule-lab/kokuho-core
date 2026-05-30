/**
 * 愛媛県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 愛媛県「令和7年度標準保険料率算定結果」
 *   https://www.pref.ehime.jp/page/4387.html
 *   PDF: https://www.pref.ehime.jp/uploaded/attachment/159210.pdf
 *   各市町公式サイト（実際値）
 *
 * 使用: node scripts/generate-pref-kokuho.js ehime
 *
 * 特記事項:
 *   - 資産割あり（4方式）: 今治市・宇和島市・八幡浜市・大洲市・西予市・上島町・内子町・伊方町・松野町・鬼北町・愛南町（11市町）
 *   - 資産割なし（3方式）: 松山市・新居浜市・西条市・伊予市・四国中央市・東温市・久万高原町・松前町・砥部町（9市町）
 *   - 四国中央市: 令和7年度より資産割廃止（3方式に移行）
 *   - 賦課限度額: 全市町で全国標準（660/260/170万円）
 *   - slug競合: 鬼北町→kihokucho（三重県紀北町が kihoku を使用）
 */

export const PREF_NAME = "愛媛県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 愛媛県 全20市町（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（11市）───────────────────────────────────────────────

  {
    cityCode: "38201", citySlug: "matsuyama", cityName: "松山市", caps: CAPS,
    rates: { rate: { medical: 0.0850, support: 0.0320, care: 0.0270 }, perCapita: { medical: 24120, support: 9120, care: 9480 }, household: { medical: 20040, support: 7560, care: 5880 } },
  },
  {
    cityCode: "38202", citySlug: "imabari", cityName: "今治市", caps: CAPS,
    rates: { rate: { medical: 0.0820, support: 0.0320, care: 0.0300 }, perCapita: { medical: 19800, support: 7100, care: 7600 }, household: { medical: 25500, support: 7400, care: 6500 } },
    assetLevy: { medical: 0.175, support: 0.052, care: 0.048 },
  },
  {
    cityCode: "38203", citySlug: "uwajima", cityName: "宇和島市", caps: CAPS,
    rates: { rate: { medical: 0.0720, support: 0.0220, care: 0.0167 }, perCapita: { medical: 19700, support: 6600, care: 7300 }, household: { medical: 22500, support: 7100, care: 5100 } },
    assetLevy: { medical: 0.275, support: 0.070, care: 0.063 },
  },
  {
    cityCode: "38204", citySlug: "yawatahama", cityName: "八幡浜市", caps: CAPS,
    rates: { rate: { medical: 0.0785, support: 0.0283, care: 0.0222 }, perCapita: { medical: 28100, support: 9600, care: 10700 }, household: { medical: 24800, support: 8200, care: 6100 } },
    assetLevy: { medical: 0.075, support: 0.035, care: 0.015 },
  },
  {
    cityCode: "38205", citySlug: "niihama", cityName: "新居浜市", caps: CAPS,
    rates: { rate: { medical: 0.0970, support: 0.0350, care: 0.0340 }, perCapita: { medical: 26290, support: 10100, care: 10400 }, household: { medical: 17480, support: 6500, care: 4990 } },
  },
  {
    cityCode: "38206", citySlug: "saijo", cityName: "西条市", caps: CAPS,
    rates: { rate: { medical: 0.0671, support: 0.0278, care: 0.0238 }, perCapita: { medical: 28840, support: 11730, care: 12200 }, household: { medical: 18970, support: 7710, care: 5990 } },
  },
  {
    cityCode: "38207", citySlug: "ozu", cityName: "大洲市", caps: CAPS,
    rates: { rate: { medical: 0.0840, support: 0.0249, care: 0.0211 }, perCapita: { medical: 25700, support: 8300, care: 8900 }, household: { medical: 24000, support: 7800, care: 5600 } },
    assetLevy: { medical: 0.1725, support: 0.075, care: 0.057 },
  },
  {
    cityCode: "38210", citySlug: "iyo", cityName: "伊予市", caps: CAPS,
    rates: { rate: { medical: 0.0880, support: 0.0310, care: 0.0260 }, perCapita: { medical: 26400, support: 9500, care: 9800 }, household: { medical: 29300, support: 10500, care: 7400 } },
  },
  {
    cityCode: "38213", citySlug: "shikokuchuo", cityName: "四国中央市", caps: CAPS,
    rates: { rate: { medical: 0.0811, support: 0.0301, care: 0.0244 }, perCapita: { medical: 33600, support: 12000, care: 12300 }, household: { medical: 22800, support: 8100, care: 6300 } },
  },
  {
    cityCode: "38214", citySlug: "seiyo", cityName: "西予市", caps: CAPS,
    rates: { rate: { medical: 0.0780, support: 0.0250, care: 0.0220 }, perCapita: { medical: 20500, support: 6500, care: 7100 }, household: { medical: 25000, support: 8800, care: 7500 } },
    assetLevy: { medical: 0.25, support: 0.13, care: 0.096 },
  },
  {
    cityCode: "38215", citySlug: "toon", cityName: "東温市", caps: CAPS,
    rates: { rate: { medical: 0.0950, support: 0.0300, care: 0.0280 }, perCapita: { medical: 26500, support: 10700, care: 10900 }, household: { medical: 18400, support: 6900, care: 5500 } },
  },

  // ── 町（9町）───────────────────────────────────────────────

  {
    cityCode: "38356", citySlug: "kamijima", cityName: "上島町", caps: CAPS,
    rates: { rate: { medical: 0.0820, support: 0.0350, care: 0.0230 }, perCapita: { medical: 23000, support: 6100, care: 9400 }, household: { medical: 25000, support: 7600, care: 7300 } },
    assetLevy: { medical: 0.30, support: 0.08, care: 0.07 },
  },
  {
    cityCode: "38386", citySlug: "kumakogen", cityName: "久万高原町", caps: CAPS,
    rates: { rate: { medical: 0.0920, support: 0.0282, care: 0.0246 }, perCapita: { medical: 25100, support: 9200, care: 10500 }, household: { medical: 24400, support: 8000, care: 6200 } },
  },
  {
    cityCode: "38401", citySlug: "masaki", cityName: "松前町", caps: CAPS,
    rates: { rate: { medical: 0.0840, support: 0.0300, care: 0.0290 }, perCapita: { medical: 26800, support: 9400, care: 9500 }, household: { medical: 19000, support: 6500, care: 4700 } },
  },
  {
    cityCode: "38402", citySlug: "tobe", cityName: "砥部町", caps: CAPS,
    rates: { rate: { medical: 0.0850, support: 0.0320, care: 0.0270 }, perCapita: { medical: 25000, support: 8500, care: 9700 }, household: { medical: 20000, support: 7000, care: 5600 } },
  },
  {
    cityCode: "38422", citySlug: "uchiko", cityName: "内子町", caps: CAPS,
    rates: { rate: { medical: 0.0810, support: 0.0300, care: 0.0220 }, perCapita: { medical: 30000, support: 10000, care: 9200 }, household: { medical: 20000, support: 8000, care: 5500 } },
    assetLevy: { medical: 0.128, support: 0.041, care: 0.04 },
  },
  {
    cityCode: "38442", citySlug: "ikata", cityName: "伊方町", caps: CAPS,
    rates: { rate: { medical: 0.0750, support: 0.0190, care: 0.0183 }, perCapita: { medical: 26000, support: 7200, care: 7500 }, household: { medical: 31000, support: 6100, care: 5300 } },
    assetLevy: { medical: 0.49, support: 0.09, care: 0.08 },
  },
  {
    cityCode: "38484", citySlug: "matsuno", cityName: "松野町", caps: CAPS,
    rates: { rate: { medical: 0.0810, support: 0.0230, care: 0.0200 }, perCapita: { medical: 21000, support: 6400, care: 7000 }, household: { medical: 24000, support: 6600, care: 5000 } },
    assetLevy: { medical: 0.175, support: 0.045, care: 0.04 },
  },
  {
    cityCode: "38488", citySlug: "kihokucho", cityName: "鬼北町", caps: CAPS,
    rates: { rate: { medical: 0.0720, support: 0.0250, care: 0.0220 }, perCapita: { medical: 17100, support: 7000, care: 7400 }, household: { medical: 19000, support: 5400, care: 4100 } },
    assetLevy: { medical: 0.25, support: 0.10, care: 0.08 },
  },
  {
    cityCode: "38506", citySlug: "ainan", cityName: "愛南町", caps: CAPS,
    rates: { rate: { medical: 0.0700, support: 0.0220, care: 0.0210 }, perCapita: { medical: 16900, support: 5100, care: 5700 }, household: { medical: 23500, support: 6900, care: 5400 } },
    assetLevy: { medical: 0.296, support: 0.074, care: 0.059 },
  },
];
