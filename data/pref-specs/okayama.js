/**
 * 岡山県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 岡山県「令和7年度 国民健康保険料（税）率」
 *   https://www.pref.okayama.jp/uploaded/attachment/395645.pdf
 *
 * 使用: node scripts/generate-pref-kokuho.js okayama
 *
 * 特記事項:
 *   - 資産割あり（4方式）: 真庭市（医療16.6%/後期4.3%/介護4.5%）、美作市（10.85%/4.3%/3.85%）、
 *                         新庄村（36%/10%/5%）、吉備中央町（19.6%/8.1%/8.8%）
 *   - 総社市: 介護分平等割なし
 *   - 賦課限度額: 全市町村で全国標準（660/260/170万円）
 *   - slug競合: 赤磐市→akaiwashi（北海道赤井川村がakaIwaを使用）
 *             美咲町→misakicho（大阪府岬町がmisakiを使用）
 */

export const PREF_NAME = "岡山県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 岡山県 全27市町村（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（15市）───────────────────────────────────────────────

  {
    cityCode: "33100", citySlug: "okayama", cityName: "岡山市",
    rates: {
      rate:      { medical: 0.0815, support: 0.0295, care: 0.0260 },
      perCapita: { medical: 28320,  support: 10320,  care: 10920  },
      household: { medical: 20880,  support: 6960,   care: 5280   },
    },
  },
  {
    cityCode: "33202", citySlug: "kurashiki", cityName: "倉敷市",
    rates: {
      rate:      { medical: 0.0720, support: 0.0260, care: 0.0220 },
      perCapita: { medical: 26040,  support: 9240,   care: 9240   },
      household: { medical: 21240,  support: 6720,   care: 5280   },
    },
  },
  {
    cityCode: "33203", citySlug: "tsuyama", cityName: "津山市",
    rates: {
      rate:      { medical: 0.0770, support: 0.0300, care: 0.0280 },
      perCapita: { medical: 23400,  support: 9000,   care: 9000   },
      household: { medical: 16800,  support: 6000,   care: 4800   },
    },
  },
  {
    cityCode: "33204", citySlug: "tamano", cityName: "玉野市",
    rates: {
      rate:      { medical: 0.0760, support: 0.0290, care: 0.0210 },
      perCapita: { medical: 22000,  support: 8400,   care: 7100   },
      household: { medical: 21300,  support: 7900,   care: 5500   },
    },
  },
  {
    cityCode: "33205", citySlug: "kasaoka", cityName: "笠岡市",
    rates: {
      rate:      { medical: 0.0880, support: 0.0260, care: 0.0210 },
      perCapita: { medical: 22800,  support: 7700,   care: 8500   },
      household: { medical: 16700,  support: 5800,   care: 4300   },
    },
  },
  {
    cityCode: "33207", citySlug: "ibara", cityName: "井原市",
    rates: {
      rate:      { medical: 0.0760, support: 0.0230, care: 0.0200 },
      perCapita: { medical: 30300,  support: 9200,   care: 10200  },
      household: { medical: 21300,  support: 6500,   care: 4800   },
    },
  },
  {
    cityCode: "33208", citySlug: "soja", cityName: "総社市",
    rates: {
      rate:      { medical: 0.0830, support: 0.0290, care: 0.0220 },
      perCapita: { medical: 23600,  support: 8300,   care: 13700  },
      household: { medical: 19100,  support: 6500,   care: 0      },
    },
  },
  {
    cityCode: "33209", citySlug: "takahashi", cityName: "高梁市",
    rates: {
      rate:      { medical: 0.0800, support: 0.0310, care: 0.0220 },
      perCapita: { medical: 23900,  support: 9400,   care: 10500  },
      household: { medical: 18500,  support: 7500,   care: 5300   },
    },
  },
  {
    cityCode: "33210", citySlug: "niimi", cityName: "新見市",
    rates: {
      rate:      { medical: 0.0780, support: 0.0260, care: 0.0220 },
      perCapita: { medical: 27000,  support: 7000,   care: 9100   },
      household: { medical: 16000,  support: 5000,   care: 4600   },
    },
  },
  {
    cityCode: "33211", citySlug: "bizen", cityName: "備前市",
    rates: {
      rate:      { medical: 0.0840, support: 0.0250, care: 0.0190 },
      perCapita: { medical: 28000,  support: 8500,   care: 8400   },
      household: { medical: 19900,  support: 6100,   care: 4200   },
    },
  },
  {
    cityCode: "33212", citySlug: "setouchi", cityName: "瀬戸内市",
    rates: {
      rate:      { medical: 0.0961, support: 0.0314, care: 0.0250 },
      perCapita: { medical: 26663,  support: 9539,   care: 9546   },
      household: { medical: 22825,  support: 7355,   care: 6545   },
    },
  },
  {
    cityCode: "33213", citySlug: "akaiwashi", cityName: "赤磐市",
    rates: {
      rate:      { medical: 0.0810, support: 0.0260, care: 0.0170 },
      perCapita: { medical: 23000,  support: 7900,   care: 7800   },
      household: { medical: 21000,  support: 6000,   care: 5500   },
    },
  },
  {
    cityCode: "33214", citySlug: "maniwa", cityName: "真庭市",
    rates: {
      rate:      { medical: 0.0710, support: 0.0200, care: 0.0180 },
      perCapita: { medical: 27000,  support: 7800,   care: 9400   },
      household: { medical: 20400,  support: 6000,   care: 5200   },
    },
    assetLevy: { medical: 0.1660, support: 0.0430, care: 0.0450 },
  },
  {
    cityCode: "33215", citySlug: "mimasaka", cityName: "美作市",
    rates: {
      rate:      { medical: 0.0740, support: 0.0290, care: 0.0210 },
      perCapita: { medical: 20400,  support: 7800,   care: 7600   },
      household: { medical: 17000,  support: 6000,   care: 4000   },
    },
    assetLevy: { medical: 0.1085, support: 0.0430, care: 0.0385 },
  },
  {
    cityCode: "33216", citySlug: "asakuchi", cityName: "浅口市",
    rates: {
      rate:      { medical: 0.0710, support: 0.0260, care: 0.0220 },
      perCapita: { medical: 25600,  support: 9000,   care: 8400   },
      household: { medical: 19800,  support: 6800,   care: 5200   },
    },
  },

  // ── 町村（12町村）───────────────────────────────────────────

  {
    cityCode: "33346", citySlug: "wake", cityName: "和気町",
    rates: {
      rate:      { medical: 0.0830, support: 0.0280, care: 0.0280 },
      perCapita: { medical: 25200,  support: 9400,   care: 10700  },
      household: { medical: 18500,  support: 6600,   care: 6600   },
    },
  },
  {
    cityCode: "33423", citySlug: "hayashima", cityName: "早島町",
    rates: {
      rate:      { medical: 0.0930, support: 0.0280, care: 0.0240 },
      perCapita: { medical: 25000,  support: 9000,   care: 8000   },
      household: { medical: 25000,  support: 8000,   care: 7000   },
    },
  },
  {
    cityCode: "33445", citySlug: "satosho", cityName: "里庄町",
    rates: {
      rate:      { medical: 0.0680, support: 0.0250, care: 0.0230 },
      perCapita: { medical: 22000,  support: 9500,   care: 9000   },
      household: { medical: 18000,  support: 6000,   care: 5000   },
    },
  },
  {
    cityCode: "33461", citySlug: "yakage", cityName: "矢掛町",
    rates: {
      rate:      { medical: 0.0810, support: 0.0310, care: 0.0240 },
      perCapita: { medical: 28900,  support: 11200,  care: 10000  },
      household: { medical: 17700,  support: 6800,   care: 4700   },
    },
  },
  {
    cityCode: "33586", citySlug: "shinjo", cityName: "新庄村",
    rates: {
      rate:      { medical: 0.0750, support: 0.0200, care: 0.0080 },
      perCapita: { medical: 20000,  support: 6000,   care: 6000   },
      household: { medical: 18000,  support: 4000,   care: 3500   },
    },
    assetLevy: { medical: 0.3600, support: 0.1000, care: 0.0500 },
  },
  {
    cityCode: "33606", citySlug: "kagamino", cityName: "鏡野町",
    rates: {
      rate:      { medical: 0.0770, support: 0.0290, care: 0.0190 },
      perCapita: { medical: 20400,  support: 7700,   care: 7400   },
      household: { medical: 15500,  support: 5500,   care: 3800   },
    },
  },
  {
    cityCode: "33622", citySlug: "shoo", cityName: "勝央町",
    rates: {
      rate:      { medical: 0.0802, support: 0.0291, care: 0.0245 },
      perCapita: { medical: 21800,  support: 6800,   care: 6700   },
      household: { medical: 17800,  support: 5600,   care: 3500   },
    },
  },
  {
    cityCode: "33623", citySlug: "nagi", cityName: "奈義町",
    rates: {
      rate:      { medical: 0.0760, support: 0.0240, care: 0.0160 },
      perCapita: { medical: 26000,  support: 7000,   care: 6500   },
      household: { medical: 20000,  support: 5500,   care: 4000   },
    },
  },
  {
    cityCode: "33643", citySlug: "nishiawakura", cityName: "西粟倉村",
    rates: {
      rate:      { medical: 0.0800, support: 0.0310, care: 0.0220 },
      perCapita: { medical: 22000,  support: 9000,   care: 9000   },
      household: { medical: 19000,  support: 7000,   care: 5000   },
    },
  },
  {
    cityCode: "33663", citySlug: "kumenan", cityName: "久米南町",
    rates: {
      rate:      { medical: 0.0750, support: 0.0270, care: 0.0200 },
      perCapita: { medical: 25000,  support: 9500,   care: 8000   },
      household: { medical: 19000,  support: 7000,   care: 4500   },
    },
  },
  {
    cityCode: "33666", citySlug: "misakicho", cityName: "美咲町",
    rates: {
      rate:      { medical: 0.0740, support: 0.0270, care: 0.0280 },
      perCapita: { medical: 24000,  support: 8400,   care: 7800   },
      household: { medical: 18000,  support: 5700,   care: 4200   },
    },
  },
  {
    cityCode: "33681", citySlug: "kibichuo", cityName: "吉備中央町",
    rates: {
      rate:      { medical: 0.0630, support: 0.0240, care: 0.0190 },
      perCapita: { medical: 23500,  support: 9000,   care: 9500   },
      household: { medical: 15500,  support: 6200,   care: 4800   },
    },
    assetLevy: { medical: 0.1960, support: 0.0810, care: 0.0880 },
  },
];
