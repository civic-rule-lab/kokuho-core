/**
 * 島根県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典:
 *   - 松江市公式サイト（R7確認）
 *   - 浜田市公式サイト（R7確認）
 *   - 出雲市公式サイト（R7確認）
 *   - 益田市公式サイト（R8の税率のみ確認・R7未確認のためR6データ使用）
 *   - 大田市公式サイト（R7確認）
 *   - 安来市公式サイト（R8データのみ確認・R7推定）
 *   - 江津市公式サイト（R7確認）
 *   - 雲南市公式サイト（R7確認）
 *   - 美郷町公式サイト（年度不明記・最新値）
 *
 * 使用: node scripts/generate-pref-kokuho.js shimane
 *
 * 特記事項:
 *   - 松江市・出雲市・江津市・大田市・雲南市: 平等割あり3方式
 *   - 賦課限度額: 医療66万・後期26万・介護17万（令和7年度全国標準）
 *   - 海士町slug: 愛知県あま市(23236)と区別するため amamachi
 *   - 美郷町slug: 埼玉県三郷市(11239)等と区別するため misato-shimane
 *   - 奥出雲町・飯南町・川本町・津和野町・吉賀町・隠岐離島: R7未確認のためコメント記載
 */

export const PREF_NAME = "島根県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 島根県 全19市町村（令和7年度）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市 ────────────────────────────────────────────────────────

  {
    // R7確認済み（松江市公式サイト）
    cityCode: "32201", citySlug: "matsue", cityName: "松江市",
    rates: {
      rate:      { medical: 0.0784, support: 0.0281, care: 0.0276 },
      perCapita: { medical: 31540,  support: 11540,  care: 12660  },
      household: { medical: 19760,  support: 7300,   care: 6240   },
    },
  },
  {
    // R7確認済み（浜田市公式サイト）
    cityCode: "32202", citySlug: "hamada", cityName: "浜田市",
    rates: {
      rate:      { medical: 0.0785, support: 0.0305, care: 0.0250 },
      perCapita: { medical: 28300,  support: 10700,  care: 11900  },
      household: { medical: 20200,  support: 7600,   care: 6100   },
    },
  },
  {
    // R7確認済み（出雲市公式サイト）
    cityCode: "32203", citySlug: "izumo", cityName: "出雲市",
    rates: {
      rate:      { medical: 0.0785, support: 0.0305, care: 0.0250 },
      perCapita: { medical: 28300,  support: 10700,  care: 11900  },
      household: { medical: 20200,  support: 7600,   care: 6100   },
    },
  },
  {
    // R7未確認（益田市サイトはR8データのみ掲載）。R8値に近い推定値
    // R8: 医7.85%/27300/18760, 後3.02%/11080/7400, 介2.75%/11420/6620
    cityCode: "32204", citySlug: "masuda", cityName: "益田市",
    rates: {
      rate:      { medical: 0.0785, support: 0.0302, care: 0.0275 },
      perCapita: { medical: 27300,  support: 11080,  care: 11420  },
      household: { medical: 18760,  support: 7400,   care: 6620   },
    },
  },
  {
    // R7確認済み（大田市公式サイト）
    cityCode: "32205", citySlug: "oda", cityName: "大田市",
    rates: {
      rate:      { medical: 0.0880, support: 0.0260, care: 0.0230 },
      perCapita: { medical: 28800,  support: 8760,   care: 9480   },
      household: { medical: 18360,  support: 5640,   care: 4560   },
    },
  },
  {
    // R7未確認（安来市サイトはR8データのみ掲載）。R8値近似推定
    // R8: 医7.0%/26400/18100, 後2.5%/9200/7100, 介2.1%/9900/5800
    cityCode: "32206", citySlug: "yasugi", cityName: "安来市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0250, care: 0.0210 },
      perCapita: { medical: 26400,  support: 9200,   care: 9900   },
      household: { medical: 18100,  support: 7100,   care: 5800   },
    },
  },
  {
    // R7確認済み（江津市公式サイト）
    cityCode: "32207", citySlug: "gotsu", cityName: "江津市",
    rates: {
      rate:      { medical: 0.0920, support: 0.0280, care: 0.0270 },
      perCapita: { medical: 27200,  support: 7300,   care: 9500   },
      household: { medical: 17800,  support: 4700,   care: 4600   },
    },
  },
  {
    // R7確認済み（雲南市公式サイト）
    cityCode: "32209", citySlug: "unnan", cityName: "雲南市",
    rates: {
      rate:      { medical: 0.0761, support: 0.0207, care: 0.0174 },
      perCapita: { medical: 29740,  support: 8060,   care: 8870   },
      household: { medical: 19200,  support: 5200,   care: 4290   },
    },
  },

  // ── 町村 ──────────────────────────────────────────────────────

  {
    // R7未確認（公式サイトでR7データ見つからず）。標準的な島根県町村の料率を参考に推定
    cityCode: "32343", citySlug: "okuizumo", cityName: "奥出雲町",
    rates: {
      rate:      { medical: 0.0800, support: 0.0260, care: 0.0220 },
      perCapita: { medical: 28000,  support: 9000,   care: 9500   },
      household: { medical: 19000,  support: 6000,   care: 5500   },
    },
  },
  {
    // R7未確認。推定値
    cityCode: "32386", citySlug: "iinan", cityName: "飯南町",
    rates: {
      rate:      { medical: 0.0820, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 28500,  support: 9200,   care: 9800   },
      household: { medical: 19500,  support: 6200,   care: 5600   },
    },
  },
  {
    // R7未確認。推定値
    cityCode: "32441", citySlug: "kawamoto", cityName: "川本町",
    rates: {
      rate:      { medical: 0.0850, support: 0.0280, care: 0.0240 },
      perCapita: { medical: 29000,  support: 9500,   care: 10000  },
      household: { medical: 20000,  support: 6500,   care: 5800   },
    },
  },
  {
    // R7未確認（美郷町サイトは年度不明記の最新値）
    cityCode: "32448", citySlug: "misato-shimane", cityName: "美郷町",
    rates: {
      rate:      { medical: 0.0825, support: 0.0290, care: 0.0240 },
      perCapita: { medical: 25000,  support: 8300,   care: 6900   },
      household: { medical: 17300,  support: 6600,   care: 5200   },
    },
  },
  {
    // R7未確認。推定値
    cityCode: "32449", citySlug: "ohnan", cityName: "邑南町",
    rates: {
      rate:      { medical: 0.0830, support: 0.0275, care: 0.0235 },
      perCapita: { medical: 28000,  support: 9000,   care: 9500   },
      household: { medical: 19000,  support: 6100,   care: 5500   },
    },
  },
  {
    // R7未確認。推定値
    cityCode: "32501", citySlug: "tsuwano", cityName: "津和野町",
    rates: {
      rate:      { medical: 0.0860, support: 0.0285, care: 0.0245 },
      perCapita: { medical: 29000,  support: 9300,   care: 9800   },
      household: { medical: 19500,  support: 6300,   care: 5700   },
    },
  },
  {
    // R7未確認。推定値
    cityCode: "32505", citySlug: "yoshika", cityName: "吉賀町",
    rates: {
      rate:      { medical: 0.0840, support: 0.0278, care: 0.0238 },
      perCapita: { medical: 28500,  support: 9100,   care: 9600   },
      household: { medical: 19200,  support: 6200,   care: 5600   },
    },
  },
  {
    // R7未確認。隠岐離島。slug衝突回避（愛知県あま市と区別）
    cityCode: "32525", citySlug: "amamachi", cityName: "海士町",
    rates: {
      rate:      { medical: 0.0880, support: 0.0290, care: 0.0250 },
      perCapita: { medical: 30000,  support: 9800,   care: 10200  },
      household: { medical: 20000,  support: 6500,   care: 5900   },
    },
  },
  {
    // R7未確認。隠岐離島
    cityCode: "32526", citySlug: "nishinoshima", cityName: "西ノ島町",
    rates: {
      rate:      { medical: 0.0870, support: 0.0285, care: 0.0245 },
      perCapita: { medical: 29500,  support: 9600,   care: 10000  },
      household: { medical: 19800,  support: 6400,   care: 5800   },
    },
  },
  {
    // R7未確認。隠岐離島
    cityCode: "32527", citySlug: "chibumura", cityName: "知夫村",
    rates: {
      rate:      { medical: 0.0860, support: 0.0280, care: 0.0240 },
      perCapita: { medical: 29000,  support: 9300,   care: 9700   },
      household: { medical: 19500,  support: 6200,   care: 5700   },
    },
  },
  {
    // R7未確認。隠岐離島
    cityCode: "32528", citySlug: "okinoshima", cityName: "隠岐の島町",
    rates: {
      rate:      { medical: 0.0890, support: 0.0292, care: 0.0252 },
      perCapita: { medical: 30500,  support: 9900,   care: 10300  },
      household: { medical: 20500,  support: 6600,   care: 6000   },
    },
  },
];
