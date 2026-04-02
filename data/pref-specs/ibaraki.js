/**
 * 茨城県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 茨城県「令和7年度 国民健康保険料（税）の概要」
 *   https://www.pref.ibaraki.jp/hokenfukushi/koso/kokumin/koso/guide/documents/kokuhoryou07.pdf
 *
 * 使用: node scripts/generate-pref-kokuho.js ibaraki
 *
 * 特記事項:
 *   - 全44市町村が2方式（所得割+均等割）に統一（令和4年度以降）
 *   - 平等割・資産割は全市町村0
 *   - 賦課限度額: 全市町村共通 医療66万・後期26万・介護17万
 */

export const PREF_NAME = "茨城県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 茨城県 全44市町村（令和7年度）
// 全市町村2方式（所得割+均等割）、平等割なし、資産割なし
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市 ────────────────────────────────────────────────────────

  {
    cityCode: "08201", citySlug: "mito", cityName: "水戸市",
    rates: {
      rate:      { medical: 0.0784, support: 0.0344, care: 0.0231 },
      perCapita: { medical: 30500,  support: 12600,  care: 15200  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08202", citySlug: "hitachi", cityName: "日立市",
    rates: {
      rate:      { medical: 0.0747, support: 0.0336, care: 0.0260 },
      perCapita: { medical: 28600,  support: 12200,  care: 12300  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08203", citySlug: "tsuchiura", cityName: "土浦市",
    rates: {
      rate:      { medical: 0.0711, support: 0.0290, care: 0.0238 },
      perCapita: { medical: 37000,  support: 15000,  care: 18000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08204", citySlug: "kogashi", cityName: "古河市",
    rates: {
      rate:      { medical: 0.0672, support: 0.0285, care: 0.0230 },
      perCapita: { medical: 35800,  support: 15700,  care: 15700  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08205", citySlug: "ishioka", cityName: "石岡市",
    rates: {
      rate:      { medical: 0.0630, support: 0.0290, care: 0.0210 },
      perCapita: { medical: 30000,  support: 14000,  care: 13000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08207", citySlug: "yuki", cityName: "結城市",
    rates: {
      rate:      { medical: 0.0600, support: 0.0270, care: 0.0220 },
      perCapita: { medical: 28000,  support: 16000,  care: 17000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08208", citySlug: "ryugasaki", cityName: "龍ケ崎市",
    rates: {
      rate:      { medical: 0.0630, support: 0.0300, care: 0.0250 },
      perCapita: { medical: 31500,  support: 14100,  care: 14100  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08210", citySlug: "shimotsuma", cityName: "下妻市",
    rates: {
      rate:      { medical: 0.0770, support: 0.0330, care: 0.0220 },
      perCapita: { medical: 46000,  support: 14000,  care: 15000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08211", citySlug: "joso", cityName: "常総市",
    rates: {
      rate:      { medical: 0.0747, support: 0.0339, care: 0.0285 },
      perCapita: { medical: 42200,  support: 19400,  care: 20400  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08212", citySlug: "hitachiota", cityName: "常陸太田市",
    rates: {
      rate:      { medical: 0.0690, support: 0.0270, care: 0.0210 },
      perCapita: { medical: 34800,  support: 13800,  care: 15600  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08214", citySlug: "takahagi", cityName: "高萩市",
    rates: {
      rate:      { medical: 0.0689, support: 0.0281, care: 0.0227 },
      perCapita: { medical: 32000,  support: 12700,  care: 12300  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08215", citySlug: "kitaibaraki", cityName: "北茨城市",
    rates: {
      rate:      { medical: 0.0690, support: 0.0290, care: 0.0250 },
      perCapita: { medical: 27700,  support: 11300,  care: 14500  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08216", citySlug: "kasama", cityName: "笠間市",
    rates: {
      rate:      { medical: 0.0640, support: 0.0340, care: 0.0300 },
      perCapita: { medical: 27600,  support: 14300,  care: 15400  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08217", citySlug: "toride", cityName: "取手市",
    rates: {
      rate:      { medical: 0.0750, support: 0.0120, care: 0.0150 },
      perCapita: { medical: 21000,  support: 10000,  care: 8000   },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08219", citySlug: "ushiku", cityName: "牛久市",
    rates: {
      rate:      { medical: 0.0539, support: 0.0295, care: 0.0270 },
      perCapita: { medical: 28800,  support: 14400,  care: 15600  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08220", citySlug: "tsukuba", cityName: "つくば市",
    rates: {
      rate:      { medical: 0.0770, support: 0.0315, care: 0.0250 },
      perCapita: { medical: 38500,  support: 15500,  care: 15500  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08221", citySlug: "hitachinaka", cityName: "ひたちなか市",
    rates: {
      rate:      { medical: 0.0716, support: 0.0250, care: 0.0211 },
      perCapita: { medical: 41700,  support: 14800,  care: 14800  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08222", citySlug: "kashima", cityName: "鹿嶋市",
    rates: {
      rate:      { medical: 0.0530, support: 0.0280, care: 0.0190 },
      perCapita: { medical: 31000,  support: 17000,  care: 15000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08223", citySlug: "itako", cityName: "潮来市",
    rates: {
      rate:      { medical: 0.0630, support: 0.0300, care: 0.0210 },
      perCapita: { medical: 35000,  support: 17000,  care: 16000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08224", citySlug: "moriya", cityName: "守谷市",
    rates: {
      rate:      { medical: 0.0600, support: 0.0260, care: 0.0220 },
      perCapita: { medical: 27000,  support: 12000,  care: 18000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08225", citySlug: "hitachiomiya", cityName: "常陸大宮市",
    rates: {
      rate:      { medical: 0.0607, support: 0.0277, care: 0.0177 },
      perCapita: { medical: 32800,  support: 14800,  care: 12000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08226", citySlug: "naka", cityName: "那珂市",
    rates: {
      rate:      { medical: 0.0680, support: 0.0220, care: 0.0160 },
      perCapita: { medical: 30500,  support: 15300,  care: 16300  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08227", citySlug: "chikusei", cityName: "筑西市",
    rates: {
      rate:      { medical: 0.0780, support: 0.0210, care: 0.0180 },
      perCapita: { medical: 32000,  support: 13000,  care: 12500  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08228", citySlug: "bando", cityName: "坂東市",
    rates: {
      rate:      { medical: 0.0650, support: 0.0270, care: 0.0250 },
      perCapita: { medical: 35000,  support: 16000,  care: 16000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08229", citySlug: "inashiki", cityName: "稲敷市",
    rates: {
      rate:      { medical: 0.0600, support: 0.0320, care: 0.0240 },
      perCapita: { medical: 36000,  support: 18000,  care: 19000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08230", citySlug: "kasumigaura", cityName: "かすみがうら市",
    rates: {
      rate:      { medical: 0.0720, support: 0.0340, care: 0.0280 },
      perCapita: { medical: 32000,  support: 14000,  care: 16000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08231", citySlug: "sakuragawa", cityName: "桜川市",
    rates: {
      rate:      { medical: 0.0720, support: 0.0290, care: 0.0260 },
      perCapita: { medical: 33800,  support: 16400,  care: 18500  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08232", citySlug: "kamisu", cityName: "神栖市",
    rates: {
      rate:      { medical: 0.0680, support: 0.0270, care: 0.0240 },
      perCapita: { medical: 39000,  support: 17000,  care: 18000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08233", citySlug: "namegata", cityName: "行方市",
    rates: {
      rate:      { medical: 0.0760, support: 0.0320, care: 0.0250 },
      perCapita: { medical: 38000,  support: 19000,  care: 18000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08234", citySlug: "hokota", cityName: "鉾田市",
    rates: {
      rate:      { medical: 0.0710, support: 0.0330, care: 0.0270 },
      perCapita: { medical: 32000,  support: 18000,  care: 16000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08235", citySlug: "tsukubamirai", cityName: "つくばみらい市",
    rates: {
      rate:      { medical: 0.0590, support: 0.0210, care: 0.0150 },
      perCapita: { medical: 25700,  support: 14300,  care: 14700  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08236", citySlug: "omitama", cityName: "小美玉市",
    rates: {
      rate:      { medical: 0.0680, support: 0.0270, care: 0.0230 },
      perCapita: { medical: 39000,  support: 17000,  care: 17000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },

  // ── 町村 ──────────────────────────────────────────────────────

  {
    cityCode: "08302", citySlug: "ibarakimachi", cityName: "茨城町",
    rates: {
      rate:      { medical: 0.0770, support: 0.0320, care: 0.0270 },
      perCapita: { medical: 43000,  support: 18000,  care: 19000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08304", citySlug: "oarai", cityName: "大洗町",
    rates: {
      rate:      { medical: 0.0580, support: 0.0260, care: 0.0210 },
      perCapita: { medical: 37000,  support: 16000,  care: 17000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08305", citySlug: "shirosato", cityName: "城里町",
    rates: {
      rate:      { medical: 0.0670, support: 0.0280, care: 0.0180 },
      perCapita: { medical: 21000,  support: 8500,   care: 12000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08521", citySlug: "tokaimura", cityName: "東海村",
    rates: {
      rate:      { medical: 0.0680, support: 0.0260, care: 0.0250 },
      perCapita: { medical: 36600,  support: 13900,  care: 15300  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08542", citySlug: "daigo", cityName: "大子町",
    rates: {
      rate:      { medical: 0.0784, support: 0.0241, care: 0.0205 },
      perCapita: { medical: 39500,  support: 12200,  care: 10300  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08564", citySlug: "miho", cityName: "美浦村",
    rates: {
      rate:      { medical: 0.0700, support: 0.0300, care: 0.0260 },
      perCapita: { medical: 36000,  support: 13300,  care: 14600  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08565", citySlug: "ami", cityName: "阿見町",
    rates: {
      rate:      { medical: 0.0620, support: 0.0220, care: 0.0130 },
      perCapita: { medical: 22000,  support: 10000,  care: 12000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08578", citySlug: "kawachi", cityName: "河内町",
    rates: {
      rate:      { medical: 0.0623, support: 0.0232, care: 0.0171 },
      perCapita: { medical: 38500,  support: 14300,  care: 15100  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08581", citySlug: "yachiyomachi", cityName: "八千代町",
    rates: {
      rate:      { medical: 0.0772, support: 0.0304, care: 0.0230 },
      perCapita: { medical: 39400,  support: 17000,  care: 17200  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08583", citySlug: "goka", cityName: "五霞町",
    rates: {
      rate:      { medical: 0.0756, support: 0.0319, care: 0.0260 },
      perCapita: { medical: 43400,  support: 18100,  care: 18900  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08584", citySlug: "sakaimachi", cityName: "境町",
    rates: {
      rate:      { medical: 0.0720, support: 0.0240, care: 0.0180 },
      perCapita: { medical: 35000,  support: 14000,  care: 14000  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
  {
    cityCode: "08586", citySlug: "tone", cityName: "利根町",
    rates: {
      rate:      { medical: 0.0600, support: 0.0300, care: 0.0200 },
      perCapita: { medical: 39900,  support: 16800,  care: 20800  },
      household: { medical: 0,      support: 0,      care: 0      },
    },
  },
];
