/**
 * 東京都 全自治体 国民健康保険 kokuho-2025.json 生成スクリプト
 * 実行: node scripts/generate-tokyo-kokuho.js
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "municipalities");
const TEST_DATA_DIR = path.join(ROOT, "test", "data", "municipalities");

// 標準の法定軽減（全国共通 R7）
const STANDARD_REDUCTION = {
  enabled: true,
  standards: {
    sevenTenths: { base: 430000, perPersonAdd: 0 },
    fiveTenths:  { base: 430000, perPersonAdd: 305000 },
    twoTenths:   { base: 430000, perPersonAdd: 560000 }
  },
  salaryPensionAdd: 100000,
  ratios: { sevenTenths: 0.7, fiveTenths: 0.5, twoTenths: 0.2 }
};

const PRESCHOOL_REDUCTION = {
  enabled: true,
  medicalPerCapitaRate: 0.5,
  supportPerCapitaRate: 0.5
};

/**
 * JSON生成ヘルパー
 */
function makeJson(slug, code, name, medR, medP, supR, supP, careR, careP, capM, capS, capC, assetLevy = null) {
  const json = {
    cityCode: String(code),
    citySlug: slug,
    cityName: name,
    fiscalYear: 2025,
    system: "kokuho",
    basicDeduction: 430000,
    rate: {
      medical: medR,
      support: supR,
      care: careR
    },
    perCapita: {
      medical: medP,
      support: supP,
      care: careP
    },
    household: {
      medical: 0,
      support: 0,
      care: 0
    },
    caps: {
      medical: capM,
      support: capS,
      care: capC
    },
    preschoolReduction: PRESCHOOL_REDUCTION,
    reduction: STANDARD_REDUCTION
  };
  if (assetLevy) {
    json.assetLevy = assetLevy;
  }
  return json;
}

// 標準上限（R7全国標準）
const CAP_STD  = [660000, 260000, 170000];
const CAP_650  = [650000, 240000, 170000];  // 旧上限（一部市）
const CAP_640  = [640000, 230000, 170000];  // 立川市
const CAP_660_240 = [660000, 240000, 170000]; // 昭島市（支援分cap=240,000）

