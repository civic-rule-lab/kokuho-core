/**
 * 北海道 pref-spec 生成スクリプト
 * hokkaido_r7_hokenryoritsu.json → data/pref-specs/hokkaido.js
 */
import { writeFileSync } from "fs";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const src = require(path.join(__dirname, "..", "hokkaido_r7_hokenryoritsu.json"));

// 自治体名 → {cityCode, citySlug} マッピング
const META = {
  "札幌市":     { code: "01100", slug: "sapporo" },
  "函館市":     { code: "01202", slug: "hakodate" },
  "小樽市":     { code: "01203", slug: "otaru" },
  "旭川市":     { code: "01204", slug: "asahikawa" },
  "室蘭市":     { code: "01205", slug: "muroran" },
  "釧路市":     { code: "01206", slug: "kushiro" },
  "帯広市":     { code: "01207", slug: "obihiro" },
  "北見市":     { code: "01208", slug: "kitami" },
  "夕張市":     { code: "01209", slug: "yubari" },
  "岩見沢市":   { code: "01210", slug: "iwamizawa" },
  "網走市":     { code: "01211", slug: "abashiri" },
  "留萌市":     { code: "01212", slug: "rumoi" },
  "苫小牧市":   { code: "01213", slug: "tomakomai" },
  "稚内市":     { code: "01214", slug: "wakkanai" },
  "美唄市":     { code: "01215", slug: "bibai" },
  "芦別市":     { code: "01216", slug: "ashibetsu" },
  "江別市":     { code: "01217", slug: "ebetsu" },
  "赤平市":     { code: "01218", slug: "akabira" },
  "紋別市":     { code: "01219", slug: "monbetsu" },
  "士別市":     { code: "01220", slug: "shibetsu" },
  "名寄市":     { code: "01221", slug: "nayoro" },
  "三笠市":     { code: "01222", slug: "mikasa" },
  "根室市":     { code: "01223", slug: "nemuro" },
  "千歳市":     { code: "01224", slug: "chitose" },
  "滝川市":     { code: "01225", slug: "takikawa" },
  "砂川市":     { code: "01226", slug: "sunagawa" },
  "歌志内市":   { code: "01227", slug: "utashinai" },
  "深川市":     { code: "01228", slug: "fukagawa" },
  "富良野市":   { code: "01229", slug: "furano" },
  "登別市":     { code: "01230", slug: "noboribetsu" },
  "恵庭市":     { code: "01231", slug: "eniwa" },
  "伊達市":     { code: "01233", slug: "date" },
  "北広島市":   { code: "01234", slug: "kitahiroshima" },
  "石狩市":     { code: "01235", slug: "ishikari" },
  "北斗市":     { code: "01236", slug: "hokuto" },
  "当別町":     { code: "01303", slug: "tobetsu" },
  "新篠津村":   { code: "01304", slug: "shinshinotsu" },
  "松前町":     { code: "01331", slug: "matsumae" },
  "福島町":     { code: "01332", slug: "fukushima" },
  "知内町":     { code: "01333", slug: "shiriuchi" },
  "木古内町":   { code: "01334", slug: "kikonai" },
  "七飯町":     { code: "01337", slug: "nanae" },
  "鹿部町":     { code: "01343", slug: "shikabe" },
  "森町":       { code: "01345", slug: "mori" },
  "八雲町":     { code: "01346", slug: "yakumo" },
  "長万部町":   { code: "01347", slug: "oshamanbe" },
  "江差町":     { code: "01361", slug: "esashi" },
  "上ノ国町":   { code: "01362", slug: "kaminokuni" },
  "厚沢部町":   { code: "01363", slug: "assabu" },
  "乙部町":     { code: "01364", slug: "otobe" },
  "奥尻町":     { code: "01367", slug: "okushiri" },
  "せたな町":   { code: "01370", slug: "setana" },
  "今金町":     { code: "01371", slug: "imakane" },
  "島牧村":     { code: "01381", slug: "shimamaki" },
  "寿都町":     { code: "01382", slug: "suttsu" },
  "黒松内町":   { code: "01383", slug: "kuromatsunai" },
  "蘭越町":     { code: "01384", slug: "rankoshi" },
  "ニセコ町":   { code: "01385", slug: "niseko" },
  "真狩村":     { code: "01386", slug: "makkari" },
  "留寿都村":   { code: "01387", slug: "rusutsu" },
  "喜茂別町":   { code: "01388", slug: "kimobetsu" },
  "京極町":     { code: "01389", slug: "kyogoku" },
  "倶知安町":   { code: "01390", slug: "kutchan" },
  "共和町":     { code: "01391", slug: "kyowa" },
  "岩内町":     { code: "01392", slug: "iwanai" },
  "泊村":       { code: "01393", slug: "tomari" },
  "神恵内村":   { code: "01394", slug: "kamoenai" },
  "積丹町":     { code: "01395", slug: "shakotan" },
  "古平町":     { code: "01396", slug: "furubira" },
  "仁木町":     { code: "01397", slug: "niki" },
  "余市町":     { code: "01398", slug: "yoichi" },
  "赤井川村":   { code: "01399", slug: "akaiwa" },
  "南幌町":     { code: "01423", slug: "nanporo" },
  "奈井江町":   { code: "01424", slug: "naie" },
  "上砂川町":   { code: "01425", slug: "kamisunagawa" },
  "由仁町":     { code: "01426", slug: "yuni" },
  "長沼町":     { code: "01427", slug: "naganuma" },
  "栗山町":     { code: "01428", slug: "kuriyama" },
  "月形町":     { code: "01429", slug: "tsukigata" },
  "浦臼町":     { code: "01430", slug: "urausu" },
  "新十津川町": { code: "01431", slug: "shintotsu" },
  "妹背牛町":   { code: "01432", slug: "moseushi" },
  "秩父別町":   { code: "01433", slug: "chippubetsu" },
  "雨竜町":     { code: "01434", slug: "uryu" },
  "北竜町":     { code: "01435", slug: "hokuryu" },
  "沼田町":     { code: "01436", slug: "numata" },
  "幌加内町":   { code: "01438", slug: "horokanai" },
  "鷹栖町":     { code: "01452", slug: "takasu" },
  "当麻町":     { code: "01454", slug: "toma" },
  "比布町":     { code: "01455", slug: "pippu" },
  "愛別町":     { code: "01456", slug: "aibetsu" },
  "上川町":     { code: "01457", slug: "kamikawa" },
  "上富良野町": { code: "01462", slug: "kamifurano" },
  "中富良野町": { code: "01463", slug: "nakafurano" },
  "南富良野町": { code: "01464", slug: "minamifurano" },
  "占冠村":     { code: "01465", slug: "shimukappu" },
  "和寒町":     { code: "01468", slug: "wassamu" },
  "剣淵町":     { code: "01469", slug: "kembuchi" },
  "下川町":     { code: "01472", slug: "shimokawa" },
  "美深町":     { code: "01473", slug: "bifuka" },
  "音威子府村": { code: "01474", slug: "otoineppu" },
  "中川町":     { code: "01475", slug: "nakagawa" },
  "増毛町":     { code: "01481", slug: "mashike" },
  "小平町":     { code: "01482", slug: "obira" },
  "苫前町":     { code: "01483", slug: "tomamae" },
  "羽幌町":     { code: "01484", slug: "haboro" },
  "初山別村":   { code: "01485", slug: "shosanbetsu" },
  "遠別町":     { code: "01486", slug: "embetsu" },
  "天塩町":     { code: "01487", slug: "teshio" },
  "猿払村":     { code: "01511", slug: "sarobetsu" },
  "浜頓別町":   { code: "01512", slug: "hamatonbetsu" },
  "中頓別町":   { code: "01513", slug: "nakatonbetsu" },
  "枝幸町":     { code: "01514", slug: "esashi-hokkaido" },
  "豊富町":     { code: "01516", slug: "toyotomi" },
  "幌延町":     { code: "01517", slug: "horonobe" },
  "礼文町":     { code: "01518", slug: "rebun" },
  "利尻町":     { code: "01519", slug: "rishiri" },
  "利尻富士町": { code: "01520", slug: "rishirifuji" },
  "美幌町":     { code: "01541", slug: "bihoro" },
  "津別町":     { code: "01542", slug: "tsubetsu" },
  "斜里町":     { code: "01543", slug: "shari" },
  "大空町":     { code: "01544", slug: "ozora" },
  "清里町":     { code: "01545", slug: "kiyosato" },
  "小清水町":   { code: "01546", slug: "koshimizu" },
  "訓子府町":   { code: "01548", slug: "kunneppu" },
  "置戸町":     { code: "01549", slug: "oketo" },
  "佐呂間町":   { code: "01551", slug: "saroma" },
  "遠軽町":     { code: "01555", slug: "engaru" },
  "湧別町":     { code: "01559", slug: "yubetsu" },
  "滝上町":     { code: "01560", slug: "takinoue" },
  "興部町":     { code: "01561", slug: "okoppe" },
  "西興部村":   { code: "01562", slug: "nishiokoppe" },
  "雄武町":     { code: "01563", slug: "omu" },
  "豊浦町":     { code: "01571", slug: "toyoura" },
  "壮瞥町":     { code: "01572", slug: "sobetsu" },
  "洞爺湖町":   { code: "01576", slug: "toyako" },
  "白老町":     { code: "01581", slug: "shiraoi" },
  "安平町":     { code: "01584", slug: "abira" },
  "厚真町":     { code: "01585", slug: "atsuma" },
  "むかわ町":   { code: "01587", slug: "mukawa" },
  "平取町":     { code: "01601", slug: "biratori" },
  "日高町":     { code: "01604", slug: "hidaka" },
  "新冠町":     { code: "01605", slug: "niikappu" },
  "新ひだか町": { code: "01607", slug: "shinhidaka" },
  "浦河町":     { code: "01608", slug: "urakawa" },
  "様似町":     { code: "01609", slug: "samani" },
  "えりも町":   { code: "01610", slug: "erimo" },
  "音更町":     { code: "01631", slug: "otofuke" },
  "士幌町":     { code: "01632", slug: "shihoro" },
  "上士幌町":   { code: "01633", slug: "kamishihoro" },
  "鹿追町":     { code: "01634", slug: "shikaoibetsu" },
  "新得町":     { code: "01635", slug: "shintoku" },
  "清水町":     { code: "01636", slug: "shimizu" },
  "芽室町":     { code: "01637", slug: "memuro" },
  "中札内村":   { code: "01638", slug: "nakasatsunai" },
  "更別村":     { code: "01639", slug: "sarabetsu" },
  "大樹町":     { code: "01641", slug: "taiki" },
  "広尾町":     { code: "01642", slug: "hiroo" },
  "幕別町":     { code: "01643", slug: "makubetsu" },
  "池田町":     { code: "01644", slug: "ikeda" },
  "豊頃町":     { code: "01645", slug: "toyokoro" },
  "本別町":     { code: "01646", slug: "honbetsu" },
  "足寄町":     { code: "01647", slug: "ashoro" },
  "陸別町":     { code: "01648", slug: "rikubetsu" },
  "浦幌町":     { code: "01649", slug: "urahoro" },
  "釧路町":     { code: "01661", slug: "kushiro-town" },
  "厚岸町":     { code: "01662", slug: "akkeshi" },
  "浜中町":     { code: "01663", slug: "hamanaka" },
  "標茶町":     { code: "01664", slug: "shibecha" },
  "弟子屈町":   { code: "01665", slug: "teshikaga" },
  "鶴居村":     { code: "01667", slug: "tsurui" },
  "白糠町":     { code: "01668", slug: "shiranuka" },
  "別海町":     { code: "01691", slug: "betsukai" },
  "中標津町":   { code: "01692", slug: "nakashibetsu" },
  "標津町":     { code: "01693", slug: "shibetsu-hokkaido" },
  "羅臼町":     { code: "01694", slug: "rausu" },
};

