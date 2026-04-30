/**
 * 大阪府 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 1300円（+300円）★
 *   税名: 森林環境税（大阪）
 *   status: inferred（公式サイトでの目視確認を推奨）
 *
 * データ出典: https://www.city.osaka.lg.jp/zaisei/page/0000383147.html (2026-05-01)
 */

export const PREF_NAME = "大阪府";
export const PREF_SLUG = "osaka";


/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.city.osaka.lg.jp/zaisei/page/0000383147.html',
  retrievedAt: '2026-04-30',
  notes:       '大阪市公式ページで大阪府森林環境税+300円（prefPerCapita=1,300）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,         // 確認済み: 所得割超過課税なし（標準4%）
  prefPerCapita: 1300,     // 森林環境税（大阪）: 標準1,000 + 300円
};

// 市区町村独自差分（city レベルの超過があれば追記する）
export const MUNICIPALITIES = [
  {
    cityCode: "27100", citySlug: "osaka", cityName: "大阪市",
    prefRate: 0.02, cityRate: 0.08,
    status: "verified",
    source: { url: "https://www.city.osaka.lg.jp/zaisei/page/0000383147.html", pageTitle: "税額の計算 - 大阪市", retrievedAt: "2026-04-30" },
    notes: "政令市。大阪府森林環境税(+300円)はPREF_DEFAULTSで適用済み。市独自超過課税なし。",
  },
  {
    cityCode: "27140", citySlug: "sakai", cityName: "堺市",
    prefRate: 0.02, cityRate: 0.08,
    status: "verified",
    source: { url: "https://www.city.sakai.lg.jp/kurashi/zei/shizei/kojin/keisan/r3keisan.html", pageTitle: "税額の計算方法 - 堺市", retrievedAt: "2026-04-30" },
    notes: "政令市。大阪府森林環境税(+300円)はPREF_DEFAULTSで適用済み。市独自超過課税なし。",
  },
];
