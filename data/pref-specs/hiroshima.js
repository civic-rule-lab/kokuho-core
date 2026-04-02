/**
 * 広島県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 各市町公式サイト（実際値）、一部は広島県標準料率
 *   広島県算定結果ページ:
 *   https://www.pref.hiroshima.lg.jp/soshiki/258/07honsantei-kokuho.html
 *
 * 使用: node scripts/generate-pref-kokuho.js hiroshima
 *
 * 特記事項:
 *   - 全23市町 3方式（所得割+均等割+平等割）
 *   - 資産割なし（全市町）
 *   - 賦課限度額: 全市町で全国標準（660/260/170万円）
 *   - slug競合: 府中市→fuchushi（東京都府中市がfuchuを使用）
 *             三次市→miyoshishi（埼玉県三芳町がmiyoshiを使用）
 *             北広島町→kitahiroshimamachi（北海道北広島市がkitahiroshimaを使用）
 *   - 廿日市市: 公式サイトがR8に更新済のためR7標準料率を使用（要確認）
 *   - 坂町・神石高原町: R7実際値未確認のためR6現行料率を参考使用（要確認）
 */

export const PREF_NAME = "広島県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 広島県 全23市町（令和7年度）
// 全市町3方式（所得割+均等割+平等割）、資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（14市）───────────────────────────────────────────────

  {
    cityCode: "34100", citySlug: "hiroshima", cityName: "広島市",
    rates: {
      rate:      { medical: 0.0830, support: 0.0278, care: 0.0234 },
      perCapita: { medical: 30133,  support: 10330,  care: 9522   },
      household: { medical: 29758,  support: 10201,  care: 7163   },
    },
  },
  {
    cityCode: "34202", citySlug: "kure", cityName: "呉市",
    rates: {
      rate:      { medical: 0.0820, support: 0.0275, care: 0.0230 },
      perCapita: { medical: 33600,  support: 11280,  care: 10440  },
      household: { medical: 22080,  support: 7440,   care: 5280   },
    },
  },
  {
    cityCode: "34203", citySlug: "takehara", cityName: "竹原市",
    rates: {
      rate:      { medical: 0.0740, support: 0.0283, care: 0.0232 },
      perCapita: { medical: 31700,  support: 11900,  care: 11800  },
      household: { medical: 20500,  support: 7600,   care: 5700   },
    },
  },
  {
    cityCode: "34204", citySlug: "mihara", cityName: "三原市",
    rates: {
      rate:      { medical: 0.0797, support: 0.0269, care: 0.0209 },
      perCapita: { medical: 33709,  support: 11180,  care: 10695  },
      household: { medical: 21925,  support: 7340,   care: 5201   },
    },
  },
  {
    cityCode: "34205", citySlug: "onomichi", cityName: "尾道市",
    rates: {
      rate:      { medical: 0.0844, support: 0.0282, care: 0.0222 },
      perCapita: { medical: 36100,  support: 11880,  care: 11360  },
      household: { medical: 23360,  support: 7640,   care: 5510   },
    },
  },
  {
    cityCode: "34207", citySlug: "fukuyama", cityName: "福山市",
    rates: {
      rate:      { medical: 0.0899, support: 0.0315, care: 0.0279 },
      perCapita: { medical: 29520,  support: 10680,  care: 9960   },
      household: { medical: 19680,  support: 6480,   care: 4800   },
    },
  },
  {
    cityCode: "34208", citySlug: "fuchushi", cityName: "府中市",
    rates: {
      rate:      { medical: 0.0831, support: 0.0284, care: 0.0231 },
      perCapita: { medical: 35612,  support: 12015,  care: 11819  },
      household: { medical: 22868,  support: 7715,   care: 5728   },
    },
  },
  {
    cityCode: "34209", citySlug: "miyoshishi", cityName: "三次市",
    rates: {
      rate:      { medical: 0.0793, support: 0.0261, care: 0.0201 },
      perCapita: { medical: 32900,  support: 10900,  care: 10200  },
      household: { medical: 21600,  support: 7000,   care: 5100   },
    },
  },
  {
    cityCode: "34210", citySlug: "shobara", cityName: "庄原市",
    rates: {
      rate:      { medical: 0.0735, support: 0.0283, care: 0.0228 },
      perCapita: { medical: 31920,  support: 11984,  care: 11670  },
      household: { medical: 20440,  support: 7696,   care: 5656   },
    },
  },
  {
    cityCode: "34211", citySlug: "otake", cityName: "大竹市",
    rates: {
      rate:      { medical: 0.0835, support: 0.0284, care: 0.0234 },
      perCapita: { medical: 36113,  support: 11600,  care: 11067  },
      household: { medical: 23594,  support: 7579,   care: 5354   },
    },
  },
  {
    cityCode: "34212", citySlug: "higashihiroshima", cityName: "東広島市",
    rates: {
      rate:      { medical: 0.0771, support: 0.0289, care: 0.0235 },
      perCapita: { medical: 33195,  support: 12211,  care: 11996  },
      household: { medical: 21294,  support: 7841,   care: 5814   },
    },
  },
  {
    cityCode: "34213", citySlug: "hatsukaichi", cityName: "廿日市市",
    rates: {
      rate:      { medical: 0.0770, support: 0.0280, care: 0.0210 },
      perCapita: { medical: 32700,  support: 11400,  care: 10600  },
      household: { medical: 23400,  support: 7300,   care: 5300   },
    },
  },
  {
    cityCode: "34214", citySlug: "akitakata", cityName: "安芸高田市",
    rates: {
      rate:      { medical: 0.0821, support: 0.0284, care: 0.0229 },
      perCapita: { medical: 31900,  support: 12000,  care: 11700  },
      household: { medical: 20400,  support: 7700,   care: 5600   },
    },
  },
  {
    cityCode: "34215", citySlug: "etajima", cityName: "江田島市",
    rates: {
      rate:      { medical: 0.0887, support: 0.0288, care: 0.0235 },
      perCapita: { medical: 37995,  support: 12171,  care: 12015  },
      household: { medical: 24399,  support: 7816,   care: 5823   },
    },
  },

  // ── 町（9町）───────────────────────────────────────────────

  {
    cityCode: "34302", citySlug: "fuchucho", cityName: "府中町",
    rates: {
      rate:      { medical: 0.0865, support: 0.0282, care: 0.0230 },
      perCapita: { medical: 37055,  support: 11918,  care: 11754  },
      household: { medical: 23795,  support: 7653,   care: 5697   },
    },
  },
  {
    cityCode: "34304", citySlug: "kaita", cityName: "海田町",
    rates: {
      rate:      { medical: 0.0845, support: 0.0287, care: 0.0233 },
      perCapita: { medical: 36500,  support: 12100,  care: 11900  },
      household: { medical: 23500,  support: 7800,   care: 5800   },
    },
  },
  {
    cityCode: "34307", citySlug: "kumano", cityName: "熊野町",
    rates: {
      rate:      { medical: 0.0738, support: 0.0242, care: 0.0210 },
      perCapita: { medical: 34100,  support: 11100,  care: 11000  },
      household: { medical: 24100,  support: 7800,   care: 7100   },
    },
  },
  {
    cityCode: "34309", citySlug: "saka", cityName: "坂町",
    rates: {
      rate:      { medical: 0.0737, support: 0.0260, care: 0.0204 },
      perCapita: { medical: 32700,  support: 11260,  care: 10420  },
      household: { medical: 22130,  support: 7600,   care: 5060   },
    },
  },
  {
    cityCode: "34368", citySlug: "akiota", cityName: "安芸太田町",
    rates: {
      rate:      { medical: 0.0778, support: 0.0283, care: 0.0224 },
      perCapita: { medical: 31900,  support: 11300,  care: 11400  },
      household: { medical: 20700,  support: 7600,   care: 5500   },
    },
  },
  {
    cityCode: "34369", citySlug: "kitahiroshimamachi", cityName: "北広島町",
    rates: {
      rate:      { medical: 0.0820, support: 0.0284, care: 0.0202 },
      perCapita: { medical: 33793,  support: 11735,  care: 10472  },
      household: { medical: 22201,  support: 7712,   care: 5087   },
    },
  },
  {
    cityCode: "34431", citySlug: "osakikamijima", cityName: "大崎上島町",
    rates: {
      rate:      { medical: 0.0840, support: 0.0290, care: 0.0210 },
      perCapita: { medical: 35000,  support: 11500,  care: 11000  },
      household: { medical: 23000,  support: 7000,   care: 6000   },
    },
  },
  {
    cityCode: "34462", citySlug: "sera", cityName: "世羅町",
    rates: {
      rate:      { medical: 0.0760, support: 0.0274, care: 0.0213 },
      perCapita: { medical: 32574,  support: 11464,  care: 10931  },
      household: { medical: 20990,  support: 7389,   care: 5335   },
    },
  },
  {
    cityCode: "34545", citySlug: "jinsekikogen", cityName: "神石高原町",
    rates: {
      rate:      { medical: 0.0750, support: 0.0285, care: 0.0200 },
      perCapita: { medical: 29600,  support: 9200,   care: 9300   },
      household: { medical: 20600,  support: 7600,   care: 5000   },
    },
  },
];
