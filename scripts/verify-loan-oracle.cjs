// verify-loan-oracle.js — 貸与エンジンを「独立実装したオラクル」と突き合わせる。
//   JSONのデータ誤りは verify-loan-primary が担当。ここは結線・式・境界の誤りを検出する。
//   返還の定額方式は JASSO 公式返還例（実額）を固定値で照合（データ＋式の二重確認）。
'use strict';
const L = require('./load-shogakukin.cjs');
const SPEC = L.spec();
const LOAN = L.shogakukinLoan();
let pass = 0, fail = 0;
function ok(label, cond, extra) { if (cond) pass++; else { fail++; console.log(`  ✗ ${label}${extra ? ' — ' + extra : ''}`); } }
function eqn(label, got, want) { ok(label, got === want, `got ${got} want ${want}`); }

// ── 貸与額算定基準額オラクル（独立式）───────────────────────────────────
//   supporter を cityAdjustActual で制御し、成分=target を厳密に作る。
//   成分 = floor(taxable*0.06) − floor(cityAdjustActual*factor)。taxable=1000万→cityGross=60万。
function sup(target, extra) {
  return Object.assign({
    shotokuwariTaxable: true, taxableIncome: 10000000,
    cityAdjustActual: 600000 - target, designatedCity: false,
  }, extra || {});
}
// オラクル: 世帯成分合算→100円切捨て→控除
function oracleKijun(targets, opts) {
  const o = opts || {};
  let raw = targets.reduce((a, t) => a + t, 0);
  let base = Math.floor(Math.max(0, raw) / 100) * 100;
  let ded = 40000 * Math.max(0, (o.children || 0) - 2);
  if (o.singleParent) ded += 40000;
  if (o.privateAway && o.appType !== 'yoyaku') ded += 22000;
  return Math.max(0, base - ded);
}
function runKijun(targets, student, opts) {
  const o = opts || {};
  return LOAN.calcLoanKijungaku(SPEC, {
    supporters: targets.map(t => sup(t)),
    student: student || {}, childrenCount: o.children || 0,
    singleParent: o.singleParent || null, applicationType: o.appType || 'zaigaku',
  });
}
// 単純合算
eqn('基準額 単身20万成分', runKijun([200000], {}, {}), oracleKijun([200000], {}));
eqn('基準額 2名合算(15万+9万)', runKijun([150000, 90000], {}, {}), oracleKijun([150000, 90000], {}));
// 多子控除（子3人→2人超1人×4万）
eqn('基準額 子3人控除', runKijun([200000], {}, { children: 3 }), oracleKijun([200000], { children: 3 }));
eqn('基準額 子5人控除', runKijun([300000], {}, { children: 5 }), oracleKijun([300000], { children: 5 }));
// ひとり親控除
eqn('基準額 ひとり親', runKijun([100000], {}, { singleParent: 'mother' }), oracleKijun([100000], { singleParent: 'mother' }));
// 私立自宅外控除（在学）と予約(=0)
eqn('基準額 私立自宅外(在学)', runKijun([100000], { schoolType: '私立', attendance: '自宅外' }, {}), oracleKijun([100000], { privateAway: true }));
eqn('基準額 私立自宅外(予約=控除なし)', runKijun([100000], { schoolType: '私立', attendance: '自宅外' }, { appType: 'yoyaku' }), oracleKijun([100000], { privateAway: true, appType: 'yoyaku' }));
// 本人は合算しない[§7-2]
{
  const withStudent = LOAN.calcLoanKijungaku(SPEC, {
    supporters: [sup(100000), Object.assign(sup(500000), { isStudent: true })],
    student: {}, childrenCount: 0,
  });
  eqn('基準額 本人非合算', withStudent, oracleKijun([100000], {}));
}
// 所得割非課税は0円
{
  const nt = LOAN.calcLoanKijungaku(SPEC, {
    supporters: [{ shotokuwariTaxable: false, taxableIncome: 10000000, cityAdjustActual: 0 }],
    student: {}, childrenCount: 0,
  });
  eqn('基準額 非課税→0', nt, 0);
}
// 政令市×3/4（cityAdjustActual に係数）
{
  const g = LOAN.calcLoanKijungaku(SPEC, {
    supporters: [{ shotokuwariTaxable: true, taxableIncome: 10000000, cityAdjustActual: 100000, designatedCity: true }],
    student: {}, childrenCount: 0,
  });
  const oracle = Math.floor((600000 - Math.floor(100000 * 0.75)) / 100) * 100; // 600000-75000=525000
  eqn('基準額 政令市×3/4', g, oracle);
}

