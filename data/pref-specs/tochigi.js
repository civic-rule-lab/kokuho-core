/**
 * 栃木県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 栃木県「令和7(2025)年度 市町村標準保険料率」
 *   https://www.pref.tochigi.lg.jp/e09/documents/20250116141722.pdf
 *   掲載元: https://www.pref.tochigi.lg.jp/e09/houdou/kouhou/r7nouhukin.html
 *
 * 使用: node scripts/generate-pref-kokuho.js tochigi
 *
 * 特記事項:
 *   - 標準保険料率（各市町が独自に設定する場合あり）
 *   - 資産割なし（全25市町3方式）
 *   - 賦課限度額: 全市町で全国標準（660/260/170万円）
 *   - slug競合: さくら市→sakurashi、那珂川町→nakagawamachi
 */

export const PREF_NAME = "栃木県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 栃木県 全25市町（令和7年度 標準保険料率）
// 全市町3方式（所得割+均等割+平等割）、資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（14市）───────────────────────────────────────────────

  {
    cityCode: "09201", citySlug: "utsunomiya", cityName: "宇都宮市",
    rates: {
      rate:      { medical: 0.0776, support: 0.0301, care: 0.0248 },
      perCapita: { medical: 33873,  support: 12991,  care: 12804  },
      household: { medical: 22786,  support: 8739,   care: 6437   },
    },
  },
  {
    cityCode: "09202", citySlug: "ashikaga", cityName: "足利市",
    rates: {
      rate:      { medical: 0.0658, support: 0.0294, care: 0.0244 },
      perCapita: { medical: 28728,  support: 12707,  care: 12576  },
      household: { medical: 19325,  support: 8548,   care: 6322   },
    },
  },
  {
    cityCode: "09203", citySlug: "tochigi", cityName: "栃木市",
    rates: {
      rate:      { medical: 0.0760, support: 0.0293, care: 0.0242 },
      perCapita: { medical: 33181,  support: 12641,  care: 12500  },
      household: { medical: 22321,  support: 8504,   care: 6284   },
    },
  },
  {
    cityCode: "09204", citySlug: "sano", cityName: "佐野市",
    rates: {
      rate:      { medical: 0.0662, support: 0.0283, care: 0.0233 },
      perCapita: { medical: 28922,  support: 12215,  care: 12051  },
      household: { medical: 19456,  support: 8217,   care: 6058   },
    },
  },
  {
    cityCode: "09205", citySlug: "kanuma", cityName: "鹿沼市",
    rates: {
      rate:      { medical: 0.0677, support: 0.0282, care: 0.0236 },
      perCapita: { medical: 29564,  support: 12178,  care: 12206  },
      household: { medical: 19888,  support: 8192,   care: 6136   },
    },
  },
  {
    cityCode: "09206", citySlug: "nikko", cityName: "日光市",
    rates: {
      rate:      { medical: 0.0688, support: 0.0281, care: 0.0230 },
      perCapita: { medical: 30052,  support: 12153,  care: 11867  },
      household: { medical: 20216,  support: 8176,   care: 5966   },
    },
  },
  {
    cityCode: "09207", citySlug: "oyama", cityName: "小山市",
    rates: {
      rate:      { medical: 0.0706, support: 0.0291, care: 0.0242 },
      perCapita: { medical: 30832,  support: 12584,  care: 12471  },
      household: { medical: 20741,  support: 8465,   care: 6269   },
    },
  },
  {
    cityCode: "09208", citySlug: "moka", cityName: "真岡市",
    rates: {
      rate:      { medical: 0.0638, support: 0.0283, care: 0.0237 },
      perCapita: { medical: 27873,  support: 12227,  care: 12215  },
      household: { medical: 18750,  support: 8225,   care: 6141   },
    },
  },
  {
    cityCode: "09209", citySlug: "otawara", cityName: "大田原市",
    rates: {
      rate:      { medical: 0.0551, support: 0.0243, care: 0.0202 },
      perCapita: { medical: 24044,  support: 10494,  care: 10440  },
      household: { medical: 16175,  support: 7060,   care: 5248   },
    },
  },
  {
    cityCode: "09210", citySlug: "yaita", cityName: "矢板市",
    rates: {
      rate:      { medical: 0.0627, support: 0.0281, care: 0.0230 },
      perCapita: { medical: 27392,  support: 12138,  care: 11886  },
      household: { medical: 18426,  support: 8165,   care: 5975   },
    },
  },
  {
    cityCode: "09213", citySlug: "nasushiobara", cityName: "那須塩原市",
    rates: {
      rate:      { medical: 0.0638, support: 0.0274, care: 0.0227 },
      perCapita: { medical: 27872,  support: 11857,  care: 11705  },
      household: { medical: 18750,  support: 7976,   care: 5884   },
    },
  },
  {
    cityCode: "09214", citySlug: "sakurashi", cityName: "さくら市",
    rates: {
      rate:      { medical: 0.0638, support: 0.0276, care: 0.0228 },
      perCapita: { medical: 27865,  support: 11914,  care: 11771  },
      household: { medical: 18745,  support: 8014,   care: 5918   },
    },
  },
  {
    cityCode: "09215", citySlug: "nasukarasuyama", cityName: "那須烏山市",
    rates: {
      rate:      { medical: 0.0652, support: 0.0282, care: 0.0235 },
      perCapita: { medical: 28477,  support: 12201,  care: 12118  },
      household: { medical: 19157,  support: 8207,   care: 6092   },
    },
  },
  {
    cityCode: "09216", citySlug: "shimotsuke", cityName: "下野市",
    rates: {
      rate:      { medical: 0.0604, support: 0.0264, care: 0.0217 },
      perCapita: { medical: 26379,  support: 11425,  care: 11184  },
      household: { medical: 17745,  support: 7686,   care: 5623   },
    },
  },

  // ── 町（11町）───────────────────────────────────────────────

  {
    cityCode: "09301", citySlug: "kaminokawa", cityName: "上三川町",
    rates: {
      rate:      { medical: 0.0643, support: 0.0284, care: 0.0231 },
      perCapita: { medical: 28083,  support: 12269,  care: 11929  },
      household: { medical: 18891,  support: 8253,   care: 5997   },
    },
  },
  {
    cityCode: "09342", citySlug: "mashiko", cityName: "益子町",
    rates: {
      rate:      { medical: 0.0587, support: 0.0277, care: 0.0232 },
      perCapita: { medical: 25642,  support: 11961,  care: 11986  },
      household: { medical: 17250,  support: 8046,   care: 6026   },
    },
  },
  {
    cityCode: "09343", citySlug: "motegi", cityName: "茂木町",
    rates: {
      rate:      { medical: 0.0521, support: 0.0271, care: 0.0223 },
      perCapita: { medical: 22772,  support: 11708,  care: 11531  },
      household: { medical: 15318,  support: 7876,   care: 5797   },
    },
  },
  {
    cityCode: "09344", citySlug: "ichikai", cityName: "市貝町",
    rates: {
      rate:      { medical: 0.0594, support: 0.0275, care: 0.0228 },
      perCapita: { medical: 25951,  support: 11873,  care: 11794  },
      household: { medical: 17457,  support: 7987,   care: 5929   },
    },
  },
  {
    cityCode: "09345", citySlug: "haga", cityName: "芳賀町",
    rates: {
      rate:      { medical: 0.0645, support: 0.0286, care: 0.0238 },
      perCapita: { medical: 28152,  support: 12344,  care: 12267  },
      household: { medical: 18938,  support: 8304,   care: 6167   },
    },
  },
  {
    cityCode: "09361", citySlug: "mibu", cityName: "壬生町",
    rates: {
      rate:      { medical: 0.0681, support: 0.0286, care: 0.0236 },
      perCapita: { medical: 29752,  support: 12338,  care: 12171  },
      household: { medical: 20014,  support: 8300,   care: 6119   },
    },
  },
  {
    cityCode: "09362", citySlug: "nogi", cityName: "野木町",
    rates: {
      rate:      { medical: 0.0638, support: 0.0276, care: 0.0226 },
      perCapita: { medical: 27842,  support: 11945,  care: 11643  },
      household: { medical: 18730,  support: 8036,   care: 5853   },
    },
  },
  {
    cityCode: "09384", citySlug: "shioya", cityName: "塩谷町",
    rates: {
      rate:      { medical: 0.0638, support: 0.0278, care: 0.0234 },
      perCapita: { medical: 27866,  support: 12014,  care: 12085  },
      household: { medical: 18746,  support: 8082,   care: 6075   },
    },
  },
  {
    cityCode: "09386", citySlug: "takanezawa", cityName: "高根沢町",
    rates: {
      rate:      { medical: 0.0627, support: 0.0276, care: 0.0233 },
      perCapita: { medical: 27360,  support: 11906,  care: 12044  },
      household: { medical: 18405,  support: 8009,   care: 6055   },
    },
  },
  {
    cityCode: "09407", citySlug: "nasu", cityName: "那須町",
    rates: {
      rate:      { medical: 0.0614, support: 0.0272, care: 0.0225 },
      perCapita: { medical: 26825,  support: 11745,  care: 11605  },
      household: { medical: 18045,  support: 7901,   care: 5834   },
    },
  },
  {
    cityCode: "09411", citySlug: "nakagawamachi", cityName: "那珂川町",
    rates: {
      rate:      { medical: 0.0598, support: 0.0257, care: 0.0215 },
      perCapita: { medical: 26122,  support: 11125,  care: 11110  },
      household: { medical: 17572,  support: 7484,   care: 5585   },
    },
  },
];
