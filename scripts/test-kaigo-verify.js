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
    slug: "kawasaki", name: "川崎市", source: "city.kawasaki.jp/350/page/0000026539.html",
    // 第9期（2024-2026）基準額 月6,600円（年79,200円）・標準9段階。annual は公表月額×12。
    levels: [
      { level: "1", annual: 22572, ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, pensionIncome: 700000 } },
      { level: "2", annual: 38412, ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, pensionIncome: 1000000 } },
      { level: "3", annual: 54252, ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, pensionIncome: 1500000 } },
      { level: "4", annual: 71280, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false } },
      { level: "5", annual: 79200, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: true,  totalIncome: 800000 } },
      { level: "6", annual: 95040, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: true,  totalIncome: 1500000 } },
      { level: "7", annual: 114840, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: true, totalIncome: 2500000 } },
      { level: "8", annual: 134640, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: true, totalIncome: 3500000 } },
      { level: "9", annual: 158400, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: true, totalIncome: 5000000 } },
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
