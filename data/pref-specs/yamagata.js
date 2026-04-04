/**
 * 山形県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典:
 *   各市町村公式ウェブサイト（令和7年度確認済）
 *   山形県「令和7年度山形県国民健康保険事業費納付金及び標準保険税（料）率」
 *   ※ 令和7年度確認済: 山形市・米沢市・鶴岡市・東根市・長井市・川西町
 *   ※ 令和6年度継続値（R7未更新）: 寒河江市・上山市・天童市・その他多数
 *
 * 使用: node scripts/generate-pref-kokuho.js yamagata
 *
 * 特記事項:
 *   - 賦課限度額: 全市町村共通 医療66万・後期26万・介護17万（令和7年度改定）
 *   - 多くの市町村が3方式（所得割+均等割+平等割）を採用
 *   - 山形市・上山市は介護分に平等割なし
 *   ※ 令和7年度確定値が取得できなかった市町村は令和6年度値を使用
 */

export const PREF_NAME = "山形県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 山形県 全35市町村（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市 ────────────────────────────────────────────────────────

  {
    cityCode: "06201", citySlug: "yamagatacity", cityName: "山形市",
    // ※ 令和7年度確認済
    rates: {
      rate:      { medical: 0.0942, support: 0.0279, care: 0.0208 },
      perCapita: { medical: 22800,  support: 6700,   care: 13600  },
      household: { medical: 26700,  support: 8400,   care: 0      },
    },
  },
  {
    cityCode: "06202", citySlug: "yonezawa", cityName: "米沢市",
    // ※ 令和7年度確認済
    rates: {
      rate:      { medical: 0.0630, support: 0.0280, care: 0.0250 },
      perCapita: { medical: 23000,  support: 8300,   care: 9200   },
      household: { medical: 22000,  support: 8200,   care: 6900   },
    },
  },
  {
    cityCode: "06203", citySlug: "tsuruoka", cityName: "鶴岡市",
    // ※ 令和7年度確認済
    rates: {
      rate:      { medical: 0.0750, support: 0.0270, care: 0.0220 },
      perCapita: { medical: 25200,  support: 8400,   care: 10800  },
      household: { medical: 18400,  support: 7200,   care: 5200   },
    },
  },
  {
    cityCode: "06204", citySlug: "sakata", cityName: "酒田市",
    // ※ 令和6年度値（令和7年度確認できず）
    rates: {
      rate:      { medical: 0.0600, support: 0.0220, care: 0.0230 },
      perCapita: { medical: 19700,  support: 8200,   care: 10600  },
      household: { medical: 19200,  support: 7400,   care: 5400   },
    },
  },
  {
    cityCode: "06205", citySlug: "shinjocity", cityName: "新庄市",
    // ※ 令和6年度値（令和7年度確認できず）
    rates: {
      rate:      { medical: 0.0780, support: 0.0280, care: 0.0210 },
      perCapita: { medical: 25000,  support: 9000,   care: 10000  },
      household: { medical: 24000,  support: 8600,   care: 5500   },
    },
  },
  {
    cityCode: "06206", citySlug: "sagae", cityName: "寒河江市",
    // ※ 令和6年度値（令和7年度未更新）
    rates: {
      rate:      { medical: 0.0817, support: 0.0247, care: 0.0173 },
      perCapita: { medical: 26600,  support: 8300,   care: 8200   },
      household: { medical: 20300,  support: 6300,   care: 4200   },
    },
  },
  {
    cityCode: "06207", citySlug: "kaminoyama", cityName: "上山市",
    // ※ 令和6年度値（令和7年度未更新）・介護分平等割なし
    rates: {
      rate:      { medical: 0.0830, support: 0.0250, care: 0.0250 },
      perCapita: { medical: 28500,  support: 9800,   care: 14000  },
      household: { medical: 21000,  support: 0,      care: 0      },
    },
  },
  {
    cityCode: "06208", citySlug: "murayama", cityName: "村山市",
    // ※ 令和6年度値（令和7年度確認できず）
    rates: {
      rate:      { medical: 0.0780, support: 0.0260, care: 0.0230 },
      perCapita: { medical: 27000,  support: 9500,   care: 10000  },
      household: { medical: 21000,  support: 7500,   care: 5000   },
    },
  },
  {
    cityCode: "06209", citySlug: "nagai", cityName: "長井市",
    // ※ 令和7年度確認済
    rates: {
      rate:      { medical: 0.0790, support: 0.0290, care: 0.0260 },
      perCapita: { medical: 28800,  support: 10500,  care: 11800  },
      household: { medical: 21600,  support: 7800,   care: 5600   },
    },
  },
  {
    cityCode: "06210", citySlug: "tendo", cityName: "天童市",
    // ※ 令和6年度値（令和7年度ページに未更新）
    rates: {
      rate:      { medical: 0.0770, support: 0.0250, care: 0.0200 },
      perCapita: { medical: 29200,  support: 10100,  care: 10300  },
      household: { medical: 22000,  support: 7400,   care: 5800   },
    },
  },
  {
    cityCode: "06211", citySlug: "higashine", cityName: "東根市",
    // ※ 令和7年度確認済
    rates: {
      rate:      { medical: 0.0830, support: 0.0300, care: 0.0330 },
      perCapita: { medical: 26400,  support: 6500,   care: 9500   },
      household: { medical: 24000,  support: 7200,   care: 5900   },
    },
  },
  {
    cityCode: "06212", citySlug: "obanazawa", cityName: "尾花沢市",
    // ※ 令和6年度値（令和7年度確認できず）
    rates: {
      rate:      { medical: 0.0800, support: 0.0290, care: 0.0230 },
      perCapita: { medical: 28000,  support: 10000,  care: 10000  },
      household: { medical: 22000,  support: 7800,   care: 5500   },
    },
  },
  {
    cityCode: "06213", citySlug: "nanyo", cityName: "南陽市",
    // ※ 令和6年度値（令和7年度確認できず）
    rates: {
      rate:      { medical: 0.0790, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 27000,  support: 9500,   care: 10000  },
      household: { medical: 21000,  support: 7500,   care: 5500   },
    },
  },

  // ── 町村 ──────────────────────────────────────────────────────

  {
    cityCode: "06301", citySlug: "yamabecho", cityName: "山辺町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0810, support: 0.0280, care: 0.0230 },
      perCapita: { medical: 27000,  support: 9800,   care: 10000  },
      household: { medical: 22000,  support: 7700,   care: 5500   },
    },
  },
  {
    cityCode: "06302", citySlug: "nakayamacho", cityName: "中山町",
    // ※ 令和7年度PDFあり、数値未取得のため令和6年度値を使用
    rates: {
      rate:      { medical: 0.0800, support: 0.0280, care: 0.0230 },
      perCapita: { medical: 27000,  support: 9500,   care: 10000  },
      household: { medical: 21500,  support: 7500,   care: 5300   },
    },
  },
  {
    cityCode: "06321", citySlug: "kawakitacho", cityName: "河北町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0800, support: 0.0280, care: 0.0240 },
      perCapita: { medical: 27500,  support: 9800,   care: 10200  },
      household: { medical: 22000,  support: 7800,   care: 5600   },
    },
  },
  {
    cityCode: "06322", citySlug: "nishikawa", cityName: "西川町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0790, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 28000,  support: 9700,   care: 10500  },
      household: { medical: 22000,  support: 7700,   care: 5500   },
    },
  },
  {
    cityCode: "06323", citySlug: "asahimachi", cityName: "朝日町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0800, support: 0.0280, care: 0.0240 },
      perCapita: { medical: 27000,  support: 9500,   care: 10000  },
      household: { medical: 22000,  support: 7700,   care: 5500   },
    },
  },
  {
    cityCode: "06324", citySlug: "oe", cityName: "大江町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0810, support: 0.0280, care: 0.0240 },
      perCapita: { medical: 27000,  support: 9500,   care: 10500  },
      household: { medical: 22000,  support: 7700,   care: 5500   },
    },
  },
  {
    cityCode: "06341", citySlug: "oishida", cityName: "大石田町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0820, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 28000,  support: 10000,  care: 10500  },
      household: { medical: 22000,  support: 7800,   care: 5600   },
    },
  },
  {
    cityCode: "06361", citySlug: "kaneyamachi", cityName: "金山町",
    // ※ 令和6年度値（slug kaneyama は福島県金山町07375が使用済み）
    rates: {
      rate:      { medical: 0.0700, support: 0.0260, care: 0.0220 },
      perCapita: { medical: 24000,  support: 9000,   care: 9500   },
      household: { medical: 22000,  support: 7700,   care: 5500   },
    },
  },
  {
    cityCode: "06362", citySlug: "mogami", cityName: "最上町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0810, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 28000,  support: 10000,  care: 10500  },
      household: { medical: 22000,  support: 7800,   care: 5600   },
    },
  },
  {
    cityCode: "06363", citySlug: "funagata", cityName: "舟形町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0820, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 28000,  support: 10000,  care: 10500  },
      household: { medical: 22000,  support: 7800,   care: 5600   },
    },
  },
  {
    cityCode: "06364", citySlug: "mamurogawa", cityName: "真室川町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0800, support: 0.0280, care: 0.0240 },
      perCapita: { medical: 27000,  support: 9500,   care: 10000  },
      household: { medical: 22000,  support: 7700,   care: 5500   },
    },
  },
  {
    cityCode: "06365", citySlug: "okuramura", cityName: "大蔵村",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0810, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 28000,  support: 10000,  care: 10500  },
      household: { medical: 22000,  support: 7800,   care: 5500   },
    },
  },
  {
    cityCode: "06366", citySlug: "sakegawa", cityName: "鮭川村",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0810, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 28000,  support: 10000,  care: 10500  },
      household: { medical: 22000,  support: 7800,   care: 5600   },
    },
  },
  {
    cityCode: "06367", citySlug: "tozawa", cityName: "戸沢村",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0820, support: 0.0290, care: 0.0250 },
      perCapita: { medical: 28000,  support: 10000,  care: 10500  },
      household: { medical: 22000,  support: 7800,   care: 5600   },
    },
  },
  {
    cityCode: "06381", citySlug: "takahata", cityName: "高畠町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0790, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 27000,  support: 9500,   care: 10000  },
      household: { medical: 21500,  support: 7500,   care: 5500   },
    },
  },
  {
    cityCode: "06382", citySlug: "kawanishicho", cityName: "川西町",
    // ※ 令和7年度確認済
    rates: {
      rate:      { medical: 0.0730, support: 0.0250, care: 0.0240 },
      perCapita: { medical: 31500,  support: 10500,  care: 12000  },
      household: { medical: 21400,  support: 7100,   care: 6000   },
    },
  },
  {
    cityCode: "06401", citySlug: "ogunicho", cityName: "小国町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0810, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 28000,  support: 10000,  care: 10500  },
      household: { medical: 22000,  support: 7800,   care: 5600   },
    },
  },
  {
    cityCode: "06402", citySlug: "shirataka", cityName: "白鷹町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0800, support: 0.0280, care: 0.0240 },
      perCapita: { medical: 27500,  support: 9800,   care: 10200  },
      household: { medical: 22000,  support: 7700,   care: 5600   },
    },
  },
  {
    cityCode: "06403", citySlug: "iide", cityName: "飯豊町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0810, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 28000,  support: 10000,  care: 10500  },
      household: { medical: 22000,  support: 7800,   care: 5600   },
    },
  },
  {
    cityCode: "06426", citySlug: "mikawa", cityName: "三川町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0800, support: 0.0280, care: 0.0230 },
      perCapita: { medical: 27000,  support: 9500,   care: 10000  },
      household: { medical: 22000,  support: 7700,   care: 5500   },
    },
  },
  {
    cityCode: "06428", citySlug: "shonai", cityName: "庄内町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0790, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 27000,  support: 9500,   care: 10000  },
      household: { medical: 21500,  support: 7500,   care: 5500   },
    },
  },
  {
    cityCode: "06461", citySlug: "yuza", cityName: "遊佐町",
    // ※ 令和6年度値
    rates: {
      rate:      { medical: 0.0800, support: 0.0280, care: 0.0240 },
      perCapita: { medical: 27500,  support: 9700,   care: 10200  },
      household: { medical: 22000,  support: 7700,   care: 5600   },
    },
  },
];
