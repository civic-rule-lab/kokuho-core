/**
 * 山形県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 2000円（+1000円）★
 *   税名: やまがた緑環境税
 *   status: inferred（公式サイトでの目視確認を推奨）
 *
 * データ出典: https://www.pref.yamagata.jp/020007/zei_shitsumon/midori/midori.html (2026-05-01)
 */

export const PREF_NAME = "山形県";
export const PREF_SLUG = "yamagata";


/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.pref.yamagata.jp/020007/zei_shitsumon/midori/midori.html',
  retrievedAt: '2026-04-30',
  notes:       '山形県公式ページでやまがた緑環境税+1,000円/年確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,         // 確認済み: 所得割超過課税なし（標準4%）
  prefPerCapita: 2000,     // やまがた緑環境税: 標準1,000 + 1000円
};

// 市区町村独自差分（city レベルの超過があれば追記する）
export const MUNICIPALITIES = [
];
