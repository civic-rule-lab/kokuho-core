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
    // 第9期（2024-2026）基準額 月6,600円（年79,200円）・標準9段階
    levels: [
      { level: "1", monthly: 1881, ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, pensionIncome: 700000,  totalIncome: 0 } },
      { level: "2", monthly: 3201, ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, pensionIncome: 1000000, totalIncome: 0 } },
      { level: "3", monthly: 4521, ctx: { isHouseholdAllNonTaxable: true,  isSelfTaxable: false, pensionIncome: 1500000, totalIncome: 0 } },
      { level: "4", monthly: 5940, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: false, pensionIncome: 0,       totalIncome: 500000 } },
      { level: "5", monthly: 6600, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: true,  pensionIncome: 0,       totalIncome: 800000 } },
      { level: "6", monthly: 7920, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: true,  pensionIncome: 0,       totalIncome: 1500000 } },
      { level: "7", monthly: 9570, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: true,  pensionIncome: 0,       totalIncome: 2500000 } },
      { level: "8", monthly: 11220, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: true, pensionIncome: 0,       totalIncome: 3500000 } },
      { level: "9", monthly: 13200, ctx: { isHouseholdAllNonTaxable: false, isSelfTaxable: true, pensionIncome: 0,       totalIncome: 5000000 } },
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
    eq(`${cs.name} 第${L.level}: 月額`, r.monthly, L.monthly);
    eq(`${cs.name} 第${L.level}: 年額`, r.annual, L.monthly * 12);
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
    eq(`${slug} 第${b.level}: annual=base×rate`, r.annual, Math.round(data.baseAmount * b.rate));
  }
}
console.log(`  (スイープ対象 ${swept} 自治体)`);

// ─── 結果 ─────────────────────────────────────────────────────
console.log(`\n結果: PASS ${pass} / FAIL ${fail}`);
console.log(fail === 0 ? "✅ 全テスト通過" : "❌ 失敗あり");
process.exit(fail === 0 ? 0 : 1);
