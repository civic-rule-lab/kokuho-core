/**
 * 介護保険料 段階判定 構造健全性バリデータ
 * 実行: node scripts/validate-kaigo-brackets.js            # 全 kaigo-2026.json
 *       node scripts/validate-kaigo-brackets.js --slug=toyama
 *       node scripts/validate-kaigo-brackets.js --verified-only
 *
 * 実値突合(test-kaigo-verify=額の一致)と対をなす「ロジックの一致」ゲート。
 * 各 bracket が構造的に正しいかを first-match エンジンで機械検査する:
 *   [R] 到達可能性: 各 bracket の criteria から代表 ctx を作り first-match した結果が
 *       その bracket 自身になる（順序ミス・先行 bracket による shadowing を検出）
 *   [O] レベル昇順: brackets 配列の level が数値昇順
 *   [M] annual 単調非減少: annual（or baseAmount×rate）が level とともに非減少
 *   [C] 課税状況層の整合: householdAllNonTaxable=true 層 → false&selfTaxable=false 層
 *       → selfTaxable=true 層、の順に並ぶ（層が前後しない）
 *   [F] fallbackLevel が brackets 内に存在
 * baseAmount=null（needs_update）でも構造は検査できる（額系は annual 有無で判定）。
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { calculateKaigo } = require("./lib/kaigo-loader.cjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data", "municipalities");

const slugArg = (process.argv.find(a => a.startsWith("--slug=")) || "").replace("--slug=", "");
const verifiedOnly = process.argv.includes("--verified-only");

function repCtx(c = {}) {
  const pick = (min, max) =>
    (min != null && max != null) ? Math.floor((min + max) / 2)
    : (max != null) ? max : (min != null) ? min : 0;
  return {
    pensionIncome: pick(c.pensionIncomeMin, c.pensionIncomeMax),
    totalIncome:   pick(c.totalIncomeMin, c.totalIncomeMax),
    sumIncome:     pick(c.sumIncomeMin, c.sumIncomeMax),
    isSelfTaxable:            c.selfTaxable ?? false,
    isHouseholdAllNonTaxable: c.householdAllNonTaxable ?? false,
  };
}

// 課税状況層の序列（0=世帯非課税, 1=本人非課税世帯課税, 2=本人課税）
function layer(c = {}) {
  if (c.householdAllNonTaxable === true) return 0;
  if (c.selfTaxable === true) return 2;
  return 1;
}

function annualOf(data, b) {
  return b.annual ?? (typeof data.baseAmount === "number" ? Math.round(data.baseAmount * b.rate) : null);
}

function check(slug, data) {
  const issues = [];
  if (!Array.isArray(data.brackets) || data.brackets.length === 0) {
    return ["brackets が空"];
  }
  const bs = data.brackets;

  // [R] 到達可能性 / shadowing
  for (const b of bs) {
    const r = calculateKaigo(data, repCtx(b.criteria));
    if (!r) { issues.push(`第${b.level}: 計算 null`); continue; }
    if (String(r.level) !== String(b.level))
      issues.push(`第${b.level}: 代表ctxが第${r.level}にmatch（順序/shadowing疑い）`);
  }

  // [O] レベル昇順
  const nums = bs.map(b => Number(String(b.level).replace(/[^0-9]/g, "")));
  for (let i = 1; i < nums.length; i++)
    if (nums[i] <= nums[i - 1]) issues.push(`level 非昇順: ${bs[i-1].level}→${bs[i].level}`);

  // [C] 課税状況層の昇順
  const layers = bs.map(b => layer(b.criteria));
  for (let i = 1; i < layers.length; i++)
    if (layers[i] < layers[i - 1])
      issues.push(`課税状況層が前後: 第${bs[i-1].level}(層${layers[i-1]})→第${bs[i].level}(層${layers[i]})`);

  // [M] annual 単調非減少
  let prev = -1, prevLevel = null;
  for (const b of bs) {
    const a = annualOf(data, b);
    if (a == null) continue;
    if (a < prev) issues.push(`annual 減少: 第${prevLevel}(${prev})→第${b.level}(${a})`);
    prev = a; prevLevel = b.level;
  }

  // [F] fallbackLevel 存在
  if (data.fallbackLevel != null &&
      !bs.some(b => String(b.level) === String(data.fallbackLevel)))
    issues.push(`fallbackLevel=${data.fallbackLevel} が brackets に無い`);

  return issues;
}

// ─── 実行 ─────────────────────────────────────────────────────
let total = 0, ok = 0, ng = 0;
const fails = [];
const slugs = slugArg ? [slugArg] : readdirSync(DATA);
for (const slug of slugs) {
  const p = path.join(DATA, slug, "kaigo-2026.json");
  if (!existsSync(p)) continue;
  const data = JSON.parse(readFileSync(p, "utf-8"));
  if (verifiedOnly && !["verified", "inferred"].includes(data.status)) continue;
  total++;
  const issues = check(slug, data);
  if (issues.length === 0) ok++;
  else { ng++; fails.push([slug, data.status, issues]); }
}

for (const [slug, status, issues] of fails.slice(0, 40)) {
  console.log(`❌ ${slug} (${status})`);
  for (const i of issues) console.log(`     - ${i}`);
}
console.log(`\n対象 ${total} 件 | 構造OK ${ok} | 構造NG ${ng}`);
process.exit(ng === 0 ? 0 : 1);
