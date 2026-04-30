/**
 * 千葉県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 変更なし（超過課税なし）★
 *   備考: 都道府県独自の森林税なし（国の森林環境税1,000円は全国共通）
 *   status: verified（公式サイトで確認済み）
 *
 * データ出典: https://www.pref.chiba.lg.jp/zeimu/aramashi/shurui/kojin-kenminzei/ (2026年4月)
 */

export const PREF_NAME = "千葉県";
export const PREF_SLUG = "chiba";

/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過なし・所得割超過なしを公式サイトで確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.pref.chiba.lg.jp/zeimu/aramashi/shurui/kojin-kenminzei/',
  retrievedAt: '2026-04-30',
  notes:       '千葉県公式ページで均等割1,000円・所得割4%（超過課税なし）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,    // 確認済み: 超過課税なし（標準4%）
  prefPerCapita: 1_000,   // 確認済み: 都道府県独自の森林税なし（標準1,000円）
};

// 市区町村独自差分（city レベルの超過があれば追記する）
export const MUNICIPALITIES = [
  {
    cityCode: "12100", citySlug: "chiba", cityName: "千葉市",
    prefRate: 0.02, cityRate: 0.08,
    status: "verified",
    source: {
      url: "https://www.city.chiba.jp/zaiseikyoku/zeimu/kazeikanri/kojin.html",
      pageTitle: "個人市民税 - 千葉市",
      retrievedAt: "2026-04-30",
    },
    notes: "政令市（prefRate=2%, cityRate=8%）。均等割は市民税3,000円・県民税1,000円（標準値）。超過課税なし。",
  },
];
