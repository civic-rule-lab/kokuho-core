/**
 * 京都府 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 1600円（+600円）★
 *   税名: 豊かな森を育てる府民税
 *   status: inferred（公式サイトでの目視確認を推奨）
 *
 * データ出典: https://www.city.kyoto.lg.jp/gyozai/page/0000028299.html (2026-05-01)
 */

export const PREF_NAME = "京都府";
export const PREF_SLUG = "kyoto";


/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.city.kyoto.lg.jp/gyozai/page/0000028299.html',
  retrievedAt: '2026-04-30',
  notes:       '京都市公式ページで豊かな森を育てる府民税+600円（prefPerCapita=1,600）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,         // 確認済み: 所得割超過課税なし（標準4%）
  prefPerCapita: 1600,     // 豊かな森を育てる府民税: 標準1,000 + 600円
};

// 市区町村独自差分（city レベルの超過があれば追記する）
export const MUNICIPALITIES = [
  {
    cityCode: "26100", citySlug: "kyoto", cityName: "京都市",
    prefRate: 0.02, cityRate: 0.08,
    status: "verified",
    source: { url: "https://www.city.kyoto.lg.jp/gyozai/page/0000028299.html", pageTitle: "市町村民税の額は住んでいる市町村によって違うのですか？ - 京都市", retrievedAt: "2026-04-30" },
    notes: "政令市。豊かな森を育てる府民税(+600円)はPREF_DEFAULTSで適用済み。市独自超過課税なし。",
  },
];