// ── 判定の境界（≤閾値）──────────────────────────────────────────────
function elig(target, student, opts) {
  return LOAN.calcLoanEligibility(SPEC, {
    supporters: [sup(target)], student: student || {},
    childrenCount: (opts || {}).children || 0, singleParent: (opts || {}).singleParent || null,
    applicationType: 'zaigaku', grantResult: (opts || {}).grantResult || null,
  });
}
ok('第一種 189,400ちょうど→可', elig(189400).type1.eligible === true);
ok('第一種 189,500→不可', elig(189500).type1.eligible === false);
ok('第二種 381,500ちょうど→可', elig(381500).type2.eligible === true);
ok('第二種 381,600→不可', elig(381600).type2.eligible === false);
ok('併用 164,600ちょうど→可(最高月額可)', elig(164600).type1.maxMonthlyAllowed === true);
ok('併用 164,700→不可(最高月額不可)', elig(164700).type1.maxMonthlyAllowed === false);
ok('入学時増額 75,000ちょうど→直接可', elig(75000).nyugakuZougaku.direct === true);
ok('入学時増額 75,100→公庫必要', elig(75100).nyugakuZougaku.needsKoko === true);

// 最高月額の可否で選択肢が変わる（大学私立自宅外）
{
  // 国公立で検証（私立自宅外だと私立自宅外控除で kijun が下がり閾値判定が変わるため）。
  const low = elig(120000, { level: '大学', schoolType: '国公立', attendance: '自宅外' }); // 併用可→最高51000含む
  const mid = elig(170000, { level: '大学', schoolType: '国公立', attendance: '自宅外' }); // 第一種可・併用不可→51000除外
  ok('最高月額可: 51000を含む', low.type1.monthlyOptions.includes(51000));
  ok('最高月額不可: 51000を除外', !mid.type1.monthlyOptions.includes(51000) && mid.type1.eligible === true);
  ok('自宅外は自宅選択肢も含む(30000)', low.type1.monthlyOptions.includes(30000));
}
// 第二種 高専1-3年は対象外
{
  const k = elig(100000, { level: '高等専門学校', schoolType: '国公立', attendance: '自宅', kosenGrade: '1-3' });
  ok('高専1-3年 第二種対象外', k.type2.monthlyOptions.length === 0);
  ok('高専1-3年 第一種は可', k.type1.monthlyOptions.length > 0);
}
// 第二種 医学課程の増額
{
  const m = elig(100000, { level: '大学', schoolType: '私立', attendance: '自宅', course: '医' });
  ok('医学 増額+4万', m.type2.zougakuOptions.length === 1 && m.type2.zougakuOptions[0].add === 40000);
}

