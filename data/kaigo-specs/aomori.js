/**
 * 青森県 介護保険料スペック（第9期 2024-2026）
 *
 * 収集状況: 全40自治体 未収集（needs_update）
 * 更新: 2026-04-30
 *
 * 記入方法:
 *   各自治体の公式サイトで baseAmount（基準額・円/年）を確認し記入する。
 *   status を "needs_update" → "verified" に変更し source.url を記入。
 *   段階が標準9段階と異なる場合は brackets を記入（省略時は標準9段階）。
 */

export const PREF_NAME = "青森県";
export const PREF_SLUG = "aomori";

// 都道府県共通の brackets 定義（null = 標準9段階を使用）
export const BRACKETS = null;

export const MUNICIPALITIES = [
  {
    cityCode:   "02201",
    citySlug:   "aomori",
    cityName:   "青森市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02202",
    citySlug:   "hirosaki",
    cityName:   "弘前市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02203",
    citySlug:   "hachinohe",
    cityName:   "八戸市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02204",
    citySlug:   "kuroishi",
    cityName:   "黒石市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02205",
    citySlug:   "goshogawara",
    cityName:   "五所川原市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02206",
    citySlug:   "towada",
    cityName:   "十和田市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02207",
    citySlug:   "misawa",
    cityName:   "三沢市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02208",
    citySlug:   "mutsu",
    cityName:   "むつ市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02209",
    citySlug:   "tsugaru",
    cityName:   "つがる市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02210",
    citySlug:   "hirakawa",
    cityName:   "平川市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02301",
    citySlug:   "hiranai",
    cityName:   "平内町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02303",
    citySlug:   "imabetsu",
    cityName:   "今別町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02304",
    citySlug:   "yomogita",
    cityName:   "蓬田村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02307",
    citySlug:   "sotogahama",
    cityName:   "外ヶ浜町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02321",
    citySlug:   "ajigasawa",
    cityName:   "鰺ヶ沢町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02323",
    citySlug:   "fukaura",
    cityName:   "深浦町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02341",
    citySlug:   "nishimeya",
    cityName:   "西目屋村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02361",
    citySlug:   "fujisaki",
    cityName:   "藤崎町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02362",
    citySlug:   "owani",
    cityName:   "大鰐町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02363",
    citySlug:   "inakadate",
    cityName:   "田舎館村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02381",
    citySlug:   "itayanagi",
    cityName:   "板柳町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02383",
    citySlug:   "tsuruta",
    cityName:   "鶴田町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02384",
    citySlug:   "nakadomari",
    cityName:   "中泊町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02401",
    citySlug:   "noheji",
    cityName:   "野辺地町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02402",
    citySlug:   "shichinohe",
    cityName:   "七戸町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02404",
    citySlug:   "rokunohe",
    cityName:   "六戸町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02405",
    citySlug:   "yokohamacho",
    cityName:   "横浜町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02407",
    citySlug:   "tohokucho",
    cityName:   "東北町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02411",
    citySlug:   "rokkasho",
    cityName:   "六ヶ所村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02412",
    citySlug:   "oirase",
    cityName:   "おいらせ町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02423",
    citySlug:   "oma",
    cityName:   "大間町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02424",
    citySlug:   "higashidori",
    cityName:   "東通村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02425",
    citySlug:   "kazamaura",
    cityName:   "風間浦村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02426",
    citySlug:   "sai",
    cityName:   "佐井村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02441",
    citySlug:   "sannohe",
    cityName:   "三戸町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02442",
    citySlug:   "gonohe",
    cityName:   "五戸町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02443",
    citySlug:   "takko",
    cityName:   "田子町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02445",
    citySlug:   "nanbu",
    cityName:   "南部町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02446",
    citySlug:   "hashikami",
    cityName:   "階上町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "02447",
    citySlug:   "shingo",
    cityName:   "新郷村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
];
