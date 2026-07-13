/**
 * test-shaho-wiring.cjs — 家計簿の社会保険(shaho)・所得税(shotoku)結線の Node レベル検証。
 *   ・vendored shaho.js が検証済みデータで公式料額表どおりに動く（アンカー）
 *   ・年間社会保険料控除 ＝ 本人負担月額×12 ＋ 賞与本人負担、の合成
 *   ・その socialInsurance が jumin / shotoku に正しく伝播して税額が動く
 * 実行: node scripts/test-shaho-wiring.cjs
 */
'use strict';
const path = require('path');
const fs = require('fs');
const Shaho = require('../js/core/shaho.js');
const Shotoku = require('../js/core/shotoku.js');
const { calculateJumin } = require('../js/core/jumin.js');

const ROOT = path.join(__dirname, '..');
const data = Shaho.loadData(path.join(ROOT, 'data', 'shaho'));
const shotokuDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'national', 'shotokuzei-2026.json'), 'utf8'));
const shotoku = Shotoku.createEngineFromDB(2026, shotokuDb);

let pass = 0, fail = 0;
const eq = (l, g, e) => { const ok = Math.abs(g - e) < 1e-6; console.log(`${ok ? '✓' : '✗'} ${l}: ${g}${ok ? '' : ` (期待 ${e})`}`); ok ? pass++ : fail++; };
const ok = (l, c) => { console.log(`${c ? '✓' : '✗'} ${l}`); c ? pass++ : fail++; };

// 会社員の年間社会保険料（本人負担）＝ 家計簿と同じ合成式
function shahoAnnual(salary, bonus, age, prefSlug) {
  const input = { monthlySalary: Math.round(salary / 12), targetMonth: '2026-07', prefSlug, age, koyoCategory: 'ippan' };
  if (bonus > 0) { input.bonus = bonus; input.bonusYearToDate = 0; }
  const r = Shaho.calculateShaho(input, data);
  const m = r.health.employee + r.care.employee + r.shienkin.employee + r.koseiNenkin.employee + r.koyo.employee;
  let bE = 0;
  if (r.bonus) { const b = r.bonus; bE = b.health.employee + b.care.employee + b.shienkin.employee + b.koseiNenkin.employee + ((b.koyo && b.koyo.employee) || 0); }
  return { annual: Math.round(m * 12 + bE), r };
}

console.log('— A. shaho アンカー（検証済みデータ・公式料額表）—');
const t = Shaho.calculateShaho({ monthlySalary: 300000, targetMonth: '2026-07', prefSlug: 'tokyo', age: 45 }, data);
eq('東京 報酬30万45歳 健保折半', t.health.half, 14775);
eq('東京 健保+介護 折半', t.healthWithCare.half, 17205);
eq('東京 支援金 折半', t.shienkin.half, 345);
eq('東京 厚年 折半', t.koseiNenkin.half, 27450);

console.log('\n— B. 年間社会保険料控除の合成 —');
const c1 = shahoAnnual(6000000, 0, 40, 'tokyo');
eq('年収600万40歳 東京 年間社保(本人)', c1.annual, 930000);
const c2 = shahoAnnual(6000000, 1000000, 40, 'tokyo');
ok('賞与100万で社保が増える', c2.annual > c1.annual);

console.log('\n— C. 税への伝播（socialInsurance で税が動く）—');
const jConcept = calculateJumin(null, { salary: 6000000, pension: 0, age: 40, socialInsurance: Math.round(6000000 * 0.144) });
const jReal = calculateJumin(null, { salary: 6000000, pension: 0, age: 40, socialInsurance: c1.annual });
ok('実額社保だと住民税が概算(0.144)と変わる', jReal.total !== jConcept.total);
ok('社保が大きいほど住民税は下がる（実額930k>概算864k → 税↓）', jReal.total < jConcept.total);
const stReal = shotoku.calcShotokuzei({ salary: 6000000, socialInsurance: c1.annual });
const stConcept = shotoku.calcShotokuzei({ salary: 6000000, socialInsurance: Math.round(6000000 * 0.144) });
ok('所得税も socialInsurance で動く', stReal.annualTax !== stConcept.annualTax);
ok('所得税額が正（>0）', stReal.annualTax > 0);

console.log('\n— D. 賞与は税の給与収入に加算（給与＋賞与で課税）—');
const stNoBonus = shotoku.calcShotokuzei({ salary: 6000000, socialInsurance: c1.annual });
const stBonus = shotoku.calcShotokuzei({ salary: 7000000, socialInsurance: c2.annual }); // grossSalary=給与+賞与
ok('賞与込みの給与収入は所得税が増える', stBonus.annualTax > stNoBonus.annualTax);

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exitCode = fail > 0 ? 1 : 0;
