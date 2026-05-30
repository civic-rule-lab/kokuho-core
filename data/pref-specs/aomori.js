/**
 * 青森県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 青森県「令和7年度 国民健康保険料（税）率等一覧」
 *   https://www.pref.aomori.lg.jp/soshiki/kenko/koreihoken/files/R7hokenryou.pdf
 *
 * 使用: node scripts/generate-pref-kokuho.js aomori
 *
 * 特記事項:
 *   - 全40市町村 実際の保険料（税）率を使用
 *   - 資産割なし（全市町村）
 *   - 2方式（所得割+均等割）: 鰺ヶ沢町・中泊町・鶴田町（平等割=0）
 *   - 3方式（所得割+均等割+平等割）: 上記3町以外の37市町村
 *   - 賦課限度額: 全市町村で全国標準（660/260/170万円）
 *   - slug競合: 横浜町→yokohamacho（神奈川県横浜市がyokohamaを使用）
 */

export const PREF_NAME = "青森県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 青森県 全40市町村（令和7年度 実際の保険料（税）率）
// 資産割なし / 鰺ヶ沢町・中泊町・鶴田町のみ2方式（平等割=0）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（10市）───────────────────────────────────────────────

  { cityCode: "02201", citySlug: "aomori",      cityName: "青森市",     caps: CAPS, rates: { rate: { medical: 0.0971, support: 0.0246, care: 0.0274 }, perCapita: { medical: 20040, support:  6360, care:  9260 }, household: { medical: 24720, support: 7680, care: 4540 } } },
  { cityCode: "02202", citySlug: "hirosaki",    cityName: "弘前市",     caps: CAPS, rates: { rate: { medical: 0.0880, support: 0.0320, care: 0.0340 }, perCapita: { medical: 22400, support:  8600, care: 10400 }, household: { medical: 22600, support: 7600, care: 6000 } } },
  { cityCode: "02203", citySlug: "hachinohe",   cityName: "八戸市",     caps: CAPS, rates: { rate: { medical: 0.0800, support: 0.0240, care: 0.0230 }, perCapita: { medical: 23000, support:  7000, care:  8000 }, household: { medical: 25000, support: 8000, care: 9000 } } },
  { cityCode: "02204", citySlug: "kuroishi",    cityName: "黒石市",     caps: CAPS, rates: { rate: { medical: 0.0840, support: 0.0190, care: 0.0180 }, perCapita: { medical: 24500, support:  6700, care:  8700 }, household: { medical: 23000, support: 5800, care: 5100 } } },
  { cityCode: "02205", citySlug: "goshogawara", cityName: "五所川原市", caps: CAPS, rates: { rate: { medical: 0.0727, support: 0.0221, care: 0.0202 }, perCapita: { medical: 25210, support:  7400, care:  9400 }, household: { medical: 21500, support: 6400, care: 5500 } } },
  { cityCode: "02206", citySlug: "towada",      cityName: "十和田市",   caps: CAPS, rates: { rate: { medical: 0.0710, support: 0.0290, care: 0.0250 }, perCapita: { medical: 24600, support: 10100, care: 12100 }, household: { medical: 20500, support: 8400, care: 7800 } } },
  { cityCode: "02207", citySlug: "misawa",      cityName: "三沢市",     caps: CAPS, rates: { rate: { medical: 0.0800, support: 0.0300, care: 0.0230 }, perCapita: { medical: 25000, support:  8000, care: 10000 }, household: { medical: 31000, support: 9500, care: 7000 } } },
  { cityCode: "02208", citySlug: "mutsu",       cityName: "むつ市",     caps: CAPS, rates: { rate: { medical: 0.0801, support: 0.0301, care: 0.0304 }, perCapita: { medical: 21700, support:  8300, care: 13900 }, household: { medical: 34900, support: 13300, care: 7000 } } },
  { cityCode: "02209", citySlug: "tsugaru",     cityName: "つがる市",   caps: CAPS, rates: { rate: { medical: 0.0704, support: 0.0257, care: 0.0235 }, perCapita: { medical: 28800, support: 10800, care: 13200 }, household: { medical: 24000, support: 8400, care: 7200 } } },
  { cityCode: "02210", citySlug: "hirakawa",    cityName: "平川市",     caps: CAPS, rates: { rate: { medical: 0.0780, support: 0.0290, care: 0.0285 }, perCapita: { medical: 19800, support:  7400, care:  9500 }, household: { medical: 21600, support: 8100, care: 7700 } } },

  // ── 町村（30町村）───────────────────────────────────────────

  { cityCode: "02301", citySlug: "hiranai",     cityName: "平内町",     caps: CAPS, rates: { rate: { medical: 0.0900, support: 0.0370, care: 0.0290 }, perCapita: { medical: 25000, support:  7900, care:  8500 }, household: { medical: 27800, support: 8700, care: 6000 } } },
  { cityCode: "02303", citySlug: "imabetsu",    cityName: "今別町",     caps: CAPS, rates: { rate: { medical: 0.0600, support: 0.0600, care: 0.0100 }, perCapita: { medical: 15600, support: 12000, care:  6700 }, household: { medical: 21600, support: 12000, care: 10000 } } },
  { cityCode: "02304", citySlug: "yomogita",    cityName: "蓬田村",     caps: CAPS, rates: { rate: { medical: 0.0900, support: 0.0200, care: 0.0200 }, perCapita: { medical: 25200, support: 12000, care:  9000 }, household: { medical: 24600, support: 8000, care: 6000 } } },
  { cityCode: "02307", citySlug: "sotogahama",  cityName: "外ヶ浜町",   caps: CAPS, rates: { rate: { medical: 0.1020, support: 0.0200, care: 0.0166 }, perCapita: { medical: 27600, support:  5400, care:  6000 }, household: { medical: 36000, support: 7800, care: 8400 } } },
  { cityCode: "02321", citySlug: "ajigasawa",   cityName: "鰺ヶ沢町",   caps: CAPS, rates: { rate: { medical: 0.0860, support: 0.0300, care: 0.0240 }, perCapita: { medical: 25000, support:  8400, care:  9200 }, household: { medical: 0, support: 0, care: 0 } } },
  { cityCode: "02323", citySlug: "fukaura",     cityName: "深浦町",     caps: CAPS, rates: { rate: { medical: 0.0810, support: 0.0220, care: 0.0190 }, perCapita: { medical: 21100, support:  5700, care:  7900 }, household: { medical: 23900, support: 6300, care: 4100 } } },
  { cityCode: "02343", citySlug: "nishimeya",   cityName: "西目屋村",   caps: CAPS, rates: { rate: { medical: 0.0850, support: 0.0280, care: 0.0240 }, perCapita: { medical: 24000, support:  7800, care:  6900 }, household: { medical: 28000, support: 8400, care: 7200 } } },
  { cityCode: "02361", citySlug: "fujisaki",    cityName: "藤崎町",     caps: CAPS, rates: { rate: { medical: 0.0950, support: 0.0280, care: 0.0240 }, perCapita: { medical: 25500, support:  7800, care:  8700 }, household: { medical: 20100, support: 6000, care: 4500 } } },
  { cityCode: "02362", citySlug: "owani",       cityName: "大鰐町",     caps: CAPS, rates: { rate: { medical: 0.0750, support: 0.0290, care: 0.0280 }, perCapita: { medical: 20000, support:  9800, care:  9800 }, household: { medical: 25000, support: 9800, care: 9800 } } },
  { cityCode: "02367", citySlug: "inakadate",   cityName: "田舎館村",   caps: CAPS, rates: { rate: { medical: 0.0790, support: 0.0250, care: 0.0210 }, perCapita: { medical: 22300, support:  8000, care: 10000 }, household: { medical: 27000, support: 7000, care: 6500 } } },
  { cityCode: "02381", citySlug: "itayanagi",   cityName: "板柳町",     caps: CAPS, rates: { rate: { medical: 0.0740, support: 0.0330, care: 0.0195 }, perCapita: { medical: 24900, support: 10100, care:  9000 }, household: { medical: 24500, support: 9900, care: 5500 } } },
  { cityCode: "02384", citySlug: "tsuruta",     cityName: "鶴田町",     caps: CAPS, rates: { rate: { medical: 0.0830, support: 0.0230, care: 0.0240 }, perCapita: { medical: 13800, support:  3600, care:  4200 }, household: { medical: 0, support: 0, care: 0 } } },
  { cityCode: "02387", citySlug: "nakadomari",  cityName: "中泊町",     caps: CAPS, rates: { rate: { medical: 0.0850, support: 0.0275, care: 0.0249 }, perCapita: { medical:  9900, support:  4800, care:  6000 }, household: { medical: 0, support: 0, care: 0 } } },
  { cityCode: "02401", citySlug: "noheji",      cityName: "野辺地町",   caps: CAPS, rates: { rate: { medical: 0.0826, support: 0.0218, care: 0.0066 }, perCapita: { medical: 28100, support:  5100, care:  6900 }, household: { medical: 27400, support: 10700, care: 3100 } } },
  { cityCode: "02402", citySlug: "shichinohe",  cityName: "七戸町",     caps: CAPS, rates: { rate: { medical: 0.0625, support: 0.0260, care: 0.0255 }, perCapita: { medical: 27000, support: 11000, care: 14000 }, household: { medical: 22000, support: 8000, care: 6000 } } },
  { cityCode: "02405", citySlug: "rokunohe",    cityName: "六戸町",     caps: CAPS, rates: { rate: { medical: 0.0850, support: 0.0270, care: 0.0230 }, perCapita: { medical: 28000, support: 11000, care: 12000 }, household: { medical: 32000, support: 10000, care: 7000 } } },
  { cityCode: "02406", citySlug: "yokohamacho", cityName: "横浜町",     caps: CAPS, rates: { rate: { medical: 0.0780, support: 0.0290, care: 0.0260 }, perCapita: { medical: 32000, support: 12000, care: 12000 }, household: { medical: 21000, support: 8000, care: 7000 } } },
  { cityCode: "02408", citySlug: "tohokucho",   cityName: "東北町",     caps: CAPS, rates: { rate: { medical: 0.0750, support: 0.0320, care: 0.0200 }, perCapita: { medical: 31000, support: 13000, care: 12100 }, household: { medical: 22000, support: 9000, care: 6800 } } },
  { cityCode: "02411", citySlug: "rokkasho",    cityName: "六ヶ所村",   caps: CAPS, rates: { rate: { medical: 0.0760, support: 0.0270, care: 0.0230 }, perCapita: { medical: 33000, support:  9600, care:  9000 }, household: { medical: 23000, support: 8000, care: 6500 } } },
  { cityCode: "02412", citySlug: "oirase",      cityName: "おいらせ町", caps: CAPS, rates: { rate: { medical: 0.0745, support: 0.0270, care: 0.0230 }, perCapita: { medical: 31600, support: 11400, care: 13800 }, household: { medical: 21600, support: 7800, care: 6800 } } },
  { cityCode: "02423", citySlug: "oma",         cityName: "大間町",     caps: CAPS, rates: { rate: { medical: 0.0800, support: 0.0200, care: 0.0144 }, perCapita: { medical: 22000, support:  8000, care: 13500 }, household: { medical: 40000, support: 5500, care: 5500 } } },
  { cityCode: "02424", citySlug: "higashidori", cityName: "東通村",     caps: CAPS, rates: { rate: { medical: 0.0800, support: 0.0260, care: 0.0260 }, perCapita: { medical: 26000, support:  5000, care:  6000 }, household: { medical: 30000, support: 5000, care: 6000 } } },
  { cityCode: "02425", citySlug: "kazamaura",   cityName: "風間浦村",   caps: CAPS, rates: { rate: { medical: 0.0800, support: 0.0180, care: 0.0200 }, perCapita: { medical: 24000, support:  9600, care: 13200 }, household: { medical: 37200, support: 5000, care: 2000 } } },
  { cityCode: "02426", citySlug: "sai",         cityName: "佐井村",     caps: CAPS, rates: { rate: { medical: 0.0960, support: 0.0320, care: 0.0300 }, perCapita: { medical: 25200, support: 12000, care: 13200 }, household: { medical: 30000, support: 5000, care: 2000 } } },
  { cityCode: "02441", citySlug: "sannohe",     cityName: "三戸町",     caps: CAPS, rates: { rate: { medical: 0.0780, support: 0.0280, care: 0.0250 }, perCapita: { medical: 25400, support:  8800, care: 10200 }, household: { medical: 22000, support: 7600, care: 5400 } } },
  { cityCode: "02442", citySlug: "gonohe",      cityName: "五戸町",     caps: CAPS, rates: { rate: { medical: 0.0870, support: 0.0240, care: 0.0180 }, perCapita: { medical: 27000, support: 10000, care: 12000 }, household: { medical: 30000, support: 8000, care: 7000 } } },
  { cityCode: "02443", citySlug: "takko",       cityName: "田子町",     caps: CAPS, rates: { rate: { medical: 0.0750, support: 0.0264, care: 0.0234 }, perCapita: { medical: 23500, support:  7700, care:  9800 }, household: { medical: 17100, support: 5900, care: 4900 } } },
  { cityCode: "02445", citySlug: "nanbu",       cityName: "南部町",     caps: CAPS, rates: { rate: { medical: 0.0860, support: 0.0180, care: 0.0180 }, perCapita: { medical: 16400, support:  8000, care: 12000 }, household: { medical: 29000, support: 8000, care: 7000 } } },
  { cityCode: "02446", citySlug: "hashikami",   cityName: "階上町",     caps: CAPS, rates: { rate: { medical: 0.0730, support: 0.0270, care: 0.0240 }, perCapita: { medical: 23000, support:  9000, care: 10000 }, household: { medical: 21000, support: 8000, care: 6000 } } },
  { cityCode: "02450", citySlug: "shingo",      cityName: "新郷村",     caps: CAPS, rates: { rate: { medical: 0.0830, support: 0.0260, care: 0.0240 }, perCapita: { medical: 24500, support:  9000, care: 10000 }, household: { medical: 27000, support: 8500, care: 7500 } } },
];
