/**
 * 沖縄県 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 変更なし（超過課税なし）
 *   備考: 都道府県独自の森林税なし（国の森林環境税1,000円は全国共通）
 *   政令市: なし
 *
 * データ出典: https://www.pref.okinawa.lg.jp/kurashikankyo/zeikin/1003660/index.html (2026年4月)
 */

export const PREF_NAME = "沖縄県";
export const PREF_SLUG = "okinawa";

export const PREF_SOURCE = {
  url:         'https://www.pref.okinawa.lg.jp/kurashikankyo/zeikin/1003660/index.html',
  retrievedAt: '2026-05-01',
  notes:       '沖縄県県税概要・総務省超過課税状況資料で均等割1,000円・所得割4%（超過課税なし）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,   // 確認済み: 超過課税なし（標準4%）
  prefPerCapita: 1_000,  // 確認済み: 都道府県独自の森林税なし（標準1,000円）
};

export const MUNICIPALITIES = [];
