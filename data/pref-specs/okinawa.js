export const PREF_NAME = "沖縄県";

// 沖縄県 令和7年度 国民健康保険税（料）率
// 出典: 令和7年度 国民健康保険税（料）率 市町村一覧表（沖縄県公式）
// https://www.pref.okinawa.jp/iryokenko/iryo/1006488/1006489/1006494.html
//
// ・全41市町村が独自料率を設定（大阪府のような統一料率なし）
// ・資産割あり（4方式）: 17市町村 + 嘉手納町（介護分のみ）
// ・2方式（平等割なし）の市町村: なし（全市町村が平等割を設定）
// ・賦課限度額: 全市町村で全国標準（660/260/170万円）

export const MUNICIPALITIES = [
  {
    cityCode: "47201", citySlug: "naha", cityName: "那覇市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0970, support: 0.0159, care: 0.0156 },
      perCapita: { medical: 18200,  support: 3300,   care: 7700 },
      household: { medical: 25400,  support: 5300,   care: 4600 },
    },
  },
  {
    cityCode: "47205", citySlug: "ginowan", cityName: "宜野湾市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0743, support: 0.0266, care: 0.0280 },
      perCapita: { medical: 23000,  support: 8300,   care: 9600 },
      household: { medical: 22800,  support: 8000,   care: 6600 },
    },
  },
  {
    cityCode: "47209", citySlug: "nago", cityName: "名護市",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.200, support: 0.090, care: 0.040 },
    rates: {
      rate:      { medical: 0.0630, support: 0.0270, care: 0.0120 },
      perCapita: { medical: 14500,  support: 5900,   care: 4300 },
      household: { medical: 12500,  support: 5100,   care: 3600 },
    },
  },
  {
    cityCode: "47211", citySlug: "okinawashi", cityName: "沖縄市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0687, support: 0.0283, care: 0.0237 },
      perCapita: { medical: 21025,  support: 8698,   care: 9133 },
      household: { medical: 19351,  support: 8005,   care: 5996 },
    },
  },
  {
    cityCode: "47207", citySlug: "ishigaki", cityName: "石垣市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0835, support: 0.0220, care: 0.0220 },
      perCapita: { medical: 21000,  support: 5500,   care: 7000 },
      household: { medical: 20000,  support: 6000,   care: 5500 },
    },
  },
  {
    cityCode: "47208", citySlug: "urasoe", cityName: "浦添市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0820, support: 0.0240, care: 0.0240 },
      perCapita: { medical: 19000,  support: 7500,   care: 9500 },
      household: { medical: 17000,  support: 6000,   care: 6000 },
    },
  },
  {
    cityCode: "47210", citySlug: "itoman", cityName: "糸満市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0800, support: 0.0245, care: 0.0195 },
      perCapita: { medical: 27000,  support: 8300,   care: 8600 },
      household: { medical: 22000,  support: 6800,   care: 4700 },
    },
  },
  {
    cityCode: "47212", citySlug: "tomigusuku", cityName: "豊見城市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0844, support: 0.0261, care: 0.0210 },
      perCapita: { medical: 25800,  support: 9300,   care: 9900 },
      household: { medical: 23200,  support: 5400,   care: 3700 },
    },
  },
  {
    cityCode: "47215", citySlug: "nanjo", cityName: "南城市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0790, support: 0.0241, care: 0.0215 },
      perCapita: { medical: 19000,  support: 6500,   care: 7800 },
      household: { medical: 20900,  support: 6400,   care: 5300 },
    },
  },
  {
    cityCode: "47213", citySlug: "uruma", cityName: "うるま市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0770, support: 0.0250, care: 0.0210 },
      perCapita: { medical: 23500,  support: 8400,   care: 7700 },
      household: { medical: 22000,  support: 6000,   care: 6000 },
    },
  },
  {
    cityCode: "47214", citySlug: "miyakojima", cityName: "宮古島市",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.300, support: 0.070, care: 0.058 },
    rates: {
      rate:      { medical: 0.0835, support: 0.0210, care: 0.0200 },
      perCapita: { medical: 17500,  support: 4300,   care: 5000 },
      household: { medical: 15500,  support: 4000,   care: 3000 },
    },
  },
  {
    cityCode: "47362", citySlug: "yaese", cityName: "八重瀬町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0717, support: 0.0272, care: 0.0190 },
      perCapita: { medical: 18600,  support: 6900,   care: 6300 },
      household: { medical: 21800,  support: 8100,   care: 5000 },
    },
  },
  {
    cityCode: "47301", citySlug: "kunigami", cityName: "国頭村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.370, support: 0.080, care: 0.080 },
    rates: {
      rate:      { medical: 0.0780, support: 0.0200, care: 0.0200 },
      perCapita: { medical: 14500,  support: 3000,   care: 6800 },
      household: { medical: 17000,  support: 5500,   care: 5500 },
    },
  },
  {
    cityCode: "47302", citySlug: "ogimi", cityName: "大宜味村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.1060, support: 0.0460, care: 0.0310 },
    rates: {
      rate:      { medical: 0.0750, support: 0.0240, care: 0.0140 },
      perCapita: { medical: 18400,  support: 6300,   care: 6700 },
      household: { medical: 20300,  support: 6300,   care: 4700 },
    },
  },
  {
    cityCode: "47303", citySlug: "higashi", cityName: "東村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.375, support: 0.081, care: 0.0887 },
    rates: {
      rate:      { medical: 0.0550, support: 0.0170, care: 0.0189 },
      perCapita: { medical: 14000,  support: 4000,   care: 5200 },
      household: { medical: 17600,  support: 4200,   care: 4000 },
    },
  },
  {
    cityCode: "47306", citySlug: "nakijin", cityName: "今帰仁村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.2169, support: 0.0764, care: 0.0632 },
    rates: {
      rate:      { medical: 0.0819, support: 0.0339, care: 0.0220 },
      perCapita: { medical: 19500,  support: 8500,   care: 7500 },
      household: { medical: 19300,  support: 8000,   care: 5500 },
    },
  },
  {
    cityCode: "47308", citySlug: "motobu", cityName: "本部町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.240, support: 0.160, care: 0.044 },
    rates: {
      rate:      { medical: 0.0780, support: 0.0350, care: 0.0200 },
      perCapita: { medical: 17000,  support: 7000,   care: 5000 },
      household: { medical: 18000,  support: 9500,   care: 6000 },
    },
  },
  {
    cityCode: "47311", citySlug: "onna", cityName: "恩納村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0670, support: 0.0230, care: 0.0230 },
      perCapita: { medical: 25000,  support: 11000,  care: 12000 },
      household: { medical: 20000,  support: 9000,   care: 6000 },
    },
  },
  {
    cityCode: "47313", citySlug: "ginoza", cityName: "宜野座村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.080, support: 0.040, care: 0.030 },
    rates: {
      rate:      { medical: 0.0600, support: 0.0235, care: 0.0190 },
      perCapita: { medical: 19000,  support: 7000,   care: 9000 },
      household: { medical: 17000,  support: 6000,   care: 4500 },
    },
  },
  {
    cityCode: "47314", citySlug: "kin", cityName: "金武町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0514, support: 0.0203, care: 0.0245 },
      perCapita: { medical: 19000,  support: 7200,   care: 12600 },
      household: { medical: 13200,  support: 5100,   care: 6200 },
    },
  },
  {
    cityCode: "47315", citySlug: "ie", cityName: "伊江村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.300, support: 0.094, care: 0.050 },
    rates: {
      rate:      { medical: 0.0580, support: 0.0212, care: 0.0200 },
      perCapita: { medical: 14000,  support: 6000,   care: 6000 },
      household: { medical: 17000,  support: 4000,   care: 3000 },
    },
  },
  {
    cityCode: "47324", citySlug: "yomitan", cityName: "読谷村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0720, support: 0.0260, care: 0.0190 },
      perCapita: { medical: 17000,  support: 6000,   care: 6000 },
      household: { medical: 19000,  support: 6000,   care: 5000 },
    },
  },
  {
    cityCode: "47325", citySlug: "kadena", cityName: "嘉手納町",
    note: "介護分のみ資産割あり（医療分・後期分は3方式）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0, support: 0, care: 0.0680 },
    rates: {
      rate:      { medical: 0.0566, support: 0.0180, care: 0.0110 },
      perCapita: { medical: 17000,  support: 5500,   care: 6300 },
      household: { medical: 21000,  support: 6000,   care: 4000 },
    },
  },
  {
    cityCode: "47326", citySlug: "chatan", cityName: "北谷町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0750, support: 0.0246, care: 0.0210 },
      perCapita: { medical: 25400,  support: 9000,   care: 9300 },
      household: { medical: 22400,  support: 7100,   care: 5600 },
    },
  },
  {
    cityCode: "47327", citySlug: "kitanakagusuku", cityName: "北中城村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0660, support: 0.0240, care: 0.0190 },
      perCapita: { medical: 22320,  support: 7920,   care: 8760 },
      household: { medical: 19840,  support: 6440,   care: 5600 },
    },
  },
  {
    cityCode: "47328", citySlug: "nakagusuku", cityName: "中城村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0790, support: 0.0260, care: 0.0215 },
      perCapita: { medical: 22200,  support: 6700,   care: 7600 },
      household: { medical: 24000,  support: 8300,   care: 5300 },
    },
  },
  {
    cityCode: "47329", citySlug: "nishihara", cityName: "西原町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0800, support: 0.0280, care: 0.0230 },
      perCapita: { medical: 26900,  support: 9100,   care: 9800 },
      household: { medical: 23400,  support: 8100,   care: 5700 },
    },
  },
  {
    cityCode: "47348", citySlug: "yonabaru", cityName: "与那原町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0695, support: 0.0310, care: 0.0205 },
      perCapita: { medical: 19100,  support: 5700,   care: 6600 },
      household: { medical: 22000,  support: 6000,   care: 5600 },
    },
  },
  {
    cityCode: "47350", citySlug: "haebaru", cityName: "南風原町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0843, support: 0.0249, care: 0.0195 },
      perCapita: { medical: 24700,  support: 8700,   care: 7900 },
      household: { medical: 23200,  support: 6700,   care: 4800 },
    },
  },
  {
    cityCode: "47361", citySlug: "kumejima", cityName: "久米島町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.180, support: 0.060, care: 0.060 },
    rates: {
      rate:      { medical: 0.0650, support: 0.0200, care: 0.0180 },
      perCapita: { medical: 11700,  support: 3200,   care: 5700 },
      household: { medical: 18000,  support: 6600,   care: 4200 },
    },
  },
  {
    cityCode: "47353", citySlug: "tokashiki", cityName: "渡嘉敷村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.250, support: 0.050, care: 0.120 },
    rates: {
      rate:      { medical: 0.0560, support: 0.0140, care: 0.0080 },
      perCapita: { medical: 14000,  support: 3600,   care: 5000 },
      household: { medical: 16000,  support: 3500,   care: 2900 },
    },
  },
  {
    cityCode: "47354", citySlug: "zamami", cityName: "座間味村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.300, support: 0.067, care: 0.100 },
    rates: {
      rate:      { medical: 0.0600, support: 0.0198, care: 0.0050 },
      perCapita: { medical: 14000,  support: 4600,   care: 5300 },
      household: { medical: 16000,  support: 3900,   care: 2800 },
    },
  },
  {
    cityCode: "47355", citySlug: "aguni", cityName: "粟国村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.300, support: 0.060, care: 0.070 },
    rates: {
      rate:      { medical: 0.0600, support: 0.0200, care: 0.0150 },
      perCapita: { medical: 10000,  support: 4000,   care: 5000 },
      household: { medical: 14000,  support: 3600,   care: 3100 },
    },
  },
  {
    cityCode: "47356", citySlug: "tonaki", cityName: "渡名喜村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.450, support: 0.0428, care: 0.159 },
    rates: {
      rate:      { medical: 0.0800, support: 0.0130, care: 0.0150 },
      perCapita: { medical: 13000,  support: 3100,   care: 5000 },
      household: { medical: 16000,  support: 2600,   care: 2500 },
    },
  },
  {
    cityCode: "47357", citySlug: "minamidaito", cityName: "南大東村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.350, support: 0.045, care: 0.070 },
    rates: {
      rate:      { medical: 0.0500, support: 0.0150, care: 0.0120 },
      perCapita: { medical: 16000,  support: 4600,   care: 6000 },
      household: { medical: 17000,  support: 3900,   care: 3500 },
    },
  },
  {
    cityCode: "47358", citySlug: "kitadaito", cityName: "北大東村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.170, support: 0.032, care: 0.105 },
    rates: {
      rate:      { medical: 0.0360, support: 0.0180, care: 0.0150 },
      perCapita: { medical: 16000,  support: 6500,   care: 8000 },
      household: { medical: 16000,  support: 5000,   care: 6000 },
    },
  },
  {
    cityCode: "47359", citySlug: "iheya", cityName: "伊平屋村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.384, support: 0.096, care: 0.088 },
    rates: {
      rate:      { medical: 0.0580, support: 0.0150, care: 0.0140 },
      perCapita: { medical: 14500,  support: 4200,   care: 5800 },
      household: { medical: 17000,  support: 4000,   care: 4000 },
    },
  },
  {
    cityCode: "47360", citySlug: "izena", cityName: "伊是名村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.360, support: 0.090, care: 0.066 },
    rates: {
      rate:      { medical: 0.0540, support: 0.0140, care: 0.0120 },
      perCapita: { medical: 11200,  support: 2800,   care: 5200 },
      household: { medical: 15100,  support: 3900,   care: 2800 },
    },
  },
  {
    cityCode: "47375", citySlug: "tarama", cityName: "多良間村",
    note: "4方式（所得割+資産割+均等割+平等割）。医療分資産割75%は県内最高。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.750, support: 0.1075, care: 0.088 },
    rates: {
      rate:      { medical: 0.1080, support: 0.0150, care: 0.0290 },
      perCapita: { medical: 17000,  support: 2200,   care: 6700 },
      household: { medical: 21000,  support: 3000,   care: 3600 },
    },
  },
  {
    cityCode: "47381", citySlug: "taketomi", cityName: "竹富町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.2574, support: 0.0896, care: 0.0603 },
    rates: {
      rate:      { medical: 0.0615, support: 0.0218, care: 0.0182 },
      perCapita: { medical: 18100,  support: 6100,   care: 7000 },
      household: { medical: 14300,  support: 4800,   care: 3800 },
    },
  },
  {
    cityCode: "47382", citySlug: "yonaguni", cityName: "与那国町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.3095, support: 0.1126, care: 0.0803 },
    rates: {
      rate:      { medical: 0.0648, support: 0.0236, care: 0.0175 },
      perCapita: { medical: 14200,  support: 5200,   care: 6600 },
      household: { medical: 12500,  support: 4600,   care: 3800 },
    },
  },
];
