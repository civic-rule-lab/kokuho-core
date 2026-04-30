/**
 * 福岡県 介護保険料スペック（第9期 2024-2026）
 *
 * 収集状況: 全60自治体 未収集（needs_update）
 * 更新: 2026-04-30
 *
 * 記入方法:
 *   各自治体の公式サイトで baseAmount（基準額・円/年）を確認し記入する。
 *   status を "needs_update" → "verified" に変更し source.url を記入。
 *   段階が標準9段階と異なる場合は brackets を記入（省略時は標準9段階）。
 */

export const PREF_NAME = "福岡県";
export const PREF_SLUG = "fukuoka";

// 都道府県共通の brackets 定義（null = 標準9段階を使用）
export const BRACKETS = null;

export const MUNICIPALITIES = [
  {
    cityCode:   "40100",
    citySlug:   "kitakyushu",
    cityName:   "北九州市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40130",
    citySlug:   "fukuoka",
    cityName:   "福岡市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40202",
    citySlug:   "omuta",
    cityName:   "大牟田市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40203",
    citySlug:   "kurume",
    cityName:   "久留米市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40204",
    citySlug:   "nogata",
    cityName:   "直方市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40205",
    citySlug:   "iizuka",
    cityName:   "飯塚市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40206",
    citySlug:   "tagawa",
    cityName:   "田川市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40207",
    citySlug:   "yanagawa",
    cityName:   "柳川市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40208",
    citySlug:   "yame",
    cityName:   "八女市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40209",
    citySlug:   "chikugo",
    cityName:   "筑後市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40210",
    citySlug:   "okawa",
    cityName:   "大川市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40211",
    citySlug:   "yukuhashi",
    cityName:   "行橋市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40212",
    citySlug:   "buzen",
    cityName:   "豊前市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40213",
    citySlug:   "nakama",
    cityName:   "中間市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40214",
    citySlug:   "ogori",
    cityName:   "小郡市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40215",
    citySlug:   "chikushino",
    cityName:   "筑紫野市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40216",
    citySlug:   "kasuga",
    cityName:   "春日市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40217",
    citySlug:   "onojo",
    cityName:   "大野城市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40218",
    citySlug:   "munakata",
    cityName:   "宗像市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40219",
    citySlug:   "dazaifu",
    cityName:   "太宰府市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40221",
    citySlug:   "koga",
    cityName:   "古賀市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40222",
    citySlug:   "fukutsu",
    cityName:   "福津市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40223",
    citySlug:   "ukiha",
    cityName:   "うきは市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40224",
    citySlug:   "miyawaka",
    cityName:   "宮若市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40225",
    citySlug:   "kama",
    cityName:   "嘉麻市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40226",
    citySlug:   "asakura",
    cityName:   "朝倉市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40227",
    citySlug:   "miyama",
    cityName:   "みやま市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40228",
    citySlug:   "itoshima",
    cityName:   "糸島市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40229",
    citySlug:   "nakagawashi",
    cityName:   "那珂川市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40341",
    citySlug:   "umi",
    cityName:   "宇美町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40342",
    citySlug:   "sasaguri",
    cityName:   "篠栗町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40343",
    citySlug:   "shime",
    cityName:   "志免町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40344",
    citySlug:   "sue",
    cityName:   "須恵町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40345",
    citySlug:   "shingu",
    cityName:   "新宮町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40348",
    citySlug:   "hisayama",
    cityName:   "久山町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40349",
    citySlug:   "kasuya",
    cityName:   "粕屋町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40401",
    citySlug:   "ashiya",
    cityName:   "芦屋町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40402",
    citySlug:   "mizumaki",
    cityName:   "水巻町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40403",
    citySlug:   "okagaki",
    cityName:   "岡垣町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40404",
    citySlug:   "onga",
    cityName:   "遠賀町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40421",
    citySlug:   "kotake",
    cityName:   "小竹町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40422",
    citySlug:   "kurate",
    cityName:   "鞍手町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40425",
    citySlug:   "keisen",
    cityName:   "桂川町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40431",
    citySlug:   "chikuzen",
    cityName:   "筑前町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40433",
    citySlug:   "toho",
    cityName:   "東峰村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40442",
    citySlug:   "tachiarai",
    cityName:   "大刀洗町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40443",
    citySlug:   "oki",
    cityName:   "大木町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40444",
    citySlug:   "hirokawa",
    cityName:   "広川町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40501",
    citySlug:   "kawara",
    cityName:   "香春町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40502",
    citySlug:   "soeda",
    cityName:   "添田町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40504",
    citySlug:   "itoda",
    cityName:   "糸田町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40505",
    citySlug:   "kawasakimachi",
    cityName:   "川崎町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40506",
    citySlug:   "oto",
    cityName:   "大任町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40507",
    citySlug:   "akamura",
    cityName:   "赤村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40521",
    citySlug:   "kanda",
    cityName:   "苅田町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40522",
    citySlug:   "miyako",
    cityName:   "みやこ町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40523",
    citySlug:   "fukuchi",
    cityName:   "福智町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40524",
    citySlug:   "chikujo",
    cityName:   "築上町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40525",
    citySlug:   "yoshitomi",
    cityName:   "吉富町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "40526",
    citySlug:   "koge",
    cityName:   "上毛町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
];
