/**
 * 熊本県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 1500円（+500円）★
 *   税名: 水とみどりの森づくり税
 *   status: inferred（公式サイトでの目視確認を推奨）
 *
 * データ出典: https://www.city.kumamoto.jp/kiji00312986/index.html (2026-05-01)
 */

export const PREF_NAME = "熊本県";
export const PREF_SLUG = "kumamoto";


/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.city.kumamoto.jp/kiji00312986/index.html',
  retrievedAt: '2026-04-30',
  notes:       '熊本市公式ページで水とみどりの森づくり税+500円（prefPerCapita=1,500）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,         // 確認済み: 所得割超過課税なし（標準4%）
  prefPerCapita: 1500,     // 水とみどりの森づくり税: 標準1,000 + 500円
};

// 市区町村独自差分（city レベルの超過があれば追記する）
export const MUNICIPALITIES = [
  {
    cityCode: "43100", citySlug: "kumamoto", cityName: "熊本市",
    prefRate: 0.02, cityRate: 0.08,
    status: "verified",
    source: {
      url: "https://www.city.kumamoto.jp/kiji00312986/index.html",
      pageTitle: "市民税・県民税・森林環境税の算定について - 熊本市",
      retrievedAt: "2026-04-30",
    },
    notes: "政令市（prefRate=2%, cityRate=8%）。水とみどりの森づくり税(+500円)はPREF_DEFAULTSで適用済み。市独自超過課税なし。",
  },
];
