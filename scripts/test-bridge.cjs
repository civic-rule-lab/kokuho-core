'use strict';
const L=require('./load-shogakukin.cjs');
const { calcFromIncome, supporterFromIncome } = L.bridge();
const { calcShogakukin } = L.shogakukin();
const spec = L.spec();


let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (ok ? '' : `\n   got=${JSON.stringify(got)}\n   want=${JSON.stringify(want)}`));
  ok ? pass++ : fail++;
}

// ── 単身稼得（父 給与300万・専業主婦・子2・私立大学自宅外）: 年収→jumin→奨学金 ──
// 父: 給与300万→給与所得202万。控除=社保45万+配偶者33万+基礎43万=121万。課税標準=81万。
//     基準額=floor(81万×6%)−floor(min(5万,81万)×3%)=48,600−3,000=45,600 → 第Ⅲ区分。
//     非課税限度(扶養=配偶者1+子2=3): 35万×4+10万+32万=182万 < 合計所得202万 → 所得割課税。
const father = supporterFromIncome(null, { salary: 3000000, socialInsurance: 450000, hasSpouseDeduction: true, dependents: 3, age: 45 });
check('父 課税標準', father.taxableIncome, 810000); // 子は16歳未満想定=扶養控除なし・非課税人数のみ加算
check('父 人的控除差', father.humanDeductionDiff, 100000); // 基礎5+配偶5万（一般扶養控除なし）
check('父 所得割課税', father.shotokuwariTaxable, true);
check('父 income内訳保持', father.income, { salary: 3000000, pension: 0, other: 0 });

let r = calcFromIncome(spec, null, {
  supportersIncome: [
    { salary: 3000000, socialInsurance: 450000, hasSpouseDeduction: true, age: 45 }, // 父（子は多子判定で別カウント）
    { salary: 0 }
  ],
  student: { schoolType: '私立', attendance: '自宅外', level: '大学' },
  childrenCount: 2
});
check('単身稼得 基準額', r.kijungaku, 45600);
check('単身稼得 区分', r.kubunCode, '3');
check('単身稼得 給付月額(私立大学自宅外 第Ⅲ)', r.grantMonthly, 25300);
// [M1] 700000×1/3=233,400 / 260000×1/3=86,700（100円切上）
check('単身稼得 減免(1/3切上)', r.reductionCap, { tuition: 233400, admission: 86700 });

// ── 共働き（父300万＋母200万・配偶者控除なし・子1） ──
r = calcFromIncome(spec, null, {
  supportersIncome: [
    { salary: 3000000, socialInsurance: 450000, age: 45 },
    { salary: 2000000, socialInsurance: 300000, age: 43 }
  ],
  student: { schoolType: '私立', attendance: '自宅外', level: '大学' },
  childrenCount: 1
});
check('共働き 合算基準額', r.kijungaku, 100800);
check('共働き 区分(第Ⅳレンジ・非多子→対象外)', r.kubunCode, null);

// ── 同・多子(子3人) → 減免満額・給付は第Ⅳ ──
r = calcFromIncome(spec, null, {
  supportersIncome: [
    { salary: 3000000, socialInsurance: 450000, age: 45 },
    { salary: 2000000, socialInsurance: 300000, age: 43 }
  ],
  student: { schoolType: '私立', attendance: '自宅外', level: '大学' },
  childrenCount: 3
});
check('共働き多子 減免満額', r.reductionCap, { tuition: 700000, admission: 260000 });
check('共働き多子 給付(第Ⅳ)', r.grantMonthly, 19000);

// ── 非課税相当（低収入）→ 第Ⅰ満額 ──
r = calcFromIncome(spec, null, {
  supportersIncome: [{ salary: 1000000, socialInsurance: 150000, hasSpouseDeduction: false, age: 40 }],
  student: { schoolType: '国公立', attendance: '自宅外', level: '大学' },
  childrenCount: 1
});
check('低収入 第Ⅰ', r.kubunCode, '1');
check('低収入 給付(国公立大学自宅外満額)', r.grantMonthly, 66700);

