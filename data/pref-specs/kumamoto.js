/**
 * 熊本県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 熊本県「令和7年度（2025年度）国民健康保険事業費納付金に係る標準保険料率について」
 *   https://www.pref.kumamoto.jp/uploaded/life/230781_653603_misc.pdf
 *
 * 使用: node scripts/generate-pref-kokuho.js kumamoto
 *
 * 特記事項:
 *   - 全45市町村 標準保険料率
 *   - 医療分・後期分: 3方式（所得割+均等割+平等割）
 *   - 介護分: 2方式（所得割+均等割、平等割=0）
 *   - 資産割なし（全市町村）
 *   - 賦課限度額: 全市町村で全国標準（660/260/170万円）
 *   - 水俣市・芦北町・津奈木町: 医療分の所得割・均等割・平等割が他市町村より著しく低い値
 *     （PDF原本記載値をそのまま使用）
 *   - slug競合: 美里町→misatokuma（埼玉三郷市がmisatoを使用）
 *             高森町→takamorimachi（長野高森町がtakamoiを使用）
 *             西原村→nishiharamura（沖縄西原町がnishiharaを使用）
 *             嘉島町→kashimacho（茨城鹿嶋市がkashimaを使用）
 *             山都町→yamatomachi（神奈川大和市がyamatoを使用）
 */

