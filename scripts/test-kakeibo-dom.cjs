/**
 * test-kakeibo-dom.cjs — 家計簿(city-integrated.html)の結線を jsdom で統合検証。
 *   テンプレを埋め、js/core の全エンジンをインライン化、fetch をローカルデータへモックし、
 *   window.calcAll() を実行して #systems のカードと金額を検査する。
 *   会社員／自営／賞与／年金のみ の全経路と、JSランタイムエラーが無いことを確認。
 * 前提: devDependency jsdom（無ければ `npm i -D jsdom`）。
 * 実行: node scripts/test-kakeibo-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');

let html = fs.readFileSync(path.join(ROOT, 'templates/city-integrated.html'), 'utf8');
const fillMap = {
  '__CITY_SLUG__': 'testcity', '__PREF_SLUG__': 'tokyo', '__CITY_NAME__': 'テスト市',
  '__FISCAL_YEAR_LABEL__': '令和8年度', '__META_DESC__': 'test',
  '__CANONICAL_URL__': 'https://seido-keisan.jp/tokyo/testcity/kakeibo/',
  '__JSON_LD__': '{}', '__CSS_V__': 'x', '__JS_V__': 'x', '__LINK_JUMIN_BLOCK__': '',
  '__LINK_KOKUHO__': 'https://kokuho-keisan.jp/tokyo/testcity/',
};
for (const [k, v] of Object.entries(fillMap)) html = html.split(k).join(v);

const engineMap = {
  '/js/core/shared/income.js': 'js/core/shared/income.js',
  '/js/core/jumin.js': 'js/core/jumin.js',
  '/js/core/kokuho.js': 'js/core/kokuho.js',
  '/js/core/kaigo.js': 'js/core/kaigo.js',
  '/js/core/hoiku.js': 'js/core/hoiku.js',
  '/js/core/shaho.js': 'js/core/shaho.js',
  '/js/core/shotoku.js': 'js/core/shotoku.js',
  '/js/core/shogakukin.js': 'js/core/shogakukin.js',
  '/js/core/shogakukin-bridge.js': 'js/core/shogakukin-bridge.js',
};
html = html.replace(/<script src="([^"?]+)\?v=x"><\/script>/g, (m, p) =>
  engineMap[p] ? '<script>' + fs.readFileSync(path.join(ROOT, engineMap[p]), 'utf8') + '</script>' : m);
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');

// 保育料経路の統合検証用に、実在自治体の hoiku データを testcity として配信する（標準 inputBasis の自治体を選ぶ）
const HOIKU_FIXTURE = path.join(ROOT, 'data/municipalities/yokohama/hoiku-2026.json');

function mkFetch() {
  return (url) => {
    let p = null;
    if (url.startsWith('/data/shaho/')) p = path.join(ROOT, 'data/shaho', url.split('/').pop());
    else if (url.startsWith('/data/national/')) p = path.join(ROOT, 'data/national', url.split('/').pop());
    else if (url === '/js/core/shogakukin-2026.json') p = path.join(ROOT, 'js/core/shogakukin-2026.json');
    else if (url === '/data/municipalities/testcity/hoiku-2026.json' && fs.existsSync(HOIKU_FIXTURE)) p = HOIKU_FIXTURE;
    // その他の municipalities は 404（jumin は標準値で計算される）
    if (p && fs.existsSync(p)) { const j = JSON.parse(fs.readFileSync(p, 'utf8')); return Promise.resolve({ ok: true, json: () => Promise.resolve(j) }); }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('404')) });
  };
}

// ── 期待値をエンジン直算で用意（DOM の結果と等値比較する） ──
const ShahoN = require('../js/core/shaho.js');
const { calculateJumin } = require('../js/core/jumin.js');
const { calcHoiku } = require('../js/core/hoiku.js');
const shahoData = ShahoN.loadData(path.join(ROOT, 'data', 'shaho'));
function expectShahoAnnual(salary, bonus, age) { // テンプレ shahoAnnual と同式
  const input = { monthlySalary: Math.round(salary / 12), targetMonth: '2026-07', prefSlug: 'tokyo', age, koyoCategory: 'ippan' };
  if (bonus > 0) { input.bonus = bonus; input.bonusYearToDate = 0; }
  const r = ShahoN.calculateShaho(input, shahoData);
  const m = r.health.employee + r.care.employee + r.shienkin.employee + r.koseiNenkin.employee + r.koyo.employee;
  let bE = 0;
  if (r.bonus) { const b = r.bonus; bE = b.health.employee + b.care.employee + b.shienkin.employee + b.koseiNenkin.employee + ((b.koyo && b.koyo.employee) || 0); }
  return Math.round(m * 12 + bE);
}
// ── 奨学金の期待値（テンプレの supporter 構築と同式・bridge 直算） ──
const SG = require('./load-shogakukin.cjs');
function expectShogaku(salary, bonus, spouseSalary, opts) {
  opts = opts || {};
  const bridge = SG.bridge(), spec = SG.spec();
  const children = opts.children || 1;
  const hasSpouse = !(spouseSalary > 0);
  const sup = [{ salary: salary + bonus, pension: opts.pension || 0, age: opts.age || 40,
    socialInsurance: expectShahoAnnual(salary, bonus, opts.age || 40),
    hasSpouseDeduction: hasSpouse, dependents: (hasSpouse ? 1 : 0) + children }];
  if (spouseSalary > 0) sup.push({ salary: spouseSalary, age: 40,
    socialInsurance: expectShahoAnnual(spouseSalary, 0, 40), dependents: children });
  return bridge.calcFromIncome(spec, null, {
    supportersIncome: sup,
    student: { level: opts.level || '大学', schoolType: opts.setti || '私立', attendance: opts.attend || '自宅' },
    childrenCount: children,
  });
}

function expectHoikuMonthly(salary, bonus) { // テンプレ _juminOf→calcHoikuFromSalaries と同式（単親・第1子・1,2歳）
  const M = JSON.parse(fs.readFileSync(HOIKU_FIXTURE, 'utf8'));
  const si = expectShahoAnnual(salary, bonus, 40);
  const f = calculateJumin(null, { salary: salary + bonus, pension: 0, otherIncome: 0, age: 40, socialInsurance: si });
  const input = { age: 'age1_2', hitorioya: false, month: (M.fiscalSwitch || 9),
    father: { shotokuwari: f.hoikuShotokuwari }, mother: { shotokuwari: 0 }, isSeireiNotice: false,
    hikazei: false, childOrder: 1 };
  return calcHoiku(input, M).monthly || 0;
}

(async () => {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://seido-keisan.jp/tokyo/testcity/kakeibo/' });
  const w = dom.window;
  w.fetch = mkFetch();
  const errs = [];
  w.addEventListener('error', e => errs.push(String(e.error || e.message)));
  await new Promise(r => { if (w.document.readyState === 'complete') r(); else w.addEventListener('load', r); });

  const setVal = (id, v) => { const el = w.document.getElementById(id); if (el) el.value = v; };
  async function run(opts) {
    setVal('salary', String(opts.salary || ''));
    setVal('pension', String(opts.pension || ''));
    setVal('age', String(opts.age || ''));
    setVal('family', '1');
    if (w.document.getElementById('employment')) w.document.getElementById('employment').value = opts.employment || 'kaishain';
    setVal('bonus', opts.bonus != null ? String(opts.bonus) : '');
    await w.calcAll();
    const sys = w.document.getElementById('systems').innerHTML;
    const grand = w.document.getElementById('grandAmt').textContent;
    const heads = [...sys.matchAll(/ci-grp-head[^>]*>([^<]*)<span[^>]*>([^<]*)</g)].map(m => [m[1].trim(), m[2].trim()]);
    return { sys, grand, heads };
  }
  const num = s => Number((s || '').replace(/[^\d]/g, ''));
  const find = (hs, name) => hs.find(h => h[0] === name);

  const r1 = await run({ salary: 6000000, age: 40, employment: 'kaishain' });
  const r2 = await run({ salary: 6000000, age: 40, employment: 'kaishain', bonus: 1000000 });
  const r3 = await run({ salary: 6000000, age: 40, employment: 'jiei' });
  const r4 = await run({ salary: 0, pension: 2500000, age: 67, employment: 'kaishain' });

  // 保育料 opt-in（賞与なし／あり）— エンジン直算との等値検証
  const optIn = w.document.getElementById('hoikuOptIn');
  if (optIn) { optIn.checked = true; }
  const h1 = await run({ salary: 6000000, age: 40, employment: 'kaishain' });
  const h2 = await run({ salary: 6000000, age: 40, employment: 'kaishain', bonus: 1000000 });
  if (optIn) { optIn.checked = false; }

  let pass = 0, fail = 0;
  const A = (l, c) => { console.log(`${c ? '✓' : '✗'} ${l}`); c ? pass++ : fail++; };
  const shaho1 = find(r1.heads, '社会保険（会社員）'), tax1 = find(r1.heads, '所得税');
  A('会社員: 社会保険カードが実額表示', !!shaho1 && /円\/年/.test(shaho1[1]));
  A('会社員: 社会保険が約93万円(±3万)', shaho1 && Math.abs(num(shaho1[1]) - 930000) < 30000);
  A('会社員: 所得税カードが実額表示', !!tax1 && /円\/年/.test(tax1[1]));
  A('会社員: 国保カードは出ない', !/国民健康保険/.test(r1.sys));
  A('自営: 国保枠が出て社保カードは出ない', /国民健康保険/.test(r3.sys) && !find(r3.heads, '社会保険（会社員）'));
  A('賞与ありは合計が大きい', num(r2.grand) > num(r1.grand));
  A('賞与ありは住民税も所得税も増える（給与＋賞与で課税）',
    num(find(r2.heads, '住民税')[1]) > num(find(r1.heads, '住民税')[1]) &&
    num(find(r2.heads, '所得税')[1]) > num(find(r1.heads, '所得税')[1]));
  A('年金のみ会社員: 給与0で所得税カードなし', !find(r4.heads, '所得税'));

  // ── 保育料の結線（賞与→住民税→保育料指数の伝播をエンジン直算と等値比較） ──
  const hoiku1 = find(h1.heads, '保育料（認可・0〜2歳）');
  const hoiku2 = find(h2.heads, '保育料（認可・0〜2歳）');
  const exp1 = expectHoikuMonthly(6000000, 0);
  const exp2 = expectHoikuMonthly(6000000, 1000000);
  A('保育料カードが出る（opt-in・実データ）', !!hoiku1 && !!hoiku2);
  A(`保育料(賞与なし)がエンジン直算と一致（月額 ${exp1.toLocaleString()}円）`, hoiku1 && num(hoiku1[1]) === exp1 * 12);
  A(`保育料(賞与100万)がエンジン直算と一致（月額 ${exp2.toLocaleString()}円）`, hoiku2 && num(hoiku2[1]) === exp2 * 12);
  A('賞与は保育料を下げない（賞与込み指数で判定）', exp2 >= exp1 && hoiku2 && num(hoiku2[1]) >= num(hoiku1[1]));

  // ── 奨学金の結線（opt-in・支援カード＝合計に加算しない・bridge 直算と等値比較） ──
  const sgOptIn = w.document.getElementById('shogakuOptIn');
  const setSel = (id, v) => { const el = w.document.getElementById(id); if (el) el.value = v; };
  if (sgOptIn) sgOptIn.checked = true;

  // (a) 会社員600万・配偶者なし・子1人・大学私立自宅
  setVal('shogakuSpouse', ''); setSel('shogakuLevel', '大学'); setSel('shogakuSetti', '私立');
  setSel('shogakuAttend', '自宅'); setSel('shogakuChildren', '1');
  const s1 = await run({ salary: 6000000, age: 40, employment: 'kaishain' });
  const e1 = expectShogaku(6000000, 0, 0, {});
  // (b) 会社員250万・配偶者なし（低所得帯＝区分あり想定）
  const s2 = await run({ salary: 2500000, age: 40, employment: 'kaishain' });
  const e2 = expectShogaku(2500000, 0, 0, {});
  // (c) 会社員1,200万・子3人以上＝多子世帯（減免満額・給付0）
  setSel('shogakuChildren', '3');
  const s3 = await run({ salary: 12000000, age: 40, employment: 'kaishain' });
  const e3 = expectShogaku(12000000, 0, 0, { children: 3 });
  // (d) 共働き 600万＋300万・子2人
  setSel('shogakuChildren', '2'); setVal('shogakuSpouse', '3000000');
  const s4 = await run({ salary: 6000000, age: 40, employment: 'kaishain' });
  const e4 = expectShogaku(6000000, 0, 3000000, { children: 2 });
  if (sgOptIn) sgOptIn.checked = false;
  setVal('shogakuSpouse', '');

  const sgName = '奨学金（給付型＋授業料減免）';
  const sgShortOf = (r) => r.kubunCode
    ? (r.kubun + '（' + (r.ratioLabel === '満額' ? '満額' : '支援' + r.ratioLabel) + '）')
    : (r.isTashiSetai ? '多子世帯' : '対象外（目安）');
  const grantOf = (sys) => { const m = sys.match(/給付奨学金（月額）<\/div><div[^>]*>([\d,]+) 円/); return m ? num(m[1]) : null; };
  const redOf = (sys) => { const m = sys.match(/授業料減免（年額上限）<\/div><div[^>]*>([\d,]+) 円/); return m ? num(m[1]) : null; };

  const sg1 = find(s1.heads, sgName), sg2 = find(s2.heads, sgName), sg3 = find(s3.heads, sgName), sg4 = find(s4.heads, sgName);
  A('奨学金カードが出る（opt-in）', !!sg1 && !!sg2 && !!sg3 && !!sg4);
  A(`奨学金(600万・子1) 区分が bridge 直算と一致（${sgShortOf(e1)}）`, sg1 && sg1[1] === sgShortOf(e1));
  A(`奨学金(250万・子1) 区分が bridge 直算と一致（${sgShortOf(e2)}）`, sg2 && sg2[1] === sgShortOf(e2));
  A(`奨学金(250万) 給付月額一致（${e2.grantMonthly.toLocaleString()}円）`,
    e2.grantMonthly > 0 ? grantOf(s2.sys) === e2.grantMonthly : grantOf(s2.sys) === null);
  A(`奨学金(250万) 減免上限一致（${e2.reductionCap.tuition.toLocaleString()}円）`,
    e2.reductionCap.tuition > 0 ? redOf(s2.sys) === e2.reductionCap.tuition : redOf(s2.sys) === null);
  A(`奨学金(1200万・子3) 多子世帯＝減免満額・給付なし（${sgShortOf(e3)}）`,
    sg3 && sg3[1] === sgShortOf(e3) && grantOf(s3.sys) === null &&
    (e3.reductionCap.tuition > 0 ? redOf(s3.sys) === e3.reductionCap.tuition : true));
  A(`奨学金(共働き900万・子2) 区分一致（${sgShortOf(e4)}）`, sg4 && sg4[1] === sgShortOf(e4));
  A('奨学金は合計に加算しない（支援カード）', num(s1.grand) === num(r1.grand));

  A('JSランタイムエラーなし', errs.length === 0);
  if (errs.length) console.log('  JSエラー:', errs);
  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exitCode = fail > 0 ? 1 : 0;
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
