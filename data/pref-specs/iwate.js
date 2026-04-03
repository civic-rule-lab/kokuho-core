/**
 * 岩手県 国保データスペック（令和7年度 / 2025年度）
 *
 * データ出典: 岩手県「令和7年度市町村別国保税率」
 *   https://www.pref.iwate.jp/_res/projects/default_project/_page_/001/002/965/zeiritu7.pdf
 *
 * 使用: node scripts/generate-pref-kokuho.js iwate
 *
 * 特記事項:
 *   - 全33市町村 実際の保険税率を使用
 *   - 資産割あり: 宮古市・久慈市・二戸市・葛巻町・岩手町・住田町・大槌町・岩泉町(医療のみ)・田野畑村・軽米町・洋野町・九戸村・一戸町
 *   - 賦課限度額: 全市町村で全国標準（660/260/170万円）
 *   - slug競合: 宮古市→miyakoshi（福岡県みやこ町がmiyakoを使用）
 *              野田村→nodamura（千葉県野田市がnodaを使用）
 *              洋野町→hironocho（福島県広野町がhironoを使用）
 *              岩手町→iwatemachi（県名slugと区別）
 */

export const PREF_NAME = "岩手県";

export const CAPS = { medical: 660000, support: 260000, care: 170000 };

// ─────────────────────────────────────────────────────────────────
// 岩手県 全33市町村（令和7年度 実際の保険税率）
// ─────────────────────────────────────────────────────────────────
export const MUNICIPALITIES = [

  // ── 市（14市）───────────────────────────────────────────────

  { cityCode: "03201", citySlug: "morioka",        cityName: "盛岡市",     caps: CAPS, rates: { rate: { medical: 0.0840, support: 0.0260, care: 0.0250 }, perCapita: { medical: 22000, support:  6200, care:  6400 }, household: { medical: 23900, support: 7100, care: 6700 } } },
  { cityCode: "03202", citySlug: "miyakoshi",       cityName: "宮古市",     caps: CAPS, assetLevy: { medical: 0.1200, support: 0.0480, care: 0.0490 }, rates: { rate: { medical: 0.0770, support: 0.0230, care: 0.0220 }, perCapita: { medical: 22200, support:  7000, care:  7500 }, household: { medical: 22800, support: 6200, care: 6000 } } },
  { cityCode: "03203", citySlug: "ofunato",         cityName: "大船渡市",   caps: CAPS, rates: { rate: { medical: 0.0750, support: 0.0260, care: 0.0200 }, perCapita: { medical: 30900, support: 10400, care: 10000 }, household: { medical: 21400, support: 7200, care: 5200 } } },
  { cityCode: "03205", citySlug: "hanamaki",        cityName: "花巻市",     caps: CAPS, rates: { rate: { medical: 0.0650, support: 0.0250, care: 0.0200 }, perCapita: { medical: 16500, support:  9500, care:  7900 }, household: { medical: 16300, support: 7000, care: 7800 } } },
  { cityCode: "03206", citySlug: "kitakami",        cityName: "北上市",     caps: CAPS, rates: { rate: { medical: 0.0660, support: 0.0300, care: 0.0250 }, perCapita: { medical: 19000, support:  7600, care:  7400 }, household: { medical: 19000, support: 7700, care: 7500 } } },
  { cityCode: "03207", citySlug: "kuji",            cityName: "久慈市",     caps: CAPS, assetLevy: { medical: 0.1610, support: 0.0600, care: 0.0660 }, rates: { rate: { medical: 0.0590, support: 0.0260, care: 0.0210 }, perCapita: { medical: 19500, support:  7500, care:  7400 }, household: { medical: 20600, support: 7400, care: 7000 } } },
  { cityCode: "03208", citySlug: "tono",            cityName: "遠野市",     caps: CAPS, rates: { rate: { medical: 0.0765, support: 0.0265, care: 0.0240 }, perCapita: { medical: 23900, support:  9300, care:  8900 }, household: { medical: 19000, support: 5800, care: 5000 } } },
  { cityCode: "03209", citySlug: "ichinoseki",      cityName: "一関市",     caps: CAPS, rates: { rate: { medical: 0.0756, support: 0.0278, care: 0.0247 }, perCapita: { medical: 19800, support:  7100, care:  7700 }, household: { medical: 20300, support: 7400, care: 5800 } } },
  { cityCode: "03210", citySlug: "rikuzentakata",   cityName: "陸前高田市", caps: CAPS, rates: { rate: { medical: 0.0740, support: 0.0250, care: 0.0230 }, perCapita: { medical: 30100, support: 10100, care: 11300 }, household: { medical: 22300, support: 7500, care: 5800 } } },
  { cityCode: "03211", citySlug: "kamaishi",        cityName: "釜石市",     caps: CAPS, rates: { rate: { medical: 0.0820, support: 0.0290, care: 0.0290 }, perCapita: { medical: 21200, support:  7400, care:  8600 }, household: { medical: 21500, support: 7500, care: 6500 } } },
  { cityCode: "03214", citySlug: "ninohe",          cityName: "二戸市",     caps: CAPS, assetLevy: { medical: 0.0500, support: 0.0200, care: 0.0300 }, rates: { rate: { medical: 0.0680, support: 0.0220, care: 0.0190 }, perCapita: { medical: 18000, support:  7000, care:  9000 }, household: { medical: 22000, support: 7000, care: 6000 } } },
  { cityCode: "03215", citySlug: "hachimantai",     cityName: "八幡平市",   caps: CAPS, rates: { rate: { medical: 0.0700, support: 0.0230, care: 0.0180 }, perCapita: { medical: 20000, support:  7000, care:  7700 }, household: { medical: 26000, support: 6500, care: 7000 } } },
  { cityCode: "03216", citySlug: "oshu",            cityName: "奥州市",     caps: CAPS, rates: { rate: { medical: 0.0650, support: 0.0250, care: 0.0178 }, perCapita: { medical: 19800, support:  7800, care:  6600 }, household: { medical: 19800, support: 7800, care: 6000 } } },
  { cityCode: "03217", citySlug: "takizawa",        cityName: "滝沢市",     caps: CAPS, rates: { rate: { medical: 0.0810, support: 0.0220, care: 0.0220 }, perCapita: { medical: 21400, support:  6200, care:  9200 }, household: { medical: 26400, support: 6800, care: 4600 } } },

  // ── 町村（19町村）───────────────────────────────────────────

  { cityCode: "03301", citySlug: "shizukuishi",     cityName: "雫石町",     caps: CAPS, rates: { rate: { medical: 0.0730, support: 0.0280, care: 0.0250 }, perCapita: { medical: 20000, support:  9000, care:  8000 }, household: { medical: 26000, support: 7800, care: 7800 } } },
  { cityCode: "03302", citySlug: "kuzumaki",        cityName: "葛巻町",     caps: CAPS, assetLevy: { medical: 0.2220, support: 0.0970, care: 0.1000 }, rates: { rate: { medical: 0.0680, support: 0.0310, care: 0.0240 }, perCapita: { medical: 18000, support:  7700, care:  9000 }, household: { medical: 24800, support: 10600, care: 9100 } } },
  { cityCode: "03303", citySlug: "iwatemachi",      cityName: "岩手町",     caps: CAPS, assetLevy: { medical: 0.0456, support: 0.0162, care: 0.0167 }, rates: { rate: { medical: 0.0760, support: 0.0240, care: 0.0200 }, perCapita: { medical: 21000, support:  6100, care:  8100 }, household: { medical: 24500, support: 8100, care: 7300 } } },
  { cityCode: "03401", citySlug: "shiwa",           cityName: "紫波町",     caps: CAPS, rates: { rate: { medical: 0.0600, support: 0.0270, care: 0.0200 }, perCapita: { medical: 24600, support: 11000, care: 10600 }, household: { medical: 17200, support: 7800, care: 4800 } } },
  { cityCode: "03402", citySlug: "yahaba",          cityName: "矢巾町",     caps: CAPS, rates: { rate: { medical: 0.0820, support: 0.0270, care: 0.0270 }, perCapita: { medical: 27000, support:  9500, care: 10000 }, household: { medical: 26400, support: 7000, care: 7500 } } },
  { cityCode: "03501", citySlug: "nishiwaga",       cityName: "西和賀町",   caps: CAPS, rates: { rate: { medical: 0.0700, support: 0.0220, care: 0.0180 }, perCapita: { medical: 13500, support:  7000, care:  6000 }, household: { medical: 20000, support: 7000, care: 7000 } } },
  { cityCode: "03503", citySlug: "kanegasaki",      cityName: "金ケ崎町",   caps: CAPS, rates: { rate: { medical: 0.0750, support: 0.0200, care: 0.0200 }, perCapita: { medical:  2000, support:  7000, care:  5000 }, household: { medical: 22000, support: 6000, care: 5000 } } },
  { cityCode: "03601", citySlug: "hiraizumi",       cityName: "平泉町",     caps: CAPS, rates: { rate: { medical: 0.0630, support: 0.0250, care: 0.0230 }, perCapita: { medical: 21000, support:  8000, care: 11000 }, household: { medical: 20000, support: 8000, care: 7000 } } },
  { cityCode: "03606", citySlug: "sumita",          cityName: "住田町",     caps: CAPS, assetLevy: { medical: 0.1750, support: 0.0850, care: 0.0800 }, rates: { rate: { medical: 0.0600, support: 0.0300, care: 0.0200 }, perCapita: { medical: 22700, support: 11200, care: 11100 }, household: { medical: 17000, support: 8400, care: 5800 } } },
  { cityCode: "03611", citySlug: "otsuchi",         cityName: "大槌町",     caps: CAPS, assetLevy: { medical: 0.2000, support: 0.1500, care: 0.1000 }, rates: { rate: { medical: 0.0770, support: 0.0300, care: 0.0200 }, perCapita: { medical: 14000, support:  8000, care:  6500 }, household: { medical: 20000, support: 8000, care: 5000 } } },
  { cityCode: "03614", citySlug: "yamada",          cityName: "山田町",     caps: CAPS, rates: { rate: { medical: 0.0710, support: 0.0260, care: 0.0250 }, perCapita: { medical: 21700, support:  8200, care:  9800 }, household: { medical: 20600, support: 7800, care: 6200 } } },
  { cityCode: "03615", citySlug: "iwaizumi",        cityName: "岩泉町",     caps: CAPS, assetLevy: { medical: 0.3000, support: 0, care: 0 }, rates: { rate: { medical: 0.0690, support: 0.0240, care: 0.0280 }, perCapita: { medical: 22800, support:  7200, care: 13500 }, household: { medical: 17000, support: 4500, care: 0 } } },
  { cityCode: "03616", citySlug: "tanohata",        cityName: "田野畑村",   caps: CAPS, assetLevy: { medical: 0.3900, support: 0.1480, care: 0.1700 }, rates: { rate: { medical: 0.0555, support: 0.0200, care: 0.0195 }, perCapita: { medical: 19000, support:  7000, care:  9600 }, household: { medical: 18000, support: 6200, care: 5700 } } },
  { cityCode: "03617", citySlug: "fudai",           cityName: "普代村",     caps: CAPS, rates: { rate: { medical: 0.0560, support: 0.0210, care: 0.0100 }, perCapita: { medical: 16800, support:  6200, care:  6000 }, household: { medical: 23200, support: 6800, care: 5000 } } },
  { cityCode: "03701", citySlug: "karumai",         cityName: "軽米町",     caps: CAPS, assetLevy: { medical: 0.1800, support: 0.0900, care: 0.0700 }, rates: { rate: { medical: 0.0560, support: 0.0170, care: 0.0120 }, perCapita: { medical: 17000, support:  6000, care:  5500 }, household: { medical: 23000, support: 6500, care: 6500 } } },
  { cityCode: "03702", citySlug: "nodamura",        cityName: "野田村",     caps: CAPS, rates: { rate: { medical: 0.0520, support: 0.0160, care: 0.0100 }, perCapita: { medical: 19000, support:  5000, care:  6000 }, household: { medical: 26000, support: 6000, care: 3000 } } },
  { cityCode: "03706", citySlug: "kunohe",          cityName: "九戸村",     caps: CAPS, assetLevy: { medical: 0.1100, support: 0.1000, care: 0.0700 }, rates: { rate: { medical: 0.0470, support: 0.0220, care: 0.0140 }, perCapita: { medical: 13500, support:  7000, care:  5000 }, household: { medical: 19000, support: 9000, care: 7000 } } },
  { cityCode: "03707", citySlug: "hironocho",       cityName: "洋野町",     caps: CAPS, assetLevy: { medical: 0.2100, support: 0.0900, care: 0.0600 }, rates: { rate: { medical: 0.0510, support: 0.0270, care: 0.0120 }, perCapita: { medical: 17400, support:  7800, care:  6000 }, household: { medical: 21000, support: 9000, care: 4800 } } },
  { cityCode: "03708", citySlug: "ichinohe",        cityName: "一戸町",     caps: CAPS, assetLevy: { medical: 0.1600, support: 0.0400, care: 0.0860 }, rates: { rate: { medical: 0.0680, support: 0.0230, care: 0.0170 }, perCapita: { medical: 22000, support:  8000, care:  7000 }, household: { medical: 24000, support: 7000, care: 8000 } } },
];
