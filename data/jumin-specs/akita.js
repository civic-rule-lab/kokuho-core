/**
 * 秋田県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 1800円（+800円）★
 *   税名: 秋田県水と緑の森づくり税
 *   status: inferred（公式サイトでの目視確認を推奨）
 *
 * データ出典: https://www.pref.akita.lg.jp/pages/archive/3973 (2026-05-01)
 */

export const PREF_NAME = "秋田県";
export const PREF_SLUG = "akita";


/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.pref.akita.lg.jp/pages/archive/3973',
  retrievedAt: '2026-04-30',
  notes:       '秋田県公式ページで水と緑の森づくり税+800円（prefPerCapita=1,800）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,         // 確認済み: 所得割超過課税なし（標準4%）
  prefPerCapita: 1800,     // 秋田県水と緑の森づくり税: 標準1,000 + 800円
};

// 市区町村独自差分（city レベルの超過があれば追記する）
export const MUNICIPALITIES = [
];