// ── 併給調整の結線（grantResult 経由）──────────────────────────────────
{
  // 給付第Ⅲ区分・私立自宅外 → 併給上限 19,200
  const g3 = { kubunCode: '3', isTashiSetai: false, isRiko: false };
  const r = elig(100000, { level: '大学', schoolType: '私立', attendance: '自宅外' }, { grantResult: g3 });
  ok('併給 第Ⅲ私立自宅外→19200', r.type1.heikyuCap && JSON.stringify(r.type1.heikyuCap.amounts) === JSON.stringify([19200]));
  // 給付第Ⅰ区分 → 0（併給不可）
  const g1 = { kubunCode: '1', isTashiSetai: false, isRiko: false };
  const r1 = elig(100000, { level: '大学', schoolType: '私立', attendance: '自宅外' }, { grantResult: g1 });
  ok('併給 第Ⅰ→0', r1.type1.heikyuCap && JSON.stringify(r1.type1.heikyuCap.amounts) === JSON.stringify([0]));
  // 区分外多子・私立自宅外 → 5,600
  const gOver = { kubunCode: null, isTashiSetai: true, isRiko: false };
  const rO = elig(200000, { level: '大学', schoolType: '私立', attendance: '自宅外' }, { grantResult: gOver });
  ok('併給 区分外多子 私立自宅外→5600', rO.type1.heikyuCap && JSON.stringify(rO.type1.heikyuCap.amounts) === JSON.stringify([5600]));
  // 理工農 国公立自宅=調整なし(null)
  const gR = { kubunCode: '4', isTashiSetai: false, isRiko: true };
  const rR = elig(100000, { level: '大学', schoolType: '国公立', attendance: '自宅' }, { grantResult: gR });
  ok('併給 第Ⅳ理工農 国公立自宅=調整なし(null)', rR.type1.heikyuCap === null);
  // 短大・専門・高専の表（2026-07-17転記）— 学種別の実値が引けること
  const rS = elig(100000, { level: '短期大学', schoolType: '私立', attendance: '自宅外' }, { grantResult: g3 });
  ok('併給 短大 第Ⅲ私立自宅外→17400', rS.type1.heikyuCap && JSON.stringify(rS.type1.heikyuCap.amounts) === JSON.stringify([17400]));
  const rSen = elig(100000, { level: '専門学校', schoolType: '国公立', attendance: '自宅' }, { grantResult: g1 });
  ok('併給 専門 第Ⅰ国公立自宅→1900(特例3800)', rSen.type1.heikyuCap &&
     JSON.stringify(rSen.type1.heikyuCap.amounts) === JSON.stringify([1900]) &&
     JSON.stringify(rSen.type1.heikyuCap.special) === JSON.stringify([3800]));
  // 区分内多子の区分別読み（旧: 一律0前提 → 新: 学種×区分で値が変わる）
  const gT2 = { kubunCode: '2', isTashiSetai: true, isRiko: false };
  const rKT = elig(100000, { level: '高等専門学校', schoolType: '国公立', attendance: '自宅外' }, { grantResult: gT2 });
  ok('併給拡充 高専 区分Ⅱ多子 国公立自宅外→8600', rKT.type1.heikyuCap && JSON.stringify(rKT.type1.heikyuCap.amounts) === JSON.stringify([8600]));
  const rKD = elig(100000, { level: '大学', schoolType: '私立', attendance: '自宅' }, { grantResult: gT2 });
  ok('併給拡充 大学 区分内多子→0（ネスト化後も維持）', rKD.type1.heikyuCap && JSON.stringify(rKD.type1.heikyuCap.amounts) === JSON.stringify([0]));
  const gOv = { kubunCode: null, isTashiSetai: true, isRiko: false };
  const rKO = elig(200000, { level: '高等専門学校', schoolType: '私立', attendance: '自宅外' }, { grantResult: gOv });
  ok('併給拡充 高専 区分外多子 私立自宅外→1600', rKO.type1.heikyuCap && JSON.stringify(rKO.type1.heikyuCap.amounts) === JSON.stringify([1600]));
  // 給付なし(grantResult=null)なら併給調整なし
  const rN = elig(100000, { level: '大学', schoolType: '私立', attendance: '自宅外' }, {});
  ok('併給 給付なし→null', rN.type1.heikyuCap === null);
}

// ── 返還: 定額方式（JASSO 公式返還例・実額固定）────────────────────────
function oracleTeigaku(total) {
  const tbl = [[200000, 30000], [400000, 40000], [500000, 50000], [600000, 60000], [700000, 70000],
  [900000, 80000], [1100000, 90000], [1300000, 100000], [1500000, 110000], [1700000, 120000],
  [1900000, 130000], [2100000, 140000], [2300000, 150000], [2500000, 160000], [3400000, 170000]];
  let base; for (const [le, b] of tbl) { if (total <= le) { base = b; break; } }
  if (base === undefined) base = Math.floor(total / 20);
  const years = Math.floor(total / base), n = years * 12, monthly = Math.floor(total / n);
  return { years, n, monthly, last: total - monthly * (n - 1) };
}
// 公式返還例（4年制5件＋6年制5件）: [総額, 月額, 回数, 年数]
const teigakuCases = [
  [2160000, 12857, 168, 14], [2448000, 13600, 180, 15], [2592000, 14400, 180, 15],
  [3072000, 14222, 216, 18], [1440000, 9230, 156, 13],
  [3240000, 14210, 228, 19], [3672000, 15300, 240, 20], [3888000, 16200, 240, 20],
  [4608000, 19200, 240, 20], [2160000, 12857, 168, 14],
];
teigakuCases.forEach(([total, m, n, y], i) => {
  const r = LOAN.simulateTeigaku(SPEC, total);
  const o = oracleTeigaku(total);
  ok(`定額 公式例[${i}] 総額${total}`, r.monthly === m && r.n === n && r.years === y && r.monthly === o.monthly && r.n === o.n);
});
// 境界: 200,000ちょうど / 200,001（基礎額の切替）/ 3,400,001（1/20落ち=20年）
eqn('定額 200000 年数', LOAN.simulateTeigaku(SPEC, 200000).years, 6);   // 200000/30000=6.67→6
eqn('定額 200001 年数', LOAN.simulateTeigaku(SPEC, 200001).years, 5);   // 200001/40000=5.0→5
eqn('定額 3400001 年数', LOAN.simulateTeigaku(SPEC, 3400001).years, 20); // base=170000, 3400001/170000=20.0→20
// 端数は最終回に上乗せ（合計＝総額）
{
  const r = LOAN.simulateTeigaku(SPEC, 2160000);
  ok('定額 端数最終回で合計一致', r.monthly * (r.n - 1) + r.lastMonthly === 2160000);
}

