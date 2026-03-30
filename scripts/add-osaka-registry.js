/**
 * 大阪府 43自治体を registry/index.json に追記するスクリプト
 * 実行: node scripts/add-osaka-registry.js
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY  = path.join(__dirname, "../registry/index.json");

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));

const OSAKA = [
  { cityCode: "27100", citySlug: "osaka",         cityName: "大阪市" },
  { cityCode: "27140", citySlug: "sakai",          cityName: "堺市" },
  { cityCode: "27202", citySlug: "kishiwada",      cityName: "岸和田市" },
  { cityCode: "27203", citySlug: "toyonaka",       cityName: "豊中市" },
  { cityCode: "27204", citySlug: "ikedashi",       cityName: "池田市" },
  { cityCode: "27205", citySlug: "suita",          cityName: "吹田市" },
  { cityCode: "27206", citySlug: "izumiotsu",      cityName: "泉大津市" },
  { cityCode: "27207", citySlug: "takatsuki",      cityName: "高槻市" },
  { cityCode: "27208", citySlug: "kaizuka",        cityName: "貝塚市" },
  { cityCode: "27209", citySlug: "moriguchi",      cityName: "守口市" },
  { cityCode: "27210", citySlug: "hirakata",       cityName: "枚方市" },
  { cityCode: "27211", citySlug: "ibaraki",        cityName: "茨木市" },
  { cityCode: "27212", citySlug: "yao",            cityName: "八尾市" },
  { cityCode: "27213", citySlug: "izumisano",      cityName: "泉佐野市" },
  { cityCode: "27214", citySlug: "tondabayashi",   cityName: "富田林市" },
  { cityCode: "27215", citySlug: "neyagawa",       cityName: "寝屋川市" },
  { cityCode: "27216", citySlug: "kawachinagano",  cityName: "河内長野市" },
  { cityCode: "27217", citySlug: "matsubara",      cityName: "松原市" },
  { cityCode: "27218", citySlug: "daito",          cityName: "大東市" },
  { cityCode: "27219", citySlug: "izumi",          cityName: "和泉市" },
  { cityCode: "27220", citySlug: "minoh",          cityName: "箕面市" },
  { cityCode: "27221", citySlug: "kashiwara",      cityName: "柏原市" },
  { cityCode: "27222", citySlug: "habikino",       cityName: "羽曳野市" },
  { cityCode: "27223", citySlug: "kadoma",         cityName: "門真市" },
  { cityCode: "27224", citySlug: "settsu",         cityName: "摂津市" },
  { cityCode: "27225", citySlug: "takaishi",       cityName: "高石市" },
  { cityCode: "27226", citySlug: "fujiidera",      cityName: "藤井寺市" },
  { cityCode: "27227", citySlug: "higashiosaka",   cityName: "東大阪市" },
  { cityCode: "27228", citySlug: "sennan",         cityName: "泉南市" },
  { cityCode: "27229", citySlug: "shijonawate",    cityName: "四條畷市" },
  { cityCode: "27230", citySlug: "katano",         cityName: "交野市" },
  { cityCode: "27231", citySlug: "osakasayama",    cityName: "大阪狭山市" },
  { cityCode: "27232", citySlug: "hannan",         cityName: "阪南市" },
  { cityCode: "27301", citySlug: "shimamoto",      cityName: "島本町" },
  { cityCode: "27321", citySlug: "toyono",         cityName: "豊能町" },
  { cityCode: "27322", citySlug: "nose",           cityName: "能勢町" },
  { cityCode: "27341", citySlug: "tadaoka",        cityName: "忠岡町" },
  { cityCode: "27361", citySlug: "kumatori",       cityName: "熊取町" },
  { cityCode: "27362", citySlug: "tajiri",         cityName: "田尻町" },
  { cityCode: "27366", citySlug: "misaki",         cityName: "岬町" },
  { cityCode: "27381", citySlug: "taishi",         cityName: "太子町" },
  { cityCode: "27382", citySlug: "kanan",          cityName: "河南町" },
  { cityCode: "27383", citySlug: "chihayaakasaka", cityName: "千早赤阪村" },
].map(m => ({
  cityCode:   m.cityCode,
  citySlug:   m.citySlug,
  cityName:   m.cityName,
  prefecture: "大阪府",
  systems:    ["kokuho"],
}));

const existingSlugs = new Set(registry.municipalities.map(m => m.citySlug));
const conflicts = OSAKA.filter(m => existingSlugs.has(m.citySlug));
if (conflicts.length > 0) {
  console.error("⚠️  スラグ重複:", conflicts.map(m => m.citySlug).join(", "));
  process.exit(1);
}

registry.municipalities.push(...OSAKA);
writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n", "utf-8");

console.log(`✅ registry/index.json に大阪府 ${OSAKA.length} 自治体を追加`);
console.log(`   合計: ${registry.municipalities.length} 自治体`);
