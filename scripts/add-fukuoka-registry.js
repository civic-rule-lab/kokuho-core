/**
 * 福岡県 60自治体を registry/index.json に追記するスクリプト
 * 実行: node scripts/add-fukuoka-registry.js
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY  = path.join(__dirname, "../registry/index.json");

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8"));

const FUKUOKA = [
  { cityCode: "40100", citySlug: "kitakyushu",    cityName: "北九州市" },
  { cityCode: "40130", citySlug: "fukuoka",        cityName: "福岡市" },
  { cityCode: "40202", citySlug: "omuta",          cityName: "大牟田市" },
  { cityCode: "40203", citySlug: "kurume",         cityName: "久留米市" },
  { cityCode: "40204", citySlug: "nogata",         cityName: "直方市" },
  { cityCode: "40205", citySlug: "iizuka",         cityName: "飯塚市" },
  { cityCode: "40206", citySlug: "tagawa",         cityName: "田川市" },
  { cityCode: "40207", citySlug: "yanagawa",       cityName: "柳川市" },
  { cityCode: "40208", citySlug: "yame",           cityName: "八女市" },
  { cityCode: "40209", citySlug: "chikugo",        cityName: "筑後市" },
  { cityCode: "40210", citySlug: "okawa",          cityName: "大川市" },
  { cityCode: "40211", citySlug: "yukuhashi",      cityName: "行橋市" },
  { cityCode: "40212", citySlug: "buzen",          cityName: "豊前市" },
  { cityCode: "40213", citySlug: "nakama",         cityName: "中間市" },
  { cityCode: "40214", citySlug: "ogori",          cityName: "小郡市" },
  { cityCode: "40215", citySlug: "chikushino",     cityName: "筑紫野市" },
  { cityCode: "40216", citySlug: "kasuga",         cityName: "春日市" },
  { cityCode: "40217", citySlug: "onojo",          cityName: "大野城市" },
  { cityCode: "40218", citySlug: "munakata",       cityName: "宗像市" },
  { cityCode: "40219", citySlug: "dazaifu",        cityName: "太宰府市" },
  { cityCode: "40221", citySlug: "koga",           cityName: "古賀市" },
  { cityCode: "40222", citySlug: "fukutsu",        cityName: "福津市" },
  { cityCode: "40223", citySlug: "ukiha",          cityName: "うきは市" },
  { cityCode: "40224", citySlug: "miyawaka",       cityName: "宮若市" },
  { cityCode: "40225", citySlug: "kama",           cityName: "嘉麻市" },
  { cityCode: "40226", citySlug: "asakura",        cityName: "朝倉市" },
  { cityCode: "40227", citySlug: "miyama",         cityName: "みやま市" },
  { cityCode: "40228", citySlug: "itoshima",       cityName: "糸島市" },
  { cityCode: "40229", citySlug: "nakagawashi",    cityName: "那珂川市" },
  { cityCode: "40341", citySlug: "umi",            cityName: "宇美町" },
  { cityCode: "40342", citySlug: "sasaguri",       cityName: "篠栗町" },
  { cityCode: "40343", citySlug: "shime",          cityName: "志免町" },
  { cityCode: "40344", citySlug: "sue",            cityName: "須恵町" },
  { cityCode: "40345", citySlug: "shingu",         cityName: "新宮町" },
  { cityCode: "40348", citySlug: "hisayama",       cityName: "久山町" },
  { cityCode: "40349", citySlug: "kasuya",         cityName: "粕屋町" },
  { cityCode: "40401", citySlug: "ashiya",         cityName: "芦屋町" },
  { cityCode: "40402", citySlug: "mizumaki",       cityName: "水巻町" },
  { cityCode: "40403", citySlug: "okagaki",        cityName: "岡垣町" },
  { cityCode: "40404", citySlug: "onga",           cityName: "遠賀町" },
  { cityCode: "40421", citySlug: "kotake",         cityName: "小竹町" },
  { cityCode: "40422", citySlug: "kurate",         cityName: "鞍手町" },
  { cityCode: "40425", citySlug: "keisen",         cityName: "桂川町" },
  { cityCode: "40431", citySlug: "chikuzen",       cityName: "筑前町" },
  { cityCode: "40433", citySlug: "toho",           cityName: "東峰村" },
  { cityCode: "40442", citySlug: "tachiarai",      cityName: "大刀洗町" },
  { cityCode: "40443", citySlug: "oki",            cityName: "大木町" },
  { cityCode: "40444", citySlug: "hirokawa",       cityName: "広川町" },
  { cityCode: "40501", citySlug: "kawara",         cityName: "香春町" },
  { cityCode: "40502", citySlug: "soeda",          cityName: "添田町" },
  { cityCode: "40504", citySlug: "itoda",          cityName: "糸田町" },
  { cityCode: "40505", citySlug: "kawasakimachi",  cityName: "川崎町" },
  { cityCode: "40506", citySlug: "oto",            cityName: "大任町" },
  { cityCode: "40507", citySlug: "akamura",        cityName: "赤村" },
  { cityCode: "40521", citySlug: "kanda",          cityName: "苅田町" },
  { cityCode: "40522", citySlug: "miyako",         cityName: "みやこ町" },
  { cityCode: "40523", citySlug: "fukuchi",        cityName: "福智町" },
  { cityCode: "40524", citySlug: "chikujo",        cityName: "築上町" },
  { cityCode: "40525", citySlug: "yoshitomi",      cityName: "吉富町" },
  { cityCode: "40526", citySlug: "koge",           cityName: "上毛町" },
].map(m => ({
  cityCode:   m.cityCode,
  citySlug:   m.citySlug,
  cityName:   m.cityName,
  prefecture: "福岡県",
  systems:    ["kokuho"],
}));

const existingSlugs = new Set(registry.municipalities.map(m => m.citySlug));
const conflicts = FUKUOKA.filter(m => existingSlugs.has(m.citySlug));
if (conflicts.length > 0) {
  console.error("⚠️  スラグ重複:", conflicts.map(m => m.citySlug).join(", "));
  process.exit(1);
}

registry.municipalities.push(...FUKUOKA);
writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n", "utf-8");

console.log(`✅ registry/index.json に福岡県 ${FUKUOKA.length} 自治体を追加`);
console.log(`   合計: ${registry.municipalities.length} 自治体`);
