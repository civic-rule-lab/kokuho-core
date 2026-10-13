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
  '__JUMIN_KYUCHI__': '1',
  '__HAS_JUMIN_PAGE__': 'true',   // 1級地（期待値の calculateJumin も級地未指定＝1級地）
};
for (const [k, v] of Object.entries(fillMap)) html = html.split(k).join(v);

const engineMap = {
  '/js/core/shared/income.js': 'js/core/shared/income.js',
  '/js/core/jumin.js': 'js/core/jumin.js',
  '/js/core/kokuho.js': 'js/core/kokuho.js',
  '/js/core/kaigo.js': 'js/core/kaigo.js',
  '/js/core/kouki.js': 'js/core/kouki.js',
  '/js/core/hoiku.js': 'js/core/hoiku.js',
  '/js/core/shaho.js': 'js/core/shaho.js',
  '/js/core/shotoku.js': 'js/core/shotoku.js',
  '/js/core/shogakukin.js': 'js/core/shogakukin.js',
  '/js/core/shogakukin-bridge.js': 'js/core/shogakukin-bridge.js',
  '/js/core/furusato.js': 'js/core/furusato.js',
};
html = html.replace(/<script src="([^"?]+)\?v=x"><\/script>/g, (m, p) =>
  engineMap[p] ? '<script>' + fs.readFileSync(path.join(ROOT, engineMap[p]), 'utf8') + '</script>' : m);
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');

// 保育料経路の統合検証用に、実在自治体の hoiku データを testcity として配信する（標準 inputBasis の自治体を選ぶ）
const HOIKU_FIXTURE = path.join(ROOT, 'data/municipalities/yokohama/hoiku-2026.json');
// 国保の結線検証用（2026-10-04 追加・TASKS X170-12）。介護分の有無を本人の年齢で検査するため、
// 実在自治体の kokuho データを testcity として配信する（介護分の率がある自治体）。
const KOKUHO_FIXTURE = path.join(ROOT, 'data/municipalities/ichihara/kokuho-2026.json');
// 社会保険料控除の一本化（2026-10-11・FN11）の検証用: 介護1号（verified）と後期高齢のデータも同じ自治体から配信する。
const KAIGO_FIXTURE = path.join(ROOT, 'data/municipalities/ichihara/kaigo-2026.json');
const KOUKI_FIXTURE = path.join(ROOT, 'data/municipalities/ichihara/kouki-2026.json');

