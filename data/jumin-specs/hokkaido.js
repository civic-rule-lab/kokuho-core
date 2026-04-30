/**
 * 北海道 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 変更なし（超過課税なし）★
 *   備考: 都道府県独自の森林税なし（国の森林環境税1,000円は全国共通）
 *   status: verified（公式サイトで確認済み）
 *
 * データ出典: https://www.pref.hokkaido.lg.jp/sm/zim/tax/kozin_d02.html (2026年4月)
 */

export const PREF_NAME = "北海道";
export const PREF_SLUG = "hokkaido";

/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過なし・所得割超過なしを公式サイトで確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.pref.hokkaido.lg.jp/sm/zim/tax/kozin_d02.html',
  retrievedAt: '2026-04-30',
  notes:       '北海道公式ページで均等割1,000円・所得割4%（超過課税なし）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,    // 確認済み: 超過課税なし（標準4%）
  prefPerCapita: 1_000,   // 確認済み: 都道府県独自の森林税なし（標準1,000円）
};

// 市区町村独自差分（city レベルの超過があれば追記する）
export const MUNICIPALITIES = [
  {
    cityCode: "01100", citySlug: "sapporo", cityName: "札幌市",
    prefRate: 0.02, cityRate: 0.08,
    status: "verified",
    source: {
      url: "https://www.city.sapporo.jp/citytax/syurui/shiminzei/kojin_zeigaku.html",
      pageTitle: "税額の算出方法 - 札幌市",
      retrievedAt: "2026-04-30",
    },
    notes: "政令市（prefRate=2%, cityRate=8%）。均等割は市民税3,000円・道民税1,000円（標準値）。超過課税なし。",
  },
];
