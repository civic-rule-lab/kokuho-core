/**
 * 兵庫県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 兵庫県「令和7年度 県内市町の保険料（税）率一覧」
 *   https://web.pref.hyogo.lg.jp/kf07/documents/documents/r7mieruka.pdf
 *   掲載元: https://web.pref.hyogo.lg.jp/kf07/documents/hyoujunhokenryou.html
 *
 * 使用: node scripts/generate-pref-kokuho.js hyogo
 *
 * 特記事項:
 *   - 全41市町実際値
 *   - 資産割なし（全市町）
 *   - 賦課限度額: 全市町で全国標準（660/260/170万円）
 *   - slug競合: 芦屋市→ashiyashi、豊岡市→toyookashi、たつの市→tatsunoshi
 *     市川町→ichikawamachi、神河町→kamikawamachi、太子町→taishimachi
 */

export const PREF_NAME = "兵庫県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 兵庫県 全41市町（令和7年度 実際値）
// 全市町3方式（所得割+均等割+平等割）、資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 政令市・市（29市）───────────────────────────────────────

  {
    cityCode: "28100", citySlug: "kobe", cityName: "神戸市",
    rates: {
      rate:      { medical: 0.0774, support: 0.0302, care: 0.0267 },
      perCapita: { medical: 34400,  support: 13230,  care: 13960  },
      household: { medical: 22230,  support: 8550,   care: 6740   },
    },
  },
  {
    cityCode: "28201", citySlug: "himeji", cityName: "姫路市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0300, care: 0.0270 },
      perCapita: { medical: 29310,  support: 12560,  care: 12550  },
      household: { medical: 18220,  support: 7810,   care: 6340   },
    },
  },
  {
    cityCode: "28202", citySlug: "amagasaki", cityName: "尼崎市",
    rates: {
      rate:      { medical: 0.0804, support: 0.0312, care: 0.0300 },
      perCapita: { medical: 31200,  support: 12048,  care: 12132  },
      household: { medical: 19404,  support: 7500,   care: 5928   },
    },
  },
  {
    cityCode: "28203", citySlug: "akashi", cityName: "明石市",
    rates: {
      rate:      { medical: 0.0696, support: 0.0267, care: 0.0255 },
      perCapita: { medical: 30330,  support: 12400,  care: 12880  },
      household: { medical: 20520,  support: 8670,   care: 6620   },
    },
  },
  {
    cityCode: "28204", citySlug: "nishinomiya", cityName: "西宮市",
    rates: {
      rate:      { medical: 0.0729, support: 0.0290, care: 0.0256 },
      perCapita: { medical: 32280,  support: 12480,  care: 12840  },
      household: { medical: 20640,  support: 7680,   care: 6240   },
    },
  },
  {
    cityCode: "28205", citySlug: "sumoto", cityName: "洲本市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0300, care: 0.0270 },
      perCapita: { medical: 28000,  support: 11000,  care: 11800  },
      household: { medical: 19000,  support: 7500,   care: 5500   },
    },
  },
  {
    cityCode: "28206", citySlug: "ashiyashi", cityName: "芦屋市",
    rates: {
      rate:      { medical: 0.0770, support: 0.0310, care: 0.0290 },
      perCapita: { medical: 33480,  support: 11520,  care: 12960  },
      household: { medical: 20460,  support: 7680,   care: 5880   },
    },
  },
  {
    cityCode: "28207", citySlug: "itami", cityName: "伊丹市",
    rates: {
      rate:      { medical: 0.0789, support: 0.0247, care: 0.0209 },
      perCapita: { medical: 25200,  support: 9500,   care: 11800  },
      household: { medical: 22000,  support: 7400,   care: 9300   },
    },
  },
  {
    cityCode: "28208", citySlug: "aioi", cityName: "相生市",
    rates: {
      rate:      { medical: 0.0720, support: 0.0278, care: 0.0256 },
      perCapita: { medical: 30000,  support: 12000,  care: 12500  },
      household: { medical: 20000,  support: 7900,   care: 6400   },
    },
  },
  {
    cityCode: "28209", citySlug: "toyookashi", cityName: "豊岡市",
    rates: {
      rate:      { medical: 0.0626, support: 0.0302, care: 0.0262 },
      perCapita: { medical: 26500,  support: 12900,  care: 13500  },
      household: { medical: 17100,  support: 8300,   care: 6700   },
    },
  },
  {
    cityCode: "28210", citySlug: "kakogawa", cityName: "加古川市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0301, care: 0.0271 },
      perCapita: { medical: 29769,  support: 12506,  care: 13972  },
      household: { medical: 19511,  support: 8196,   care: 6999   },
    },
  },
  {
    cityCode: "28212", citySlug: "ako", cityName: "赤穂市",
    rates: {
      rate:      { medical: 0.0748, support: 0.0288, care: 0.0244 },
      perCapita: { medical: 29300,  support: 11400,  care: 11900  },
      household: { medical: 19300,  support: 7700,   care: 6000   },
    },
  },
  {
    cityCode: "28213", citySlug: "nishiwaki", cityName: "西脇市",
    rates: {
      rate:      { medical: 0.0708, support: 0.0302, care: 0.0262 },
      perCapita: { medical: 30200,  support: 12900,  care: 13600  },
      household: { medical: 19800,  support: 8300,   care: 6700   },
    },
  },
  {
    cityCode: "28214", citySlug: "takarazuka", cityName: "宝塚市",
    rates: {
      rate:      { medical: 0.0840, support: 0.0220, care: 0.0270 },
      perCapita: { medical: 31600,  support: 8900,   care: 12100  },
      household: { medical: 23900,  support: 6200,   care: 6200   },
    },
  },
  {
    cityCode: "28215", citySlug: "miki", cityName: "三木市",
    rates: {
      rate:      { medical: 0.0730, support: 0.0300, care: 0.0260 },
      perCapita: { medical: 32000,  support: 13000,  care: 14000  },
      household: { medical: 20000,  support: 8000,   care: 7000   },
    },
  },
  {
    cityCode: "28216", citySlug: "takasago", cityName: "高砂市",
    rates: {
      rate:      { medical: 0.0741, support: 0.0305, care: 0.0265 },
      perCapita: { medical: 32018,  support: 12985,  care: 13664  },
      household: { medical: 20573,  support: 8343,   care: 6712   },
    },
  },
  {
    cityCode: "28217", citySlug: "kawanishi", cityName: "川西市",
    rates: {
      rate:      { medical: 0.0707, support: 0.0276, care: 0.0269 },
      perCapita: { medical: 29000,  support: 10200,  care: 11600  },
      household: { medical: 20800,  support: 8000,   care: 6000   },
    },
  },
  {
    cityCode: "28218", citySlug: "ono", cityName: "小野市",
    rates: {
      rate:      { medical: 0.0760, support: 0.0290, care: 0.0260 },
      perCapita: { medical: 30000,  support: 11000,  care: 12500  },
      household: { medical: 22000,  support: 8000,   care: 6500   },
    },
  },
  {
    cityCode: "28219", citySlug: "sanda", cityName: "三田市",
    rates: {
      rate:      { medical: 0.0718, support: 0.0290, care: 0.0273 },
      perCapita: { medical: 30500,  support: 12400,  care: 13700  },
      household: { medical: 21500,  support: 8500,   care: 6900   },
    },
  },
  {
    cityCode: "28220", citySlug: "kasai", cityName: "加西市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0280, care: 0.0270 },
      perCapita: { medical: 27000,  support: 9000,   care: 10000  },
      household: { medical: 18500,  support: 8000,   care: 7000   },
    },
  },
  {
    cityCode: "28221", citySlug: "tanbasasayama", cityName: "丹波篠山市",
    rates: {
      rate:      { medical: 0.0723, support: 0.0297, care: 0.0259 },
      perCapita: { medical: 29304,  support: 12000,  care: 12696  },
      household: { medical: 20100,  support: 7848,   care: 6216   },
    },
  },
  {
    cityCode: "28222", citySlug: "yabu", cityName: "養父市",
    rates: {
      rate:      { medical: 0.0700, support: 0.0258, care: 0.0239 },
      perCapita: { medical: 24500,  support: 8900,   care: 10600  },
      household: { medical: 18200,  support: 6200,   care: 4900   },
    },
  },
  {
    cityCode: "28223", citySlug: "tamba", cityName: "丹波市",
    rates: {
      rate:      { medical: 0.0731, support: 0.0266, care: 0.0255 },
      perCapita: { medical: 29500,  support: 10600,  care: 12700  },
      household: { medical: 20600,  support: 7400,   care: 6400   },
    },
  },
  {
    cityCode: "28224", citySlug: "minamiawaji", cityName: "南あわじ市",
    rates: {
      rate:      { medical: 0.0650, support: 0.0250, care: 0.0200 },
      perCapita: { medical: 26000,  support: 11000,  care: 12000  },
      household: { medical: 19000,  support: 6000,   care: 6000   },
    },
  },
  {
    cityCode: "28225", citySlug: "asago", cityName: "朝来市",
    rates: {
      rate:      { medical: 0.0690, support: 0.0280, care: 0.0230 },
      perCapita: { medical: 26400,  support: 10700,  care: 12000  },
      household: { medical: 19300,  support: 7800,   care: 6900   },
    },
  },
  {
    cityCode: "28226", citySlug: "awaji", cityName: "淡路市",
    rates: {
      rate:      { medical: 0.0730, support: 0.0270, care: 0.0200 },
      perCapita: { medical: 25300,  support: 9100,   care: 9800   },
      household: { medical: 22100,  support: 7600,   care: 6200   },
    },
  },
  {
    cityCode: "28227", citySlug: "shiso", cityName: "宍粟市",
    rates: {
      rate:      { medical: 0.0735, support: 0.0302, care: 0.0262 },
      perCapita: { medical: 30400,  support: 11900,  care: 13300  },
      household: { medical: 21000,  support: 7700,   care: 6300   },
    },
  },
  {
    cityCode: "28228", citySlug: "kato", cityName: "加東市",
    rates: {
      rate:      { medical: 0.0742, support: 0.0302, care: 0.0262 },
      perCapita: { medical: 32000,  support: 12800,  care: 13500  },
      household: { medical: 20500,  support: 8200,   care: 6600   },
    },
  },
  {
    cityCode: "28229", citySlug: "tatsunoshi", cityName: "たつの市",
    rates: {
      rate:      { medical: 0.0787, support: 0.0240, care: 0.0238 },
      perCapita: { medical: 26700,  support: 8300,   care: 10800  },
      household: { medical: 22800,  support: 6700,   care: 5800   },
    },
  },

  // ── 町（12町）───────────────────────────────────────────────

  {
    cityCode: "28301", citySlug: "inagawa", cityName: "猪名川町",
    rates: {
      rate:      { medical: 0.0611, support: 0.0239, care: 0.0261 },
      perCapita: { medical: 26800,  support: 10300,  care: 12300  },
      household: { medical: 19800,  support: 7600,   care: 6200   },
    },
  },
  {
    cityCode: "28365", citySlug: "taka", cityName: "多可町",
    rates: {
      rate:      { medical: 0.0650, support: 0.0262, care: 0.0235 },
      perCapita: { medical: 27000,  support: 10900,  care: 12300  },
      household: { medical: 18200,  support: 7400,   care: 6200   },
    },
  },
  {
    cityCode: "28381", citySlug: "inami", cityName: "稲美町",
    rates: {
      rate:      { medical: 0.0790, support: 0.0190, care: 0.0230 },
      perCapita: { medical: 27500,  support: 7000,   care: 9000   },
      household: { medical: 22000,  support: 4100,   care: 4000   },
    },
  },
  {
    cityCode: "28382", citySlug: "harima", cityName: "播磨町",
    rates: {
      rate:      { medical: 0.0790, support: 0.0200, care: 0.0240 },
      perCapita: { medical: 27600,  support: 6800,   care: 9000   },
      household: { medical: 22800,  support: 5400,   care: 4500   },
    },
  },
  {
    cityCode: "28442", citySlug: "ichikawamachi", cityName: "市川町",
    rates: {
      rate:      { medical: 0.0600, support: 0.0250, care: 0.0270 },
      perCapita: { medical: 23800,  support: 9500,   care: 10800  },
      household: { medical: 20000,  support: 7200,   care: 6600   },
    },
  },
  {
    cityCode: "28443", citySlug: "fukusaki", cityName: "福崎町",
    rates: {
      rate:      { medical: 0.0699, support: 0.0302, care: 0.0262 },
      perCapita: { medical: 30100,  support: 12800,  care: 13500  },
      household: { medical: 19300,  support: 8200,   care: 6600   },
    },
  },
  {
    cityCode: "28446", citySlug: "kamikawamachi", cityName: "神河町",
    rates: {
      rate:      { medical: 0.0683, support: 0.0298, care: 0.0260 },
      perCapita: { medical: 26900,  support: 11500,  care: 11800  },
      household: { medical: 18900,  support: 8000,   care: 5900   },
    },
  },
  {
    cityCode: "28464", citySlug: "taishimachi", cityName: "太子町",
    rates: {
      rate:      { medical: 0.0736, support: 0.0285, care: 0.0289 },
      perCapita: { medical: 30900,  support: 11800,  care: 13300  },
      household: { medical: 20800,  support: 8000,   care: 6700   },
    },
  },
  {
    cityCode: "28481", citySlug: "kamigori", cityName: "上郡町",
    rates: {
      rate:      { medical: 0.0730, support: 0.0290, care: 0.0275 },
      perCapita: { medical: 28500,  support: 11000,  care: 11000  },
      household: { medical: 20000,  support: 7500,   care: 6000   },
    },
  },
  {
    cityCode: "28501", citySlug: "sayo", cityName: "佐用町",
    rates: {
      rate:      { medical: 0.0725, support: 0.0285, care: 0.0260 },
      perCapita: { medical: 29000,  support: 11600,  care: 12800  },
      household: { medical: 19600,  support: 7600,   care: 6800   },
    },
  },
  {
    cityCode: "28585", citySlug: "mihamacho", cityName: "香美町",
    rates: {
      rate:      { medical: 0.0605, support: 0.0323, care: 0.0306 },
      perCapita: { medical: 24000,  support: 12380,  care: 13980  },
      household: { medical: 17000,  support: 8760,   care: 7000   },
    },
  },
  {
    cityCode: "28586", citySlug: "shinonsen", cityName: "新温泉町",
    rates: {
      rate:      { medical: 0.0536, support: 0.0274, care: 0.0294 },
      perCapita: { medical: 19200,  support: 11500,  care: 14500  },
      household: { medical: 14400,  support: 7400,   care: 7500   },
    },
  },
];
