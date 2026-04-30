/**
 * 神奈川県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):    標準 4%     → 4.025%（+0.025%）★
 *   均等割 (prefPerCapita): 標準 1,500円 → 1,800円（+300円）★
 *   両方:                  どちらも超過 ★★
 *
 * 神奈川県水源環境保全税（2007年度〜）:
 *   個人県民税の所得割: 標準4% + 0.025% = 4.025%
 *   個人県民税の均等割: 標準1,500円 + 300円 = 1,800円
 *   対象: 全神奈川県民（低所得者軽減制度あり）
 *
 * 参照:
 *   https://www.pref.kanagawa.jp/docs/x9g/cnt/f6944/index.html
 */

export const PREF_NAME = "神奈川県";
export const PREF_SLUG = "kanagawa";

/**
 * 都道府県レベルの超過課税（全33市町村に適用）。
 */

/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/zeikin/y-shizei/kojin-shiminzei-kenminzei/kojin-shimin.html',
  retrievedAt: '2026-04-30',
  notes:       '横浜市公式ページで神奈川県水源環境保全税: prefRate=4.025%、prefPerCapita=1,300確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04025,  // 水源環境保全税: 標準4% + 0.025%
  prefPerCapita: 1_300,    // 水源環境保全税: 標準1,000 + 300円（令和6年度以降）
};

/**
 * 市区町村独自の差分。
 *
 * 神奈川県内の政令指定都市（横浜・川崎・相模原）は税源移譲で
 *   prefRate = 2% + 神奈川水源税0.025% = 2.025%
 *   cityRate = 8%（標準）
 *
 * PREF_DEFAULTS.prefRate（4.025%）は普通市用。
 * 政令市はここで prefRate: 0.02025 に上書きする。
 */
export const MUNICIPALITIES = [
  {
    cityCode: "14100",
    citySlug: "yokohama",
    cityName: "横浜市",
    // 政令市（税源移譲）: prefRate=2% + 神奈川水源税0.025% = 2.025%
    prefRate:      0.02025,
    // 政令市のため cityRate=8%（普通市の6%と異なる）
    cityRate:      0.08,
    // 横浜みどり税: 個人市民税均等割 +900円（令和10年度まで）
    cityPerCapita: 3_900,
    status:        "verified",
    source: {
      url: "https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/zeikin/y-shizei/kojin-shiminzei-kenminzei/kojin-shimin.html",
      pageTitle: "個人の市民税・県民税（概要）- 横浜市",
      retrievedAt: "2026-04-30",
    },
    notes: "政令市（prefRate=2.025%）。横浜みどり税(+900円均等割)あり。神奈川水源環境保全税はPREF_DEFAULTSで適用済み。",
  },
  {
    cityCode: "14130",
    citySlug: "kawasaki",
    cityName: "川崎市",
    // 政令市（税源移譲）: prefRate=2% + 神奈川水源税0.025% = 2.025%, cityRate=8%
    prefRate: 0.02025,
    cityRate: 0.08,
    status:   "verified",
    source: {
      url: "https://www.city.kawasaki.jp/230/page/0000017126.html",
      pageTitle: "川崎市 個人の市民税",
      retrievedAt: "2026-04-30",
    },
    notes: "政令市（prefRate=2.025%, cityRate=8%）。市独自の均等割超過課税なし。神奈川水源環境保全税はPREF_DEFAULTSで適用済み。",
  },
  {
    cityCode: "14150",
    citySlug: "sagamihara",
    cityName: "相模原市",
    // 政令市（税源移譲）: prefRate=2% + 神奈川水源税0.025% = 2.025%, cityRate=8%
    prefRate: 0.02025,
    cityRate: 0.08,
    status:   "verified",
    source: {
      url: "https://www.city.sagamihara.kanagawa.jp/kurashi/1026448/zeikin/1026477/jyuminzei_kojin/1020285.html",
      pageTitle: "均等割と所得割 - 相模原市",
      retrievedAt: "2026-04-30",
    },
    notes: "政令市（prefRate=2.025%, cityRate=8%）。市独自の均等割超過課税なし。神奈川水源環境保全税はPREF_DEFAULTSで適用済み。",
  },
];
