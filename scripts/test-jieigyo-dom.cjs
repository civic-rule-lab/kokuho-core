/**
 * test-jieigyo-dom.cjs — ふるさと納税 自営業・国保加入者モード（生成物 seido-jieigyo.html）を jsdom で検証
 *
 * 1. 国保 → 国民年金 → 社会保険料控除 → 住民税（令和9年度分） → 上限額 の連鎖が、各エンジンを Node から直接呼んだ値と一致する
 * 2. 手計算の不変条件: 国民年金 ＝ 月額×12、社会保険料控除 ＝ 国保＋国民年金、
 *    上限額 ＝ floor(所得割 × 20% ÷ 特例控除の割合) ＋ 2,000円（地方税法 第37条の2第11項）
 * 3. 年齢による分岐: 45歳＝介護分あり・国民年金あり／62歳＝介護分あり・国民年金なし／66歳＝両方なし／75歳＝後期の案内
 * 4. 家族入力（配偶者・扶養）で人的控除差が変わり上限が下がる
 * 5. Enter の順: 都道府県 → 市区町村 → 事業所得 → 青色 → 掛金 → 年齢 → 人数 → 配偶者 → 扶養×4 → 本人 → 障害者控除（終了）
 * 6. 青色申告特別控除（事業所得から引く・事業所得が限度）と iDeCo・共済の掛金（所得控除。国保は不変・所得割が下がる）、住宅ローン控除の注意書き
 * 実行: node scripts/test-jieigyo-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const { calculateKokuho } = require(path.join(ROOT, 'js/core/kokuho.js'));
const { calculateJumin } = require(path.join(ROOT, 'js/core/jumin.js'));
const F = require(path.join(ROOT, 'js/core/furusato.js'));
const Shotoku = require(path.join(ROOT, 'js/core/shotoku.js'));
const fz = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/furusato-2027.json'), 'utf8'));
const nenkin = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/kokumin-nenkin-2026.json'), 'utf8'));
const kiso = Shotoku.loadParams(2026, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8'))).kisoKojo.map(([u, a]) => [Number.isFinite(u) ? u : null, a]);
const KYUCHI = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/reference/kyuchi.json'), 'utf8')).municipalities;

const SLUG = 'shinjuku', PREF = '東京都';
const kokuhoData = JSON.parse(fs.readFileSync(path.join(ROOT, `data/municipalities/${SLUG}/kokuho-2026.json`), 'utf8'));
const juminPath = path.join(ROOT, `data/municipalities/${SLUG}/jumin-2026.json`);
const juminData = fs.existsSync(juminPath) ? JSON.parse(fs.readFileSync(juminPath, 'utf8')) : null;

let html = fs.readFileSync(path.join(ROOT, 'seido-jieigyo.html'), 'utf8');
for (const f of ['shared/ui-input', 'shared/income', 'jumin', 'kokuho', 'furusato'])
  html = html.replace(new RegExp(`<script src="/js/core/${f.replace('/', '\\/')}\\.js\\?v=[0-9a-f]+"><\\/script>`), () => '<script>' + fs.readFileSync(path.join(ROOT, `js/core/${f}.js`), 'utf8') + '</script>');
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://seido-keisan.jp/furusato/jieigyo/',
  beforeParse(w) {
    w.fetch = (url) => {
      const m = String(url).match(/\/data\/municipalities\/([a-z0-9-]+)\/(kokuho|jumin)-2026\.json$/);
      if (!m) return Promise.resolve({ ok: false, status: 404, json: () => ({}) });
      const p = path.join(ROOT, `data/municipalities/${m[1]}/${m[2]}-2026.json`);
      if (!fs.existsSync(p)) return Promise.resolve({ ok: false, status: 404, json: () => ({}) });
      return Promise.resolve({ ok: true, status: 200, json: () => JSON.parse(fs.readFileSync(p, 'utf8')) });
    };
  } });
const w = dom.window, d = w.document;
Object.defineProperty(w.HTMLElement.prototype, 'offsetParent', { get() { for (let n = this; n; n = n.parentElement) if (n.style && n.style.display === 'none') return null; return this.parentNode; } });
let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
const set = (id, v) => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); e.dispatchEvent(new w.Event('blur')); };
const sel = (id, v) => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
const res = () => d.getElementById('result').textContent.replace(/\s+/g, ' ');
const cell = (label) => { const r = [...d.querySelectorAll('#result .result-row')].find(x => x.querySelector('.result-label').textContent.startsWith(label)); return r ? r.querySelector('.amount').textContent.trim() : null; };
const grab = (label) => { const t = cell(label); const m = t && t.match(/([0-9,]+) 円/); return m ? Number(m[1].replace(/,/g, '')) : null; };
const wait = ms => new Promise(r => setTimeout(r, ms));
function enter(id) { const el = d.getElementById(id); el.focus(); el.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); return d.activeElement.id; }
function ref(input) {
  const careN = (input.age >= 40 && input.age < 65) ? 1 : 0;
  const kyosai = input.kyosai || 0;
  const rk = calculateKokuho({ income: input.business, family: input.family, preschool: 0, under18: 0, care: careN, salaryPensionCount: 1, fixedAssetTax: 0 }, kokuhoData);
  const nk = (input.age >= 20 && input.age < 60) ? nenkin.monthly * 12 : 0;
  const si = rk.total + nk;
  const hd = F.furusatoHumanDeductionDiff({ selfTotalIncome: input.business, spouse: input.spouse || 'none', dependentGeneral: input.depG || 0, dependentSpecific: 0, dependentElderly: 0, dependentCohabitingParent: 0, selfDisability: 'none', singleParent: 'none', workingStudent: false }, fz);
  const rj = calculateJumin(juminData, { salary: 0, pension: 0, otherIncome: input.business, age: input.age, socialInsurance: si + kyosai,
    spouseDeduction: input.spouse === 'general' ? 330000 : 0, dependentDeduction: (input.depG || 0) * 330000, dependents: (input.spouse === 'general' ? 1 : 0) + (input.depG || 0),
    humanDeductionDiff: hd, fiscalYear: 2027, taxCredits: 0, kyuchi: Number(KYUCHI[SLUG][0]) });
  const ks = F.furusatoShotokuBasicDeduction(rj.totalIncome, kiso);
  const lim = F.calcFurusatoLimit({ incomeLevy: rj.incomeLevy, taxableIncome: rj.taxableIncome, humanDeductionDiff: rj.humanDeductionDiff, shotokuBasicDeduction: ks }, fz);
  return { rk, nk, si, rj, lim };
}

(async () => {
  if (d.readyState === 'loading') await new Promise(r => d.addEventListener('DOMContentLoaded', r));
  A('都道府県の選択肢が 47', d.getElementById('pref').options.length === 48);
  sel('pref', PREF);
  A('東京都を選ぶと市区町村が入る（新宿区あり）', [...d.getElementById('city').options].some(o => o.value === SLUG));
  sel('city', SLUG);
  A('Enter: 都道府県 → 市区町村 → 事業所得 → 青色 → 掛金 → 年齢 → 人数', enter('pref') === 'city' && enter('city') === 'business' && enter('business') === 'aoiro' && enter('aoiro') === 'kyosai' && enter('kyosai') === 'age' && enter('age') === 'family');
  A('青色申告特別控除の選択肢がデータから入る（0・10万・55万・65万）', [...d.getElementById('aoiro').options].map(o => o.value).join(',') === '0,100000,550000,650000' && d.getElementById('aoiro').value === '0');
  A('Enter: 人数 → 配偶者 → 扶養 → … → 障害者控除（終了）', enter('family') === 'spouse' && enter('spouse') === 'depGeneral' && enter('depParent') === 'selfStatus' && enter('selfStatus') === 'selfDisability' && enter('selfDisability') === 'selfDisability');

  // 基本: 事業所得 300万・45歳・1人
  set('business', '３，０００，０００'); set('age', '45'); set('family', '1');
  await w.calcJieigyo(); await wait(50);
  const r1 = ref({ business: 3000000, age: 45, family: 1 });
  A(`国保 年額 ${grab('国民健康保険')} がエンジン直接呼び出し ${r1.rk.total} と一致`, grab('国民健康保険') === r1.rk.total);
  A(`国民年金 ${grab('国民年金')} ＝ 月額 ${nenkin.monthly} × 12`, grab('国民年金') === nenkin.monthly * 12 && nenkin.monthly * 12 === 215040);
  A('社会保険料控除 ＝ 国保 ＋ 国民年金', grab('社会保険料控除の合計') === r1.rk.total + nenkin.monthly * 12);
  A(`所得割額 ${grab('所得割額')} が住民税エンジン（令和9年度分・事業所得・社保控除込み）と一致 ${r1.rj.incomeLevy}`, grab('所得割額') === r1.rj.incomeLevy);
  const shown = grab('控除上限額の目安');
  A(`上限額（千円未満切捨て）${shown} がエンジン ${r1.lim.limit} と整合`, shown === Math.floor(r1.lim.limit / 1000) * 1000);
  const units = Math.round(r1.lim.ratio.percent * 1000);
  const handLimit = Math.floor(Math.floor(r1.rj.incomeLevy * fz.specialCapRateOfIncomeLevy) * 100000 / units) + fz.selfBurden;
  A(`手計算: floor(所得割×20%÷割合)+2,000 ＝ ${handLimit} ≒ エンジン ${r1.lim.limit}（±1円）`, Math.abs(handLimit - r1.lim.limit) <= 1);
  A('内訳（所得税・住民税基本分・特例分・自己負担）が出る', /所得税（2026年分/.test(res()) && /自己負担/.test(res()));
  A('国保ページと家計簿へのリンクが新宿区向け', /kokuho-keisan\.jp\/tokyo\/shinjuku\/income\.html/.test(d.getElementById('result').innerHTML) && /\/tokyo\/shinjuku\/kakeibo\//.test(d.getElementById('result').innerHTML));

  // 62歳: 介護分あり・国民年金なし
  set('age', '62'); await w.calcJieigyo(); await wait(50);
  const r2 = ref({ business: 3000000, age: 62, family: 1 });
  A('62歳: 国民年金は対象外、国保は介護分込み', cell('国民年金') === '対象外' && grab('国民健康保険') === r2.rk.total && r2.rk.total === r1.rk.total);
  // 66歳: 介護分なし・国民年金なし
  set('age', '66'); await w.calcJieigyo(); await wait(50);
  const r3 = ref({ business: 3000000, age: 66, family: 1 });
  A('66歳: 介護分なし（国保が 45歳より安い）・国民年金なし', grab('国民健康保険') === r3.rk.total && r3.rk.total < r1.rk.total);
  // 国民年金の免除
  set('age', '45'); d.getElementById('nenkinExempt').checked = true; await w.calcJieigyo(); await wait(50);
  A('免除にチェック: 国民年金は対象外、控除は国保のみ', cell('国民年金') === '対象外' && grab('社会保険料控除の合計') === r1.rk.total);
  d.getElementById('nenkinExempt').checked = false;
  // 家族: 配偶者＋扶養1 → 上限が下がる
  sel('spouse', 'general'); set('depGeneral', '1'); await w.calcJieigyo(); await wait(50);
  const r4 = ref({ business: 3000000, age: 45, family: 1, spouse: 'general', depG: 1 });
  A(`配偶者＋扶養1: 上限 ${grab('控除上限額の目安')} がエンジン ${r4.lim.limit} と整合し、単身より小さい`, grab('控除上限額の目安') === Math.floor(r4.lim.limit / 1000) * 1000 && r4.lim.limit < r1.lim.limit);
  sel('spouse', 'none'); set('depGeneral', '');
  // 青色 65万: 事業所得 300万 → 235万 で国保・住民税とも計算（エンジン直接呼び出しは 235万 を渡す）
  sel('aoiro', '650000'); await w.calcJieigyo(); await wait(50);
  const r5 = ref({ business: 2350000, age: 45, family: 1 });
  A(`青色65万: 事業所得 ${grab('事業所得（青色申告特別控除')} ＝ 2,350,000、国保 ${grab('国民健康保険')} がエンジン(235万) ${r5.rk.total} と一致し、控除なしより安い`, grab('事業所得（青色申告特別控除') === 2350000 && grab('国民健康保険') === r5.rk.total && r5.rk.total < r1.rk.total);
  A(`青色65万: 所得割 ${grab('所得割額')} がエンジン(235万) ${r5.rj.incomeLevy} と一致、上限 ${grab('控除上限額の目安')} が整合`, grab('所得割額') === r5.rj.incomeLevy && grab('控除上限額の目安') === Math.floor(r5.lim.limit / 1000) * 1000);
  // 青色 65万 ＞ 事業所得 30万: 引けるのは 30万 まで（所得 0 → 所得割なし）
  set('business', '300000'); await w.calcJieigyo(); await wait(50);
  A('青色65万・事業所得30万: 控除は事業所得が限度（所得 0 円・所得割なし）', grab('事業所得（青色申告特別控除') === 0 && /所得割がかからない/.test(res()));
  set('business', '3000000'); sel('aoiro', '0');
  // 掛金 50万: 国保は不変、所得割と上限が下がる
  set('kyosai', '500000'); await w.calcJieigyo(); await wait(50);
  const r6 = ref({ business: 3000000, age: 45, family: 1, kyosai: 500000 });
  A(`掛金50万: 国保 ${grab('国民健康保険')} は不変、控除 ${grab('小規模企業共済等掛金控除')} ＝ 500,000`, grab('国民健康保険') === r1.rk.total && grab('小規模企業共済等掛金控除') === 500000);
  A(`掛金50万: 所得割 ${grab('所得割額')} がエンジン ${r6.rj.incomeLevy} と一致し、無しより ${r1.rj.incomeLevy - r6.rj.incomeLevy} 円低い。上限も下がる`, grab('所得割額') === r6.rj.incomeLevy && r6.rj.incomeLevy < r1.rj.incomeLevy && r6.lim.limit < r1.lim.limit && grab('控除上限額の目安') === Math.floor(r6.lim.limit / 1000) * 1000);
  set('kyosai', '');
  // 住宅ローン控除
  A('住宅ローン未チェック: 注意書きなし', !/住宅ローン控除がある方へ/.test(res()));
  d.getElementById('housingLoan').checked = true; await w.calcJieigyo(); await wait(50);
  A('住宅ローンにチェック: 注意書きが出る・上限額は変わらない', /住宅ローン控除がある方へ/.test(res()) && grab('控除上限額の目安') === Math.floor(r1.lim.limit / 1000) * 1000);
  d.getElementById('housingLoan').checked = false;
  // 75歳
  set('age', '75'); await w.calcJieigyo(); await wait(50);
  A('75歳: 後期高齢者医療の案内', /後期高齢者医療/.test(res()));
  // 低所得: 所得割なし
  set('age', '45'); set('business', '400000'); await w.calcJieigyo(); await wait(50);
  A('事業所得 40万: 所得割なしの案内', /所得割がかからない/.test(res()));
  // 入力不足
  set('business', ''); await w.calcJieigyo(); await wait(10);
  A('事業所得が空: 入力を求める', /事業所得を入れてください/.test(res()));

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
