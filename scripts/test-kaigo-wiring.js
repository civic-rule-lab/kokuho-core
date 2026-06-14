/**
 * 介護保険料 入力結線テスト（生入力 → 課税判定 → 段階 → 額）
 * 実行: node scripts/test-kaigo-wiring.js
 *
 * calculateHousehold（kokuho→jumin→kaigo の1パス）で、年金・給与の生入力から
 * jumin が課税状況(isTaxable/totalIncome)を出し、household が sumIncome を合算して
 * kaigo の段階判定コンテキストを組み立てる——その一気通貫を富山市の公式段階・額で突合する。
 */
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { load } = require("./lib/core-loader.cjs");
const { calculateHousehold } = load("household.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const j = (p) => JSON.parse(readFileSync(path.join(ROOT, p), "utf-8"));

const toyama = {
  kokuho: j("data/municipalities/toyama/kokuho-2026.json"),
  kaigo:  j("data/municipalities/toyama/kaigo-2026.json"),
  jumin:  null,   // 富山はjumin未整備→標準率で課税判定（段階判定に必要な isTaxable/totalIncome は出る）
};

let pass = 0, fail = 0;
function run(name, members, expectLevel, expectAnnual) {
  const r = calculateHousehold(toyama, { members, year: 2026 }, { mode: "accurate" });
  const k = r.kaigo.find(x => x.memberId === "head");
  if (!k) { fail++; console.log(`❌ ${name}: 65歳以上の介護結果なし`); return; }
  const okL = String(k.level) === String(expectLevel);
  const okA = k.annual === expectAnnual;
  if (okL && okA) { pass++; console.log(`✅ ${name} → 第${k.level}段階 ${k.annual.toLocaleString()}円/年`); }
  else { fail++; console.log(`❌ ${name}: 期待=第${expectLevel}/${expectAnnual} 実際=第${k.level}/${k.annual}`); }
}

const head = (o) => ({ id: "head", role: "head", isKokuhoInsured: true, ...o });
const spouse = (o) => ({ id: "spouse", role: "spouse", isKokuhoInsured: true, ...o });

console.log("== 富山市 入力結線（生入力→段階→額） ==");
// 単身・世帯全員非課税層（sumIncome合算で判定）
run("単身 年金70万（世帯非課税）", [head({ age: 67, pension: 700_000 })], 1, 19_800);
run("単身 年金150万（世帯非課税）", [head({ age: 67, pension: 1_500_000 })], 3, 54_300);
// 本人非課税・世帯課税層（第4〜5・sumIncome）: 本人年金少・配偶者が課税
run("夫婦 本人年金70万＋配偶者給与400万", [head({ age: 67, pension: 700_000 }), spouse({ age: 60, salary: 4_000_000 })], 4, 67_400);
// 本人課税層（第6〜14・合計所得金額）
run("単身 年金250万（本人課税）", [head({ age: 67, pension: 2_500_000 })], 8, 103_000);
run("単身 給与150万（本人課税）", [head({ age: 67, salary: 1_500_000 })], 7, 95_100);
run("単身 給与400万（本人課税）", [head({ age: 67, salary: 4_000_000 })], 9, 118_800);

console.log(`\n結果: PASS ${pass} / FAIL ${fail}`);
console.log(fail === 0 ? "✅ 入力結線テスト通過" : "❌ 失敗あり");
process.exit(fail === 0 ? 0 : 1);
