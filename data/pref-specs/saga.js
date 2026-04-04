/**
 * 佐賀県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典:
 *   各市町公式サイト（令和7年度）
 *   佐賀市: https://www.city.saga.lg.jp/main/107648.html
 *   唐津市: https://www.city.karatsu.lg.jp/
 *   鳥栖市: https://www.city.tosu.lg.jp/soshiki/15/1976.html
 *   多久市: https://www.city.taku.lg.jp/soshiki/2/23048.html
 *   伊万里市: https://www.city.imari.lg.jp/5460.htm
 *   武雄市: https://www.city.takeo.lg.jp/benri/kenko/kenkohoken/000172.html
 *   鹿島市: https://www.city.saga-kashima.lg.jp/main/26687.html
 *   小城市: https://www.city.ogi.lg.jp/main/16283.html
 *   嬉野市: https://www.city.ureshino.lg.jp/kurashi/zeikin/80.html
 *   神埼市: https://www.city.kanzaki.saga.jp/main/18892.html
 *
 * 使用: node scripts/generate-pref-kokuho.js saga
 *
 * 特記事項:
 *   - 佐賀県は3方式（所得割+均等割+平等割）が多数
 *   - 賦課限度額: 多くの市町が全国標準 医療66万・後期26万・介護17万（R7改定後）
 *   - TODO印の自治体は正式なR7データ未確認のため推定値を使用
 */

export const PREF_NAME = "佐賀県";

export const CAPS_NAT = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 佐賀県 全20市町（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市 ────────────────────────────────────────────────────────

  {
    cityCode: "41201", citySlug: "saga", cityName: "佐賀市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.1070, support: 0.0320, care: 0.0290 },
      perCapita: { medical: 30500,  support: 10500,  care: 10700  },
      household: { medical: 35500,  support: 8800,   care: 6000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "41202", citySlug: "karatsu", cityName: "唐津市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0950, support: 0.0290, care: 0.0260 },
      perCapita: { medical: 28000,  support: 9000,   care: 11000  },
      household: { medical: 30000,  support: 8500,   care: 6000   },
    },
  },
  {
    cityCode: "41203", citySlug: "tosu", cityName: "鳥栖市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0976, support: 0.0286, care: 0.0233 },
      perCapita: { medical: 31400,  support: 9700,   care: 11600  },
      household: { medical: 33500,  support: 10300,  care: 6100   },
    },
  },
  {
    cityCode: "41204", citySlug: "taku", cityName: "多久市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.1094, support: 0.0340, care: 0.0259 },
      perCapita: { medical: 29800,  support: 9100,   care: 12100  },
      household: { medical: 32200,  support: 9100,   care: 5300   },
    },
  },
  {
    cityCode: "41205", citySlug: "imari", cityName: "伊万里市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0980, support: 0.0270, care: 0.0260 },
      perCapita: { medical: 24400,  support: 7400,   care: 10600  },
      household: { medical: 37300,  support: 9200,   care: 6700   },
    },
  },
  {
    cityCode: "41206", citySlug: "takeo", cityName: "武雄市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.1022, support: 0.0305, care: 0.0236 },
      perCapita: { medical: 23300,  support: 7800,   care: 9500   },
      household: { medical: 33800,  support: 7900,   care: 6700   },
    },
  },
  {
    cityCode: "41207", citySlug: "kashima-saga", cityName: "鹿島市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.1110, support: 0.0210, care: 0.0235 },
      perCapita: { medical: 25200,  support: 4600,   care: 14300  },
      household: { medical: 37100,  support: 6800,   care: 8600   },
    },
  },
  {
    cityCode: "41208", citySlug: "ogi", cityName: "小城市",
    caps: { medical: 670000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0930, support: 0.0290, care: 0.0250 },
      perCapita: { medical: 32500,  support: 9400,   care: 9000   },
      household: { medical: 34900,  support: 9400,   care: 5200   },
    },
  },
  {
    cityCode: "41209", citySlug: "ureshino", cityName: "嬉野市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.1015, support: 0.0295, care: 0.0247 },
      perCapita: { medical: 25900,  support: 6600,   care: 9900   },
      household: { medical: 40600,  support: 10600,  care: 5500   },
    },
  },
  {
    cityCode: "41210", citySlug: "kanzaki", cityName: "神埼市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0960, support: 0.0245, care: 0.0243 },
      perCapita: { medical: 26800,  support: 7200,   care: 10900  },
      household: { medical: 32000,  support: 8700,   care: 5900   },
    },
  },

  // ── 町 ────────────────────────────────────────────────────────

  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "41327", citySlug: "yoshinogaricho", cityName: "吉野ヶ里町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0960, support: 0.0290, care: 0.0250 },
      perCapita: { medical: 28000,  support: 9000,   care: 10500  },
      household: { medical: 30000,  support: 8500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "41341", citySlug: "kiyamamachi", cityName: "基山町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0950, support: 0.0280, care: 0.0250 },
      perCapita: { medical: 27000,  support: 8500,   care: 10000  },
      household: { medical: 30000,  support: 8000,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "41345", citySlug: "kamiminememachi", cityName: "上峰町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0960, support: 0.0285, care: 0.0250 },
      perCapita: { medical: 27500,  support: 8700,   care: 10500  },
      household: { medical: 30500,  support: 8500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "41346", citySlug: "miyakimachi", cityName: "みやき町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0970, support: 0.0290, care: 0.0255 },
      perCapita: { medical: 28000,  support: 9000,   care: 10500  },
      household: { medical: 31000,  support: 8500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "41387", citySlug: "genkaimachi", cityName: "玄海町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0920, support: 0.0280, care: 0.0250 },
      perCapita: { medical: 27000,  support: 8500,   care: 10000  },
      household: { medical: 29000,  support: 8000,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "41401", citySlug: "aritamachi", cityName: "有田町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0970, support: 0.0290, care: 0.0255 },
      perCapita: { medical: 27500,  support: 8700,   care: 10500  },
      household: { medical: 31000,  support: 8500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "41423", citySlug: "omachimachi", cityName: "大町町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.1010, support: 0.0300, care: 0.0260 },
      perCapita: { medical: 28000,  support: 9000,   care: 11000  },
      household: { medical: 33000,  support: 8500,   care: 6000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "41424", citySlug: "kohokumachi", cityName: "江北町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.1000, support: 0.0300, care: 0.0260 },
      perCapita: { medical: 28000,  support: 9000,   care: 11000  },
      household: { medical: 33000,  support: 8500,   care: 6000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "41425", citySlug: "shiroishicho", cityName: "白石町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.1000, support: 0.0300, care: 0.0260 },
      perCapita: { medical: 28000,  support: 9000,   care: 11000  },
      household: { medical: 33000,  support: 8500,   care: 6000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "41441", citySlug: "tararacho", cityName: "太良町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.1010, support: 0.0305, care: 0.0260 },
      perCapita: { medical: 28000,  support: 9000,   care: 11500  },
      household: { medical: 33000,  support: 8500,   care: 6000   },
    },
  },
];
