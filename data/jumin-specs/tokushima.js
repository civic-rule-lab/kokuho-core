/**
 * 徳島県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 変更なし（超過課税なし）
 *   備考: 震災復興加算（+500円）は令和5年度で終了。令和6年度以降は標準1,000円。
 *         都道府県独自の森林税なし（国の森林環境税1,000円は全国共通）
 *   政令市: なし
 *
 * データ出典: https://www.pref.tokushima.lg.jp/FAQ/docs/00003513/ (2026年4月)
 */

export const PREF_NAME = "徳島県";
export const PREF_SLUG = "tokushima";

export const PREF_SOURCE = {
  url:         'https://www.pref.tokushima.lg.jp/FAQ/docs/00003513/',
  retrievedAt: '2026-05-01',
  notes:       '徳島県公式FAQで均等割1,000円・所得割4%（令和6年度以降）確認。震災復興加算（+500円）はR5で終了済み。',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,   // 確認済み: 超過課税なし（標準4%）
  prefPerCapita: 1_000,  // 確認済み: 震災復興加算終了（R6〜）、都道府県独自の森林税なし（標準1,000円）
};

export const MUNICIPALITIES = [];
