/**
 * 三重県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 三重県「令和7年度 国民健康保険事業費納付金・標準保険料率の算定（本算定）」
 *   https://www.pref.mie.lg.jp/common/content/001185119.pdf
 *
 * 使用: node scripts/generate-pref-kokuho.js mie
 *
 * 特記事項:
 *   - 全29市町 標準保険料率（各市町の実際値とは異なる場合あり）
 *   - 全市町 3方式（所得割+均等割+平等割）、資産割なし
 *   - 賦課限度額: 全市町で全国標準（660/260/170万円）
 *   - slug競合: 熊野市→kumanoshi（広島県熊野町がkumanoを使用）
 *             朝日町→asahicho（長野県朝日村がasahiを使用）
 *             川越町→kawagoemachi（埼玉県川越市がkawagoeを使用）
 *             明和町→meiwamachi（群馬県明和町がmeiwaを使用）
 *             大紀町→taikimachi（北海道大樹町がtaikiを使用）
 *             御浜町→mihamachomie（愛知県美浜町がmihama、兵庫県香美町がmihamachoを使用）
 */

export const PREF_NAME = "三重県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 三重県 全29市町（令和7年度 市町標準保険料率）
// 全市町3方式（所得割+均等割+平等割）、資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（14市）───────────────────────────────────────────────

  {
    cityCode: "24201", citySlug: "tsu", cityName: "津市",
    rates: {
      rate:      { medical: 0.0788, support: 0.0284, care: 0.0248 },
      perCapita: { medical: 34027,  support: 12112,  care: 13026  },
      household: { medical: 22346,  support: 7954,   care: 6422   },
    },
  },
  {
    cityCode: "24202", citySlug: "yokkaichi", cityName: "四日市市",
    rates: {
      rate:      { medical: 0.0778, support: 0.0285, care: 0.0248 },
      perCapita: { medical: 33592,  support: 12154,  care: 13023  },
      household: { medical: 22060,  support: 7981,   care: 6420   },
    },
  },
  {
    cityCode: "24203", citySlug: "ise", cityName: "伊勢市",
    rates: {
      rate:      { medical: 0.0743, support: 0.0281, care: 0.0248 },
      perCapita: { medical: 32095,  support: 11997,  care: 13021  },
      household: { medical: 21077,  support: 7878,   care: 6419   },
    },
  },
  {
    cityCode: "24204", citySlug: "matsusaka", cityName: "松阪市",
    rates: {
      rate:      { medical: 0.0739, support: 0.0285, care: 0.0248 },
      perCapita: { medical: 31932,  support: 12143,  care: 13023  },
      household: { medical: 20970,  support: 7974,   care: 6421   },
    },
  },
  {
    cityCode: "24205", citySlug: "kuwana", cityName: "桑名市",
    rates: {
      rate:      { medical: 0.0765, support: 0.0285, care: 0.0248 },
      perCapita: { medical: 33022,  support: 12172,  care: 13021  },
      household: { medical: 21686,  support: 7993,   care: 6419   },
    },
  },
  {
    cityCode: "24207", citySlug: "suzuka", cityName: "鈴鹿市",
    rates: {
      rate:      { medical: 0.0781, support: 0.0285, care: 0.0248 },
      perCapita: { medical: 33725,  support: 12150,  care: 13029  },
      household: { medical: 22147,  support: 7979,   care: 6423   },
    },
  },
  {
    cityCode: "24208", citySlug: "nabari", cityName: "名張市",
    rates: {
      rate:      { medical: 0.0753, support: 0.0285, care: 0.0249 },
      perCapita: { medical: 32520,  support: 12158,  care: 13078  },
      household: { medical: 21356,  support: 7984,   care: 6447   },
    },
  },
  {
    cityCode: "24209", citySlug: "owase", cityName: "尾鷲市",
    rates: {
      rate:      { medical: 0.0722, support: 0.0282, care: 0.0248 },
      perCapita: { medical: 31186,  support: 12011,  care: 13022  },
      household: { medical: 20480,  support: 7888,   care: 6420   },
    },
  },
  {
    cityCode: "24210", citySlug: "kameyama", cityName: "亀山市",
    rates: {
      rate:      { medical: 0.0756, support: 0.0284, care: 0.0248 },
      perCapita: { medical: 32642,  support: 12097,  care: 13023  },
      household: { medical: 21436,  support: 7944,   care: 6420   },
    },
  },
  {
    cityCode: "24211", citySlug: "toba", cityName: "鳥羽市",
    rates: {
      rate:      { medical: 0.0734, support: 0.0281, care: 0.0248 },
      perCapita: { medical: 31711,  support: 11987,  care: 13040  },
      household: { medical: 20825,  support: 7872,   care: 6429   },
    },
  },
  {
    cityCode: "24212", citySlug: "kumanoshi", cityName: "熊野市",
    rates: {
      rate:      { medical: 0.0599, support: 0.0282, care: 0.0248 },
      perCapita: { medical: 25878,  support: 12035,  care: 13021  },
      household: { medical: 16994,  support: 7903,   care: 6419   },
    },
  },
  {
    cityCode: "24214", citySlug: "inabe", cityName: "いなべ市",
    rates: {
      rate:      { medical: 0.0733, support: 0.0284, care: 0.0248 },
      perCapita: { medical: 31670,  support: 12127,  care: 13022  },
      household: { medical: 20798,  support: 7964,   care: 6420   },
    },
  },
  {
    cityCode: "24215", citySlug: "shima", cityName: "志摩市",
    rates: {
      rate:      { medical: 0.0711, support: 0.0281, care: 0.0248 },
      perCapita: { medical: 30694,  support: 11966,  care: 13021  },
      household: { medical: 20157,  support: 7858,   care: 6419   },
    },
  },
  {
    cityCode: "24216", citySlug: "iga", cityName: "伊賀市",
    rates: {
      rate:      { medical: 0.0757, support: 0.0284, care: 0.0248 },
      perCapita: { medical: 32705,  support: 12119,  care: 13026  },
      household: { medical: 21478,  support: 7958,   care: 6422   },
    },
  },

  // ── 町（15町）───────────────────────────────────────────────

  {
    cityCode: "24303", citySlug: "kisosaki", cityName: "木曽岬町",
    rates: {
      rate:      { medical: 0.0722, support: 0.0285, care: 0.0248 },
      perCapita: { medical: 31166,  support: 12150,  care: 13021  },
      household: { medical: 20467,  support: 7979,   care: 6419   },
    },
  },
  {
    cityCode: "24324", citySlug: "toin", cityName: "東員町",
    rates: {
      rate:      { medical: 0.0770, support: 0.0285, care: 0.0248 },
      perCapita: { medical: 33259,  support: 12158,  care: 13021  },
      household: { medical: 21841,  support: 7984,   care: 6419   },
    },
  },
  {
    cityCode: "24341", citySlug: "komono", cityName: "菰野町",
    rates: {
      rate:      { medical: 0.0763, support: 0.0284, care: 0.0248 },
      perCapita: { medical: 32967,  support: 12095,  care: 13021  },
      household: { medical: 21650,  support: 7943,   care: 6420   },
    },
  },
  {
    cityCode: "24343", citySlug: "asahicho", cityName: "朝日町",
    rates: {
      rate:      { medical: 0.0758, support: 0.0284, care: 0.0248 },
      perCapita: { medical: 32738,  support: 12114,  care: 13032  },
      household: { medical: 21499,  support: 7955,   care: 6425   },
    },
  },
  {
    cityCode: "24344", citySlug: "kawagoemachi", cityName: "川越町",
    rates: {
      rate:      { medical: 0.0775, support: 0.0283, care: 0.0247 },
      perCapita: { medical: 33470,  support: 12065,  care: 12989  },
      household: { medical: 21980,  support: 7923,   care: 6404   },
    },
  },
  {
    cityCode: "24441", citySlug: "taki", cityName: "多気町",
    rates: {
      rate:      { medical: 0.0728, support: 0.0281, care: 0.0248 },
      perCapita: { medical: 31425,  support: 11989,  care: 13021  },
      household: { medical: 20637,  support: 7873,   care: 6419   },
    },
  },
  {
    cityCode: "24442", citySlug: "meiwamachi", cityName: "明和町",
    rates: {
      rate:      { medical: 0.0721, support: 0.0282, care: 0.0248 },
      perCapita: { medical: 31126,  support: 12036,  care: 13021  },
      household: { medical: 20440,  support: 7904,   care: 6419   },
    },
  },
  {
    cityCode: "24443", citySlug: "odai", cityName: "大台町",
    rates: {
      rate:      { medical: 0.0653, support: 0.0281, care: 0.0248 },
      perCapita: { medical: 28182,  support: 11988,  care: 13022  },
      household: { medical: 18507,  support: 7872,   care: 6420   },
    },
  },
  {
    cityCode: "24461", citySlug: "tamaki", cityName: "玉城町",
    rates: {
      rate:      { medical: 0.0758, support: 0.0284, care: 0.0248 },
      perCapita: { medical: 32741,  support: 12092,  care: 13021  },
      household: { medical: 21501,  support: 7941,   care: 6419   },
    },
  },
  {
    cityCode: "24470", citySlug: "watarai", cityName: "度会町",
    rates: {
      rate:      { medical: 0.0705, support: 0.0282, care: 0.0248 },
      perCapita: { medical: 30440,  support: 12010,  care: 13021  },
      household: { medical: 19990,  support: 7887,   care: 6419   },
    },
  },
  {
    cityCode: "24471", citySlug: "taikimachi", cityName: "大紀町",
    rates: {
      rate:      { medical: 0.0671, support: 0.0283, care: 0.0248 },
      perCapita: { medical: 28960,  support: 12055,  care: 13021  },
      household: { medical: 19018,  support: 7917,   care: 6419   },
    },
  },
  {
    cityCode: "24472", citySlug: "minamiise", cityName: "南伊勢町",
    rates: {
      rate:      { medical: 0.0653, support: 0.0283, care: 0.0248 },
      perCapita: { medical: 28211,  support: 12059,  care: 13023  },
      household: { medical: 18527,  support: 7919,   care: 6420   },
    },
  },
  {
    cityCode: "24543", citySlug: "kihoku", cityName: "紀北町",
    rates: {
      rate:      { medical: 0.0672, support: 0.0281, care: 0.0248 },
      perCapita: { medical: 29029,  support: 11997,  care: 13023  },
      household: { medical: 19063,  support: 7879,   care: 6420   },
    },
  },
  {
    cityCode: "24561", citySlug: "mihamachomie", cityName: "御浜町",
    rates: {
      rate:      { medical: 0.0697, support: 0.0285, care: 0.0248 },
      perCapita: { medical: 30100,  support: 12166,  care: 13021  },
      household: { medical: 19767,  support: 7990,   care: 6419   },
    },
  },
  {
    cityCode: "24562", citySlug: "kiho", cityName: "紀宝町",
    rates: {
      rate:      { medical: 0.0588, support: 0.0281, care: 0.0248 },
      perCapita: { medical: 25401,  support: 11996,  care: 13021  },
      household: { medical: 16681,  support: 7878,   care: 6419   },
    },
  },
];