// ── [B2] 所得割非課税ライン: 父 給与250万・専業主婦・子2(16歳未満/扶養3) → 所得割非課税→第Ⅰ満額 ──
// 給与250万→給与所得170万。非課税限度(扶養3)=182万 ≥ 170万 → 所得割非課税。
// 旧実装は課税標準535,000から基準額29,100・第Ⅲと誤判定していた。
// 子2人は16歳未満想定: 扶養控除0（課税標準を下げない）だが非課税限度の人数には加算(dependents:3=配偶者1+子2)。
const nt = supporterFromIncome(null, { salary: 2500000, socialInsurance: 375000, hasSpouseDeduction: true, dependents: 3 });
check('[B2] 父 課税標準>0だが', nt.taxableIncome > 0, true);
check('[B2] 父 所得割非課税', nt.shotokuwariTaxable, false);
r = calcFromIncome(spec, null, {
  supportersIncome: [
    { salary: 2500000, socialInsurance: 375000, hasSpouseDeduction: true, dependents: 3 },
    { salary: 0 }
  ],
  student: { schoolType: '私立', attendance: '自宅外', level: '大学' },
  childrenCount: 2
});
check('[B2] 所得割非課税→基準額0', r.kijungaku, 0);
check('[B2] 所得割非課税→第Ⅰ満額', r.grantMonthly, 75800);

// ── [M4] 特定扶養(大学生本人=19〜22歳)を父の扶養に結線 → 課税標準が下がる ──
// 父 給与500万・専業主婦・大学生の子1(給与収入0=所得0→特定扶養45万)。
// M4結線なし(旧): 課税標準= 356万-(社保75+配偶33+基礎43)=205万 → 基準額121,500(第Ⅳレンジ)。
// M4結線あり: 特定扶養45万＋控除差18万 → 課税標準160万 → 基準額 96000-1500=94,500(第Ⅳレンジ・多子で救済)。
// 注: 2026-10-29（C128）から給与0円の子も特定扶養（下の [C179]）。ここは従来どおりアルバイト給与(所得58万以下)で表現。
//     給与50万→給与所得0(≤58万)→特定扶養45万＋控除差18万＋非課税人数+1。
const withSp = supporterFromIncome(null, {
  salary: 5000000, socialInsurance: 750000, hasSpouseDeduction: true,
  specialDependentSalaries: [500000] // 大学生・アルバイト給与50万(所得0)
});
const noSp = supporterFromIncome(null, { salary: 5000000, socialInsurance: 750000, hasSpouseDeduction: true });
check('[M4] 特定扶養で課税標準が下がる', withSp.taxableIncome < noSp.taxableIncome, true);
check('[M4] 特定扶養45万で 205万→160万', noSp.taxableIncome - withSp.taxableIncome, 450000);

// ── [M3] 本人(学生)のアルバイト所得も合算対象にできる ──
r = calcFromIncome(spec, null, {
  supportersIncome: [
    { salary: 600000 },                 // 父（課税標準0近辺・第Ⅰ相当）
    { salary: 0 },                      // 母
    { salary: 0, isStudent: true, taxableIncome: undefined } // 本人（この例は収入なし）
  ],
  student: { schoolType: '国公立', attendance: '自宅', level: '大学' },
  childrenCount: 1
});
check('[M3] 本人合算しても第Ⅰ', r.kubunCode, '1');

// ── ひとり親控除（住民税30万・人的控除差 母5万/父1万・合計所得135万以下非課税）金額照合 ──
//   [確認済 2026-07-12 姫路市/諏訪市/大阪市]。draft verify-kijun の期待値と一致（income経路で再現）。
//   従来 kokuho-core は結線のみで金額未検証だった穴を埋める（README §7 フォローアップ）。
// (1) supporter 内訳: ひとり親控除30万が課税標準を下げ、人的控除差が母10万/父6万（無し5万）に分岐。
const opMother250 = supporterFromIncome(null, { salary: 2500000, socialInsurance: 375000, singleParent: 'mother' });
const opFather250 = supporterFromIncome(null, { salary: 2500000, socialInsurance: 375000, singleParent: 'father' });
const opNone250   = supporterFromIncome(null, { salary: 2500000, socialInsurance: 375000 });
check('ひとり親 母 課税標準(30万控除後)', opMother250.taxableIncome, 565000);
check('ひとり親 父 課税標準(30万控除後)', opFather250.taxableIncome, 565000);
check('ひとり親なし 課税標準', opNone250.taxableIncome, 865000);   // 差300,000 = ひとり親控除30万
check('ひとり親 母 人的控除差(基礎5+母5万)', opMother250.humanDeductionDiff, 100000);
check('ひとり親 父 人的控除差(基礎5+父1万)', opFather250.humanDeductionDiff, 60000);
check('ひとり親なし 人的控除差(基礎5のみ)', opNone250.humanDeductionDiff, 50000);
// (2) 合計所得135万以下は所得割非課税（母 給与200万→合計所得132万）→ 基準額0・第Ⅰ
const stuP = { schoolType: '私立', attendance: '自宅外', level: '大学' };
const mkOP = (salary, si, sp) => calcFromIncome(spec, null, {
  supportersIncome: [Object.assign({ salary, socialInsurance: si }, sp ? { singleParent: sp } : {})],
  student: stuP, childrenCount: 1, singleParent: sp || undefined,
});
let rm = mkOP(2000000, 300000, 'mother');
check('ひとり親 母200万→合計所得135万以下→所得割非課税→基準額0', rm.kijungaku, 0);
check('ひとり親 母200万→第Ⅰ', rm.kubunCode, '1');
check('ひとり親なし 母200万→課税(第Ⅲ・基準33,900)', mkOP(2000000, 300000, null).kijungaku, 33900);
// (3) 課税域（給与250万・合計所得167万>135万）: 母5万/父1万の差が基準額に出る（1,200円=4万×3%）
check('ひとり親 母250万→基準額30,900(第Ⅲ)', mkOP(2500000, 375000, 'mother').kijungaku, 30900);
check('ひとり親 父250万→基準額32,100(第Ⅲ・母より高い)', mkOP(2500000, 375000, 'father').kijungaku, 32100);
check('ひとり親なし 250万→基準額50,400', mkOP(2500000, 375000, null).kijungaku, 50400);

