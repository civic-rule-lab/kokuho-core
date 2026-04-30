/**
 * 宮城県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 2200円（+1200円）★
 *   税名: みやぎ環境税
 *   status: inferred（公式サイトでの目視確認を推奨）
 *
 * データ出典: https://www.city.sendai.jp/shiminze-kikaku/kurashi/tetsuzuki/zekin/kojin/gaiyo.html (2026-05-01)
 */

export const PREF_NAME = "宮城県";
export const PREF_SLUG = "miyagi";


/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.city.sendai.jp/shiminze-kikaku/kurashi/tetsuzuki/zekin/kojin/gaiyo.html',
  retrievedAt: '2026-04-30',
  notes:       '仙台市公式ページでprefPerCapita=2,200（みやぎ環境税+1,200円）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,         // 確認済み: 所得割超過課税なし（標準4%）
  prefPerCapita: 2200,     // みやぎ環境税: 標準1,000 + 1200円
};

export const MUNICIPALITIES = [
  {
    cityCode: "04100", citySlug: "sendai", cityName: "仙台市",
    prefRate: 0.02, cityRate: 0.08,  // 政令市（税源移譲）: pref=2%, city=8%
    status: "verified",
    source: { url: "https://www.city.sendai.jp/shiminze-kikaku/kurashi/tetsuzuki/zekin/kojin/gaiyo.html", pageTitle: "個人市県民税について - 仙台市", retrievedAt: "2026-04-30" },
    notes: "政令市。みやぎ環境税(+1,200円)はPREF_DEFAULTSで適用済み。市独自超過課税なし。",
  },
];
