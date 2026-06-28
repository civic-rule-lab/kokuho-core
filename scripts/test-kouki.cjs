/**
 * js/core/kouki.js 公式オラクル突合テスト
 * 実行: node scripts/test-kouki.cjs
 *
 * 本リポジトリは package.json "type":"module" のため、ブラウザグローバル形式の
 * js/core/*.js は import/require では読めない。ここでは vm で評価して関数を取り出す
 * （js/core/kouki.js・shared/income.js を一切改変せずに Node から検証するため）。
 *
 * オラクル:
 *  (1) 東京都 公式計算例（令和8年度）… 単身6ケース
 *  (2) 北海道 公式年間保険料額（恵庭市 資料No.17）… 単身5ケース
 *  (3) 全47県 厚労省PDF「基礎年金受給者(年金収入84万円)月額」… 医療7.2割÷12 が±10円以内
 */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const ROOT = path.join(__dirname, '..');

function loadCjs(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const sandbox = { module: { exports: {} }, require, console, Math, Number, Array, JSON, Object };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(src, sandbox);
  return sandbox.module.exports;
}
const { calcPensionIncome, calcSalaryIncome } = loadCjs('js/core/shared/income.js');
const { calculateKouki } = loadCjs('js/core/kouki.js');

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const registry = readJson(path.join(ROOT, 'registry', 'index.json'));
// prefectureSlug → 代表自治体slug（先頭）
const repSlug = {};
for (const m of registry.municipalities) if (!repSlug[m.prefectureSlug]) repSlug[m.prefectureSlug] = m.citySlug;
const dataOf = prefSlug => readJson(path.join(ROOT, 'data', 'municipalities', repSlug[prefSlug], 'kouki-2026.json'));

let pass = 0, fail = 0;
const ok = (cond, label, got, want) => {
  if (cond) { pass++; }
  else { fail++; console.log(`  ❌ ${label}\n     期待=${JSON.stringify(want)} 実際=${JSON.stringify(got)}`); }
};

// 世帯→エンジン入力（単身・65歳以上想定）
function build(data, { pension = 0, salary = 0, age = 75, insured = 1, earners = 1 }) {
  const pI = calcPensionIncome(pension, age), sI = calcSalaryIncome(salary);
  const judge = Math.max((age >= 65 ? Math.max(pI - 150000, 0) : pI) + sI, 0);
  return { totalIncome: pI + sI, reductionJudgmentIncome: judge, householdInsuredCount: insured, pensionSalaryEarnerCount: earners };
}

// (1) 東京都 公式計算例
const tokyo = dataOf('tokyo');
const tokyoCases = [
  ["東京 年金350万 無軽減", { pension: 3_500_000 }, { medicalTotal: 242900, childcareTotal: 6200, total: 249100 }],
  ["東京 年金1500万 限度額", { pension: 15_000_000 }, { medicalTotal: 850000, childcareTotal: 21000, total: 871000 }],
  ["東京 年金150万 7割軽減", { pension: 1_500_000 }, { medicalTotal: 14900, childcareTotal: 300, total: 15200 }],
  ["東京 公式例19 年金300万", { pension: 3_000_000 }, { medicalTotal: 198500, childcareTotal: 5100, total: 203600 }],
  ["東京 公式例26 給与900万", { salary: 9_000_000 }, { medicalTotal: 707300, childcareTotal: 18500, total: 725800 }],
];
for (const [name, inp, exp] of tokyoCases) {
  const o = calculateKouki(build(tokyo, inp), tokyo);
  ok(o.medicalTotal === exp.medicalTotal && o.childcareTotal === exp.childcareTotal && o.total === exp.total, name, o, exp);
}

