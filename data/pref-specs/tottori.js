/**
 * 鳥取県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典:
 *   - 鳥取県「令和7年度 市町村標準保険料率」（pref.tottori.lg.jp/secure/210656/R7_hyoujun.pdf）
 *   - 米子市公式サイト（R7確認）
 *   - 倉吉市公式サイト（R7確認）
 *   - 南部町公式サイト（R7確認）
 *   - 湯梨浜町公式サイト（R7確認・4方式）
 *   - 日南町公式サイト（R6改正後確認）
 *   - 境港市検索結果（R7）
 *
 * 使用: node scripts/generate-pref-kokuho.js tottori
 *
 * 特記事項:
 *   - 鳥取市: 標準保険料率PDF記載の標準値を使用（実際の料率は試算ページ参照）
 *   - 湯梨浜町: 4方式（資産割あり）
 *   - 日野町: 令和7年度から資産割廃止・3方式へ移行
 *   - 南部町slug: 青森県南部町(02445)と区別するため nanbumachi-tottori
 *   - 日野町slug: 東京都日野市(13212)と区別するため hinomachi
 *   - 日南町slug: 宮崎県日南市(45204)と区別するため nichinanmachi
 *   - ※標準保険料率と実際の保険料率は異なる場合があります
 */

export const PREF_NAME = "鳥取県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 鳥取県 全19市町村（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市 ────────────────────────────────────────────────────────

  {
    // 標準保険料率PDF記載値（実際の料率は鳥取市へ要確認）
    cityCode: "31201", citySlug: "tottori", cityName: "鳥取市",
    rates: {
      rate:      { medical: 0.0630, support: 0.0294, care: 0.0260 },
      perCapita: { medical: 25861,  support: 12705,  care: 13432  },
      household: { medical: 18024,  support: 8378,   care: 6459   },
    },
  },
  {
    // R7確認済み（米子市公式サイト）
    cityCode: "31202", citySlug: "yonago", cityName: "米子市",
    rates: {
      rate:      { medical: 0.0795, support: 0.0255, care: 0.0244 },
      perCapita: { medical: 26000,  support: 8800,   care: 10500  },
      household: { medical: 25500,  support: 8300,   care: 5600   },
    },
  },
  {
    // R7確認済み（倉吉市公式サイト）
    cityCode: "31203", citySlug: "kurayoshi", cityName: "倉吉市",
    rates: {
      rate:      { medical: 0.0530, support: 0.0240, care: 0.0175 },
      perCapita: { medical: 20400,  support: 8700,   care: 8500   },
      household: { medical: 16200,  support: 7600,   care: 5400   },
    },
  },
  {
    // R7確認済み（検索結果）
    cityCode: "31204", citySlug: "sakaiminato", cityName: "境港市",
    rates: {
      rate:      { medical: 0.0868, support: 0.0275, care: 0.0262 },
      perCapita: { medical: 25600,  support: 7700,   care: 9400   },
      household: { medical: 30000,  support: 8000,   care: 6000   },
    },
  },

  // ── 町村 ──────────────────────────────────────────────────────

  {
    // 標準保険料率PDF記載値
    cityCode: "31302", citySlug: "iwamimachi", cityName: "岩美町",
    rates: {
      rate:      { medical: 0.0596, support: 0.0289, care: 0.0259 },
      perCapita: { medical: 26395,  support: 12450,  care: 13186  },
      household: { medical: 17407,  support: 8211,   care: 6341   },
    },
  },
  {
    // 標準保険料率PDF記載値
    cityCode: "31325", citySlug: "wakasacho", cityName: "若桜町",
    rates: {
      rate:      { medical: 0.0609, support: 0.0292, care: 0.0259 },
      perCapita: { medical: 27692,  support: 12415,  care: 13339  },
      household: { medical: 18262,  support: 8187,   care: 6414   },
    },
  },
  {
    // 標準保険料率PDF記載値
    cityCode: "31328", citySlug: "chizucho", cityName: "智頭町",
    rates: {
      rate:      { medical: 0.0639, support: 0.0295, care: 0.0259 },
      perCapita: { medical: 27500,  support: 12580,  care: 13385  },
      household: { medical: 18135,  support: 8296,   care: 6436   },
    },
  },
  {
    // 標準保険料率PDF記載値
    cityCode: "31329", citySlug: "yazu", cityName: "八頭町",
    rates: {
      rate:      { medical: 0.0634, support: 0.0299, care: 0.0257 },
      perCapita: { medical: 27759,  support: 12728,  care: 13268  },
      household: { medical: 18306,  support: 8393,   care: 6380   },
    },
  },
  {
    // 標準保険料率PDF記載値
    cityCode: "31364", citySlug: "misasa", cityName: "三朝町",
    rates: {
      rate:      { medical: 0.0571, support: 0.0292, care: 0.0249 },
      perCapita: { medical: 24770,  support: 12449,  care: 12849  },  // ※ PDF値近似
      household: { medical: 16335,  support: 8200,   care: 6179   },
    },
  },
  {
    // R7確認済み（湯梨浜町公式サイト）。4方式（資産割あり）
    cityCode: "31370", citySlug: "yurihama", cityName: "湯梨浜町",
    rates: {
      rate:      { medical: 0.0740, support: 0.0200, care: 0.0200 },
      perCapita: { medical: 24000,  support: 7000,   care: 7500   },
      household: { medical: 22000,  support: 6000,   care: 6000   },
      assetLevy: { medical: 0.2400, support: 0.0900, care: 0.0800 },
    },
  },
  {
    // 標準保険料率PDF記載値
    cityCode: "31371", citySlug: "kotoura", cityName: "琴浦町",
    rates: {
      rate:      { medical: 0.0680, support: 0.0297, care: 0.0256 },
      perCapita: { medical: 29478,  support: 12649,  care: 13190  },
      household: { medical: 19439,  support: 8341,   care: 6343   },
    },
  },
  {
    // 標準保険料率PDF記載値
    cityCode: "31372", citySlug: "hokuei", cityName: "北栄町",
    rates: {
      rate:      { medical: 0.0640, support: 0.0294, care: 0.0259 },
      perCapita: { medical: 28491,  support: 12511,  care: 13340  },
      household: { medical: 18789,  support: 8251,   care: 6415   },
    },
  },
  {
    // 標準保険料率PDF記載値
    cityCode: "31384", citySlug: "hichisomura", cityName: "日吉津村",
    rates: {
      rate:      { medical: 0.0656, support: 0.0292, care: 0.0254 },
      perCapita: { medical: 26920,  support: 12434,  care: 12849  },  // ※ PDF値近似
      household: { medical: 17753,  support: 8200,   care: 6179   },
    },
  },
  {
    // 標準保険料率PDF記載値
    cityCode: "31386", citySlug: "daisen", cityName: "大山町",
    rates: {
      rate:      { medical: 0.0716, support: 0.0294, care: 0.0256 },
      perCapita: { medical: 28429,  support: 12505,  care: 13103  },
      household: { medical: 18748,  support: 8247,   care: 6301   },
    },
  },
  {
    // R7確認済み（南部町公式サイト）。slug衝突回避（青森県南部町と区別）
    cityCode: "31388", citySlug: "nanbumachi-tottori", cityName: "南部町",
    rates: {
      rate:      { medical: 0.0718, support: 0.0235, care: 0.0223 },
      perCapita: { medical: 26900,  support: 8800,   care: 11300  },
      household: { medical: 19400,  support: 6300,   care: 5600   },
    },
  },
  {
    // 標準保険料率PDF記載値
    cityCode: "31389", citySlug: "hoki", cityName: "伯耆町",
    rates: {
      rate:      { medical: 0.0621, support: 0.0294, care: 0.0260 },
      perCapita: { medical: 31064,  support: 12538,  care: 13204  },
      household: { medical: 20486,  support: 8268,   care: 6349   },
    },
  },
  {
    // R7確認済み（日南町公式サイト・R6改正後）。slug衝突回避（宮崎県日南市と区別）
    cityCode: "31401", citySlug: "nichinanmachi", cityName: "日南町",
    rates: {
      rate:      { medical: 0.0660, support: 0.0370, care: 0.0235 },
      perCapita: { medical: 20600,  support: 8500,   care: 7400   },
      household: { medical: 16600,  support: 9200,   care: 7600   },
    },
  },
  {
    // 標準保険料率PDF記載値（R7から資産割廃止・3方式移行）。slug衝突回避（東京都日野市と区別）
    cityCode: "31402", citySlug: "hinomachi", cityName: "日野町",
    rates: {
      rate:      { medical: 0.0678, support: 0.0285, care: 0.0269 },
      perCapita: { medical: 34688,  support: 12976,  care: 13907  },
      household: { medical: 22875,  support: 8557,   care: 6687   },
    },
  },
  {
    // 標準保険料率PDF記載値
    cityCode: "31403", citySlug: "kofu-tottori", cityName: "江府町",
    rates: {
      rate:      { medical: 0.0800, support: 0.0279, care: 0.0245 },
      perCapita: { medical: 25109,  support: 11900,  care: 12634  },
      household: { medical: 16558,  support: 7847,   care: 6075   },
    },
  },
];
