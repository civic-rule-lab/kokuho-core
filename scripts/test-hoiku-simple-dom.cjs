/**
 * test-hoiku-simple-dom.cjs — 保育料ページ（生成物 kanagawa/yokohama/hoiku/index.html）の「年収から計算」を jsdom で検証。
 *   2026-10-23 追加（X223）: 年収→住民税の判定に、世帯の家族（16歳未満の子・配偶者・ひとり親）が入ること。
 *   2026-10-30 追加（全方向試算 C059・C061・C064・C106）: 16歳以上の扶養家族の人数・父母とも収入0・直接入力の「父母とも非課税」の印。
 *
 *   期待値の根拠:
 *   ・非課税限度額の人数＝同一生計配偶者＋扶養親族（16歳未満の子を含む）。1級地は 35万×(1+人数)＋10万＋21万（地方税法施行令 第47条の3）
 *   ・配偶者の合計所得58万円以下 → 配偶者控除33万（地方税法 第314条の2第1項第10号）
 *   ・ひとり親で合計所得135万円以下 → 非課税（第295条第1項第2号）
 *   ・横浜市の表: 第2階層（市民税非課税）0円、第3階層（均等割のみ・認可・標準）6,700円（data/municipalities/yokohama/hoiku-2026.json）
 *   ・16歳以上の扶養親族: 扶養控除 33万・45万・38万・45万（第314条の2第1項第11号・第4項）、人的控除差 5万・18万・10万・13万
 *     （第37条第1号イの表(8)(9)）、非課税限度額の人数（施行令 第47条の3第1号）。[確認済 2026-10-30 e-Gov 法令API]
 *   ・名古屋（所得割を直接入力）: 所得割0でも印が無ければ均等割のみ課税の階層、印があれば非課税の階層
 *   ・給与850万円超の保護者: 保育所の子は23歳未満の扶養親族なので所得金額調整控除（租税特別措置法 第41条の3の11第1項・夫婦の双方）。
 *     同一生計配偶者の人的控除差は本人の合計所得900万円超で逓減（第37条第1号イの表(6)）[確認済 2026-10-30]（全方向試算 C083・C132 と同型）
 * 実行: node scripts/test-hoiku-simple-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const { calculateJumin, calcSpouseDeductionJumin } = require(path.join(ROOT, 'js/core/jumin.js'));
const { calcHoiku } = require(path.join(ROOT, 'js/core/hoiku.js'));
const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/municipalities/yokohama/hoiku-2026.json'), 'utf8'));
const MN = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/municipalities/nagoya/hoiku-2026.json'), 'utf8'));

function pageHtml(rel) {
  let html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  for (const f of ['shared/ui-input', 'shared/income', 'jumin', 'hoiku'])
    html = html.replace(new RegExp(`<script src="/js/core/${f.replace('/', '\\/')}\\.js\\?v=[0-9a-f]+"><\\/script>`), () => '<script>' + fs.readFileSync(path.join(ROOT, `js/core/${f}.js`), 'utf8') + '</script>');
  return html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
}
async function openPage(rel, url, errs) {
  const dom = new JSDOM(pageHtml(rel), { runScripts: 'dangerously', pretendToBeVisual: true, url });
  dom.window.addEventListener('error', e => errs.push(String(e.error || e.message)));
  await new Promise(r => { if (dom.window.document.readyState === 'complete') r(); else dom.window.addEventListener('load', r); });
  return dom.window;
}

(async () => {
  const errs = [];
  const w = await openPage('kanagawa/yokohama/hoiku/index.html', 'https://seido-keisan.jp/kanagawa/yokohama/hoiku/', errs);
  const d = w.document;
  let pass = 0, fail = 0;
  const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
  const setVal = (id, v) => { const e = d.getElementById(id); if (e) e.value = v; };
  const setChk = (id, v) => { const e = d.getElementById(id); if (e) e.checked = !!v; };
  function run(o) {
    w.hoikuTab('salary');
    setVal('fatherSalary', o.father ? String(o.father) : ''); setVal('motherSalary', o.mother ? String(o.mother) : '');
    setVal('enrolledOlder', String(o.enrolled || 0)); setChk('hitorioya', o.hitorioya); setChk('seikatsuhogo', false); setChk('selFlag', false);
    const dep = o.dep || {};
    setVal('depGeneral', dep.general ? String(dep.general) : ''); setVal('depSpecific', dep.specific ? String(dep.specific) : '');
    setVal('depElderly', dep.elderly ? String(dep.elderly) : ''); setVal('depParent', dep.parent ? String(dep.parent) : '');
    w.hoikuCalc();
    const t = d.getElementById('result').textContent.replace(/\s+/g, ' ');
    const mo = t.match(/保育料（月額）\s*([\d,]+) 円/), lv = t.match(/第(\d+)階層/);
    return { monthly: mo ? Number(mo[1].replace(/,/g, '')) : null, level: lv ? Number(lv[1]) : null, text: t };
  }
  A('「年収から計算」の欄がある', !!d.getElementById('fatherSalary') && !!d.getElementById('motherSalary'));

  // (a) 父 110.1万（所得45.1万）・母なし（配偶者の収入なし）・子1人 → 人数2（配偶者＋子）→ 限度136万 → 非課税 → 第2階層 0円
  //     修正前は人数0（限度45万）で均等割課税 → 第3階層 6,700円
  const a = run({ father: 1101000 });
  A(`父110.1万・母の収入なし: 第2階層（非課税）0円 → 実際 第${a.level}階層 ${a.monthly}円`, a.level === 2 && a.monthly === 0);
  // (b) 父 150万（所得85万）・ひとり親 → 子1人で限度101万 → 非課税
  const b = run({ father: 1500000, hitorioya: true });
  A(`父150万・ひとり親: 第2階層（非課税）0円 → 実際 第${b.level}階層 ${b.monthly}円`, b.level === 2 && b.monthly === 0);
  // (c) 父 170万（所得105万）・ひとり親 → 子1人の限度101万は超えるが、135万以下で非課税
  const c = run({ father: 1700000, hitorioya: true });
  A(`父170万・ひとり親（所得105万 ≤ 135万）: 非課税 0円 → 実際 第${c.level}階層 ${c.monthly}円`, c.level === 2 && c.monthly === 0);
  // (d) 父 220万（所得146万）・ひとり親・子1人 → 135万超・限度101万超 → 課税（第2階層ではない）
  const dd = run({ father: 2200000, hitorioya: true });
  A(`父220万・ひとり親（所得146万）: 課税側（第3階層以上）→ 実際 第${dd.level}階層`, dd.level >= 3);
  // (e) 父 300万・母 100万（所得35万 ≤ 58万）→ 父に配偶者控除33万・同一生計配偶者＋子＝人数2・人的控除差 5万＋5万
  const fatherR = calculateJumin(null, { salary: 3000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: Math.round(3000000 * 0.144), kyuchi: 1,
    spouseDeduction: 330000, dependents: 2, humanDeductionDiff: 100000 });
  const motherR = calculateJumin(null, { salary: 1000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: Math.round(1000000 * 0.144), kyuchi: 1 });
  const noSpouse = calculateJumin(null, { salary: 3000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: Math.round(3000000 * 0.144), kyuchi: 1 });
  A('父300万の指数: 配偶者控除33万を入れると入れないより小さい', fatherR.hoikuShotokuwari < noSpouse.hoikuShotokuwari);
  const exp = calcHoiku({ age: 'age1_2', timeType: d.getElementById('timeType') ? d.getElementById('timeType').value : undefined,
    facility: d.getElementById('facility') ? d.getElementById('facility').value : undefined, seikatsuhogo: false, hitorioya: false, month: Number(d.getElementById('month').value),
    father: { shotokuwari: fatherR.hoikuShotokuwari }, mother: { shotokuwari: motherR.hoikuShotokuwari }, isSeireiNotice: false,
    hikazei: !fatherR.isTaxable && !motherR.isTaxable, childOrder: 1 }, M);
  const e = run({ father: 3000000, mother: 1000000 });
  A(`父300万・母100万: 配偶者控除込みの指数で 第${exp.level}階層 ${exp.monthly}円 → 実際 第${e.level}階層 ${e.monthly}円`, e.level === exp.level && e.monthly === exp.monthly);
  // (f) 在園の兄姉1人（子2人）: 父 140万（所得80万）・ひとり親でない・母の収入なし → 人数3（配偶者＋子2）→ 限度171万 → 非課税
  const f = run({ father: 1400000, enrolled: 1 });
  A(`父140万・兄姉1人在園: 非課税（第2階層）→ 実際 第${f.level}階層`, f.level === 2);

  // ── 16歳以上の扶養家族（C059・C061） ──
  A('「ほかに扶養している家族」の4欄がある', ['depGeneral', 'depSpecific', 'depElderly', 'depParent'].every(id => !!d.getElementById(id)));
  // (g) 父 240万（所得160万）・母の収入なし・子1人: 扶養なしは人数2（限度136万）で課税、16〜18歳の子1人を足すと人数3（限度171万）で非課税
  const g0 = run({ father: 2400000 });
  A(`父240万・扶養なし: 課税側（第3階層以上）→ 実際 第${g0.level}階層`, g0.level >= 3);
  const g = run({ father: 2400000, dep: { general: 1 } });
  A(`父240万・16〜18歳の扶養1人: 非課税（第2階層）0円 → 実際 第${g.level}階層 ${g.monthly}円`, g.level === 2 && g.monthly === 0);
  // (h) 父 600万・母の収入なし・子1人・19〜22歳1人・同居の親1人: 扶養控除 45万＋45万・人的控除差 5万＋5万（配偶者）＋18万＋13万
  const hR = calculateJumin(null, { salary: 6000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: Math.round(6000000 * 0.144), kyuchi: 1,
    spouseDeduction: 330000, dependentDeduction: 900000, dependents: 4, humanDeductionDiff: 50000 + 50000 + 180000 + 130000 });
  const hExp = calcHoiku({ age: 'age1_2', timeType: d.getElementById('timeType').value, facility: d.getElementById('facility') ? d.getElementById('facility').value : undefined,
    seikatsuhogo: false, hitorioya: false, month: Number(d.getElementById('month').value), father: { shotokuwari: hR.hoikuShotokuwari }, mother: { shotokuwari: 0 },
    isSeireiNotice: false, hikazei: !hR.isTaxable, childOrder: 1 }, M);
  const h0 = run({ father: 6000000 });
  const h = run({ father: 6000000, dep: { specific: 1, parent: 1 } });
  A(`父600万・19〜22歳1人＋同居の親1人: 扶養控除込みの指数で 第${hExp.level}階層 ${hExp.monthly}円 → 実際 第${h.level}階層 ${h.monthly}円`, h.level === hExp.level && h.monthly === hExp.monthly);
  A(`父600万: 扶養を足すと保育料が下がる（${h0.monthly}円 → ${h.monthly}円）`, h.monthly < h0.monthly);

  // ── 給与850万円超（C083）と配偶者の人的控除差の逓減 ──
  function expectFatherOnly(salary) {
    const sd = calcSpouseDeductionJumin({ selfIncome: calculateJumin(null, { salary, age: 40, under23Dependent: true }).totalIncome, spouseIncome: 0 });
    const r = calculateJumin(null, { salary, pension: 0, otherIncome: 0, age: 40, socialInsurance: Math.round(salary * 0.144), kyuchi: 1, under23Dependent: true,
      spouseDeduction: sd.deduction, dependentDeduction: 0, dependents: 2, humanDeductionDiff: 50000 + sd.humanDiffAmount });
    return { sd, exp: calcHoiku({ age: 'age1_2', timeType: d.getElementById('timeType').value, facility: d.getElementById('facility') ? d.getElementById('facility').value : undefined,
      seikatsuhogo: false, hitorioya: false, month: Number(d.getElementById('month').value), father: { shotokuwari: r.hoikuShotokuwari }, mother: { shotokuwari: 0 },
      isSeireiNotice: false, hikazei: !r.isTaxable, childOrder: 1 }, M) };
  }
  for (const sal of [11000000, 11500000]) {
    const { sd, exp: x } = expectFatherOnly(sal);
    const got = run({ father: sal });
    A(`父${sal / 10000}万・母の収入なし: 調整控除15万・配偶者控除${sd.deduction / 10000}万・人的控除差${sd.humanDiffAmount / 10000}万で 第${x.level}階層 ${x.monthly}円 → 実際 第${got.level}階層 ${got.monthly}円`,
      got.level === x.level && got.monthly === x.monthly);
  }
  A('父1,150万（合計所得940万）: 配偶者控除 22万・人的控除差 4万', expectFatherOnly(11500000).sd.deduction === 220000 && expectFatherOnly(11500000).sd.humanDiffAmount === 40000);

  // ── 父母とも収入0（C064）: 非課税世帯として計算し一言添える ──
  const z = run({});
  A(`父母とも収入0: 第2階層（非課税）0円 → 実際 第${z.level}階層 ${z.monthly}円`, z.level === 2 && z.monthly === 0);
  A('父母とも収入0: 「収入0として計算」の注記', /父母とも収入0/.test(z.text));

  // ── 名古屋（所得割を直接入力・C106）: 父母とも所得割0 ──
  const wn = await openPage('aichi/nagoya/hoiku/index.html', 'https://seido-keisan.jp/aichi/nagoya/hoiku/', errs);
  const dn = wn.document;
  A('名古屋: 「父母とも住民税が非課税」の印がある', !!dn.getElementById('directHikazei'));
  function runN(hikazei) {
    wn.hoikuTab('direct');
    dn.getElementById('fatherShotoku').value = '0'; dn.getElementById('motherShotoku').value = '0';
    const hk = dn.getElementById('directHikazei'); if (hk) hk.checked = !!hikazei;
    wn.hoikuCalc();
    const t = dn.getElementById('result').textContent.replace(/\s+/g, ' ');
    const mo = t.match(/保育料（月額）\s*([\d,]+) 円/);
    return mo ? Number(mo[1].replace(/,/g, '')) : null;
  }
  const nBase = { age: dn.getElementById('age').value, timeType: dn.getElementById('timeType').value, facility: dn.getElementById('facility') ? dn.getElementById('facility').value : undefined,
    seikatsuhogo: false, hitorioya: false, month: Number(dn.getElementById('month').value), father: { shotokuwari: 0 }, mother: { shotokuwari: 0 }, isSeireiNotice: false, childOrder: 1 };
  const nKinto = calcHoiku(Object.assign({}, nBase, { hikazei: false }), MN).monthly;
  const nHika = calcHoiku(Object.assign({}, nBase, { hikazei: true }), MN).monthly;
  A(`名古屋 所得割0・印なし: 均等割のみ課税 ${nKinto}円 → 実際 ${runN(false)}円`, runN(false) === nKinto && nKinto > 0);
  A(`名古屋 所得割0・印あり: 非課税 ${nHika}円 → 実際 ${runN(true)}円`, runN(true) === nHika && nHika < nKinto);

  A('JSランタイムエラーなし', errs.length === 0);
  if (errs.length) console.log('  JSエラー:', errs);
  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exitCode = fail > 0 ? 1 : 0;
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