// (2) 北海道 公式年間保険料額（恵庭市 資料No.17）
const hokkaido = dataOf('hokkaido');
const hokCases = [
  ["北海道 年金153万 7.2割", 1_530_000, { medicalTotal: 16700, childcareTotal: 400, total: 17100 }],
  ["北海道 年金168万 7.2割", 1_680_000, { medicalTotal: 34200, childcareTotal: 800, total: 35000 }],
  ["北海道 年金198.5万 5割", 1_985_000, { medicalTotal: 82800, childcareTotal: 1900, total: 84700 }],
  ["北海道 年金224万 2割", 2_240_000, { medicalTotal: 130400, childcareTotal: 3000, total: 133400 }],
  ["北海道 年金250万 無", 2_500_000, { medicalTotal: 172500, childcareTotal: 4000, total: 176500 }],
];
for (const [name, pension, exp] of hokCases) {
  const o = calculateKouki(build(hokkaido, { pension }), hokkaido);
  ok(o.medicalTotal === exp.medicalTotal && o.childcareTotal === exp.childcareTotal && o.total === exp.total, name, o, exp);
}

// (2b) 被扶養者軽減（旧・被用者保険の被扶養者）… 所得割なし＋均等割5割、低所得軽減は高い方
function depInput(data, opts){ var inp = build(data, opts); inp.formerEmployeeInsuranceDependent = true; return inp; }
const depCases = [
  ["東京 被扶養者 年金250万（無軽減→均等割5割・所得割なし）", { pension: 2_500_000 }, { medicalTotal: 26600, childcareTotal: 600, total: 27200, reductionLabel: "被扶養者軽減" }],
  ["東京 被扶養者 年金150万（7割が優先・被扶養者でも結果同じ）", { pension: 1_500_000 }, { medicalTotal: 14900, childcareTotal: 300, total: 15200, reductionLabel: "7割軽減（被扶養者）" }],
];
for (const [name, inp, exp] of depCases) {
  const o = calculateKouki(depInput(tokyo, inp), tokyo);
  ok(o.medicalTotal===exp.medicalTotal && o.childcareTotal===exp.childcareTotal && o.total===exp.total && o.reductionLabel===exp.reductionLabel, name, o, exp);
}

// (3) 全47県 厚労省PDF 基礎年金受給者(84万) 月額（医療分のみ・7.2割）
const oracle84 = { hokkaido:1392,aomori:1175,iwate:1133,miyagi:1216,akita:1300,yamagata:1225,fukushima:1143,ibaraki:1155,tochigi:1146,gunma:1267,saitama:1217,chiba:1183,tokyo:1242,kanagawa:1225,niigata:1148,toyama:1302,ishikawa:1337,fukui:1263,yamanashi:1228,nagano:1139,gifu:1292,shizuoka:1192,aichi:1308,mie:1280,shiga:1292,kyoto:1390,osaka:1515,hyogo:1363,nara:1325,wakayama:1371,tottori:1217,shimane:1334,okayama:1400,hiroshima:1285,yamaguchi:1482,tokushima:1423,kagawa:1353,ehime:1298,kochi:1409,fukuoka:1548,saga:1603,nagasaki:1308,kumamoto:1470,oita:1492,miyazaki:1300,kagoshima:1625,okinawa:1423 };
let maxDiff = 0;
for (const pref of Object.keys(oracle84)) {
  const data = dataOf(pref);
  const o = calculateKouki(build(data, { pension: 840000 }), data);
  const monthly = Math.round(o.medicalTotal / 12);
  const diff = Math.abs(monthly - oracle84[pref]);
  maxDiff = Math.max(maxDiff, diff);
  ok(diff <= 10, `84万オラクル ${pref} (差${monthly - oracle84[pref]}円/月)`, monthly, oracle84[pref]);
}

console.log(`\n========================================`);
console.log(`東京公式 ${tokyoCases.length} / 北海道公式 ${hokCases.length} / 84万オラクル全47県`);
console.log(`84万オラクル 最大差: ${maxDiff}円/月（±10円以内は各広域連合の月額丸め差で正常）`);
console.log(`採点: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
