export const PREF_NAME = "北海道";

// 北海道 令和7年度 国民健康保険料率
// 出典: 北海道 道内市町村の国民健康保険料（税）率について
// https://www.pref.hokkaido.lg.jp/hf/kki/kokuho_hokennryouzeiritu.html
// ※ 各市町村が実際に設定した保険料率（R7実際値）
// ※ 資産割あり: 留萌市、伊達市、八雲町、蘭越町、岩内町、泊村、神恵内村、積丹町、古平町、赤井川村、新十津川町、秩父別町、北竜町、沼田町、当麻町、南富良野町、下川町、音威子府村、小平町、羽幌町、初山別村、遠別町、猿払村、訓子府町、置戸町、佐呂間町、興部町、雄武町、洞爺湖町、壮瞥町、安平町、新冠町、上士幌町、浦幌町、標茶町、鶴居村

export const MUNICIPALITIES = [
  {
    cityCode: "01100", citySlug: "sapporo", cityName: "札幌市",
    note: "政令市。区ごとに窓口が異なるが保険料率は市全体で統一。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0935, support: 0.0278, care: 0.0254 },
      perCapita: { medical: 19830,  support: 6150,  care: 5790 },
      household: { medical: 33380,  support: 10330,  care: 7690 },
    },
  },
  {
    cityCode: "01202", citySlug: "hakodate", cityName: "函館市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0875, support: 0.0258, care: 0.0223 },
      perCapita: { medical: 29170,  support: 8940,  care: 8760 },
      household: { medical: 23640,  support: 7250,  care: 5620 },
    },
  },
  {
    cityCode: "01203", citySlug: "otaru", cityName: "小樽市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.086, support: 0.025, care: 0.022000000000000002 },
      perCapita: { medical: 27480,  support: 8160,  care: 7800 },
      household: { medical: 28560,  support: 8400,  care: 6360 },
    },
  },
  {
    cityCode: "01204", citySlug: "asahikawa", cityName: "旭川市",
    note: "中核市。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08470000000000001, support: 0.0262, care: 0.022099999999999998 },
      perCapita: { medical: 28700,  support: 9000,  care: 8540 },
      household: { medical: 28340,  support: 8890,  care: 6670 },
    },
  },
  {
    cityCode: "01205", citySlug: "muroran", cityName: "室蘭市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.094, support: 0.027000000000000003, care: 0.025 },
      perCapita: { medical: 26070,  support: 12560,  care: 12020 },
      household: { medical: 29060,  support: 1710,  care: 1020 },
    },
  },
  {
    cityCode: "01206", citySlug: "kushiro", cityName: "釧路市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0934, support: 0.0279, care: 0.0252 },
      perCapita: { medical: 29200,  support: 9000,  care: 8700 },
      household: { medical: 26800,  support: 8200,  care: 6300 },
    },
  },
  {
    cityCode: "01207", citySlug: "obihiro", cityName: "帯広市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0775, support: 0.0225, care: 0.0179 },
      perCapita: { medical: 28190,  support: 8850,  care: 9500 },
      household: { medical: 28170,  support: 8840,  care: 7340 },
    },
  },
  {
    cityCode: "01208", citySlug: "kitami", cityName: "北見市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.079, support: 0.025, care: 0.02 },
      perCapita: { medical: 27200,  support: 8800,  care: 8800 },
      household: { medical: 24500,  support: 7700,  care: 6300 },
    },
  },
  {
    cityCode: "01209", citySlug: "yubari", cityName: "夕張市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0717, support: 0.023799999999999998, care: 0.018799999999999997 },
      perCapita: { medical: 26000,  support: 8400,  care: 8600 },
      household: { medical: 27000,  support: 8700,  care: 6900 },
    },
  },
  {
    cityCode: "01210", citySlug: "iwamizawa", cityName: "岩見沢市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0863, support: 0.0262, care: 0.019 },
      perCapita: { medical: 27810,  support: 8730,  care: 8660 },
      household: { medical: 28220,  support: 8860,  care: 6810 },
    },
  },
  {
    cityCode: "01211", citySlug: "abashiri", cityName: "網走市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0722, support: 0.0241, care: 0.0181 },
      perCapita: { medical: 28600,  support: 9500,  care: 12000 },
      household: { medical: 28400,  support: 9100,  care: 7200 },
    },
  },
  {
    cityCode: "01212", citySlug: "rumoi", cityName: "留萌市",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.28, support: 0.07, care: 0.06 },
    rates: {
      rate:      { medical: 0.095, support: 0.025, care: 0.02 },
      perCapita: { medical: 22000,  support: 6000,  care: 6000 },
      household: { medical: 25000,  support: 7000,  care: 7000 },
    },
  },
  {
    cityCode: "01213", citySlug: "tomakomai", cityName: "苫小牧市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0883, support: 0.0281, care: 0.0223 },
      perCapita: { medical: 21500,  support: 8900,  care: 8900 },
      household: { medical: 29900,  support: 9100,  care: 6900 },
    },
  },
  {
    cityCode: "01214", citySlug: "wakkanai", cityName: "稚内市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0802, support: 0.0254, care: 0.0148 },
      perCapita: { medical: 26200,  support: 8120,  care: 8140 },
      household: { medical: 30557,  support: 9295,  care: 6500 },
    },
  },
  {
    cityCode: "01215", citySlug: "bibai", cityName: "美唄市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08900000000000001, support: 0.032, care: 0.02 },
      perCapita: { medical: 28500,  support: 9000,  care: 9700 },
      household: { medical: 26000,  support: 8100,  care: 6500 },
    },
  },
  {
    cityCode: "01216", citySlug: "ashibetsu", cityName: "芦別市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0675, support: 0.0255, care: 0.019799999999999998 },
      perCapita: { medical: 22600,  support: 8900,  care: 9000 },
      household: { medical: 23400,  support: 8800,  care: 7000 },
    },
  },
  {
    cityCode: "01217", citySlug: "ebetsu", cityName: "江別市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08689999999999999, support: 0.027200000000000002, care: 0.0206 },
      perCapita: { medical: 27100,  support: 7600,  care: 7500 },
      household: { medical: 26800,  support: 7500,  care: 4000 },
    },
  },
  {
    cityCode: "01218", citySlug: "akabira", cityName: "赤平市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0726, support: 0.0275, care: 0.023 },
      perCapita: { medical: 21600,  support: 8100,  care: 9100 },
      household: { medical: 20700,  support: 7700,  care: 5800 },
    },
  },
  {
    cityCode: "01219", citySlug: "monbetsu", cityName: "紋別市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0943, support: 0.028999999999999998, care: 0.0259 },
      perCapita: { medical: 32100,  support: 10800,  care: 10400 },
      household: { medical: 29800,  support: 10100,  care: 7300 },
    },
  },
  {
    cityCode: "01220", citySlug: "shibetsu", cityName: "士別市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0842, support: 0.026699999999999998, care: 0.02 },
      perCapita: { medical: 27200,  support: 8500,  care: 8300 },
      household: { medical: 27500,  support: 8700,  care: 7000 },
    },
  },
  {
    cityCode: "01221", citySlug: "nayoro", cityName: "名寄市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.087, support: 0.025, care: 0.018000000000000002 },
      perCapita: { medical: 29000,  support: 9000,  care: 8000 },
      household: { medical: 30000,  support: 9000,  care: 7000 },
    },
  },
  {
    cityCode: "01222", citySlug: "mikasa", cityName: "三笠市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08460000000000001, support: 0.0229, care: 0.0096 },
      perCapita: { medical: 19700,  support: 5700,  care: 10000 },
      household: { medical: 22500,  support: 6400,  care: 6400 },
    },
  },
  {
    cityCode: "01223", citySlug: "nemuro", cityName: "根室市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0907, support: 0.029500000000000002, care: 0.019 },
      perCapita: { medical: 25500,  support: 8300,  care: 11600 },
      household: { medical: 27600,  support: 9000,  care: 6400 },
    },
  },
  {
    cityCode: "01224", citySlug: "chitose", cityName: "千歳市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.095, support: 0.0285, care: 0.021099999999999997 },
      perCapita: { medical: 27400,  support: 7900,  care: 9200 },
      household: { medical: 27900,  support: 8100,  care: 6600 },
    },
  },
  {
    cityCode: "01225", citySlug: "takikawa", cityName: "滝川市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.091, support: 0.027999999999999997, care: 0.023 },
      perCapita: { medical: 23100,  support: 6600,  care: 12000 },
      household: { medical: 23100,  support: 6600,  care: 0 },
    },
  },
  {
    cityCode: "01226", citySlug: "sunagawa", cityName: "砂川市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.085, support: 0.03, care: 0.025 },
      perCapita: { medical: 19900,  support: 5900,  care: 7000 },
      household: { medical: 18300,  support: 6500,  care: 5000 },
    },
  },
  {
    cityCode: "01227", citySlug: "utashinai", cityName: "歌志内市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.083, support: 0.022000000000000002, care: 0.016 },
      perCapita: { medical: 15700,  support: 4300,  care: 5900 },
      household: { medical: 17300,  support: 4700,  care: 3700 },
    },
  },
  {
    cityCode: "01228", citySlug: "fukagawa", cityName: "深川市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.084, support: 0.032, care: 0.024 },
      perCapita: { medical: 25000,  support: 10000,  care: 13000 },
      household: { medical: 27000,  support: 12000,  care: 0 },
    },
  },
  {
    cityCode: "01229", citySlug: "furano", cityName: "富良野市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08779999999999999, support: 0.028999999999999998, care: 0.0169 },
      perCapita: { medical: 24300,  support: 8300,  care: 9500 },
      household: { medical: 21300,  support: 7300,  care: 5700 },
    },
  },
  {
    cityCode: "01230", citySlug: "noboribetsu", cityName: "登別市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.084, support: 0.027000000000000003, care: 0.021 },
      perCapita: { medical: 23000,  support: 7600,  care: 8700 },
      household: { medical: 25000,  support: 7300,  care: 4800 },
    },
  },
  {
    cityCode: "01231", citySlug: "eniwa", cityName: "恵庭市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.09380000000000001, support: 0.029500000000000002, care: 0.0235 },
      perCapita: { medical: 26800,  support: 8600,  care: 9100 },
      household: { medical: 25900,  support: 8100,  care: 5600 },
    },
  },
  {
    cityCode: "01233", citySlug: "date", cityName: "伊達市",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.073, support: 0.023, care: 0.019 },
    rates: {
      rate:      { medical: 0.085, support: 0.02, care: 0.02 },
      perCapita: { medical: 25000,  support: 6000,  care: 6000 },
      household: { medical: 30000,  support: 7000,  care: 7000 },
    },
  },
  {
    cityCode: "01234", citySlug: "kitahiroshima", cityName: "北広島市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0842, support: 0.0273, care: 0.021 },
      perCapita: { medical: 26100,  support: 8900,  care: 8600 },
      household: { medical: 26600,  support: 9200,  care: 5900 },
    },
  },
  {
    cityCode: "01235", citySlug: "ishikari", cityName: "石狩市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0863, support: 0.0216, care: 0.0203 },
      perCapita: { medical: 23200,  support: 6000,  care: 7500 },
      household: { medical: 33700,  support: 8400,  care: 7100 },
    },
  },
  {
    cityCode: "01303", citySlug: "tobetsu", cityName: "当別町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08410000000000001, support: 0.026099999999999998, care: 0.0202 },
      perCapita: { medical: 27900,  support: 9100,  care: 9200 },
      household: { medical: 27700,  support: 9100,  care: 7200 },
    },
  },
  {
    cityCode: "01304", citySlug: "shinshinotsu", cityName: "新篠津村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.075, support: 0.027000000000000003, care: 0.019 },
      perCapita: { medical: 29000,  support: 9000,  care: 8000 },
      household: { medical: 30000,  support: 9000,  care: 7000 },
    },
  },
  {
    cityCode: "01331", citySlug: "matsumae", cityName: "松前町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.085, support: 0.024, care: 0.017 },
      perCapita: { medical: 27000,  support: 8000,  care: 8000 },
      household: { medical: 28000,  support: 8000,  care: 6000 },
    },
  },
  {
    cityCode: "01332", citySlug: "fukushima", cityName: "福島町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0833, support: 0.0253, care: 0.0196 },
      perCapita: { medical: 27700,  support: 8800,  care: 8900 },
      household: { medical: 27400,  support: 8800,  care: 7000 },
    },
  },
  {
    cityCode: "01333", citySlug: "shiriuchi", cityName: "知内町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08, support: 0.02, care: 0.015 },
      perCapita: { medical: 25000,  support: 8000,  care: 7000 },
      household: { medical: 25000,  support: 8000,  care: 8000 },
    },
  },
  {
    cityCode: "01334", citySlug: "kikonai", cityName: "木古内町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.086, support: 0.031, care: 0.027000000000000003 },
      perCapita: { medical: 23500,  support: 11500,  care: 15000 },
      household: { medical: 18500,  support: 0,  care: 0 },
    },
  },
  {
    cityCode: "01236", citySlug: "hokuto", cityName: "北斗市",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.09300000000000001, support: 0.024, care: 0.018000000000000002 },
      perCapita: { medical: 23000,  support: 6200,  care: 10000 },
      household: { medical: 29000,  support: 7600,  care: 0 },
    },
  },
  {
    cityCode: "01337", citySlug: "nanae", cityName: "七飯町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08199999999999999, support: 0.028999999999999998, care: 0.02 },
      perCapita: { medical: 27000,  support: 8000,  care: 8000 },
      household: { medical: 29000,  support: 9000,  care: 8000 },
    },
  },
  {
    cityCode: "01343", citySlug: "shikabe", cityName: "鹿部町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0756, support: 0.0254, care: 0.019 },
      perCapita: { medical: 6200,  support: 2200,  care: 2100 },
      household: { medical: 6200,  support: 2200,  care: 1600 },
    },
  },
  {
    cityCode: "01345", citySlug: "mori", cityName: "森町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08529999999999999, support: 0.025699999999999997, care: 0.0199 },
      perCapita: { medical: 28400,  support: 9000,  care: 9100 },
      household: { medical: 28200,  support: 9000,  care: 7100 },
    },
  },
  {
    cityCode: "01346", citySlug: "yakumo", cityName: "八雲町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.4, support: 0, care: 0 },
    rates: {
      rate:      { medical: 0.091, support: 0.035, care: 0.025 },
      perCapita: { medical: 26000,  support: 11000,  care: 14000 },
      household: { medical: 31000,  support: 0,  care: 0 },
    },
  },
  {
    cityCode: "01347", citySlug: "oshamanbe", cityName: "長万部町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.115, support: 0.0375, care: 0.015 },
      perCapita: { medical: 27800,  support: 8500,  care: 6400 },
      household: { medical: 27500,  support: 8300,  care: 6000 },
    },
  },
  {
    cityCode: "01361", citySlug: "esashi", cityName: "江差町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08, support: 0.0246, care: 0.0197 },
      perCapita: { medical: 25800,  support: 8700,  care: 8600 },
      household: { medical: 25700,  support: 8400,  care: 6800 },
    },
  },
  {
    cityCode: "01362", citySlug: "kaminokuni", cityName: "上ノ国町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0795, support: 0.03, care: 0.0204 },
      perCapita: { medical: 18400,  support: 6400,  care: 6800 },
      household: { medical: 23700,  support: 9600,  care: 8400 },
    },
  },
  {
    cityCode: "01363", citySlug: "assabu", cityName: "厚沢部町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0775, support: 0.025, care: 0.016399999999999998 },
      perCapita: { medical: 31000,  support: 10500,  care: 10000 },
      household: { medical: 29000,  support: 8000,  care: 6000 },
    },
  },
  {
    cityCode: "01364", citySlug: "otobe", cityName: "乙部町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0765, support: 0.027000000000000003, care: 0.018000000000000002 },
      perCapita: { medical: 20000,  support: 8000,  care: 8000 },
      household: { medical: 28000,  support: 9000,  care: 7000 },
    },
  },
  {
    cityCode: "01367", citySlug: "okushiri", cityName: "奥尻町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.065, support: 0.025, care: 0.02 },
      perCapita: { medical: 23700,  support: 10000,  care: 9000 },
      household: { medical: 18000,  support: 8000,  care: 9000 },
    },
  },
  {
    cityCode: "01371", citySlug: "setana", cityName: "せたな町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0789, support: 0.0245, care: 0.0184 },
      perCapita: { medical: 28000,  support: 9000,  care: 9400 },
      household: { medical: 24000,  support: 7600,  care: 5600 },
    },
  },
  {
    cityCode: "01370", citySlug: "imakane", cityName: "今金町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0839, support: 0.0273, care: 0.0203 },
      perCapita: { medical: 31000,  support: 9100,  care: 9100 },
      household: { medical: 30000,  support: 9200,  care: 7300 },
    },
  },
  {
    cityCode: "01391", citySlug: "shimamaki", cityName: "島牧村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.087, support: 0.024, care: 0.015 },
      perCapita: { medical: 25800,  support: 7600,  care: 6800 },
      household: { medical: 29600,  support: 8700,  care: 5600 },
    },
  },
  {
    cityCode: "01392", citySlug: "suttsu", cityName: "寿都町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.078, support: 0.026000000000000002, care: 0.019 },
      perCapita: { medical: 25000,  support: 8000,  care: 7800 },
      household: { medical: 22000,  support: 8000,  care: 5800 },
    },
  },
  {
    cityCode: "01393", citySlug: "kuromatsunai", cityName: "黒松内町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.07400000000000001, support: 0.026000000000000002, care: 0.017 },
      perCapita: { medical: 26600,  support: 8700,  care: 9100 },
      household: { medical: 27400,  support: 9000,  care: 7000 },
    },
  },
  {
    cityCode: "01394", citySlug: "rankoshi", cityName: "蘭越町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.45, support: 0.15, care: 0.07 },
    rates: {
      rate:      { medical: 0.08199999999999999, support: 0.02, care: 0.016 },
      perCapita: { medical: 11400,  support: 7400,  care: 10900 },
      household: { medical: 19000,  support: 7400,  care: 7600 },
    },
  },
  {
    cityCode: "01395", citySlug: "niseko", cityName: "ニセコ町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08, support: 0.0258, care: 0.019799999999999998 },
      perCapita: { medical: 26000,  support: 9400,  care: 8900 },
      household: { medical: 26300,  support: 9600,  care: 7100 },
    },
  },
  {
    cityCode: "01396", citySlug: "makkari", cityName: "真狩村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0767, support: 0.026600000000000002, care: 0.0204 },
      perCapita: { medical: 25515,  support: 9351,  care: 9339 },
      household: { medical: 25326,  support: 9281,  care: 7325 },
    },
  },
  {
    cityCode: "01397", citySlug: "rusutsu", cityName: "留寿都村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0683, support: 0.0271, care: 0.0202 },
      perCapita: { medical: 22700,  support: 9500,  care: 9200 },
      household: { medical: 22500,  support: 9400,  care: 7200 },
    },
  },
  {
    cityCode: "01398", citySlug: "kimobetsu", cityName: "喜茂別町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0721, support: 0.0258, care: 0.0199 },
      perCapita: { medical: 23977,  support: 9050,  care: 9106 },
      household: { medical: 23799,  support: 8983,  care: 7143 },
    },
  },
  {
    cityCode: "01399", citySlug: "kyogoku", cityName: "京極町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.085, support: 0.037000000000000005, care: 0.011000000000000001 },
      perCapita: { medical: 25000,  support: 2000,  care: 7000 },
      household: { medical: 33000,  support: 2000,  care: 7000 },
    },
  },
  {
    cityCode: "01400", citySlug: "kutchan", cityName: "倶知安町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.075, support: 0.022000000000000002, care: 0.0175 },
      perCapita: { medical: 30000,  support: 10000,  care: 11500 },
      household: { medical: 25000,  support: 8000,  care: 5500 },
    },
  },
  {
    cityCode: "01401", citySlug: "kyowa", cityName: "共和町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08800000000000001, support: 0.035, care: 0.02 },
      perCapita: { medical: 24000,  support: 7000,  care: 7000 },
      household: { medical: 32000,  support: 11000,  care: 7000 },
    },
  },
  {
    cityCode: "01402", citySlug: "iwanai", cityName: "岩内町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.142, support: 0.041, care: 0.049 },
    rates: {
      rate:      { medical: 0.091, support: 0.026000000000000002, care: 0.019 },
      perCapita: { medical: 24200,  support: 6900,  care: 7100 },
      household: { medical: 36000,  support: 10300,  care: 7800 },
    },
  },
  {
    cityCode: "01403", citySlug: "tomari", cityName: "泊村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.4215, support: 0.0221, care: 0.046 },
    rates: {
      rate:      { medical: 0.1043, support: 0.0139, care: 0.013300000000000001 },
      perCapita: { medical: 12700,  support: 6500,  care: 4000 },
      household: { medical: 22200,  support: 5900,  care: 4500 },
    },
  },
  {
    cityCode: "01404", citySlug: "kamoenai", cityName: "神恵内村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.64, support: 0.125, care: 0.087 },
    rates: {
      rate:      { medical: 0.07, support: 0.012, care: 0.013000000000000001 },
      perCapita: { medical: 20000,  support: 3400,  care: 5600 },
      household: { medical: 33000,  support: 5800,  care: 7700 },
    },
  },
  {
    cityCode: "01405", citySlug: "shakotan", cityName: "積丹町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.6, support: 0.19, care: 0.13 },
    rates: {
      rate:      { medical: 0.075, support: 0.018000000000000002, care: 0.013999999999999999 },
      perCapita: { medical: 24000,  support: 7500,  care: 9400 },
      household: { medical: 38000,  support: 6300,  care: 6000 },
    },
  },
  {
    cityCode: "01406", citySlug: "furubira", cityName: "古平町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.8, support: 0.1, care: 0.14 },
    rates: {
      rate:      { medical: 0.085, support: 0.03, care: 0.015 },
      perCapita: { medical: 20000,  support: 5000,  care: 7500 },
      household: { medical: 30200,  support: 7000,  care: 4500 },
    },
  },
  {
    cityCode: "01407", citySlug: "niki", cityName: "仁木町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.065, support: 0.025, care: 0.013000000000000001 },
      perCapita: { medical: 18000,  support: 7000,  care: 7000 },
      household: { medical: 24000,  support: 7000,  care: 5000 },
    },
  },
  {
    cityCode: "01408", citySlug: "yoichi", cityName: "余市町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0862, support: 0.025699999999999997, care: 0.0169 },
      perCapita: { medical: 28100,  support: 8500,  care: 8100 },
      household: { medical: 29900,  support: 9000,  care: 6400 },
    },
  },
  {
    cityCode: "01409", citySlug: "akaiwa", cityName: "赤井川村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.6, support: 0.1, care: 0.1 },
    rates: {
      rate:      { medical: 0.062, support: 0.018000000000000002, care: 0.017 },
      perCapita: { medical: 19000,  support: 6000,  care: 6000 },
      household: { medical: 30000,  support: 7000,  care: 7000 },
    },
  },
  {
    cityCode: "01423", citySlug: "nanporo", cityName: "南幌町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08, support: 0.02, care: 0.0125 },
      perCapita: { medical: 27000,  support: 5000,  care: 8000 },
      household: { medical: 36000,  support: 7000,  care: 7000 },
    },
  },
  {
    cityCode: "01424", citySlug: "naie", cityName: "奈井江町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.075, support: 0.023, care: 0.018000000000000002 },
      perCapita: { medical: 23000,  support: 8000,  care: 8400 },
      household: { medical: 20800,  support: 6800,  care: 5900 },
    },
  },
  {
    cityCode: "01425", citySlug: "kamisunagawa", cityName: "上砂川町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.07, support: 0.027000000000000003, care: 0.02 },
      perCapita: { medical: 14000,  support: 10000,  care: 10000 },
      household: { medical: 10000,  support: 7000,  care: 5000 },
    },
  },
  {
    cityCode: "01427", citySlug: "yuni", cityName: "由仁町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.076, support: 0.021, care: 0.013999999999999999 },
      perCapita: { medical: 27000,  support: 9000,  care: 9000 },
      household: { medical: 25000,  support: 7000,  care: 6000 },
    },
  },
  {
    cityCode: "01428", citySlug: "naganuma", cityName: "長沼町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.081, support: 0.025, care: 0.018000000000000002 },
      perCapita: { medical: 28000,  support: 8000,  care: 8000 },
      household: { medical: 21000,  support: 6000,  care: 5000 },
    },
  },
  {
    cityCode: "01429", citySlug: "kuriyama", cityName: "栗山町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.085, support: 0.022000000000000002, care: 0.015 },
      perCapita: { medical: 24000,  support: 7000,  care: 7000 },
      household: { medical: 30000,  support: 8000,  care: 8000 },
    },
  },
  {
    cityCode: "01430", citySlug: "tsukigata", cityName: "月形町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.064, support: 0.022000000000000002, care: 0.016 },
      perCapita: { medical: 25800,  support: 9500,  care: 9200 },
      household: { medical: 26100,  support: 9600,  care: 7300 },
    },
  },
  {
    cityCode: "01431", citySlug: "urausu", cityName: "浦臼町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.07, support: 0.023, care: 0.016 },
      perCapita: { medical: 28000,  support: 5000,  care: 8000 },
      household: { medical: 20000,  support: 5000,  care: 8000 },
    },
  },
  {
    cityCode: "01432", citySlug: "shintotsu", cityName: "新十津川町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.1, support: 0.0175, care: 0.02 },
    rates: {
      rate:      { medical: 0.045, support: 0.013999999999999999, care: 0.006999999999999999 },
      perCapita: { medical: 22000,  support: 6000,  care: 6000 },
      household: { medical: 22000,  support: 6000,  care: 4000 },
    },
  },
  {
    cityCode: "01433", citySlug: "moseushi", cityName: "妹背牛町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.020099999999999996, support: 0.0087, care: 0.0063 },
      perCapita: { medical: 28000,  support: 11800,  care: 14000 },
      household: { medical: 26100,  support: 11000,  care: 8400 },
    },
  },
  {
    cityCode: "01434", citySlug: "chippubetsu", cityName: "秩父別町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.0988, support: 0.0231, care: 0.0481 },
    rates: {
      rate:      { medical: 0.0591, support: 0.0113, care: 0.0159 },
      perCapita: { medical: 36900,  support: 12100,  care: 16700 },
      household: { medical: 24600,  support: 8000,  care: 7900 },
    },
  },
  {
    cityCode: "01436", citySlug: "uryu", cityName: "雨竜町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.075, support: 0.025, care: 0.02 },
      perCapita: { medical: 25000,  support: 9000,  care: 8000 },
      household: { medical: 24000,  support: 8500,  care: 6500 },
    },
  },
  {
    cityCode: "01437", citySlug: "hokuryu", cityName: "北竜町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.0105, support: 0.0034, care: 0.0037 },
    rates: {
      rate:      { medical: 0.032799999999999996, support: 0.009899999999999999, care: 0.0066 },
      perCapita: { medical: 34000,  support: 13000,  care: 15000 },
      household: { medical: 35000,  support: 13000,  care: 14000 },
    },
  },
  {
    cityCode: "01438", citySlug: "numata", cityName: "沼田町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.2, support: 0, care: 0 },
    rates: {
      rate:      { medical: 0.020099999999999996, support: 0.006500000000000001, care: 0.0045000000000000005 },
      perCapita: { medical: 37900,  support: 11900,  care: 21500 },
      household: { medical: 28100,  support: 8900,  care: 0 },
    },
  },
  {
    cityCode: "01472", citySlug: "horokanai", cityName: "幌加内町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.044199999999999996, support: 0.0104, care: 0.0105 },
      perCapita: { medical: 20000,  support: 5600,  care: 5200 },
      household: { medical: 22000,  support: 6400,  care: 4400 },
    },
  },
  {
    cityCode: "01452", citySlug: "takasu", cityName: "鷹栖町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.053, support: 0.02, care: 0.015 },
      perCapita: { medical: 18700,  support: 6800,  care: 6700 },
      household: { medical: 18900,  support: 6900,  care: 5400 },
    },
  },
  {
    cityCode: "01454", citySlug: "toma", cityName: "当麻町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.035, support: 0.009, care: 0.004 },
    rates: {
      rate:      { medical: 0.07200000000000001, support: 0.02, care: 0.018000000000000002 },
      perCapita: { medical: 29500,  support: 9000,  care: 9200 },
      household: { medical: 29000,  support: 9000,  care: 7200 },
    },
  },
  {
    cityCode: "01455", citySlug: "pippu", cityName: "比布町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.075, support: 0.031, care: 0.022000000000000002 },
      perCapita: { medical: 24000,  support: 9000,  care: 10000 },
      household: { medical: 25000,  support: 10000,  care: 7000 },
    },
  },
  {
    cityCode: "01456", citySlug: "aibetsu", cityName: "愛別町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0652, support: 0.025699999999999997, care: 0.0196 },
      perCapita: { medical: 21600,  support: 9000,  care: 8900 },
      household: { medical: 21500,  support: 8900,  care: 7000 },
    },
  },
  {
    cityCode: "11383", citySlug: "kamikawa", cityName: "上川町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0736, support: 0.025, care: 0.0191 },
      perCapita: { medical: 19500,  support: 8700,  care: 8700 },
      household: { medical: 22300,  support: 8600,  care: 6800 },
    },
  },
  {
    cityCode: "01460", citySlug: "kamifurano", cityName: "上富良野町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.07400000000000001, support: 0.026000000000000002, care: 0.016 },
      perCapita: { medical: 29000,  support: 9300,  care: 9200 },
      household: { medical: 25000,  support: 9000,  care: 6000 },
    },
  },
  {
    cityCode: "01461", citySlug: "nakafurano", cityName: "中富良野町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08199999999999999, support: 0.027000000000000003, care: 0.018000000000000002 },
      perCapita: { medical: 26000,  support: 8300,  care: 9400 },
      household: { medical: 26200,  support: 9000,  care: 6900 },
    },
  },
  {
    cityCode: "01462", citySlug: "minamifurano", cityName: "南富良野町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.26, support: 0.06, care: 0.06 },
    rates: {
      rate:      { medical: 0.069, support: 0.019, care: 0.011000000000000001 },
      perCapita: { medical: 20000,  support: 5600,  care: 6400 },
      household: { medical: 24000,  support: 7000,  care: 4400 },
    },
  },
  {
    cityCode: "01463", citySlug: "shimukappu", cityName: "占冠村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.069, support: 0.031, care: 0.021 },
      perCapita: { medical: 22400,  support: 10000,  care: 9800 },
      household: { medical: 22800,  support: 10400,  care: 7800 },
    },
  },
  {
    cityCode: "01464", citySlug: "wassamu", cityName: "和寒町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.07, support: 0.025, care: 0.02 },
      perCapita: { medical: 25000,  support: 8000,  care: 9000 },
      household: { medical: 26000,  support: 10000,  care: 7000 },
    },
  },
  {
    cityCode: "01465", citySlug: "kembuchi", cityName: "剣淵町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.051, support: 0.019, care: 0.013999999999999999 },
      perCapita: { medical: 29800,  support: 10400,  care: 13100 },
      household: { medical: 31500,  support: 11200,  care: 10200 },
    },
  },
  {
    cityCode: "01468", citySlug: "shimokawa", cityName: "下川町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.6, support: 0.25, care: 0.062 },
    rates: {
      rate:      { medical: 0.069, support: 0.028999999999999998, care: 0.0064 },
      perCapita: { medical: 24700,  support: 4300,  care: 5400 },
      household: { medical: 25500,  support: 4500,  care: 4800 },
    },
  },
  {
    cityCode: "01469", citySlug: "bifuka", cityName: "美深町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.062, support: 0.023, care: 0.0165 },
      perCapita: { medical: 23800,  support: 7500,  care: 9000 },
      household: { medical: 23200,  support: 6800,  care: 6500 },
    },
  },
  {
    cityCode: "01470", citySlug: "otoineppu", cityName: "音威子府村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.5, support: 0.1, care: 0.09 },
    rates: {
      rate:      { medical: 0.045, support: 0.015, care: 0.009000000000000001 },
      perCapita: { medical: 19200,  support: 6000,  care: 6000 },
      household: { medical: 18000,  support: 4800,  care: 4800 },
    },
  },
  {
    cityCode: "20386", citySlug: "nakagawa", cityName: "中川町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.053399999999999996, support: 0.013999999999999999, care: 0.0106 },
      perCapita: { medical: 19500,  support: 4900,  care: 6600 },
      household: { medical: 24200,  support: 6000,  care: 4700 },
    },
  },
  {
    cityCode: "01481", citySlug: "mashike", cityName: "増毛町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.083, support: 0.0215, care: 0.011000000000000001 },
      perCapita: { medical: 24000,  support: 8000,  care: 7000 },
      household: { medical: 18000,  support: 6000,  care: 6000 },
    },
  },
  {
    cityCode: "01482", citySlug: "obira", cityName: "小平町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.17, support: 0.055, care: 0.055 },
    rates: {
      rate:      { medical: 0.062, support: 0.018500000000000003, care: 0.014499999999999999 },
      perCapita: { medical: 29000,  support: 9800,  care: 12600 },
      household: { medical: 28400,  support: 9600,  care: 9000 },
    },
  },
  {
    cityCode: "01483", citySlug: "tomamae", cityName: "苫前町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.066, support: 0.02, care: 0.015 },
      perCapita: { medical: 31000,  support: 9000,  care: 12000 },
      household: { medical: 26000,  support: 8000,  care: 6000 },
    },
  },
  {
    cityCode: "01484", citySlug: "haboro", cityName: "羽幌町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.125, support: 0.03, care: 0.025 },
    rates: {
      rate:      { medical: 0.066, support: 0.024399999999999998, care: 0.021 },
      perCapita: { medical: 22000,  support: 8000,  care: 8000 },
      household: { medical: 25000,  support: 8000,  care: 6500 },
    },
  },
  {
    cityCode: "01485", citySlug: "shosanbetsu", cityName: "初山別村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.3, support: 0.095, care: 0.075 },
    rates: {
      rate:      { medical: 0.068, support: 0.013999999999999999, care: 0.006 },
      perCapita: { medical: 26000,  support: 6600,  care: 6500 },
      household: { medical: 38000,  support: 8400,  care: 3900 },
    },
  },
  {
    cityCode: "01486", citySlug: "embetsu", cityName: "遠別町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.4, support: 0.13, care: 0.12 },
    rates: {
      rate:      { medical: 0.087, support: 0.032, care: 0.021 },
      perCapita: { medical: 35400,  support: 12600,  care: 13900 },
      household: { medical: 36900,  support: 14000,  care: 11400 },
    },
  },
  {
    cityCode: "01487", citySlug: "teshio", cityName: "天塩町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.079, support: 0.025, care: 0.018000000000000002 },
      perCapita: { medical: 29500,  support: 9400,  care: 9200 },
      household: { medical: 20400,  support: 6500,  care: 4700 },
    },
  },
  {
    cityCode: "01520", citySlug: "horonobe", cityName: "幌延町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.055, support: 0.026000000000000002, care: 0.016 },
      perCapita: { medical: 31800,  support: 10800,  care: 12000 },
      household: { medical: 26400,  support: 9000,  care: 9000 },
    },
  },
  {
    cityCode: "01511", citySlug: "sarobetsu", cityName: "猿払村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.15, support: 0.03, care: 0.03 },
    rates: {
      rate:      { medical: 0.042, support: 0.008, care: 0.0034999999999999996 },
      perCapita: { medical: 22000,  support: 5000,  care: 5000 },
      household: { medical: 24000,  support: 6000,  care: 6000 },
    },
  },
  {
    cityCode: "01512", citySlug: "hamatonbetsu", cityName: "浜頓別町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.068, support: 0.026000000000000002, care: 0.02 },
      perCapita: { medical: 30000,  support: 9000,  care: 9000 },
      household: { medical: 32000,  support: 9000,  care: 9000 },
    },
  },
  {
    cityCode: "01513", citySlug: "nakatonbetsu", cityName: "中頓別町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.071, support: 0.023, care: 0.01 },
      perCapita: { medical: 20000,  support: 7000,  care: 5500 },
      household: { medical: 25000,  support: 8000,  care: 5000 },
    },
  },
  {
    cityCode: "01514", citySlug: "esashi-hokkaido", cityName: "枝幸町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.083, support: 0.026000000000000002, care: 0.019 },
      perCapita: { medical: 27100,  support: 8500,  care: 8000 },
      household: { medical: 29500,  support: 7500,  care: 8000 },
    },
  },
  {
    cityCode: "01516", citySlug: "toyotomi", cityName: "豊富町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0758, support: 0.0288, care: 0.0241 },
      perCapita: { medical: 33000,  support: 10000,  care: 14200 },
      household: { medical: 32000,  support: 9500,  care: 10000 },
    },
  },
  {
    cityCode: "01517", citySlug: "rebun", cityName: "礼文町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.062, support: 0.019, care: 0.013999999999999999 },
      perCapita: { medical: 35000,  support: 13800,  care: 12300 },
      household: { medical: 29000,  support: 9400,  care: 6200 },
    },
  },
  {
    cityCode: "01518", citySlug: "rishiri", cityName: "利尻町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.075, support: 0.022000000000000002, care: 0.017 },
      perCapita: { medical: 29000,  support: 8000,  care: 7000 },
      household: { medical: 30000,  support: 7000,  care: 6000 },
    },
  },
  {
    cityCode: "01519", citySlug: "rishirifuji", cityName: "利尻富士町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.065, support: 0.023, care: 0.017 },
      perCapita: { medical: 26000,  support: 9000,  care: 8000 },
      household: { medical: 24000,  support: 8500,  care: 7000 },
    },
  },
  {
    cityCode: "01564", citySlug: "ozora", cityName: "大空町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0751, support: 0.024900000000000002, care: 0.0233 },
      perCapita: { medical: 27800,  support: 9000,  care: 12700 },
      household: { medical: 28700,  support: 9300,  care: 9700 },
    },
  },
  {
    cityCode: "01543", citySlug: "bihoro", cityName: "美幌町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.084, support: 0.027000000000000003, care: 0.018000000000000002 },
      perCapita: { medical: 26000,  support: 8000,  care: 8000 },
      household: { medical: 27600,  support: 9200,  care: 7200 },
    },
  },
  {
    cityCode: "01544", citySlug: "tsubetsu", cityName: "津別町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.07400000000000001, support: 0.024, care: 0.021 },
      perCapita: { medical: 29900,  support: 9800,  care: 9800 },
      household: { medical: 24300,  support: 8000,  care: 5900 },
    },
  },
  {
    cityCode: "01545", citySlug: "shari", cityName: "斜里町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0904, support: 0.026699999999999998, care: 0.020499999999999997 },
      perCapita: { medical: 30056,  support: 9360,  care: 9362 },
      household: { medical: 29833,  support: 9291,  care: 7343 },
    },
  },
  {
    cityCode: "01546", citySlug: "kiyosato", cityName: "清里町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.071, support: 0.02, care: 0.013999999999999999 },
      perCapita: { medical: 28000,  support: 9000,  care: 9000 },
      household: { medical: 28000,  support: 9000,  care: 7000 },
    },
  },
  {
    cityCode: "01547", citySlug: "koshimizu", cityName: "小清水町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.07780000000000001, support: 0.024, care: 0.0288 },
      perCapita: { medical: 27400,  support: 9300,  care: 9900 },
      household: { medical: 28800,  support: 9300,  care: 6900 },
    },
  },
  {
    cityCode: "01549", citySlug: "kunneppu", cityName: "訓子府町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.02, support: 0.03, care: 0.01 },
    rates: {
      rate:      { medical: 0.076, support: 0.025, care: 0.02 },
      perCapita: { medical: 29000,  support: 7000,  care: 9000 },
      household: { medical: 27000,  support: 6000,  care: 7000 },
    },
  },
  {
    cityCode: "01550", citySlug: "oketo", cityName: "置戸町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.05, support: 0.02, care: 0.005 },
    rates: {
      rate:      { medical: 0.07200000000000001, support: 0.023, care: 0.017 },
      perCapita: { medical: 27700,  support: 8600,  care: 11400 },
      household: { medical: 27100,  support: 8900,  care: 8400 },
    },
  },
  {
    cityCode: "01552", citySlug: "saroma", cityName: "佐呂間町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.019, support: 0.007, care: 0.004 },
    rates: {
      rate:      { medical: 0.07, support: 0.021, care: 0.013999999999999999 },
      perCapita: { medical: 30000,  support: 9000,  care: 9000 },
      household: { medical: 28000,  support: 7500,  care: 5500 },
    },
  },
  {
    cityCode: "01555", citySlug: "engaru", cityName: "遠軽町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0621, support: 0.0232, care: 0.0169 },
      perCapita: { medical: 27600,  support: 10200,  care: 11200 },
      household: { medical: 25000,  support: 8500,  care: 6600 },
    },
  },
  {
    cityCode: "01559", citySlug: "yubetsu", cityName: "湧別町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0687, support: 0.0182, care: 0.0139 },
      perCapita: { medical: 30000,  support: 8500,  care: 9000 },
      household: { medical: 30000,  support: 8000,  care: 6500 },
    },
  },
  {
    cityCode: "01560", citySlug: "takinoue", cityName: "滝上町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08, support: 0.027000000000000003, care: 0.02 },
      perCapita: { medical: 26000,  support: 9200,  care: 9200 },
      household: { medical: 26000,  support: 9300,  care: 7300 },
    },
  },
  {
    cityCode: "01561", citySlug: "okoppe", cityName: "興部町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.0666, support: 0.0175, care: 0.009 },
    rates: {
      rate:      { medical: 0.0837, support: 0.0253, care: 0.018000000000000002 },
      perCapita: { medical: 30300,  support: 9200,  care: 8700 },
      household: { medical: 35000,  support: 9300,  care: 6900 },
    },
  },
  {
    cityCode: "01562", citySlug: "nishiokoppe", cityName: "西興部村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.055, support: 0.02, care: 0.015 },
      perCapita: { medical: 25000,  support: 9000,  care: 10000 },
      household: { medical: 25000,  support: 8000,  care: 11000 },
    },
  },
  {
    cityCode: "01563", citySlug: "omu", cityName: "雄武町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.1, support: 0.03, care: 0 },
    rates: {
      rate:      { medical: 0.06, support: 0.025, care: 0.015 },
      perCapita: { medical: 27000,  support: 9000,  care: 10000 },
      household: { medical: 28000,  support: 9000,  care: 8000 },
    },
  },
  {
    cityCode: "01571", citySlug: "toyoura", cityName: "豊浦町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0956, support: 0.0229, care: 0.0286 },
      perCapita: { medical: 16700,  support: 3600,  care: 6600 },
      household: { medical: 43400,  support: 10700,  care: 12500 },
    },
  },
  {
    cityCode: "01584", citySlug: "toyako", cityName: "洞爺湖町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.117, support: 0.045, care: 0.025 },
    rates: {
      rate:      { medical: 0.087, support: 0.0206, care: 0.0129 },
      perCapita: { medical: 23700,  support: 7400,  care: 5500 },
      household: { medical: 25400,  support: 6500,  care: 5000 },
    },
  },
  {
    cityCode: "01575", citySlug: "sobetsu", cityName: "壮瞥町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.157, support: 0.1, care: 0.08 },
    rates: {
      rate:      { medical: 0.060700000000000004, support: 0.03, care: 0.0172 },
      perCapita: { medical: 18000,  support: 11000,  care: 11000 },
      household: { medical: 31500,  support: 9500,  care: 7000 },
    },
  },
  {
    cityCode: "01578", citySlug: "shiraoi", cityName: "白老町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.087, support: 0.021, care: 0.017 },
      perCapita: { medical: 21000,  support: 4500,  care: 4400 },
      household: { medical: 27000,  support: 9000,  care: 6800 },
    },
  },
  {
    cityCode: "01585", citySlug: "abira", cityName: "安平町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.51, support: 0.054, care: 0.1 },
    rates: {
      rate:      { medical: 0.075, support: 0.036000000000000004, care: 0.019 },
      perCapita: { medical: 28000,  support: 10000,  care: 10000 },
      household: { medical: 32000,  support: 13000,  care: 9500 },
    },
  },
  {
    cityCode: "01581", citySlug: "atsuma", cityName: "厚真町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0874, support: 0.026099999999999998, care: 0.0196 },
      perCapita: { medical: 30514,  support: 9330,  care: 9375 },
      household: { medical: 30287,  support: 9261,  care: 7354 },
    },
  },
  {
    cityCode: "01586", citySlug: "mukawa", cityName: "むかわ町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0852, support: 0.0277, care: 0.0204 },
      perCapita: { medical: 27300,  support: 9300,  care: 9200 },
      household: { medical: 27700,  support: 9400,  care: 7300 },
    },
  },
  {
    cityCode: "01602", citySlug: "biratori", cityName: "平取町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08900000000000001, support: 0.027000000000000003, care: 0.016 },
      perCapita: { medical: 21500,  support: 6500,  care: 9500 },
      household: { medical: 26500,  support: 7500,  care: 9000 },
    },
  },
  {
    cityCode: "11242", citySlug: "hidaka", cityName: "日高町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.073, support: 0.025, care: 0.016 },
      perCapita: { medical: 23000,  support: 7700,  care: 8300 },
      household: { medical: 29000,  support: 8500,  care: 8000 },
    },
  },
  {
    cityCode: "01604", citySlug: "niikappu", cityName: "新冠町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.38, support: 0.12, care: 0.04 },
    rates: {
      rate:      { medical: 0.08, support: 0.023, care: 0.016 },
      perCapita: { medical: 26000,  support: 8500,  care: 7800 },
      household: { medical: 33000,  support: 8000,  care: 6800 },
    },
  },
  {
    cityCode: "01610", citySlug: "shinhidaka", cityName: "新ひだか町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08900000000000001, support: 0.028999999999999998, care: 0.02 },
      perCapita: { medical: 27600,  support: 10400,  care: 9300 },
      household: { medical: 37500,  support: 8900,  care: 9500 },
    },
  },
  {
    cityCode: "01607", citySlug: "urakawa", cityName: "浦河町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08779999999999999, support: 0.0215, care: 0.0139 },
      perCapita: { medical: 33971,  support: 12380,  care: 9000 },
      household: { medical: 32812,  support: 10276,  care: 7860 },
    },
  },
  {
    cityCode: "01608", citySlug: "samani", cityName: "様似町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0855, support: 0.0252, care: 0.0183 },
      perCapita: { medical: 27739,  support: 8348,  care: 8367 },
      household: { medical: 29260,  support: 8805,  care: 6518 },
    },
  },
  {
    cityCode: "01609", citySlug: "erimo", cityName: "えりも町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0843, support: 0.0279, care: 0.020499999999999997 },
      perCapita: { medical: 23800,  support: 7400,  care: 7400 },
      household: { medical: 29800,  support: 12400,  care: 6400 },
    },
  },
  {
    cityCode: "01631", citySlug: "otofuke", cityName: "音更町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.081, support: 0.023, care: 0.013999999999999999 },
      perCapita: { medical: 24500,  support: 6700,  care: 8800 },
      household: { medical: 26000,  support: 6400,  care: 6700 },
    },
  },
  {
    cityCode: "01632", citySlug: "shihoro", cityName: "士幌町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0525, support: 0.023799999999999998, care: 0.0102 },
      perCapita: { medical: 29800,  support: 11100,  care: 12800 },
      household: { medical: 26500,  support: 9700,  care: 8300 },
    },
  },
  {
    cityCode: "01633", citySlug: "kamishihoro", cityName: "上士幌町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.285, support: 0.087, care: 0.07 },
    rates: {
      rate:      { medical: 0.076, support: 0.022000000000000002, care: 0.017 },
      perCapita: { medical: 27000,  support: 7500,  care: 9600 },
      household: { medical: 30200,  support: 7700,  care: 7800 },
    },
  },
  {
    cityCode: "01634", citySlug: "shikaoibetsu", cityName: "鹿追町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.078, support: 0.019, care: 0.018000000000000002 },
      perCapita: { medical: 29000,  support: 9000,  care: 12300 },
      household: { medical: 30000,  support: 12000,  care: 8000 },
    },
  },
  {
    cityCode: "01635", citySlug: "shintoku", cityName: "新得町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0765, support: 0.025, care: 0.0152 },
      perCapita: { medical: 31600,  support: 9300,  care: 8700 },
      household: { medical: 23300,  support: 8000,  care: 4500 },
    },
  },
  {
    cityCode: "01636", citySlug: "shimizu", cityName: "清水町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.075, support: 0.026000000000000002, care: 0.017 },
      perCapita: { medical: 27408,  support: 9340,  care: 9284 },
      household: { medical: 27739,  support: 9452,  care: 7387 },
    },
  },
  {
    cityCode: "01637", citySlug: "memuro", cityName: "芽室町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08710000000000001, support: 0.026699999999999998, care: 0.0204 },
      perCapita: { medical: 28981,  support: 9356,  care: 9337 },
      household: { medical: 28766,  support: 9287,  care: 7324 },
    },
  },
  {
    cityCode: "01638", citySlug: "nakasatsunai", cityName: "中札内村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.053, support: 0.021, care: 0.012 },
      perCapita: { medical: 24000,  support: 9000,  care: 18000 },
      household: { medical: 29000,  support: 11000,  care: 0 },
    },
  },
  {
    cityCode: "01639", citySlug: "sarabetsu", cityName: "更別村",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.051, support: 0.022000000000000002, care: 0.0095 },
      perCapita: { medical: 23600,  support: 6900,  care: 7800 },
      household: { medical: 27000,  support: 7000,  care: 6200 },
    },
  },
  {
    cityCode: "01641", citySlug: "taiki", cityName: "大樹町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.061, support: 0.0236, care: 0.015 },
      perCapita: { medical: 24622,  support: 7595,  care: 8003 },
      household: { medical: 27427,  support: 8534,  care: 6363 },
    },
  },
  {
    cityCode: "01642", citySlug: "hiroo", cityName: "広尾町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0815, support: 0.0271, care: 0.0184 },
      perCapita: { medical: 28500,  support: 8700,  care: 9200 },
      household: { medical: 25400,  support: 7700,  care: 4900 },
    },
  },
  {
    cityCode: "01643", citySlug: "makubetsu", cityName: "幕別町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0698, support: 0.0236, care: 0.0159 },
      perCapita: { medical: 25800,  support: 7700,  care: 9100 },
      household: { medical: 30100,  support: 8300,  care: 7000 },
    },
  },
  {
    cityCode: "20481", citySlug: "ikeda", cityName: "池田町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.078, support: 0.025, care: 0.017 },
      perCapita: { medical: 27000,  support: 9100,  care: 10400 },
      household: { medical: 28400,  support: 11200,  care: 9200 },
    },
  },
  {
    cityCode: "01645", citySlug: "toyokoro", cityName: "豊頃町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.069, support: 0.022000000000000002, care: 0.016 },
      perCapita: { medical: 27000,  support: 7200,  care: 8000 },
      household: { medical: 28500,  support: 8000,  care: 7000 },
    },
  },
  {
    cityCode: "01646", citySlug: "honbetsu", cityName: "本別町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0824, support: 0.026600000000000002, care: 0.0197 },
      perCapita: { medical: 27300,  support: 9300,  care: 9100 },
      household: { medical: 26800,  support: 9400,  care: 7200 },
    },
  },
  {
    cityCode: "01647", citySlug: "ashoro", cityName: "足寄町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0886, support: 0.0311, care: 0.022000000000000002 },
      perCapita: { medical: 27500,  support: 9100,  care: 9000 },
      household: { medical: 27500,  support: 9100,  care: 6500 },
    },
  },
  {
    cityCode: "01648", citySlug: "rikubetsu", cityName: "陸別町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.07200000000000001, support: 0.025, care: 0.017 },
      perCapita: { medical: 23700,  support: 9000,  care: 9600 },
      household: { medical: 24400,  support: 8400,  care: 8400 },
    },
  },
  {
    cityCode: "01649", citySlug: "urahoro", cityName: "浦幌町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.3, support: 0.1, care: 0.04 },
    rates: {
      rate:      { medical: 0.063, support: 0.012, care: 0.01 },
      perCapita: { medical: 14800,  support: 5200,  care: 8500 },
      household: { medical: 42000,  support: 8000,  care: 4500 },
    },
  },
  {
    cityCode: "01661", citySlug: "kushiro-town", cityName: "釧路町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08259999999999999, support: 0.0275, care: 0.0215 },
      perCapita: { medical: 27000,  support: 9000,  care: 9000 },
      household: { medical: 26300,  support: 9000,  care: 7400 },
    },
  },
  {
    cityCode: "01662", citySlug: "akkeshi", cityName: "厚岸町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08869999999999999, support: 0.0263, care: 0.02 },
      perCapita: { medical: 29000,  support: 9000,  care: 9000 },
      household: { medical: 29000,  support: 9000,  care: 7000 },
    },
  },
  {
    cityCode: "01663", citySlug: "hamanaka", cityName: "浜中町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0713, support: 0.0203, care: 0.0183 },
      perCapita: { medical: 29300,  support: 9500,  care: 9600 },
      household: { medical: 30400,  support: 9800,  care: 7500 },
    },
  },
  {
    cityCode: "01664", citySlug: "shibecha", cityName: "標茶町",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.044, support: 0, care: 0 },
    rates: {
      rate:      { medical: 0.0707, support: 0.0245, care: 0.022000000000000002 },
      perCapita: { medical: 26500,  support: 9500,  care: 10000 },
      household: { medical: 21000,  support: 6500,  care: 7000 },
    },
  },
  {
    cityCode: "01665", citySlug: "teshikaga", cityName: "弟子屈町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08439999999999999, support: 0.026000000000000002, care: 0.019799999999999998 },
      perCapita: { medical: 28000,  support: 9100,  care: 9000 },
      household: { medical: 27800,  support: 9000,  care: 7000 },
    },
  },
  {
    cityCode: "01667", citySlug: "tsurui", cityName: "鶴居村",
    note: "4方式（所得割+資産割+均等割+平等割）",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.2, support: 0, care: 0 },
    rates: {
      rate:      { medical: 0.071, support: 0.027200000000000002, care: 0.024900000000000002 },
      perCapita: { medical: 25000,  support: 7500,  care: 8700 },
      household: { medical: 27000,  support: 16000,  care: 11000 },
    },
  },
  {
    cityCode: "01668", citySlug: "shiranuka", cityName: "白糠町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.09230000000000001, support: 0.0273, care: 0.019799999999999998 },
      perCapita: { medical: 24600,  support: 8200,  care: 9200 },
      household: { medical: 19600,  support: 7100,  care: 5400 },
    },
  },
  {
    cityCode: "01691", citySlug: "betsukai", cityName: "別海町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.084, support: 0.0275, care: 0.0202 },
      perCapita: { medical: 28000,  support: 9000,  care: 9000 },
      household: { medical: 28000,  support: 9000,  care: 7000 },
    },
  },
  {
    cityCode: "01692", citySlug: "nakashibetsu", cityName: "中標津町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08199999999999999, support: 0.026000000000000002, care: 0.019 },
      perCapita: { medical: 26400,  support: 8500,  care: 8500 },
      household: { medical: 28000,  support: 9000,  care: 6600 },
    },
  },
  {
    cityCode: "01693", citySlug: "shibetsu-hokkaido", cityName: "標津町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.069, support: 0.026000000000000002, care: 0.023 },
      perCapita: { medical: 25700,  support: 8800,  care: 8800 },
      household: { medical: 26500,  support: 9000,  care: 6800 },
    },
  },
  {
    cityCode: "01694", citySlug: "rausu", cityName: "羅臼町",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.08310000000000001, support: 0.0269, care: 0.020499999999999997 },
      perCapita: { medical: 27600,  support: 9400,  care: 9300 },
      household: { medical: 27400,  support: 9300,  care: 7300 },
    },
  },
];
