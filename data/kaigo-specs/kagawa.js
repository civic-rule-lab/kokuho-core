/**
 * 香川県 介護保険料スペック（第9期 2024-2026）
 *
 * 収集状況: 全17自治体 未収集（needs_update）
 * 更新: 2026-04-30
 *
 * 記入方法:
 *   各自治体の公式サイトで baseAmount（基準額・円/年）を確認し記入する。
 *   status を "needs_update" → "verified" に変更し source.url を記入。
 *   段階が標準9段階と異なる場合は brackets を記入（省略時は標準9段階）。
 */

export const PREF_NAME = "香川県";
export const PREF_SLUG = "kagawa";

// 都道府県共通の brackets 定義（null = 標準9段階を使用）
export const BRACKETS = null;

export const MUNICIPALITIES = [
  {
    cityCode:   "37201",
    citySlug:   "takamatsu",
    cityName:   "高松市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37202",
    citySlug:   "marugame",
    cityName:   "丸亀市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37203",
    citySlug:   "sakaide",
    cityName:   "坂出市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37204",
    citySlug:   "zentsuji",
    cityName:   "善通寺市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37205",
    citySlug:   "kanonji",
    cityName:   "観音寺市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37206",
    citySlug:   "sanuki",
    cityName:   "さぬき市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37207",
    citySlug:   "higashikagawa",
    cityName:   "東かがわ市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37208",
    citySlug:   "mitoyo",
    cityName:   "三豊市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37322",
    citySlug:   "tonoshomachi",
    cityName:   "土庄町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37323",
    citySlug:   "shodoshimamachi",
    cityName:   "小豆島町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37341",
    citySlug:   "mikimachi",
    cityName:   "三木町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37364",
    citySlug:   "naoshimamachi",
    cityName:   "直島町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37386",
    citySlug:   "utazumachi",
    cityName:   "宇多津町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37387",
    citySlug:   "ayagawamachi",
    cityName:   "綾川町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37403",
    citySlug:   "kotohiramachi",
    cityName:   "琴平町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37404",
    citySlug:   "tadotsumachi",
    cityName:   "多度津町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "37406",
    citySlug:   "mannomachi",
    cityName:   "まんのう町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
];
