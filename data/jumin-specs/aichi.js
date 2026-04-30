/**
 * 愛知県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):    標準 4%     → 変更なし
 *   均等割 (prefPerCapita): 標準 1,500円 → 2,000円（+500円）★
 *   両方:                  なし
 *
 * PREF_DEFAULTS が MUNICIPALITIES よりも前に適用される。
 * 全54自治体に prefPerCapita: 2,000 が適用される。
 */

export const PREF_NAME = "愛知県";
export const PREF_SLUG = "aichi";

/**
 * 都道府県レベルの超過課税（全市町村に適用）。
 * 標準値（JUMIN_DEFAULTS）との差分のみ記載。
 */

/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.pref.aichi.jp/zeimu/shotoku/midori.html',
  retrievedAt: '2026-04-30',
  notes:       '愛知県公式ページであいち森と緑づくり税+500円（prefPerCapita=1,500）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,    // 確認済み: 愛知県は所得割超過課税なし（標準4%）
  prefPerCapita: 1_500,   // あいち森と緑づくり税: 標準1,000 + 500円（令和6年度以降）
  // 根拠: 愛知県 あいち森と緑づくり税（2008年〜）
  // URL: https://www.pref.aichi.jp/zeimu/shotoku/midori.html
};

/**
 * 市区町村独自の差分（PREF_DEFAULTS に加えてさらに差分がある自治体のみ）。
 *
 * 政令指定都市（名古屋市）は税源移譲で prefRate=2% / cityRate=8% が基準。
 * 普通市は標準の prefRate=4% / cityRate=6% のまま。
 */
export const MUNICIPALITIES = [
  {
    cityCode: "23100",
    citySlug: "nagoya",
    cityName: "名古屋市",
    // 政令指定都市（税源移譲）: prefRate=2%, cityRate=8% が基準
    prefRate: 0.02,
    // 市民税1割減税（2012年〜）: 8% × 0.9 = 7.2%
    cityRate: 0.072,
    // 均等割も1割減税相当: 2,800円（公式確認値、3,000円より200円減）
    cityPerCapita: 2_800,
    status:   "verified",
    source: {
      url: "https://www.city.nagoya.jp/zaisei/page/0000009961.html",
      pageTitle: "名古屋市 市民税の減税",
      retrievedAt: "2026-04-30",
    },
    notes: "政令市（prefRate=2%,cityRate=8%）に市民税1割減税(×0.9)を適用。あいち森と緑づくり税(+500円)はPREF_DEFAULTSで適用済み。",
  },
];
