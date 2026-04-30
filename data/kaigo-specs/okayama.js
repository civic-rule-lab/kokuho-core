/**
 * 岡山県 介護保険料スペック（第9期 2024-2026）
 *
 * 収集状況: 全27自治体 未収集（needs_update）
 * 更新: 2026-04-30
 *
 * 記入方法:
 *   各自治体の公式サイトで baseAmount（基準額・円/年）を確認し記入する。
 *   status を "needs_update" → "verified" に変更し source.url を記入。
 *   段階が標準9段階と異なる場合は brackets を記入（省略時は標準9段階）。
 */

export const PREF_NAME = "岡山県";
export const PREF_SLUG = "okayama";

// 都道府県共通の brackets 定義（null = 標準9段階を使用）
export const BRACKETS = null;

export const MUNICIPALITIES = [
  {
    cityCode:   "33100",
    citySlug:   "okayama",
    cityName:   "岡山市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33202",
    citySlug:   "kurashiki",
    cityName:   "倉敷市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33203",
    citySlug:   "tsuyama",
    cityName:   "津山市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33204",
    citySlug:   "tamano",
    cityName:   "玉野市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33205",
    citySlug:   "kasaoka",
    cityName:   "笠岡市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33207",
    citySlug:   "ibara",
    cityName:   "井原市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33208",
    citySlug:   "soja",
    cityName:   "総社市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33209",
    citySlug:   "takahashi",
    cityName:   "高梁市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33210",
    citySlug:   "niimi",
    cityName:   "新見市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33211",
    citySlug:   "bizen",
    cityName:   "備前市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33212",
    citySlug:   "setouchi",
    cityName:   "瀬戸内市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33213",
    citySlug:   "akaiwashi",
    cityName:   "赤磐市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33214",
    citySlug:   "maniwa",
    cityName:   "真庭市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33215",
    citySlug:   "mimasaka",
    cityName:   "美作市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33216",
    citySlug:   "asakuchi",
    cityName:   "浅口市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33346",
    citySlug:   "wake",
    cityName:   "和気町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33423",
    citySlug:   "hayashima",
    cityName:   "早島町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33445",
    citySlug:   "satosho",
    cityName:   "里庄町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33461",
    citySlug:   "yakage",
    cityName:   "矢掛町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33586",
    citySlug:   "shinjo",
    cityName:   "新庄村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33606",
    citySlug:   "kagamino",
    cityName:   "鏡野町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33622",
    citySlug:   "shoo",
    cityName:   "勝央町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33623",
    citySlug:   "nagi",
    cityName:   "奈義町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33643",
    citySlug:   "nishiawakura",
    cityName:   "西粟倉村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33663",
    citySlug:   "kumenan",
    cityName:   "久米南町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33666",
    citySlug:   "misakicho",
    cityName:   "美咲町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "33681",
    citySlug:   "kibichuo",
    cityName:   "吉備中央町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
];
