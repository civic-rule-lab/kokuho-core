/**
 * 介護保険料（第1号）実値突合テスト
 * 実行: node scripts/test-kaigo-verify.js
 *
 * 国保の test-calc-verify.js と同型。2層で検証する:
 *   A. 実値突合（出典あり）: 自治体の公式公表「段階別保険料額」をハードコードし、
 *      その段階に入るサンプル所得コンテキストでエンジン出力（level/annual/monthly）が
 *      公式値と一致するか確認する。baseAmount・係数・所得境界の誤りを検出。
 *   B. 段階判定スイープ（全 verified/inferred 自治体）: 各 bracket の criteria から
 *      代表コンテキストを生成し、エンジンが「その段階」を返すか（gap/overlap 検出）と
 *      annual == round(baseAmount×rate) を全段階で確認する。
 *
 * 富山パイロット等で基準額を収集したら CASES に公式段階別額を追記していく。
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { calculateKaigo } = require("./lib/kaigo-loader.cjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data", "municipalities");

let pass = 0, fail = 0;
function eq(label, actual, expected, extra = "") {
  if (actual === expected) { pass++; }
  else { fail++; console.log(`  ❌ ${label}\n     期待=${expected} 実際=${actual} ${extra}`); }
}

function loadKaigo(slug) {
  const p = path.join(DATA, slug, "kaigo-2026.json");
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf-8")) : null;
}

// criteria から「その段階に入る」代表 memberContext を生成
function ctxFromCriteria(c = {}) {
  const pickIn = (min, max) =>
    (min != null && max != null) ? Math.floor((min + max) / 2)
    : (max != null) ? max
    : (min != null) ? min
    : 0;
  return {
    pensionIncome: pickIn(c.pensionIncomeMin, c.pensionIncomeMax),
    totalIncome:   pickIn(c.totalIncomeMin, c.totalIncomeMax),
    sumIncome:     pickIn(c.sumIncomeMin, c.sumIncomeMax),
    isSelfTaxable:            c.selfTaxable ?? false,
    isHouseholdAllNonTaxable: c.householdAllNonTaxable ?? false,
  };
}

// ─── A. 実値突合（公式公表の段階別額） ─────────────────────────────
// monthly は各市の公式公表値。annual はその ×12。
// 出典は data の source.url（retrievedAt 時点）。標準9段階。
const CASES = [
  // ── 和歌山県(2026-06-23 横展開・独立転記。全30独立保険者・レバーなし) ──
  {
    slug: "wakayama", name: "和歌山市", source: "city.wakayama.wakayama.jp",
    // 15段・独自境界(第9=320-400万・第13/14=800/1000万)。
    levels: [
      { level: "1",  annual: 23250,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 81600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 97920,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 138720, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "15", annual: 212160, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "kainan", name: "海南市", source: "city.kainan.lg.jp",
    // 14段・★第2=0.41独自・第4=0.879・第14=820万以上。
    levels: [
      { level: "1",  annual: 20500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 72000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 86400,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 180000, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "gobo", name: "御坊市", source: "city.gobo.lg.jp(県内最高基準)",
    // 15段・基準93600(県内最高)・独自境界(第13=720-850・第15=1000万)。
    levels: [
      { level: "1",  annual: 26676,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 93600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 112320, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 224640, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
      { level: "15", annual: 243360, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "kinokawa", name: "紀の川市", source: "city.kinokawa.lg.jp",
    // 15段・★第2=0.44独自・独自境界(第8/9/10=720-820/820-920/920万)。
    levels: [
      { level: "1",  annual: 22800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 80000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 93600,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "10", annual: 152000, ctx: { isSelfTaxable: true, totalIncome: 4500000 } },
      { level: "15", annual: 212000, ctx: { isSelfTaxable: true, totalIncome: 10000000 } },
    ],
  },
  {
    slug: "shirahama", name: "白浜町", source: "town.shirahama.wakayama.jp",
    // 14段・★第6=80万未満/第7=80-120万の独自細分。
    levels: [
      { level: "1",  annual: 24600,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 86400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 99400,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 103700, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 207400, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 奈良県(2026-06-23 横展開・独立転記。全39独立保険者・レバーなし) ──
  {
    slug: "nara", name: "奈良市", source: "city.nara.lg.jp(中核市)",
    // 18段・★第1-3独自軽減0.285/0.445/0.645・高所得800/1000/1200/1500/2000万独自細分。
    levels: [
      { level: "1",  annual: 21300,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 74600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 85800,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 112000, ctx: { isSelfTaxable: true, totalIncome: 2700000 } },
      { level: "18", annual: 216500, ctx: { isSelfTaxable: true, totalIncome: 25000000 } },
    ],
  },
  {
    slug: "gojo", name: "五條市", source: "city.gojo.lg.jp",
    // 13段・★第1-3独自0.30/0.45/0.70・独自境界320/400/600/800/1000万。
    levels: [
      { level: "1",  annual: 23760,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 95040,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 126720, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "13", annual: 166320, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "kashihara", name: "橿原市", source: "city.kashihara.nara.jp",
    // 16段・基準58500(県内最低)・第4=0.85・高所得820/920/1020万。
    levels: [
      { level: "1",  annual: 16700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 58500,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 70300,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "12", annual: 134700, ctx: { isSelfTaxable: true, totalIncome: 6700000 } },
      { level: "13", annual: 140600, ctx: { isSelfTaxable: true, totalIncome: 7700000 } },
      { level: "16", annual: 158200, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "heguri", name: "平群町", source: "town.heguri.nara.jp",
    // 17段・★独自境界170/220/270/370万で50万刻み細分。
    levels: [
      { level: "1",  annual: 19100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 67300,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 80700,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 87400,  ctx: { isSelfTaxable: true, totalIncome: 2000000 } },
      { level: "17", annual: 174900, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "kamimaki", name: "上牧町", source: "town.kanmaki.nara.jp",
    // 16段・★独自境界160/250/350万。
    levels: [
      { level: "1",  annual: 19800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 69600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 80000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 97400,  ctx: { isSelfTaxable: true, totalIncome: 2300000 } },
      { level: "16", annual: 167000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "tenkawa", name: "天川村", source: "vill.tenkawa.nara.jp(県内最高基準)",
    // 13段(国標準)・基準93600(県内最高)。
    levels: [
      { level: "1",  annual: 26676,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 93600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 112320, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 224640, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 三重県(2026-06-23 横展開・独立転記。広域連合レバー=鈴鹿亀山/紀北/紀南) ──
  {
    slug: "asahicho", name: "朝日町", source: "town.asahi.mie.jp 計画PDF p105(スクショ確定)",
    // 13段(国標準)・基準67200・第1-3軽減後・全段=基準×乗率。
    levels: [
      { level: "1",  annual: 19152,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 67200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 80640,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 161280, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "yokkaichi", name: "四日市市", source: "city.yokkaichi.lg.jp",
    // 15段・★第1-3独自軽減0.26/0.39/0.66・第4=0.88・高所得820/1000万。
    levels: [
      { level: "1",  annual: 16536,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 63600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 75048,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 184440, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "ise", name: "伊勢市", source: "city.ise.mie.jp",
    // 14段・★第1-2独自0.28/0.40・独自境界第6=60万未満/第7=60-120万。
    levels: [
      { level: "1",  annual: 22562,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 80580,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 92667,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 96696,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 193392, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "matsusaka", name: "松阪市", source: "city.matsusaka.mie.jp(公式HTML)",
    // 16段・★第1-3松阪独自軽減0.25/0.40/0.55・独自境界80/125万始まり・1000/1300万。
    levels: [
      { level: "1",  annual: 20940,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 83760,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 104700, ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "8",  annual: 121452, ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "16", annual: 234528, ctx: { isSelfTaxable: true, totalIncome: 14000000 } },
    ],
  },
  {
    slug: "tsu", name: "津市", source: "info.city.tsu.mie.jp",
    // 13段・独自境界250/500/750万。
    levels: [
      { level: "1",  annual: 21690,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 77470,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 92960,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 116200, ctx: { isSelfTaxable: true, totalIncome: 2300000 } },
      { level: "13", annual: 178180, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "kumanoshi", name: "熊野市(紀南介護保険広域連合)", source: "kinankaigokouiki.jp",
    // 紀南広域(熊野/御浜/紀宝)統一13段・基準86640(月7220)。
    levels: [
      { level: "1",  annual: 24690,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 86640,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 103960, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 207930, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "suzuka", name: "鈴鹿市(鈴鹿亀山地区広域連合)", source: "city.suzuka.lg.jp",
    // 鈴鹿亀山広域(鈴鹿/亀山)統一13段・基準75060(月6255)。
    levels: [
      { level: "1",  annual: 21390,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75060,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90070,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 180140, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 京都府(2026-06-22 横展開・独立転記) ──
  {
    slug: "kyoto", name: "京都市", source: "city.kyoto.lg.jp(政令市・公式HTML)",
    // 14段・政令市・第2=0.43/第4=0.9・高所得125/190/400/550/700/850/1000/1150万独自境界。
    levels: [
      { level: "1",  annual: 24487,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 85920,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 94512,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 137472, ctx: { isSelfTaxable: true, totalIncome: 3000000 } },
      { level: "14", annual: 266352, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "ide", name: "井手町", source: "town.ide.kyoto.jp(公式HTML直接確認)",
    // 16段・★第3=0.698/第4=0.95/第6=1.35/第7=1.37独自(急峻)・第6境界125万。
    levels: [
      { level: "1",  annual: 21194,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 51907,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 74364,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 100392, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 101879, ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "16", annual: 189629, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "joyo", name: "城陽市", source: "city.joyo.kyoto.jp",
    // 18段(府内最多)・基準65730(府内最低)・高所得125/200/300〜1500/2000万独自境界。
    levels: [
      { level: "1",  annual: 15450,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 65730,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 73950,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "18", annual: 216910, ctx: { isSelfTaxable: true, totalIncome: 25000000 } },
    ],
  },
  {
    slug: "kasagi", name: "笠置町", source: "town.kasagi.lg.jp(条例)",
    // 13段・府内最高基準85680・令第38条独自基準所得で境界120/200/250/300/350/450/600万。
    levels: [
      { level: "1",  annual: 39000,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 85680,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 111480, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 240000, ctx: { isSelfTaxable: true, totalIncome: 7000000 } },
    ],
  },
  {
    slug: "miyazu", name: "宮津市", source: "city.miyazu.kyoto.jp",
    // 15段・★第1=0.25/第2=0.45/第4=0.85・独自境界125/210/320/400/500/650/800/900/1000万。
    levels: [
      { level: "1",  annual: 18450,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 73770,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 88520,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 173350, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  // ── 滋賀県(2026-06-22 横展開・独立転記) ──
  {
    slug: "koka", name: "甲賀市", source: "city.koka.lg.jp PDF(スクショ確定)",
    // 14段・★第1=0.28/第2=0.38/第4=0.87/第6=1.13/第7=1.25独自・課税125万境界。
    levels: [
      { level: "1",  annual: 19956,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 27084,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 71280,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 80544,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 89100,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "9",  annual: 124740, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "14", annual: 185328, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "toyosato", name: "豊郷町", source: "town.toyosato.shiga.jp(スクショ確定)",
    // 13段・国標準・基準80400。
    levels: [
      { level: "1",  annual: 22920,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 80400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 96480,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 192960, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "otsu", name: "大津市", source: "city.otsu.lg.jp",
    // 中核市・第4=0.80・独自境界100/125/200/350/500/750/1000万・独自乗率。
    levels: [
      { level: "1",  annual: 19545,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 68580,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 77495,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 82296,  ctx: { isSelfTaxable: true, totalIncome: 1100000 } },
      { level: "13", annual: 162191, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "nagahama", name: "長浜市", source: "city.nagahama.lg.jp",
    // ★第1=0.255/第2=0.435独自軽減・課税80万境界。
    levels: [
      { level: "1",  annual: 20090,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 34290,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 78840,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90660,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 94600,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 181330, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "moriyama", name: "守山市", source: "city.moriyama.lg.jp",
    // 独自境界125/190/290/400/500/600/700万。
    levels: [
      { level: "1",  annual: 20178,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 70800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84960,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 106200, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "13", annual: 169920, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "konanshi", name: "湖南市", source: "city.shiga-konan.lg.jp",
    // 15段・独自境界125/200/350/450/590/680/750/1000/1500万。
    levels: [
      { level: "1",  annual: 20892,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 73320,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84324,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 108516, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "15", annual: 175968, ctx: { isSelfTaxable: true, totalIncome: 16000000 } },
    ],
  },
  {
    slug: "maibara", name: "米原市", source: "city.maibara.lg.jp",
    // ★第1=0.275/第2=0.48独自軽減・独自境界45/120/210/320/410/500/590/680万。
    levels: [
      { level: "1",  annual: 22800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 39840,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 82800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 95280,  ctx: { isSelfTaxable: true, totalIncome: 300000 } },
      { level: "7",  annual: 99360,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 198720, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "aisho", name: "愛荘町", source: "town.aisho.shiga.jp",
    // ★第6=1.30始まり独自乗率。
    levels: [
      { level: "1",  annual: 20178,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 70800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 92040,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 99120,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "13", annual: 152220, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kora", name: "甲良町", source: "kouratown.jp",
    // 県内最高基準額・第6-7独自乗率1.25/1.45。
    levels: [
      { level: "1",  annual: 24624,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 86400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 108000, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 125280, ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "13", annual: 207360, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "hinocho", name: "日野町", source: "town.shiga-hino.lg.jp",
    // 15段・第2軽減後0.45・第4=0.88。
    levels: [
      { level: "1",  annual: 21204,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 33480,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 74400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84072,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 193440, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "ryuo", name: "竜王町", source: "town.ryuoh.shiga.jp",
    // 低段は月額丸め×12。
    levels: [
      { level: "1",  annual: 20184,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 70800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84960,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 169920, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 兵庫県(2026-06-22 横展開・独立転記) ──
  {
    slug: "kobe", name: "神戸市", source: "city.kobe.lg.jp あらまし第9期",
    // 15段・基準78960・★第1-3独自軽減0.235/0.435/0.685・独自境界120/190/290/400…1000万。
    levels: [
      { level: "1",  annual: 18556,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 34348,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "3",  annual: 53693,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "4",  annual: 71064,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 78960,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90804,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 97911,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "8",  annual: 116072, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "15", annual: 225036, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "amagasaki", name: "尼崎市", source: "city.amagasaki.hyogo.jp",
    levels: [
      { level: "1",  annual: 25627,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 89916,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 107900, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 215799, ctx: { isSelfTaxable: true, totalIncome: 7500000 } },
      { level: "18", annual: 260757, ctx: { isSelfTaxable: true, totalIncome: 13000000 } },
    ],
  },
  {
    slug: "akashi", name: "明石市", source: "city.akashi.lg.jp",
    // 16段・★課税60万境界。
    levels: [
      { level: "1",  annual: 21204,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 74400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 78120,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 87792,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "10", annual: 111600, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "16", annual: 186000, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "aioi", name: "相生市", source: "city.aioi.lg.jp 条例第4条",
    // 14段・第2=0.45/第4=0.85・★課税60万境界。
    levels: [
      { level: "1",  annual: 18126,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 28620,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "4",  annual: 54060,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 63600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 73140,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 76320,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 82680,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "14", annual: 152640, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "tamba", name: "丹波市", source: "city.tamba.lg.jp",
    // ★第1-2独自強化軽減 0.18/0.38。
    levels: [
      { level: "1",  annual: 12830,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 27080,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 71280,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 85530,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 206710, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "sayo", name: "佐用町", source: "town.sayo.lg.jp 条例第5条",
    // ★第2独自軽減後0.37(30636)・第4=0.83(68724)。
    levels: [
      { level: "1",  annual: 23598,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 30636,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "4",  annual: 68724,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 82800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 99360,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 198720, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "awaji", name: "淡路市", source: "city.awaji.lg.jp",
    // ★第7=1.35/第9=1.85 独自乗率。
    levels: [
      { level: "1",  annual: 19200,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 67200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "7",  annual: 90720,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "9",  annual: 124320, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "13", annual: 161280, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "inami", name: "稲美町", source: "town.hyogo-inami.lg.jp",
    // ★課税独自境界320/400/600/800/1000万。
    levels: [
      { level: "1",  annual: 17442,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 61200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "8",  annual: 97920,  ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "9",  annual: 110160, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "13", annual: 140760, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "yabu", name: "養父市", source: "city.yabu.hyogo.jp 条例",
    // ★課税独自乗率1.4/1.6/1.8/2.0/2.2/2.4/2.5。
    levels: [
      { level: "1",  annual: 23940,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 84000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "7",  annual: 117600, ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "13", annual: 210000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kawanishi", name: "川西市", source: "city.kawanishi.hyogo.jp",
    // ★課税135万境界。
    levels: [
      { level: "1",  annual: 20100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 70560,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84672,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 91728,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "17", annual: 190512, ctx: { isSelfTaxable: true, totalIncome: 25000000 } },
    ],
  },
  {
    slug: "taka", name: "多可町", source: "town.taka.lg.jp",
    // 第13=190080(出典転記ミス166320を是正)。
    levels: [
      { level: "1",  annual: 22572,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 95040,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 190080, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 大阪府(2026-06-22 横展開・独立転記) ──
  {
    slug: "osaka", name: "大阪市", source: "city.osaka.lg.jp .../R6_p31.pdf(2026-06-22スクショ確定)",
    // 官15段(統合後14br)・基準110988・base@官第6。標準5低段(世帯非課税3バンド0.335/0.485/0.685・本人非課税0.85/1.00)。課税≤125万始まり。
    levels: [
      { level: "1",  annual: 37181,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 53830,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "3",  annual: 76027,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "4",  annual: 94340,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 110988, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 122087, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 138735, ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "13", annual: 288569, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
      { level: "14", annual: 332964, ctx: { isSelfTaxable: true, totalIncome: 16000000 } },
    ],
  },
  {
    slug: "ibaraki", name: "茨木市", source: "city.ibaraki.osaka.jp 条例第10条",
    // 23段・基準77760。第6=80万未満始まり。
    levels: [
      { level: "1",  annual: 22162,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 77760,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 83592,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "11", annual: 115862, ctx: { isSelfTaxable: true, totalIncome: 2300000 } },
      { level: "23", annual: 225504, ctx: { isSelfTaxable: true, totalIncome: 35000000 } },
    ],
  },
  {
    slug: "suita", name: "吹田市", source: "city.suita.osaka.jp/.../1034224.html",
    // 20段・基準75360。第6=60万未満始まり。
    levels: [
      { level: "1",  annual: 21478,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75360,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 81012,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "11", annual: 118315, ctx: { isSelfTaxable: true, totalIncome: 2300000 } },
      { level: "20", annual: 263760, ctx: { isSelfTaxable: true, totalIncome: 30000000 } },
    ],
  },
  {
    slug: "tondabayashi", name: "富田林市", source: "city.tondabayashi.lg.jp .../96710.pdf",
    // 官19段(統合後18br)・基準83120(base@官第6)。第3=0.45独自・課税125/200/300…万。
    levels: [
      { level: "1",  annual: 23680,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 37400,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "3",  annual: 56930,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "4",  annual: 70650,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 83120,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 91430,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 103900, ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "18", annual: 207800, ctx: { isSelfTaxable: true, totalIncome: 15000000 } },
    ],
  },
  {
    slug: "settsu", name: "摂津市", source: "city.settsu.osaka.jp/.../1981.html",
    // 17段・基準77880。第2=0.45。★課税70万未満始まり・70/150/250万独自。
    levels: [
      { level: "1",  annual: 22200,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 77880,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 93456,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 97356,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "17", annual: 186912, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "kanan", name: "河南町", source: "town.kanan.osaka.jp .../reiwa6kaigohokennryo.pdf",
    // 17段・基準(軽減前)73433・第4(0.85)/第5(0.95)も軽減=軽減後69760。
    levels: [
      { level: "1",  annual: 20930,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "4",  annual: 62420,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 69760,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 88120,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "17", annual: 205630, ctx: { isSelfTaxable: true, totalIncome: 25000000 } },
    ],
  },
  {
    slug: "chihayaakasaka", name: "千早赤阪村", source: "vill.chihayaakasaka.osaka.jp .../0329.pdf",
    // 15段・府内最低基準額55990。410/500/590/680/770/860万独自境界。
    levels: [
      { level: "1",  annual: 15960,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 55990,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 67190,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 95180,  ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "15", annual: 145570, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "moriguchi", name: "守口市", source: "city.moriguchi.osaka.jp .../dai9ki_kaigodankai_reiwa7.pdf",
    // 16段・基準107640(くすのき解散後単独)。1020万まで細分。
    levels: [
      { level: "1",  annual: 30680,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 107640, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 129170, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "16", annual: 290630, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "osakasayama", name: "大阪狭山市", source: "city.osakasayama.osaka.jp .../hokenryou.pdf",
    // 14段・基準76080。170/620/820/1020万独自境界。
    levels: [
      { level: "1",  annual: 21683,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 76080,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "7",  annual: 91296,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "14", annual: 190200, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "takaishi", name: "高石市", source: "city.takaishi.lg.jp .../kaigohokenryou2024-26.pdf",
    // 13段・基準73640。第2=0.385。第9=1.75/400万独自。
    levels: [
      { level: "1",  annual: 20980,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 73640,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "9",  annual: 128870, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "10", annual: 147280, ctx: { isSelfTaxable: true, totalIncome: 4500000 } },
      { level: "13", annual: 176730, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "sennan", name: "泉南市", source: "city.sennan.lg.jp .../1455013607623.html",
    // 14段・基準75000。第2=0.40。★課税80万未満始まり・450/800万独自・高位乗率2.8/3.3。
    levels: [
      { level: "1",  annual: 21375,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90000,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "13", annual: 210000, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
      { level: "14", annual: 247500, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "gifu", name: "岐阜市", source: "city.gifu.lg.jp .../1004834.html",
    // 第9期 基準額 年82,800円・13段階。第1〜5合算所得(sumIncome)・第6〜13合計所得。第1-3軽減後。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 23500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 56700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 82800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 99300,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 107600, ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "13", annual: 198700, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "minokamo", name: "美濃加茂市", source: "city.minokamo.lg.jp .../17793.pdf",
    // 第9期 基準額 年67,200円・16段階。第6〜16合計所得120/210/320/420/520/620/720/800/900/1000万。
    levels: [
      { level: "1",  annual: 19150,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 67200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 73920,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "16", annual: 181440, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "kani", name: "可児市", source: "city.kani.lg.jp/2796.htm",
    // 第9期 基準額 年68,400円・17段階。第1-3は可児市独自軽減後(0.25/0.40/0.65)。第6〜17合計所得120/210/320/420/520/620/720/800/900/1000/1500万。
    levels: [
      { level: "1",  annual: 17100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 44460,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 68400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 75240,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "17", annual: 194940, ctx: { isSelfTaxable: true, totalIncome: 20000000 } },
    ],
  },
  {
    slug: "seki", name: "関市", source: "city.seki.lg.jp/0000000692.html",
    // 第9期 基準額 年68,400円・14段階。第6境界が独自(82.65万未満)。境界82.65/125/200/290/400/540/700/1000万。
    levels: [
      { level: "1",  annual: 17100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 68400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 71820,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 75240,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 171000, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "mizuhoshi", name: "瑞穂市(もとす広域連合)", source: "motosu-union.gifu.jp/care/about",
    // 第9期 基準額 年72,200円・13段階(広域連合共通)。第6境界125万・第8=210〜400万。境界125/210/400/500/600/700/800万。
    levels: [
      { level: "1",  annual: 20500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 72200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 83000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 108300, ctx: { isSelfTaxable: true, totalIncome: 3000000 } },
      { level: "13", annual: 158900, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "gero", name: "下呂市", source: "city.gero.lg.jp .../28088_59487_misc.pdf",
    // 第9期 基準額 年57,600円・13段。第1-3は下呂独自軽減後(0.29/0.49/0.69)。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 16700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 39740,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 57600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 69120,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 138240, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "shirakawamura", name: "白川村", source: "g-reiki.net/shirakawa-go .../i390RG00000394.html (条例第2条)",
    // 第9期 基準額 年70,800円・13段。★第9(320-420万)と第10(420-520万)が同額134,520(共に×1.90)。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 20180,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 70800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84960,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 134520, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "10", annual: 134520, ctx: { isSelfTaxable: true, totalIncome: 4500000 } },
      { level: "13", annual: 169920, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kawasaki", name: "川崎市", source: "city.kawasaki.jp .../hokenryoudankai202508.pdf",
    // 第9期 基準額 年79,090円・19段階(第1=生保/老齢福祉と第2=非課税≤82.65万が同額→level1統合)。
    // 第1〜6は合算所得(sumIncome)、第7〜19は合計所得(totalIncome)。境界R8=82.65万。
    levels: [
      { level: "1",  annual: 22540,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 30210,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "4",  annual: 52990,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 71180,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "6",  annual: 79090,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "7",  annual: 90960,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 118640, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "19", annual: 261020, ctx: { isSelfTaxable: true, totalIncome: 35000000 } },
    ],
  },
  {
    slug: "yokohama", name: "横浜市", source: "city.yokohama.lg.jp .../0018_20250616.pdf",
    // 第9期 基準額 年79,440円・19段階(第1/第2同額→level1統合)。第1〜6合算所得・第7〜19算定用所得。
    levels: [
      { level: "1",  annual: 15880,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 27000,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 71490,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "6",  annual: 79440,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "7",  annual: 85000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "11", annual: 123130, ctx: { isSelfTaxable: true, totalIncome: 3000000 } },
      { level: "19", annual: 278040, ctx: { isSelfTaxable: true, totalIncome: 35000000 } },
    ],
  },
  {
    slug: "sagamihara", name: "相模原市", source: "city.sagamihara.kanagawa.jp .../1006995.html",
    // 第9期 基準額 年79,800円・14段階。第1〜5合算所得・第6〜14合計所得。境界R8=82.65万。
    levels: [
      { level: "1",  annual: 22700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 38700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 79800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 87800,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 199500, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "chigasaki", name: "茅ヶ崎市", source: "city.chigasaki.kanagawa.jp .../1004180.html",
    // 第9期 基準額 年64,560円・16段階。第1〜5合算所得・第6〜16合計所得。境界R8=82.65万。
    levels: [
      { level: "1",  annual: 18400,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 44224,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 64560,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 74244,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 103296, ctx: { isSelfTaxable: true, totalIncome: 4000000 } },
      { level: "16", annual: 167856, ctx: { isSelfTaxable: true, totalIncome: 40000000 } },
    ],
  },
  {
    slug: "toyama", name: "富山市", source: "city.toyama.lg.jp .../hokenryou2026.pdf",
    // 第9期 基準額 年79,200円・14段階。第1〜5は合算所得(sumIncome)、第6〜14は合計所得(totalIncome)。
    // annual は富山市公表値（百円丸め・基準額×係数とは一致しない段階あり）。
    levels: [
      { level: "1",  annual: 19800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 35700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "3",  annual: 54300,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "4",  annual: 67400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 91100,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 95100,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 103000, ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "9",  annual: 118800, ctx: { isSelfTaxable: true, totalIncome: 3000000 } },
      { level: "10", annual: 134700, ctx: { isSelfTaxable: true, totalIncome: 4100000 } },
      { level: "11", annual: 150500, ctx: { isSelfTaxable: true, totalIncome: 5000000 } },
      { level: "12", annual: 166400, ctx: { isSelfTaxable: true, totalIncome: 5500000 } },
      { level: "13", annual: 182200, ctx: { isSelfTaxable: true, totalIncome: 6500000 } },
      { level: "14", annual: 190100, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "takaoka", name: "高岡市", source: "city.takaoka.toyama.jp .../3768.html",
    // 基準額77,900円・13段階。第1〜5は80.9万/120万しきい値（sumIncome）。第6〜13は合計所得120/200/300/400/500/600/700万。
    levels: [
      { level: "1",  annual: 23400,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 39000,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "3",  annual: 50600,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "4",  annual: 70100,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 77900,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 89600,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 97400,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "8",  annual: 116900, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "13", annual: 167500, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "himi", name: "氷見市", source: "city.himi.toyama.jp .../659.html",
    // 基準額71,500円・13段階。第1〜3は軽減後。82.65万/120万しきい値。第6〜13は合計所得120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 20000,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 48900,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 71500,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 85800,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 107200, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "13", annual: 164400, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "uozu", name: "魚津市", source: "city.uozu.toyama.jp .../servno=609",
    // 基準額75,540円・13段階。第6〜13の合計所得境界が独自(120/210/250/320/400/590/700万)。
    levels: [
      { level: "1",  annual: 22660,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75540,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "8",  annual: 113310, ctx: { isSelfTaxable: true, totalIncome: 2300000 } },
      { level: "9",  annual: 128410, ctx: { isSelfTaxable: true, totalIncome: 2800000 } },
      { level: "11", annual: 143520, ctx: { isSelfTaxable: true, totalIncome: 5000000 } },
      { level: "13", annual: 158630, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "imizu", name: "射水市", source: "city.imizu.toyama.jp .../142657.pdf",
    // 基準額75,000円・16段階。第6以降の合計所得境界125/190/210/250/290/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 18700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 93700,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "8",  annual: 108700, ctx: { isSelfTaxable: true, totalIncome: 2000000 } },
      { level: "11", annual: 135000, ctx: { isSelfTaxable: true, totalIncome: 3000000 } },
      { level: "16", annual: 165000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "tonami", name: "砺波市（砺波組合）", source: "pci-area.tonami.toyama.jp .../hokenryou2024.pdf",
    // 砺波地方介護保険組合（砺波/小矢部/南砺）。基準額73,200円・13段階。80.9万/120万しきい値。
    levels: [
      { level: "1",  annual: 20900,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 25700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 73200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 87800,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 175600, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kamiichi", name: "上市町（中新川広域）", source: "union.nakaniikawa.toyama.jp .../497da853...pdf",
    // 中新川広域（上市/立山/舟橋）。基準額75,100円・13段階。80.9万/120万しきい値。
    levels: [
      { level: "1",  annual: 18800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 51500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 75100,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 86400,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 180300, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "namerikawa", name: "滑川市", source: "city.namerikawa.toyama.jp .../577.html",
    // 基準額71,500円・13段階。第1〜3は軽減後。82.65万/120万しきい値。第6〜13は合計所得120/210/320/400/500/600/700万。
    levels: [
      { level: "1",  annual: 17900,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 46500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 71500,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 78700,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 121600, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "13", annual: 139400, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kurobe", name: "黒部市（新川組合）", source: "niikawa-kaigohoken.jp/hokenryou/hokenryou_65/",
    // 新川地域介護保険組合（黒部/入善/朝日）。基準額67,200円・13段階。82.65万/120万しきい値。
    levels: [
      { level: "1",  annual: 16800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "4",  annual: 57600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 67200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 80400,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 160800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 神奈川県29件充填（2026-06-15）代表市の公式段階別額（独立転記の二重チェック） ──
  {
    slug: "yokosuka", name: "横須賀市", source: "city.yokosuka.kanagawa.jp .../l100050586.html",
    levels: [
      { level: "1",  annual: 20860,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 73200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 80520,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 87840,  ctx: { isSelfTaxable: true, totalIncome: 900000 } },
      { level: "18", annual: 204960, ctx: { isSelfTaxable: true, totalIncome: 20000000 } },
    ],
  },
  {
    slug: "fujisawa", name: "藤沢市", source: "city.fujisawa.kanagawa.jp .../kaigohokenryou.html",
    levels: [
      { level: "1",  annual: 21540,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 83160,  ctx: { isSelfTaxable: true, totalIncome: 600000 } },
      { level: "18", annual: 241920, ctx: { isSelfTaxable: true, totalIncome: 25000000 } },
    ],
  },
  {
    slug: "hiratsuka", name: "平塚市", source: "city.hiratsuka.kanagawa.jp .../page-c_02687.html",
    levels: [
      { level: "1",  annual: 19960,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 70032,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 80537,  ctx: { isSelfTaxable: true, totalIncome: 300000 } },
      { level: "7",  annual: 84039,  ctx: { isSelfTaxable: true, totalIncome: 800000 } },
      { level: "17", annual: 196090, ctx: { isSelfTaxable: true, totalIncome: 20000000 } },
    ],
  },
  {
    slug: "kamakura", name: "鎌倉市", source: "city.kamakura.kanagawa.jp .../kaigohokenryo_9.pdf",
    levels: [
      { level: "1",  annual: 15840,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 66000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 72600,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "16", annual: 198000, ctx: { isSelfTaxable: true, totalIncome: 30000000 } },
    ],
  },
  {
    slug: "yamato", name: "大和市", source: "city.yamato.lg.jp .../6649.html",
    levels: [
      { level: "1",  annual: 22179,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 77820,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 85602,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "19", annual: 404664, ctx: { isSelfTaxable: true, totalIncome: 40000000 } },
    ],
  },
  {
    slug: "zama", name: "座間市", source: "city.zama.kanagawa.jp .../1002968.html",
    levels: [
      { level: "1",  annual: 20030,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 70300,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "20", annual: 217930, ctx: { isSelfTaxable: true, totalIncome: 15000000 } },
    ],
  },
  {
    slug: "samukawa", name: "寒川町", source: "town.samukawa.kanagawa.jp .../1497234601572.html",
    levels: [
      { level: "1",  annual: 17780,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 62400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 74880,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "13", annual: 149760, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "miura", name: "三浦市", source: "city.miura.kanagawa.jp .../1867.html",
    levels: [
      { level: "1",  annual: 22570,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 190080, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "yugawara", name: "湯河原町", source: "town.yugawara.kanagawa.jp .../1103.html",
    levels: [
      { level: "1",  annual: 19836,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 69600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "15", annual: 153120, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "kaisei", name: "開成町", source: "town.kaisei.kanagawa.jp .../hokenryou9-R8.pdf",
    levels: [
      { level: "1",  annual: 19150,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "4",  annual: 63840,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 67200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "7",  annual: 84000,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "14", annual: 168000, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "manazuru", name: "真鶴町", source: "town.manazuru.kanagawa.jp .../111.html",
    levels: [
      { level: "1",  annual: 19494,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 68400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 82080,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "13", annual: 164160, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "hadano", name: "秦野市", source: "city.hadano.kanagawa.jp .../8625.html",
    levels: [
      { level: "1",  annual: 20340,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 71400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 85680,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "13", annual: 171360, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
      { level: "16", annual: 192780, ctx: { isSelfTaxable: true, totalIncome: 25000000 } },
    ],
  },
  {
    slug: "aikawa", name: "愛川町", source: "town.aikawa.kanagawa.jp .../1422276526053.html",
    // 第6以降の合計所得境界が非標準（120/200/300/500/700/1000/1500万）。
    levels: [
      { level: "1",  annual: 20862,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 73200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 87840,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 91500,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "8",  annual: 109800, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "9",  annual: 124440, ctx: { isSelfTaxable: true, totalIncome: 4000000 } },
      { level: "11", annual: 146400, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
      { level: "13", annual: 161040, ctx: { isSelfTaxable: true, totalIncome: 20000000 } },
    ],
  },
  // ── 石川・福井30件充填（2026-06-15）代表自治体の公式段階別額（非標準境界の二重チェック） ──
  {
    slug: "kanazawa", name: "金沢市", source: "city.kanazawa.ishikawa.jp 条例",
    levels: [
      { level: "1",  annual: 19770,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79080,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "9",  annual: 118620, ctx: { isSelfTaxable: true, totalIncome: 4000000 } },
      { level: "10", annual: 138390, ctx: { isSelfTaxable: true, totalIncome: 6000000 } },
      { level: "13", annual: 181884, ctx: { isSelfTaxable: true, totalIncome: 20000000 } },
    ],
  },
  {
    slug: "tsubata", name: "津幡町（12段階）", source: "town.tsubata.lg.jp",
    levels: [
      { level: "5",  annual: 68400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 82000,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "12", annual: 147000, ctx: { isSelfTaxable: true, totalIncome: 7000000 } },
    ],
  },
  {
    slug: "uchinada", name: "内灘町（160万境界）", source: "town.uchinada.lg.jp",
    levels: [
      { level: "7",  annual: 90480,  ctx: { isSelfTaxable: true, totalIncome: 1400000 } },
      { level: "8",  annual: 97440,  ctx: { isSelfTaxable: true, totalIncome: 1800000 } },
      { level: "13", annual: 139200, ctx: { isSelfTaxable: true, totalIncome: 7000000 } },
    ],
  },
  {
    slug: "komatsu", name: "小松市（135万境界）", source: "city.komatsu.lg.jp",
    levels: [
      { level: "6",  annual: 90700,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 94500,  ctx: { isSelfTaxable: true, totalIncome: 1800000 } },
      { level: "13", annual: 189000, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "nomi", name: "能美市（80万始まり14段）", source: "city.nomi.lg.jp",
    levels: [
      { level: "6",  annual: 91080,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 95040,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 205920, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "obama", name: "小浜市（16段階）", source: "city.obama.fukui.jp",
    levels: [
      { level: "5",  annual: 78960,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "16", annual: 236880, ctx: { isSelfTaxable: true, totalIncome: 20000000 } },
    ],
  },
  {
    slug: "fukui", name: "福井市（独自軽減・125万）", source: "city.fukui.lg.jp",
    levels: [
      { level: "1",  annual: 11880,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 95040,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 190080, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "sabae", name: "鯖江市（独自境界）", source: "city.sabae.fukui.jp",
    levels: [
      { level: "6",  annual: 81360,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 115320, ctx: { isSelfTaxable: true, totalIncome: 4000000 } },
      { level: "13", annual: 156000, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "awara", name: "あわら市（坂井広域15段）", source: "kouiki.sakai.fukui.jp",
    levels: [
      { level: "6",  annual: 81840,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 89280,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 186000, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "sakaifukui", name: "坂井市（坂井広域・awaraと同一）", source: "kouiki.sakai.fukui.jp",
    levels: [
      { level: "5",  annual: 74400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "15", annual: 186000, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "shika", name: "志賀町", source: "town.shika.lg.jp/page/1936.html",
    levels: [
      { level: "1",  annual: 20520,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 72000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 172800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "wakasa", name: "若狭町", source: "town.fukui-wakasa.lg.jp .../leaflet2.pdf",
    levels: [
      { level: "1",  annual: 21540,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 181440, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "nakanoto", name: "中能登町", source: "town.nakanoto.ishikawa.jp .../2024032001.pdf",
    levels: [
      { level: "1",  annual: 23256,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 81600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 195840, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "hodatsushimizu", name: "宝達志水町", source: "g-reiki hodatsushimizu 条例",
    levels: [
      { level: "1",  annual: 21888,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 76800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 184320, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kaga", name: "加賀市（15段・80万始まり）", source: "city.kaga.ishikawa.jp .../1878.html",
    levels: [
      { level: "1",  annual: 21880,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 76800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84480,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 92160,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 119040, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "15", annual: 184320, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  // ── 新潟県27件充填（2026-06-16）代表自治体の公式段階別額（独立転記の二重チェック） ──
  {
    slug: "niigata", name: "新潟市（15段・90万境界）", source: "city.niigata.lg.jp .../hokenryou.html",
    levels: [
      { level: "1",  annual: 16500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 82500,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90800,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 99000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 181500, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
      { level: "15", annual: 198000, ctx: { isSelfTaxable: true, totalIncome: 15000000 } },
    ],
  },
  {
    slug: "joetsu", name: "上越市（17段・独自境界）", source: "city.joetsu.niigata.jp .../hokenryou.html",
    levels: [
      { level: "1",  annual: 15500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 77400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 89100,  ctx: { isSelfTaxable: true, totalIncome: 300000 } },
      { level: "7",  annual: 92900,  ctx: { isSelfTaxable: true, totalIncome: 700000 } },
      { level: "17", annual: 294200, ctx: { isSelfTaxable: true, totalIncome: 20000000 } },
    ],
  },
  {
    slug: "nagaoka", name: "長岡市（14段・独自境界）", source: "city.nagaoka.niigata.jp .../keisan.html",
    levels: [
      { level: "1",  annual: 21600,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75700,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 87100,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 90800,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 189200, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "tainai", name: "胎内市（15段・40万始まり）", source: "city.tainai.niigata.jp .../hokenryo.html",
    levels: [
      { level: "1",  annual: 22100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 77600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 89300,  ctx: { isSelfTaxable: true, totalIncome: 300000 } },
      { level: "7",  annual: 93200,  ctx: { isSelfTaxable: true, totalIncome: 600000 } },
      { level: "15", annual: 174700, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "uonuma", name: "魚沼市（14段・600/700/800万境界）", source: "city.uonuma.lg.jp/page/2128.html",
    levels: [
      { level: "1",  annual: 21820,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 76560,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "12", annual: 172260, ctx: { isSelfTaxable: true, totalIncome: 6500000 } },
      { level: "14", annual: 183744, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "kashiwazaki", name: "柏崎市（14段・800万境界）", source: "city.kashiwazaki.lg.jp .../9kikeikaku-gaiyou.pdf",
    levels: [
      { level: "1",  annual: 17800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "13", annual: 135200, ctx: { isSelfTaxable: true, totalIncome: 7500000 } },
      { level: "14", annual: 149500, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "sado", name: "佐渡市（標準13段）", source: "city.sado.niigata.jp/soshiki/2012/4161.html",
    levels: [
      { level: "1",  annual: 21200,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 74400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 178500, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kamo", name: "加茂市（標準13段）", source: "city.kamo.niigata.jp/docs/30211.html",
    levels: [
      { level: "1",  annual: 21060,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "6",  annual: 88700,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 177400, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "agano", name: "阿賀野市（15段・条例・独自境界160/260万）", source: "city.agano.niigata.jp 介護保険条例 第3条",
    levels: [
      { level: "1",  annual: 23700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 83100,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 99700,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 108000, ctx: { isSelfTaxable: true, totalIncome: 1400000 } },
      { level: "8",  annual: 116300, ctx: { isSelfTaxable: true, totalIncome: 1800000 } },
      { level: "9",  annual: 124600, ctx: { isSelfTaxable: true, totalIncome: 2300000 } },
      { level: "10", annual: 132900, ctx: { isSelfTaxable: true, totalIncome: 2900000 } },
      { level: "14", annual: 191100, ctx: { isSelfTaxable: true, totalIncome: 6500000 } },
      { level: "15", annual: 199400, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kariwa", name: "刈羽村（条例・標準13段）", source: "vill.kariwa.niigata.jp 介護保険条例 第15条",
    levels: [
      { level: "1",  annual: 18800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 66000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 79200,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 158400, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "yuzawa", name: "湯沢町（標準13段）", source: "town.yuzawa.lg.jp .../1060.html",
    levels: [
      { level: "1",  annual: 17100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 60000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 144000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "awashimaura", name: "粟島浦村（単独保険者・条例）", source: "vill.awashimaura.lg.jp 介護保険条例",
    levels: [
      { level: "1",  annual: 24000,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 84000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 201600, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 長野県（2026-06-16）代表自治体・非標準境界の独立転記 ──
  {
    slug: "okaya", name: "岡谷市（諏訪広域・14段・80万境界）", source: "union.suwa.lg.jp/site/kaigo/hokenryo.html",
    levels: [
      { level: "1",  annual: 18981,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 66600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 69930,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 73260,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 156510, ctx: { isSelfTaxable: true, totalIncome: 20000000 } },
    ],
  },
  {
    slug: "kisomachi", name: "木曽町（木曽広域・標準13段）", source: "kisoji.com .../0604_hokenryo_1gou.html",
    levels: [
      { level: "1",  annual: 19200,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 67200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 160800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "omachi", name: "大町市（北アルプス広域・標準13段）", source: "kita-alps.omachi.nagano.jp .../kaigo_hokenryou.html",
    levels: [
      { level: "1",  annual: 19836,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 69600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 167040, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "matsumoto", name: "松本市（14段・430/840万境界）", source: "city.matsumoto.nagano.jp/site/kourei/137842.html",
    levels: [
      { level: "1",  annual: 19760,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 69360,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "9",  annual: 117910, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "13", annual: 159520, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
      { level: "14", annual: 166460, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "iida", name: "飯田市（16段）", source: "city.iida.lg.jp/soshiki/14/9kikaigohokenryou.html",
    levels: [
      { level: "1",  annual: 20088,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 71760,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "16", annual: 193752, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "nagano", name: "長野市（13段・第12=620-1000万）", source: "city.nagano.nagano.jp .../p002457.html",
    levels: [
      { level: "1",  annual: 19050,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "12", annual: 156490, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
      { level: "13", annual: 163290, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "chikuma", name: "千曲市（独自境界125/200/300万）", source: "city.chikuma.lg.jp .../1291.html",
    levels: [
      { level: "6",  annual: 69216,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 77250,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "13", annual: 126690, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "tatsuno", name: "辰野町（独自境界・680万）", source: "town.tatsuno.lg.jp .../3359.html",
    levels: [
      { level: "1",  annual: 17100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "9",  annual: 90000,  ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "12", annual: 102000, ctx: { isSelfTaxable: true, totalIncome: 6500000 } },
      { level: "13", annual: 105000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "minowa", name: "箕輪町（独自境界190万）", source: "town.minowa.lg.jp .../kaigohokennryou.pdf",
    levels: [
      { level: "7",  annual: 76800,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "8",  annual: 79200,  ctx: { isSelfTaxable: true, totalIncome: 2000000 } },
      { level: "9",  annual: 91200,  ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "13", annual: 120000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "minamimino", name: "南箕輪村（15段・独自境界290万）", source: "vill.minamiminowa.lg.jp .../11208_66810_misc.JPG",
    levels: [
      { level: "1",  annual: 17880,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 62760,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "8",  annual: 94200,  ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "9",  annual: 100440, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "15", annual: 150600, ctx: { isSelfTaxable: true, totalIncome: 10000000 } },
    ],
  },
  {
    slug: "miyada", name: "宮田村（標準13段・調整率0.325始まり）", source: "vill.miyada.nagano.jp",
    levels: [
      { level: "1",  annual: 23400,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 72000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 172800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "yasuoka", name: "泰阜村（9段階）", source: "vill.yasuoka.nagano.jp/docs/2502.html",
    levels: [
      { level: "1",  annual: 26460,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 58800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 70560,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "8",  annual: 88200,  ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "9",  annual: 99960,  ctx: { isSelfTaxable: true, totalIncome: 5000000 } },
    ],
  },
  {
    slug: "minamimaki", name: "南牧村（独自境界200万）", source: "minamimakimura.jp .../326.html",
    levels: [
      { level: "1",  annual: 23400,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 82200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "7",  annual: 106800, ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "8",  annual: 123300, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "13", annual: 197200, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "takayama", name: "高山村（独自境界・軽減後）", source: "vill.takayama.nagano.jp/docs/686.html",
    levels: [
      { level: "1",  annual: 15000,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "7",  annual: 90000,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "13", annual: 144000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 静岡県（第9期・独立保険者35。R8境界82.65万。代表10市を独立転記）──
  {
    slug: "shizuoka", name: "静岡市（15段・独自境界）", source: "city.shizuoka.lg.jp/s2984/s002938.html",
    levels: [
      { level: "1",  annual: 21700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "4",  annual: 68500,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "6",  annual: 91400,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 129500, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "13", annual: 171400, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
      { level: "15", annual: 190500, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "hamamatsu", name: "浜松市（生保段統合・15bracket）", source: "city.hamamatsu.shizuoka.jp/kaigo/care/20230126kimarikata.html",
    levels: [
      { level: "1",  annual: 20178,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 46021,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 70802,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84962,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "10", annual: 134523, ctx: { isSelfTaxable: true, totalIncome: 4500000 } },
      { level: "15", annual: 198245, ctx: { isSelfTaxable: true, totalIncome: 16000000 } },
    ],
  },
  {
    slug: "fuji", name: "富士市（第6=125万・第9が320-520統合）", source: "city.fuji.shizuoka.jp/1020040000/p003225.html",
    levels: [
      { level: "5",  annual: 69600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 78648,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 118320, ctx: { isSelfTaxable: true, totalIncome: 4000000 } },
      { level: "13", annual: 187920, ctx: { isSelfTaxable: true, totalIncome: 16000000 } },
    ],
  },
  {
    slug: "mishima", name: "三島市（独自境界125/200/300）", source: "city.mishima.shizuoka.jp/page/3108.html",
    levels: [
      { level: "1",  annual: 18800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "6",  annual: 75900,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 85800,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "8",  annual: 105600, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "13", annual: 171600, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kakegawa", name: "掛川市（15段・820/920境界）", source: "city.kakegawa.shizuoka.jp/gyosei/docs/791787.html",
    levels: [
      { level: "6",  annual: 80640,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 168000, ctx: { isSelfTaxable: true, totalIncome: 8500000 } },
      { level: "15", annual: 174720, ctx: { isSelfTaxable: true, totalIncome: 10000000 } },
    ],
  },
  {
    slug: "gotemba", name: "御殿場市（独自高位乗率）", source: "city.gotemba.lg.jp/kenkou/c-2/c-2-4/508.html",
    levels: [
      { level: "1",  annual: 18100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "6",  annual: 76300,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 133500, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "morimachi", name: "森町（県内最高額・軽減後）", source: "town.morimachi.shizuoka.jp/.../4213.html",
    levels: [
      { level: "1",  annual: 21888,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 52608,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 76800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 184320, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kawazu", name: "河津町（軽減後≠軽減前）", source: "town.kawazu.shizuoka.jp/.../gaiyou.pdf",
    levels: [
      { level: "1",  annual: 21600,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 51800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "13", annual: 181400, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "shimada", name: "島田市（県内最低基準額60000）", source: "city.shimada.shizuoka.jp/kurashi-docs/kaigo_hokenryou.html",
    levels: [
      { level: "1",  annual: 17100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "6",  annual: 66000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 126000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "fujinomiya", name: "富士宮市（国標準型13段）", source: "city.fujinomiya.lg.jp/1035210000/p001477.html",
    levels: [
      { level: "1",  annual: 20700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "8",  annual: 109300, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "13", annual: 174900, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 山梨県（第9期・独立保険者27。R8境界82.65万。代表7市町を独立転記）──
  {
    slug: "kofu", name: "甲府市（15段・独自境界190/200/290/400/600/800）", source: "city.kofu.yamanashi.jp/.../hokenryo.html",
    levels: [
      { level: "1",  annual: 22170,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "7",  annual: 97220,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "8",  annual: 101110, ctx: { isSelfTaxable: true, totalIncome: 1950000 } },
      { level: "10", annual: 136110, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "15", annual: 202220, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "kai", name: "甲斐市（14段・独自境界410/500/590/680/770）", source: "city.kai.yamanashi.jp/.../5058.html",
    levels: [
      { level: "6",  annual: 72000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "10", annual: 105000, ctx: { isSelfTaxable: true, totalIncome: 4500000 } },
      { level: "14", annual: 144000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "koshu", name: "甲州市（独自境界500/700/900/1100・L10=1.85）", source: "city.koshu.yamanashi.jp/docs/2021051900024/",
    levels: [
      { level: "9",  annual: 121500, ctx: { isSelfTaxable: true, totalIncome: 4000000 } },
      { level: "11", annual: 139400, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
      { level: "13", annual: 157300, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "showamachi", name: "昭和町（14段・独自境界430/540/650/900/1200）", source: "town.showa.yamanashi.jp/soshiki/12/12164.html",
    levels: [
      { level: "1",  annual: 16758,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "9",  annual: 99960,  ctx: { isSelfTaxable: true, totalIncome: 4000000 } },
      { level: "12", annual: 117600, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
      { level: "14", annual: 129360, ctx: { isSelfTaxable: true, totalIncome: 13000000 } },
    ],
  },
  {
    slug: "nirasaki", name: "韮崎市（15段・上位2段追加820/1000）", source: "city.nirasaki.lg.jp/.../1944.html",
    levels: [
      { level: "13", annual: 155600, ctx: { isSelfTaxable: true, totalIncome: 7500000 } },
      { level: "15", annual: 168500, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "oshinomura", name: "忍野村（県内最安・軽減後）", source: "vill.oshino.lg.jp/page/1399.html",
    levels: [
      { level: "1",  annual: 16500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 57600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 138240, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "fujikawaguchiko", name: "富士河口湖町（条例・inferred第1-3）", source: "town.fujikawaguchiko.lg.jp/ka/info.php?if_id=364",
    levels: [
      { level: "6",  annual: 80640,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 161280, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 静岡 取得不能フィル（スクショ/条例で確定・国標準13段）──
  {
    slug: "makinohara", name: "牧之原市（ガイドブック・スクショ確定）", source: "city.makinohara.shizuoka.jp/uploaded/attachment/49811.pdf",
    levels: [
      { level: "1",  annual: 19152,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "6",  annual: 80640,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 161280, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "shimizumachi", name: "清水町（公式HTML・スクショ確定）", source: "town.shimizu.shizuoka.jp/kokuho/kokuho00021.html",
    levels: [
      { level: "1",  annual: 17400,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "8",  annual: 91800,  ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "13", annual: 146800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "higashiizu", name: "東伊豆町（介護保険条例・確定）", source: "g-reiki.net/town.higashiizu.shizuoka/.../g323RG00000483.html",
    levels: [
      { level: "1",  annual: 16500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 58000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 139300, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 山梨 取得不能フィル（スクショ/条例で確定）──
  {
    slug: "tsuru", name: "都留市（軽減表で第1-3確定）", source: "city.tsuru.yamanashi.jp/soshiki/choujukaigo/1/5/1164.html",
    levels: [
      { level: "1",  annual: 20500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "6",  annual: 86100,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 172100, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "fuefuki", name: "笛吹市（上位独自乗率1.88/1.89/1.9）", source: "city.fuefuki.yamanashi.jp/documents/6143/kaigohokenryou.pdf",
    levels: [
      { level: "10", annual: 129600, ctx: { isSelfTaxable: true, totalIncome: 4500000 } },
      { level: "11", annual: 135360, ctx: { isSelfTaxable: true, totalIncome: 5500000 } },
      { level: "13", annual: 136800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "chuo-yamanashi", name: "中央市（15段・独自境界）", source: "city.chuo.yamanashi.jp/.../12534.html",
    levels: [
      { level: "1",  annual: 18900,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "8",  annual: 102300, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "13", annual: 125400, ctx: { isSelfTaxable: true, totalIncome: 7500000 } },
      { level: "15", annual: 138600, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "minobu", name: "身延町（国標準13段）", source: "town.minobu.lg.jp/page/2074.html",
    levels: [
      { level: "1",  annual: 21380,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "13", annual: 180000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "fujikawamachi", name: "富士川町（国標準13段）", source: "town.fujikawa.yamanashi.jp/.../R7kaigohokennryou.pdf",
    levels: [
      { level: "6",  annual: 87840,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 175680, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "tabayamamura", name: "丹波山村（第9期PDF）", source: "vill.tabayama.yamanashi.jp/.../dai9ki.tabayayakaigo.pdf",
    levels: [
      { level: "1",  annual: 19200,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "13", annual: 162000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "yamanakako", name: "山中湖村（計画PDF・inferred第1-3）", source: "vill.yamanakako.lg.jp/div/kaigo/pdf/kaigohokenkeikaku9.pdf",
    levels: [
      { level: "5",  annual: 57600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 138240, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ─── 群馬（第9期 R6-8）──────────────────────────────────────────
  {
    slug: "takasaki", name: "高崎市", source: "city.takasaki.gunma.jp/page/2227.html",
    // 16段階・基準額79,100円。第6=合計所得80万未満(独自最下位境界)。第6-16境界80/120/210/320/420/520/620/720/820/920万。
    levels: [
      { level: "1",  annual: 21300,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 37100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 79100,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90900,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 94900,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 102800, ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "16", annual: 205600, ctx: { isSelfTaxable: true, totalIncome: 10000000 } },
    ],
  },
  {
    slug: "kiryu", name: "桐生市", source: "city.kiryu.lg.jp/.../1001798.html",
    // 14段階・基準額78,000円。第6-14境界80/125/200/290/400/600/800/1000万(独自)。
    levels: [
      { level: "1",  annual: 22200,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 78000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 91300,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 93600,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 171600, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "midori", name: "みどり市", source: "city.midori.gunma.jp/.../1002417.html",
    // 17段階・基準額68,400円。第6-17境界120/210/320/420/520/620/720/900/1100/1500/2000万。
    levels: [
      { level: "1",  annual: 19400,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 68400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 82000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "17", annual: 218800, ctx: { isSelfTaxable: true, totalIncome: 25000000 } },
    ],
  },
  {
    slug: "showa", name: "昭和村（独自軽減）", source: "vill.showa.gunma.jp/.../2017-0303-1313-1.html",
    // 13段階・基準額73,200円。第1-3は公式公表額(0.455/0.685/0.69、公式注記で軽減後とされる)。
    levels: [
      { level: "1",  annual: 33300,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 50500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 73200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 175700, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kusatsu", name: "草津町（県内最安）", source: "town.kusatsu.gunma.jp/.../gaiyo.pdf",
    // 13段階・基準額43,200円(月3,600)。
    levels: [
      { level: "1",  annual: 12312,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 43200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 103600, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "tomioka", name: "富岡市", source: "city.tomioka.lg.jp/.../1548725579973/index.html",
    // 13段階・基準額69,200円。標準境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 19700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 47400,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 69200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 83000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 166000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kawaba", name: "川場村（県内最高）", source: "vill.kawaba.gunma.jp/.../62ef19f710c2...pdf p.92",
    // 13段階・基準額91,200円(月7,600)。第1-3軽減後・各段100円丸め。
    levels: [
      { level: "1",  annual: 25900,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 91200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 109400, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 218800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "ota-gunma", name: "太田市", source: "city.ota.gunma.jp/page/1276.html",
    // 15段階・基準額70,700円。第6=×1.30(120万)。第6-15境界120/210/320/420/520/620/720/820/1000万。
    levels: [
      { level: "1",  annual: 20100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 70700,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 91900,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 205000, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "miyawaka", name: "宮若市(福岡県介護保険広域連合Aグループ)", source: "fukuoka-kaigo.jp/fee/detail/nursing5_a.html",
    // 25段。基準85,835円。第1-3=公費軽減後0.28/0.48/0.68。第9以降340-620万を20万刻み。境界120/210/320/340.../620/720万。
    levels: [
      { level: "1",  annual: 24034,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 58368,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 85835,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 103002, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 128753, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "25", annual: 214588, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "sasaguri", name: "篠栗町(福岡県介護保険広域連合Cグループ)", source: "fukuoka-kaigo.jp/fee/detail/nursing5_c.html",
    // 25段。基準59,710円。Aグループの料率を低基準額に適用(A値×59710/85835)。
    levels: [
      { level: "1",  annual: 16719,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 59710,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 71652,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "25", annual: 149275, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "fukuoka", name: "福岡市", source: "city.fukuoka.lg.jp .../3-010203.html",
    // 15段。基準82,784円。第1-3=福岡市独自軽減後(0.245/0.395/0.685)。境界125/200/300/400/500/600/700/800/900万。
    levels: [
      { level: "1",  annual: 20282,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 82784,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 91063,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 223517, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "kitakyushu", name: "北九州市", source: "city.kitakyushu.lg.jp/contents/924_11152.html",
    // 15段。基準79,070円。第2=0.435(非標準)。第6-9境界80/120/160/210万・以降320/420.../720万。
    levels: [
      { level: "1",  annual: 22530,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79070,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 86970,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "9",  annual: 98830,  ctx: { isSelfTaxable: true, totalIncome: 1800000 } },
      { level: "10", annual: 118600, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "15", annual: 189760, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kasuya", name: "粕屋町(独立保険者)", source: "town.kasuya.fukuoka.jp .../20191121231304.html",
    // 16段。基準67,200円。第2=0.44(非標準)。境界120/160/210/260/320/370/420/470/620/720万。
    levels: [
      { level: "1",  annual: 19152,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 67200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 100800, ctx: { isSelfTaxable: true, totalIncome: 2300000 } },
      { level: "16", annual: 161280, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "itoshima", name: "糸島市", source: "city.itoshima.lg.jp .../20210528152143.html",
    // 14段。基準67,200円。第6=×1.16(125万以下)。第8上限を公式300万→320万に補正(第9下限と連続化)。境界125/210/320/420/520/620/720/820万。
    levels: [
      { level: "1",  annual: 19150,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 67200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 77950,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 110880, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "14", annual: 161280, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "nakama", name: "中間市", source: "city.nakama.lg.jp/soshiki/17/1406.html",
    // 13段。基準70,248円。高所得帯が200万刻み。境界120/210/320/420/620/820/1020万。
    levels: [
      { level: "1",  annual: 20021,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 70248,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84298,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "10", annual: 133472, ctx: { isSelfTaxable: true, totalIncome: 5000000 } },
      { level: "13", annual: 168596, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "omuta", name: "大牟田市", source: "city.omuta.lg.jp/kiji00315142/index.html",
    // 13段。基準72,000円。第4=0.80(非標準・57600)。境界125/200/300/400/500/600/700万。
    levels: [
      { level: "1",  annual: 20520,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "4",  annual: 57600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 72000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 79200,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 151200, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "koga", name: "古賀市", source: "city.koga.fukuoka.jp .../030.php (公式画像スクショ)",
    // 13段。基準63,600円。国標準13段・端数処理なしのbase×乗率実額。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 18126,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 43566,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 63600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 76320,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 152640, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "nishihara", name: "西原町(沖縄県介護保険広域連合)", source: "okinawa-kouiki.jp/docs/2024010400016/ (均一賦課)",
    // 16段。基準83,148(月6929)。令和6年度から均一賦課(単一料率)。第1-3軽減後0.285/0.485/0.685。境界120/210/320/420/520/620/720/820/920/1020万。
    levels: [
      { level: "1",  annual: 23697,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 83148,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 99777,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 124722, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "16", annual: 249444, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "naha", name: "那覇市", source: "city.naha.okinawa.jp .../r8hpver.2.pdf",
    // 16段。基準82,512。第6=×1.12。境界120/210/320/420/520/620/720/1000/1500/2000万。
    levels: [
      { level: "1",  annual: 23520,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 82512,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 92424,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "16", annual: 247536, ctx: { isSelfTaxable: true, totalIncome: 21000000 } },
    ],
  },
  {
    slug: "okinawashi", name: "沖縄市", source: "city.okinawa.okinawa.jp 介護保険条例第6条",
    // 13段。基準87,300。第1-3減額賦課=24876/33168/53244(第2=0.38/第3=0.61独自)。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 24876,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 53244,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 87300,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 101268, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 218244, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "miyakojima", name: "宮古島市", source: "city.miyakojima.lg.jp .../hokenryo.html",
    // 15段。基準86,820。★第1=0.425(非標準・公式確認)。境界120/210/320/420/520/620/720/820/920万。
    levels: [
      { level: "1",  annual: 36900,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 86820,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 104184, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 234420, ctx: { isSelfTaxable: true, totalIncome: 10000000 } },
    ],
  },
  {
    slug: "urasoe", name: "浦添市", source: "urasoe介護保険条例第3条",
    // 15段。基準81,600。第2=0.365(非標準・条例第3条第3項)。第10=420-620万の200万刻み。境界120/210/320/420/620/820/1000/1500/2000万。
    levels: [
      { level: "1",  annual: 23256,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 29784,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 81600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 97920,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 212160, ctx: { isSelfTaxable: true, totalIncome: 25000000 } },
    ],
  },
  {
    slug: "ginowan", name: "宜野湾市", source: "city.ginowan.lg.jp .../2932.html",
    // 15段。基準78,000。第2=0.40(非標準=31200)。境界120/210/320/420/520/620/720/820/1000万。
    levels: [
      { level: "1",  annual: 22230,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 31200,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 78000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 93600,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 214500, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "nago", name: "名護市", source: "city.nago.okinawa.jp .../R8.pdf",
    // 15段。基準88,220。第6=80万未満始まり・独自境界80/120/150/190/290/400/500/600/700万。
    levels: [
      { level: "1",  annual: 25143,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 88220,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 97040,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 101450, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 238200, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "oita", name: "大分市", source: "city.oita.oita.jp .../1332487106720.html",
    // 13段。基準82,220。第1-3軽減後(0.285/0.485/0.685)。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 23430,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 82220,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 98660,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 205550, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "nakatsu", name: "中津市", source: "city-nakatsu.jp/doc/2024051900049/",
    // 13段。基準73,200。第2=0.38(非標準=27800)。第4=0.83。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 20800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 27800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 73200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 91500,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 175600, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "taketa", name: "竹田市", source: "city.taketa.oita.jp .../1226.html (軽減後かっこ書き)",
    // 13段。基準68,400。第1-3軽減後=公式かっこ書き(19500/33200/46900)。軽減前0.455/0.685/0.69併記。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 19500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "3",  annual: 46900,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 68400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 82100,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 164200, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "usuki", name: "臼杵市", source: "city.usuki.oita.jp/docs/2014020600032/",
    // 13段。基準63,600。第4=0.88・第10=1.80(非標準)。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 18130,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 63600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 76320,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "10", annual: 114480, ctx: { isSelfTaxable: true, totalIncome: 4500000 } },
      { level: "13", annual: 152640, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "tsukumi", name: "津久見市", source: "city.tsukumi.oita.jp/site/koureisha/27130.html",
    // 13段。基準74,980。第1-3軽減後(0.285/0.485/0.685)。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 21370,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 74980,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 89980,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 179950, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "himeshima", name: "姫島村(推計)", source: "厚労省001253798 基準額のみ確定・段階表非公表",
    // 13段(推計)。基準57,000(月4750)。国標準13段乗率・floor100。
    levels: [
      { level: "1",  annual: 16200,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 57000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 68400,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 136800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ─── 熊本県(第9期・45独立保険者) ───
  {
    slug: "kumamoto", name: "熊本市", source: "city.kumamoto.jp/kiji0039042/ (15段・市独自料率)",
    // 15段。基準76,800。第2=0.37/第3=0.645/第4=0.875は熊本市独自(軽減前後取り違えなし=公式確認)。境界…720/820/920万。
    levels: [
      { level: "1",  annual: 21888,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 28416,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 76800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84480,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 222720, ctx: { isSelfTaxable: true, totalIncome: 10000000 } },
    ],
  },
  {
    slug: "yatsushiro", name: "八代市", source: "city.yatsushiro.lg.jp/reiki/…r371RG00000486 (条例第3条減額賦課)",
    // 13段。基準72,000。第1-3=条例第3条第2-4項の軽減後18700/33800/48900(取り違えなし=条例確認)。
    levels: [
      { level: "1",  annual: 18700,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 33800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "3",  annual: 48900,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1500000 } },
      { level: "5",  annual: 72000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 151200, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "oguni", name: "小国町(熊本県)", source: "town.kumamoto-oguni.lg.jp/…/22150 (基準75600が正・山形県小国町と誤帰属注意)",
    // 13段。基準75,600(月6300)。MHLW表の5890は山形県小国町。
    levels: [
      { level: "1",  annual: 21480,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90720,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 181440, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "ashikita", name: "芦北町", source: "town.ashikita.lg.jp/…r172RG00000306 (条例第2条・県内最低水準)",
    // 13段。基準59,900(県内最低水準)。条例第2条第2-4項。
    levels: [
      { level: "1",  annual: 17100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 59900,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 143700, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kuma", name: "球磨村", source: "d1-law kuma 介護保険条例第2条 (基準90000=県内最高水準)",
    // 13段。基準90,000(月7500)。条例第2条に年額直接規定。
    levels: [
      { level: "1",  annual: 25650,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 90000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 108000, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 216000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "reihoku", name: "苓北町(推計)", source: "第9期計画ページ本文で基準69600確認・段階表非公表→国標準13段で推計",
    // 13段(推計)。基準69,600(月5800)。公式サイトは旧8期表のみ→国標準乗率floor100。
    levels: [
      { level: "5",  annual: 69600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 83500,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 167000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ─── 佐賀県(第9期・3広域連合＋独立4) ───
  {
    slug: "saga", name: "佐賀市(佐賀中部広域連合)", source: "chubu.saga.saga.jp/kaigohoken/hokenryo/_1370.html",
    // 13段。基準71,520(月5960)。第1-3軽減後(0.285/0.485/0.685)。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 20388,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 71520,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 85824,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 171648, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "tosu", name: "鳥栖市(鳥栖地区広域)", source: "tosu-kouiki.jp/about_hokenryou/1gou/",
    // 13段。基準68,292(月5691)。第1-3軽減後。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 19464,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 68292,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 81960,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 163908, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "takeo", name: "武雄市(杵藤地区広域)", source: "city.takeo.lg.jp 広報たけお2024.6 P19 (★第7-9乗率が組合独自)",
    // 13段。基準71,832(月5986)。★第7=1.35/第8=1.60/第9=1.85(標準と相違)。端数=月額切上×12。
    levels: [
      { level: "1",  annual: 20484,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 71832,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "7",  annual: 96984,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "9",  annual: 132900, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "13", annual: 172404, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "genkaimachi", name: "玄海町(独立・県内最高)", source: "town.genkai.lg.jp/soshiki/23/1181.html",
    // 13段。基準82,200。第1-3軽減後。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 23427,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 82200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 197280, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "aritamachi", name: "有田町(独立・県内最低)", source: "town.arita.lg.jp 介護保険条例別表",
    // 13段。基準67,200(月5600)。第1-3軽減後(条例§6-8)。境界120/210/320/420/520/620/720万。
    levels: [
      { level: "1",  annual: 19152,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 67200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 80640,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 161280, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ─── 宮崎県(第9期・26独立保険者) ───
  {
    slug: "miyazaki", name: "宮崎市(14段)", source: "city.miyazaki.miyazaki.jp .../12331.html (第6境界125万・820万まで)",
    // 14段。基準75,600。第4=0.85。第6境界125万。
    levels: [
      { level: "1",  annual: 21500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90700,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 185200, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "nobeoka", name: "延岡市(15段)", source: "city.nobeoka.miyazaki.jp/soshiki/28/34088.html (第6=1.25・第7境界160万)",
    // 15段。基準70,800(月5900据置)。独自乗率/境界。
    levels: [
      { level: "1",  annual: 20170,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 70800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 88500,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 169920, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "miyakonojo", name: "都城市(条例・第6-8独自乗率)", source: "g-reiki mkj 介護保険条例第5条 (第6-8=1.25/1.35/1.55)",
    // 13段。基準74,400。★第6-8乗率1.25/1.35/1.55(国標準より高い)。
    levels: [
      { level: "1",  annual: 21200,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 74400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 93000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "8",  annual: 115320, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "13", annual: 178560, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "aya", name: "綾町(第9=1.65非標準)", source: "town.aya.miyazaki.jp 第9期保険料額PDF",
    // 13段。基準70,800。第9段階のみ1.65。
    levels: [
      { level: "5",  annual: 70800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "9",  annual: 116800, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "13", annual: 169900, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "gokase", name: "五ヶ瀬町(県内最低)", source: "town.gokase.miyazaki.jp 9ki hokenryo PDF (月4600)",
    // 13段。基準55,200(月4600)。
    levels: [
      { level: "1",  annual: 15732,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 55200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 132480, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "morotsuka", name: "諸塚村(推計)", source: "厚労省001253800で基準60000確認・条例別表非取得→国標準13段で推計",
    // 13段(推計)。基準60,000(月5000)。国標準乗率floor100。
    levels: [
      { level: "5",  annual: 60000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 72000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 144000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },

  // ─── 鹿児島県(第9期・43独立保険者。組合は事務共同のみ・基準額バラバラ) ───
  {
    slug: "kagoshima", name: "鹿児島市(15段)", source: "city.kagoshima.lg.jp .../65sai.html (第2=0.486・第6/7境界125万・15段)",
    levels: [
      { level: "1",  annual: 21400,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 74900,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 89900,  ctx: { isSelfTaxable: true, totalIncome: 1240000 } },  // <125万 (独自境界)
      { level: "7",  annual: 97400,  ctx: { isSelfTaxable: true, totalIncome: 1300000 } },  // 125-210万
      { level: "13", annual: 164800, ctx: { isSelfTaxable: true, totalIncome: 7500000 } },  // 720-800万
      { level: "14", annual: 172300, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },  // 800-1000万
      { level: "15", annual: 179800, ctx: { isSelfTaxable: true, totalIncome: 11000000 } }, // 1000万+
    ],
  },
  {
    slug: "izumishi", name: "出水市(14段・第2独自0.435)", source: "city.kagoshima-izumi.lg.jp/page/page_30033.html",
    levels: [
      { level: "2",  annual: 32880,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } }, // 独自軽減0.435
      { level: "5",  annual: 75600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90720,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },  // <120万
      { level: "7",  annual: 94440,  ctx: { isSelfTaxable: true, totalIncome: 1300000 } },  // 120-160万 (独自境界)
      { level: "8",  annual: 98280,  ctx: { isSelfTaxable: true, totalIncome: 1700000 } },  // 160-210万 (独自境界)
      { level: "14", annual: 181440, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "amami", name: "奄美市(16段・独自境界)", source: "city.amami.lg.jp .../hokenryo.html (第4=0.84・第6<100万・16段)",
    levels: [
      { level: "4",  annual: 68544,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } }, // 独自0.84
      { level: "5",  annual: 81600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84048,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },   // <100万 (独自境界)
      { level: "7",  annual: 89760,  ctx: { isSelfTaxable: true, totalIncome: 1100000 } },  // 100-120万
      { level: "16", annual: 212160, ctx: { isSelfTaxable: true, totalIncome: 11000000 } }, // 1000万+
    ],
  },
  {
    slug: "kanoya", name: "鹿屋市(高所得独自境界)", source: "city.kanoya.lg.jp .../hokenryo.html (320/400/600/800/1000万)",
    levels: [
      { level: "5",  annual: 80400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "9",  annual: 136680, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },  // 320-400万 (独自境界)
      { level: "10", annual: 152760, ctx: { isSelfTaxable: true, totalIncome: 5000000 } },  // 400-600万
      { level: "13", annual: 192960, ctx: { isSelfTaxable: true, totalIncome: 11000000 } }, // 1000万+
    ],
  },
  {
    slug: "tarumizu", name: "垂水市(高位独自抑制)", source: "city.tarumizu.lg.jp .../hokenryou.html (第10-13が独自低乗率)",
    levels: [
      { level: "5",  annual: 72000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "10", annual: 124200, ctx: { isSelfTaxable: true, totalIncome: 5000000 } },  // 独自低乗率
      { level: "13", annual: 129600, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kirishima", name: "霧島市(独自軽減0.26/0.47/0.68)", source: "city-kirishima.jp .../hokenryo.html (姶良伊佐組合・霧島分)",
    levels: [
      { level: "1",  annual: 18096,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } }, // 独自軽減
      { level: "5",  annual: 69600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 146160, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "isa", name: "伊佐市(県内最低4850)", source: "city.isa.kagoshima.jp/health/fukushi/hoken-care/",
    levels: [
      { level: "1",  annual: 16600,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 58200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 139680, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kimotsuki", name: "肝付町(県内最高・10円切捨)", source: "kimotsuki-town.jp 画像表(スクショ確定)",
    levels: [
      { level: "1",  annual: 24620,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 86400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 207360, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "tatsugou", name: "龍郷町(100円切捨)", source: "town.tatsugo.lg.jp HTML表(スクショ確定)",
    levels: [
      { level: "1",  annual: 23200,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 81600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "9",  annual: 138700, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "13", annual: 195800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },

  // ─── 長崎県(第9期・18市町個別＋島原広域3市統一=19料率表) ───
  {
    slug: "isahaya", name: "諫早市(第6境界125万)", source: "city.isahaya.nagasaki.jp/soshiki/25/30410.html",
    levels: [
      { level: "5",  annual: 71640,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 85920,  ctx: { isSelfTaxable: true, totalIncome: 1240000 } },  // <125万(非標準)
      { level: "7",  annual: 93120,  ctx: { isSelfTaxable: true, totalIncome: 1300000 } },  // 125-210万
      { level: "13", annual: 171960, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "tsushimashi", name: "対馬市(14段・独自乗率)", source: "city.tsushima.nagasaki.jp .../1005.html",
    levels: [
      { level: "4",  annual: 68250,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } }, // 0.875独自
      { level: "5",  annual: 78000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 87750,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },  // 1.125独自
      { level: "13", annual: 179400, ctx: { isSelfTaxable: true, totalIncome: 7500000 } },  // 720-820万
      { level: "14", annual: 187200, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },  // 820万+
    ],
  },
  {
    slug: "goto", name: "五島市(第6-9独自乗率)", source: "city.goto.nagasaki.jp 広報ごとうR6.12 PDF",
    levels: [
      { level: "5",  annual: 81360,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 101700, ctx: { isSelfTaxable: true, totalIncome: 1000000 } },  // 1.25独自
      { level: "9",  annual: 142380, ctx: { isSelfTaxable: true, totalIncome: 3500000 } },  // 1.75独自
      { level: "13", annual: 195260, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "nagasaki", name: "長崎市", source: "city.nagasaki.lg.jp/page/1436.html",
    levels: [
      { level: "1",  annual: 23300,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 81600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 195800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "shimabara", name: "島原広域(3市統一・100円切上)", source: "shimabara-area.net 組合公式表(スクショ確定)",
    // 島原/雲仙/南島原 同一表。基準75600。100円切上。
    levels: [
      { level: "1",  annual: 21600,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 181500, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 中国四国(2026-06-24 広域連合レバー先取り) ──
  {
    slug: "nanbumachi-tottori", name: "南部箕蚊屋広域連合(鳥取・日吉津/南部/伯耆)", source: "cms.top-page.jp/p/nan-mino(段階別額JPG)",
    // 国標準13段・基準67500・低5層境界82.65万/120万。3町に同一表展開。
    levels: [
      { level: "1",  annual: 19300,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "4",  annual: 60700,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 67500,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 81000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 162000, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "naharimachi", name: "中芸広域連合(高知・奈半利/田野/安田/北川/馬路)", source: "chugei-kouiki.jp 介護保険パンフPDF",
    // 国標準13段・基準70800・低5層境界82.65万/120万。5町村に同一表展開。
    levels: [
      { level: "1",  annual: 20178,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "4",  annual: 63720,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 70800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84960,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 169920, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "unnan", name: "雲南広域連合(島根・雲南/奥出雲/飯南)", source: "unnan.jp/kaigo(令和6-8表)",
    // 13段・基準72000・★非標準乗率(第1=0.257/第2=0.446/第6=1.125/第7=1.25/第9=1.75/第10=1.8/第11=2.1/第12=2.2/第13=2.3)。3市町に同一表展開。
    levels: [
      { level: "1",  annual: 18600,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 32160,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 72000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 81000,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 90000,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "10", annual: 129600, ctx: { isSelfTaxable: true, totalIncome: 4500000 } },
      { level: "13", annual: 165600, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "okinoshima", name: "隠岐広域連合(島根・海士/西ノ島/知夫/隠岐の島)", source: "okikouiki.jp/care-insurance/system/fee(令和7年度=第9期)",
    // 14段・基準78600・標準乗率・★第13(720-820万)/第14(820万超)で最上位2分割。4町村に同一表展開。
    levels: [
      { level: "1",  annual: 22392,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 78600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 94320,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 188640, ctx: { isSelfTaxable: true, totalIncome: 7500000 } },
      { level: "14", annual: 196500, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  // ── 岡山県(2026-06-24 横展開・全独立保険者・レバーなし・代表非標準を転記) ──
  {
    slug: "okayama", name: "岡山市", source: "city.okayama.jp PDF(独自境界14段)",
    // 14段・基準79680・★独自境界(第6<80/80-125/125-200/200-400/400-600/600-800/800-1000/1000-1200/1200万)・第4=0.85。
    levels: [
      { level: "1",  annual: 22704,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79680,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 87648,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "7",  annual: 91632,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "9",  annual: 119520, ctx: { isSelfTaxable: true, totalIncome: 3000000 } },
      { level: "14", annual: 219120, ctx: { isSelfTaxable: true, totalIncome: 13000000 } },
    ],
  },
  {
    slug: "kurashiki", name: "倉敷市", source: "city.kurashiki.okayama.jp PDF(15段)",
    // 15段・基準77400・第2=0.425/第3=0.665/第4=0.855独自・上位820/920万細分。
    levels: [
      { level: "1",  annual: 22060,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 77400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 92880,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 201240, ctx: { isSelfTaxable: true, totalIncome: 10000000 } },
    ],
  },
  {
    slug: "kasaoka", name: "笠岡市", source: "city.kasaoka.okayama.jp(独自境界)",
    // 13段・基準75000・★独自境界(320-450/450-600/600-700/700-800/800万)。
    levels: [
      { level: "1",  annual: 21400,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 75000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "9",  annual: 120000, ctx: { isSelfTaxable: true, totalIncome: 4000000 } },
      { level: "13", annual: 150000, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "maniwa", name: "真庭市", source: "city.maniwa.lg.jp(15段・独自分割)",
    // 15段・基準68640・上位720/820/920万で3分割(×2.4/2.6/2.8)。
    levels: [
      { level: "1",  annual: 19580,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 68640,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "13", annual: 164740, ctx: { isSelfTaxable: true, totalIncome: 7500000 } },
      { level: "15", annual: 192200, ctx: { isSelfTaxable: true, totalIncome: 10000000 } },
    ],
  },
  {
    slug: "tsuyama", name: "津山市", source: "g-reiki 津山市介護保険条例第4条(R6-8)",
    // 13段・基準72000・★第4=×0.8(57600非標準)・第1-3軽減後(条例第2-4項)。
    levels: [
      { level: "1",  annual: 20520,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "4",  annual: 57600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 72000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 86400,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 172800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 広島県(2026-06-24 横展開・全独立保険者・レバーなし・代表非標準を転記) ──
  {
    slug: "hiroshima", name: "広島市", source: "city.hiroshima.lg.jp(17段独自境界)",
    // 17段・基準76800・独自境界(第6≦125/200/300/400/500/600/700/800/1000/1500/2000万)。
    levels: [
      { level: "1",  annual: 21888,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 76800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 84480,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 96000,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "17", annual: 215040, ctx: { isSelfTaxable: true, totalIncome: 25000000 } },
    ],
  },
  {
    slug: "kure", name: "呉市", source: "city.kure.lg.jp(14段・深い軽減)",
    // 14段・基準66000・★第1-3=0.24/0.42/0.65独自軽減・第4=0.75・第6境界135万。
    levels: [
      { level: "1",  annual: 15840,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 66000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 72600,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 82500,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "14", annual: 151800, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "fukuyama", name: "福山市", source: "city.fukuyama.hiroshima.jp(16段)",
    // 16段・基準77800・第1=0.271独自・上位820/920/1020万細分。
    levels: [
      { level: "1",  annual: 21100,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 77800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90200,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "16", annual: 217800, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "fuchucho", name: "府中町(安芸郡)", source: "town.fuchu.hiroshima.jp(17段独自)",
    // 17段・基準73200・第2=0.385独自・独自境界(125/200/300/400/500/600/700/800/1000/1500/2000万)。
    levels: [
      { level: "1",  annual: 20900,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 73200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 80600,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "17", annual: 174300, ctx: { isSelfTaxable: true, totalIncome: 25000000 } },
    ],
  },
  {
    slug: "jinsekikogen", name: "神石高原町", source: "jinsekigun.jp(14段・60万境界新設)",
    // 14段・基準76200・★第6を合計所得60万未満で新設(60/120/210/320…)。
    levels: [
      { level: "1",  annual: 21720,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 76200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 83820,  ctx: { isSelfTaxable: true, totalIncome: 400000 } },
      { level: "7",  annual: 91440,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "14", annual: 182880, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 山口県(2026-06-24 横展開・全独立保険者・レバーなし・代表非標準を転記) ──
  {
    slug: "shimonoseki", name: "下関市", source: "city.shimonoseki.lg.jp(16段・第2=0.385)",
    levels: [
      { level: "1",  annual: 18810,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "2",  annual: 25410,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "5",  annual: 66000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 79200,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "16", annual: 158400, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "yamaguchi", name: "山口市", source: "city.yamaguchi.lg.jp(15段独自境界130/220/330)",
    levels: [
      { level: "1",  annual: 18845,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 66120,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 79344,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 85956,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "15", annual: 171912, ctx: { isSelfTaxable: true, totalIncome: 11000000 } },
    ],
  },
  {
    slug: "hikari", name: "光市", source: "city.hikari.lg.jp(独自境界125/190/290)",
    // 13段・基準66090・第2=0.435・第4=0.875・独自境界(125/190/290/400/500/600/700万)。
    levels: [
      { level: "1",  annual: 18830,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 66090,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 74350,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "7",  annual: 82610,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "13", annual: 150350, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "shunan", name: "周南市", source: "city.shunan.lg.jp(14段)",
    // 14段・基準59520・第4=0.85・第13を720-1000/1000で2分割。
    levels: [
      { level: "1",  annual: 16970,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 59520,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 68450,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 142850, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
      { level: "14", annual: 154760, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  // ── 徳島県(2026-06-24・みよし広域=三好/東みよし・代表非標準を転記) ──
  {
    slug: "tokushima", name: "徳島市", source: "city.tokushima.tokushima.jp(15段)",
    levels: [
      { level: "1",  annual: 22846,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 80160,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 96192,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 208416, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "naruto", name: "鳴門市", source: "city.naruto.lg.jp(16段・第6=50万境界)",
    // 16段・基準79200・★第6を合計所得50万未満で新設・年額=基準額×乗率。
    levels: [
      { level: "1",  annual: 22572,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 87120,  ctx: { isSelfTaxable: true, totalIncome: 300000 } },
      { level: "7",  annual: 95040,  ctx: { isSelfTaxable: true, totalIncome: 800000 } },
      { level: "16", annual: 205920, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "anantokushima", name: "阿南市", source: "city.anan.tokushima.jp(15段)",
    levels: [
      { level: "1",  annual: 22800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 95700,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 207400, ctx: { isSelfTaxable: true, totalIncome: 10000000 } },
    ],
  },
  {
    slug: "kamikatsu", name: "上勝町", source: "kamikatsu.jp 広報(第7=200/第8=300独自境界)",
    levels: [
      { level: "1",  annual: 20520,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 72000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "7",  annual: 93600,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "8",  annual: 108000, ctx: { isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "13", annual: 172800, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "miyoshitokushima", name: "三好市(みよし広域=東みよしと同一)", source: "miyoshikouiki.jp 条例",
    levels: [
      { level: "1",  annual: 21204,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 74400,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 89280,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 178560, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  // ── 鳥取単独/島根単独 A-case再追加(2026-06-24・git競合で消失分を復元・回帰検知用) ──
  {
    slug: "tottori", name: "鳥取市(再)", source: "city.tottori.lg.jp 条例",
    levels: [
      { level: "1",  annual: 20862,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 73200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "7",  annual: 98820,  ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "13", annual: 175680, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "yonago", name: "米子市(再)", source: "city.yonago.lg.jp",
    levels: [
      { level: "1",  annual: 19500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 77800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 89500,  ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "14", annual: 202300, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "kurayoshi", name: "倉吉市(再)", source: "city.kurayoshi.lg.jp(独自境界)",
    levels: [
      { level: "1",  annual: 21800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 76700,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 86300,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "15", annual: 199400, ctx: { isSelfTaxable: true, totalIncome: 9000000 } },
    ],
  },
  {
    slug: "yurihama", name: "湯梨浜町(再)", source: "yurihama.jp 条例(15段)",
    levels: [
      { level: "1",  annual: 23000,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 80900,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "15", annual: 210300, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "oda", name: "大田市(再)", source: "city.oda.lg.jp(17段・県内最高)",
    levels: [
      { level: "1",  annual: 25800,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 87600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 105120, ctx: { isSelfTaxable: true, totalIncome: 500000 } },
      { level: "17", annual: 271560, ctx: { isSelfTaxable: true, totalIncome: 15000000 } },
    ],
  },
  {
    slug: "yasugi", name: "安来市(再)", source: "city.yasugi.shimane.jp(15段・60万境界)",
    levels: [
      { level: "1",  annual: 19500,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 78000,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 93600,  ctx: { isSelfTaxable: true, totalIncome: 400000 } },
      { level: "15", annual: 187200, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "matsue", name: "松江市(再)", source: "city.matsue.lg.jp(独自境界)",
    levels: [
      { level: "1",  annual: 22400,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 78600,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 90400,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 188700, ctx: { isSelfTaxable: true, totalIncome: 12000000 } },
    ],
  },
  {
    slug: "hamada", name: "浜田市(再・浜田地区広域=江津と同一)", source: "hamadakouiki.jp",
    levels: [
      { level: "1",  annual: 22572,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79200,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "7",  annual: 110880, ctx: { isSelfTaxable: true, totalIncome: 1500000 } },
      { level: "13", annual: 205920, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
  {
    slug: "kawamoto", name: "川本町(再・邑智郡=美郷/邑南と同一)", source: "ohchijim.com",
    levels: [
      { level: "1",  annual: 27930,  ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, sumIncome: 500000 } },
      { level: "5",  annual: 79800,  ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, sumIncome: 1000000 } },
      { level: "6",  annual: 91770,  ctx: { isSelfTaxable: true, totalIncome: 1000000 } },
      { level: "13", annual: 199500, ctx: { isSelfTaxable: true, totalIncome: 8000000 } },
    ],
  },
];

console.log("== A. 実値突合（公式段階別額 × サンプル所得） ==");
for (const cs of CASES) {
  const data = loadKaigo(cs.slug);
  if (!data) { fail++; console.log(`  ❌ ${cs.name}: kaigo-2026.json なし`); continue; }
  for (const L of cs.levels) {
    const r = calculateKaigo(data, L.ctx);
    if (!r) { fail++; console.log(`  ❌ ${cs.name} 第${L.level}: 計算 null`); continue; }
    eq(`${cs.name} 第${L.level}: 段階判定`, r.level, L.level, `(出典 ${cs.source})`);
    eq(`${cs.name} 第${L.level}: 年額`, r.annual, L.annual);
    eq(`${cs.name} 第${L.level}: 月額`, r.monthly, Math.round(L.annual / 12));
  }
}

// ─── B. 段階判定スイープ（全 verified/inferred 自治体） ───────────────
console.log("\n== B. 段階判定スイープ（全 verified/inferred） ==");
let swept = 0;
for (const slug of readdirSync(DATA)) {
  const data = loadKaigo(slug);
  if (!data || !["verified", "inferred"].includes(data.status)) continue;
  if (typeof data.baseAmount !== "number") continue;
  swept++;
  for (const b of data.brackets) {
    const ctx = ctxFromCriteria(b.criteria);
    const r = calculateKaigo(data, ctx);
    if (!r) { fail++; console.log(`  ❌ ${slug} 第${b.level}: null`); continue; }
    eq(`${slug} 第${b.level}: 代表所得→正段階`, r.level, b.level);
    // annual フィールドがあればそれが正（百円丸め等）。なければ baseAmount×rate。
    const expected = b.annual ?? Math.round(data.baseAmount * b.rate);
    eq(`${slug} 第${b.level}: 年額(annual優先)`, r.annual, expected);
  }
}
console.log(`  (スイープ対象 ${swept} 自治体)`);

// ─── 結果 ─────────────────────────────────────────────────────
console.log(`\n結果: PASS ${pass} / FAIL ${fail}`);
console.log(fail === 0 ? "✅ 全テスト通過" : "❌ 失敗あり");
process.exit(fail === 0 ? 0 : 1);
