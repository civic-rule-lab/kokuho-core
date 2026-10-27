/**
 * 沖縄県 後期高齢者医療スペック（令和8・9年度 / 2026年度）
 *
 * ベース料率出典（医療分・子ども分の均等割/所得割）:
 *   厚生労働省 後期高齢者医療制度の令和8・9年度の保険料率について（2026-06-28 取得）
 *   https://www.mhlw.go.jp/content/12403500/001689077.pdf
 *   ※全47広域連合の確定料率を厚労省が取りまとめた一次資料。
 *
 * 関所（所得割の独自軽減 / 不均一賦課）: 所得割独自軽減なし・県内均一(公式明記)
 *   出典: https://www.kouiki-okinawa.com/caresystem.php
 *   確認度(confidence): 0.95（2026-06-28 調査、2026-10-27 出典を現行の公式サイトに更新）
 *   ※旧出典 www.kouiki-okinawa.jp は 2026-10 時点で名前解決できない。現行の公式サイトは
 *     沖縄県の後期高齢者医療制度のページからリンクされている www.kouiki-okinawa.com。
 *
 * 全国一律のパラメータ（賦課限度額85万/2.1万・均等割軽減しきい値31万/57万・
 * 医療7割軽減=7.2割・基礎控除43万）は generate-kouki-from-spec.js 側の
 * NATIONAL_UNIFORM に集約。本スペックは県ごとに変わる料率のみを持つ。
 */

export const PREF_NAME = "沖縄県";
export const PREF_SLUG = "okinawa";
export const STATUS = "verified";

export const SOURCE = {
  rates:  { url: "https://www.mhlw.go.jp/content/12403500/001689077.pdf", title: "厚生労働省 後期高齢者医療制度の令和8・9年度の保険料率について", retrievedAt: "2026-06-28" },
  kansho: { url: "https://www.kouiki-okinawa.com/caresystem.php", note: "所得割独自軽減なし・県内均一(公式明記)", confidence: 0.95, retrievedAt: "2026-10-27" },
};

// 県ごとに変わる料率（医療分・子ども分）と、広域連合独自の所得割軽減。
export const KOUKI = {
  perCapita: { medical: 61000, childcare: 1290 },   // 均等割額（円/年）
  rate:      { medical: 0.1081, childcare: 0.0026 },   // 所得割率
  incomeReduction: null,               // 所得割の独自軽減（無い県は null）
};

// 端数処理（条例で確認）。賦課額 医療分1円・子ども分1円単位（端数規定なし）。
export const ROUNDING = {
  income: "none",
  reducedPerCapita: "floor",
  levyUnit: {"medical": 1, "childcare": 1},
  source: {"url": "https://www1.g-reiki.net/kouiki-okinawa/reiki_honbun/x055RG00000076.html", "title": "沖縄県後期高齢者医療広域連合後期高齢者医療に関する条例", "example": "https://www.kouiki-okinawa.com/caresystem.php", "confidence": "confirmed", "retrievedAt": "2026-10-27"},
};
