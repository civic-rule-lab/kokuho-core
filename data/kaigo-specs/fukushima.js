/**
 * 福島県 介護保険料スペック（第9期 2024-2026）
 *
 * 収集状況: 全59自治体 未収集（needs_update）
 * 更新: 2026-04-30
 *
 * 記入方法:
 *   各自治体の公式サイトで baseAmount（基準額・円/年）を確認し記入する。
 *   status を "needs_update" → "verified" に変更し source.url を記入。
 *   段階が標準9段階と異なる場合は brackets を記入（省略時は標準9段階）。
 */

export const PREF_NAME = "福島県";
export const PREF_SLUG = "fukushima";

// 都道府県共通の brackets 定義（null = 標準9段階を使用）
export const BRACKETS = null;

export const MUNICIPALITIES = [
  {
    cityCode:   "07201",
    citySlug:   "fukushimashi",
    cityName:   "福島市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07202",
    citySlug:   "aizuwakamatsu",
    cityName:   "会津若松市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07203",
    citySlug:   "koriyama",
    cityName:   "郡山市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07204",
    citySlug:   "iwaki",
    cityName:   "いわき市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07205",
    citySlug:   "shirakawashi",
    cityName:   "白河市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07207",
    citySlug:   "sukagawa",
    cityName:   "須賀川市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07208",
    citySlug:   "kitakatashi",
    cityName:   "喜多方市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07210",
    citySlug:   "soma",
    cityName:   "相馬市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07211",
    citySlug:   "nihonmatsu",
    cityName:   "二本松市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07212",
    citySlug:   "tamura",
    cityName:   "田村市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07213",
    citySlug:   "minamisoma",
    cityName:   "南相馬市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07214",
    citySlug:   "dateshi",
    cityName:   "伊達市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07215",
    citySlug:   "motomiya",
    cityName:   "本宮市",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07301",
    citySlug:   "koori",
    cityName:   "桑折町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07303",
    citySlug:   "kunimi",
    cityName:   "国見町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07307",
    citySlug:   "kawamata",
    cityName:   "川俣町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07321",
    citySlug:   "otama",
    cityName:   "大玉村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07341",
    citySlug:   "kagamiishi",
    cityName:   "鏡石町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07342",
    citySlug:   "tenei",
    cityName:   "天栄村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07362",
    citySlug:   "shimogo",
    cityName:   "下郷町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07363",
    citySlug:   "hinoemata",
    cityName:   "檜枝岐村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07365",
    citySlug:   "tadami",
    cityName:   "只見町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07366",
    citySlug:   "kitashiobara",
    cityName:   "北塩原村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07368",
    citySlug:   "nishiaizu",
    cityName:   "西会津町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07369",
    citySlug:   "bandai",
    cityName:   "磐梯町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07370",
    citySlug:   "inawashiro",
    cityName:   "猪苗代町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07371",
    citySlug:   "aizubange",
    cityName:   "会津坂下町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07372",
    citySlug:   "yugawa",
    cityName:   "湯川村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07373",
    citySlug:   "yanaitsu",
    cityName:   "柳津町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07374",
    citySlug:   "mishimacho",
    cityName:   "三島町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07375",
    citySlug:   "kaneyama",
    cityName:   "金山町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07376",
    citySlug:   "showamura",
    cityName:   "昭和村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07381",
    citySlug:   "nishigo",
    cityName:   "西郷村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07382",
    citySlug:   "izumizaki",
    cityName:   "泉崎村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07383",
    citySlug:   "nakajima",
    cityName:   "中島村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07384",
    citySlug:   "yabuki",
    cityName:   "矢吹町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07401",
    citySlug:   "tanagura",
    cityName:   "棚倉町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07402",
    citySlug:   "yamatsuri",
    cityName:   "矢祭町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07403",
    citySlug:   "hanawa",
    cityName:   "塙町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07404",
    citySlug:   "samegawa",
    cityName:   "鮫川村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07421",
    citySlug:   "furudono",
    cityName:   "古殿町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07422",
    citySlug:   "ishikawa",
    cityName:   "石川町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07423",
    citySlug:   "tamakawa",
    cityName:   "玉川村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07424",
    citySlug:   "hirata",
    cityName:   "平田村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07425",
    citySlug:   "asakawa",
    cityName:   "浅川町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07441",
    citySlug:   "miharu",
    cityName:   "三春町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07442",
    citySlug:   "onomachi",
    cityName:   "小野町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07461",
    citySlug:   "hirono",
    cityName:   "広野町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07462",
    citySlug:   "naraha",
    cityName:   "楢葉町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07463",
    citySlug:   "tomiokacho",
    cityName:   "富岡町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07464",
    citySlug:   "kawauchi",
    cityName:   "川内村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07465",
    citySlug:   "okuma",
    cityName:   "大熊町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07466",
    citySlug:   "futaba",
    cityName:   "双葉町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07467",
    citySlug:   "namie",
    cityName:   "浪江町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07468",
    citySlug:   "katsurao",
    cityName:   "葛尾村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07481",
    citySlug:   "shinchi",
    cityName:   "新地町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07482",
    citySlug:   "iitate",
    cityName:   "飯舘村",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07501",
    citySlug:   "aizumisato",
    cityName:   "会津美里町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
  {
    cityCode:   "07561",
    citySlug:   "minamiaizu",
    cityName:   "南会津町",
    baseAmount: null,   // TODO: 公式サイトで確認
    status:     "needs_update",
    source: { url: null, retrievedAt: null },
  },
];
