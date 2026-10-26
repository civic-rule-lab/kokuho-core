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
 *  (4) 兵庫県 公式計算例（令和8年度）… 5ケース（賦課額の端数規定なし＝1円単位）
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

// (4) 兵庫県 公式計算例（令和8年度・端数の規定が条例ごとに違うことの検査）
//   兵庫県後期高齢者医療広域連合「具体的な保険料のケース（令和8年度）」https://www.kouiki-hyogo.jp/seido/1001473/1001557.html
//   条例に賦課額の100円未満切り捨ての規定がなく、1円単位で出る。軽減後の均等割・所得割は1円未満切り捨て。
const hyogo = dataOf('hyogo');
const hyogoCases = [
  ["兵庫 単身 年金110万 7.2割", { totalIncome: 0, reductionJudgmentIncome: 0, householdInsuredCount: 1, pensionSalaryEarnerCount: 1 }, { medicalTotal: 16359, childcareTotal: 405, total: 16764 }],
  ["兵庫 単身 年金190万 5割", { totalIncome: 800000, reductionJudgmentIncome: 650000, householdInsuredCount: 1, pensionSalaryEarnerCount: 1 }, { medicalTotal: 29213 + 39849, childcareTotal: 675 + 888, total: 70625 }],
  ["兵庫 子(給与110万)と同居 年金168万 2割", { totalIncome: 580000, reductionJudgmentIncome: 880000, householdInsuredCount: 1, pensionSalaryEarnerCount: 2 }, { medicalTotal: 46741 + 16155, childcareTotal: 1080 + 360, total: 64336 }],
  ["兵庫 単身 年金300万 無", { totalIncome: 1900000, reductionJudgmentIncome: 1750000, householdInsuredCount: 1, pensionSalaryEarnerCount: 1 }, { medicalTotal: 58427 + 158319, childcareTotal: 1351 + 3528, total: 221625 }],
  ["兵庫 子(事業300万)と同居 年金110万 無", { totalIncome: 0, reductionJudgmentIncome: 3000000, householdInsuredCount: 1, pensionSalaryEarnerCount: 1 }, { medicalTotal: 58427, childcareTotal: 1351, total: 59778 }],
];
for (const [name, inp, exp] of hyogoCases) {
  const o = calculateKouki(inp, hyogo);
  ok(o.medicalTotal === exp.medicalTotal && o.childcareTotal === exp.childcareTotal && o.total === exp.total, name, o, exp);
}

