/**
 * 静岡県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 1400円（+400円）★
 *   税名: 森林（もり）づくり県民税
 *   status: inferred（公式サイトでの目視確認を推奨）
 *
 * データ出典: https://www.city.hamamatsu.shizuoka.jp/shiminze/zei/siminze/kintou.html (2026-05-01)
 */

export const PREF_NAME = "静岡県";
export const PREF_SLUG = "shizuoka";


/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.city.hamamatsu.shizuoka.jp/shiminze/zei/siminze/kintou.html',
  retrievedAt: '2026-04-30',
  notes:       '浜松市公式ページで静岡県森林づくり県民税+400円（prefPerCapita=1,400）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,         // 確認済み: 所得割超過課税なし（標準4%）
  prefPerCapita: 1400,     // 森林（もり）づくり県民税: 標準1,000 + 400円
};

export const MUNICIPALITIES = [
  {
    cityCode: "22100", citySlug: "shizuoka", cityName: "静岡市",
    prefRate: 0.02, cityRate: 0.08,
    status: "verified",
    source: { url: "https://www.city.shizuoka.lg.jp/s8374/s000518.html", pageTitle: "個人市民税 - 静岡市", retrievedAt: "2026-04-30" },
    notes: "政令市。静岡県森林づくり税(+400円)はPREF_DEFAULTSで適用済み。市独自超過課税なし。",
  },
  {
    cityCode: "22130", citySlug: "hamamatsu", cityName: "浜松市",
    prefRate: 0.02, cityRate: 0.08,
    status: "verified",
    source: { url: "https://www.city.hamamatsu.shizuoka.jp/shiminze/zei/siminze/kintou.html", pageTitle: "均等割と所得割 - 浜松市", retrievedAt: "2026-04-30" },
    notes: "政令市。静岡県森林づくり税(+400円)はPREF_DEFAULTSで適用済み。市独自超過課税なし。",
  },
];