// ── 2026-10-30 全方向試算 段4: 控除と課税判定を住民税エンジンに寄せる ──
//   根拠 [確認済 2026-10-30 e-Gov 法令API]: 地方税法 第314条の2第1項（配偶者控除 33万・900万超 22万・950万超 11万／老人 38万・26万・13万、
//   特別控除は配偶者の所得で 33万〜3万、扶養 33万・老人 38万・同居老親 45万、障害者 26万・特別障害者 30万、寡婦 26万・ひとり親 30万＝合計所得500万円以下）、
//   第37条第1号イの表（人的控除差）、第295条第1項第2号（障害者・未成年者・寡婦・ひとり親の合計所得135万円以下は非課税）
const J = require('../js/core/jumin.js');
const S0 = { socialInsurance: 0 };
// C067: 配偶者特別控除（data/national/jumin-haigusha-kojo.json: 配偶者の所得 100万超105万以下 → 31万・本人所得900万以下）
check('[C067] 配偶者所得 105万 → 配偶者特別控除 31万', supporterFromIncome(null, { salary: 5000000, ...S0, spouseIncome: 1050000 })._jumin.taxableIncome,
  supporterFromIncome(null, { salary: 5000000, ...S0, spouseDeduction: 310000, dependents: 0, humanDeductionDiff: 50000 })._jumin.taxableIncome);
// C072: 老人控除対象配偶者 38万
check('[C072] 70歳以上の配偶者 → 38万', 3560000 - 430000 - 380000 >= 0 && supporterFromIncome(null, { salary: 5000000, ...S0, hasSpouseDeduction: true, spouseAge70plus: true }).taxableIncome,
  Math.floor((J.calculateJumin(null, { salary: 5000000 }).totalIncome - 380000 - 430000) / 1000) * 1000);
// C073・C074: 本人 給与1,150万（合計所得955万）→ 配偶者控除 11万・人的控除差 2万
const hi = supporterFromIncome(null, { salary: 11500000, ...S0, hasSpouseDeduction: true });
check('[C073] 本人所得955万 → 配偶者控除 11万', hi.taxableIncome, Math.floor((9550000 - 110000 - 430000) / 1000) * 1000);
check('[C074] 本人所得955万 → 人的控除差 5万＋2万', hi.humanDeductionDiff, 70000);
// C075: 配偶者特別控除の配偶者は非課税判定の人数・人的控除差に入れない
const spSp = supporterFromIncome(null, { salary: 3000000, ...S0, hasSpouseDeduction: true, spouseIncome: 1000000 });
check('[C075] 特別控除の配偶者: 人数 0・人的控除差 5万', [spSp._jumin.dependentsCount, spSp.humanDeductionDiff], [0, 50000]);
// C076: 老人扶養 10万・同居老親 13万
check('[C076] 老人扶養1・同居老親1 → 人的控除差 5+10+13万', supporterFromIncome(null, { salary: 5000000, ...S0, elderlyDependents: 1, elderlyCoResDependents: 1 }).humanDeductionDiff, 280000);
// C077: ひとり親は合計所得500万円以下（給与800万＝所得610万では控除なし）
const sp800 = supporterFromIncome(null, { salary: 8000000, ...S0, singleParent: 'mother' });
check('[C077] 給与800万・ひとり親 → 控除なし・人的控除差 5万', [sp800.taxableIncome, sp800.humanDeductionDiff],
  [supporterFromIncome(null, { salary: 8000000, ...S0 }).taxableIncome, 50000]);