// (5) 各広域連合の公式計算例（令和8年度）… 端数の規則が県ごとに違うことを独立の値で検査
//   単身・年金収入のみの例は build({ pension }) で入力を作る。世帯の例は入力をそのまま書く。
const P = pension => ({ pension });
const officialCases = [
  // [県, 名前, 入力（build の引数 or エンジン入力）, 期待 {medicalTotal, childcareTotal}, 出典]
  ["aomori",   "年金160万",  P(1_600_000), { medicalTotal: 20400, childcareTotal: 500 },   "青森 令和8年度計算例"],
  ["ehime",    "年金153万",  P(1_530_000), { medicalTotal: 15570, childcareTotal: 390 },   "愛媛 保険料ページ（10円未満切捨て）"],
  ["ehime",    "年金180万",  P(1_800_000), { medicalTotal: 54240, childcareTotal: 1330 },  "同"],
  ["ehime",    "年金200万",  P(2_000_000), { medicalTotal: 90510, childcareTotal: 2230 },  "同"],
  ["ehime",    "年金300万",  P(3_000_000), { medicalTotal: 199540, childcareTotal: 4990 }, "同"],
  ["fukui",    "年金230万",  P(2_300_000), { medicalTotal: 137500, childcareTotal: 3300 }, "福井 保険料のしくみ"],
  ["kanagawa", "年金300万",  P(3_000_000), { medicalTotal: 203940, childcareTotal: 5000 }, "神奈川 計算例（10円未満切捨て）"],
  ["kumamoto", "年金153万",  P(1_530_000), { medicalTotal: 17600 },  "熊本 医療分の表"],
  ["kumamoto", "年金168万",  P(1_680_000), { medicalTotal: 34200 },  "同"],
  ["kumamoto", "年金199万",  P(1_990_000), { medicalTotal: 82300 },  "同"],
  ["kumamoto", "年金225万",  P(2_250_000), { medicalTotal: 130000 }, "同"],
  ["kumamoto", "年金300万",  P(3_000_000), { medicalTotal: 225500 }, "同"],
  ["mie",      "年金77万",   P(770_000),   { medicalTotal: 15356, childcareTotal: 411 },   "三重 モデル世帯（1円単位）"],
  ["mie",      "年金201万",  P(2_010_000), { medicalTotal: 89618, childcareTotal: 2296 },  "同"],
  ["oita",     "年金120万",  P(1_200_000), { medicalTotal: 17900, childcareTotal: 400 },   "大分 しおり"],
  ["oita",     "年金160万",  P(1_600_000), { medicalTotal: 25800, childcareTotal: 500 },   "同"],
  ["oita",     "年金180万",  P(1_800_000), { medicalTotal: 62400, childcareTotal: 1300 },  "同"],
  ["oita",     "年金220万",  P(2_200_000), { medicalTotal: 126700, childcareTotal: 2700 }, "同"],
  ["okinawa",  "年金168万",  P(1_680_000), { medicalTotal: 33295, childcareTotal: 777 },   "沖縄 保険料（1円単位）"],
  ["okinawa",  "年金199万",  P(1_990_000), { medicalTotal: 80226, childcareTotal: 1841 },  "同"],
  ["okinawa",  "年金225万",  P(2_250_000), { medicalTotal: 126632, childcareTotal: 2904 }, "同"],
  ["okinawa",  "年金230万",  P(2_300_000), { medicalTotal: 144237, childcareTotal: 3292 }, "同"],
  ["tottori",  "年金80万",   P(800_000),   { medicalTotal: 14500, childcareTotal: 400 },   "鳥取 令和8年度計算例"],
  ["tottori",  "年金212万",  P(2_120_000), { medicalTotal: 104400, childcareTotal: 2500 }, "同"],
  ["tokyo",    "年金198.5万 5割", P(1_985_000), { medicalTotal: 71600, childcareTotal: 1800 }, "東京 令和8年度計算例 No.4"],
  ["okayama",  "夫 年金240万（夫婦・2割）", { totalIncome: 1_300_000, reductionJudgmentIncome: 1_150_000, householdInsuredCount: 2, pensionSalaryEarnerCount: 1 }, { medicalTotal: 142700, childcareTotal: 3200 }, "岡山 計算例"],
  ["kochi",    "夫 所得145万（夫婦・2割）", { totalIncome: 1_450_000, reductionJudgmentIncome: 1_300_000, householdInsuredCount: 2, pensionSalaryEarnerCount: 1 }, { medicalTotal: 153400, childcareTotal: 3560 }, "高知 しおり（子ども分10円未満切捨て）"],
  ["hiroshima","7割軽減",    { totalIncome: 0, reductionJudgmentIncome: 0 }, { medicalTotal: 15425, childcareTotal: 401 }, "広島 保険料（1円単位）"],
  ["hiroshima","被扶養者5割", { totalIncome: 3_000_000, reductionJudgmentIncome: 3_000_000, formerEmployeeInsuranceDependent: true }, { medicalTotal: 27545, childcareTotal: 668 }, "同"],
  ["tokushima","被扶養者5割", { totalIncome: 3_000_000, reductionJudgmentIncome: 3_000_000, formerEmployeeInsuranceDependent: true }, { medicalTotal: 30400, childcareTotal: 670 }, "徳島（医療100円・子ども10円未満切捨て）"],
  ["yamaguchi","7割（所得割なし）", { totalIncome: 0, reductionJudgmentIncome: 0 }, { medicalTotal: 17783, childcareTotal: 406 }, "山口 軽減後均等割の表"],
];
for (const [pref, name, inp, exp, src] of officialCases) {
  const data = dataOf(pref);
  const input = ('pension' in inp) ? build(data, inp) : inp;
  const o = calculateKouki(input, data);
  const good = o.medicalTotal === exp.medicalTotal && (exp.childcareTotal === undefined || o.childcareTotal === exp.childcareTotal);
  ok(good, `${pref} ${name}（${src}）`, { medicalTotal: o.medicalTotal, childcareTotal: o.childcareTotal }, exp);
}

console.log(`\n========================================`);
console.log(`東京公式 ${tokyoCases.length} / 北海道公式 ${hokCases.length} / 兵庫公式 ${hyogoCases.length} / 各県公式 ${officialCases.length} / 84万オラクル全47県`);
console.log(`84万オラクル 最大差: ${maxDiff}円/月（±10円以内は各広域連合の月額丸め差で正常）`);
console.log(`採点: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