// ── 返還: 所得連動（第一種）────────────────────────────────────────────
function oracleSR(tt, c) { return Math.max(2000, Math.floor(Math.max(0, tt - 330000 * c) * 0.09 / 12)); }
eqn('所得連動 課税総所得114.7万 子0(公式≈8600)', LOAN.simulateShotokuRendo(SPEC, 1147000, 0).monthly, oracleSR(1147000, 0));
ok('所得連動 公式目安8600近傍', Math.abs(LOAN.simulateShotokuRendo(SPEC, 1147000, 0).monthly - 8600) <= 10);
eqn('所得連動 下限2000', LOAN.simulateShotokuRendo(SPEC, 0, 0).monthly, 2000);
eqn('所得連動 子2人控除', LOAN.simulateShotokuRendo(SPEC, 2000000, 2).monthly, oracleSR(2000000, 2));
eqn('所得連動 初年度=定額の半分', LOAN.simulateShotokuRendo(SPEC, 3000000, 0, 12857).firstYearMonthly, Math.floor(12857 / 2));

// ── 返還: 第二種（元利均等・概算）JASSO公式返還例 全48点で±1円照合 ──────
//   出典: JASSO 大学・返還例 kappu/sample/daigaku.html（2026-07-16取得・4年制/5年制/6年制）。
//   [貸与総額, 年利, 返還月額(公式), 回数]。graceDaysApprox=179 で全点±1円以内・回数一致に較正済み。
const type2Official = [
  // 4年制（貸与48か月）
  [1440000, 0.005, 9557, 156], [1440000, 0.01, 9892, 156], [1440000, 0.02, 10580, 156], [1440000, 0.03, 11293, 156],
  [2400000, 0.005, 13874, 180], [2400000, 0.01, 14428, 180], [2400000, 0.02, 15574, 180], [2400000, 0.03, 16769, 180],
  [3840000, 0.005, 16855, 240], [3840000, 0.01, 17737, 240], [3840000, 0.02, 19582, 240], [3840000, 0.03, 21531, 240],
  [4800000, 0.005, 21069, 240], [4800000, 0.01, 22172, 240], [4800000, 0.02, 24478, 240], [4800000, 0.03, 26914, 240],
  [5760000, 0.005, 25282, 240], [5760000, 0.01, 26606, 240], [5760000, 0.02, 29373, 240], [5760000, 0.03, 32297, 240],
  // 5年制（貸与60か月）: 新規総額 180万/300万/600万/720万
  [1800000, 0.005, 11947, 156], [1800000, 0.01, 12365, 156], [1800000, 0.02, 13225, 156], [1800000, 0.03, 14117, 156],
  [3000000, 0.005, 15378, 204], [3000000, 0.01, 16069, 204], [3000000, 0.02, 17503, 204], [3000000, 0.03, 19007, 204],
  [6000000, 0.005, 26337, 240], [6000000, 0.01, 27715, 240], [6000000, 0.02, 30597, 240], [6000000, 0.03, 33642, 240],
  [7200000, 0.005, 31604, 240], [7200000, 0.01, 33259, 240], [7200000, 0.02, 36717, 240], [7200000, 0.03, 40372, 240],
  // 6年制（貸与72か月）: 新規総額 216万/360万/864万
  [2160000, 0.005, 13346, 168], [2160000, 0.01, 13846, 168], [2160000, 0.02, 14877, 168], [2160000, 0.03, 15950, 168],
  [3600000, 0.005, 15801, 240], [3600000, 0.01, 16629, 240], [3600000, 0.02, 18358, 240], [3600000, 0.03, 20185, 240],
  [8640000, 0.005, 37925, 240], [8640000, 0.01, 39910, 240], [8640000, 0.02, 44061, 240], [8640000, 0.03, 48446, 240],
];
let type2MaxErr = 0;
type2Official.forEach(([total, i, m, n], idx) => {
  const r = LOAN.simulateType2(SPEC, total, i, {});
  const df = Math.abs(r.monthly - m);
  type2MaxErr = Math.max(type2MaxErr, df);
  ok(`第二種 公式例[${idx}] ${total}/${i * 100}% n=${n}: ${m}±1`, r.n === n && df <= 1 && r._approx === true, `got ${r.monthly} want ${m}`);
});
ok('第二種 公式48点の最大誤差≤1円', type2MaxErr <= 1, `maxErr=${type2MaxErr}`);

