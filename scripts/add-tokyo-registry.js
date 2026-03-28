/**
 * registry/index.json に東京都全自治体を追加するスクリプト
 * 実行: node scripts/add-tokyo-registry.js
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const REGISTRY_PATH = path.join(ROOT, "registry", "index.json");

const tokyoMunicipalities = [
  // 23特別区
  { cityCode: "13101", citySlug: "chiyoda",        cityName: "千代田区",   prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13102", citySlug: "chuo",            cityName: "中央区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13103", citySlug: "minato",          cityName: "港区",       prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13104", citySlug: "shinjuku",        cityName: "新宿区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13105", citySlug: "bunkyo",          cityName: "文京区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13106", citySlug: "taito",           cityName: "台東区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13107", citySlug: "sumida",          cityName: "墨田区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13108", citySlug: "koto",            cityName: "江東区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13109", citySlug: "shinagawa",       cityName: "品川区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13110", citySlug: "meguro",          cityName: "目黒区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13111", citySlug: "ota",             cityName: "大田区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13112", citySlug: "setagaya",        cityName: "世田谷区",   prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13113", citySlug: "shibuya",         cityName: "渋谷区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13114", citySlug: "nakano-ku",       cityName: "中野区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13115", citySlug: "suginami",        cityName: "杉並区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13116", citySlug: "toshima",         cityName: "豊島区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13117", citySlug: "kita",            cityName: "北区",       prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13118", citySlug: "arakawa",         cityName: "荒川区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13119", citySlug: "itabashi",        cityName: "板橋区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13120", citySlug: "nerima",          cityName: "練馬区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13121", citySlug: "adachi",          cityName: "足立区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13122", citySlug: "katsushika",      cityName: "葛飾区",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13123", citySlug: "edogawa",         cityName: "江戸川区",   prefecture: "東京都", systems: ["kokuho"] },
  // 26市
  { cityCode: "13201", citySlug: "hachioji",        cityName: "八王子市",   prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13202", citySlug: "tachikawa",       cityName: "立川市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13203", citySlug: "musashino",       cityName: "武蔵野市",   prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13204", citySlug: "mitaka",          cityName: "三鷹市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13205", citySlug: "ome",             cityName: "青梅市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13206", citySlug: "fuchu",           cityName: "府中市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13207", citySlug: "akishima",        cityName: "昭島市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13208", citySlug: "chofu",           cityName: "調布市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13209", citySlug: "machida",         cityName: "町田市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13210", citySlug: "koganei",         cityName: "小金井市",   prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13211", citySlug: "kodaira",         cityName: "小平市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13212", citySlug: "hino",            cityName: "日野市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13213", citySlug: "higashimurayama", cityName: "東村山市",   prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13214", citySlug: "kokubunji",       cityName: "国分寺市",   prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13215", citySlug: "kunitachi",       cityName: "国立市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13218", citySlug: "fussa",           cityName: "福生市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13219", citySlug: "komae",           cityName: "狛江市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13220", citySlug: "higashiyamato",   cityName: "東大和市",   prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13221", citySlug: "kiyose",          cityName: "清瀬市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13222", citySlug: "higashikurume",   cityName: "東久留米市", prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13223", citySlug: "musashimurayama", cityName: "武蔵村山市", prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13224", citySlug: "tama",            cityName: "多摩市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13225", citySlug: "inagi",           cityName: "稲城市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13227", citySlug: "hamura",          cityName: "羽村市",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13228", citySlug: "akiruno",         cityName: "あきる野市", prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13229", citySlug: "nishitokyo",      cityName: "西東京市",   prefecture: "東京都", systems: ["kokuho"] },
  // 町村
  { cityCode: "13303", citySlug: "mizuho",          cityName: "瑞穂町",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13305", citySlug: "hinode",          cityName: "日の出町",   prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13307", citySlug: "hinohara",        cityName: "檜原村",     prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13308", citySlug: "okutama",         cityName: "奥多摩町",   prefecture: "東京都", systems: ["kokuho"] },
  { cityCode: "13421", citySlug: "ogasawara",       cityName: "小笠原村",   prefecture: "東京都", systems: ["kokuho"] },
];

const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));
const existingSlugs = new Set(registry.municipalities.map(m => m.citySlug));

let added = 0;
for (const m of tokyoMunicipalities) {
  if (!existingSlugs.has(m.citySlug)) {
    registry.municipalities.push(m);
    added++;
    console.log(`✅ 追加: ${m.cityName} (${m.citySlug})`);
  } else {
    console.log(`⏭  スキップ(既存): ${m.citySlug}`);
  }
}

writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), "utf-8");
console.log(`\n完了: ${added}件追加、合計 ${registry.municipalities.length}自治体`);
