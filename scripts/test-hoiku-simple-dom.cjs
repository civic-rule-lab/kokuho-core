/**
 * test-hoiku-simple-dom.cjs — 保育料ページ（生成物 kanagawa/yokohama/hoiku/index.html）の「年収から計算」を jsdom で検証。
 *   2026-10-23 追加（X223）: 年収→住民税の判定に、世帯の家族（16歳未満の子・配偶者・ひとり親）が入ること。
 *
 *   期待値の根拠:
 *   ・非課税限度額の人数＝同一生計配偶者＋扶養親族（16歳未満の子を含む）。1級地は 35万×(1+人数)＋10万＋21万（地方税法施行令 第47条の3）
 *   ・配偶者の合計所得58万円以下 → 配偶者控除33万（地方税法 第314条の2第1項第10号）
 *   ・ひとり親で合計所得135万円以下 → 非課税（第295条第1項第2号）
 *   ・横浜市の表: 第2階層（市民税非課税）0円、第3階層（均等割のみ・認可・標準）6,700円（data/municipalities/yokohama/hoiku-2026.json）
 * 実行: node scripts/test-hoiku-simple-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const { calculateJumin } = require(path.join(ROOT, 'js/core/jumin.js'));
const { calcHoiku } = require(path.join(ROOT, 'js/core/hoiku.js'));
const M = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/municipalities/yokohama/hoiku-2026.json'), 'utf8'));

let html = fs.readFileSync(path.join(ROOT, 'kanagawa/yokohama/hoiku/index.html'), 'utf8');
for (const f of ['shared/ui-input', 'shared/income', 'jumin', 'hoiku'])
  html = html.replace(new RegExp(`<script src="/js/core/${f.replace('/', '\\/')}\\.js\\?v=[0-9a-f]+"><\\/script>`), () => '<script>' + fs.readFileSync(path.join(ROOT, `js/core/${f}.js`), 'utf8') + '</script>');
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');

(async () => {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://seido-keisan.jp/kanagawa/yokohama/hoiku/' });
  const w = dom.window, d = w.document;
  const errs = [];
  w.addEventListener('error', e => errs.push(String(e.error || e.message)));
  await new Promise(r => { if (d.readyState === 'complete') r(); else w.addEventListener('load', r); });
  let pass = 0, fail = 0;
  const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
  const setVal = (id, v) => { const e = d.getElementById(id); if (e) e.value = v; };
  const setChk = (id, v) => { const e = d.getElementById(id); if (e) e.checked = !!v; };
  function run(o) {
    w.hoikuTab('salary');
    setVal('fatherSalary', o.father ? String(o.father) : ''); setVal('motherSalary', o.mother ? String(o.mother) : '');
    setVal('enrolledOlder', String(o.enrolled || 0)); setChk('hitorioya', o.hitorioya); setChk('seikatsuhogo', false); setChk('selFlag', false);
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
  A('JSランタイムエラーなし', errs.length === 0);
  if (errs.length) console.log('  JSエラー:', errs);
  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exitCode = fail > 0 ? 1 : 0;
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
