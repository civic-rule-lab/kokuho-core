/**
 * test-haito-dom.cjs — 配当の課税方式 損得判定ページ（生成物 seido-haito.html）を jsdom で検証
 *   1. 3方式の税額が haito.js 直接呼び出しと一致（所得税の課税所得は furusato.js の base と同じ近似）
 *   2. 国保の増加が「所得に配当を足した calculateKokuho」との差と一致（申告不要は 0）
 *   3. 上限: 分離は所得割に 5%、総合は住民税を配当込みで計算し直した値と一致
 *   4. 判定: 新宿区・事業所得 300万・配当 50万 は国保の増加で申告不要が最小負担、配当控除で所得税が戻る帯でも国保で相殺され得る
 *   5. Enter の順の末尾: … 障害者控除 → 配当 → 譲渡損（終了）。配当が空なら入力を求める
 * 実行: node scripts/test-haito-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const { calculateKokuho } = require(path.join(ROOT, 'js/core/kokuho.js'));
const { calculateJumin } = require(path.join(ROOT, 'js/core/jumin.js'));
const F = require(path.join(ROOT, 'js/core/furusato.js'));
const { judgeHaito } = require(path.join(ROOT, 'js/core/haito.js'));
const Shotoku = require(path.join(ROOT, 'js/core/shotoku.js'));
const fz = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/furusato-2027.json'), 'utf8'));
const nenkin = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/kokumin-nenkin-2026.json'), 'utf8'));
const haito = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/haito-2026.json'), 'utf8'));
const P = Shotoku.loadParams(2026, JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8')));
const kiso = P.kisoKojo.map(([u, a]) => [Number.isFinite(u) ? u : null, a]);
const KYUCHI = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/reference/kyuchi.json'), 'utf8')).municipalities;
const SLUG = 'shinjuku', PREF = '東京都';
const kokuhoData = JSON.parse(fs.readFileSync(path.join(ROOT, `data/municipalities/${SLUG}/kokuho-2026.json`), 'utf8'));
const juminPath = path.join(ROOT, `data/municipalities/${SLUG}/jumin-2026.json`);
const juminData = fs.existsSync(juminPath) ? JSON.parse(fs.readFileSync(juminPath, 'utf8')) : null;

let html = fs.readFileSync(path.join(ROOT, 'seido-haito.html'), 'utf8');
for (const f of ['shared/ui-input', 'shared/income', 'jumin', 'kokuho', 'furusato', 'haito'])
  html = html.replace(new RegExp(`<script src="/js/core/${f.replace('/', '\\/')}\\.js\\?v=[0-9a-f]+"><\\/script>`), () => '<script>' + fs.readFileSync(path.join(ROOT, `js/core/${f}.js`), 'utf8') + '</script>');
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://seido-keisan.jp/furusato/haito/',
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
const wait = ms => new Promise(r => setTimeout(r, ms));
function enter(id) { const el = d.getElementById(id); el.focus(); el.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); return d.activeElement.id; }
const num = s => Number(String(s).replace(/[^0-9\-−]/g, '').replace('−', '-'));
// 表の行（label）→ 3 セルの文字列
function rowCells(label) { const tr = [...d.querySelectorAll('#result .hb-table tr')].find(r => r.querySelector('td') && r.querySelector('td').textContent.startsWith(label)); return tr ? [...tr.querySelectorAll('td')].slice(1).map(td => td.textContent.trim()) : null; }

// 期待値（エンジン直接呼び出し）: 事業所得 300万・45歳・1人・配当 div
function ref(business, age, div) {
  const careN = (age >= 40 && age < 65) ? 1 : 0;
  const rk0 = calculateKokuho({ income: business, family: 1, preschool: 0, under18: 0, care: careN, salaryPensionCount: 1, fixedAssetTax: 0 }, kokuhoData);
  const rk1 = calculateKokuho({ income: business + div, family: 1, preschool: 0, under18: 0, care: careN, salaryPensionCount: 1, fixedAssetTax: 0 }, kokuhoData);
  const nk = (age >= 20 && age < 60) ? nenkin.monthly * 12 : 0;
  const si = rk0.total + nk;
  const hd = F.furusatoHumanDeductionDiff({ selfTotalIncome: business, spouse: 'none' }, fz);
  const common = { salary: 0, pension: 0, age, socialInsurance: si, spouseDeduction: 0, dependentDeduction: 0, dependents: 0, humanDeductionDiff: hd, fiscalYear: 2027, taxCredits: 0, kyuchi: Number(KYUCHI[SLUG][0]) };
  const rj0 = calculateJumin(juminData, Object.assign({ otherIncome: business }, common));
  const rj1 = calculateJumin(juminData, Object.assign({ otherIncome: business + div }, common));
  const ks0 = F.furusatoShotokuBasicDeduction(rj0.totalIncome, kiso), ks1 = F.furusatoShotokuBasicDeduction(rj1.totalIncome, kiso);
  const lim0 = F.calcFurusatoLimit({ incomeLevy: rj0.incomeLevy, taxableIncome: rj0.taxableIncome, humanDeductionDiff: rj0.humanDeductionDiff, shotokuBasicDeduction: ks0 }, fz);
  const lim1 = F.calcFurusatoLimit({ incomeLevy: rj1.incomeLevy, taxableIncome: rj1.taxableIncome, humanDeductionDiff: rj1.humanDeductionDiff, shotokuBasicDeduction: ks1 }, fz);
  const hj = judgeHaito({ dividend: div, shotokuTaxable: Math.max(0, lim0.base), juminTaxable: rj0.taxableIncome }, haito, P);
  const limSep = F.calcFurusatoLimit({ incomeLevy: rj0.incomeLevy + hj.separate.levyAdd, taxableIncome: rj0.taxableIncome, humanDeductionDiff: rj0.humanDeductionDiff, shotokuBasicDeduction: ks0 }, fz);
  return { rk0, rk1, kokuhoDelta: rk1.total - rk0.total, rj0, lim0, lim1, limSep, hj };
}
const shown = l => Math.floor(l.limit / 1000) * 1000;

(async () => {
  if (d.readyState === 'loading') await new Promise(r => d.addEventListener('DOMContentLoaded', r));
  sel('pref', PREF); sel('city', SLUG);
  A('Enter の末尾: 障害者控除 → 配当 → 譲渡損（終了）', enter('selfDisability') === 'dividend' && enter('dividend') === 'hasLoss' && enter('hasLoss') === 'hasLoss');
  set('business', '3000000'); set('age', '45'); set('family', '1');
  await w.calcHaito(); await wait(10);
  A('配当が空: 入力を求める', /配当の年額を入れてください/.test(res()));

  // 事業所得 300万・配当 50万（所得税 10% 帯）
  set('dividend', '５００，０００'); await w.calcHaito(); await wait(60);
  const r1 = ref(3000000, 45, 500000);
  const sh = rowCells('所得税'), ju = rowCells('住民税'), ko = rowCells('国保料の増加'), bu = rowCells('負担の増減'), li = rowCells('ふるさと納税の上限');
  A(`所得税の3列 ${sh} が haito.js と一致（申告不要・分離 ${r1.hj.none.shotokuTax}・総合 ${r1.hj.sogo.shotokuTax}）`, !!sh && num(sh[0]) === r1.hj.none.shotokuTax && num(sh[1]) === r1.hj.separate.shotokuTax && num(sh[2]) === r1.hj.sogo.shotokuTax);
  A(`住民税の3列 ${ju} が一致（総合 ${r1.hj.sogo.juminTax} ＝ 10% − 配当控除 2.8%）`, !!ju && num(ju[0]) === r1.hj.none.juminTax && num(ju[1]) === r1.hj.separate.juminTax && num(ju[2]) === r1.hj.sogo.juminTax);
  A(`国保の増加: 申告不要 0、分離・総合 ${r1.kokuhoDelta}（所得に 50万 を足した calculateKokuho との差）`, !!ko && ko[0] === '0' && num(ko[1]) === r1.kokuhoDelta && num(ko[2]) === r1.kokuhoDelta && r1.kokuhoDelta > 0);
  A(`負担の増減: 分離 ＝ +国保増 ${r1.kokuhoDelta}、総合 ＝ 税差 ${r1.hj.sogo.total - r1.hj.none.total} ＋ 国保増`, !!bu && bu[0] === '基準' && num(bu[1]) === r1.kokuhoDelta && num(bu[2]) === (r1.hj.sogo.total - r1.hj.none.total) + r1.kokuhoDelta);
  A(`上限: 申告不要 ${shown(r1.lim0)}・分離 ${shown(r1.limSep)}（所得割＋5%）・総合 ${shown(r1.lim1)}（配当込みで計算し直し）`, !!li && num(li[0]) === shown(r1.lim0) && num(li[1]) === shown(r1.limSep) && num(li[2]) === shown(r1.lim1) && shown(r1.limSep) > shown(r1.lim0) && shown(r1.lim1) > shown(r1.limSep));
  const bestExpected = (() => { const b = { none: 0, separate: r1.kokuhoDelta, sogo: (r1.hj.sogo.total - r1.hj.none.total) + r1.kokuhoDelta }; return Object.keys(b).reduce((x, k) => b[k] < b[x] ? k : x, 'none'); })();
  const names = { none: '申告不要', separate: '申告分離', sogo: '総合課税' };
  A(`判定: ${names[bestExpected]}（負担が最小の方式）が見出しに出る`, new RegExp(names[bestExpected] + '(のまま|で申告)').test(res()));
  A('譲渡損「ない」: 損益通算の注意は出ない', !/譲渡損がある方/.test(res()));
  sel('hasLoss', 'yes'); await w.calcHaito(); await wait(60);
  A('譲渡損「ある」: 損益通算の注意が出る（数字は変えない）', /譲渡損がある方/.test(res()) && num(rowCells('所得税')[2]) === r1.hj.sogo.shotokuTax);
  sel('hasLoss', 'no');

  // 所得税 5% 帯（事業所得 150万）: 総合で所得税が戻る（負の値）が、国保の増加と住民税で相殺されるかはエンジンの値どおり
  set('business', '1500000'); await w.calcHaito(); await wait(60);
  const r2 = ref(1500000, 45, 500000);
  const sh2 = rowCells('所得税');
  A(`5% 帯: 総合の所得税 ${sh2 && sh2[2]} が負（戻る）で haito.js ${r2.hj.sogo.shotokuTax} と一致`, !!sh2 && r2.hj.sogo.shotokuTax < 0 && num(sh2[2]) === r2.hj.sogo.shotokuTax);
  const bu2 = rowCells('負担の増減');
  A(`5% 帯: 総合の負担増減 ${bu2 && bu2[2]} ＝ 税差 ＋ 国保増 ${r2.kokuhoDelta}`, !!bu2 && num(bu2[2]) === (r2.hj.sogo.total - r2.hj.none.total) + r2.kokuhoDelta);

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
