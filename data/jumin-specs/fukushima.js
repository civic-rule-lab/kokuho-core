/**
 * 福島県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 2000円（+1000円）★
 *   税名: ふくしま森林づくり県民税
 *   status: inferred（公式サイトでの目視確認を推奨）
 *
 * データ出典: https://www.pref.fukushima.lg.jp/sec/01115d/zeimu22.html (2026-05-01)
 */

export const PREF_NAME = "福島県";
export const PREF_SLUG = "fukushima";


/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.pref.fukushima.lg.jp/sec/01115d/zeimu22.html',
  retrievedAt: '2026-04-30',
  notes:       '福島県公式ページでprefPerCapita=2,000（ふくしま森林づくり県民税+1,000円）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,         // 確認済み: 所得割超過課税なし（標準4%）
  prefPerCapita: 2000,     // ふくしま森林づくり県民税: 標準1,000 + 1000円
};

// 市区町村独自差分（city レベルの超過があれば追記する）
export const MUNICIPALITIES = [
];
