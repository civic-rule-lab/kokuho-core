/**
 * 兵庫県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 1800円（+800円）★
 *   税名: 県民緑税
 *   status: inferred（公式サイトでの目視確認を推奨）
 *
 * データ出典: https://www.city.kobe.lg.jp/a83576/kurashi/tax/shikenminze/keisan/index.html (2026-05-01)
 */

export const PREF_NAME = "兵庫県";
export const PREF_SLUG = "hyogo";


/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.city.kobe.lg.jp/a83576/kurashi/tax/shikenminze/keisan/index.html',
  retrievedAt: '2026-04-30',
  notes:       '神戸市公式ページで兵庫県民緑税+800円（prefPerCapita=1,800）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,         // 確認済み: 所得割超過課税なし（標準4%）
  prefPerCapita: 1800,     // 県民緑税: 標準1,000 + 800円
};

// 市区町村独自差分
export const MUNICIPALITIES = [
  {
    cityCode: "28100",
    citySlug: "kobe",
    cityName: "神戸市",
    // 政令指定都市（税源移譲）: prefRate=2%, cityRate=8% が基準
    prefRate: 0.02,
    cityRate: 0.08,
    // 認知症神戸モデル: 個人市民税均等割 +400円
    cityPerCapita: 3_400,
    status:   "verified",
    source: {
      url: "https://www.city.kobe.lg.jp/a83576/kurashi/tax/shikenminze/keisan/index.html",
      pageTitle: "住民税（市県民税）の税額の計算方法 - 神戸市",
      retrievedAt: "2026-04-30",
    },
    notes: "政令市（prefRate=2%, cityRate=8%）。認知症神戸モデル(+400円均等割)は令和9年度まで継続。兵庫県民緑税(+800円)はPREF_DEFAULTSで適用済み。",
  },
];