export const PREF_NAME = "熊本県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 熊本県 全45市町村（令和7年度 市町村標準保険料率）
// 医療分・後期分: 3方式 / 介護分: 2方式（平等割=0）/ 資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（14市）───────────────────────────────────────────────

  {
    cityCode: "43100", citySlug: "kumamoto", cityName: "熊本市",
    rates: {
      rate:      { medical: 0.0846, support: 0.0328, care: 0.0259 },
      perCapita: { medical: 29577,  support: 11419,  care: 16922  },
      household: { medical: 19989,  support: 7718,   care: 0      },
    },
  },
  {
    cityCode: "43202", citySlug: "yatsushiro", cityName: "八代市",
    rates: {
      rate:      { medical: 0.0846, support: 0.0307, care: 0.0244 },
      perCapita: { medical: 29559,  support: 10695,  care: 15910  },
      household: { medical: 19977,  support: 7228,   care: 0      },
    },
  },
  {
    cityCode: "43203", citySlug: "hitoyoshi", cityName: "人吉市",
    rates: {
      rate:      { medical: 0.0826, support: 0.0304, care: 0.0233 },
      perCapita: { medical: 28871,  support: 10604,  care: 15192  },
      household: { medical: 19512,  support: 7167,   care: 0      },
    },
  },
  {
    cityCode: "43204", citySlug: "arao", cityName: "荒尾市",
    rates: {
      rate:      { medical: 0.0849, support: 0.0309, care: 0.0251 },
      perCapita: { medical: 29663,  support: 10777,  care: 16354  },
      household: { medical: 20048,  support: 7284,   care: 0      },
    },
  },
  {
    cityCode: "43205", citySlug: "minamata", cityName: "水俣市",
    rates: {
      rate:      { medical: 0.0260, support: 0.0309, care: 0.0260 },
      perCapita: { medical: 9093,   support: 10764,  care: 16946  },
      household: { medical: 6146,   support: 7275,   care: 0      },
    },
  },
  {
    cityCode: "43206", citySlug: "tamana", cityName: "玉名市",
    rates: {
      rate:      { medical: 0.0876, support: 0.0309, care: 0.0245 },
      perCapita: { medical: 30618,  support: 10759,  care: 15984  },
      household: { medical: 20693,  support: 7271,   care: 0      },
    },
  },
  {
    cityCode: "43208", citySlug: "yamaga", cityName: "山鹿市",
    rates: {
      rate:      { medical: 0.0859, support: 0.0310, care: 0.0250 },
      perCapita: { medical: 30011,  support: 10807,  care: 16316  },
      household: { medical: 20283,  support: 7304,   care: 0      },
    },
  },
  {
    cityCode: "43210", citySlug: "kikuchi", cityName: "菊池市",
    rates: {
      rate:      { medical: 0.0823, support: 0.0307, care: 0.0238 },
      perCapita: { medical: 28748,  support: 10707,  care: 15526  },
      household: { medical: 19430,  support: 7236,   care: 0      },
    },
  },
  {
    cityCode: "43211", citySlug: "uto", cityName: "宇土市",
    rates: {
      rate:      { medical: 0.0773, support: 0.0315, care: 0.0249 },
      perCapita: { medical: 27015,  support: 10961,  care: 16234  },
      household: { medical: 18258,  support: 7408,   care: 0      },
    },
  },
  {
    cityCode: "43213", citySlug: "kamiamakusa", cityName: "上天草市",
    rates: {
      rate:      { medical: 0.0831, support: 0.0309, care: 0.0242 },
      perCapita: { medical: 29018,  support: 10763,  care: 15808  },
      household: { medical: 19612,  support: 7274,   care: 0      },
    },
  },
  {
    cityCode: "43214", citySlug: "ukishi", cityName: "宇城市",
    rates: {
      rate:      { medical: 0.0897, support: 0.0308, care: 0.0247 },
      perCapita: { medical: 31347,  support: 10735,  care: 16126  },
      household: { medical: 21186,  support: 7255,   care: 0      },
    },
  },
  {
    cityCode: "43215", citySlug: "aso", cityName: "阿蘇市",
    rates: {
      rate:      { medical: 0.0908, support: 0.0310, care: 0.0250 },
      perCapita: { medical: 31718,  support: 10809,  care: 16276  },
      household: { medical: 21437,  support: 7305,   care: 0      },
    },
  },
  {
    cityCode: "43216", citySlug: "amakusa", cityName: "天草市",
    rates: {
      rate:      { medical: 0.0755, support: 0.0307, care: 0.0245 },
      perCapita: { medical: 26371,  support: 10707,  care: 15980  },
      household: { medical: 17823,  support: 7236,   care: 0      },
    },
  },
  {
    cityCode: "43217", citySlug: "koshi", cityName: "合志市",
    rates: {
      rate:      { medical: 0.0898, support: 0.0314, care: 0.0253 },
      perCapita: { medical: 31390,  support: 10933,  care: 16498  },
      household: { medical: 21215,  support: 7389,   care: 0      },
    },
  },

  // ── 町村（31町村）───────────────────────────────────────────

  {
    cityCode: "43348", citySlug: "misatokuma", cityName: "美里町",
    rates: {
      rate:      { medical: 0.0854, support: 0.0315, care: 0.0256 },
      perCapita: { medical: 29852,  support: 10985,  care: 16674  },
      household: { medical: 20176,  support: 7424,   care: 0      },
    },
  },
  {
    cityCode: "43361", citySlug: "gyokuto", cityName: "玉東町",
    rates: {
      rate:      { medical: 0.0890, support: 0.0244, care: 0.0253 },
      perCapita: { medical: 31090,  support: 8500,   care: 16518  },
      household: { medical: 21013,  support: 5745,   care: 0      },
    },
  },
  {
    cityCode: "43364", citySlug: "nankan", cityName: "南関町",
    rates: {
      rate:      { medical: 0.0731, support: 0.0304, care: 0.0247 },
      perCapita: { medical: 25532,  support: 10601,  care: 16098  },
      household: { medical: 17256,  support: 7165,   care: 0      },
    },
  },
  {
    cityCode: "43365", citySlug: "nagasu", cityName: "長洲町",
    rates: {
      rate:      { medical: 0.0849, support: 0.0309, care: 0.0257 },
      perCapita: { medical: 29680,  support: 10762,  care: 16768  },
      household: { medical: 20059,  support: 7274,   care: 0      },
    },
  },
  {
    cityCode: "43366", citySlug: "nagomi", cityName: "和水町",
    rates: {
      rate:      { medical: 0.0882, support: 0.0303, care: 0.0236 },
      perCapita: { medical: 30802,  support: 10561,  care: 15390  },
      household: { medical: 20818,  support: 7138,   care: 0      },
    },
  },
  {
    cityCode: "43381", citySlug: "otsumachi", cityName: "大津町",
    rates: {
      rate:      { medical: 0.0900, support: 0.0319, care: 0.0259 },
      perCapita: { medical: 31441,  support: 11106,  care: 16873  },
      household: { medical: 21250,  support: 7506,   care: 0      },
    },
  },
  {
    cityCode: "43382", citySlug: "kikuyo", cityName: "菊陽町",
    rates: {
      rate:      { medical: 0.0787, support: 0.0303, care: 0.0255 },
      perCapita: { medical: 27489,  support: 10563,  care: 16633  },
      household: { medical: 18579,  support: 7139,   care: 0      },
    },
  },
  {
    cityCode: "43401", citySlug: "minamioguni", cityName: "南小国町",
    rates: {
      rate:      { medical: 0.0877, support: 0.0299, care: 0.0205 },
      perCapita: { medical: 30637,  support: 10434,  care: 13366  },
      household: { medical: 20706,  support: 7052,   care: 0      },
    },
  },
  {
    cityCode: "43402", citySlug: "oguni", cityName: "小国町",
    rates: {
      rate:      { medical: 0.0847, support: 0.0310, care: 0.0248 },
      perCapita: { medical: 29593,  support: 10791,  care: 16201  },
      household: { medical: 20000,  support: 7293,   care: 0      },
    },
  },
  {
    cityCode: "43404", citySlug: "ubuyama", cityName: "産山村",
    rates: {
      rate:      { medical: 0.0729, support: 0.0312, care: 0.0201 },
      perCapita: { medical: 25474,  support: 10864,  care: 13106  },
      household: { medical: 17216,  support: 7342,   care: 0      },
    },
  },
  {
    cityCode: "43406", citySlug: "takamorimachi", cityName: "高森町",
    rates: {
      rate:      { medical: 0.0803, support: 0.0302, care: 0.0237 },
      perCapita: { medical: 28046,  support: 10521,  care: 15478  },
      household: { medical: 18955,  support: 7111,   care: 0      },
    },
  },
  {
    cityCode: "43423", citySlug: "nishiharamura", cityName: "西原村",
    rates: {
      rate:      { medical: 0.0878, support: 0.0308, care: 0.0242 },
      perCapita: { medical: 30685,  support: 10718,  care: 15804  },
      household: { medical: 20738,  support: 7244,   care: 0      },
    },
  },
  {
    cityCode: "43424", citySlug: "minamiaso", cityName: "南阿蘇村",
    rates: {
      rate:      { medical: 0.0817, support: 0.0317, care: 0.0242 },
      perCapita: { medical: 28540,  support: 11048,  care: 15775  },
      household: { medical: 19289,  support: 7467,   care: 0      },
    },
  },
  {
    cityCode: "43441", citySlug: "mifune", cityName: "御船町",
    rates: {
      rate:      { medical: 0.0931, support: 0.0312, care: 0.0255 },
      perCapita: { medical: 32531,  support: 10880,  care: 16626  },
      household: { medical: 21986,  support: 7353,   care: 0      },
    },
  },
  {
    cityCode: "43443", citySlug: "kashimacho", cityName: "嘉島町",
    rates: {
      rate:      { medical: 0.0850, support: 0.0308, care: 0.0232 },
      perCapita: { medical: 29710,  support: 10750,  care: 15110  },
      household: { medical: 20079,  support: 7265,   care: 0      },
    },
  },
  {
    cityCode: "43444", citySlug: "mashiki", cityName: "益城町",
    rates: {
      rate:      { medical: 0.0769, support: 0.0306, care: 0.0250 },
      perCapita: { medical: 26872,  support: 10653,  care: 16328  },
      household: { medical: 18162,  support: 7200,   care: 0      },
    },
  },
  {
    cityCode: "43446", citySlug: "kosa", cityName: "甲佐町",
    rates: {
      rate:      { medical: 0.0780, support: 0.0296, care: 0.0236 },
      perCapita: { medical: 27256,  support: 10325,  care: 15394  },
      household: { medical: 18421,  support: 6978,   care: 0      },
    },
  },
  {
    cityCode: "43447", citySlug: "yamatomachi", cityName: "山都町",
    rates: {
      rate:      { medical: 0.0829, support: 0.0301, care: 0.0241 },
      perCapita: { medical: 28957,  support: 10500,  care: 15735  },
      household: { medical: 19570,  support: 7097,   care: 0      },
    },
  },
  {
    cityCode: "43468", citySlug: "hikawa", cityName: "氷川町",
    rates: {
      rate:      { medical: 0.0768, support: 0.0288, care: 0.0213 },
      perCapita: { medical: 26835,  support: 10045,  care: 13919  },
      household: { medical: 18137,  support: 6789,   care: 0      },
    },
  },
  {
    cityCode: "43482", citySlug: "ashikita", cityName: "芦北町",
    rates: {
      rate:      { medical: 0.0402, support: 0.0308, care: 0.0255 },
      perCapita: { medical: 14060,  support: 10740,  care: 16657  },
      household: { medical: 9502,   support: 7259,   care: 0      },
    },
  },
  {
    cityCode: "43484", citySlug: "tsunagi", cityName: "津奈木町",
    rates: {
      rate:      { medical: 0.0212, support: 0.0302, care: 0.0236 },
      perCapita: { medical: 7411,   support: 10520,  care: 15371  },
      household: { medical: 5009,   support: 7110,   care: 0      },
    },
  },
  {
    cityCode: "43501", citySlug: "nishiki", cityName: "錦町",
    rates: {
      rate:      { medical: 0.0866, support: 0.0304, care: 0.0242 },
      perCapita: { medical: 30256,  support: 10605,  care: 15792  },
      household: { medical: 20449,  support: 7168,   care: 0      },
    },
  },
  {
    cityCode: "43503", citySlug: "taragi", cityName: "多良木町",
    rates: {
      rate:      { medical: 0.0815, support: 0.0298, care: 0.0240 },
      perCapita: { medical: 28478,  support: 10394,  care: 15622  },
      household: { medical: 19247,  support: 7025,   care: 0      },
    },
  },
  {
    cityCode: "43504", citySlug: "yunomae", cityName: "湯前町",
    rates: {
      rate:      { medical: 0.0839, support: 0.0303, care: 0.0240 },
      perCapita: { medical: 29308,  support: 10552,  care: 15624  },
      household: { medical: 19808,  support: 7132,   care: 0      },
    },
  },
  {
    cityCode: "43505", citySlug: "mizukami", cityName: "水上村",
    rates: {
      rate:      { medical: 0.0775, support: 0.0309, care: 0.0246 },
      perCapita: { medical: 27090,  support: 10770,  care: 16041  },
      household: { medical: 18309,  support: 7279,   care: 0      },
    },
  },
  {
    cityCode: "43508", citySlug: "sagara", cityName: "相良村",
    rates: {
      rate:      { medical: 0.0726, support: 0.0307, care: 0.0242 },
      perCapita: { medical: 25359,  support: 10689,  care: 15776  },
      household: { medical: 17139,  support: 7224,   care: 0      },
    },
  },
  {
    cityCode: "43510", citySlug: "itsuki", cityName: "五木村",
    rates: {
      rate:      { medical: 0.0754, support: 0.0302, care: 0.0237 },
      perCapita: { medical: 26338,  support: 10525,  care: 15477  },
      household: { medical: 17801,  support: 7113,   care: 0      },
    },
  },
  {
    cityCode: "43512", citySlug: "yamae", cityName: "山江村",
    rates: {
      rate:      { medical: 0.0795, support: 0.0307, care: 0.0240 },
      perCapita: { medical: 27792,  support: 10706,  care: 15623  },
      household: { medical: 18783,  support: 7236,   care: 0      },
    },
  },
  {
    cityCode: "43513", citySlug: "kuma", cityName: "球磨村",
    rates: {
      rate:      { medical: 0.0786, support: 0.0262, care: 0.0192 },
      perCapita: { medical: 27460,  support: 9134,   care: 12535  },
      household: { medical: 18559,  support: 6173,   care: 0      },
    },
  },
  {
    cityCode: "43514", citySlug: "asagiri", cityName: "あさぎり町",
    rates: {
      rate:      { medical: 0.0867, support: 0.0305, care: 0.0250 },
      perCapita: { medical: 30285,  support: 10632,  care: 16287  },
      household: { medical: 20469,  support: 7186,   care: 0      },
    },
  },
  {
    cityCode: "43531", citySlug: "reihoku", cityName: "苓北町",
    rates: {
      rate:      { medical: 0.0725, support: 0.0306, care: 0.0248 },
      perCapita: { medical: 25321,  support: 10659,  care: 16152  },
      household: { medical: 17113,  support: 7204,   care: 0      },
    },
  },
];
