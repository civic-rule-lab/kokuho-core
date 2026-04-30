/**
 * 東京都 住民税スペック
 *
 * ─── 3軸チェック ─────────────────────────────────────────────
 *   所得割 (prefRate):      標準 4%     → 変更なし（確認済み）
 *   均等割 (prefPerCapita): 標準 1,000円 → 変更なし（超過課税なし）
 *   備考: 都民税独自の森林税なし（国の森林環境税1,000円は全国共通）
 *
 * ─── 23特別区の統一性 ──────────────────────────────────────────
 *   23区内は税率・均等割が完全統一。区によって住民税額は変わらない。
 *   - prefRate=4%（都民税所得割）
 *   - cityRate=6%（特別区民税所得割） ※政令市ではないため8%にならない
 *   - prefPerCapita=1,000円 / cityPerCapita=3,000円（標準値）
 *
 *   千代田区の過去の独自減税: 現行の条例減税なし（R7年度時点で確認済み）
 *   ※令和6年度定額減税は国の一時的施策であり自治体独自の恒常的減税ではない
 *
 * データ出典:
 *   東京都主税局 https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju (2026年4月)
 *   大田区公式ページ（23区代表） https://www.city.ota.tokyo.jp/seikatsu/zeikin/kazei/keisannosikumi.html
 */

export const PREF_NAME = "東京都";
export const PREF_SLUG = "tokyo";

/** MUNICIPALITIES に個別エントリがない市町村のデフォルト status */
export const PREF_STATUS = "inferred";

/**
 * PREF_DEFAULTS の verified 化ソース
 * 都民税の均等割超過なし・所得割超過なしを公式サイトで確認済み。
 */
export const PREF_SOURCE = {
  url:         'https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju',
  retrievedAt: '2026-04-30',
  notes:       '東京都主税局公式ページで都民税均等割1,000円・所得割4%（超過課税なし）確認',
};

export const PREF_DEFAULTS = {
  prefRate:      0.04,    // 確認済み: 超過課税なし（標準4%）
  prefPerCapita: 1_000,   // 確認済み: 都民税独自の森林税なし（標準1,000円）
};

/**
 * 23特別区：全区で標準税率（prefRate=4%, cityRate=6%, 均等割=標準値）を確認済み。
 * 区によって税率・均等割は変わらない（東京都主税局・各区公式ページで確認）。
 * 標準値と同じため prefRate/cityRate/prefPerCapita/cityPerCapita の記載は省略。
 *
 * 個別 jumin-2026.json は作成不要（JUMIN_DEFAULTS が正答値と一致するため）。
 */
export const MUNICIPALITIES = [
  // ── 千代田区・中央区・港区 ──────────────────────────────────────────
  { cityCode: "13101", citySlug: "chiyoda",   cityName: "千代田区", status: "verified",
    source: { url: "https://www.city.chiyoda.lg.jp/koho/kurashi/zekin/juminze/aramashi.html", retrievedAt: "2026-04-30" },
    notes: "標準値（prefRate=4%, cityRate=6%, 均等割=標準）。現行の区独自減税なし。" },
  { cityCode: "13102", citySlug: "chuo",      cityName: "中央区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13103", citySlug: "minato",    cityName: "港区",     status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },

  // ── 新宿区・文京区・台東区 ──────────────────────────────────────────
  { cityCode: "13104", citySlug: "shinjuku",  cityName: "新宿区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13105", citySlug: "bunkyo",    cityName: "文京区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13106", citySlug: "taito",     cityName: "台東区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },

  // ── 墨田区・江東区・品川区 ──────────────────────────────────────────
  { cityCode: "13107", citySlug: "sumida",    cityName: "墨田区",   status: "verified",
    source: { url: "https://www.city.sumida.lg.jp/kurashi/zeikin/zyuuminzei/zyuminzei_ni_tuite.html", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13108", citySlug: "koto",      cityName: "江東区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13109", citySlug: "shinagawa", cityName: "品川区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },

  // ── 目黒区・大田区・世田谷区 ──────────────────────────────────────────
  { cityCode: "13110", citySlug: "meguro",    cityName: "目黒区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13111", citySlug: "ota",       cityName: "大田区",   status: "verified",
    source: { url: "https://www.city.ota.tokyo.jp/seikatsu/zeikin/kazei/keisannosikumi.html", retrievedAt: "2026-04-30" },
    notes: "標準値（prefRate=4%, cityRate=6%, 均等割=標準）。公式ページで計算例確認済み。" },
  { cityCode: "13112", citySlug: "setagaya",  cityName: "世田谷区", status: "verified",
    source: { url: "https://www.city.setagaya.lg.jp/02051/214.html", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },

  // ── 渋谷区・中野区・杉並区 ──────────────────────────────────────────
  { cityCode: "13113", citySlug: "shibuya",   cityName: "渋谷区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13114", citySlug: "nakano-ku", cityName: "中野区",   status: "verified",
    source: { url: "https://www.city.tokyo-nakano.lg.jp/kurashi/zeikin/zeisei/jyuminzei-kaisei/0236586320240209091618267.html", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13115", citySlug: "suginami",  cityName: "杉並区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },

  // ── 豊島区・北区・荒川区 ──────────────────────────────────────────
  { cityCode: "13116", citySlug: "toshima",   cityName: "豊島区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13117", citySlug: "kita",      cityName: "北区",     status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13118", citySlug: "arakawa",   cityName: "荒川区",   status: "verified",
    source: { url: "https://www.city.arakawa.tokyo.jp/a012/zeikin/juuminzei/kutomin.html", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },

  // ── 板橋区・練馬区・足立区 ──────────────────────────────────────────
  { cityCode: "13119", citySlug: "itabashi",  cityName: "板橋区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13120", citySlug: "nerima",    cityName: "練馬区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13121", citySlug: "adachi",    cityName: "足立区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },

  // ── 葛飾区・江戸川区 ──────────────────────────────────────────────
  { cityCode: "13122", citySlug: "katsushika",cityName: "葛飾区",   status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
  { cityCode: "13123", citySlug: "edogawa",   cityName: "江戸川区", status: "verified",
    source: { url: "https://www.tax.metro.tokyo.lg.jp/kazei/life/kojin_ju", retrievedAt: "2026-04-30" },
    notes: "標準値。23区統一税率。" },
];
