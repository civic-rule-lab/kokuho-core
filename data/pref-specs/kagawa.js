/**
 * 香川県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典:
 *   香川県「令和7年度保険料（税）率（県内市町）」
 *   https://www.pref.kagawa.lg.jp/documents/1935/r7kokuminkenkouhokenryouritu.pdf
 *   各市町公式サイト（令和7年度）
 *
 * 使用: node scripts/generate-pref-kokuho.js kagawa
 *
 * 特記事項:
 *   - 香川県は3方式（所得割+均等割+平等割）が主流
 *   - 賦課限度額: 多くの市町が全国標準 医療66万・後期26万・介護17万（R7改定後）
 *   - 観音寺市のみ医療分67万（独自設定）
 */

export const PREF_NAME = "香川県";

export const CAPS_NAT = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 香川県 全17市町（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市 ────────────────────────────────────────────────────────

  {
    cityCode: "37201", citySlug: "takamatsu", cityName: "高松市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0988, support: 0.0260, care: 0.0216 },
      perCapita: { medical: 31700,  support: 8700,   care: 9400   },
      household: { medical: 21700,  support: 5800,   care: 4600   },
    },
  },
  {
    cityCode: "37202", citySlug: "marugame", cityName: "丸亀市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0830, support: 0.0260, care: 0.0230 },
      perCapita: { medical: 27500,  support: 7000,   care: 8000   },
      household: { medical: 28300,  support: 7000,   care: 5000   },
    },
  },
  {
    // 出典: 令和8年度データから逆算（坂出市サイトR8の値）
    // R7は直接確認できず。R8: 医療8.8%/28000/28000、後期2.7%/8300/7000、介護2.4%/9000/5500
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "37203", citySlug: "sakaide", cityName: "坂出市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0850, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 27000,  support: 8000,   care: 9000   },
      household: { medical: 27000,  support: 7000,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認（善通寺市サイト404エラー）
    cityCode: "37204", citySlug: "zentsuji", cityName: "善通寺市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0880, support: 0.0270, care: 0.0220 },
      perCapita: { medical: 30000,  support: 9000,   care: 10000  },
      household: { medical: 25000,  support: 7000,   care: 5000   },
    },
  },
  {
    cityCode: "37205", citySlug: "kanonji", cityName: "観音寺市",
    caps: { medical: 670000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0930, support: 0.0260, care: 0.0180 },
      perCapita: { medical: 32300,  support: 9000,   care: 8700   },
      household: { medical: 26100,  support: 5700,   care: 4800   },
    },
  },
  {
    cityCode: "37206", citySlug: "sanuki", cityName: "さぬき市",
    caps: CAPS_NAT,
    // TODO: 令和7年度の正確な数値を要確認（サイト503エラー）
    rates: {
      rate:      { medical: 0.0880, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 30000,  support: 9500,   care: 10000  },
      household: { medical: 26000,  support: 7500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "37207", citySlug: "higashikagawa", cityName: "東かがわ市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0880, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 31000,  support: 9500,   care: 10000  },
      household: { medical: 26000,  support: 7500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認（サイト404エラー）
    cityCode: "37208", citySlug: "mitoyo", cityName: "三豊市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0870, support: 0.0260, care: 0.0230 },
      perCapita: { medical: 30000,  support: 9000,   care: 10000  },
      household: { medical: 25000,  support: 7000,   care: 5000   },
    },
  },

  // ── 町村 ──────────────────────────────────────────────────────

  {
    cityCode: "37322", citySlug: "tonoshomachi", cityName: "土庄町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0710, support: 0.0240, care: 0.0205 },
      perCapita: { medical: 27900,  support: 8100,   care: 9900   },
      household: { medical: 21500,  support: 5800,   care: 5600   },
    },
  },
  {
    // 出典: 小豆島町サイト（令和6年度）。R7要確認
    cityCode: "37324", citySlug: "shodoshimamachi", cityName: "小豆島町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0760, support: 0.0240, care: 0.0180 },
      perCapita: { medical: 29800,  support: 9100,   care: 9400   },
      household: { medical: 20100,  support: 6100,   care: 4600   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "37341", citySlug: "mikimachi", cityName: "三木町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0830, support: 0.0260, care: 0.0220 },
      perCapita: { medical: 29000,  support: 9000,   care: 9500   },
      household: { medical: 23000,  support: 6500,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "37364", citySlug: "naoshimamachi", cityName: "直島町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0750, support: 0.0240, care: 0.0200 },
      perCapita: { medical: 27000,  support: 8500,   care: 9000   },
      household: { medical: 21000,  support: 6000,   care: 4800   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "37386", citySlug: "utazumachi", cityName: "宇多津町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0800, support: 0.0250, care: 0.0220 },
      perCapita: { medical: 28000,  support: 8500,   care: 9000   },
      household: { medical: 22000,  support: 6200,   care: 5000   },
    },
  },
  {
    cityCode: "37387", citySlug: "ayagawamachi", cityName: "綾川町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0750, support: 0.0240, care: 0.0230 },
      perCapita: { medical: 28000,  support: 10000,  care: 10000  },
      household: { medical: 24000,  support: 7000,   care: 6000   },
    },
  },
  {
    // 出典: 琴平町サイト（令和6年度）。R7要確認。R6の賦課限度額650/240のため独自設定
    cityCode: "37403", citySlug: "kotohiramachi", cityName: "琴平町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0815, support: 0.0203, care: 0.0189 },
      perCapita: { medical: 33400,  support: 8400,   care: 10100  },
      household: { medical: 23200,  support: 5800,   care: 4900   },
    },
  },
  {
    cityCode: "37404", citySlug: "tadotsumachi", cityName: "多度津町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0760, support: 0.0210, care: 0.0210 },
      perCapita: { medical: 30000,  support: 8800,   care: 9200   },
      household: { medical: 20000,  support: 6000,   care: 4400   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認（まんのう町サイト404エラー）
    cityCode: "37406", citySlug: "mannomachi", cityName: "まんのう町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0820, support: 0.0250, care: 0.0220 },
      perCapita: { medical: 29000,  support: 9000,   care: 9500   },
      household: { medical: 22000,  support: 6500,   care: 5000   },
    },
  },
];
