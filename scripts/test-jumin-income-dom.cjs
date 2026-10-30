/**
 * test-jumin-income-dom.cjs — 住民税「詳しく計算」ページ（templates/jumin-income.html）の結線を jsdom で統合検証。
 *   テンプレを埋め、js/core のエンジンをインライン化して window.calcJuminFull() を実行し、#result を検査する。
 *   2026-10-12 追加（X184）: 配偶者の給与年収から配偶者控除／配偶者特別控除を自動判定する結線。
 *   期待値（住民税の控除額）は地方税法 第34条第1項第10号・第10号の2 を手で当てたもの（検証メモ X184）。
 *   2026-10-30 追加（全方向試算 C058・C083・C131・C132・C133）: 16歳未満の子の人数・ひとり親（母／父）と寡婦の選択・
 *   本人所得900万円超の配偶者の人的控除差・未成年者・給与850万円超の所得金額調整控除。
 *   根拠は地方税法 第37条第1号イの表・第295条第1項第2号・施行令 第47条の3・民法 第4条・租税特別措置法 第41条の3の11第1項
 *   [確認済 2026-10-30 e-Gov 法令API]
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
  const inline = { '/js/core/shared/ui-input.js': 'js/core/shared/ui-input.js', '/js/core/shared/income.js': 'js/core/shared/income.js', '/js/core/jumin.js': 'js/core/jumin.js', '/js/core/furusato.js': 'js/core/furusato.js' };
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
  // ページが calculateJumin に渡した入力を記録する（人的控除差など結果に出ない値の検査用）
  const _cj = w.calculateJumin; let lastIn = null;
  w.calculateJumin = function (data, inputs) { lastIn = inputs; return _cj(data, inputs); };
  function run(o) {
    setVal('salary', String(o.salary || '')); setVal('pension', ''); setVal('business', ''); setVal('age', String(o.age || 40));
    setVal('social', String(o.social != null ? o.social : ''));
    setChk('spouse', o.spouse); setChk('spouse_elderly', o.elderly);
    setVal('spouse_salary', o.spouseSalary ? String(o.spouseSalary) : '');
    ['dep_general', 'dep_specific', 'dep_elderly', 'dep_young', 'child_salary', 'life', 'quake', 'medical', 'furusato'].forEach(id => setVal(id, ''));
    if (o.young) setVal('dep_young', String(o.young));
    if (o.specific) setVal('dep_specific', String(o.specific));
    setChk('disabled', o.disabled); setChk('under23', o.under23);
    setVal('selfStatus', o.singleparent ? 'mother' : o.father ? 'father' : o.widow ? 'widow' : 'none');
    w.calcJuminFull();
    const html = w.document.getElementById('result').innerHTML;
    const m = html.match(/住民税 合計（年額）<\/div><div class="amount">([\d,]+) 円/);
    return { html, total: m ? Number(m[1].replace(/,/g, '')) : null, last: lastIn };
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
    // 190万円以上は別表第五の 4,000円刻み（年調給与額 A）なので、給与だけでは所得が 2,800円刻みでしか動かない（2026-10-29 C022）。
    // 130万の境目の両側: 給与 1,971,999 → A 1,968,000 → 1,297,600 ／ 給与 1,972,000 → 1,300,400
    [1971999, 1297600, 60000, '配偶者特別控除', false, 0],
    [1972000, 1300400, 30000, '配偶者特別控除', false, 0],
  ];
  for (const [sal, inc, ded, label, isHaigu, hd] of cases) {
    A(`配偶者給与 ${sal.toLocaleString()}: 給与所得 ${inc.toLocaleString()}`, calcSalaryIncome(sal) === inc);
    const r = run({ salary: 5000000, social: SI, spouseSalary: sal });
    A(`配偶者給与 ${sal.toLocaleString()}: 住民税合計が控除 ${ded.toLocaleString()} 円の直算と一致`, r.total === direct(5000000, ded, isHaigu, hd));
    A(`配偶者給与 ${sal.toLocaleString()}: 内訳に「${label}（配偶者の合計所得 ${inc.toLocaleString()} 円）」-${ded.toLocaleString()} 円`,
      r.html.includes(`${label}（配偶者の合計所得 ${inc.toLocaleString()} 円）</span><span class="amount">-${ded.toLocaleString()} 円`));
  }
  // (d) 133万超 → 対象外の表示・控除なし
  //   給与 2,016,000 → A 2,016,000 → 所得 1,331,200（2,012,000〜2,015,999 は 1,328,400 で 133万以下）
  const d = run({ salary: 5000000, social: SI, spouseSalary: 2016000 });
  A('配偶者給与 2,016,000（所得 1,331,200）: 控除なしの直算と一致', d.total === direct(5000000, 0, false, 0));
  A('配偶者給与 2,016,000: 内訳に「対象外」', /配偶者控除<\/span><span class="amount">対象外/.test(d.html));
  // (e) 本人 給与1,100万（合計所得905万）＋配偶者所得 100万1円 → 2/3 の 21万
  const e = run({ salary: 11000000, social: SI, spouseSalary: 1650001 });
  A('本人1,100万＋配偶者所得100万1円: 特別控除 21万（31万×2/3 切上げ）の直算と一致', e.total === direct(11000000, 210000, false, 0));
  // (f) 本人 給与1,200万（合計所得1,005万）＋チェック → 配偶者控除なし（旧実装は本人所得を見ずに33万を引いていた）
  const f = run({ salary: 12000000, social: SI, spouse: true });
  A('本人1,200万（合計所得1,000万超）＋チェック: 配偶者控除なしの直算と一致', f.total === direct(12000000, 0, false, 0));
  // (g) 2026-10-23 追加: 障害者・寡婦・ひとり親で合計所得135万円以下は均等割・所得割とも非課税（地方税法 第24条の5・第295条）
  //   給与185万 → 合計所得120万（扶養0の非課税限度45万は超える）。給与209万2千 → 所得138万4,400（135万超）
  const g0 = run({ salary: 1850000, social: 0 });
  A('給与185万・区分なし: 住民税が掛かる（従来どおり）', g0.total > 0);
  for (const [id, label] of [['singleparent', 'ひとり親'], ['widow', '寡婦'], ['disabled', '本人障害者']]) {
    const r = run({ salary: 1850000, social: 0, [id]: true });
    A(`給与185万・${label}: 住民税合計 0 円`, r.total === 0);
    const over = run({ salary: 2092000, social: 0, [id]: true });
    A(`給与209万2千（所得138万4,400）・${label}: 住民税が掛かる`, over.total > 0);
  }

  // ── 2026-10-30 追加 ──
  const base = { pension: 0, otherIncome: 0, age: 40, socialInsurance: SI, kyuchi: 1, dependentDeduction: 0, disabilityDeduction: 0,
    lifeInsuranceDeduction: 0, earthquakeInsuranceDeduction: 0, medicalDeduction: 0, specialDependentSalaries: [] };
  // (h) C131: ひとり親は母なら人的控除差5万・父なら1万（第37条第1号イの表(3)(4)・施行令 第7条の16の2）
  const hm = run({ salary: 3000000, social: SI, singleparent: true }), hf = run({ salary: 3000000, social: SI, father: true });
  A(`ひとり親（母）: 人的控除差 100,000 → 実際 ${hm.last.humanDeductionDiff}`, hm.last.humanDeductionDiff === 100000);
  A(`ひとり親（父）: 人的控除差 60,000 → 実際 ${hf.last.humanDeductionDiff}`, hf.last.humanDeductionDiff === 60000);
  A('ひとり親（父）: 住民税合計が直算（控除30万・人的控除差6万）と一致',
    hf.total === calculateJumin(null, Object.assign({}, base, { salary: 3000000, singleParentDeduction: 300000, dependents: 0, humanDeductionDiff: 60000 })).total);
  // ひとり親は合計所得500万円以下が要件（第292条第1項第12号）: 給与800万（所得610万）では控除なし
  const h5 = run({ salary: 8000000, social: SI, singleparent: true });
  A(`給与800万・ひとり親（母）: 合計所得500万超で控除なし（人的控除差 50,000 → 実際 ${h5.last.humanDeductionDiff}・控除 ${h5.last.singleParentDeduction}）`,
    h5.last.humanDeductionDiff === 50000 && h5.last.singleParentDeduction === 0);
  // (i) C132: 本人 給与1,100万（合計所得905万）＋配偶者控除 → 控除22万・人的控除差は 5万＋4万
  const ih = run({ salary: 11000000, social: SI, spouse: true });
  A(`本人1,100万＋配偶者控除: 人的控除差 90,000 → 実際 ${ih.last.humanDeductionDiff}`, ih.last.humanDeductionDiff === 90000);
  const ie = run({ salary: 11500000, social: SI, spouse: true, elderly: true });   // 合計所得955万 → 老人 13万・人的控除差 3万
  A(`本人1,150万＋老人控除対象配偶者: 控除 130,000・人的控除差 80,000 → 実際 ${ie.last.spouseDeduction}・${ie.last.humanDeductionDiff}`,
    ie.last.spouseDeduction === 130000 && ie.last.humanDeductionDiff === 80000);
  // (j) C133: 16歳未満の子2人 → 非課税限度額の人数2（1級地 35万×3＋10万＋21万＝136万）。給与200万（所得132万）・社保0 → 非課税
  const j0 = run({ salary: 2000000, social: 0 }), j2 = run({ salary: 2000000, social: 0, young: 2 });
  A(`給与200万・子なし: 課税（合計 ${j0.total}）`, j0.total > 0);
  A(`給与200万・16歳未満の子2人: 非課税 0 円 → 実際 ${j2.total}`, j2.total === 0 && j2.last.dependents === 2);
  // (k) C058: 年齢17歳（未成年者）で合計所得135万円以下 → 非課税
  const k0 = run({ salary: 1850000, social: 0, age: 40 }), k1 = run({ salary: 1850000, social: 0, age: 17 });
  A(`給与185万・40歳: 課税（合計 ${k0.total}）`, k0.total > 0);
  A(`給与185万・17歳（未成年者）: 0 円 → 実際 ${k1.total}`, k1.total === 0);
  // (l) C083: 給与1,100万・16歳未満の子1人 → 所得金額調整控除 15万（合計所得 905万→890万）
  const l0 = run({ salary: 11000000, social: SI }), l1 = run({ salary: 11000000, social: SI, young: 1 });
  const lExp = calculateJumin(null, Object.assign({}, base, { salary: 11000000, dependents: 1, humanDeductionDiff: 50000, under23Dependent: true }));
  A(`給与1,100万・16歳未満の子1人: 合計所得 ${lExp.totalIncome.toLocaleString()}（調整控除15万）・住民税 ${lExp.total} → 実際 ${l1.total}`,
    lExp.totalIncome === 8900000 && l1.total === lExp.total && l1.total < l0.total);
  const l2 = run({ salary: 11000000, social: SI, under23: true }), l3 = run({ salary: 11000000, social: SI, specific: 1 });
  A('給与1,100万・印のみ: 調整控除が入る', l2.last.under23Dependent === true && l2.total < l0.total);
  A('給与1,100万・19〜22歳1人: 調整控除が入る', l3.last.under23Dependent === true);
  A('給与1,100万・家族なし: 調整控除なし', l0.last.under23Dependent === false);

  A('JSランタイムエラーなし', errs.length === 0);
  if (errs.length) console.log('  JSエラー:', errs);
  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exitCode = fail > 0 ? 1 : 0;
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