// ── 返還: アウトオブサンプル照合（高専・較正に未使用の公式返還例）──────────
//   出典: kappu/sample/kousen.html（2026-07-17取得）。graceDaysApprox=179 の較正は
//   大学の48点で行ったため、ここは「較正に使っていない新規総額」での汎化確認＝過学習検知。
//   第二種: 総額72万/120万/192万/288万 × 4利率（回数108/144/156/192）。
const type2OOS = [
  [720000, 0.005, 6835, 108], [720000, 0.01, 7005, 108], [720000, 0.02, 7355, 108], [720000, 0.03, 7713, 108],
  [1200000, 0.005, 8607, 144], [1200000, 0.01, 8886, 144], [1200000, 0.02, 9461, 144], [1200000, 0.03, 10055, 144],
  [1920000, 0.005, 12744, 156], [1920000, 0.01, 13190, 156], [1920000, 0.02, 14107, 156], [1920000, 0.03, 15059, 156],
  [2880000, 0.005, 15647, 192], [2880000, 0.01, 16311, 192], [2880000, 0.02, 17687, 192], [2880000, 0.03, 19125, 192],
];
type2OOS.forEach(([total, i, m, n], idx) => {
  const r = LOAN.simulateType2(SPEC, total, i, {});
  ok(`第二種 OOS高専[${idx}] ${total}/${i * 100}%`, r.n === n && Math.abs(r.monthly - m) <= 1, `got ${r.monthly}(n=${r.n}) want ${m}(n=${n})`);
});
//   定額: 高専の混合月額例（1-3年＋4-5年の合算総額）5件＝新規総額。
const teigakuOOS = [
  [1836000, 10928, 168], [2034000, 12107, 168], [2424000, 13466, 180], [2700000, 15000, 180], [1080000, 7500, 144],
];
teigakuOOS.forEach(([total, m, n], idx) => {
  const r = LOAN.simulateTeigaku(SPEC, total);
  ok(`定額 OOS高専[${idx}] ${total}`, r.monthly === m && r.n === n, `got ${r.monthly}/${r.n} want ${m}/${n}`);
});
{
  // 利率0%なら元金/回数と一致（据置0）
  const r0 = LOAN.simulateType2(SPEC, 2400000, 0, {});
  ok('第二種 利率0%→元金均等', r0.monthly === Math.floor(2400000 / 180));
  // 利率capを超える入力は3%で頭打ち
  const rc = LOAN.simulateType2(SPEC, 2400000, 0.05, {});
  ok('第二種 利率cap3%適用', rc.rate === 0.03);
}


// ── 高専1〜3年の閾値（2026-07-17 [確認済]化: 大学等と同一・学年区分なし）────────
//   出典: 2026年度在学者用貸与奨学金案内（高等専門学校）p.12（併用164,600/一種189,400/二種381,500）
//   ＋JASSO在学採用HP（「大学等には…高等専門学校…を含みます」・一律189,400）。
{
  const k13 = { level: '高等専門学校', schoolType: '国公立', attendance: '自宅', kosenGrade: '1-3' };
  ok('高専1-3 一種 189,400ちょうど→可', elig(189400, k13).type1.eligible === true);
  ok('高専1-3 一種 189,500→不可', elig(189500, k13).type1.eligible === false);
  ok('高専1-3 併用 164,600ちょうど→最高月額可', elig(164600, k13).type1.maxMonthlyAllowed === true);
  ok('高専1-3 併用 164,700→最高月額不可', elig(164700, k13).type1.maxMonthlyAllowed === false);
  // 閾値オブジェクトが大学と完全一致（同一表を引いていることの結線確認）
  ok('高専1-3 閾値=大学と同一', JSON.stringify(elig(100000, k13).thresholds) === JSON.stringify(elig(100000, { level: '大学' }).thresholds));
  // 一種可のとき高専1-3の月額表（10,000/21,000系）が引けている
  const o13 = elig(164600, k13).type1.monthlyOptions;
  ok('高専1-3 月額表(国公立自宅: 10000/21000)', JSON.stringify(o13) === JSON.stringify([10000, 21000]));
}

console.log(`==== 貸与 オラクル照合: ${pass} pass / ${fail} fail ====`);
process.exit(fail ? 1 : 0);
