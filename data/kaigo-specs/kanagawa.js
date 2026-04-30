/**
 * 神奈川県 介護保険料スペック（第9期 2024-2026）
 *
 * 収集状況:
 *   - 横浜市・川崎市・相模原市: 公式サイト確認済み（verified）
 *   - 茅ヶ崎市: サンプル値（inferred）
 *   - その他: 未収集（scaffold で needs_update 生成済み）
 *
 * 更新: 2026-04-30
 */

export const PREF_NAME = "神奈川県";
export const PREF_SLUG = "kanagawa";

// 神奈川県内の多くの自治体が同じ bracket 構造を使う場合はここに定義する。
// null の場合は generate スクリプトが標準9段階 (BRACKETS_STANDARD_9) を使う。
export const BRACKETS = null;

export const MUNICIPALITIES = [
  // ── 政令指定都市 ──────────────────────────────────────────
  {
    cityCode:   "14100",
    citySlug:   "yokohama",
    cityName:   "横浜市",
    baseAmount: 74_880,   // 令和8年度 ¥74,880/年（第9期計画 第5段階基準）
    status:     "verified",
    source: {
      url:         "https://www.city.yokohama.lg.jp/kurashi/fukushi-kaigo/kaigo/hoken/hokenryo/keisan.html",
      pageTitle:   "横浜市 介護保険料の計算方法",
      retrievedAt: "2026-04-30",
    },
  },
  {
    cityCode:   "14130",
    citySlug:   "kawasaki",
    cityName:   "川崎市",
    baseAmount: 79_200,
    status:     "verified",
    source: {
      url:         "https://www.city.kawasaki.jp/350/page/0000026539.html",
      pageTitle:   "川崎市 介護保険料",
      retrievedAt: "2026-04-30",
    },
  },
  {
    cityCode:   "14150",
    citySlug:   "sagamihara",
    cityName:   "相模原市",
    baseAmount: 76_980,
    status:     "verified",
    source: {
      url:         "https://www.city.sagamihara.kanagawa.jp/kurashi/kaigo/hokenryo/index.html",
      pageTitle:   "相模原市 介護保険料",
      retrievedAt: "2026-04-30",
    },
  },

  // ── 一般市（サンプル） ──────────────────────────────────
  {
    cityCode:   "14207",
    citySlug:   "chigasaki",
    cityName:   "茅ヶ崎市",
    baseAmount: 79_000,   // 仮値（第9期計画から推定）
    status:     "inferred",
    source: {
      url:         null,
      pageTitle:   null,
      retrievedAt: null,
    },
  },

  // ── 未収集（scaffold で生成済み、baseAmount 記入待ち） ──
  // 以下は baseAmount を収集してから追記する
  // { cityCode: "14201", citySlug: "yokosuka", cityName: "横須賀市", baseAmount: null, status: "needs_update" },
];
