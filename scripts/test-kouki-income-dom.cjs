/**
 * test-kouki-income-dom.cjs — 後期高齢者医療「詳しく計算」ページ（生成物 tokyo/shinjuku/kouki/income.html）の結線を jsdom で検証。
 *   2026-10-30 追加（全方向試算 C220）: 世帯主が被保険者でないとき、世帯主の所得を均等割の軽減の判定に入れる。
 *
 *   期待値の根拠 [確認済 2026-10-30 e-Gov 法令API・2026-10-01 施行時点]:
 *   ・軽減の判定所得は「被保険者、その属する世帯の世帯主及び…他の世帯員である被保険者」の所得の合算
 *     （高齢者の医療の確保に関する法律施行令 第18条第5項第1号・第4号）。給与所得者等の数も世帯主を含めて数える
 *   ・65歳以上の公的年金等の所得は15万円を引き、給与所得者等の年金収入の基準は125万円（同令 附則第3条）
 *   ・保険料（所得割・均等割）は被保険者だけ。世帯主の保険料は出さない
 * 実行: node scripts/test-kouki-income-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const { calculateKouki } = require(path.join(ROOT, 'js/core/kouki.js'));
const { calcSalaryIncome, calcPensionIncome } = require(path.join(ROOT, 'js/core/shared/income.js'));

const REL = 'tokyo/shinjuku/kouki/income.html';
let html = fs.readFileSync(path.join(ROOT, REL), 'utf8');
const KD = JSON.parse(html.match(/const KOUKI_DATA = (\{[\s\S]*?\}); const CITY_SLUG/)[1]);
for (const f of ['shared/ui-input', 'shared/income', 'kouki'])
  html = html.replace(new RegExp(`<script src="/js/core/${f.replace('/', '\\/')}\\.js\\?v=[0-9a-f]+"><\\/script>`), () => '<script>' + fs.readFileSync(path.join(ROOT, `js/core/${f}.js`), 'utf8') + '</script>');
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');

(async () => {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://seido-keisan.jp/' + REL });
  const w = dom.window, d = w.document;
  const errs = [];
  w.addEventListener('error', e => errs.push(String(e.error || e.message)));
  await new Promise(r => { if (d.readyState === 'complete') r(); else w.addEventListener('load', r); });
  let pass = 0, fail = 0;
  const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
  const sv = (id, v) => { const e = d.getElementById(id); if (e) e.value = v; };
  function run(o) {
    d.getElementById('count').value = '1'; d.getElementById('count').dispatchEvent(new w.Event('change'));
    sv('m1_pension', String(o.pension || '')); sv('m1_salary', ''); sv('m1_other', ''); d.getElementById('m1_dep').checked = false;
    const hh = o.hh;
    const box = d.getElementById('hhOutside'); if (box) box.checked = !!hh;
    sv('hh_salary', hh && hh.salary ? String(hh.salary) : ''); sv('hh_pension', hh && hh.pension ? String(hh.pension) : '');
    sv('hh_other', hh && hh.other ? String(hh.other) : ''); sv('hh_age', hh && hh.age ? String(hh.age) : '');
    w.calcKouki();
    const t = d.getElementById('result').textContent.replace(/\s+/g, ' ');
    const m = t.match(/世帯の後期高齢者医療保険料 合計（年額・概算）\s*約\s*([\d,]+) 円/), lb = t.match(/1人目（([^）]+)）/);
    return { total: m ? Number(m[1].replace(/,/g, '')) : null, label: lb ? lb[1] : null };
  }
  // 被保険者1人（年金80万＝所得0）の期待値
  const pInc = calcPensionIncome(800000, 76);
  const exp = (judge, earners) => calculateKouki({ totalIncome: pInc, reductionJudgmentIncome: judge, householdInsuredCount: 1, pensionSalaryEarnerCount: earners, formerEmployeeInsuranceDependent: false }, KD);

  A('「世帯主は後期高齢者医療に入っていない」の印と世帯主の4欄がある', !!d.getElementById('hhOutside') && ['hh_salary', 'hh_pension', 'hh_other', 'hh_age'].every(id => !!d.getElementById(id)));
  const a = run({ pension: 800000 }), ae = exp(Math.max(pInc - 150000, 0), 0);
  A(`被保険者のみ（年金80万）: ${ae.reductionLabel} ${ae.total}円 → 実際 ${a.label} ${a.total}円`, a.total === ae.total && a.label === ae.reductionLabel);
  // (b) 世帯主 50歳・給与400万 → 判定所得に給与所得、給与所得者等の数 1
  const b = run({ pension: 800000, hh: { salary: 4000000, age: 50 } }), be = exp(Math.max(pInc - 150000, 0) + calcSalaryIncome(4000000), 1);
  A(`世帯主 給与400万: ${be.reductionLabel} ${be.total}円 → 実際 ${b.label} ${b.total}円`, b.total === be.total && b.label === be.reductionLabel && b.total > a.total);
  // (c) 世帯主 68歳・年金200万（所得90万）→ 15万を引いて75万、年金125万超で給与所得者等
  const hp = calcPensionIncome(2000000, 68);
  const c = run({ pension: 800000, hh: { pension: 2000000, age: 68 } }), ce = exp(Math.max(pInc - 150000, 0) + hp - 150000, 1);
  A(`世帯主 68歳・年金200万（所得${hp}−15万）: ${ce.reductionLabel} ${ce.total}円 → 実際 ${c.label} ${c.total}円`, c.total === ce.total && c.label === ce.reductionLabel);
  // (d) 世帯主 60歳・年金200万 → 15万は引かない（65歳未満）
  const hp60 = calcPensionIncome(2000000, 60);
  const dd = run({ pension: 800000, hh: { pension: 2000000, age: 60 } }), de = exp(Math.max(pInc - 150000, 0) + hp60, 1);
  A(`世帯主 60歳・年金200万（所得${hp60}）: ${de.reductionLabel} ${de.total}円 → 実際 ${dd.label} ${dd.total}円`, dd.total === de.total && dd.label === de.reductionLabel);
  // (e) 印を外すと世帯主の欄に値があっても使わない
  const box = d.getElementById('hhOutside');
  d.getElementById('count').value = '1';
  sv('m1_pension', '800000'); if (box) box.checked = false; sv('hh_salary', '4000000'); w.calcKouki();
  A('印なし: 世帯主の欄の値を使わない', /1人目（/.test(d.getElementById('result').textContent) && d.getElementById('result').textContent.includes(a.label));
  A('JSランタイムエラーなし', errs.length === 0);
  if (errs.length) console.log('  JSエラー:', errs);
  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exitCode = fail > 0 ? 1 : 0;
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