// 重複slugチェック
const slugs = Object.values(META).map(m => m.slug);
const dupes = slugs.filter((s, i) => slugs.indexOf(s) !== i);
if (dupes.length) console.warn("⚠️ Duplicate slugs:", dupes);

const municipalities = src.municipalities
  .filter(m => m.name !== "大雪地区広域連合チクレンゴウ");

const lines = [];
lines.push(`export const PREF_NAME = "北海道";`);
lines.push(``);
lines.push(`// 北海道 令和7年度 国民健康保険料率`);
lines.push(`// 出典: 北海道 道内市町村の国民健康保険料（税）率について`);
lines.push(`// https://www.pref.hokkaido.lg.jp/hf/kki/kokuho_hokennryouzeiritu.html`);
lines.push(`// ※ 各市町村が実際に設定した保険料率（R7実際値）`);
lines.push(`// ※ 資産割あり: ${municipalities.filter(m => m.r7_iryou.shisan_wari > 0).map(m=>m.name).join("、")}`);
lines.push(``);
lines.push(`export const MUNICIPALITIES = [`);

let skipped = 0;
for (const m of municipalities) {
  const meta = META[m.name];
  if (!meta) {
    console.warn(`⚠️ No meta for: ${m.name}`);
    skipped++;
    continue;
  }

  const i = m.r7_iryou;
  const s = m.r7_shienkin;
  const k = m.r7_kaigo;

  const hasAsset = i.shisan_wari > 0 || s.shisan_wari > 0 || k.shisan_wari > 0;

  // 資産割をパーセントから小数に変換
  const assetLine = hasAsset
    ? `    assetLevy: { medical: ${(i.shisan_wari/100).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}, support: ${(s.shisan_wari/100).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}, care: ${(k.shisan_wari/100).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")} },`
    : null;

  const baseNote = m.name === "札幌市" ? "政令市。区ごとに窓口が異なるが保険料率は市全体で統一。"
    : m.name === "旭川市" ? "中核市。"
    : null;
  const note = hasAsset
    ? (baseNote ? baseNote + "4方式（所得割+資産割+均等割+平等割）" : "4方式（所得割+資産割+均等割+平等割）")
    : baseNote;

  lines.push(`  {`);
  lines.push(`    cityCode: "${meta.code}", citySlug: "${meta.slug}", cityName: "${m.name}",`);
  if (note) lines.push(`    note: "${note}",`);
  lines.push(`    caps: { medical: 660000, support: 260000, care: 170000 },`);
  if (assetLine) lines.push(assetLine);
  lines.push(`    rates: {`);
  lines.push(`      rate:      { medical: ${i.shotoku_wari/100}, support: ${s.shotoku_wari/100}, care: ${k.shotoku_wari/100} },`);
  lines.push(`      perCapita: { medical: ${i.kintou_wari},  support: ${s.kintou_wari},  care: ${k.kintou_wari} },`);
  lines.push(`      household: { medical: ${i.byodou_wari},  support: ${s.byodou_wari},  care: ${k.byodou_wari} },`);
  lines.push(`    },`);
  lines.push(`  },`);
}

lines.push(`];`);
lines.push(``);

const out = path.join(__dirname, "..", "data", "pref-specs", "hokkaido.js");
writeFileSync(out, lines.join("\n"), "utf-8");
console.log(`✅ data/pref-specs/hokkaido.js 生成完了 (${municipalities.length - skipped} 自治体, スキップ: ${skipped})`);