// [slug, cityCode, cityName, medR, medP, supR, supP, careR, careP, [capM, capS, capC], assetLevy?]
const municipalities = [
  // ========== 23特別区 ==========
  // caps: 660000/260000/170000（全区共通）
  ["chiyoda",    "13101", "千代田区", 0.0771, 47300, 0.0269, 16800, 0.0172, 16200, CAP_STD],
  ["chuo",       "13102", "中央区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["minato",     "13103", "港区",     0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["shinjuku",   "13104", "新宿区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["bunkyo",     "13105", "文京区",   0.0771, 47300, 0.0269, 16800, 0.0223, 16600, CAP_STD],
  ["taito",      "13106", "台東区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["sumida",     "13107", "墨田区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["koto",       "13108", "江東区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["shinagawa",  "13109", "品川区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["meguro",     "13110", "目黒区",   0.0771, 47300, 0.0269, 16800, 0.0219, 16600, CAP_STD],
  ["ota",        "13111", "大田区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["setagaya",   "13112", "世田谷区", 0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["shibuya",    "13113", "渋谷区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["nakano-ku",  "13114", "中野区",   0.0792, 45600, 0.0287, 16200, 0.0220, 17400, CAP_STD],
  ["suginami",   "13115", "杉並区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["toshima",    "13116", "豊島区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["kita",       "13117", "北区",     0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["arakawa",    "13118", "荒川区",   0.0771, 47300, 0.0269, 16800, 0.0210, 16600, CAP_STD],
  ["itabashi",   "13119", "板橋区",   0.0771, 47300, 0.0269, 16800, 0.0222, 16600, CAP_STD],
  ["nerima",     "13120", "練馬区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["adachi",     "13121", "足立区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["katsushika", "13122", "葛飾区",   0.0771, 47300, 0.0269, 16800, 0.0225, 16600, CAP_STD],
  ["edogawa",    "13123", "江戸川区", 0.0859, 50400, 0.0297, 17400, 0.0245, 17400, CAP_STD],

  // ========== 26市 ==========
  ["hachioji",        "13201", "八王子市",   0.0773, 44000, 0.0283, 17400, 0.0242, 18800, CAP_STD],
  ["tachikawa",       "13202", "立川市",     0.0668, 32500, 0.0224, 11700, 0.0170, 14500, CAP_640],
  ["musashino",       "13203", "武蔵野市",   0.0562, 31000, 0.0195, 11300, 0.0165, 13600, CAP_650],
  ["mitaka",          "13204", "三鷹市",     0.0610, 29000, 0.0230, 11800, 0.0160, 13400, CAP_STD],
  ["ome",             "13205", "青梅市",     0.0637, 34400, 0.0217, 12700, 0.0203, 13800, CAP_STD],
  ["fuchu",           "13206", "府中市",     0.0505, 23720, 0.0164,  7440, 0.0164,  9840, CAP_650],
  ["akishima",        "13207", "昭島市",     0.0560, 27500, 0.0225, 11500, 0.0170, 14500, CAP_660_240],
  ["chofu",           "13208", "調布市",     0.0552, 29000, 0.0198, 10300, 0.0175, 12000, CAP_650],
  ["machida",         "13209", "町田市",     0.0667, 39300, 0.0225, 13100, 0.0202, 15100, CAP_STD],
  ["koganei",         "13210", "小金井市",   0.0654, 30000, 0.0205, 13000, 0.0200, 15000, CAP_650],
  ["kodaira",         "13211", "小平市",     0.0601, 27000, 0.0229, 12900, 0.0185, 15900, CAP_STD],
  ["hino",            "13212", "日野市",     0.0580, 34500, 0.0210, 12300, 0.0210, 14700, CAP_STD],
  ["higashimurayama", "13213", "東村山市",   0.0670, 40800, 0.0225, 13500, 0.0215, 16000, CAP_STD],
  ["kokubunji",       "13214", "国分寺市",   0.0640, 30000, 0.0238, 14000, 0.0224, 16000, CAP_650],
  ["kunitachi",       "13215", "国立市",     0.0550, 20000, 0.0180, 10000, 0.0185, 11000, CAP_STD],
  ["fussa",           "13218", "福生市",     0.0539, 29700, 0.0225, 13200, 0.0179, 14000, CAP_STD],
  ["komae",           "13219", "狛江市",     0.0565, 27900, 0.0197, 11300, 0.0184, 13600, CAP_STD],
  ["higashiyamato",   "13220", "東大和市",   0.0742, 37200, 0.0250, 12300, 0.0245, 14100, CAP_STD],
  ["kiyose",          "13221", "清瀬市",     0.0592, 28000, 0.0201, 10000, 0.0190, 13000, CAP_STD],
  ["higashikurume",   "13222", "東久留米市", 0.0592, 38300, 0.0223, 13600, 0.0199, 14700, CAP_STD],
  ["musashimurayama", "13223", "武蔵村山市", 0.0694, 35200, 0.0221, 12500, 0.0176, 13000, CAP_STD],
  ["tama",            "13224", "多摩市",     0.0616, 30200, 0.0200, 12400, 0.0178, 12600, CAP_STD],
  ["inagi",           "13225", "稲城市",     0.0573, 37200, 0.0137,  9400, 0.0219, 13100, CAP_STD],
  ["hamura",          "13227", "羽村市",     0.0643, 27300, 0.0233, 11200, 0.0215, 13100, CAP_STD],
  ["akiruno",         "13228", "あきる野市", 0.0628, 33000, 0.0237, 12300, 0.0223, 14700, CAP_STD],
  ["nishitokyo",      "13229", "西東京市",   0.0541, 31600, 0.0168,  6500, 0.0164, 14300, CAP_STD],

  // ========== 町村 ==========
  ["mizuho",    "13303", "瑞穂町",   0.0603, 28000, 0.0185, 10500, 0.0155, 15000, CAP_STD],
  ["hinode",    "13305", "日の出町", 0.0600, 31300, 0.0225, 11700, 0.0199, 13200, CAP_STD],
  ["hinohara",  "13307", "檜原村",   0.0535, 28100, 0.0166,  9600, 0.0160, 12200, CAP_STD],
  ["okutama",   "13308", "奥多摩町", 0.0620, 33100, 0.0210, 12600, 0.0205, 12600, CAP_STD],
  // 小笠原村: 資産割あり
  ["ogasawara", "13421", "小笠原村", 0.0450, 22600, 0.0150, 10000, 0.0140, 10000, CAP_STD,
    { medical: 0.35, support: 0.15, care: 0.11 }],
];

let created = 0;

for (const [slug, code, name, medR, medP, supR, supP, careR, careP, caps, assetLevy] of municipalities) {
  const [capM, capS, capC] = caps;
  const json = makeJson(slug, code, name, medR, medP, supR, supP, careR, careP, capM, capS, capC, assetLevy);
  const jsonStr = JSON.stringify(json, null, 2);

  for (const baseDir of [DATA_DIR, TEST_DATA_DIR]) {
    const dir = path.join(baseDir, slug);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, "kokuho-2025.json");
    writeFileSync(filePath, jsonStr, "utf-8");
  }

  created++;
  console.log(`✅ ${name} (${slug})`);
}

console.log(`\n完了: ${created}自治体 × 2箇所 = ${created * 2}ファイル生成`);
