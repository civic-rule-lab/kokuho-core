/**
 * 高知県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典:
 *   高知県「高知県の国民健康保険料（税）率及び賦課限度額の状況 令和7年度」
 *   https://www.pref.kochi.lg.jp/file_contents/file_2025729218418_1.pdf
 *   各市町村公式サイト（令和7年度）
 *
 * 使用: node scripts/generate-pref-kokuho.js kochi
 *
 * 特記事項:
 *   - 高知県は3方式（所得割+均等割+平等割）が多数。一部は介護分平等割なし
 *   - 賦課限度額: 全国標準 医療66万・後期26万・介護17万（R7改定後）
 *   - 四万十市（shimanto）と四万十町（shimantomachi）は別自治体
 *   - 宿毛市・中土佐町は介護分の平等割を令和7年度より廃止
 *   - TODO印の自治体は正式なR7データ未確認のため推定値を使用
 */

export const PREF_NAME = "高知県";

export const CAPS_NAT = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 高知県 全34市町村（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市 ────────────────────────────────────────────────────────

  {
    cityCode: "39201", citySlug: "kochi", cityName: "高知市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0862, support: 0.0350, care: 0.0276 },
      perCapita: { medical: 24000,  support: 7200,   care: 8400   },
      household: { medical: 25200,  support: 7800,   care: 6600   },
    },
  },
  {
    // 出典: 室戸市サイト（R7）所得割は画像のため検索結果の数値を使用
    // 後期支援分所得割1.1%は特異値のため要確認
    cityCode: "39202", citySlug: "muroto", cityName: "室戸市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0920, support: 0.0110, care: 0.0220 },
      perCapita: { medical: 31900,  support: 9400,   care: 10800  },
      household: { medical: 26800,  support: 5200,   care: 5800   },
    },
  },
  {
    cityCode: "39203", citySlug: "aki", cityName: "安芸市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0830, support: 0.0260, care: 0.0250 },
      perCapita: { medical: 30100,  support: 9700,   care: 11700  },
      household: { medical: 23800,  support: 7200,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認（R7ページ未公開）
    cityCode: "39204", citySlug: "nankoku", cityName: "南国市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0830, support: 0.0280, care: 0.0250 },
      perCapita: { medical: 26300,  support: 8500,   care: 10000  },
      household: { medical: 30000,  support: 8500,   care: 5500   },
    },
  },
  {
    cityCode: "39205", citySlug: "tosa", cityName: "土佐市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0812, support: 0.0277, care: 0.0268 },
      perCapita: { medical: 34100,  support: 11800,  care: 13800  },
      household: { medical: 24400,  support: 8500,   care: 7100   },
    },
  },
  {
    cityCode: "39206", citySlug: "susaki", cityName: "須崎市",
    caps: CAPS_NAT,
    // 出典: 須崎市サイト（賦課限度額のみ確認）。所得割等は要確認
    // TODO: 正確な所得割率・均等割額・平等割額を要確認
    rates: {
      rate:      { medical: 0.0870, support: 0.0270, care: 0.0250 },
      perCapita: { medical: 29000,  support: 9000,   care: 11000  },
      household: { medical: 24000,  support: 7000,   care: 5500   },
    },
  },
  {
    cityCode: "39208", citySlug: "sukumo", cityName: "宿毛市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0800, support: 0.0230, care: 0.0288 },
      perCapita: { medical: 22000,  support: 6000,   care: 18700  },
      household: { medical: 23000,  support: 5500,   care: 0      },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39209", citySlug: "tosashimizu", cityName: "土佐清水市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0820, support: 0.0260, care: 0.0250 },
      perCapita: { medical: 31000,  support: 9500,   care: 11000  },
      household: { medical: 26000,  support: 7000,   care: 5500   },
    },
  },
  {
    cityCode: "39210", citySlug: "shimanto", cityName: "四万十市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0640, support: 0.0320, care: 0.0260 },
      perCapita: { medical: 22000,  support: 11000,  care: 13000  },
      household: { medical: 15000,  support: 7000,   care: 6000   },
    },
  },
  {
    cityCode: "39211", citySlug: "konan-kochi", cityName: "香南市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0810, support: 0.0250, care: 0.0220 },
      perCapita: { medical: 29700,  support: 9100,   care: 9900   },
      household: { medical: 22600,  support: 7200,   care: 5300   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認（PDFのみのため）
    cityCode: "39212", citySlug: "kami-kochi", cityName: "香美市",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0850, support: 0.0270, care: 0.0240 },
      perCapita: { medical: 30000,  support: 9500,   care: 10500  },
      household: { medical: 23000,  support: 7000,   care: 5500   },
    },
  },

  // ── 町村 ──────────────────────────────────────────────────────

  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39301", citySlug: "toyomachi", cityName: "東洋町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0830, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 27000,  support: 8500,   care: 10000  },
      household: { medical: 22000,  support: 6000,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39302", citySlug: "naharimachi", cityName: "奈半利町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0840, support: 0.0270, care: 0.0250 },
      perCapita: { medical: 28000,  support: 9000,   care: 11000  },
      household: { medical: 22000,  support: 6500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39303", citySlug: "tanomachi", cityName: "田野町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0850, support: 0.0270, care: 0.0250 },
      perCapita: { medical: 28000,  support: 9000,   care: 11000  },
      household: { medical: 22000,  support: 6500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39304", citySlug: "yasudamachi", cityName: "安田町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0850, support: 0.0270, care: 0.0250 },
      perCapita: { medical: 28000,  support: 9000,   care: 11000  },
      household: { medical: 22000,  support: 6500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39305", citySlug: "kitagawamura", cityName: "北川村",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0830, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 27000,  support: 8500,   care: 10500  },
      household: { medical: 21000,  support: 6000,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39306", citySlug: "umajimura", cityName: "馬路村",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0820, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 27000,  support: 8500,   care: 10500  },
      household: { medical: 21000,  support: 6000,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39307", citySlug: "geisenimura", cityName: "芸西村",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0830, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 27000,  support: 8500,   care: 10500  },
      household: { medical: 21000,  support: 6000,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39341", citySlug: "motoyamamachi", cityName: "本山町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0840, support: 0.0270, care: 0.0250 },
      perCapita: { medical: 28000,  support: 9000,   care: 11000  },
      household: { medical: 22000,  support: 6500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39344", citySlug: "otoyomachi", cityName: "大豊町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0840, support: 0.0270, care: 0.0250 },
      perCapita: { medical: 28000,  support: 9000,   care: 11000  },
      household: { medical: 22000,  support: 6500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39363", citySlug: "tosamachi", cityName: "土佐町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0840, support: 0.0270, care: 0.0250 },
      perCapita: { medical: 28000,  support: 9000,   care: 11000  },
      household: { medical: 22000,  support: 6500,   care: 5500   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39364", citySlug: "okawamura", cityName: "大川村",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0820, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 27000,  support: 8500,   care: 10500  },
      household: { medical: 21000,  support: 6000,   care: 5000   },
    },
  },
  {
    cityCode: "39386", citySlug: "inomachi", cityName: "いの町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0680, support: 0.0230, care: 0.0200 },
      perCapita: { medical: 33000,  support: 10000,  care: 12000  },
      household: { medical: 22000,  support: 7000,   care: 6000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39387", citySlug: "niyodogawamachi", cityName: "仁淀川町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0810, support: 0.0260, care: 0.0230 },
      perCapita: { medical: 28000,  support: 9000,   care: 11000  },
      household: { medical: 21000,  support: 6000,   care: 5000   },
    },
  },
  {
    cityCode: "39401", citySlug: "nakatosamachi", cityName: "中土佐町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0735, support: 0.0230, care: 0.0200 },
      perCapita: { medical: 28000,  support: 10000,  care: 17000  },
      household: { medical: 21500,  support: 7000,   care: 0      },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39402", citySlug: "sakawamachi", cityName: "佐川町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0820, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 28000,  support: 9000,   care: 10500  },
      household: { medical: 22000,  support: 6500,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39403", citySlug: "ochimachi", cityName: "越知町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0820, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 27000,  support: 8500,   care: 10500  },
      household: { medical: 21000,  support: 6000,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39405", citySlug: "yusuharamachi", cityName: "梼原町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0840, support: 0.0270, care: 0.0250 },
      perCapita: { medical: 27000,  support: 9000,   care: 10500  },
      household: { medical: 18000,  support: 6000,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39406", citySlug: "hidakamura", cityName: "日高村",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0700, support: 0.0240, care: 0.0230 },
      perCapita: { medical: 27600,  support: 8500,   care: 10000  },
      household: { medical: 19200,  support: 6000,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39407", citySlug: "tsunomachi", cityName: "津野町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0780, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 26000,  support: 8500,   care: 10000  },
      household: { medical: 24000,  support: 6500,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39408", citySlug: "shimantomachi", cityName: "四万十町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0790, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 16000,  support: 8500,   care: 10000  },
      household: { medical: 19800,  support: 6500,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39424", citySlug: "otsukimachi", cityName: "大月町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0820, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 27000,  support: 8500,   care: 10500  },
      household: { medical: 21000,  support: 6000,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39425", citySlug: "miharamura", cityName: "三原村",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0810, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 27000,  support: 8500,   care: 10500  },
      household: { medical: 21000,  support: 6000,   care: 5000   },
    },
  },
  {
    // TODO: 令和7年度の正確な数値を要確認
    cityCode: "39426", citySlug: "kuroshiomachi", cityName: "黒潮町",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0820, support: 0.0260, care: 0.0240 },
      perCapita: { medical: 27000,  support: 8500,   care: 10500  },
      household: { medical: 21000,  support: 6000,   care: 5000   },
    },
  },
];
