/**
 * 千葉県 54自治体を registry/index.json に追記するスクリプト
 * 実行: node scripts/add-chiba-registry.js
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY  = path.join(__dirname, "../registry/index.json");

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));

const CHIBA = [
  { cityCode: "12100", citySlug: "chiba",            cityName: "千葉市" },
  { cityCode: "12202", citySlug: "choshi",            cityName: "銚子市" },
  { cityCode: "12203", citySlug: "ichikawa",          cityName: "市川市" },
  { cityCode: "12204", citySlug: "funabashi",         cityName: "船橋市" },
  { cityCode: "12205", citySlug: "tateyama",          cityName: "館山市" },
  { cityCode: "12206", citySlug: "kisarazu",          cityName: "木更津市" },
  { cityCode: "12207", citySlug: "matsudo",           cityName: "松戸市" },
  { cityCode: "12208", citySlug: "noda",              cityName: "野田市" },
  { cityCode: "12210", citySlug: "mobara",            cityName: "茂原市" },
  { cityCode: "12211", citySlug: "narita",            cityName: "成田市" },
  { cityCode: "12212", citySlug: "sakura",            cityName: "佐倉市" },
  { cityCode: "12213", citySlug: "togane",            cityName: "東金市" },
  { cityCode: "12215", citySlug: "asahishi",          cityName: "旭市" },
  { cityCode: "12216", citySlug: "narashino",         cityName: "習志野市" },
  { cityCode: "12217", citySlug: "kashiwa",           cityName: "柏市" },
  { cityCode: "12218", citySlug: "katsuura",          cityName: "勝浦市" },
  { cityCode: "12219", citySlug: "ichihara",          cityName: "市原市" },
  { cityCode: "12220", citySlug: "nagareyama",        cityName: "流山市" },
  { cityCode: "12221", citySlug: "yachiyo",           cityName: "八千代市" },
  { cityCode: "12222", citySlug: "abiko",             cityName: "我孫子市" },
  { cityCode: "12223", citySlug: "kamogawa",          cityName: "鴨川市" },
  { cityCode: "12224", citySlug: "kamagaya",          cityName: "鎌ケ谷市" },
  { cityCode: "12225", citySlug: "kimitsu",           cityName: "君津市" },
  { cityCode: "12226", citySlug: "futtsu",            cityName: "富津市" },
  { cityCode: "12227", citySlug: "urayasu",           cityName: "浦安市" },
  { cityCode: "12228", citySlug: "yotsukaido",        cityName: "四街道市" },
  { cityCode: "12229", citySlug: "sodegaura",         cityName: "袖ケ浦市" },
  { cityCode: "12230", citySlug: "yachimata",         cityName: "八街市" },
  { cityCode: "12231", citySlug: "inzai",             cityName: "印西市" },
  { cityCode: "12232", citySlug: "shiroi",            cityName: "白井市" },
  { cityCode: "12233", citySlug: "tomisato",          cityName: "富里市" },
  { cityCode: "12234", citySlug: "minamiboso",        cityName: "南房総市" },
  { cityCode: "12235", citySlug: "sosa",              cityName: "匝瑳市" },
  { cityCode: "12236", citySlug: "katori",            cityName: "香取市" },
  { cityCode: "12237", citySlug: "sammu",             cityName: "山武市" },
  { cityCode: "12238", citySlug: "isumi",             cityName: "いすみ市" },
  { cityCode: "12239", citySlug: "oamishirasato",     cityName: "大網白里市" },
  { cityCode: "12322", citySlug: "shisui",            cityName: "酒々井町" },
  { cityCode: "12329", citySlug: "sakaecho",          cityName: "栄町" },
  { cityCode: "12342", citySlug: "kozaki",            cityName: "神崎町" },
  { cityCode: "12347", citySlug: "tako",              cityName: "多古町" },
  { cityCode: "12349", citySlug: "tohnosho",          cityName: "東庄町" },
  { cityCode: "12403", citySlug: "kujukuri",          cityName: "九十九里町" },
  { cityCode: "12409", citySlug: "shibayama",         cityName: "芝山町" },
  { cityCode: "12410", citySlug: "yokoshibahikari",   cityName: "横芝光町" },
  { cityCode: "12421", citySlug: "ichinomiya",        cityName: "一宮町" },
  { cityCode: "12422", citySlug: "mutsuzawa",         cityName: "睦沢町" },
  { cityCode: "12423", citySlug: "chosei",            cityName: "長生村" },
  { cityCode: "12424", citySlug: "shirako",           cityName: "白子町" },
  { cityCode: "12426", citySlug: "nagara",            cityName: "長柄町" },
  { cityCode: "12427", citySlug: "chonan",            cityName: "長南町" },
  { cityCode: "12441", citySlug: "otakicho",          cityName: "大多喜町" },
  { cityCode: "12443", citySlug: "onjuku",            cityName: "御宿町" },
  { cityCode: "12463", citySlug: "kyonan",            cityName: "鋸南町" },
].map(m => ({
  cityCode:   m.cityCode,
  citySlug:   m.citySlug,
  cityName:   m.cityName,
  prefecture: "千葉県",
  systems:    ["kokuho"],
}));

const existingSlugs = new Set(registry.municipalities.map(m => m.citySlug));
const conflicts = CHIBA.filter(m => existingSlugs.has(m.citySlug));
if (conflicts.length > 0) {
  console.error("⚠️  スラグ重複:", conflicts.map(m => m.citySlug).join(", "));
  process.exit(1);
}

registry.municipalities.push(...CHIBA);
writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n", "utf-8");

console.log(`✅ registry/index.json に千葉県 ${CHIBA.length} 自治体を追加`);
console.log(`   合計: ${registry.municipalities.length} 自治体`);
