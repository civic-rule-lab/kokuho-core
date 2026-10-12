/**
 * test-jumin-income-dom.cjs — 住民税「詳しく計算」ページ（templates/jumin-income.html）の結線を jsdom で統合検証。
 *   テンプレを埋め、js/core のエンジンをインライン化して window.calcJuminFull() を実行し、#result を検査する。
 *   2026-10-12 追加（X184）: 配偶者の給与年収から配偶者控除／配偶者特別控除を自動判定する結線。
 *   期待値（住民税の控除額）は地方税法 第34条第1項第10号・第10号の2 を手で当てたもの（検証メモ X184）。
 * 実行: node scripts/test-jumin-income-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const { calculateJumin } = require('../js/core/jumin.js');
const { calcSalaryIncome } = require('../js/core/shared/income.js');

function buildHtml() {
  let html = fs.readFileSync(path.join(ROOT, 'templates/jumin-income.html'), 'utf8');
  const furusato = fs.readFileSync(path.join(ROOT, 'data/national/furusato-2026.json'), 'utf8').trim();
  const fill = {
    '__CANONICAL_URL__': 'https://seido-keisan.jp/tokyo/testcity/jumin/income.html', '__CITY_NAME__': 'テスト市',
    '__CITY_SLUG__': 'testcity', '__CSS_V__': 'x', '__FISCAL_YEAR_LABEL__': '令和8年度', '__FURUSATO_DATA__': furusato,
    '__JSON_LD__': '{}', '__JS_V__': 'x', '__JUMIN_DATA__': 'null', '__JUMIN_KYUCHI__': '1', '__META_DESC__': '', '__PUBLISH_YEAR__': '2026',
  };
  for (const [k, v] of Object.entries(fill)) html = html.split(k).join(v);
  const inline = { '/js/core/shared/income.js': 'js/core/shared/income.js', '/js/core/jumin.js': 'js/core/jumin.js', '/js/core/furusato.js': 'js/core/furusato.js' };
  html = html.replace(/<script src="([^"?]+)\?v=x"><\/script>/g, (m, p) =>
    inline[p] ? '<script>' + fs.readFileSync(path.join(ROOT, inline[p]), 'utf8') + '</script>' : m);
  html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
  return html;
}

(async () => {
  const dom = new JSDOM(buildHtml(), { runScripts: 'dangerously', url: 'https://seido-keisan.jp/tokyo/testcity/jumin/income.html' });
  const w = dom.window;
  const errs = [];
  w.addEventListener('error', e => errs.push(String(e.error || e.message)));
  await new Promise(r => { if (w.document.readyState === 'complete') r(); else w.addEventListener('load', r); });
  const setVal = (id, v) => { const el = w.document.getElementById(id); if (el) el.value = v; };
  const setChk = (id, v) => { const el = w.document.getElementById(id); if (el) el.checked = !!v; };
  function run(o) {
    setVal('salary', String(o.salary || '')); setVal('pension', ''); setVal('business', ''); setVal('age', String(o.age || 40));
    setVal('social', String(o.social != null ? o.social : ''));
    setChk('spouse', o.spouse); setChk('spouse_elderly', o.elderly);
    setVal('spouse_salary', o.spouseSalary ? String(o.spouseSalary) : '');
    ['dep_general', 'dep_specific', 'dep_elderly', 'child_salary', 'life', 'quake', 'medical', 'furusato'].forEach(id => setVal(id, ''));
    setChk('disabled', false); setChk('singleparent', false); setChk('widow', false);
    w.calcJuminFull();
    const html = w.document.getElementById('result').innerHTML;
    const m = html.match(/住民税 合計（年額）<\/div><div class="amount">([\d,]+) 円/);
    return { html, total: m ? Number(m[1].replace(/,/g, '')) : null };
  }
  let pass = 0, fail = 0;
  const A = (l, c) => { console.log(`${c ? '✓' : '✗'} ${l}`); c ? pass++ : fail++; };
  const SI = 700000;
  const direct = (salary, spouseDed, isHaigu, humanSpouse) => calculateJumin(null, {
    salary, pension: 0, otherIncome: 0, age: 40, socialInsurance: SI, kyuchi: 1,
    spouseDeduction: spouseDed, dependentDeduction: 0, disabilityDeduction: 0, singleParentDeduction: 0,
    lifeInsuranceDeduction: 0, earthquakeInsuranceDeduction: 0, medicalDeduction: 0,
    dependents: isHaigu ? 1 : 0, humanDeductionDiff: 50000 + humanSpouse, specialDependentSalaries: [],
  }).total;

  // (a) 従来どおり: チェックのみ → 配偶者控除 33万
  const a = run({ salary: 5000000, social: SI, spouse: true });
  A('チェックのみ: 住民税合計が配偶者控除33万の直算と一致', a.total === direct(5000000, 330000, true, 50000));
  A('チェックのみ: 内訳に「配偶者控除」-330,000 円', /配偶者控除<\/span><span class="amount">-330,000 円/.test(a.html));
  // (b) 老人控除対象配偶者 → 38万・人的控除差 10万
  const b = run({ salary: 5000000, social: SI, spouse: true, elderly: true });
  A('70歳以上: 住民税合計が配偶者控除38万（人的控除差10万）の直算と一致', b.total === direct(5000000, 380000, true, 100000));
  // (c) 配偶者の給与年収からの自動判定（境目）
  const cases = [
    [1230000, 580000, 330000, '配偶者控除', true, 50000],
    [1230001, 580001, 330000, '配偶者特別控除', false, 0],
    [1650000, 1000000, 330000, '配偶者特別控除', false, 0],
    [1650001, 1000001, 310000, '配偶者特別控除', false, 0],
    [1700001, 1050001, 260000, '配偶者特別控除', false, 0],
    [1971429, 1300000, 60000, '配偶者特別控除', false, 0],
    [1971430, 1300001, 30000, '配偶者特別控除', false, 0],
  ];
  for (const [sal, inc, ded, label, isHaigu, hd] of cases) {
    A(`配偶者給与 ${sal.toLocaleString()}: 給与所得 ${inc.toLocaleString()}`, calcSalaryIncome(sal) === inc);
    const r = run({ salary: 5000000, social: SI, spouseSalary: sal });
    A(`配偶者給与 ${sal.toLocaleString()}: 住民税合計が控除 ${ded.toLocaleString()} 円の直算と一致`, r.total === direct(5000000, ded, isHaigu, hd));
    A(`配偶者給与 ${sal.toLocaleString()}: 内訳に「${label}（配偶者の合計所得 ${inc.toLocaleString()} 円）」-${ded.toLocaleString()} 円`,
      r.html.includes(`${label}（配偶者の合計所得 ${inc.toLocaleString()} 円）</span><span class="amount">-${ded.toLocaleString()} 円`));
  }
  // (d) 133万超 → 対象外の表示・控除なし
  const d = run({ salary: 5000000, social: SI, spouseSalary: 2014288 });
  A('配偶者給与 2,014,288（所得 1,330,001）: 控除なしの直算と一致', d.total === direct(5000000, 0, false, 0));
  A('配偶者給与 2,014,288: 内訳に「対象外」', /配偶者控除<\/span><span class="amount">対象外/.test(d.html));
  // (e) 本人 給与1,100万（合計所得905万）＋配偶者所得 100万1円 → 2/3 の 21万
  const e = run({ salary: 11000000, social: SI, spouseSalary: 1650001 });
  A('本人1,100万＋配偶者所得100万1円: 特別控除 21万（31万×2/3 切上げ）の直算と一致', e.total === direct(11000000, 210000, false, 0));
  // (f) 本人 給与1,200万（合計所得1,005万）＋チェック → 配偶者控除なし（旧実装は本人所得を見ずに33万を引いていた）
  const f = run({ salary: 12000000, social: SI, spouse: true });
  A('本人1,200万（合計所得1,000万超）＋チェック: 配偶者控除なしの直算と一致', f.total === direct(12000000, 0, false, 0));
  A('JSランタイムエラーなし', errs.length === 0);
  if (errs.length) console.log('  JSエラー:', errs);
  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exitCode = fail > 0 ? 1 : 0;
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