function mkFetch() {
  return (url) => {
    let p = null;
    if (url.startsWith('/data/shaho/')) p = path.join(ROOT, 'data/shaho', url.split('/').pop());
    else if (url.startsWith('/data/national/')) p = path.join(ROOT, 'data/national', url.split('/').pop());
    else if (url === '/js/core/shogakukin-2026.json') p = path.join(ROOT, 'js/core/shogakukin-2026.json');
    else if (url === '/data/municipalities/testcity/hoiku-2026.json' && fs.existsSync(HOIKU_FIXTURE)) p = HOIKU_FIXTURE;
    else if (url === '/data/municipalities/testcity/kokuho-2026.json' && fs.existsSync(KOKUHO_FIXTURE)) p = KOKUHO_FIXTURE;
    else if (url === '/data/municipalities/testcity/kaigo-2026.json' && fs.existsSync(KAIGO_FIXTURE)) p = KAIGO_FIXTURE;
    else if (url === '/data/municipalities/testcity/kouki-2026.json' && fs.existsSync(KOUKI_FIXTURE)) p = KOUKI_FIXTURE;
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
    // 扶養・配偶者（2026-10-11 X183）: 指定が無ければ「なし」に戻す
    const fam = opts.family || {};
    if (w.document.getElementById('famSpouse')) w.document.getElementById('famSpouse').value = fam.spouse || 'none';
    setVal('famDepGeneral', fam.general ? String(fam.general) : '');
    setVal('famDepSpecific', fam.specific ? String(fam.specific) : '');
    setVal('famDepElderly', fam.elderly ? String(fam.elderly) : '');
    setVal('famDepParent', fam.parent ? String(fam.parent) : '');
    // 配偶者の給与年収・働き方（2026-10-12 X184）: 指定が無ければ空欄・会社員に戻す
    setVal('famSpouseSalary', fam.spouseSalary ? String(fam.spouseSalary) : '');
    if (w.document.getElementById('famSpouseWork')) w.document.getElementById('famSpouseWork').value = fam.spouseWork || 'kaishain';
    setVal('famSpouseAge', fam.spouseAge ? String(fam.spouseAge) : '');
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
  // 国保の介護分（2026-10-04 追加）: 自営・本人45歳は介護分あり、本人30歳はなし
  const r5 = await run({ salary: 6000000, age: 45, employment: 'jiei' });
  const r6 = await run({ salary: 6000000, age: 30, employment: 'jiei' });
  // 社会保険料控除の一本化（2026-10-11）: 年金のみ・自営67歳（国保＋介護1号）、年金のみ・自営77歳（後期高齢＋介護1号）
  const r7 = await run({ salary: 0, pension: 2500000, age: 67, employment: 'jiei' });
  const r8 = await run({ salary: 0, pension: 2500000, age: 77, employment: 'jiei' });

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
  {
    const { calculateKokuho } = require('./lib/kokuho-loader.cjs');
    const { calcSalaryIncome } = require('../js/core/shared/income.js');
    const kd = JSON.parse(fs.readFileSync(KOKUHO_FIXTURE, 'utf8'));
    const income = calcSalaryIncome(6000000);
    const base = { income, family: 1, preschool: 0, under18: 0, salaryPensionCount: 1, fixedAssetTax: 0 };
    const k45 = find(r5.heads, '国民健康保険'), k30 = find(r6.heads, '国民健康保険');
    A('自営45歳: 国保に介護分が入る（care=1 の直算と一致）', !!k45 && num(k45[1]) === calculateKokuho({ ...base, care: 1 }, kd).total);
    A('自営30歳: 国保に介護分は入らない（care=0 の直算と一致）', !!k30 && num(k30[1]) === calculateKokuho({ ...base, care: 0 }, kd).total);
    // 国保カードの内訳（2026-10-04 追加・TASKS X173-5）: 子ども・子育て支援金分の行があり、
    // 医療・支援・介護・子どもの4行の和が見出しの総額と一致する（旧実装は子ども分の行が無く、全自治体でずれていた）。
    // 法定軽減の行は各分から差し引き済みの額の再掲なので和に含めない（軽減なしの所得で検証）。
    const kokuhoCard = r5.sys.split("ci-grp'").find(s => s.includes('国民健康保険'));
    const rowVal = label => { const m = kokuhoCard && kokuhoCard.match(new RegExp('>' + label + '</div><div[^>]*>(-?[\\d,]+) 円')); return m ? num(m[1]) : null; };
    const rows45 = ['医療分', '支援分', '介護分', '子ども・子育て支援金分'].map(rowVal);
    const exp45 = calculateKokuho({ ...base, care: 1 }, kd);
    A('自営45歳: 国保の内訳に子ども・子育て支援金分の行がある（直算と一致）', rows45[3] !== null && rows45[3] === exp45.childcareTotal && exp45.childcareTotal > 0);
    A('自営45歳: 国保の内訳4行の和が総額と一致', rows45.every(v => v !== null) && rows45.reduce((a, b) => a + b, 0) === num(k45[1]));
    // 法定軽減の行は「差し引き済み」と書き、「-」を付けない（2026-10-08・TASKS X173-22）
    A('自営45歳: 国保の法定軽減の行は「上の各分から差し引き済み」と書き、金額に「-」が無い',
      !!kokuhoCard && /法定軽減（上の各分から差し引き済み）<\/div><div[^>]*>[\d,]+ 円/.test(kokuhoCard));
  }
  // ── 社会保険料控除の一本化（2026-10-11・プロジェクト「ふるさと納税」18 §0-1 / FN11）──
  //   自営・年金の社会保険料控除は、同じページで計算した国保・後期高齢・介護1号（＋国民年金データがあれば定額）の実額。
  //   旧実装は給与×14.4%（年金のみは0）。住民税カード・保育料・ふるさと納税の上限は同じ控除から出る。
  {
    const { calculateKokuho } = require('./lib/kokuho-loader.cjs');
    const { calcSalaryIncome, calcPensionIncome } = require('../js/core/shared/income.js');
    const { calculateKaigo } = require('../js/core/kaigo.js');
    const { calculateKouki } = require('../js/core/kouki.js');
    const F = require('../js/core/furusato.js');
    const Shotoku = require('../js/core/shotoku.js');
    const fzData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/furusato-2027.json'), 'utf8'));
    const kiso26 = Shotoku.loadParams(2026, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8'))).kisoKojo;
    const kd = JSON.parse(fs.readFileSync(KOKUHO_FIXTURE, 'utf8'));
    const kgd = JSON.parse(fs.readFileSync(KAIGO_FIXTURE, 'utf8'));
    const kkd = JSON.parse(fs.readFileSync(KOUKI_FIXTURE, 'utf8'));
    const nenkinPath = path.join(ROOT, 'data/national/kokumin-nenkin-2026.json');
    const nenkinAnnual = fs.existsSync(nenkinPath) ? (JSON.parse(fs.readFileSync(nenkinPath, 'utf8')).monthly || 0) * 12 : 0;
    const siLine = (sys) => { const m = sys.match(/社会保険料控除（住民税・所得税に共通）: ([\d,]+) 円（([^）]*)）/); return m ? { total: num(m[1]), parts: m[2] } : null; };

    // (a) 自営・給与600万・40歳: 控除 = 国保（介護分あり）＋国民年金（データがあれば）
    const inc600 = calcSalaryIncome(6000000);
    const kok600 = calculateKokuho({ income: inc600, family: 1, preschool: 0, under18: 0, care: 1, salaryPensionCount: 1, fixedAssetTax: 0 }, kd).total;
    const si600 = kok600 + nenkinAnnual;
    const sl3 = siLine(r3.sys);
    A('自営600万: 社会保険料控除の行が出て、国保の実額（＋国民年金）に一致', !!sl3 && sl3.total === si600 && /国民健康保険/.test(sl3.parts));
    const j600 = calculateJumin(null, { salary: 6000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: si600 });
    A('自営600万: 住民税カードが国保実額を控除した直算と一致', num(find(r3.heads, '住民税')[1]) === j600.total);
    // ふるさと納税の上限: 令和9年度分で組み立て直す。手計算（2026-10-11・国民年金 17,920円×12=215,040 あり）:
    //   社保 601,018（市原市 国保・介護分あり）+215,040=816,058／給与所得 436万／課税総所得 4,360,000−816,058−430,000=3,113,942→3,113,000／
    //   所得割 311,300−2,500=308,800／調整額 5万+(104万−48万)=61万 → 基準額 2,503,000 → 79.79% → 上限 floor(61,760×100000/79790)+2,000=79,403 → 表示 79,000。
    //   （国民年金データが無い場合: 社保 601,018／課税 3,328,000／所得割 330,300／基準 2,718,000 → 84,792 → 84,000）
    const j27 = calculateJumin(null, { salary: 6000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: si600, fiscalYear: 2027, taxCredits: 0 });
    const fz = F.calcFurusatoLimit({ incomeLevy: j27.incomeLevy, taxableIncome: j27.taxableIncome, humanDeductionDiff: j27.humanDeductionDiff, shotokuBasicDeduction: F.furusatoShotokuBasicDeduction(j27.totalIncome, kiso26) }, fzData);
    const fzHead = find(r3.heads, 'ふるさと納税の上限（目安）');
    A('自営600万: ふるさと納税の上限カードが出る', !!fzHead);
    A(`自営600万: ふるさと納税の上限が国保実額ベースの直算と一致（${Math.floor(fz.limit / 1000) * 1000}円＝手計算 ${nenkinAnnual ? '79,000' : '84,000'}円）`,
      !!fzHead && num(fzHead[1]) === Math.floor(fz.limit / 1000) * 1000 && num(fzHead[1]) === (nenkinAnnual ? 79000 : 84000));
    A('自営600万: ふるさと納税の上限は年間負担の合計に入らない', num(r3.grand) === r3.heads.filter(h => h[0] !== 'ふるさと納税の上限（目安）').reduce((a, h) => a + num(h[1]), 0));

    // (b) 年金のみ250万・67歳・自営: 控除 = 国保（介護分なし）＋介護1号。国民年金は60歳以上なので入らない
    const pInc = calcPensionIncome(2500000, 67);
    const kok67 = calculateKokuho({ income: pInc, family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1, fixedAssetTax: 0 }, kd).total;
    const jPre = calculateJumin(null, { salary: 0, pension: 2500000, otherIncome: 0, age: 67, socialInsurance: kok67 });
    const kg67 = calculateKaigo(kgd, { pensionIncome: 2500000, totalIncome: pInc, sumIncome: 2500000, isSelfTaxable: !!jPre.isTaxable, isHouseholdAllNonTaxable: !jPre.isTaxable });
    const si67 = kok67 + kg67.annual;
    const sl7 = siLine(r7.sys);
    A('年金250万・67歳: 社会保険料控除 = 国保＋介護1号（直算と一致・旧実装は0）', !!sl7 && sl7.total === si67 && /国民健康保険/.test(sl7.parts) && /介護保険/.test(sl7.parts) && !/国民年金/.test(sl7.parts));
    const j67 = calculateJumin(null, { salary: 0, pension: 2500000, otherIncome: 0, age: 67, socialInsurance: si67 });
    A('年金250万・67歳: 住民税カードが国保＋介護を控除した直算と一致', num(find(r7.heads, '住民税')[1]) === j67.total);
    A('年金250万・67歳: 介護保険（第1号）カードが社会保険料控除と同じ額', !!find(r7.heads, '介護保険（第1号）') && num(find(r7.heads, '介護保険（第1号）')[1]) === kg67.annual);
    A('年金250万・67歳: 住民税は控除0の旧実装より少ない', j67.total < calculateJumin(null, { salary: 0, pension: 2500000, otherIncome: 0, age: 67, socialInsurance: 0 }).total);

    // (c) 年金のみ250万・77歳・自営: 控除 = 後期高齢＋介護1号。国保カードは出ない
    const pInc77 = calcPensionIncome(2500000, 77);
    const kk77 = calculateKouki({ totalIncome: pInc77 }, kkd).total;
    const jPre77 = calculateJumin(null, { salary: 0, pension: 2500000, otherIncome: 0, age: 77, socialInsurance: kk77 });
    const kg77 = calculateKaigo(kgd, { pensionIncome: 2500000, totalIncome: pInc77, sumIncome: 2500000, isSelfTaxable: !!jPre77.isTaxable, isHouseholdAllNonTaxable: !jPre77.isTaxable });
    const sl8 = siLine(r8.sys);
    A('年金250万・77歳: 後期高齢者医療カードが実額で出る（直算と一致）', !!find(r8.heads, '後期高齢者医療') && num(find(r8.heads, '後期高齢者医療')[1]) === kk77);
    A('年金250万・77歳: 社会保険料控除 = 後期高齢＋介護1号（直算と一致）', !!sl8 && sl8.total === kk77 + kg77.annual && /後期高齢者医療/.test(sl8.parts));
    A('年金250万・77歳: 国保カードは出ない', !/国民健康保険/.test(r8.sys));
  }
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

  // ── 扶養・配偶者の入力（2026-10-11 X183）: 住民税・所得税・ふるさと納税の上限に同じ家族構成が効く ──
  {
    const F = require('../js/core/furusato.js');
    const Shotoku = require('../js/core/shotoku.js');
    const fzData = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/furusato-2027.json'), 'utf8'));
    const shotokuDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8'));
    const eng = Shotoku.createEngineFromDB(2026, shotokuDb);
    const kiso26 = Shotoku.loadParams(2026, shotokuDb).kisoKojo;
    const { calculateKokuho } = require('./lib/kokuho-loader.cjs');
    const { calcSalaryIncome } = require('../js/core/shared/income.js');
    const kd = JSON.parse(fs.readFileSync(KOKUHO_FIXTURE, 'utf8'));
    const nenkinPath = path.join(ROOT, 'data/national/kokumin-nenkin-2026.json');
    const nenkinAnnual = fs.existsSync(nenkinPath) ? (JSON.parse(fs.readFileSync(nenkinPath, 'utf8')).monthly || 0) * 12 : 0;
    const fam = { spouse: 'general', general: 1, specific: 1 };
    // 住民税の控除: 配偶者33万＋一般扶養33万＋特定扶養45万＝111万。人的控除差: 5万＋5万＋5万＋18万＝33万（第37条第1号イ）
    const famJ = { spouseDeduction: 330000, dependentDeduction: 1110000 - 330000, dependents: 3, humanDeductionDiff: 330000 };
    A('人的控除差: 配偶者＋一般扶養1＋特定扶養1 ＝ 33万（furusato.js の表引き）', F.furusatoHumanDeductionDiff({ selfTotalIncome: 3560000, spouse: 'general', dependentGeneral: 1, dependentSpecific: 1 }, fzData) === 330000);

    // (a) 会社員 500万・40歳・配偶者＋子2（一般1・特定1）
    const f1 = await run({ salary: 5000000, age: 40, employment: 'kaishain', family: fam });
    const si1 = expectShahoAnnual(5000000, 0, 40);
    const j1 = calculateJumin(null, Object.assign({ salary: 5000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: si1 }, famJ));
    A('会社員500万・家族あり: 住民税カードが控除込みの直算と一致', num(find(f1.heads, '住民税')[1]) === j1.total);
    const j0 = calculateJumin(null, { salary: 5000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: si1 });
    A('会社員500万・家族あり: 住民税は家族なしより少ない', j1.total < j0.total);
    const st1 = eng.calcShotokuzei({ salary: 5000000, socialInsurance: si1, spouse: { income: 0, age70plus: false }, dependents: { general: 1, specific: 1, elderly: 0, elderlyCoRes: 0 } });
    A('会社員500万・家族あり: 所得税カードが配偶者・扶養控除込みの直算と一致', num(find(f1.heads, '所得税')[1]) === Math.round(st1.annualTax));
    const j27 = calculateJumin(null, Object.assign({ salary: 5000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: si1, fiscalYear: 2027, taxCredits: 0 }, famJ));
    const fz1 = F.calcFurusatoLimit({ incomeLevy: j27.incomeLevy, taxableIncome: j27.taxableIncome, humanDeductionDiff: j27.humanDeductionDiff, shotokuBasicDeduction: F.furusatoShotokuBasicDeduction(j27.totalIncome, kiso26) }, fzData);
    const fzHead1 = find(f1.heads, 'ふるさと納税の上限（目安）');
    A('会社員500万・家族あり: ふるさと納税の上限が家族込みの直算と一致', !!fzHead1 && num(fzHead1[1]) === Math.floor(fz1.limit / 1000) * 1000);
    A('会社員500万・家族あり: 控除内訳の行に配偶者・扶養控除 1,110,000 円と人的控除差 330,000 円が出る', /配偶者・扶養控除（住民税）: 1,110,000 円（人的控除差 330,000 円）/.test(f1.sys));

    // (b) 自営 500万・40歳・同じ家族: 社会保険料控除は国保（家族入力は国保の世帯人数とは別）＋国民年金
    const f2 = await run({ salary: 5000000, age: 40, employment: 'jiei', family: fam });
    const kok = calculateKokuho({ income: calcSalaryIncome(5000000), family: 1, preschool: 0, under18: 0, care: 1, salaryPensionCount: 1, fixedAssetTax: 0 }, kd).total;
    const j2 = calculateJumin(null, Object.assign({ salary: 5000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: kok + nenkinAnnual }, famJ));
    A('自営500万・家族あり: 住民税カードが国保実額＋家族控除の直算と一致', num(find(f2.heads, '住民税')[1]) === j2.total);

    // (c) 家族入力を戻すと従来どおり（r3 と同じ値）
    const f3 = await run({ salary: 6000000, age: 40, employment: 'jiei' });
    A('家族入力なしに戻すと自営600万の住民税は従来値', num(find(f3.heads, '住民税')[1]) === num(find(r3.heads, '住民税')[1]));
  }

  // ── 配偶者の収入入力（2026-10-12 X184）: 配偶者控除／配偶者特別控除を所得から自動判定し、住民税・所得税・保育料・奨学金に効く ──
  //   期待値（住民税の控除額）は地方税法 第34条第1項第10号・第10号の2 を手で当てたもの（検証メモ X184）。
  //   給与→所得（令和8年度分）: 190万以下は 給与−65万。190万超360万以下は 給与×0.7−8万（切捨て）。
  {
    const Shotoku = require('../js/core/shotoku.js');
    const { calcSalaryIncome } = require('../js/core/shared/income.js');
    const shotokuDb = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8'));
    const eng = Shotoku.createEngineFromDB(2026, shotokuDb);
    const si5 = expectShahoAnnual(5000000, 0, 40);
    const spLine = (sys) => { const m = sys.match(/配偶者の給与年収 ([\d,]+) 円（合計所得 ([\d,]+) 円）＝([^<\d]+?)(?: ([\d,]+) 円)?<\/div>/); return m ? { salary: num(m[1]), income: num(m[2]), kind: m[3].trim(), ded: m[4] ? num(m[4]) : 0 } : null; };
    // [配偶者の給与年収, 期待する合計所得, 期待する住民税の控除額, 区分の表示]
    const cases = [
      [1_230_000,   580_000, 330_000, '配偶者控除'],       // 58万以下＝配偶者控除
      [1_230_001,   580_001, 330_000, '配偶者特別控除'],   // 58万超＝特別控除 (1)
      [1_650_000, 1_000_000, 330_000, '配偶者特別控除'],   // (1) の上限
      [1_650_001, 1_000_001, 310_000, '配偶者特別控除'],   // (2) 38万−7万
      [1_700_000, 1_050_000, 310_000, '配偶者特別控除'],
      [1_700_001, 1_050_001, 260_000, '配偶者特別控除'],
      [1_971_429, 1_300_000,  60_000, '配偶者特別控除'],   // (2) の上限（給与×0.7−8万）
      [1_971_430, 1_300_001,  30_000, '配偶者特別控除'],   // (3)
      [2_014_288, 1_330_001,       0, '配偶者控除なし'],   // 133万超＝対象外
    ];
    for (const [spSal, spInc, ded, kindLabel] of cases) {
      A(`配偶者給与 ${spSal.toLocaleString()}: 住民税の給与所得が ${spInc.toLocaleString()}`, calcSalaryIncome(spSal) === spInc);
      const f = await run({ salary: 5000000, age: 40, employment: 'kaishain', family: { spouseSalary: spSal } });
      const jExp = calculateJumin(null, { salary: 5000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: si5,
        spouseDeduction: ded, dependentDeduction: 0, dependents: (kindLabel === '配偶者控除' ? 1 : 0), humanDeductionDiff: (kindLabel === '配偶者控除' ? 100000 : 50000) });
      A(`配偶者給与 ${spSal.toLocaleString()}（所得 ${spInc.toLocaleString()}）: 住民税カードが控除 ${ded.toLocaleString()} 円の直算と一致`, num(find(f.heads, '住民税')[1]) === jExp.total);
      const sl = spLine(f.sys);
      A(`配偶者給与 ${spSal.toLocaleString()}: 内訳の行に「${kindLabel}」${ded ? ded.toLocaleString() + ' 円' : ''}`, !!sl && sl.income === spInc && sl.kind === kindLabel && sl.ded === ded);
      const stExp = eng.calcShotokuzei({ salary: 5000000, socialInsurance: si5, spouse: { income: eng.kyuyoShotoku(spSal), age70plus: false }, dependents: { general: 0, specific: 0, elderly: 0, elderlyCoRes: 0 } });
      A(`配偶者給与 ${spSal.toLocaleString()}: 所得税カードが配偶者（特別）控除込みの直算と一致`, num(find(f.heads, '所得税')[1]) === Math.round(stExp.annualTax));
    }
    // 配偶者控除の選択「受ける」のまま収入なし＝従来どおり所得0の控除対象配偶者
    const g0 = await run({ salary: 5000000, age: 40, employment: 'kaishain', family: { spouse: 'general' } });
    const g0Exp = calculateJumin(null, { salary: 5000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: si5, spouseDeduction: 330000, dependentDeduction: 0, dependents: 1, humanDeductionDiff: 100000 });
    A('配偶者「受ける」・収入なし: 従来どおり配偶者控除 33万', num(find(g0.heads, '住民税')[1]) === g0Exp.total);
    // 「受けない」のまま配偶者の給与だけ入れても、配偶者ありとして判定する
    const g1 = await run({ salary: 5000000, age: 40, employment: 'kaishain', family: { spouse: 'none', spouseSalary: 1650001 } });
    const g1Exp = calculateJumin(null, { salary: 5000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: si5, spouseDeduction: 310000, dependentDeduction: 0, dependents: 0, humanDeductionDiff: 50000 });
    A('配偶者「受けない」＋給与 1,650,001: 給与から特別控除 31万と判定', num(find(g1.heads, '住民税')[1]) === g1Exp.total);
    // 本人の合計所得 900万超: 2/3（1万未満切上げ）。給与 1,200万 → 所得 1,005万 は 1,000万超で対象外。給与 1,100万 → 所得 905万 → 2/3
    A('給与1,100万の合計所得は 905万（900万超950万以下）', calcSalaryIncome(11000000) === 9050000);
    const si11 = expectShahoAnnual(11000000, 0, 40);
    const g2 = await run({ salary: 11000000, age: 40, employment: 'kaishain', family: { spouseSalary: 1650001 } });
    const g2Exp = calculateJumin(null, { salary: 11000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: si11, spouseDeduction: 210000, dependentDeduction: 0, dependents: 0, humanDeductionDiff: 50000 });
    A('本人 給与1,100万＋配偶者所得 100万1円: 特別控除は 2/3 の 21万（31万×2/3＝20.67万→切上げ）', num(find(g2.heads, '住民税')[1]) === g2Exp.total);

    // 保育料: 保護者2の欄が空なら「扶養・配偶者」の年収を使う（会社員＝shaho 実額）
    const optIn2 = w.document.getElementById('hoikuOptIn');
    if (optIn2) optIn2.checked = true;
    setVal('hoikuSpouse', '');
    const hA = await run({ salary: 6000000, age: 40, employment: 'kaishain', family: { spouseSalary: 3000000 } });
    setVal('hoikuSpouse', '3000000');
    const hB = await run({ salary: 6000000, age: 40, employment: 'kaishain' });
    setVal('hoikuSpouse', '');
    if (optIn2) optIn2.checked = false;
    const hCardA = find(hA.heads, '保育料（認可・0〜2歳）'), hCardB = find(hB.heads, '保育料（認可・0〜2歳）');
    A('保育料: 家族欄の配偶者給与 300万は、保護者2の欄に 300万を入れたのと同じ月額', !!hCardA && !!hCardB && num(hCardA[1]) === num(hCardB[1]));
    A('保育料: 配偶者給与 300万を入れると配偶者なしより高いか同じ（指数が増える向き）', !!hCardA && num(hCardA[1]) >= num(hoiku1[1]));

    // 奨学金: 生計維持者2の欄が空なら「扶養・配偶者」の年収を使う
    if (sgOptIn) sgOptIn.checked = true;
    setVal('shogakuSpouse', ''); setSel('shogakuChildren', '2'); setSel('shogakuLevel', '大学'); setSel('shogakuSetti', '私立'); setSel('shogakuAttend', '自宅');
    const sA = await run({ salary: 6000000, age: 40, employment: 'kaishain', family: { spouseSalary: 3000000 } });
    if (sgOptIn) sgOptIn.checked = false;
    const sgA = find(sA.heads, sgName);
    A(`奨学金: 家族欄の配偶者給与 300万で共働き（600万＋300万・子2）と同じ区分（${sgShortOf(e4)}）`, !!sgA && sgA[1] === sgShortOf(e4));
  }

  // ── 配偶者が自営・社会保険なし（2026-10-13・X184 の残り）: 国保は世帯で計算、配偶者の控除は国民年金のみ ──
  //   期待値は国保エンジン（市原フィクスチャ）の直算。旧実装は配偶者の保険料を給与×14.4% で置き、本人の国保に配偶者所得を入れていなかった。
  {
    const { calculateKokuho } = require('./lib/kokuho-loader.cjs');
    const { calcSalaryIncome } = require('../js/core/shared/income.js');
    const kd = JSON.parse(fs.readFileSync(KOKUHO_FIXTURE, 'utf8'));
    const nenkinPath = path.join(ROOT, 'data/national/kokumin-nenkin-2026.json');
    const nenkinAnnual = fs.existsSync(nenkinPath) ? (JSON.parse(fs.readFileSync(nenkinPath, 'utf8')).monthly || 0) * 12 : 0;
    const spInc = calcSalaryIncome(2000000);
    // (A) 本人 自営500万・40歳 ＋ 配偶者 自営 給与200万・45歳: 同じ世帯の国保（所得を1人ずつ基礎控除・介護分2人・均等割2人）
    const a0 = await run({ salary: 5000000, age: 40, employment: 'jiei' });
    const a1 = await run({ salary: 5000000, age: 40, employment: 'jiei', family: { spouseSalary: 2000000, spouseWork: 'jiei', spouseAge: 45 } });
    const kA = calculateKokuho({ income: calcSalaryIncome(5000000) + spInc, members: [{ income: calcSalaryIncome(5000000), careTarget: true }, { income: spInc, careTarget: true }],
      family: 2, preschool: 0, under18: 0, care: 2, salaryPensionCount: 2, fixedAssetTax: 0 }, kd);
    const kA0 = calculateKokuho({ income: calcSalaryIncome(5000000), family: 1, preschool: 0, under18: 0, care: 1, salaryPensionCount: 1, fixedAssetTax: 0 }, kd);
    const cardA = find(a1.heads, '国民健康保険（配偶者の所得を含む世帯分）');
    A('自営＋自営配偶者: 国保カードが「配偶者の所得を含む世帯分」の見出しで、members 直算と一致', !!cardA && num(cardA[1]) === kA.total);
    A('自営＋自営配偶者: 国保は配偶者なしより高い（所得合算・均等割2人）', kA.total > kA0.total && num(cardA[1]) > num(find(a0.heads, '国民健康保険')[1]));
    // 配偶者の給与所得 132万（130万超133万以下）＝配偶者特別控除 3万（第34条第1項第10号の2 (3)）。人的控除差なし
    const jA = calculateJumin(null, { salary: 5000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: kA.total + nenkinAnnual,
      spouseDeduction: 30000, dependentDeduction: 0, dependents: 0, humanDeductionDiff: 50000 });
    A('自営＋自営配偶者（配偶者所得132万＝特別控除3万）: 本人の住民税は世帯分の国保＋本人の国民年金を控除した直算と一致', num(find(a1.heads, '住民税')[1]) === jA.total);
    const nkSp = find(a1.heads, '国民年金（配偶者1人分）');
    A('自営＋自営配偶者: 「国民年金（配偶者1人分）」カードが出て額が月額×12', nenkinAnnual > 0 ? (!!nkSp && num(nkSp[1]) === nenkinAnnual) : !nkSp);
    // 合計の差 = 国保の差 ＋ 配偶者の国民年金 ＋ 本人の住民税の差 ＋ 本人の所得税の差（控除が増えて税が減る分）
    {
      const Shotoku2 = require('../js/core/shotoku.js');
      const eng2 = Shotoku2.createEngineFromDB(2026, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8')));
      const j0 = calculateJumin(null, { salary: 5000000, pension: 0, otherIncome: 0, age: 40, socialInsurance: kA0.total + nenkinAnnual, spouseDeduction: 0, dependentDeduction: 0, dependents: 0, humanDeductionDiff: 50000 }).total;
      const st0 = Math.round(eng2.calcShotokuzei({ salary: 5000000, socialInsurance: kA0.total + nenkinAnnual, spouse: null, dependents: { general: 0, specific: 0, elderly: 0, elderlyCoRes: 0 } }).annualTax);
      const st1 = Math.round(eng2.calcShotokuzei({ salary: 5000000, socialInsurance: kA.total + nenkinAnnual, spouse: { income: eng2.kyuyoShotoku(2000000), age70plus: false }, dependents: { general: 0, specific: 0, elderly: 0, elderlyCoRes: 0 } }).annualTax);
      // 配偶者の所得税（控除は配偶者の国民年金のみ。世帯分の国保は本人側）
      const stSpA = Math.round(eng2.calcShotokuzei({ salary: 2000000, socialInsurance: nenkinAnnual, spouse: null, dependents: { general: 0, specific: 0, elderly: 0, elderlyCoRes: 0 } }).annualTax);
      const expDiff = (kA.total - kA0.total) + nenkinAnnual + (jA.total - j0) + (st1 - st0) + stSpA;
      A('自営＋自営配偶者: 合計の増分 = 国保の差 ＋ 配偶者の国民年金 ＋ 住民税の差 ＋ 所得税の差 ＋ 配偶者の所得税', (num(a1.grand) - num(a0.grand)) === expDiff);
    }
    // (B) 本人 会社員600万・40歳 ＋ 配偶者 自営 給与300万・40歳: 配偶者だけが国保加入者（軽減判定は本人所得を含む）
    const b0 = await run({ salary: 6000000, age: 40, employment: 'kaishain' });
    const b1 = await run({ salary: 6000000, age: 40, employment: 'kaishain', family: { spouseSalary: 3000000, spouseWork: 'jiei', spouseAge: 40 } });
    const spInc3 = calcSalaryIncome(3000000);
    const kB = calculateKokuho({ income: spInc3, members: [{ income: spInc3, careTarget: true }], family: 1, preschool: 0, under18: 0, care: 1, salaryPensionCount: 1, fixedAssetTax: 0,
      reductionJudgmentIncome: spInc3 + calcSalaryIncome(6000000) }, kd);
    const cardB = find(b1.heads, '国民健康保険（配偶者）');
    A('会社員＋自営配偶者: 「国民健康保険（配偶者）」カードが配偶者単独の直算と一致', !!cardB && num(cardB[1]) === kB.total);
    A('会社員＋自営配偶者: 本人の国保カードは出ない', !find(b1.heads, '国民健康保険') && !find(b1.heads, '国民健康保険（配偶者の所得を含む世帯分）'));
    A('会社員＋自営配偶者: 本人の社会保険（会社員）は変わらない', num(find(b1.heads, '社会保険（会社員）')[1]) === num(find(b0.heads, '社会保険（会社員）')[1]));
    const nkSpB = find(b1.heads, '国民年金（配偶者1人分）');
    A('会社員＋自営配偶者: 国民年金（配偶者1人分）カードが出る', nenkinAnnual > 0 ? (!!nkSpB && num(nkSpB[1]) === nenkinAnnual) : !nkSpB);
    // 配偶者所得 202万（133万超）なので配偶者控除なし＝本人の住民税・所得税は配偶者なしと同じ。合計の差は配偶者の国保＋国民年金のみ
    {
      const Shotoku4 = require('../js/core/shotoku.js');
      const eng4 = Shotoku4.createEngineFromDB(2026, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8')));
      const stSpB = Math.round(eng4.calcShotokuzei({ salary: 3000000, socialInsurance: kB.total + nenkinAnnual, spouse: null, dependents: { general: 0, specific: 0, elderly: 0, elderlyCoRes: 0 } }).annualTax);
      A('会社員＋自営配偶者: 合計の増分 = 配偶者の国保 ＋ 配偶者の国民年金 ＋ 配偶者の所得税', num(b1.grand) - num(b0.grand) === kB.total + nenkinAnnual + stSpB);
    }
    // (C) 配偶者が会社員・パート（従来どおり shaho 実額・国保カードなし）
    const c1 = await run({ salary: 5000000, age: 40, employment: 'jiei', family: { spouseSalary: 2000000, spouseWork: 'kaishain', spouseAge: 45 } });
    A('自営＋会社員配偶者: 本人の国保は配偶者なしと同じ（配偶者は社保）', num(find(c1.heads, '国民健康保険')[1]) === kA0.total);
    A('自営＋会社員配偶者: 配偶者の国保・国民年金カードは出ない', !find(c1.heads, '国民健康保険（配偶者）') && !find(c1.heads, '国民年金（配偶者1人分）'));
    // (D) 保育料・奨学金に配偶者（自営）の実額が流れる: 保護者2の社保控除が 14.4% 概算より大きい/小さいに関わらず、直算の月額と一致
    const optIn3 = w.document.getElementById('hoikuOptIn'); if (optIn3) optIn3.checked = true;
    setVal('hoikuSpouse', '');
    const d1 = await run({ salary: 6000000, age: 40, employment: 'kaishain', family: { spouseSalary: 3000000, spouseWork: 'jiei', spouseAge: 40 } });
    if (optIn3) optIn3.checked = false;
    const hd = find(d1.heads, '保育料（認可・0〜2歳）');
    A('会社員＋自営配偶者: 保育料カードが出る（配偶者の社保控除＝国保＋国民年金で判定）', !!hd && num(hd[1]) > 0);
  }

  // ── 配偶者 75歳以上は後期高齢者医療／配偶者の所得税カード（2026-10-13） ──
  {
    const { calculateKokuho } = require('./lib/kokuho-loader.cjs');
    const { calculateKouki } = require('../js/core/kouki.js');
    const { calcSalaryIncome } = require('../js/core/shared/income.js');
    const Shotoku3 = require('../js/core/shotoku.js');
    const eng3 = Shotoku3.createEngineFromDB(2026, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8')));
    const kd = JSON.parse(fs.readFileSync(KOKUHO_FIXTURE, 'utf8'));
    const kkd = JSON.parse(fs.readFileSync(KOUKI_FIXTURE, 'utf8'));
    const nenkinPath = path.join(ROOT, 'data/national/kokumin-nenkin-2026.json');
    const nenkinAnnual = fs.existsSync(nenkinPath) ? (JSON.parse(fs.readFileSync(nenkinPath, 'utf8')).monthly || 0) * 12 : 0;
    // (E) 本人 自営500万・50歳 ＋ 配偶者 自営 給与200万・78歳: 配偶者は後期（国保に合算しない・国民年金なし）
    const e1 = await run({ salary: 5000000, age: 50, employment: 'jiei', family: { spouseSalary: 2000000, spouseWork: 'jiei', spouseAge: 78 } });
    const spInc = calcSalaryIncome(2000000);
    const kSelf = calculateKokuho({ income: calcSalaryIncome(5000000), family: 1, preschool: 0, under18: 0, care: 1, salaryPensionCount: 1, fixedAssetTax: 0 }, kd).total;
    const kkSp = calculateKouki({ totalIncome: spInc }, kkd).total;
    A('自営＋配偶者78歳: 本人の国保は配偶者を含まない1人分（見出しも「国民健康保険」）', !!find(e1.heads, '国民健康保険') && num(find(e1.heads, '国民健康保険')[1]) === kSelf);
    A('自営＋配偶者78歳: 「後期高齢者医療（配偶者）」カードが後期エンジン直算と一致', !!find(e1.heads, '後期高齢者医療（配偶者）') && num(find(e1.heads, '後期高齢者医療（配偶者）')[1]) === kkSp);
    A('自営＋配偶者78歳: 国民年金（配偶者）・国保（配偶者）カードは出ない', !find(e1.heads, '国民年金（配偶者1人分）') && !find(e1.heads, '国民健康保険（配偶者）'));
    // (F) 会社員600万 ＋ 配偶者 会社員300万・40歳: 所得税（配偶者）= 配偶者の給与と shaho 実額
    const f1 = await run({ salary: 6000000, age: 40, employment: 'kaishain', family: { spouseSalary: 3000000, spouseWork: 'kaishain', spouseAge: 40 } });
    const siSp = expectShahoAnnual(3000000, 0, 40);
    const stSpK = Math.round(eng3.calcShotokuzei({ salary: 3000000, socialInsurance: siSp, spouse: null, dependents: { general: 0, specific: 0, elderly: 0, elderlyCoRes: 0 } }).annualTax);
    A('会社員＋会社員配偶者300万: 「所得税（配偶者）」カードが shaho 実額控除の直算と一致', !!find(f1.heads, '所得税（配偶者）') && num(find(f1.heads, '所得税（配偶者）')[1]) === stSpK);
    // (G) 会社員600万 ＋ 配偶者 自営300万・40歳: 所得税（配偶者）= 配偶者単独の国保＋国民年金を控除
    const g1 = await run({ salary: 6000000, age: 40, employment: 'kaishain', family: { spouseSalary: 3000000, spouseWork: 'jiei', spouseAge: 40 } });
    const spInc3 = calcSalaryIncome(3000000);
    const kB = calculateKokuho({ income: spInc3, members: [{ income: spInc3, careTarget: true }], family: 1, preschool: 0, under18: 0, care: 1, salaryPensionCount: 1, fixedAssetTax: 0, reductionJudgmentIncome: spInc3 + calcSalaryIncome(6000000) }, kd).total;
    const stSpJ = Math.round(eng3.calcShotokuzei({ salary: 3000000, socialInsurance: kB + nenkinAnnual, spouse: null, dependents: { general: 0, specific: 0, elderly: 0, elderlyCoRes: 0 } }).annualTax);
    A('会社員＋自営配偶者300万: 「所得税（配偶者）」が国保＋国民年金控除の直算と一致', !!find(g1.heads, '所得税（配偶者）') && num(find(g1.heads, '所得税（配偶者）')[1]) === stSpJ);
    A('会社員＋自営配偶者300万: 合計の増分 = 配偶者の国保 ＋ 国民年金 ＋ 配偶者の所得税', num(g1.grand) - num((await run({ salary: 6000000, age: 40, employment: 'kaishain' })).grand) === kB + nenkinAnnual + stSpJ);
    // (H) 配偶者給与 150万（所得税 0）: カードは出るが 0 円
    const h1 = await run({ salary: 6000000, age: 40, employment: 'kaishain', family: { spouseSalary: 1500000, spouseWork: 'kaishain', spouseAge: 40 } });
    A('会社員＋パート配偶者150万: 所得税（配偶者）は 0 円', !!find(h1.heads, '所得税（配偶者）') && num(find(h1.heads, '所得税（配偶者）')[1]) === 0);
    A('配偶者なしでは所得税（配偶者）カードは出ない', !find(r1.heads, '所得税（配偶者）'));
  }

  A('JSランタイムエラーなし', errs.length === 0);
  if (errs.length) console.log('  JSエラー:', errs);
  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exitCode = fail > 0 ? 1 : 0;
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
