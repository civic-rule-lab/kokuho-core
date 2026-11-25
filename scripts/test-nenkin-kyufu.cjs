/**
 * test-nenkin-kyufu.cjs — 年金額の目安（js/core/nenkin-kyufu.js）の検証
 *   1. 老齢基礎年金: 1年分 ＝ 満額 847,300 × 12 ÷ 480 ＝ 21,182.5 → 21,183。月数・反映の割合
 *   2. 老齢厚生年金（報酬比例部分）: 標準報酬月額 × 月数 × 5.481/1000
 *   3. 制度値の整合: 満額の年額と月額の関係（100円単位の端数処理）
 *   4. 不正な入力・制度値の欠落は例外（NaN や 0 円を黙って返さない）
 * 実行: node scripts/test-nenkin-kyufu.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const N = require(path.join(ROOT, 'js/core/nenkin-kyufu.js'));
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/nenkin-kyufu-2026.json'), 'utf8'));
let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
const errOf = (f) => { try { f(); return null; } catch (e) { return e.name; } };

// 1. 老齢基礎年金
A('基礎年金 1年分（12か月）＝ 21,183', N.kisoIncrease(db) === 21183);
A('基礎年金 months を省いたときは 12 か月', N.kisoIncrease(db, {}) === N.kisoIncrease(db, { months: 12 }));
A('基礎年金 6か月 ＝ 10,591（847,300×6÷480＝10,591.25）', N.kisoIncrease(db, { months: 6 }) === 10591);
A('基礎年金 0か月 ＝ 0', N.kisoIncrease(db, { months: 0 }) === 0);
A('基礎年金 全額免除の期間（反映 1/2）＝ 10,591', N.kisoIncrease(db, { fraction: [1, 2] }) === 10591);
A('基礎年金 4分の1免除の期間（反映 7/8）＝ 18,535（21,182.5×7/8＝18,534.69）', N.kisoIncrease(db, { fraction: [7, 8] }) === 18535);
A('基礎年金 40年分（1年分×40 と満額の差は四捨五入の分だけ）', Math.abs(N.kisoIncrease(db) * 40 - db.kiso.fullAnnual) <= 40);

// 2. 老齢厚生年金（報酬比例部分）
A('報酬比例 標準報酬月額 410,000 × 12 × 5.481/1000 ＝ 26,966.52 → 26,967', N.koseiIncrease(db, 410000) === 26967);
A('報酬比例 標準報酬月額 260,000 ＝ 17,100.72 → 17,101', N.koseiIncrease(db, 260000) === 17101);
A('報酬比例 標準報酬月額 650,000（上限）＝ 42,751.8 → 42,752', N.koseiIncrease(db, 650000) === 42752);
A('報酬比例 標準報酬月額 88,000（下限）＝ 5,787.94 → 5,788', N.koseiIncrease(db, 88000) === 5788);
A('報酬比例 6か月は 12か月のほぼ半分', N.koseiIncrease(db, 410000, { months: 6 }) === 13483);
A('報酬比例 標準報酬月額 0 ＝ 0', N.koseiIncrease(db, 0) === 0);

// 3. 制度値の整合
A('満額: 月額 70,608 × 12 ＝ 847,296 を 100 円単位に丸めると年額 847,300', Math.round(db.kiso.fullMonthly * 12 / 100) * 100 === db.kiso.fullAnnual);
A('満額: 年額 ÷ 12 の 1 円未満を切り捨てると月額 70,608', Math.floor(db.kiso.fullAnnual / 12) === db.kiso.fullMonthly);
A('乗率 ＝ 5.481/1000', db.kosei.rateNumerator / db.kosei.rateDenominator === 5.481 / 1000);
A('制度値に取得した一次資料の sha256 が入っている（64 桁・埋め残しなし）', db.meta.source.snapshot.files.every((f) => /^[0-9a-f]{64}$/.test(f.sha256)));

// 4. 不正な入力・制度値の欠落
A('標準報酬月額 "410000"（文字列）は TypeError', errOf(() => N.koseiIncrease(db, '410000')) === 'TypeError');
A('標準報酬月額 NaN は RangeError', errOf(() => N.koseiIncrease(db, NaN)) === 'RangeError');
A('標準報酬月額 -1 は RangeError', errOf(() => N.koseiIncrease(db, -1)) === 'RangeError');
A('標準報酬月額 Infinity は RangeError', errOf(() => N.koseiIncrease(db, Infinity)) === 'RangeError');
A('months 13 は RangeError', errOf(() => N.kisoIncrease(db, { months: 13 })) === 'RangeError');
A('months 1.5 は RangeError', errOf(() => N.kisoIncrease(db, { months: 1.5 })) === 'RangeError');
A('months "12" は TypeError', errOf(() => N.kisoIncrease(db, { months: '12' })) === 'TypeError');
A('fraction [3, 2]（1 を超える）は RangeError', errOf(() => N.kisoIncrease(db, { fraction: [3, 2] })) === 'RangeError');
A('fraction [1, 0] は RangeError', errOf(() => N.kisoIncrease(db, { fraction: [1, 0] })) === 'RangeError');
A('fraction 0.5（配列でない）は TypeError', errOf(() => N.kisoIncrease(db, { fraction: 0.5 })) === 'TypeError');
A('制度値が無い（空のオブジェクト）は例外', errOf(() => N.kisoIncrease({})) === 'Error' && errOf(() => N.koseiIncrease({}, 410000)) === 'Error');
A('制度値が null は例外', errOf(() => N.kisoIncrease(null)) === 'Error');

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
