/**
 * 福島県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 福島県「令和7年度 国保事業費納付金等の本算定結果について」
 *   https://www.pref.fukushima.lg.jp/uploaded/attachment/680620.pdf
 *
 * 使用: node scripts/generate-pref-kokuho.js fukushima
 *
 * 特記事項:
 *   - 県の標準保険料率（各市町村の実際値とは異なる場合あり）
 *   - 全59市町村 3方式（所得割+均等割+平等割）
 *   - 資産割なし（標準算定に含まれず）
 *   - 三島町（07374）の介護分は極端に低い値（PDF原本記載値）
 *   - 賦課限度額: 全市町村で全国標準（660/260/170万円）
 *   - slug競合: 福島市→fukushimashi（北海道福島町がfukushimaを使用）
 *             白河市→shirakawashi（岐阜県白川町がshirakawaを使用）
 *             喜多方市→kitakatashi（岐阜県北方町がkitakataを使用）
 *             伊達市→dateshi（北海道伊達市がdateを使用）
 *             三島町→mishimacho（静岡県三島市がmishimaを使用）
 *             昭和村→showamura（群馬県昭和村がshowaを使用）
 *             小野町→onomachi（兵庫県小野市がonoを使用）
 *             富岡町→tomiokacho（群馬県富岡市がtomiokaを使用）
 */

