export const PREF_NAME = "愛知県";

// 愛知県 令和7年度 国民健康保険料率
// 出典: 愛知県 令和7年度 市町村標準保険料率
// https://www.pref.aichi.jp/uploaded/attachment/554686.pdf
//
// 名古屋市: 2方式（所得割+均等割のみ、平等割なし）
// 春日井市: 独自賦課限度額（65万/24万/17万）
// その他: 3方式（所得割+均等割+平等割）
// 多くの自治体は標準保険料率を使用。実際値は各自治体の公式情報を要確認。

export const MUNICIPALITIES = [
  {
    cityCode: "23100", citySlug: "nagoya", cityName: "名古屋市",
    note: "政令市。2方式（所得割+均等割のみ、平等割なし）。実際値。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0877, support: 0.0260, care: 0.0227 },
      perCapita: { medical: 49728,  support: 15715,  care: 15906 },
      household: { medical: 0,      support: 0,      care: 0 },
    },
  },
  {
    cityCode: "23201", citySlug: "toyohashi", cityName: "豊橋市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0760, support: 0.0272, care: 0.0229 },
      perCapita: { medical: 32586,  support: 11509,  care: 11597 },
      household: { medical: 21154,  support: 7472,   care: 5740 },
    },
  },
  {
    cityCode: "23202", citySlug: "okazaki", cityName: "岡崎市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0742, support: 0.0274, care: 0.0230 },
      perCapita: { medical: 31828,  support: 11591,  care: 11644 },
      household: { medical: 20662,  support: 7525,   care: 5763 },
    },
  },
  {
    cityCode: "23203", citySlug: "ichinomiya", cityName: "一宮市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0800, support: 0.0274, care: 0.0228 },
      perCapita: { medical: 34327,  support: 11611,  care: 11545 },
      household: { medical: 22284,  support: 7537,   care: 5714 },
    },
  },
  {
    cityCode: "23204", citySlug: "seto", cityName: "瀬戸市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0774, support: 0.0264, care: 0.0218 },
      perCapita: { medical: 33199,  support: 11167,  care: 11072 },
      household: { medical: 21552,  support: 7249,   care: 5480 },
    },
  },
  {
    cityCode: "23205", citySlug: "handa", cityName: "半田市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0801, support: 0.0282, care: 0.0237 },
      perCapita: { medical: 34361,  support: 11952,  care: 11999 },
      household: { medical: 22306,  support: 7759,   care: 5939 },
    },
  },
  {
    cityCode: "23206", citySlug: "kasugai", cityName: "春日井市",
    note: "独自賦課限度額（650000/240000/170000）。愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 650000, support: 240000, care: 170000 },
    rates: {
      rate:      { medical: 0.0770, support: 0.0278, care: 0.0230 },
      perCapita: { medical: 33036,  support: 11741,  care: 11676 },
      household: { medical: 21446,  support: 7622,   care: 5779 },
    },
  },
  {
    cityCode: "23207", citySlug: "toyokawa", cityName: "豊川市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0741, support: 0.0252, care: 0.0204 },
      perCapita: { medical: 31773,  support: 10654,  care: 10319 },
      household: { medical: 20627,  support: 6916,   care: 5107 },
    },
  },
  {
    cityCode: "23208", citySlug: "tsushima", cityName: "津島市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0689, support: 0.0240, care: 0.0200 },
      perCapita: { medical: 29555,  support: 10162,  care: 10156 },
      household: { medical: 19186,  support: 6597,   care: 5026 },
    },
  },
  {
    cityCode: "23209", citySlug: "hekinan", cityName: "碧南市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0763, support: 0.0279, care: 0.0238 },
      perCapita: { medical: 32747,  support: 11811,  care: 12045 },
      household: { medical: 21259,  support: 7668,   care: 5962 },
    },
  },
  {
    cityCode: "23210", citySlug: "kariya", cityName: "刈谷市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0748, support: 0.0285, care: 0.0233 },
      perCapita: { medical: 32100,  support: 12049,  care: 11829 },
      household: { medical: 20839,  support: 7822,   care: 5855 },
    },
  },
  {
    cityCode: "23211", citySlug: "toyota", cityName: "豊田市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0770, support: 0.0285, care: 0.0239 },
      perCapita: { medical: 33036,  support: 12057,  care: 12128 },
      household: { medical: 21446,  support: 7827,   care: 6003 },
    },
  },
  {
    cityCode: "23212", citySlug: "anjo", cityName: "安城市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0675, support: 0.0278, care: 0.0232 },
      perCapita: { medical: 28971,  support: 11767,  care: 11766 },
      household: { medical: 18807,  support: 7639,   care: 5824 },
    },
  },
  {
    cityCode: "23213", citySlug: "nishio", cityName: "西尾市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0756, support: 0.0284, care: 0.0237 },
      perCapita: { medical: 32435,  support: 12012,  care: 12006 },
      household: { medical: 21056,  support: 7798,   care: 5943 },
    },
  },
  {
    cityCode: "23214", citySlug: "gamagori", cityName: "蒲郡市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0810, support: 0.0281, care: 0.0227 },
      perCapita: { medical: 34735,  support: 11888,  care: 11514 },
      household: { medical: 22549,  support: 7717,   care: 5699 },
    },
  },
  {
    cityCode: "23215", citySlug: "inuyama", cityName: "犬山市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0801, support: 0.0264, care: 0.0226 },
      perCapita: { medical: 34348,  support: 11166,  care: 11446 },
      household: { medical: 22298,  support: 7248,   care: 5665 },
    },
  },
  {
    cityCode: "23216", citySlug: "tokoname", cityName: "常滑市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0692, support: 0.0231, care: 0.0189 },
      perCapita: { medical: 29679,  support: 9758,   care: 9577 },
      household: { medical: 19267,  support: 6335,   care: 4740 },
    },
  },
  {
    cityCode: "23217", citySlug: "konan", cityName: "江南市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0739, support: 0.0248, care: 0.0207 },
      perCapita: { medical: 31691,  support: 10489,  care: 10496 },
      household: { medical: 20573,  support: 6809,   care: 5195 },
    },
  },
  {
    cityCode: "23218", citySlug: "komaki", cityName: "小牧市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0743, support: 0.0275, care: 0.0231 },
      perCapita: { medical: 31850,  support: 11614,  care: 11715 },
      household: { medical: 20676,  support: 7540,   care: 5798 },
    },
  },
  {
    cityCode: "23219", citySlug: "inazawa", cityName: "稲沢市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0740, support: 0.0275, care: 0.0229 },
      perCapita: { medical: 31758,  support: 11647,  care: 11603 },
      household: { medical: 20616,  support: 7561,   care: 5743 },
    },
  },
  {
    cityCode: "23220", citySlug: "shinshiro", cityName: "新城市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0759, support: 0.0283, care: 0.0236 },
      perCapita: { medical: 32561,  support: 11973,  care: 11962 },
      household: { medical: 21138,  support: 7773,   care: 5921 },
    },
  },
  {
    cityCode: "23221", citySlug: "tokai", cityName: "東海市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0778, support: 0.0268, care: 0.0225 },
      perCapita: { medical: 33352,  support: 11333,  care: 11410 },
      household: { medical: 21651,  support: 7357,   care: 5647 },
    },
  },
  {
    cityCode: "23222", citySlug: "obu", cityName: "大府市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0792, support: 0.0283, care: 0.0239 },
      perCapita: { medical: 33973,  support: 11972,  care: 12096 },
      household: { medical: 22054,  support: 7772,   care: 5987 },
    },
  },
  {
    cityCode: "23223", citySlug: "chita", cityName: "知多市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0735, support: 0.0269, care: 0.0220 },
      perCapita: { medical: 31509,  support: 11396,  care: 11169 },
      household: { medical: 20455,  support: 7398,   care: 5528 },
    },
  },
  {
    cityCode: "23224", citySlug: "chiryu", cityName: "知立市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0714, support: 0.0268, care: 0.0225 },
      perCapita: { medical: 30608,  support: 11324,  care: 11427 },
      household: { medical: 19870,  support: 7351,   care: 5656 },
    },
  },
  {
    cityCode: "23225", citySlug: "owariasahi", cityName: "尾張旭市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0808, support: 0.0275, care: 0.0231 },
      perCapita: { medical: 34642,  support: 11640,  care: 11736 },
      household: { medical: 22489,  support: 7556,   care: 5809 },
    },
  },
  {
    cityCode: "23226", citySlug: "takahama", cityName: "高浜市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0782, support: 0.0271, care: 0.0225 },
      perCapita: { medical: 33549,  support: 11466,  care: 11425 },
      household: { medical: 21779,  support: 7444,   care: 5655 },
    },
  },
  {
    cityCode: "23227", citySlug: "iwakura", cityName: "岩倉市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0725, support: 0.0266, care: 0.0226 },
      perCapita: { medical: 31119,  support: 11243,  care: 11447 },
      household: { medical: 20202,  support: 7299,   care: 5665 },
    },
  },
  {
    cityCode: "23228", citySlug: "toyoake", cityName: "豊明市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0678, support: 0.0235, care: 0.0192 },
      perCapita: { medical: 29095,  support: 9960,   care: 9712 },
      household: { medical: 18888,  support: 6466,   care: 4807 },
    },
  },
  {
    cityCode: "23229", citySlug: "nisshin", cityName: "日進市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0753, support: 0.0277, care: 0.0230 },
      perCapita: { medical: 32287,  support: 11735,  care: 11679 },
      household: { medical: 20960,  support: 7618,   care: 5781 },
    },
  },
  {
    cityCode: "23230", citySlug: "tahara", cityName: "田原市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0741, support: 0.0294, care: 0.0246 },
      perCapita: { medical: 31784,  support: 12422,  care: 12479 },
      household: { medical: 20633,  support: 8064,   care: 6177 },
    },
  },
  {
    cityCode: "23231", citySlug: "aisai", cityName: "愛西市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0807, support: 0.0280, care: 0.0228 },
      perCapita: { medical: 34621,  support: 11826,  care: 11571 },
      household: { medical: 22475,  support: 7677,   care: 5727 },
    },
  },
  {
    cityCode: "23232", citySlug: "kiyosu", cityName: "清須市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0741, support: 0.0270, care: 0.0225 },
      perCapita: { medical: 31766,  support: 11416,  care: 11411 },
      household: { medical: 20622,  support: 7411,   care: 5648 },
    },
  },
  {
    cityCode: "23233", citySlug: "kitanagoya", cityName: "北名古屋市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0783, support: 0.0271, care: 0.0227 },
      perCapita: { medical: 33587,  support: 11445,  care: 11518 },
      household: { medical: 21804,  support: 7430,   care: 5701 },
    },
  },
  {
    cityCode: "23234", citySlug: "yatomi", cityName: "弥富市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0804, support: 0.0276, care: 0.0231 },
      perCapita: { medical: 34477,  support: 11687,  care: 11706 },
      household: { medical: 22381,  support: 7587,   care: 5794 },
    },
  },
  {
    cityCode: "23235", citySlug: "miyoshi", cityName: "みよし市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0801, support: 0.0278, care: 0.0234 },
      perCapita: { medical: 34342,  support: 11777,  care: 11889 },
      household: { medical: 22294,  support: 7646,   care: 5884 },
    },
  },
  {
    cityCode: "23236", citySlug: "ama", cityName: "あま市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0738, support: 0.0272, care: 0.0229 },
      perCapita: { medical: 31653,  support: 11489,  care: 11618 },
      household: { medical: 20549,  support: 7458,   care: 5750 },
    },
  },
  {
    cityCode: "23237", citySlug: "nagakute", cityName: "長久手市",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0744, support: 0.0272, care: 0.0221 },
      perCapita: { medical: 31899,  support: 11494,  care: 11219 },
      household: { medical: 20708,  support: 7462,   care: 5553 },
    },
  },
  {
    cityCode: "23302", citySlug: "togo", cityName: "東郷町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0804, support: 0.0282, care: 0.0232 },
      perCapita: { medical: 34491,  support: 11943,  care: 11767 },
      household: { medical: 22390,  support: 7753,   care: 5824 },
    },
  },
  {
    cityCode: "23303", citySlug: "toyoyama", cityName: "豊山町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0695, support: 0.0268, care: 0.0227 },
      perCapita: { medical: 29824,  support: 11360,  care: 11523 },
      household: { medical: 19361,  support: 7374,   care: 5703 },
    },
  },
  {
    cityCode: "23342", citySlug: "oguchi", cityName: "大口町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0737, support: 0.0278, care: 0.0236 },
      perCapita: { medical: 31607,  support: 11769,  care: 11952 },
      household: { medical: 20519,  support: 7640,   care: 5916 },
    },
  },
  {
    cityCode: "23343", citySlug: "fuso", cityName: "扶桑町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0812, support: 0.0273, care: 0.0229 },
      perCapita: { medical: 34819,  support: 11569,  care: 11603 },
      household: { medical: 22604,  support: 7511,   care: 5743 },
    },
  },
  {
    cityCode: "23361", citySlug: "oharu", cityName: "大治町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0743, support: 0.0273, care: 0.0224 },
      perCapita: { medical: 31886,  support: 11554,  care: 11380 },
      household: { medical: 20700,  support: 7501,   care: 5633 },
    },
  },
  {
    cityCode: "23362", citySlug: "kanie", cityName: "蟹江町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0827, support: 0.0277, care: 0.0233 },
      perCapita: { medical: 35472,  support: 11716,  care: 11832 },
      household: { medical: 23028,  support: 7606,   care: 5856 },
    },
  },
  {
    cityCode: "23363", citySlug: "tobishima", cityName: "飛島村",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0814, support: 0.0299, care: 0.0248 },
      perCapita: { medical: 34930,  support: 12638,  care: 12580 },
      household: { medical: 22676,  support: 8204,   care: 6227 },
    },
  },
  {
    cityCode: "23381", citySlug: "agui", cityName: "阿久比町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0792, support: 0.0278, care: 0.0233 },
      perCapita: { medical: 33992,  support: 11777,  care: 11798 },
      household: { medical: 22067,  support: 7646,   care: 5839 },
    },
  },
  {
    cityCode: "23382", citySlug: "higashiura", cityName: "東浦町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0794, support: 0.0275, care: 0.0230 },
      perCapita: { medical: 34076,  support: 11623,  care: 11650 },
      household: { medical: 22121,  support: 7545,   care: 5766 },
    },
  },
  {
    cityCode: "23384", citySlug: "minamichita", cityName: "南知多町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0822, support: 0.0287, care: 0.0240 },
      perCapita: { medical: 35273,  support: 12127,  care: 12192 },
      household: { medical: 22898,  support: 7872,   care: 6034 },
    },
  },
  {
    cityCode: "23385", citySlug: "mihama", cityName: "美浜町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0707, support: 0.0275, care: 0.0233 },
      perCapita: { medical: 30306,  support: 11642,  care: 11788 },
      household: { medical: 19674,  support: 7558,   care: 5834 },
    },
  },
  {
    cityCode: "23386", citySlug: "taketoyo", cityName: "武豊町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0819, support: 0.0276, care: 0.0229 },
      perCapita: { medical: 35118,  support: 11668,  care: 11592 },
      household: { medical: 22798,  support: 7574,   care: 5737 },
    },
  },
  {
    cityCode: "23425", citySlug: "kota", cityName: "幸田町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0629, support: 0.0245, care: 0.0202 },
      perCapita: { medical: 26996,  support: 10381,  care: 10252 },
      household: { medical: 17525,  support: 6739,   care: 5074 },
    },
  },
  {
    cityCode: "23441", citySlug: "shitara", cityName: "設楽町",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0778, support: 0.0279, care: 0.0240 },
      perCapita: { medical: 33376,  support: 11787,  care: 12144 },
      household: { medical: 21667,  support: 7652,   care: 6010 },
    },
  },
  {
    cityCode: "23442", citySlug: "toei", cityName: "東栄町",
    note: "愛知県R7標準保険料率を使用。医療分所得割が異常に高い（14.51%）のは標準値通り。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.1451, support: 0.0284, care: 0.0245 },
      perCapita: { medical: 62242,  support: 12028,  care: 12402 },
      household: { medical: 40406,  support: 7808,   care: 6139 },
    },
  },
  {
    cityCode: "23443", citySlug: "toyone", cityName: "豊根村",
    note: "愛知県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0704, support: 0.0285, care: 0.0257 },
      perCapita: { medical: 30205,  support: 12076,  care: 13054 },
      household: { medical: 19608,  support: 7839,   care: 6461 },
    },
  },
];
