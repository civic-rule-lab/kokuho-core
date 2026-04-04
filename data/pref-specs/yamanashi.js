/**
 * 山梨県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典:
 *   - 山梨県「令和6年度 国民健康保険料（税）率」（pref.yamanashi.jp/documents/80891/r6hokenryo_zei.pdf）
 *   - 各市町村公式サイト（令和7年度確認分: 富士吉田市・北杜市・中央市・笛吹市・南アルプス市・山梨市・甲州市）
 *
 * 使用: node scripts/generate-pref-kokuho.js yamanashi
 *
 * 特記事項:
 *   - 全27市町村が3方式（所得割+均等割+平等割）
 *   - 賦課限度額: 医療66万・後期26万・介護17万（令和7年度全国標準）
 *   - ※R7確認済みの市は個別注記、未確認分はR6データを使用（限度額のみR7更新）
 *   - 山梨県中央市・昭和町・北杜市など、slug衝突回避のため接尾辞付加
 */

export const PREF_NAME = "山梨県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 山梨県 全27市町村
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市 ────────────────────────────────────────────────────────

  {
    // R6データ（R7未確認）。平等割あり3方式
    cityCode: "19201", citySlug: "kofu", cityName: "甲府市",
    rates: {
      rate:      { medical: 0.0849, support: 0.0234, care: 0.0218 },
      perCapita: { medical: 27300,  support: 9600,   care: 9800   },
      household: { medical: 25500,  support: 6700,   care: 6000   },
    },
  },
  {
    // R7確認済み（富士吉田市公式サイト）
    cityCode: "19202", citySlug: "fujiyoshida", cityName: "富士吉田市",
    rates: {
      rate:      { medical: 0.0770, support: 0.0250, care: 0.0190 },
      perCapita: { medical: 25200,  support: 8400,   care: 10200  },
      household: { medical: 21600,  support: 6600,   care: 6000   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19204", citySlug: "tsuru", cityName: "都留市",
    rates: {
      rate:      { medical: 0.0658, support: 0.0240, care: 0.0196 },
      perCapita: { medical: 24500,  support: 8700,   care: 10300  },
      household: { medical: 19900,  support: 7000,   care: 6000   },
    },
  },
  {
    // R7確認済み（山梨市公式サイト）
    cityCode: "19205", citySlug: "yamanashi", cityName: "山梨市",
    rates: {
      rate:      { medical: 0.0780, support: 0.0240, care: 0.0220 },
      perCapita: { medical: 27200,  support: 8500,   care: 9900   },
      household: { medical: 26600,  support: 8100,   care: 7800   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19206", citySlug: "otsuki", cityName: "大月市",
    rates: {
      rate:      { medical: 0.0618, support: 0.0207, care: 0.0210 },
      perCapita: { medical: 26000,  support: 9000,   care: 11000  },
      household: { medical: 19000,  support: 6000,   care: 7000   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19207", citySlug: "nirasaki", cityName: "韮崎市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0250, care: 0.0210 },
      perCapita: { medical: 26400,  support: 9200,   care: 9900   },
      household: { medical: 20100,  support: 7100,   care: 5800   },
    },
  },
  {
    // R7確認済み（南アルプス市公式サイト）
    cityCode: "19208", citySlug: "minami-alps", cityName: "南アルプス市",
    rates: {
      rate:      { medical: 0.0618, support: 0.0234, care: 0.0175 },
      perCapita: { medical: 23500,  support: 8600,   care: 9000   },
      household: { medical: 22500,  support: 7800,   care: 6700   },
    },
  },
  {
    // R7確認済み（北杜市公式サイト）。slug衝突回避（北海道北斗市と区別）
    cityCode: "19209", citySlug: "hokuto-yamanashi", cityName: "北杜市",
    rates: {
      rate:      { medical: 0.0570, support: 0.0170, care: 0.0140 },
      perCapita: { medical: 22800,  support: 7500,   care: 8000   },
      household: { medical: 23000,  support: 6000,   care: 6000   },
    },
  },
  {
    // R6データ（R7未確認）。slug衝突回避（東京都甲斐市ではないが念のため確認済み）
    cityCode: "19210", citySlug: "kai", cityName: "甲斐市",
    rates: {
      rate:      { medical: 0.0610, support: 0.0210, care: 0.0191 },
      perCapita: { medical: 24300,  support: 8300,   care: 8600   },
      household: { medical: 18100,  support: 7300,   care: 5300   },
    },
  },
  {
    // R7確認済み（笛吹市公式サイト）
    cityCode: "19211", citySlug: "fuefuki", cityName: "笛吹市",
    rates: {
      rate:      { medical: 0.0719, support: 0.0237, care: 0.0186 },
      perCapita: { medical: 30200,  support: 9800,   care: 9900   },
      household: { medical: 21600,  support: 7000,   care: 5100   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19212", citySlug: "uenohara", cityName: "上野原市",
    rates: {
      rate:      { medical: 0.0705, support: 0.0250, care: 0.0230 },
      perCapita: { medical: 28000,  support: 11000,  care: 12000  },
      household: { medical: 25000,  support: 9000,   care: 9300   },
    },
  },
  {
    // R7確認済み（甲州市公式サイト）
    cityCode: "19213", citySlug: "koshu", cityName: "甲州市",
    rates: {
      rate:      { medical: 0.0748, support: 0.0239, care: 0.0203 },
      perCapita: { medical: 26000,  support: 8000,   care: 9900   },
      household: { medical: 27500,  support: 8000,   care: 6450   },
    },
  },
  {
    // R7確認済み（中央市公式サイト）。slug衝突回避（東京都中央区と区別）
    cityCode: "19214", citySlug: "chuo-yamanashi", cityName: "中央市",
    rates: {
      rate:      { medical: 0.0757, support: 0.0233, care: 0.0186 },
      perCapita: { medical: 31300,  support: 9600,   care: 9800   },
      household: { medical: 22700,  support: 6900,   care: 4600   },
    },
  },

  // ── 町村 ──────────────────────────────────────────────────────

  {
    // R6データ（R7未確認）
    cityCode: "19346", citySlug: "ichikawamisatomachi", cityName: "市川三郷町",
    rates: {
      rate:      { medical: 0.0648, support: 0.0244, care: 0.0187 },
      perCapita: { medical: 26700,  support: 8900,   care: 9700   },
      household: { medical: 22700,  support: 7100,   care: 5700   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19364", citySlug: "hayakawamachi", cityName: "早川町",
    rates: {
      rate:      { medical: 0.0650, support: 0.0130, care: 0.0120 },
      perCapita: { medical: 26000,  support: 6000,   care: 5700   },
      household: { medical: 24000,  support: 4000,   care: 3000   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19365", citySlug: "minobu", cityName: "身延町",
    rates: {
      rate:      { medical: 0.0790, support: 0.0195, care: 0.0195 },
      perCapita: { medical: 27400,  support: 7200,   care: 8100   },
      household: { medical: 29200,  support: 7700,   care: 6800   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19366", citySlug: "nanbumachi", cityName: "南部町",
    rates: {
      rate:      { medical: 0.0720, support: 0.0220, care: 0.0190 },
      perCapita: { medical: 26000,  support: 7000,   care: 8000   },
      household: { medical: 23000,  support: 7000,   care: 6000   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19368", citySlug: "fujikawamachi", cityName: "富士川町",
    rates: {
      rate:      { medical: 0.0780, support: 0.0240, care: 0.0220 },
      perCapita: { medical: 25500,  support: 10700,  care: 10300  },
      household: { medical: 26300,  support: 10000,  care: 8800   },
    },
  },
  {
    // R6データ（R7未確認）。slug衝突回避（群馬県昭和村と区別）
    cityCode: "19384", citySlug: "showamachi", cityName: "昭和町",
    rates: {
      rate:      { medical: 0.0790, support: 0.0292, care: 0.0243 },
      perCapita: { medical: 28000,  support: 9700,   care: 9500   },
      household: { medical: 27500,  support: 8500,   care: 7000   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19422", citySlug: "doshimura", cityName: "道志村",
    rates: {
      rate:      { medical: 0.0490, support: 0.0255, care: 0.0278 },
      perCapita: { medical: 27100,  support: 14000,  care: 14400  },
      household: { medical: 18500,  support: 9800,   care: 7800   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19423", citySlug: "nishikatsu", cityName: "西桂町",
    rates: {
      rate:      { medical: 0.0540, support: 0.0220, care: 0.0200 },
      perCapita: { medical: 24200,  support: 8600,   care: 10200  },
      household: { medical: 22000,  support: 7700,   care: 7100   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19424", citySlug: "oshinomura", cityName: "忍野村",
    rates: {
      rate:      { medical: 0.0730, support: 0.0230, care: 0.0160 },
      perCapita: { medical: 27500,  support: 9000,   care: 8800   },
      household: { medical: 24000,  support: 7200,   care: 5900   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19425", citySlug: "yamanakako", cityName: "山中湖村",
    rates: {
      rate:      { medical: 0.0710, support: 0.0210, care: 0.0150 },
      perCapita: { medical: 25000,  support: 8300,   care: 9600   },
      household: { medical: 26000,  support: 6700,   care: 6100   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19429", citySlug: "narusawa", cityName: "鳴沢村",
    rates: {
      rate:      { medical: 0.0500, support: 0.0201, care: 0.0146 },
      perCapita: { medical: 20000,  support: 10000,  care: 10000  },
      household: { medical: 18000,  support: 5000,   care: 5000   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19430", citySlug: "fujikawaguchiko", cityName: "富士河口湖町",
    rates: {
      rate:      { medical: 0.0800, support: 0.0308, care: 0.0257 },
      perCapita: { medical: 32500,  support: 12300,  care: 14000  },
      household: { medical: 25300,  support: 9600,   care: 8300   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19442", citySlug: "kosugemura", cityName: "小菅村",
    rates: {
      rate:      { medical: 0.0550, support: 0.0100, care: 0.0150 },
      perCapita: { medical: 20000,  support: 4000,   care: 8000   },
      household: { medical: 24000,  support: 5000,   care: 6000   },
    },
  },
  {
    // R6データ（R7未確認）
    cityCode: "19443", citySlug: "tabayamamura", cityName: "丹波山村",
    rates: {
      rate:      { medical: 0.0620, support: 0.0225, care: 0.0190 },
      perCapita: { medical: 23000,  support: 9000,   care: 10000  },
      household: { medical: 19000,  support: 7000,   care: 6000   },
    },
  },
];