export const PREF_NAME = "福島県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 福島県 全59市町村（令和7年度 市町村標準保険料率）
// 全市町村3方式（所得割+均等割+平等割）、資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（13市）───────────────────────────────────────────────

  {
    cityCode: "07201", citySlug: "fukushimashi", cityName: "福島市",
    rates: {
      rate:      { medical: 0.0681, support: 0.0281, care: 0.0229 },
      perCapita: { medical: 29591,  support: 12101,  care: 11586  },
      household: { medical: 19644,  support: 8033,   care: 5812   },
    },
  },
  {
    cityCode: "07202", citySlug: "aizuwakamatsu", cityName: "会津若松市",
    rates: {
      rate:      { medical: 0.0623, support: 0.0270, care: 0.0222 },
      perCapita: { medical: 27043,  support: 11625,  care: 11253  },
      household: { medical: 17952,  support: 7717,   care: 5645   },
    },
  },
  {
    cityCode: "07203", citySlug: "koriyama", cityName: "郡山市",
    rates: {
      rate:      { medical: 0.0655, support: 0.0271, care: 0.0225 },
      perCapita: { medical: 28427,  support: 11634,  care: 11408  },
      household: { medical: 18871,  support: 7723,   care: 5722   },
    },
  },
  {
    cityCode: "07204", citySlug: "iwaki", cityName: "いわき市",
    rates: {
      rate:      { medical: 0.0668, support: 0.0275, care: 0.0227 },
      perCapita: { medical: 28988,  support: 11841,  care: 11505  },
      household: { medical: 19244,  support: 7861,   care: 5771   },
    },
  },
  {
    cityCode: "07205", citySlug: "shirakawashi", cityName: "白河市",
    rates: {
      rate:      { medical: 0.0663, support: 0.0279, care: 0.0235 },
      perCapita: { medical: 28806,  support: 11990,  care: 11912  },
      household: { medical: 19123,  support: 7960,   care: 5975   },
    },
  },
  {
    cityCode: "07207", citySlug: "sukagawa", cityName: "須賀川市",
    rates: {
      rate:      { medical: 0.0697, support: 0.0279, care: 0.0236 },
      perCapita: { medical: 30250,  support: 11987,  care: 11926  },
      household: { medical: 20082,  support: 7958,   care: 5982   },
    },
  },
  {
    cityCode: "07208", citySlug: "kitakatashi", cityName: "喜多方市",
    rates: {
      rate:      { medical: 0.0686, support: 0.0275, care: 0.0232 },
      perCapita: { medical: 29784,  support: 11812,  care: 11760  },
      household: { medical: 19772,  support: 7841,   care: 5899   },
    },
  },
  {
    cityCode: "07210", citySlug: "soma", cityName: "相馬市",
    rates: {
      rate:      { medical: 0.0704, support: 0.0276, care: 0.0233 },
      perCapita: { medical: 30559,  support: 11870,  care: 11795  },
      household: { medical: 20287,  support: 7880,   care: 5917   },
    },
  },
  {
    cityCode: "07211", citySlug: "nihonmatsu", cityName: "二本松市",
    rates: {
      rate:      { medical: 0.0707, support: 0.0271, care: 0.0220 },
      perCapita: { medical: 30719,  support: 11636,  care: 11117  },
      household: { medical: 20393,  support: 7725,   care: 5576   },
    },
  },
  {
    cityCode: "07212", citySlug: "tamura", cityName: "田村市",
    rates: {
      rate:      { medical: 0.0588, support: 0.0275, care: 0.0221 },
      perCapita: { medical: 25533,  support: 11845,  care: 11190  },
      household: { medical: 16950,  support: 7863,   care: 5613   },
    },
  },
  {
    cityCode: "07213", citySlug: "minamisoma", cityName: "南相馬市",
    rates: {
      rate:      { medical: 0.0630, support: 0.0286, care: 0.0239 },
      perCapita: { medical: 27370,  support: 12288,  care: 12107  },
      household: { medical: 18169,  support: 8157,   care: 6073   },
    },
  },
  {
    cityCode: "07214", citySlug: "dateshi", cityName: "伊達市",
    rates: {
      rate:      { medical: 0.0711, support: 0.0275, care: 0.0228 },
      perCapita: { medical: 30878,  support: 11809,  care: 11538  },
      household: { medical: 20499,  support: 7839,   care: 5787   },
    },
  },
  {
    cityCode: "07215", citySlug: "motomiya", cityName: "本宮市",
    rates: {
      rate:      { medical: 0.0691, support: 0.0272, care: 0.0222 },
      perCapita: { medical: 29999,  support: 11696,  care: 11258  },
      household: { medical: 19915,  support: 7764,   care: 5647   },
    },
  },

  // ── 町村（46町村）───────────────────────────────────────────

  {
    cityCode: "07301", citySlug: "koori", cityName: "桑折町",
    rates: {
      rate:      { medical: 0.0791, support: 0.0274, care: 0.0229 },
      perCapita: { medical: 34343,  support: 11785,  care: 11581  },
      household: { medical: 22799,  support: 7823,   care: 5809   },
    },
  },
  {
    cityCode: "07303", citySlug: "kunimi", cityName: "国見町",
    rates: {
      rate:      { medical: 0.0722, support: 0.0279, care: 0.0234 },
      perCapita: { medical: 31363,  support: 12004,  care: 11827  },
      household: { medical: 20820,  support: 7969,   care: 5933   },
    },
  },
  {
    cityCode: "07307", citySlug: "kawamata", cityName: "川俣町",
    rates: {
      rate:      { medical: 0.0665, support: 0.0269, care: 0.0222 },
      perCapita: { medical: 28871,  support: 11576,  care: 11235  },
      household: { medical: 19166,  support: 7685,   care: 5635   },
    },
  },
  {
    cityCode: "07321", citySlug: "otama", cityName: "大玉村",
    rates: {
      rate:      { medical: 0.0635, support: 0.0269, care: 0.0224 },
      perCapita: { medical: 27590,  support: 11575,  care: 11334  },
      household: { medical: 18316,  support: 7684,   care: 5685   },
    },
  },
  {
    cityCode: "07341", citySlug: "kagamiishi", cityName: "鏡石町",
    rates: {
      rate:      { medical: 0.0625, support: 0.0277, care: 0.0230 },
      perCapita: { medical: 27146,  support: 11896,  care: 11654  },
      household: { medical: 18021,  support: 7897,   care: 5846   },
    },
  },
  {
    cityCode: "07342", citySlug: "tenei", cityName: "天栄村",
    rates: {
      rate:      { medical: 0.0621, support: 0.0270, care: 0.0220 },
      perCapita: { medical: 26980,  support: 11623,  care: 11119  },
      household: { medical: 17911,  support: 7716,   care: 5577   },
    },
  },
  {
    cityCode: "07362", citySlug: "shimogo", cityName: "下郷町",
    rates: {
      rate:      { medical: 0.0697, support: 0.0273, care: 0.0223 },
      perCapita: { medical: 30257,  support: 11732,  care: 11289  },
      household: { medical: 20086,  support: 7789,   care: 5663   },
    },
  },
  {
    cityCode: "07363", citySlug: "hinoemata", cityName: "檜枝岐村",
    rates: {
      rate:      { medical: 0.0536, support: 0.0284, care: 0.0240 },
      perCapita: { medical: 23263,  support: 12231,  care: 12163  },
      household: { medical: 15443,  support: 8119,   care: 6101   },
    },
  },
  {
    cityCode: "07365", citySlug: "tadami", cityName: "只見町",
    rates: {
      rate:      { medical: 0.0672, support: 0.0275, care: 0.0234 },
      perCapita: { medical: 29186,  support: 11824,  care: 11856  },
      household: { medical: 19375,  support: 7849,   care: 5947   },
    },
  },
  {
    cityCode: "07366", citySlug: "kitashiobara", cityName: "北塩原村",
    rates: {
      rate:      { medical: 0.0651, support: 0.0268, care: 0.0224 },
      perCapita: { medical: 28254,  support: 11533,  care: 11319  },
      household: { medical: 18756,  support: 7656,   care: 5678   },
    },
  },
  {
    cityCode: "07368", citySlug: "nishiaizu", cityName: "西会津町",
    rates: {
      rate:      { medical: 0.0622, support: 0.0266, care: 0.0215 },
      perCapita: { medical: 27018,  support: 11437,  care: 10879  },
      household: { medical: 17936,  support: 7592,   care: 5457   },
    },
  },
  {
    cityCode: "07369", citySlug: "bandai", cityName: "磐梯町",
    rates: {
      rate:      { medical: 0.0762, support: 0.0271, care: 0.0224 },
      perCapita: { medical: 33082,  support: 11637,  care: 11345  },
      household: { medical: 21961,  support: 7725,   care: 5691   },
    },
  },
  {
    cityCode: "07370", citySlug: "inawashiro", cityName: "猪苗代町",
    rates: {
      rate:      { medical: 0.0701, support: 0.0271, care: 0.0216 },
      perCapita: { medical: 30453,  support: 11642,  care: 10951  },
      household: { medical: 20216,  support: 7728,   care: 5493   },
    },
  },
  {
    cityCode: "07371", citySlug: "aizubange", cityName: "会津坂下町",
    rates: {
      rate:      { medical: 0.0686, support: 0.0280, care: 0.0235 },
      perCapita: { medical: 29795,  support: 12022,  care: 11893  },
      household: { medical: 19780,  support: 7981,   care: 5965   },
    },
  },
  {
    cityCode: "07372", citySlug: "yugawa", cityName: "湯川村",
    rates: {
      rate:      { medical: 0.0652, support: 0.0273, care: 0.0225 },
      perCapita: { medical: 28325,  support: 11725,  care: 11391  },
      household: { medical: 18803,  support: 7784,   care: 5714   },
    },
  },
  {
    cityCode: "07373", citySlug: "yanaitsu", cityName: "柳津町",
    rates: {
      rate:      { medical: 0.0781, support: 0.0264, care: 0.0221 },
      perCapita: { medical: 33910,  support: 11364,  care: 11176  },
      household: { medical: 22511,  support: 7544,   care: 5606   },
    },
  },
  {
    cityCode: "07374", citySlug: "mishimacho", cityName: "三島町",
    rates: {
      rate:      { medical: 0.0731, support: 0.0210, care: 0.0059 },
      perCapita: { medical: 31755,  support: 9022,   care: 2972   },
      household: { medical: 21081,  support: 5989,   care: 1491   },
    },
  },
  {
    cityCode: "07375", citySlug: "kaneyama", cityName: "金山町",
    rates: {
      rate:      { medical: 0.0594, support: 0.0278, care: 0.0237 },
      perCapita: { medical: 25801,  support: 11962,  care: 11980  },
      household: { medical: 17128,  support: 7941,   care: 6009   },
    },
  },
  {
    cityCode: "07376", citySlug: "showamura", cityName: "昭和村",
    rates: {
      rate:      { medical: 0.0811, support: 0.0279, care: 0.0231 },
      perCapita: { medical: 35235,  support: 11983,  care: 11674  },
      household: { medical: 23391,  support: 7955,   care: 5856   },
    },
  },
  {
    cityCode: "07381", citySlug: "nishigo", cityName: "西郷村",
    rates: {
      rate:      { medical: 0.0649, support: 0.0269, care: 0.0225 },
      perCapita: { medical: 28172,  support: 11570,  care: 11384  },
      household: { medical: 18702,  support: 7681,   care: 5710   },
    },
  },
  {
    cityCode: "07382", citySlug: "izumizaki", cityName: "泉崎村",
    rates: {
      rate:      { medical: 0.0736, support: 0.0268, care: 0.0221 },
      perCapita: { medical: 31974,  support: 11519,  care: 11202  },
      household: { medical: 21226,  support: 7647,   care: 5619   },
    },
  },
  {
    cityCode: "07383", citySlug: "nakajima", cityName: "中島村",
    rates: {
      rate:      { medical: 0.0709, support: 0.0278, care: 0.0232 },
      perCapita: { medical: 30794,  support: 11975,  care: 11751  },
      household: { medical: 20443,  support: 7950,   care: 5894   },
    },
  },
  {
    cityCode: "07384", citySlug: "yabuki", cityName: "矢吹町",
    rates: {
      rate:      { medical: 0.0755, support: 0.0274, care: 0.0233 },
      perCapita: { medical: 32793,  support: 11781,  care: 11810  },
      household: { medical: 21770,  support: 7821,   care: 5924   },
    },
  },
  {
    cityCode: "07401", citySlug: "tanagura", cityName: "棚倉町",
    rates: {
      rate:      { medical: 0.0706, support: 0.0269, care: 0.0229 },
      perCapita: { medical: 30678,  support: 11572,  care: 11574  },
      household: { medical: 20366,  support: 7682,   care: 5806   },
    },
  },
  {
    cityCode: "07402", citySlug: "yamatsuri", cityName: "矢祭町",
    rates: {
      rate:      { medical: 0.0620, support: 0.0265, care: 0.0223 },
      perCapita: { medical: 26908,  support: 11380,  care: 11312  },
      household: { medical: 17863,  support: 7555,   care: 5674   },
    },
  },
  {
    cityCode: "07403", citySlug: "hanawa", cityName: "塙町",
    rates: {
      rate:      { medical: 0.0657, support: 0.0273, care: 0.0226 },
      perCapita: { medical: 28543,  support: 11745,  care: 11454  },
      household: { medical: 18948,  support: 7797,   care: 5745   },
    },
  },
  {
    cityCode: "07404", citySlug: "samegawa", cityName: "鮫川村",
    rates: {
      rate:      { medical: 0.0759, support: 0.0273, care: 0.0227 },
      perCapita: { medical: 32971,  support: 11753,  care: 11513  },
      household: { medical: 21888,  support: 7802,   care: 5775   },
    },
  },
  {
    cityCode: "07421", citySlug: "furudono", cityName: "古殿町",
    rates: {
      rate:      { medical: 0.0747, support: 0.0270, care: 0.0227 },
      perCapita: { medical: 32430,  support: 11597,  care: 11516  },
      household: { medical: 21529,  support: 7698,   care: 5777   },
    },
  },
  {
    cityCode: "07422", citySlug: "ishikawa", cityName: "石川町",
    rates: {
      rate:      { medical: 0.0650, support: 0.0266, care: 0.0212 },
      perCapita: { medical: 28229,  support: 11446,  care: 10738  },
      household: { medical: 18740,  support: 7598,   care: 5386   },
    },
  },
  {
    cityCode: "07423", citySlug: "tamakawa", cityName: "玉川村",
    rates: {
      rate:      { medical: 0.0696, support: 0.0273, care: 0.0227 },
      perCapita: { medical: 30231,  support: 11741,  care: 11513  },
      household: { medical: 20069,  support: 7794,   care: 5775   },
    },
  },
  {
    cityCode: "07424", citySlug: "hirata", cityName: "平田村",
    rates: {
      rate:      { medical: 0.0688, support: 0.0272, care: 0.0218 },
      perCapita: { medical: 29866,  support: 11697,  care: 11044  },
      household: { medical: 19827,  support: 7765,   care: 5540   },
    },
  },
  {
    cityCode: "07425", citySlug: "asakawa", cityName: "浅川町",
    rates: {
      rate:      { medical: 0.0578, support: 0.0272, care: 0.0224 },
      perCapita: { medical: 25109,  support: 11692,  care: 11361  },
      household: { medical: 16669,  support: 7762,   care: 5699   },
    },
  },
  {
    cityCode: "07441", citySlug: "miharu", cityName: "三春町",
    rates: {
      rate:      { medical: 0.0677, support: 0.0280, care: 0.0235 },
      perCapita: { medical: 29394,  support: 12020,  care: 11886  },
      household: { medical: 19513,  support: 7980,   care: 5962   },
    },
  },
  {
    cityCode: "07442", citySlug: "onomachi", cityName: "小野町",
    rates: {
      rate:      { medical: 0.0628, support: 0.0275, care: 0.0227 },
      perCapita: { medical: 27291,  support: 11842,  care: 11510  },
      household: { medical: 18117,  support: 7861,   care: 5773   },
    },
  },
  {
    cityCode: "07461", citySlug: "hirono", cityName: "広野町",
    rates: {
      rate:      { medical: 0.0800, support: 0.0275, care: 0.0225 },
      perCapita: { medical: 34747,  support: 11830,  care: 11417  },
      household: { medical: 23067,  support: 7853,   care: 5727   },
    },
  },
  {
    cityCode: "07462", citySlug: "naraha", cityName: "楢葉町",
    rates: {
      rate:      { medical: 0.0743, support: 0.0269, care: 0.0218 },
      perCapita: { medical: 32262,  support: 11575,  care: 11037  },
      household: { medical: 21417,  support: 7684,   care: 5536   },
    },
  },
  {
    cityCode: "07463", citySlug: "tomiokacho", cityName: "富岡町",
    rates: {
      rate:      { medical: 0.0797, support: 0.0280, care: 0.0232 },
      perCapita: { medical: 34614,  support: 12040,  care: 11746  },
      household: { medical: 22978,  support: 7993,   care: 5892   },
    },
  },
  {
    cityCode: "07464", citySlug: "kawauchi", cityName: "川内村",
    rates: {
      rate:      { medical: 0.0907, support: 0.0267, care: 0.0227 },
      perCapita: { medical: 39398,  support: 11461,  care: 11509  },
      household: { medical: 26154,  support: 7609,   care: 5773   },
    },
  },
  {
    cityCode: "07465", citySlug: "okuma", cityName: "大熊町",
    rates: {
      rate:      { medical: 0.0846, support: 0.0281, care: 0.0233 },
      perCapita: { medical: 36741,  support: 12076,  care: 11786  },
      household: { medical: 24391,  support: 8017,   care: 5912   },
    },
  },
  {
    cityCode: "07466", citySlug: "futaba", cityName: "双葉町",
    rates: {
      rate:      { medical: 0.0862, support: 0.0275, care: 0.0228 },
      perCapita: { medical: 37419,  support: 11832,  care: 11535  },
      household: { medical: 24841,  support: 7855,   care: 5786   },
    },
  },
  {
    cityCode: "07467", citySlug: "namie", cityName: "浪江町",
    rates: {
      rate:      { medical: 0.0512, support: 0.0278, care: 0.0232 },
      perCapita: { medical: 22253,  support: 11946,  care: 11723  },
      household: { medical: 14772,  support: 7930,   care: 5880   },
    },
  },
  {
    cityCode: "07468", citySlug: "katsurao", cityName: "葛尾村",
    rates: {
      rate:      { medical: 0.0530, support: 0.0273, care: 0.0220 },
      perCapita: { medical: 23021,  support: 11747,  care: 11128  },
      household: { medical: 15283,  support: 7798,   care: 5582   },
    },
  },
  {
    cityCode: "07481", citySlug: "shinchi", cityName: "新地町",
    rates: {
      rate:      { medical: 0.0652, support: 0.0272, care: 0.0215 },
      perCapita: { medical: 28296,  support: 11693,  care: 10869  },
      household: { medical: 18784,  support: 7762,   care: 5452   },
    },
  },
  {
    cityCode: "07482", citySlug: "iitate", cityName: "飯舘村",
    rates: {
      rate:      { medical: 0.0527, support: 0.0275, care: 0.0230 },
      perCapita: { medical: 22895,  support: 11829,  care: 11668  },
      household: { medical: 15199,  support: 7853,   care: 5853   },
    },
  },
  {
    cityCode: "07501", citySlug: "aizumisato", cityName: "会津美里町",
    rates: {
      rate:      { medical: 0.0663, support: 0.0272, care: 0.0226 },
      perCapita: { medical: 28811,  support: 11683,  care: 11449  },
      household: { medical: 19126,  support: 7756,   care: 5743   },
    },
  },
  {
    cityCode: "07561", citySlug: "minamiaizu", cityName: "南会津町",
    rates: {
      rate:      { medical: 0.0664, support: 0.0270, care: 0.0229 },
      perCapita: { medical: 28836,  support: 11592,  care: 11571  },
      household: { medical: 19143,  support: 7695,   care: 5804   },
    },
  },
];
