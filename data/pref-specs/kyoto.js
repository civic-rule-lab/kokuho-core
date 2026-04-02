export const PREF_NAME = "京都府";

// 資産割率プリセット
// 宮津市: 4方式（所得割+資産割+均等割+平等割）
// 京丹後市: 4方式（R7は資産割半減の経過措置）
// 与謝野町: 4方式

export const MUNICIPALITIES = [
  {
    cityCode: "26100", citySlug: "kyoto", cityName: "京都市",
    note: "政令市。区ごとに窓口が異なるが保険料率は市全体で統一。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0827, support: 0.0267, care: 0.0237 },
      perCapita: { medical: 29840,  support: 9990,   care: 10090 },
      household: { medical: 18070,  support: 6050,   care: 4940 },
    },
  },
  {
    cityCode: "26201", citySlug: "fukuchiyama", cityName: "福知山市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0857, support: 0.0293, care: 0.0265 },
      perCapita: { medical: 30800,  support: 10700,  care: 11500 },
      household: { medical: 19500,  support: 6800,   care: 5600 },
    },
  },
  {
    cityCode: "26202", citySlug: "maizuru", cityName: "舞鶴市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0771, support: 0.0293, care: 0.0290 },
      perCapita: { medical: 21500,  support: 8500,   care: 9600 },
      household: { medical: 23500,  support: 9000,   care: 7900 },
    },
  },
  {
    cityCode: "26203", citySlug: "ayabe", cityName: "綾部市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0841, support: 0.0275, care: 0.0236 },
      perCapita: { medical: 31600,  support: 10300,  care: 11500 },
      household: { medical: 20600,  support: 6800,   care: 5800 },
    },
  },
  {
    cityCode: "26204", citySlug: "uji", cityName: "宇治市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.1018, support: 0.0307, care: 0.0274 },
      perCapita: { medical: 37400,  support: 11100,  care: 11600 },
      household: { medical: 23500,  support: 6900,   care: 5700 },
    },
  },
  {
    cityCode: "26205", citySlug: "miyazu", cityName: "宮津市",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.346, support: 0.138, care: 0.185 },
    rates: {
      rate:      { medical: 0.057,  support: 0.023,  care: 0.019 },
      perCapita: { medical: 28000,  support: 11200,  care: 12500 },
      household: { medical: 18500,  support: 7400,   care: 6000 },
    },
  },
  {
    cityCode: "26206", citySlug: "kameoka", cityName: "亀岡市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0897, support: 0.0287, care: 0.0278 },
      perCapita: { medical: 31700,  support: 9570,   care: 11430 },
      household: { medical: 22300,  support: 6610,   care: 5750 },
    },
  },
  {
    cityCode: "26207", citySlug: "joyo", cityName: "城陽市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0898, support: 0.0302, care: 0.0269 },
      perCapita: { medical: 26060,  support: 9170,   care: 7760 },
      household: { medical: 27270,  support: 9420,   care: 6100 },
    },
  },
  {
    cityCode: "26208", citySlug: "muko", cityName: "向日市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0990, support: 0.0290, care: 0.0273 },
      perCapita: { medical: 38760,  support: 11400,  care: 11640 },
      household: { medical: 24840,  support: 7320,   care: 5640 },
    },
  },
  {
    cityCode: "26209", citySlug: "nagaokakyo", cityName: "長岡京市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0810, support: 0.0270, care: 0.0280 },
      perCapita: { medical: 35100,  support: 11800,  care: 12100 },
      household: { medical: 22600,  support: 7600,   care: 5800 },
    },
  },
  {
    cityCode: "26210", citySlug: "yawata", cityName: "八幡市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0876, support: 0.0306, care: 0.0278 },
      perCapita: { medical: 31931,  support: 11097,  care: 11772 },
      household: { medical: 20372,  support: 6955,   care: 5801 },
    },
  },
  {
    cityCode: "26211", citySlug: "kyotanabe", cityName: "京田辺市",
    note: "令和8年度公式サイト確認値。令和7年度実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0755, support: 0.0229, care: 0.0242 },
      perCapita: { medical: 32959,  support: 9709,   care: 13899 },
      household: { medical: 23512,  support: 6110,   care: 7407 },
    },
  },
  {
    cityCode: "26212", citySlug: "kyotango", cityName: "京丹後市",
    note: "4方式。R7は資産割半減の経過措置。R8から3方式へ移行予定。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.0955, support: 0.032, care: 0.0325 },
    rates: {
      rate:      { medical: 0.0656, support: 0.0222, care: 0.0210 },
      perCapita: { medical: 19000,  support: 6200,   care: 7900 },
      household: { medical: 30700,  support: 10700,  care: 9300 },
    },
  },
  {
    cityCode: "26213", citySlug: "nantan", cityName: "南丹市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0797, support: 0.0300, care: 0.0276 },
      perCapita: { medical: 31000,  support: 10100,  care: 10500 },
      household: { medical: 23000,  support: 6000,   care: 5800 },
    },
  },
  {
    cityCode: "26214", citySlug: "kizugawa", cityName: "木津川市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0840, support: 0.0280, care: 0.0260 },
      perCapita: { medical: 28000,  support: 10200,  care: 10400 },
      household: { medical: 23800,  support: 7000,   care: 5600 },
    },
  },
  {
    cityCode: "26303", citySlug: "oyamazaki", cityName: "大山崎町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0810, support: 0.0259, care: 0.0254 },
      perCapita: { medical: 33600,  support: 10900,  care: 11200 },
      household: { medical: 21300,  support: 7000,   care: 5500 },
    },
  },
  {
    cityCode: "26322", citySlug: "kumiyama", cityName: "久御山町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.1107, support: 0.0242, care: 0.0186 },
      perCapita: { medical: 40785,  support: 11178,  care: 11880 },
      household: { medical: 25564,  support: 8088,   care: 7618 },
    },
  },
  {
    cityCode: "26343", citySlug: "ide", cityName: "井手町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.1048, support: 0.0333, care: 0.0323 },
      perCapita: { medical: 38968,  support: 12268,  care: 13550 },
      household: { medical: 24132,  support: 7598,   care: 6676 },
    },
  },
  {
    cityCode: "26344", citySlug: "ujitawara", cityName: "宇治田原町",
    note: "京都府R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0869, support: 0.0311, care: 0.0277 },
      perCapita: { medical: 32010,  support: 11294,  care: 11713 },
      household: { medical: 20064,  support: 7079,   care: 5772 },
    },
  },
  {
    cityCode: "26364", citySlug: "kasagi", cityName: "笠置町",
    note: "京都府R8標準保険料率を使用。実際値は要確認（医療分所得割が異常に低い可能性あり）。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0084, support: 0.0309, care: 0.0298 },
      perCapita: { medical: 3129,   support: 11370,  care: 12511 },
      household: { medical: 1938,   support: 7041,   care: 6164 },
    },
  },
  {
    cityCode: "26365", citySlug: "wazuka", cityName: "和束町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0700, support: 0.0270, care: 0.0250 },
      perCapita: { medical: 19200,  support: 7800,   care: 10200 },
      household: { medical: 21000,  support: 9000,   care: 11400 },
    },
  },
  {
    cityCode: "26366", citySlug: "seika", cityName: "精華町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0785, support: 0.0245, care: 0.0220 },
      perCapita: { medical: 26000,  support: 9000,   care: 9500 },
      household: { medical: 25000,  support: 7000,   care: 5500 },
    },
  },
  {
    cityCode: "26367", citySlug: "minamiyamashiro", cityName: "南山城村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0645, support: 0.0195, care: 0.0155 },
      perCapita: { medical: 23200,  support: 7300,   care: 6800 },
      household: { medical: 21100,  support: 6100,   care: 5100 },
    },
  },
  {
    cityCode: "26407", citySlug: "kyotamba", cityName: "京丹波町",
    note: "京都府R8標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0925, support: 0.0324, care: 0.0306 },
      perCapita: { medical: 34396,  support: 11918,  care: 12857 },
      household: { medical: 21301,  support: 7381,   care: 6334 },
    },
  },
  {
    cityCode: "26463", citySlug: "ine", cityName: "伊根町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0350, support: 0.0300, care: 0.0310 },
      perCapita: { medical: 11900,  support: 10200,  care: 13500 },
      household: { medical: 11900,  support: 10200,  care: 7000 },
    },
  },
  {
    cityCode: "26465", citySlug: "yosano", cityName: "与謝野町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.350, support: 0.135, care: 0.193 },
    rates: {
      rate:      { medical: 0.063,  support: 0.022,  care: 0.020 },
      perCapita: { medical: 30400,  support: 11000,  care: 13600 },
      household: { medical: 20400,  support: 7400,   care: 7200 },
    },
  },
];
