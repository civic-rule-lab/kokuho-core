/**
 * 住民税スペックファイル テンプレート
 * このファイルをコピーして data/jumin-specs/{prefSlug}.js として使う。
 *
 * ─── verified 昇格基準（3点すべてを満たすこと）─────────────────
 *
 *   ① 当該年度の公式ページで以下を直接確認した:
 *       - 所得割税率（prefRate / cityRate）
 *       - 均等割額（prefPerCapita / cityPerCapita）
 *   ② source.url と source.retrievedAt を記録した
 *   ③ 給与500万円・1,000万円の2点で公式シミュレーターと一致を確認した
 *      （1点のみでは税率と均等割の組み合わせミスに気付けない）
 *
 * ─── 現行の標準値（JUMIN_DEFAULTS）── 令和6年度（2024年）以降 ──
 *   prefRate:            0.04     都道府県民税 所得割（4%）
 *   cityRate:            0.06     市区町村民税 所得割（6%）  ※政令市は 0.08
 *   prefPerCapita:       1,000    都道府県民税 均等割       ※令和6年度から変更（旧1,500円）
 *   cityPerCapita:       3,000    市区町村民税 均等割       ※令和6年度から変更（旧3,500円）
 *   forestTax:           1,000    国の森林環境税（2024〜、全国一律）
 *   basicDeductionJumin: 430,000  住民税基礎控除
 *
 *   ※ 令和5年度まで均等割に上乗せされていた震災復興特例（+500円×2）が
 *      令和6年度に終了し、国の森林環境税（1,000円）に置き換わった。
 *      「旧1,500円／旧3,500円のまま設定」すると1,000円の過大計算になる。
 *
 * ─── 3軸チェック（スペック追記時の必須確認事項）────────────────
 *
 *   軸① prefRate（都道府県民税 所得割）が 4% 以外か？
 *        例: 神奈川県水源環境保全税 → 4.025%（+0.025%）
 *        ※ 政令指定都市: prefRate=2%（税源移譲。cityRate=8% と対）
 *
 *   軸② prefPerCapita / cityPerCapita（均等割）が標準以外か？
 *        都道府県独自森林税（上乗せ額・令和6年度以降の実額）の例:
 *          +1,200円: 宮城県     → prefPerCapita=2,200
 *          +1,000円: 岩手・山形・福島・茨城・岐阜・三重
 *          +800円:   秋田・滋賀・兵庫
 *          +700円:   栃木・群馬・愛媛
 *          +600円:   京都府
 *          +500円:   富山・石川・山梨・長野・愛知・奈良・和歌山・鳥取・島根・
 *                    岡山・広島・山口・高知・福岡・佐賀・長崎・熊本・大分・宮崎・鹿児島
 *          +400円:   静岡県
 *          +300円:   神奈川・大阪府
 *          なし:     北海道・青森・埼玉・千葉・東京・新潟・福井・徳島・香川・沖縄
 *        市区町村均等割の独自超過例:
 *          +900円: 横浜市（横浜みどり税）
 *          +400円: 神戸市（認知症神戸モデル）
 *          ±: 名古屋市（1割減税: cityPerCapita=2,800円）
 *
 *   軸③ cityRate（市区町村民税 所得割）が 6% / 8% 以外か？
 *        例: 名古屋市 → 7.2%（政令市8% × 1割減税0.9）
 *        ※ 政令市は cityRate=8%（税源移譲）が基準。6%超過は存在しない（減税のみ）。
 *
 *   国の森林環境税（1,000円）は JUMIN_DEFAULTS.forestTax に含まれる（全国一律）。
 *   都道府県独自の森林税（軸②）とは別物。「国税ができたから廃止」と推測しない。
 *
 * ─── axes オブジェクトの使い方 ──────────────────────────────────
 *   スペックの MUNICIPALITIES エントリに axes を付けると、
 *   「条例減税がある自治体だけ抽出」などの分析が可能になる。
 *   計算には使わない（あくまでメタデータ）。
 *
 * ─── 効率的な verified 化の順序 ─────────────────────────────────
 *   1. 47都道府県の PREF_DEFAULTS を先に verified 化する
 *      → 県が confirmed になると、その県内全市町村の県民税部分が自動確定
 *   2. 次に政令市など市レベルの差分を confirmed
 *   情報源: 総務省「個人住民税の超過課税の状況」（毎年更新）
 *           各都道府県「県税のあらまし」
 */

export const PREF_NAME = "〇〇県";
export const PREF_SLUG = "xxxx";

/** MUNICIPALITIES に個別エントリがない市町村のデフォルト status */
export const PREF_STATUS = "inferred";

/** 都道府県レベルの超過課税（全市町村に適用）。標準値と同じなら省略可。 */
export const PREF_DEFAULTS = {
  // prefRate:      0.04,    // 標準と同じなら省略可
  // prefPerCapita: 1_000,   // 標準と同じなら省略可（令和6年度以降: 1,000円）
};

/** 市区町村独自の差分（PREF_DEFAULTS に加えてさらに差分がある自治体のみ）。 */
export const MUNICIPALITIES = [
  {
    cityCode:   "XXXXX",
    citySlug:   "example",
    cityName:   "例市",

    // ── 計算フィールド（標準値・PREF_DEFAULTS と異なるものだけ記入）──────
    // cityRate:      0.08,    // 政令市は 0.08（税源移譲）
    // prefRate:      0.02,    // 政令市は 0.02（税源移譲）
    // cityPerCapita: 3_000,   // 市区町村民税均等割（超過があれば上書き）

    status: "needs_update",   // "needs_update" | "verified" | "inferred"
    source: {
      url:         null,      // 公式ページ URL
      pageTitle:   null,
      retrievedAt: null,      // "YYYY-MM-DD"
    },
    notes: "",

    // ── axes: 3軸の確認結果（メタデータ・計算には不使用）───────────────
    // axes: {
    //   incomeRate: {
    //     custom: false,                        // 標準値と同じ場合
    //     // custom: true, value: 0.072, reason: '政令市1割減税'
    //   },
    //   perCapita: {
    //     custom: false,
    //     // custom: true, prefAdd: 500, cityAdd: 0, reason: '県森林税'
    //   },
    //   discount: {
    //     custom: false,
    //     // custom: true, type: 'cityTaxRate', rate: 0.1, note: '市民税1割減税'
    //   },
    // },
  },
];
