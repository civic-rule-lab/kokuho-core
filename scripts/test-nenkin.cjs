/**
 * test-nenkin.cjs — 国民年金エンジン（js/core/nenkin.js）の検証
 *   1. 保険料: 月額 17,920・年額 215,040・付加込み 18,320。前納 7 通りが一次資料（日本年金機構・2026-09-04 版）の額と一致
 *   2. 免除の境界: 全額免除（独身 67 万ちょうど→成立・+1 円→不成立）、扶養 1 人で 102 万、部分免除（88/128/168 万＋控除）
 *   3. 審査対象: 免除は配偶者・世帯主も見る／納付猶予は世帯主を見ない・50 歳以上は不可／学生は本人のみ
 *   4. 年齢: 20 歳未満・60 歳以上は対象外
 *   5. 判定後の月額と年金額への反映
 * 実行: node scripts/test-nenkin.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const N = require(path.join(ROOT, 'js/core/nenkin.js'));
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/kokumin-nenkin-2026.json'), 'utf8'));
let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
const P = (income, dependents, other) => ({ income, dependents: dependents || {}, other: other || {} });

// 1. 保険料・前納
const pr = N.calcPremium(db);
A('月額 17,920・年額 215,040', pr.monthly === 17920 && pr.annual === 215040);
A('付加保険料込み 月額 18,320・年額 219,840', N.calcPremium(db, { tsuka: true }).monthly === 18320 && N.calcPremium(db, { tsuka: true }).annual === 219840);
A('前納（口座振替）2年 417,150／1年 210,530／6か月 106,300／早割 17,860', pr.prepay.kouza.y2.amount === 417150 && pr.prepay.kouza.y1.amount === 210530 && pr.prepay.kouza.m6.amount === 106300 && pr.prepay.kouza.hayawari.monthly === 17860);
A('前納（納付書・クレジット）2年 418,510／1年 211,220／6か月 106,650', pr.prepay.nofusho.y2.amount === 418510 && pr.prepay.nofusho.y1.amount === 211220 && pr.prepay.nofusho.m6.amount === 106650);
A('割引額の整合: 1年前納（口座）＝ 17,920×12 − 210,530 ＝ 4,510', 17920 * 12 - pr.prepay.kouza.y1.amount === pr.prepay.kouza.y1.discount);
A('割引額の整合: 2年前納（口座）＝ (17,920＋18,290)×12 − 417,150 ＝ 17,370', (17920 + 18290) * 12 - pr.prepay.kouza.y2.amount === pr.prepay.kouza.y2.discount);
A('割引額の整合: 6か月（納付書）＝ 17,920×6 − 106,650 ＝ 870', 17920 * 6 - pr.prepay.nofusho.m6.amount === pr.prepay.nofusho.m6.discount);

// 2. 全額免除の境界（独身・扶養なし: (0+1)×35万+32万 = 67万）
const j = (self, extra) => N.judgeExemption(db, Object.assign({ age: 30, self }, extra || {}));
A('独身・所得 670,000 → 全額免除', j(P(670000)).level === 'full');
A('独身・所得 670,001 → 全額免除でない', j(P(670001)).level !== 'full');
A('扶養 1 人（一般）・所得 1,020,000 → 全額免除（(1+1)×35万+32万）', j(P(1020000, { general: 1 })).level === 'full');
A('配偶者＋子 2 人（16歳未満）・所得 1,720,000 → 全額免除（(3+1)×35万+32万）', j(P(1720000, { spouse: 1, under16: 2 })).level === 'full');

// 部分免除（独身・控除なし: 88万／128万／168万）
A('独身・所得 880,000 → 4分の3免除', j(P(880000)).level === 'threeQuarters');
A('独身・所得 880,001 → 半額免除', j(P(880001)).level === 'half');
A('独身・所得 1,280,000 → 半額免除', j(P(1280000)).level === 'half');
A('独身・所得 1,680,000 → 4分の1免除', j(P(1680000)).level === 'quarter');
A('独身・所得 1,680,001・30歳 → 免除なし・猶予も不可（猶予の基準は 67 万）', j(P(1680001)).level === 'none');
A('社会保険料控除 200,000 を足すと 4分の3免除の上限が 1,080,000 に', j(P(1080000, {}, { socialInsurance: 200000 })).level === 'threeQuarters');
A('扶養親族等控除額: 16〜22 歳 1 人（63 万）で半額免除の上限が 1,910,000', j(P(1910000, { age16to22: 1 })).level === 'half' && j(P(1910001, { age16to22: 1 })).level === 'quarter');
A('ひとり親（35 万）で 4分の1免除の上限が 2,030,000', j(P(2030000, {}, { hitorioya: true })).level === 'quarter');

// 3. 審査対象
A('本人 50 万・配偶者 300 万 → 免除不成立（配偶者が基準超）', j(P(500000), { spouse: P(3000000) }).level === 'none' && j(P(500000), { spouse: P(3000000) }).exceeded.includes('spouse'));
A('本人 50 万・世帯主（親）300 万 → 免除不成立だが 30 歳なら納付猶予（世帯主を見ない）', j(P(500000), { householder: P(3000000) }).level === 'yuyo');
A('同上・50 歳 → 納付猶予も不可', j(P(500000), { householder: P(3000000), age: 50 }).level === 'none');
A('同上・49 歳 → 納付猶予', j(P(500000), { householder: P(3000000), age: 49 }).level === 'yuyo');
A('学生・本人 128 万・親 500 万 → 学生納付特例（本人のみ審査）', j(P(1280000), { householder: P(5000000), isStudent: true }).level === 'student');
A('学生・本人 1,280,001 → 特例なし', j(P(1280001), { isStudent: true }).level === 'none');
A('学生・扶養 1 人・本人 1,660,000 → 学生納付特例（128万+38万）', j(P(1660000, { general: 1 }), { isStudent: true }).level === 'student');
A('学生は免除の判定をしない（所得 0 でも full にならない）', j(P(0), { isStudent: true }).level === 'student');

// 4. 年齢
A('19 歳 → 対象外', j(P(0), { age: 19 }).eligible === false);
A('60 歳 → 対象外', j(P(0), { age: 60 }).eligible === false);
A('20 歳・59 歳 → 対象', j(P(0), { age: 20 }).eligible === true && j(P(0), { age: 59 }).eligible === true);

// 5. 判定後の月額・反映
A('4分の3免除の月額 4,480・半額 8,960・4分の1免除 13,440', j(P(880000)).monthlyAfter === 4480 && j(P(1280000)).monthlyAfter === 8960 && j(P(1680000)).monthlyAfter === 13440);
A('全額免除・猶予の月額 0、免除なしは 17,920', j(P(0)).monthlyAfter === 0 && j(P(1680001)).monthlyAfter === 17920);
A('年金額への反映: 全額 1/2・4分の3 5/8・半額 6/8・4分の1 7/8・猶予 0', j(P(0)).pensionReflection === '1/2' && j(P(880000)).pensionReflection === '5/8' && j(P(1280000)).pensionReflection === '6/8' && j(P(1680000)).pensionReflection === '7/8' && j(P(500000), { householder: P(3000000) }).pensionReflection === '0');
A('追納期限 10 年', j(P(0)).tsuinoYears === 10);

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
