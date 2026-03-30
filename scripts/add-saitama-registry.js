/**
 * 埼玉県 63自治体を registry/index.json に追記するスクリプト
 * 実行: node scripts/add-saitama-registry.js
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY  = path.join(__dirname, "../registry/index.json");

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));

const SAITAMA = [
  { cityCode: "11100", citySlug: "saitama",         cityName: "さいたま市" },
  { cityCode: "11201", citySlug: "kawagoe",          cityName: "川越市" },
  { cityCode: "11202", citySlug: "kumagaya",         cityName: "熊谷市" },
  { cityCode: "11203", citySlug: "kawaguchi",        cityName: "川口市" },
  { cityCode: "11206", citySlug: "gyoda",            cityName: "行田市" },
  { cityCode: "11207", citySlug: "chichibu",         cityName: "秩父市" },
  { cityCode: "11208", citySlug: "tokorozawa",       cityName: "所沢市" },
  { cityCode: "11209", citySlug: "hanno",            cityName: "飯能市" },
  { cityCode: "11210", citySlug: "kazo",             cityName: "加須市" },
  { cityCode: "11211", citySlug: "honjo",            cityName: "本庄市" },
  { cityCode: "11212", citySlug: "higashimatsuyama", cityName: "東松山市" },
  { cityCode: "11214", citySlug: "kasukabe",         cityName: "春日部市" },
  { cityCode: "11215", citySlug: "sayama",           cityName: "狭山市" },
  { cityCode: "11216", citySlug: "hanyu",            cityName: "羽生市" },
  { cityCode: "11217", citySlug: "konosu",           cityName: "鴻巣市" },
  { cityCode: "11219", citySlug: "fukaya",           cityName: "深谷市" },
  { cityCode: "11220", citySlug: "ageo",             cityName: "上尾市" },
  { cityCode: "11222", citySlug: "soka",             cityName: "草加市" },
  { cityCode: "11223", citySlug: "koshigaya",        cityName: "越谷市" },
  { cityCode: "11224", citySlug: "warabi",           cityName: "蕨市" },
  { cityCode: "11225", citySlug: "toda",             cityName: "戸田市" },
  { cityCode: "11227", citySlug: "iruma",            cityName: "入間市" },
  { cityCode: "11229", citySlug: "asaka",            cityName: "朝霞市" },
  { cityCode: "11230", citySlug: "shiki",            cityName: "志木市" },
  { cityCode: "11231", citySlug: "wako",             cityName: "和光市" },
  { cityCode: "11232", citySlug: "niiza",            cityName: "新座市" },
  { cityCode: "11233", citySlug: "okegawa",          cityName: "桶川市" },
  { cityCode: "11234", citySlug: "kuki",             cityName: "久喜市" },
  { cityCode: "11235", citySlug: "kitamoto",         cityName: "北本市" },
  { cityCode: "11236", citySlug: "yashio",           cityName: "八潮市" },
  { cityCode: "11237", citySlug: "fujimishi",        cityName: "富士見市" },
  { cityCode: "11239", citySlug: "misato",           cityName: "三郷市" },
  { cityCode: "11240", citySlug: "hasuda",           cityName: "蓮田市" },
  { cityCode: "11241", citySlug: "sakado",           cityName: "坂戸市" },
  { cityCode: "11242", citySlug: "satte",            cityName: "幸手市" },
  { cityCode: "11243", citySlug: "tsurugashima",     cityName: "鶴ヶ島市" },
  { cityCode: "11244", citySlug: "hidaka",           cityName: "日高市" },
  { cityCode: "11245", citySlug: "yoshikawa",        cityName: "吉川市" },
  { cityCode: "11247", citySlug: "fujimino",         cityName: "ふじみ野市" },
  { cityCode: "11248", citySlug: "shiraoka",         cityName: "白岡市" },
  { cityCode: "11301", citySlug: "inacho",           cityName: "伊奈町" },
  { cityCode: "11324", citySlug: "miyoshi",          cityName: "三芳町" },
  { cityCode: "11341", citySlug: "moroyama",         cityName: "毛呂山町" },
  { cityCode: "11342", citySlug: "ogose",            cityName: "越生町" },
  { cityCode: "11361", citySlug: "namegawa",         cityName: "滑川町" },
  { cityCode: "11362", citySlug: "ranzan",           cityName: "嵐山町" },
  { cityCode: "11363", citySlug: "ogawacho",         cityName: "小川町" },
  { cityCode: "11365", citySlug: "kawajima",         cityName: "川島町" },
  { cityCode: "11366", citySlug: "yoshimi",          cityName: "吉見町" },
  { cityCode: "11367", citySlug: "hatoyama",         cityName: "鳩山町" },
  { cityCode: "11369", citySlug: "tokigawa",         cityName: "ときがわ町" },
  { cityCode: "11381", citySlug: "yokoze",           cityName: "横瀬町" },
  { cityCode: "11382", citySlug: "minano",           cityName: "皆野町" },
  { cityCode: "11383", citySlug: "nagatoro",         cityName: "長瀞町" },
  { cityCode: "11384", citySlug: "ogano",            cityName: "小鹿野町" },
  { cityCode: "11385", citySlug: "higashichichibu",  cityName: "東秩父村" },
  { cityCode: "11401", citySlug: "misatomachi",      cityName: "美里町" },
  { cityCode: "11402", citySlug: "kamikawa",         cityName: "神川町" },
  { cityCode: "11404", citySlug: "kamisato",         cityName: "上里町" },
  { cityCode: "11408", citySlug: "yorii",            cityName: "寄居町" },
  { cityCode: "11442", citySlug: "miyashiro",        cityName: "宮代町" },
  { cityCode: "11464", citySlug: "sugito",           cityName: "杉戸町" },
  { cityCode: "11465", citySlug: "matsubushi",       cityName: "松伏町" },
].map(m => ({
  cityCode:   m.cityCode,
  citySlug:   m.citySlug,
  cityName:   m.cityName,
  prefecture: "埼玉県",
  systems:    ["kokuho"],
}));

// 重複チェック
const existingSlugs = new Set(registry.municipalities.map(m => m.citySlug));
const existing = SAITAMA.filter(m => existingSlugs.has(m.citySlug));
if (existing.length > 0) {
  console.error("⚠️  スラグ重複:", existing.map(m => m.citySlug).join(", "));
  process.exit(1);
}

registry.municipalities.push(...SAITAMA);
writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n", "utf-8");

console.log(`✅ registry/index.json に埼玉県 ${SAITAMA.length} 自治体を追加`);
console.log(`   合計: ${registry.municipalities.length} 自治体`);
