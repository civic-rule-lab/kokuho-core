/**
 * 秋田県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典:
 *   秋田県「令和7年度秋田県国民健康保険標準保険税率一覧（令和7年3月26日）」
 *   各市町村公式ウェブサイト
 *
 * 使用: node scripts/generate-pref-kokuho.js akita
 *
 * 特記事項:
 *   - 賦課限度額: 全市町村共通 医療66万・後期26万・介護17万（令和7年度改定）
 *   - 多くの市町村が3方式（所得割+均等割+平等割）を採用
 *   - 由利本荘市・にかほ市は後期支援金分・介護分に平等割なし（2方式混在）
 *   ※ 五城目町・大潟村・上小阿仁村・藤里町・八峰町・井川町・東成瀬村は
 *     公式サイトから令和7年度確定値が取得できなかったため、
 *     秋田県標準保険税率一覧（市町村算定方式）の値を使用
 */

export const PREF_NAME = "秋田県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 秋田県 全25市町村（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市 ────────────────────────────────────────────────────────

  {
    cityCode: "05201", citySlug: "akita", cityName: "秋田市",
    rates: {
      rate:      { medical: 0.0922, support: 0.0251, care: 0.0288 },
      perCapita: { medical: 22960,  support: 6620,   care: 8950   },
      household: { medical: 28690,  support: 7450,   care: 8570   },
    },
  },
  {
    cityCode: "05202", citySlug: "noshiro", cityName: "能代市",
    rates: {
      rate:      { medical: 0.0745, support: 0.0288, care: 0.0193 },
      perCapita: { medical: 17300,  support: 6600,   care: 5800   },
      household: { medical: 20700,  support: 8000,   care: 5100   },
    },
  },
  {
    cityCode: "05203", citySlug: "yokote", cityName: "横手市",
    rates: {
      rate:      { medical: 0.0967, support: 0.0261, care: 0.0242 },
      perCapita: { medical: 24100,  support: 6500,   care: 7500   },
      household: { medical: 20800,  support: 5500,   care: 4200   },
    },
  },
  {
    cityCode: "05204", citySlug: "odate", cityName: "大館市",
    // ※ 公式サイト取得できず、秋田県標準一覧（市町村算定方式）の値を使用
    rates: {
      rate:      { medical: 0.0548, support: 0.0343, care: 0.0281 },
      perCapita: { medical: 15350,  support: 9848,   care: 9691   },
      household: { medical: 13599,  support: 8034,   care: 6807   },
    },
  },
  {
    cityCode: "05206", citySlug: "oga", cityName: "男鹿市",
    rates: {
      rate:      { medical: 0.0800, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 23000,  support: 8000,   care: 8000   },
      household: { medical: 17000,  support: 6000,   care: 4000   },
    },
  },
  {
    cityCode: "05207", citySlug: "yuzawacity", cityName: "湯沢市",
    rates: {
      rate:      { medical: 0.0730, support: 0.0360, care: 0.0270 },
      perCapita: { medical: 17700,  support: 9400,   care: 9500   },
      household: { medical: 13800,  support: 6100,   care: 4800   },
    },
  },
  {
    cityCode: "05209", citySlug: "kazuno", cityName: "鹿角市",
    // ※ 公式サイト（SSL期限切れ）から取得できず、秋田県標準一覧（市町村算定方式）の値を使用
    rates: {
      rate:      { medical: 0.0527, support: 0.0326, care: 0.0236 },
      perCapita: { medical: 17831,  support: 10568,  care: 10503  },
      household: { medical: 12043,  support: 7167,   care: 5647   },
    },
  },
  {
    cityCode: "05210", citySlug: "yurihonjo", cityName: "由利本荘市",
    rates: {
      rate:      { medical: 0.0860, support: 0.0270, care: 0.0280 },
      perCapita: { medical: 22500,  support: 11800,  care: 14000  },
      household: { medical: 26000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "05211", citySlug: "katagami", cityName: "潟上市",
    rates: {
      rate:      { medical: 0.0910, support: 0.0270, care: 0.0300 },
      perCapita: { medical: 23000,  support: 6800,   care: 8500   },
      household: { medical: 24000,  support: 5800,   care: 6000   },
    },
  },
  {
    cityCode: "05212", citySlug: "daisencity", cityName: "大仙市",
    rates: {
      rate:      { medical: 0.0850, support: 0.0250, care: 0.0210 },
      perCapita: { medical: 18300,  support: 5700,   care: 6500   },
      household: { medical: 27900,  support: 8100,   care: 7000   },
    },
  },
  {
    cityCode: "05213", citySlug: "kitaakita", cityName: "北秋田市",
    rates: {
      rate:      { medical: 0.0850, support: 0.0250, care: 0.0210 },
      perCapita: { medical: 22000,  support: 5000,   care: 7000   },
      household: { medical: 16500,  support: 3750,   care: 6000   },
    },
  },
  {
    cityCode: "05214", citySlug: "nikaho", cityName: "にかほ市",
    rates: {
      rate:      { medical: 0.0690, support: 0.0270, care: 0.0210 },
      perCapita: { medical: 34500,  support: 13100,  care: 13300  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "05215", citySlug: "semboku", cityName: "仙北市",
    // ※ 令和7年度は税率変更なし（賦課限度額のみ変更）
    rates: {
      rate:      { medical: 0.0680, support: 0.0350, care: 0.0300 },
      perCapita: { medical: 18000,  support: 9000,   care: 10000  },
      household: { medical: 17000,  support: 8000,   care: 4000   },
    },
  },

  // ── 町村 ──────────────────────────────────────────────────────

  {
    cityCode: "05303", citySlug: "kosakacho", cityName: "小坂町",
    // ※ 秋田県標準一覧（市町村算定方式）の値を使用
    rates: {
      rate:      { medical: 0.0528, support: 0.0317, care: 0.0272 },
      perCapita: { medical: 13129,  support: 8672,   care: 8180   },
      household: { medical: 15581,  support: 9516,   care: 7517   },
    },
  },
  {
    cityCode: "05327", citySlug: "kamikoanicho", cityName: "上小阿仁村",
    // ※ 秋田県標準一覧（市町村算定方式）の値を使用
    rates: {
      rate:      { medical: 0.0602, support: 0.0317, care: 0.0287 },
      perCapita: { medical: 16705,  support: 10158,  care: 6867   },
      household: { medical: 16808,  support: 7179,   care: 6465   },
    },
  },
  {
    cityCode: "05346", citySlug: "fujisatomachi", cityName: "藤里町",
    // ※ 秋田県標準一覧（市町村算定方式）の値を使用
    rates: {
      rate:      { medical: 0.0622, support: 0.0313, care: 0.0322 },
      perCapita: { medical: 20672,  support: 10790,  care: 9593   },
      household: { medical: 18963,  support: 9646,   care: 6246   },
    },
  },
  {
    cityCode: "05348", citySlug: "mitane", cityName: "三種町",
    rates: {
      rate:      { medical: 0.0576, support: 0.0256, care: 0.0188 },
      perCapita: { medical: 29400,  support: 9300,   care: 9000   },
      household: { medical: 21900,  support: 6900,   care: 6100   },
    },
  },
  {
    cityCode: "05349", citySlug: "happocho", cityName: "八峰町",
    // ※ 秋田県標準一覧（市町村算定方式）の値を使用
    rates: {
      rate:      { medical: 0.0525, support: 0.0292, care: 0.0246 },
      perCapita: { medical: 18156,  support: 10821,  care: 9649   },
      household: { medical: 14787,  support: 9253,   care: 7641   },
    },
  },
  {
    cityCode: "05361", citySlug: "gojomecho", cityName: "五城目町",
    // ※ 令和7年度改正あり、確定値不明のため令和6年度継続値を使用
    rates: {
      rate:      { medical: 0.0800, support: 0.0300, care: 0.0250 },
      perCapita: { medical: 19000,  support: 10000,  care: 8000   },
      household: { medical: 21000,  support: 7000,   care: 7000   },
    },
  },
  {
    cityCode: "05363", citySlug: "hachirogatacho", cityName: "八郎潟町",
    rates: {
      rate:      { medical: 0.0840, support: 0.0210, care: 0.0200 },
      perCapita: { medical: 21600,  support: 5400,   care: 7000   },
      household: { medical: 26400,  support: 6600,   care: 5000   },
    },
  },
  {
    cityCode: "05366", citySlug: "ikawacho", cityName: "井川町",
    // ※ 秋田県標準一覧（市町村算定方式）の値を使用
    rates: {
      rate:      { medical: 0.0520, support: 0.0298, care: 0.0292 },
      perCapita: { medical: 24426,  support: 12828,  care: 9206   },
      household: { medical: 15102,  support: 7915,   care: 6679   },
    },
  },
  {
    cityCode: "05368", citySlug: "ogatacho", cityName: "大潟村",
    // ※ 秋田県標準一覧（市町村算定方式）の値を使用
    rates: {
      rate:      { medical: 0.0421, support: 0.0290, care: 0.0163 },
      perCapita: { medical: 22158,  support: 16122,  care: 17143  },
      household: { medical: 25449,  support: 15144,  care: 17116  },
    },
  },
  {
    cityCode: "05434", citySlug: "misatocho", cityName: "美郷町",
    // ※ 公式サイト取得できず、秋田県標準一覧（市町村算定方式）の値を使用
    rates: {
      rate:      { medical: 0.0506, support: 0.0325, care: 0.0235 },
      perCapita: { medical: 19431,  support: 10276,  care: 11451  },
      household: { medical: 17593,  support: 8806,   care: 6288   },
    },
  },
  {
    cityCode: "05463", citySlug: "ugocho", cityName: "羽後町",
    rates: {
      rate:      { medical: 0.0770, support: 0.0280, care: 0.0200 },
      perCapita: { medical: 21000,  support: 7000,   care: 6000   },
      household: { medical: 25000,  support: 9000,   care: 9000   },
    },
  },
  {
    cityCode: "05464", citySlug: "higashinarusemura", cityName: "東成瀬村",
    // ※ 秋田県標準一覧（市町村算定方式）の値を使用
    rates: {
      rate:      { medical: 0.0395, support: 0.0311, care: 0.0220 },
      perCapita: { medical: 11758,  support: 10016,  care: 8853   },
      household: { medical: 12925,  support: 7952,   care: 7002   },
    },
  },
];
