/**
 * 宮崎県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 宮崎県「保険税率の状況」（令和7年10月公表）
 *   https://www.pref.miyazaki.lg.jp/kokuhoengo/kurashi/iryo/20251014135720.html
 * 各市町村公式サイト（実際値）
 *
 * 使用: node scripts/generate-pref-kokuho.js miyazaki
 *
 * ■ 確認済み（実際値）: 宮崎市・延岡市・小林市・日向市・西都市・えびの市・
 *   三股町・国富町・綾町・高鍋町・木城町・川南町・高千穂町・日之影町・五ヶ瀬町
 * ■ 推計値（要確認）: 都城市・日南市・串間市・高原町・新富町・西米良村・
 *   都農町・門川町・諸塚村・椎葉村・美郷町
 * ■ 資産割採用: 15市町村（延岡市・小林市・日向市・えびの市・三股町・国富町・
 *   木城町・五ヶ瀬町・都城市・日南市・串間市・西米良村・都農町・諸塚村・美郷町）
 * ■ 2方式: 川南町（所得割+均等割のみ）
 * ■ 延岡市: 非標準限度額（医療58万・後期19万・介護16万）
 */

export const PREF_NAME = "宮崎県";

const CAPS_NAT = { medical: 660000, support: 260000, care: 170000 };

