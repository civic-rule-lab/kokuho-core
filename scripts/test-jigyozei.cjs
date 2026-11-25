/**
 * test-jigyozei.cjs — 個人の事業税（js/core/jigyozei.js）の検証
 *   1. 手計算の例: （事業の所得 − 事業主控除 290万円）× 税率。千円未満・百円未満の切捨て
 *   2. 境界: 290万円ちょうど・課税標準が 1,000 円に満たない・税額が 100 円に満たない
 *   3. 区分: 5%・4%・3%・課されない
 *   4. 制度値の整合（条文の値）
 *   5. 不正な入力・制度値の欠落は例外
 * 実行: node scripts/test-jigyozei.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const Z = require(path.join(ROOT, 'js/core/jigyozei.js'));
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/kojin-jigyozei-2026.json'), 'utf8'));
let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
const errOf = (f) => { try { f(); return null; } catch (e) { return e.name; } };
const tax = (income, rateKey) => Z.calc(db, { income, rateKey: rateKey || 'type1' }).tax;

// 1. 手計算の例
A('所得 3,650,000・5% → (365万−290万)×5% ＝ 37,500', tax(3650000) === 37500);
A('所得 5,758,372・5% → 課税標準 2,858,000 → 142,900', Z.calc(db, { income: 5758372, rateKey: 'type1' }).taxable === 2858000 && tax(5758372) === 142900);
A('所得 10,000,000・5% → 355,000', tax(10000000) === 355000);
A('戻り値に控除額と税率が入る', (() => { const r = Z.calc(db, { income: 3650000, rateKey: 'type1' }); return r.kojo === 2900000 && r.ratePercent === 5 && r.rateKey === 'type1' && r.income === 3650000; })());

// 2. 境界
A('所得 2,900,000（控除と同額）→ 0', tax(2900000) === 0);
A('所得 2,900,999（課税標準が 1,000 円に満たない）→ 0', Z.calc(db, { income: 2900999, rateKey: 'type1' }).taxable === 0 && tax(2900999) === 0);
A('所得 2,901,000 → 課税標準 1,000 → 50 円は 100 円に満たないので 0', Z.calc(db, { income: 2901000, rateKey: 'type1' }).taxable === 1000 && tax(2901000) === 0);
A('所得 2,902,000 → 課税標準 2,000 → 100', tax(2902000) === 100);
A('所得 2,903,999 → 課税標準 3,000 → 150 → 100', tax(2903999) === 100);
A('所得 0 → 0', tax(0) === 0);
A('所得が負（赤字）→ 0', tax(-500000) === 0);
A('所得に小数（3,650,000.9）→ 円未満を切り捨てて計算', tax(3650000.9) === 37500);

// 3. 区分
A('第2種（4%）: 所得 3,650,000 → 30,000', tax(3650000, 'type2') === 30000);
A('第3種（5%）: 第1種と同じ額', tax(3650000, 'type3') === tax(3650000, 'type1'));
A('第3種のうち 3% の事業: 所得 3,650,000 → 22,500', tax(3650000, 'type3low') === 22500);
A('課されない事業（none）: 0', tax(3650000, 'none') === 0 && tax(100000000, 'none') === 0);
A('税率が高い区分ほど税額が大きい（3% ＜ 4% ＜ 5%）', tax(8000000, 'type3low') < tax(8000000, 'type2') && tax(8000000, 'type2') < tax(8000000, 'type1'));
A('所得が増えても税額は減らない（290万〜1,000万を 1,000 円刻み）', (() => { let p = 0; for (let i = 2900000; i <= 10000000; i += 1000) { const t = tax(i); if (t < p) return false; p = t; } return true; })());

// 4. 制度値の整合
const rate = (k) => db.rates.find((r) => r.key === k).ratePercent;
A('事業主控除 ＝ 2,900,000（地方税法 第72条の49の14）', db.jigyonushiKojo.annual === 2900000);
A('税率 ＝ 第1種 5・第2種 4・第3種 5・第3種の一部 3（同 第72条の49の17）', rate('type1') === 5 && rate('type2') === 4 && rate('type3') === 5 && rate('type3low') === 3);
A('端数 ＝ 課税標準 1,000 円未満切捨て・税額 100 円未満切捨て（同 第20条の4の2）', db.rounding.taxableUnit === 1000 && db.rounding.taxUnit === 100);
A('区分の key が重複していない', new Set(db.rates.map((r) => r.key)).size === db.rates.length);
A('制度値に取得した一次資料の sha256 が入っている（64 桁・埋め残しなし）', db.meta.source.snapshot.files.every((f) => /^[0-9a-f]{64}$/.test(f.sha256)));

// 5. 不正な入力・制度値の欠落
A('income "3650000"（文字列）は TypeError', errOf(() => Z.calc(db, { income: '3650000', rateKey: 'type1' })) === 'TypeError');
A('income が無いときは TypeError', errOf(() => Z.calc(db, { rateKey: 'type1' })) === 'TypeError');
A('income NaN は RangeError', errOf(() => Z.calc(db, { income: NaN, rateKey: 'type1' })) === 'RangeError');
A('income Infinity は RangeError', errOf(() => Z.calc(db, { income: Infinity, rateKey: 'type1' })) === 'RangeError');
A('知らない区分は RangeError', errOf(() => Z.calc(db, { income: 3650000, rateKey: 'type9' })) === 'RangeError');
A('区分が無いときは RangeError', errOf(() => Z.calc(db, { income: 3650000 })) === 'RangeError');
A('制度値に事業主控除が無いときは例外', errOf(() => Z.calc({ rates: db.rates, rounding: db.rounding }, { income: 3650000, rateKey: 'type1' })) === 'Error');
A('制度値に端数の定めが無いときは例外', errOf(() => Z.calc({ rates: db.rates, jigyonushiKojo: db.jigyonushiKojo }, { income: 3650000, rateKey: 'type1' })) === 'Error');

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
