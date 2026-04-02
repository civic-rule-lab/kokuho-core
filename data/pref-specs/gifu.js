/**
 * 岐阜県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 岐阜県「市町村別の保険料（税）率の状況【令和7年度分】」
 *   https://www.pref.gifu.lg.jp/uploaded/attachment/460531.pdf
 *
 * 使用: node scripts/generate-pref-kokuho.js gifu
 *
 * 特記事項:
 *   - 資産割あり（4方式）: 白川町（医療9%・後期4%・介護3%）
 *   - 2方式（平等割なし）: 神戸町・輪之内町（全分）
 *   - 介護分のみ平等割なし: 本巣市・安八町・揖斐川町
 *   - 賦課限度額: 全市町村で全国標準（660/260/170万円）
 *   - slug競合: 高山市→takayamashi（長野県高山村がtakayamaを使用）
 *             山県市→yamagatashi（長野県山形村がyamagataを使用）
 *             瑞穂市→mizuhoshi（東京都瑞穂町がmizuhoを使用）
 */

export const PREF_NAME = "岐阜県";

// 岐阜県 令和7年度 国民健康保険料（税）率
// 出典: 岐阜県 市町村別の保険料（税）率の状況【令和7年度分】
// https://www.pref.gifu.lg.jp/uploaded/attachment/460531.pdf
//
// 料・税の別:
//   「料」: 岐阜市・大垣市・高山市・多治見市・中津川市・瑞浪市・恵那市・美濃加茂市・土岐市・
//           各務原市・飛騨市・郡上市・下呂市・海津市・関ケ原町・安八町・北方町・坂祝町・
//           富加町・川辺町・七宗町・白川村
//   「税」: 関市・美濃市・羽島市・山県市・瑞穂市・本巣市・郡上市・岐南町・笠松町・養老町・
//           垂井町・神戸町・輪之内町・揖斐川町・大野町・池田町・八百津町・白川町・東白川村・
//           御嵩町・可児市
//
// 方式:
//   2方式（所得割+均等割のみ）: 神戸町・輪之内町（全分）
//   介護分のみ平等割なし: 本巣市・安八町・揖斐川町
//   4方式（資産割あり）: 白川町（医療9%・後期4%・介護3%）
//   その他全市町村: 3方式（所得割+均等割+平等割）
//
// 賦課限度額: 全市町村 標準値（660/260/170万円）