export const MUNICIPALITIES = [

  // ── 市 ───────────────────────────────────────────────────────────

  {
    cityCode: "45201", citySlug: "miyazaki", cityName: "宮崎市",
    note: "県庁所在地。資産割なし。実際値。",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0870, support: 0.0300, care: 0.0220 },
      perCapita: { medical: 27000,  support:  9100,  care:  9100  },
      household: { medical: 19800,  support:  6600,  care:  5000  },
    },
  },

  {
    cityCode: "45202", citySlug: "miyakonojo", cityName: "都城市",
    note: "4方式。内訳は宮崎県集計合算値からの推計。実際値は要確認。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.1812, support: 0.0544, care: 0.0664 },
    rates: {
      rate:      { medical: 0.0970, support: 0.0355, care: 0.0290 },
      perCapita: { medical: 23100,  support:  7800,  care:  8200  },
      household: { medical: 22700,  support:  7300,  care:  6600  },
    },
  },

  {
    cityCode: "45203", citySlug: "nobeoka", cityName: "延岡市",
    note: "4方式。賦課限度額が標準より低い（医療58万・後期19万・介護16万）。介護分は資産割・平等割なし。令和8年度から資産割廃止予定。実際値。",
    caps: { medical: 580000, support: 190000, care: 160000 },
    assetLevy: { medical: 0.1550, support: 0.0300, care: 0 },
    rates: {
      rate:      { medical: 0.0845, support: 0.0280, care: 0.0280 },
      perCapita: { medical: 22800,  support:  7200,  care: 13200  },
      household: { medical: 22800,  support:  7200,  care:     0  },
    },
  },

  {
    cityCode: "45204", citySlug: "nichinan", cityName: "日南市",
    note: "4方式。内訳は宮崎県集計合算値からの推計。実際値は要確認。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.2124, support: 0.0637, care: 0.0779 },
    rates: {
      rate:      { medical: 0.0915, support: 0.0336, care: 0.0274 },
      perCapita: { medical: 25800,  support:  8760,  care:  9240  },
      household: { medical: 19700,  support:  6360,  care:  5740  },
    },
  },

  {
    cityCode: "45205", citySlug: "kobayashi", cityName: "小林市",
    note: "4方式。実際値。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.1158, support: 0.0289, care: 0.0300 },
    rates: {
      rate:      { medical: 0.1171, support: 0.0387, care: 0.0292 },
      perCapita: { medical: 26800,  support:  7700,  care:  7600  },
      household: { medical: 26100,  support:  7900,  care:  6100  },
    },
  },

  {
    cityCode: "45206", citySlug: "hyuga", cityName: "日向市",
    note: "4方式。実際値。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.1100, support: 0.0500, care: 0.0620 },
    rates: {
      rate:      { medical: 0.0860, support: 0.0310, care: 0.0290 },
      perCapita: { medical: 21600,  support:  7500,  care:  8900  },
      household: { medical: 21600,  support:  7400,  care:  7200  },
    },
  },

  {
    cityCode: "45207", citySlug: "kushima", cityName: "串間市",
    note: "4方式。R6から資産割が40.90%→26.80%に変更。内訳は宮崎県集計合算値からの推計。実際値は要確認。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.1608, support: 0.0482, care: 0.0590 },
    rates: {
      rate:      { medical: 0.0852, support: 0.0312, care: 0.0256 },
      perCapita: { medical: 24500,  support:  8300,  care:  8800  },
      household: { medical: 23000,  support:  7420,  care:  6680  },
    },
  },

  {
    cityCode: "45208", citySlug: "saito", cityName: "西都市",
    note: "資産割は平成30年度廃止済み。実際値。",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0850, support: 0.0310, care: 0.0183 },
      perCapita: { medical: 26600,  support:  9700,  care:  9600  },
      household: { medical: 25500,  support:  9600,  care:  6600  },
    },
  },

  {
    cityCode: "45209", citySlug: "ebino", cityName: "えびの市",
    note: "4方式。実際値。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.2100, support: 0.0600, care: 0.0757 },
    rates: {
      rate:      { medical: 0.0974, support: 0.0284, care: 0.0250 },
      perCapita: { medical: 26800,  support:  8200,  care:  8800  },
      household: { medical: 22400,  support:  6100,  care:  6100  },
    },
  },

  // ── 町村 ─────────────────────────────────────────────────────────

  {
    cityCode: "45341", citySlug: "mimata", cityName: "三股町",
    note: "4方式。宮崎県集計合算値と内訳の合計が一致（R7確認済み）。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.245, support: 0.085, care: 0.075 },
    rates: {
      rate:      { medical: 0.0825, support: 0.0350, care: 0.0230 },
      perCapita: { medical: 23300,  support:  9100,  care:  8300  },
      household: { medical: 18000,  support:  7000,  care:  4600  },
    },
  },

  {
    cityCode: "45361", citySlug: "takaharu", cityName: "高原町",
    note: "資産割なし。R7から所得割を大幅引き上げ（R6 14.01%→R7 16.01%）。均等割・平等割はR7確認済み、所得割はR6比率で按分推計。実際値は要確認。",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.1034, support: 0.0421, care: 0.0146 },
      perCapita: { medical: 30977,  support: 11251,  care: 11073  },
      household: { medical: 22395,  support:  8134,  care:  5661  },
    },
  },

  {
    cityCode: "45382", citySlug: "kunitomi", cityName: "国富町",
    note: "4方式。実際値。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.0873, support: 0.0383, care: 0.0380 },
    rates: {
      rate:      { medical: 0.0789, support: 0.0352, care: 0.0251 },
      perCapita: { medical: 27400,  support: 12000,  care: 12600  },
      household: { medical: 19300,  support:  8300,  care:  6500  },
    },
  },

  {
    cityCode: "45383", citySlug: "aya", cityName: "綾町",
    note: "R7より資産割廃止。実際値。",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0710, support: 0.0280, care: 0.0200 },
      perCapita: { medical: 26700,  support: 10600,  care: 11300  },
      household: { medical: 19900,  support:  8000,  care:  6100  },
    },
  },

  {
    cityCode: "45401", citySlug: "takanabe", cityName: "高鍋町",
    note: "資産割なし。介護分は平等割なし（2方式）。実際値。",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0800, support: 0.0450, care: 0.0280 },
      perCapita: { medical: 14000,  support: 10000,  care: 14000  },
      household: { medical: 19000,  support: 10000,  care:     0  },
    },
  },

  {
    cityCode: "45402", citySlug: "shintomi", cityName: "新富町",
    note: "資産割なし。内訳は宮崎県集計合算値からの推計。実際値は要確認。",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0848, support: 0.0311, care: 0.0254 },
      perCapita: { medical: 23100,  support:  7800,  care:  8200  },
      household: { medical: 21200,  support:  6840,  care:  6160  },
    },
  },

  {
    cityCode: "45403", citySlug: "nishimera", cityName: "西米良村",
    note: "4方式。内訳は宮崎県集計合算値からの推計（R6から大幅変更）。実際値は要確認。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.0816, support: 0.0245, care: 0.0299 },
    rates: {
      rate:      { medical: 0.0746, support: 0.0274, care: 0.0224 },
      perCapita: { medical: 24900,  support:  8440,  care:  8860  },
      household: { medical: 20700,  support:  6680,  care:  6020  },
    },
  },

  {
    cityCode: "45404", citySlug: "kijo", cityName: "木城町",
    note: "4方式。実際値。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.2000, support: 0.0600, care: 0.0700 },
    rates: {
      rate:      { medical: 0.0857, support: 0.0326, care: 0.0212 },
      perCapita: { medical: 25500,  support:  9000,  care: 10300  },
      household: { medical: 21400,  support:  7500,  care:  4700  },
    },
  },

  {
    cityCode: "45405", citySlug: "kawaminami", cityName: "川南町",
    note: "2方式（所得割+均等割のみ、平等割なし）。資産割なし。実際値。",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0803, support: 0.0281, care: 0.0222 },
      perCapita: { medical: 45000,  support: 15900,  care: 17900  },
      household: { medical:     0,  support:     0,  care:     0  },
    },
  },

  {
    cityCode: "45406", citySlug: "tsuno", cityName: "都農町",
    note: "4方式。資産割67.06%は県内最高水準。内訳は宮崎県集計合算値からの推計。実際値は要確認。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.4024, support: 0.1207, care: 0.1475 },
    rates: {
      rate:      { medical: 0.0619, support: 0.0227, care: 0.0186 },
      perCapita: { medical: 28100,  support:  9540,  care: 10060  },
      household: { medical: 20500,  support:  6600,  care:  5900  },
    },
  },

  {
    cityCode: "45421", citySlug: "kadogawa", cityName: "門川町",
    note: "資産割なし。内訳は宮崎県集計合算値からの推計。実際値は要確認。",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0888, support: 0.0326, care: 0.0266 },
      perCapita: { medical: 27600,  support:  9360,  care:  9840  },
      household: { medical: 19500,  support:  6280,  care:  5620  },
    },
  },

  {
    cityCode: "45429", citySlug: "morotsuka", cityName: "諸塚村",
    note: "4方式。内訳は宮崎県集計合算値からの推計。実際値は要確認。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.2132, support: 0.0640, care: 0.0782 },
    rates: {
      rate:      { medical: 0.1005, support: 0.0369, care: 0.0301 },
      perCapita: { medical: 28400,  support:  9620,  care: 10080  },
      household: { medical: 21600,  support:  6960,  care:  6240  },
    },
  },

  {
    cityCode: "45430", citySlug: "shiiba", cityName: "椎葉村",
    note: "R7より資産割廃止。内訳は宮崎県集計合算値からの推計。実際値は要確認。",
    caps: CAPS_NAT,
    rates: {
      rate:      { medical: 0.0888, support: 0.0326, care: 0.0266 },
      perCapita: { medical: 24000,  support:  8140,  care:  8560  },
      household: { medical: 20900,  support:  6740,  care:  6060  },
    },
  },

  {
    cityCode: "45431", citySlug: "misatomachi", cityName: "美郷町",
    note: "4方式。R6から資産割が62.62%→41.75%に大幅変更。内訳は宮崎県集計合算値からの推計。実際値は要確認。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.2505, support: 0.0752, care: 0.0918 },
    rates: {
      rate:      { medical: 0.0769, support: 0.0282, care: 0.0231 },
      perCapita: { medical: 31200,  support: 10560,  care: 11040  },
      household: { medical: 21400,  support:  6900,  care:  6200  },
    },
  },

  {
    cityCode: "45441", citySlug: "takachiho", cityName: "高千穂町",
    note: "4方式。実際値。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.1000, support: 0.0250, care: 0.0370 },
    rates: {
      rate:      { medical: 0.0810, support: 0.0290, care: 0.0315 },
      perCapita: { medical: 24500,  support:  8500,  care: 10100  },
      household: { medical: 22400,  support:  8000,  care:  6800  },
    },
  },

  {
    cityCode: "45442", citySlug: "hinokage", cityName: "日之影町",
    note: "4方式。実際値。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.1397, support: 0.0659, care: 0.0662 },
    rates: {
      rate:      { medical: 0.0663, support: 0.0308, care: 0.0205 },
      perCapita: { medical: 23500,  support: 10600,  care: 11500  },
      household: { medical: 15900,  support:  7200,  care:  5700  },
    },
  },

  {
    cityCode: "45443", citySlug: "gokase", cityName: "五ヶ瀬町",
    note: "4方式（医療分のみ資産割）。後期分・介護分の資産割は0。実際値。",
    caps: CAPS_NAT,
    assetLevy: { medical: 0.1300, support: 0, care: 0 },
    rates: {
      rate:      { medical: 0.0800, support: 0.0350, care: 0.0300 },
      perCapita: { medical: 24000,  support: 10000,  care:  9500  },
      household: { medical: 20000,  support:  8000,  care:  6500  },
    },
  },

];
