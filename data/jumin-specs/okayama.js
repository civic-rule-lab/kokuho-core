/**
 * 岡山県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 1500円（+500円）★
 *   税名: おかやま森づくり県民税
 *   status: inferred（公式サイトでの目視確認を推奨）
 *
 * データ出典: https://www.pref.okayama.jp/page/360893.html (2026-05-01)
 */

export const PREF_NAME = "岡山県";
export const PREF_SLUG = "okayama";


/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.pref.okayama.jp/page/360893.html',
  retrievedAt: '2026-04-30',
  notes:       '岡山県公式ページでおかやま森づくり県民税+500円（prefPerCapita=1,500）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,         // 確認済み: 所得割超過課税なし（標準4%）
  prefPerCapita: 1500,     // おかやま森づくり県民税: 標準1,000 + 500円
};

// 市区町村独自差分（city レベルの超過があれば追記する）
export const MUNICIPALITIES = [
  {
    cityCode: "33100", citySlug: "okayama", cityName: "岡山市",
    prefRate: 0.02, cityRate: 0.08,
    status: "verified",
    source: { url: "https://www.city.okayama.jp/kurashi/0000005458.html", pageTitle: "個人市県民税の税額の計算方法 - 岡山市", retrievedAt: "2026-04-30" },
    notes: "政令市。おかやま森づくり県民税(+500円)はPREF_DEFAULTSで適用済み。市独自超過課税なし。",
  },
];
