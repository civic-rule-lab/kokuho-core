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