export const MUNICIPALITIES = [
  {
    cityCode: "21201", citySlug: "gifu", cityName: "岐阜市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0800, support: 0.0237, care: 0.0168 },
      perCapita: { medical: 28200,  support: 8760,   care: 7920 },
      household: { medical: 29280,  support: 9240,   care: 6120 },
    },
  },
  {
    cityCode: "21202", citySlug: "ogaki", cityName: "大垣市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0738, support: 0.0256, care: 0.0215 },
      perCapita: { medical: 31000,  support: 11000,  care: 11000 },
      household: { medical: 20400,  support: 7200,   care: 5500 },
    },
  },
  {
    cityCode: "21203", citySlug: "takayamashi", cityName: "高山市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0551, support: 0.0240, care: 0.0185 },
      perCapita: { medical: 28700,  support: 12100,  care: 14100 },
      household: { medical: 20700,  support: 8400,   care: 7300 },
    },
  },
  {
    cityCode: "21204", citySlug: "tajimi", cityName: "多治見市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0765, support: 0.0273, care: 0.0220 },
      perCapita: { medical: 31400,  support: 10900,  care: 11000 },
      household: { medical: 22300,  support: 7700,   care: 5800 },
    },
  },
  {
    cityCode: "21205", citySlug: "seki", cityName: "関市",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0672, support: 0.0246, care: 0.0193 },
      perCapita: { medical: 30700,  support: 11000,  care: 12700 },
      household: { medical: 22500,  support: 8100,   care: 6600 },
    },
  },
  {
    cityCode: "21206", citySlug: "nakatsugawa", cityName: "中津川市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0707, support: 0.0279, care: 0.0221 },
      perCapita: { medical: 29800,  support: 11400,  care: 11300 },
      household: { medical: 20400,  support: 7700,   care: 5700 },
    },
  },
  {
    cityCode: "21207", citySlug: "mino", cityName: "美濃市",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0676, support: 0.0229, care: 0.0171 },
      perCapita: { medical: 29000,  support: 8500,   care: 10500 },
      household: { medical: 21000,  support: 6500,   care: 5500 },
    },
  },
  {
    cityCode: "21208", citySlug: "mizunami", cityName: "瑞浪市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0711, support: 0.0256, care: 0.0224 },
      perCapita: { medical: 31700,  support: 11700,  care: 12200 },
      household: { medical: 21400,  support: 7800,   care: 6000 },
    },
  },
  {
    cityCode: "21209", citySlug: "hashima", cityName: "羽島市",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0770, support: 0.0260, care: 0.0230 },
      perCapita: { medical: 29700,  support: 10200,  care: 10900 },
      household: { medical: 21000,  support: 7200,   care: 5600 },
    },
  },
  {
    cityCode: "21210", citySlug: "ena", cityName: "恵那市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0746, support: 0.0260, care: 0.0199 },
      perCapita: { medical: 31500,  support: 10900,  care: 10000 },
      household: { medical: 22400,  support: 7800,   care: 5100 },
    },
  },
  {
    cityCode: "21211", citySlug: "minokamo", cityName: "美濃加茂市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0685, support: 0.0255, care: 0.0225 },
      perCapita: { medical: 29300,  support: 11400,  care: 12000 },
      household: { medical: 20700,  support: 7900,   care: 6100 },
    },
  },
  {
    cityCode: "21212", citySlug: "toki", cityName: "土岐市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0685, support: 0.0257, care: 0.0193 },
      perCapita: { medical: 30120,  support: 11360,  care: 11160 },
      household: { medical: 19940,  support: 7530,   care: 5570 },
    },
  },
  {
    cityCode: "21213", citySlug: "kakamigahara", cityName: "各務原市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0761, support: 0.0250, care: 0.0216 },
      perCapita: { medical: 32100,  support: 10800,  care: 11100 },
      household: { medical: 20500,  support: 7000,   care: 5300 },
    },
  },
  {
    cityCode: "21214", citySlug: "kani", cityName: "可児市",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0708, support: 0.0250, care: 0.0174 },
      perCapita: { medical: 28300,  support: 11000,  care: 11000 },
      household: { medical: 20500,  support: 7500,   care: 6200 },
    },
  },
  {
    cityCode: "21215", citySlug: "yamagatashi", cityName: "山県市",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0785, support: 0.0284, care: 0.0209 },
      perCapita: { medical: 31500,  support: 10800,  care: 12200 },
      household: { medical: 22100,  support: 7100,   care: 4800 },
    },
  },
  {
    cityCode: "21216", citySlug: "mizuhoshi", cityName: "瑞穂市",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0674, support: 0.0251, care: 0.0231 },
      perCapita: { medical: 28400,  support: 10800,  care: 11500 },
      household: { medical: 20100,  support: 7600,   care: 6000 },
    },
  },
  {
    cityCode: "21217", citySlug: "hida", cityName: "飛騨市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0660, support: 0.0270, care: 0.0220 },
      perCapita: { medical: 29500,  support: 12000,  care: 12000 },
      household: { medical: 19700,  support: 8000,   care: 6000 },
    },
  },
  {
    cityCode: "21218", citySlug: "motosu", cityName: "本巣市",
    note: "税。介護分平等割なし（医療・後期は3方式、介護は2方式）。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0620, support: 0.0200, care: 0.0170 },
      perCapita: { medical: 25100,  support: 8500,   care: 14200 },
      household: { medical: 25600,  support: 7500,   care: 0 },
    },
  },
  {
    cityCode: "21219", citySlug: "gujo", cityName: "郡上市",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0700, support: 0.0266, care: 0.0205 },
      perCapita: { medical: 31550,  support: 11850,  care: 12750 },
      household: { medical: 22650,  support: 8700,   care: 6500 },
    },
  },
  {
    cityCode: "21220", citySlug: "gero", cityName: "下呂市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0610, support: 0.0216, care: 0.0160 },
      perCapita: { medical: 27100,  support: 9000,   care: 9700 },
      household: { medical: 20000,  support: 8000,   care: 6200 },
    },
  },
  {
    cityCode: "21221", citySlug: "kaizu", cityName: "海津市",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0699, support: 0.0252, care: 0.0200 },
      perCapita: { medical: 29800,  support: 11800,  care: 13100 },
      household: { medical: 28500,  support: 9000,   care: 6800 },
    },
  },
  {
    cityCode: "21302", citySlug: "ginancho", cityName: "岐南町",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0750, support: 0.0290, care: 0.0230 },
      perCapita: { medical: 31000,  support: 12000,  care: 12000 },
      household: { medical: 21000,  support: 8000,   care: 7000 },
    },
  },
  {
    cityCode: "21303", citySlug: "kasamatsucho", cityName: "笠松町",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0769, support: 0.0285, care: 0.0230 },
      perCapita: { medical: 33100,  support: 12100,  care: 11800 },
      household: { medical: 22600,  support: 8300,   care: 6100 },
    },
  },
  {
    cityCode: "21341", citySlug: "yorocho", cityName: "養老町",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0692, support: 0.0301, care: 0.0305 },
      perCapita: { medical: 27700,  support: 11600,  care: 9000 },
      household: { medical: 29000,  support: 4200,   care: 8000 },
    },
  },
  {
    cityCode: "21361", citySlug: "taruicho", cityName: "垂井町",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0661, support: 0.0249, care: 0.0221 },
      perCapita: { medical: 26500,  support: 9700,   care: 11000 },
      household: { medical: 19200,  support: 7000,   care: 5700 },
    },
  },
  {
    cityCode: "21362", citySlug: "sekigaharacho", cityName: "関ケ原町",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0572, support: 0.0197, care: 0.0170 },
      perCapita: { medical: 23090,  support: 7960,   care: 8070 },
      household: { medical: 16140,  support: 5560,   care: 3820 },
    },
  },
  {
    cityCode: "21381", citySlug: "godocho", cityName: "神戸町",
    note: "税。2方式（所得割+均等割のみ、平等割なし）。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0690, support: 0.0240, care: 0.0210 },
      perCapita: { medical: 38800,  support: 12900,  care: 15800 },
      household: { medical: 0,      support: 0,      care: 0 },
    },
  },
  {
    cityCode: "21382", citySlug: "wanouchi", cityName: "輪之内町",
    note: "税。2方式（所得割+均等割のみ、平等割なし）。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0685, support: 0.0193, care: 0.0161 },
      perCapita: { medical: 37500,  support: 11400,  care: 12300 },
      household: { medical: 0,      support: 0,      care: 0 },
    },
  },
  {
    cityCode: "21383", citySlug: "anpachicho", cityName: "安八町",
    note: "料。介護分平等割なし（医療・後期は3方式、介護は2方式）。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0620, support: 0.0210, care: 0.0210 },
      perCapita: { medical: 30000,  support: 11000,  care: 16000 },
      household: { medical: 24000,  support: 9000,   care: 0 },
    },
  },
  {
    cityCode: "21401", citySlug: "ibicho", cityName: "揖斐川町",
    note: "税。介護分平等割なし（医療・後期は3方式、介護は2方式）。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0620, support: 0.0230, care: 0.0230 },
      perCapita: { medical: 30000,  support: 13200,  care: 16800 },
      household: { medical: 24000,  support: 10200,  care: 0 },
    },
  },
  {
    cityCode: "21403", citySlug: "onocho", cityName: "大野町",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0676, support: 0.0197, care: 0.0241 },
      perCapita: { medical: 28500,  support: 8700,   care: 13000 },
      household: { medical: 23500,  support: 7300,   care: 7500 },
    },
  },
  {
    cityCode: "21404", citySlug: "ikedacho", cityName: "池田町",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0550, support: 0.0195, care: 0.0230 },
      perCapita: { medical: 20000,  support: 7000,   care: 10000 },
      household: { medical: 20000,  support: 8000,   care: 5000 },
    },
  },
  {
    cityCode: "21421", citySlug: "kitakata", cityName: "北方町",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0716, support: 0.0236, care: 0.0209 },
      perCapita: { medical: 26200,  support: 10000,  care: 12900 },
      household: { medical: 21200,  support: 7400,   care: 2000 },
    },
  },
  {
    cityCode: "21501", citySlug: "sakahogi", cityName: "坂祝町",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0580, support: 0.0240, care: 0.0170 },
      perCapita: { medical: 25000,  support: 10000,  care: 10000 },
      household: { medical: 18000,  support: 8000,   care: 5000 },
    },
  },
  {
    cityCode: "21502", citySlug: "tomika", cityName: "富加町",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0676, support: 0.0229, care: 0.0175 },
      perCapita: { medical: 28000,  support: 9200,   care: 12200 },
      household: { medical: 23800,  support: 7400,   care: 6600 },
    },
  },
  {
    cityCode: "21503", citySlug: "kawabe", cityName: "川辺町",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0557, support: 0.0221, care: 0.0167 },
      perCapita: { medical: 26600,  support: 9500,   care: 10100 },
      household: { medical: 19900,  support: 7500,   care: 6000 },
    },
  },
  {
    cityCode: "21504", citySlug: "shichiso", cityName: "七宗町",
    note: "料。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0635, support: 0.0255, care: 0.0205 },
      perCapita: { medical: 25500,  support: 10800,  care: 10700 },
      household: { medical: 22500,  support: 8600,   care: 8300 },
    },
  },
  {
    cityCode: "21505", citySlug: "yaotsu", cityName: "八百津町",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0570, support: 0.0190, care: 0.0180 },
      perCapita: { medical: 29000,  support: 9000,   care: 12000 },
      household: { medical: 27000,  support: 8000,   care: 8000 },
    },
  },
  {
    cityCode: "21506", citySlug: "shirakawa", cityName: "白川町",
    note: "税。4方式（資産割あり: 医療9%・後期4%・介護3%）。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0681, support: 0.0278, care: 0.0262 },
      perCapita: { medical: 30400,  support: 10700,  care: 14000 },
      household: { medical: 26800,  support: 10200,  care: 10500 },
    },
    assetLevy: { medical: 0.0900, support: 0.0400, care: 0.0300 },
  },
  {
    cityCode: "21507", citySlug: "higashishirakawa", cityName: "東白川村",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0680, support: 0.0250, care: 0.0185 },
      perCapita: { medical: 30000,  support: 11000,  care: 13000 },
      household: { medical: 25000,  support: 9500,   care: 7000 },
    },
  },
  {
    cityCode: "21521", citySlug: "mitake", cityName: "御嵩町",
    note: "税。3方式。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0759, support: 0.0199, care: 0.0186 },
      perCapita: { medical: 29000,  support: 7800,   care: 9000 },
      household: { medical: 25600,  support: 6400,   care: 6000 },
    },
  },
  {
    cityCode: "21604", citySlug: "shirakawamura", cityName: "白川村",
    note: "料。3方式。資産割なし。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0450, support: 0.0150, care: 0.0120 },
      perCapita: { medical: 30000,  support: 13000,  care: 11000 },
      household: { medical: 31000,  support: 13000,  care: 11000 },
    },
  },
];
