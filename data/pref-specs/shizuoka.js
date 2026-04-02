/**
 * 静岡県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 静岡県「令和7年度 市町標準保険料率の算定結果」
 *   https://www.pref.shizuoka.jp/_res/projects/default_project/_page_/001/024/897/r7santeikekka.pdf
 *
 * 使用: node scripts/generate-pref-kokuho.js shizuoka
 *
 * 特記事項:
 *   - 令和7年度実際値は未公表のため、県標準保険料率を使用
 *   - 介護分は全市町2方式（所得割+均等割のみ、平等割なし）
 *   - 資産割なし（全35市町）
 *   - 賦課限度額: 全市町で全国標準（660/260/170万円）
 *   - slug競合: 小山町→oyamamachi（栃木県小山市がoyamaを使用）
 *             清水町→shimizumachi（北海道清水町がshimizuを使用）
 *             森町→morimachi（北海道森町がmoriを使用）
 */

export const PREF_NAME = "静岡県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 静岡県 全35市町（令和7年度 標準保険料率）
// 介護分: 全市町2方式（平等割=0）
// 資産割なし（全市町）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（23市）───────────────────────────────────────────────

  {
    cityCode: "22100", citySlug: "shizuoka", cityName: "静岡市",
    rates: {
      rate:      { medical: 0.0715, support: 0.0299, care: 0.0235 },
      perCapita: { medical: 29936,  support: 12153,  care: 16878  },
      household: { medical: 19587,  support: 7952,   care: 0      },
    },
  },
  {
    cityCode: "22130", citySlug: "hamamatsu", cityName: "浜松市",
    rates: {
      rate:      { medical: 0.0762, support: 0.0297, care: 0.0239 },
      perCapita: { medical: 31902,  support: 12065,  care: 17139  },
      household: { medical: 20874,  support: 7894,   care: 0      },
    },
  },
  {
    cityCode: "22203", citySlug: "numazu", cityName: "沼津市",
    rates: {
      rate:      { medical: 0.0714, support: 0.0283, care: 0.0221 },
      perCapita: { medical: 29898,  support: 11484,  care: 15828  },
      household: { medical: 19563,  support: 7514,   care: 0      },
    },
  },
  {
    cityCode: "22205", citySlug: "atami", cityName: "熱海市",
    rates: {
      rate:      { medical: 0.0695, support: 0.0300, care: 0.0226 },
      perCapita: { medical: 29113,  support: 12175,  care: 16223  },
      household: { medical: 19049,  support: 7966,   care: 0      },
    },
  },
  {
    cityCode: "22206", citySlug: "mishima", cityName: "三島市",
    rates: {
      rate:      { medical: 0.0716, support: 0.0287, care: 0.0223 },
      perCapita: { medical: 29958,  support: 11643,  care: 15996  },
      household: { medical: 19602,  support: 7618,   care: 0      },
    },
  },
  {
    cityCode: "22207", citySlug: "fujinomiya", cityName: "富士宮市",
    rates: {
      rate:      { medical: 0.0723, support: 0.0291, care: 0.0233 },
      perCapita: { medical: 30265,  support: 11825,  care: 16707  },
      household: { medical: 19803,  support: 7737,   care: 0      },
    },
  },
  {
    cityCode: "22208", citySlug: "ito", cityName: "伊東市",
    rates: {
      rate:      { medical: 0.0617, support: 0.0288, care: 0.0229 },
      perCapita: { medical: 25809,  support: 11680,  care: 16400  },
      household: { medical: 16887,  support: 7642,   care: 0      },
    },
  },
  {
    cityCode: "22209", citySlug: "shimada", cityName: "島田市",
    rates: {
      rate:      { medical: 0.0694, support: 0.0293, care: 0.0235 },
      perCapita: { medical: 29062,  support: 11906,  care: 16824  },
      household: { medical: 19015,  support: 7790,   care: 0      },
    },
  },
  {
    cityCode: "22210", citySlug: "fuji", cityName: "富士市",
    rates: {
      rate:      { medical: 0.0706, support: 0.0284, care: 0.0221 },
      perCapita: { medical: 29535,  support: 11544,  care: 15816  },
      household: { medical: 19325,  support: 7554,   care: 0      },
    },
  },
  {
    cityCode: "22211", citySlug: "iwata", cityName: "磐田市",
    rates: {
      rate:      { medical: 0.0706, support: 0.0292, care: 0.0236 },
      perCapita: { medical: 29559,  support: 11860,  care: 16933  },
      household: { medical: 19340,  support: 7760,   care: 0      },
    },
  },
  {
    cityCode: "22212", citySlug: "yaizu", cityName: "焼津市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0294, care: 0.0233 },
      perCapita: { medical: 29317,  support: 11944,  care: 16677  },
      household: { medical: 19182,  support: 7815,   care: 0      },
    },
  },
  {
    cityCode: "22213", citySlug: "kakegawa", cityName: "掛川市",
    rates: {
      rate:      { medical: 0.0706, support: 0.0296, care: 0.0235 },
      perCapita: { medical: 29541,  support: 12008,  care: 16851  },
      household: { medical: 19329,  support: 7857,   care: 0      },
    },
  },
  {
    cityCode: "22214", citySlug: "fujieda", cityName: "藤枝市",
    rates: {
      rate:      { medical: 0.0674, support: 0.0295, care: 0.0231 },
      perCapita: { medical: 28201,  support: 11978,  care: 16527  },
      household: { medical: 18452,  support: 7837,   care: 0      },
    },
  },
  {
    cityCode: "22215", citySlug: "gotemba", cityName: "御殿場市",
    rates: {
      rate:      { medical: 0.0763, support: 0.0306, care: 0.0243 },
      perCapita: { medical: 31954,  support: 12409,  care: 17405  },
      household: { medical: 20907,  support: 8119,   care: 0      },
    },
  },
  {
    cityCode: "22216", citySlug: "fukuroi", cityName: "袋井市",
    rates: {
      rate:      { medical: 0.0727, support: 0.0293, care: 0.0235 },
      perCapita: { medical: 30444,  support: 11906,  care: 16810  },
      household: { medical: 19920,  support: 7790,   care: 0      },
    },
  },
  {
    cityCode: "22219", citySlug: "shimoda", cityName: "下田市",
    rates: {
      rate:      { medical: 0.0720, support: 0.0287, care: 0.0228 },
      perCapita: { medical: 30140,  support: 11646,  care: 16360  },
      household: { medical: 19721,  support: 7620,   care: 0      },
    },
  },
  {
    cityCode: "22221", citySlug: "susono", cityName: "裾野市",
    rates: {
      rate:      { medical: 0.0744, support: 0.0288, care: 0.0227 },
      perCapita: { medical: 31134,  support: 11714,  care: 16294  },
      household: { medical: 20372,  support: 7664,   care: 0      },
    },
  },
  {
    cityCode: "22222", citySlug: "kosai", cityName: "湖西市",
    rates: {
      rate:      { medical: 0.0686, support: 0.0295, care: 0.0233 },
      perCapita: { medical: 28726,  support: 11960,  care: 16734  },
      household: { medical: 18795,  support: 7825,   care: 0      },
    },
  },
  {
    cityCode: "22223", citySlug: "izu", cityName: "伊豆市",
    rates: {
      rate:      { medical: 0.0724, support: 0.0289, care: 0.0230 },
      perCapita: { medical: 30313,  support: 11718,  care: 16480  },
      household: { medical: 19834,  support: 7667,   care: 0      },
    },
  },
  {
    cityCode: "22224", citySlug: "omaezaki", cityName: "御前崎市",
    rates: {
      rate:      { medical: 0.0839, support: 0.0291, care: 0.0230 },
      perCapita: { medical: 35140,  support: 11814,  care: 16503  },
      household: { medical: 22993,  support: 7730,   care: 0      },
    },
  },
  {
    cityCode: "22225", citySlug: "kikugawa", cityName: "菊川市",
    rates: {
      rate:      { medical: 0.0702, support: 0.0295, care: 0.0239 },
      perCapita: { medical: 29404,  support: 11962,  care: 17165  },
      household: { medical: 19239,  support: 7827,   care: 0      },
    },
  },
  {
    cityCode: "22226", citySlug: "izunokuni", cityName: "伊豆の国市",
    rates: {
      rate:      { medical: 0.0703, support: 0.0290, care: 0.0232 },
      perCapita: { medical: 29423,  support: 11769,  care: 16665  },
      household: { medical: 19252,  support: 7701,   care: 0      },
    },
  },
  {
    cityCode: "22227", citySlug: "makinohara", cityName: "牧之原市",
    rates: {
      rate:      { medical: 0.0724, support: 0.0287, care: 0.0219 },
      perCapita: { medical: 30328,  support: 11658,  care: 15682  },
      household: { medical: 19844,  support: 7628,   care: 0      },
    },
  },

  // ── 町（12町）───────────────────────────────────────────────

  {
    cityCode: "22301", citySlug: "higashiizu", cityName: "東伊豆町",
    rates: {
      rate:      { medical: 0.0725, support: 0.0278, care: 0.0224 },
      perCapita: { medical: 30354,  support: 11277,  care: 16047  },
      household: { medical: 19861,  support: 7379,   care: 0      },
    },
  },
  {
    cityCode: "22302", citySlug: "kawazu", cityName: "河津町",
    rates: {
      rate:      { medical: 0.0733, support: 0.0289, care: 0.0235 },
      perCapita: { medical: 30666,  support: 11719,  care: 16844  },
      household: { medical: 20065,  support: 7668,   care: 0      },
    },
  },
  {
    cityCode: "22304", citySlug: "minamiizu", cityName: "南伊豆町",
    rates: {
      rate:      { medical: 0.0651, support: 0.0280, care: 0.0229 },
      perCapita: { medical: 27242,  support: 11356,  care: 16405  },
      household: { medical: 17825,  support: 7431,   care: 0      },
    },
  },
  {
    cityCode: "22305", citySlug: "matsuzaki", cityName: "松崎町",
    rates: {
      rate:      { medical: 0.0681, support: 0.0287, care: 0.0229 },
      perCapita: { medical: 28518,  support: 11658,  care: 16381  },
      household: { medical: 18660,  support: 7628,   care: 0      },
    },
  },
  {
    cityCode: "22306", citySlug: "nishiizu", cityName: "西伊豆町",
    rates: {
      rate:      { medical: 0.0752, support: 0.0283, care: 0.0230 },
      perCapita: { medical: 31462,  support: 11503,  care: 16496  },
      household: { medical: 20586,  support: 7526,   care: 0      },
    },
  },
  {
    cityCode: "22325", citySlug: "kannami", cityName: "函南町",
    rates: {
      rate:      { medical: 0.0720, support: 0.0287, care: 0.0222 },
      perCapita: { medical: 30136,  support: 11643,  care: 15894  },
      household: { medical: 19718,  support: 7618,   care: 0      },
    },
  },
  {
    cityCode: "22341", citySlug: "shimizumachi", cityName: "清水町",
    rates: {
      rate:      { medical: 0.0695, support: 0.0286, care: 0.0223 },
      perCapita: { medical: 29082,  support: 11619,  care: 15977  },
      household: { medical: 19028,  support: 7603,   care: 0      },
    },
  },
  {
    cityCode: "22342", citySlug: "nagaizumi", cityName: "長泉町",
    rates: {
      rate:      { medical: 0.0762, support: 0.0293, care: 0.0231 },
      perCapita: { medical: 31878,  support: 11900,  care: 16563  },
      household: { medical: 20858,  support: 7786,   care: 0      },
    },
  },
  {
    cityCode: "22344", citySlug: "oyamamachi", cityName: "小山町",
    rates: {
      rate:      { medical: 0.0759, support: 0.0279, care: 0.0219 },
      perCapita: { medical: 31769,  support: 11316,  care: 15691  },
      household: { medical: 20787,  support: 7404,   care: 0      },
    },
  },
  {
    cityCode: "22424", citySlug: "yoshida", cityName: "吉田町",
    rates: {
      rate:      { medical: 0.0702, support: 0.0283, care: 0.0228 },
      perCapita: { medical: 29403,  support: 11499,  care: 16356  },
      household: { medical: 19238,  support: 7524,   care: 0      },
    },
  },
  {
    cityCode: "22461", citySlug: "kawanehon", cityName: "川根本町",
    rates: {
      rate:      { medical: 0.0712, support: 0.0280, care: 0.0225 },
      perCapita: { medical: 29787,  support: 11371,  care: 16134  },
      household: { medical: 19490,  support: 7440,   care: 0      },
    },
  },
  {
    cityCode: "22484", citySlug: "morimachi", cityName: "森町",
    rates: {
      rate:      { medical: 0.0765, support: 0.0296, care: 0.0241 },
      perCapita: { medical: 32013,  support: 12026,  care: 17287  },
      household: { medical: 20946,  support: 7868,   care: 0      },
    },
  },
];
