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
