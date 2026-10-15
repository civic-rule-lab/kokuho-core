/**
 * test-ikukyu-dom.cjs — ふるさと納税 育休・産休の年モード（生成物 seido-ikukyu.html）を jsdom で検証
 *
 * 1. 今年／通常の年 の給与収入・社会保険料控除・所得割・上限額が、各エンジン（shaho・jumin・furusato）を Node から直接呼んだ値と一致
 * 2. 手計算の不変条件: 今年の給与 ＝ 月給×支給月数＋賞与、通常の年 ＝ 月給×12＋賞与、
 *    社保控除 ＝ 月々の保険料×免除されない月数 ＋ 雇用保険×支給月数 ＋ 賞与分、上限は今年＜通常の年
 * 3. 賞与の免除チェックで控除が賞与分だけ減る／給与収入の上書き／給与ゼロ・12か月免除で所得割なしの案内
 * 4. Enter の順: 都道府県 → 年齢 → 月給 → 賞与 → 支給月数 → 免除月数 → 上書き → 配偶者 → 扶養×4 → 本人（終了）
 * 実行: node scripts/test-ikukyu-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const Shaho = require(path.join(ROOT, 'js/core/shaho.js'));
const { calculateJumin } = require(path.join(ROOT, 'js/core/jumin.js'));
const { calcSalaryIncome } = require(path.join(ROOT, 'js/core/shared/income.js'));
const F = require(path.join(ROOT, 'js/core/furusato.js'));
const Shotoku = require(path.join(ROOT, 'js/core/shotoku.js'));
const fz = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/furusato-2027.json'), 'utf8'));
const kiso = Shotoku.loadParams(2026, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8'))).kisoKojo.map(([u, a]) => [Number.isFinite(u) ? u : null, a]);
const shahoData = { kenpo: 'kenpo-2026', kosei: 'kosei-nenkin', koyo: 'koyo-2026', standard: 'standard-monthly' };
for (const k of Object.keys(shahoData)) shahoData[k] = JSON.parse(fs.readFileSync(path.join(ROOT, `data/shaho/${shahoData[k]}.json`), 'utf8'));

let html = fs.readFileSync(path.join(ROOT, 'seido-ikukyu.html'), 'utf8');
for (const f of ['shared/ui-input', 'shared/income', 'jumin', 'shaho', 'furusato'])
  html = html.replace(new RegExp(`<script src="/js/core/${f.replace('/', '\\/')}\\.js\\?v=[0-9a-f]+"><\\/script>`), () => '<script>' + fs.readFileSync(path.join(ROOT, `js/core/${f}.js`), 'utf8') + '</script>');
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://seido-keisan.jp/furusato/ikukyu/',
  beforeParse(w) { w.fetch = (url) => { const m = String(url).match(/\/data\/shaho\/([a-z0-9-]+)\.json$/); const p = m && path.join(ROOT, `data/shaho/${m[1]}.json`);
    return Promise.resolve(p && fs.existsSync(p) ? { ok: true, status: 200, json: () => JSON.parse(fs.readFileSync(p, 'utf8')) } : { ok: false, status: 404, json: () => ({}) }); }; } });
const w = dom.window, d = w.document;
Object.defineProperty(w.HTMLElement.prototype, 'offsetParent', { get() { for (let n = this; n; n = n.parentElement) if (n.style && n.style.display === 'none') return null; return this.parentNode; } });
let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
const set = (id, v) => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); e.dispatchEvent(new w.Event('blur')); };
const sel = (id, v) => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
const res = () => d.getElementById('result').textContent.replace(/\s+/g, ' ');
const cell = (label) => { const r = [...d.querySelectorAll('#result .result-row')].find(x => x.querySelector('.result-label').textContent.startsWith(label)); return r ? r.querySelector('.amount').textContent.trim() : null; };
const grab = (label) => { const t = cell(label); const m = t && t.match(/([0-9,]+) 円/); return m ? Number(m[1].replace(/,/g, '')) : null; };
const boxAmt = (i) => { const b = d.querySelectorAll('#result .cmp .box')[i]; const m = b && b.querySelector('.amt').textContent.match(/([0-9,]+) 円/); return m ? Number(m[1].replace(/,/g, '')) : null; };
const boxSub = (i, label) => { const b = d.querySelectorAll('#result .cmp .box')[i]; const m = b && b.querySelector('.sub').textContent.match(new RegExp(label + ' ([0-9,]+) 円')); return m ? Number(m[1].replace(/,/g, '')) : null; };
const wait = ms => new Promise(r => setTimeout(r, ms));
function enter(id) { const el = d.getElementById(id); el.focus(); el.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); return d.activeElement.id; }
function ref(inp) {
  const sin = { monthlySalary: inp.monthly, targetMonth: '2026-07', prefSlug: inp.pref, age: inp.age, koyoCategory: 'ippan' };
  if (inp.bonus > 0) { sin.bonus = inp.bonus; sin.bonusYearToDate = 0; }
  const r = Shaho.calculateShaho(sin, shahoData);
  const mPrem = r.health.employee + r.care.employee + r.shienkin.employee + r.koseiNenkin.employee, mKoyo = r.koyo.applies ? r.koyo.employee : 0;
  const bPrem = r.bonus ? r.bonus.health.employee + r.bonus.care.employee + r.bonus.shienkin.employee + r.bonus.koseiNenkin.employee : 0;
  const bKoyo = r.bonus && r.bonus.koyo && r.bonus.koyo.applies ? r.bonus.koyo.employee : 0;
  const sc = (salary, pm, km, bx) => {
    const si = Math.round(mPrem * pm + mKoyo * km + (bx ? 0 : bPrem) + bKoyo);
    const hd = F.furusatoHumanDeductionDiff({ selfTotalIncome: calcSalaryIncome(salary, 2027), spouse: 'none', dependentGeneral: 0, dependentSpecific: 0, dependentElderly: 0, dependentCohabitingParent: 0, selfDisability: 'none', singleParent: 'none', workingStudent: false }, fz);
    const rj = calculateJumin(null, { salary, pension: 0, age: inp.age, socialInsurance: si, spouseDeduction: 0, dependentDeduction: 0, dependents: 0, humanDeductionDiff: hd, fiscalYear: 2027, taxCredits: 0, kyuchi: 1 });
    const lim = F.calcFurusatoLimit({ incomeLevy: rj.incomeLevy, taxableIncome: rj.taxableIncome, humanDeductionDiff: rj.humanDeductionDiff, shotokuBasicDeduction: F.furusatoShotokuBasicDeduction(rj.totalIncome, kiso) }, fz);
    return { salary, si, rj, lim };
  };
  return { mPrem, mKoyo, bPrem, bKoyo, now: sc(inp.monthly * inp.paid + inp.bonus, 12 - inp.exempt, inp.paid, inp.bonusExempt), normal: sc(inp.monthly * 12 + inp.bonus, 12, 12, false) };
}

(async () => {
  if (d.readyState === 'loading') await new Promise(r => d.addEventListener('DOMContentLoaded', r));
  A('都道府県の選択肢が 47（東京都が既定）', d.getElementById('pref').options.length === 47 && d.getElementById('pref').value === 'tokyo');
  A('「この年に起きること」が制度値から描画される（非課税 2 件・免除）', d.querySelectorAll('#rules .jt-card').length === 2 && /第61条の6第5項/.test(d.getElementById('rules').textContent) && /14日以上/.test(d.getElementById('rules').textContent));
  A('Enter: 都道府県 → 年齢 → 月給 → 賞与 → 支給月数 → 免除月数 → 上書き', enter('pref') === 'age' && enter('age') === 'monthly' && enter('monthly') === 'bonus' && enter('bonus') === 'paidMonths' && enter('paidMonths') === 'exemptMonths' && enter('exemptMonths') === 'salaryOverride');
  A('Enter: 上書き → 配偶者 → 扶養 → … → 本人（終了）', enter('salaryOverride') === 'spouse' && enter('spouse') === 'depGeneral' && enter('depParent') === 'selfStatus' && enter('selfStatus') === 'selfStatus');

  // 基本: 東京・32歳・月給 30 万・賞与 60 万・支給 4 か月・免除 8 か月
  set('age', '32'); set('monthly', '３００，０００'); set('bonus', '600000'); set('paidMonths', '4'); set('exemptMonths', '8');
  await w.calcIkukyu(); await wait(80);
  const r1 = ref({ pref: 'tokyo', age: 32, monthly: 300000, bonus: 600000, paid: 4, exempt: 8, bonusExempt: false });
  A(`今年の給与 ${boxSub(0, '給与収入')} ＝ 30万×4＋60万 ＝ 1,800,000`, boxSub(0, '給与収入') === 1800000);
  A(`通常の年の給与 ${boxSub(1, '給与収入')} ＝ 30万×12＋60万 ＝ 4,200,000`, boxSub(1, '給与収入') === 4200000);
  A(`今年の社保控除 ${boxSub(0, '社会保険料控除')} ＝ 月々×4＋雇用×4＋賞与分 ＝ ${r1.now.si}`, boxSub(0, '社会保険料控除') === r1.now.si);
  A(`通常の年の社保控除 ${boxSub(1, '社会保険料控除')} ＝ 月々×12＋雇用×12＋賞与分 ＝ ${r1.normal.si}`, boxSub(1, '社会保険料控除') === r1.normal.si);
  A(`今年の所得割 ${boxSub(0, '住民税 所得割')} が住民税エンジンと一致 ${r1.now.rj.incomeLevy}`, boxSub(0, '住民税 所得割') === r1.now.rj.incomeLevy);
  A(`今年の上限 ${boxAmt(0)} がエンジン ${r1.now.lim.limit} と整合（千円未満切捨て）`, boxAmt(0) === Math.floor(r1.now.lim.limit / 1000) * 1000);
  A(`通常の年の上限 ${boxAmt(1)} がエンジン ${r1.normal.lim.limit} と整合`, boxAmt(1) === Math.floor(r1.normal.lim.limit / 1000) * 1000);
  A('上限は 今年 ＜ 通常の年、差額の警告が出る', boxAmt(0) < boxAmt(1) && /通常の年より 約/.test(res()));
  A('月々の社会保険料（本人負担）＝ 月々の保険料＋雇用保険', grab('月々の社会保険料') === Math.round(r1.mPrem + r1.mKoyo));
  // 賞与の免除
  d.getElementById('bonusExempt').checked = true; await w.calcIkukyu(); await wait(80);
  A(`賞与が免除: 今年の社保控除が賞与分 ${Math.round(r1.bPrem)} だけ減る`, boxSub(0, '社会保険料控除') === r1.now.si - Math.round(r1.bPrem));
  d.getElementById('bonusExempt').checked = false;
  // 給与収入の上書き
  set('salaryOverride', '2,000,000'); await w.calcIkukyu(); await wait(80);
  A('給与収入の上書き 200 万が使われる', boxSub(0, '給与収入') === 2000000);
  set('salaryOverride', '');
  // 給与ゼロ・12 か月免除
  set('paidMonths', '0'); set('exemptMonths', '12'); set('bonus', ''); await w.calcIkukyu(); await wait(80);
  A('給与ゼロ・12か月免除: 所得割なしの案内', /所得割がかからない/.test(res()));
  // 入力不足・範囲外
  set('monthly', ''); await w.calcIkukyu(); await wait(10);
  A('月給が空: 入力を求める', /月給を入れてください/.test(res()));
  set('monthly', '300000'); set('paidMonths', '13'); await w.calcIkukyu(); await wait(10);
  A('月数 13: 範囲の案内', /0〜12/.test(res()));
  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