// C078: 寡婦（控除26万・人的控除差1万・135万以下非課税）
const wd = supporterFromIncome(null, { salary: 2500000, ...S0, singleParent: 'widow' });
check('[C078] 寡婦 給与250万 → 控除26万・人的控除差 6万', [opNone250.taxableIncome + 375000 - wd.taxableIncome, wd.humanDeductionDiff], [260000, 60000]);
check('[C078] 寡婦 給与200万（所得132万）→ 所得割非課税', supporterFromIncome(null, { salary: 2000000, ...S0, singleParent: 'widow' }).shotokuwariTaxable, false);
// C079: 既定の人数で 19〜22歳の子を二重に数えない（配偶者1＋子1＝2）
const c79 = supporterFromIncome(null, { salary: 5000000, ...S0, hasSpouseDeduction: true, specialDependentSalaries: [500000] });
check('[C079] 配偶者＋19〜22歳の子1 → 非課税判定の人数 2', c79._jumin.dependentsCount, 2);
// C080: dependents を明示した経路でも、19〜22歳の子を含めて所得割の非課税を判定する
//   給与200万（所得132万）・dependents 0＋子1: 限度 35万×2＋10万＋32万＝112万 < 132万 → 課税。子を入れずに判定していた旧は 45万 → 課税で同じ。
//   給与170万（所得105万）: 子を入れると限度112万 ≥ 105万 → 非課税（旧は限度45万で課税）
check('[C080] 給与170万・明示 dependents 0＋19〜22歳の子1 → 所得割非課税', supporterFromIncome(null, { salary: 1700000, ...S0, dependents: 0, specialDependentSalaries: [0] }).shotokuwariTaxable, false);
// C081: 既定の人数に 16歳未満・老人扶養を入れる
check('[C081] 16歳未満2・老人扶養1 → 人数 3', supporterFromIncome(null, { salary: 3000000, ...S0, youngDependents: 2, elderlyDependents: 1 })._jumin.dependentsCount, 3);
// C179: 給与0円の19〜22歳の子も特定扶養（人的控除差18万・人数+1）
const c179 = supporterFromIncome(null, { salary: 5000000, ...S0, specialDependentSalaries: [0] });
check('[C179] 給与0円の子 → 特定扶養45万・人的控除差 23万・人数1', [supporterFromIncome(null, { salary: 5000000, ...S0 }).taxableIncome - c179.taxableIncome, c179.humanDeductionDiff, c179._jumin.dependentsCount], [450000, 230000, 1]);
// C180・C181: 障害者控除 26万（特別 30万）・人的控除差 1万（特別 10万）
const dg = supporterFromIncome(null, { salary: 5000000, ...S0, selfDisability: 'general' }), ds = supporterFromIncome(null, { salary: 5000000, ...S0, selfDisability: 'special' });
const nd = supporterFromIncome(null, { salary: 5000000, ...S0 });
check('[C180] 障害者 26万・特別障害者 30万', [nd.taxableIncome - dg.taxableIncome, nd.taxableIncome - ds.taxableIncome], [260000, 300000]);
check('[C181] 人的控除差 障害者 6万・特別障害者 15万', [dg.humanDeductionDiff, ds.humanDeductionDiff], [60000, 150000]);
// C182: 障害者本人の合計所得135万円以下は所得割非課税
check('[C182] 障害者 給与200万（所得132万）→ 所得割非課税', supporterFromIncome(null, { salary: 2000000, ...S0, selfDisability: 'general' }).shotokuwariTaxable, false);
// C186: calcFromIncome でも高専本科1〜3年は対象外
const k13 = calcFromIncome(spec, null, { supportersIncome: [{ salary: 1000000 }], student: { level: '高専1-3年', schoolType: '国公立', attendance: '自宅' }, childrenCount: 1 });
check('[C186] 高専本科1〜3年 → 対象外・給付0', [k13.kubunCode, k13.grantMonthly, k13.notEligible], [null, 0, 'kosen13']);

console.log(`\n${pass} passed / ${fail} failed`);
process.exit(fail ? 1 : 0);
