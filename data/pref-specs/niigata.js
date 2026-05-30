export const PREF_NAME = "新潟県";

// 新潟県 令和7年度 国民健康保険料（税）率
// 出典: 各市町村公式サイト（実際値）、新潟県標準保険料率（標準値）
// 標準保険料率PDF: https://www.pref.niigata.lg.jp/uploaded/attachment/452318.pdf
//
// ・市町村ごとに独自料率を設定（統一料率なし）
// ・資産割あり（4方式）: 津南町（医療分26.98%）・粟島浦村（医療分31.42%）
// ・介護分の平等割: ほぼ全市町村でなし（2方式的）
// ・後期分の平等割: 一部市町村のみ設定
// ・標準料率使用市町村: 新発田市・燕市・十日町市・刈羽村・関川村・出雲崎町・弥彦村（note付き）

export const MUNICIPALITIES = [
  {
    cityCode: "15100", citySlug: "niigata", cityName: "新潟市",
    note: "政令市。介護分は平等割なし（所得割+均等割の2方式）。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0760, support: 0.0310, care: 0.0250 },
      perCapita: { medical: 17700,  support: 7200,   care: 14100 },
      household: { medical: 22200,  support: 9000,   care: 0 },
    },
  },
  {
    cityCode: "15202", citySlug: "nagaoka", cityName: "長岡市",
    note: "介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0536, support: 0.0234, care: 0.0208 },
      perCapita: { medical: 22058,  support: 9509,   care: 14441 },
      household: { medical: 14309,  support: 6169,   care: 0 },
    },
  },
  {
    cityCode: "15204", citySlug: "sanjo", cityName: "三条市",
    note: "介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0642, support: 0.0285, care: 0.0193 },
      perCapita: { medical: 22500,  support: 9500,   care: 13000 },
      household: { medical: 18300,  support: 7800,   care: 0 },
    },
  },
  {
    cityCode: "15205", citySlug: "kashiwazaki", cityName: "柏崎市",
    note: "新潟県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0586, support: 0.0291, care: 0.0246 },
      perCapita: { medical: 25125,  support: 17565,  care: 17932 },
      household: { medical: 16518,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15206", citySlug: "shibata", cityName: "新発田市",
    note: "新潟県R7標準保険料率を使用。実際値は要確認（公式サイト404）。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0731, support: 0.0291, care: 0.0248 },
      perCapita: { medical: 31347,  support: 17520,  care: 18048 },
      household: { medical: 20609,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15208", citySlug: "ojiya", cityName: "小千谷市",
    note: "新潟県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0665, support: 0.0296, care: 0.0252 },
      perCapita: { medical: 28492,  support: 17854,  care: 18333 },
      household: { medical: 18732,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15209", citySlug: "kamo", cityName: "加茂市",
    note: "介護分・後期分は平等割なし。取得値は令和8年度料率の可能性あり。要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0740, support: 0.0210, care: 0.0245 },
      perCapita: { medical: 22000,  support: 12000,  care: 13000 },
      household: { medical: 16000,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15210", citySlug: "tokamachi", cityName: "十日町市",
    note: "新潟県R7標準保険料率を使用（R7は据え置き・R8に改定済）。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0605, support: 0.0290, care: 0.0253 },
      perCapita: { medical: 25928,  support: 17493,  care: 18384 },
      household: { medical: 17047,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15211", citySlug: "mitsuke", cityName: "見附市",
    note: "介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0710, support: 0.0300, care: 0.0270 },
      perCapita: { medical: 22200,  support: 9100,   care: 14700 },
      household: { medical: 16300,  support: 6600,   care: 0 },
    },
  },
  {
    cityCode: "15212", citySlug: "murakami", cityName: "村上市",
    note: "後期分・介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0745, support: 0.0280, care: 0.0260 },
      perCapita: { medical: 23000,  support: 12300,  care: 14600 },
      household: { medical: 16400,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15213", citySlug: "tsubame", cityName: "燕市",
    note: "新潟県R7標準保険料率を使用（公式サイトR8に更新済）。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0709, support: 0.0295, care: 0.0249 },
      perCapita: { medical: 30409,  support: 17790,  care: 18111 },
      household: { medical: 19992,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15216", citySlug: "itoigawa", cityName: "糸魚川市",
    note: "後期分・介護分は平等割なし。標準料率は9.78%と高いが実際は5.65%で設定。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0565, support: 0.0230, care: 0.0185 },
      perCapita: { medical: 19200,  support: 7600,   care: 11800 },
      household: { medical: 15400,  support: 6100,   care: 0 },
    },
  },
  {
    cityCode: "15217", citySlug: "myoko", cityName: "妙高市",
    note: "介護分は平等割なし。医療分所得割9.49%は県内最高水準。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0949, support: 0.0420, care: 0.0289 },
      perCapita: { medical: 15600,  support: 6900,   care: 10800 },
      household: { medical: 19500,  support: 8600,   care: 0 },
    },
  },
  {
    cityCode: "15218", citySlug: "gosen", cityName: "五泉市",
    note: "後期分・介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0839, support: 0.0283, care: 0.0256 },
      perCapita: { medical: 20800,  support: 11800,  care: 13700 },
      household: { medical: 27100,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15222", citySlug: "joetsu", cityName: "上越市",
    note: "後期分・介護分は平等割なし。医療分平等割は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0750, support: 0.0233, care: 0.0233 },
      perCapita: { medical: 19400,  support: 13800,  care: 13800 },
      household: { medical: 19338,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15223", citySlug: "agano", cityName: "阿賀野市",
    note: "後期分・介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0700, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 25000,  support: 7000,   care: 15000 },
      household: { medical: 24000,  support: 9000,   care: 0 },
    },
  },
  {
    cityCode: "15224", citySlug: "sado", cityName: "佐渡市",
    note: "後期分・介護分は平等割なし。条例R7.9.29施行のため年度途中変更あり。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0661, support: 0.0298, care: 0.0267 },
      perCapita: { medical: 18200,  support: 12600,  care: 12500 },
      household: { medical: 13800,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15225", citySlug: "uonuma", cityName: "魚沼市",
    note: "後期分・介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0635, support: 0.0283, care: 0.0254 },
      perCapita: { medical: 25000,  support: 16000,  care: 18000 },
      household: { medical: 17000,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15226", citySlug: "minamiuonuma", cityName: "南魚沼市",
    note: "後期分・介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0750, support: 0.0300, care: 0.0270 },
      perCapita: { medical: 29000,  support: 18500,  care: 19000 },
      household: { medical: 21000,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15227", citySlug: "tainai", cityName: "胎内市",
    note: "後期分・介護分は平等割なし。公式サイトのデータがR6水準の可能性あり。要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0770, support: 0.0286, care: 0.0209 },
      perCapita: { medical: 25900,  support: 9500,   care: 15400 },
      household: { medical: 18500,  support: 6800,   care: 0 },
    },
  },
  {
    cityCode: "15307", citySlug: "seiro", cityName: "聖籠町",
    note: "介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0840, support: 0.0240, care: 0.0180 },
      perCapita: { medical: 27000,  support: 9000,   care: 14000 },
      household: { medical: 21000,  support: 7000,   care: 0 },
    },
  },
  {
    cityCode: "15342", citySlug: "yahiko", cityName: "弥彦村",
    note: "新潟県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0646, support: 0.0291, care: 0.0252 },
      perCapita: { medical: 27694,  support: 17530,  care: 18356 },
      household: { medical: 18207,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15361", citySlug: "tagami", cityName: "田上町",
    note: "後期分・介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0620, support: 0.0270, care: 0.0256 },
      perCapita: { medical: 19000,  support: 11800,  care: 13500 },
      household: { medical: 13500,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15405", citySlug: "izumozaki", cityName: "出雲崎町",
    note: "新潟県R7標準保険料率を使用（公式サイトR8に更新済）。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0679, support: 0.0300, care: 0.0256 },
      perCapita: { medical: 29102,  support: 18109,  care: 18653 },
      household: { medical: 19133,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15461", citySlug: "yuzawa", cityName: "湯沢町",
    note: "後期分・介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0540, support: 0.0255, care: 0.0208 },
      perCapita: { medical: 22380,  support: 15360,  care: 15960 },
      household: { medical: 15180,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15482", citySlug: "tsunan", cityName: "津南町",
    note: "4方式（所得割+資産割+均等割+平等割）。医療分のみ資産割。後期分・介護分は平等割なし。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.2698, support: 0, care: 0 },
    rates: {
      rate:      { medical: 0.0460, support: 0.0237, care: 0.0168 },
      perCapita: { medical: 25900,  support: 14600,  care: 14900 },
      household: { medical: 19400,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15504", citySlug: "kariwa", cityName: "刈羽村",
    note: "新潟県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0699, support: 0.0295, care: 0.0256 },
      perCapita: { medical: 29981,  support: 17790,  care: 18603 },
      household: { medical: 19711,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15581", citySlug: "sekikawa", cityName: "関川村",
    note: "新潟県R7標準保険料率を使用。実際値は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0783, support: 0.0293, care: 0.0253 },
      perCapita: { medical: 33583,  support: 17634,  care: 18421 },
      household: { medical: 22079,  support: 0,      care: 0 },
    },
  },
  {
    cityCode: "15586", citySlug: "awashimaura", cityName: "粟島浦村",
    note: "4方式（所得割+資産割+均等割+平等割）。医療分資産割31.42%。後期分の資産割額は要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    assetLevy: { medical: 0.3142, support: 0, care: 0 },
    rates: {
      rate:      { medical: 0.0722, support: 0.0276, care: 0.0177 },
      perCapita: { medical: 25900,  support: 7700,   care: 10400 },
      household: { medical: 20900,  support: 6200,   care: 0 },
    },
  },
  {
    cityCode: "15385", citySlug: "aga", cityName: "阿賀町",
    note: "後期分・介護分は平等割なし。条例令和6年施行版。要確認。",
    caps: { medical: 660000, support: 260000, care: 170000 },
    rates: {
      rate:      { medical: 0.0860, support: 0.0240, care: 0.0180 },
      perCapita: { medical: 20000,  support: 6000,   care: 11000 },
      household: { medical: 29000,  support: 7000,   care: 0 },
    },
  },
];
