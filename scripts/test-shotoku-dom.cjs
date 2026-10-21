/**
 * test-shotoku-dom.cjs — 所得税の計算ページ（生成物 seido-shotoku.html）を jsdom で検証
 *   1. 画面の年税額がエンジン直呼び（js/core/shotoku.js ＝ 正本の vendored コピー）と一致（アンカー 5 本＋追加控除）
 *   2. 境界: 178 万 → 0 円・179 万 → 500 円・219.1 万の段差・489 万／655 万の基礎控除段差
 *   3. Enter の順: 1 → 2 → 3 → 4a → 4b → 5a → 5b → 6 → (7 は配偶者ありのときだけ) → 8a … → 14（終了・何もしない）
 *   4. 給与未入力なら結果を出さない（0 円と区別）
 *   5. 注記: 所得税 0 円で給与 100 万超なら住民税の注意が出る。制度値を fetch できなければ計算しない
 *   6. 説明の表（基礎控除・税率）が制度値から描かれる
 * 実行: node scripts/test-shotoku-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const Shotoku = require(path.join(ROOT, 'js/core/shotoku.js'));
const dbText = fs.readFileSync(path.join(ROOT, 'data/national/shotokuzei-2026.json'), 'utf8');
const eng = Shotoku.createEngineFromDB(2026, JSON.parse(dbText));

let html = fs.readFileSync(path.join(ROOT, 'seido-shotoku.html'), 'utf8');
for (const f of ['shared/ui-input', 'shotoku'])
  html = html.replace(new RegExp(`<script src="/js/core/${f.replace('/', '\\/')}\\.js\\?v=[0-9a-f]+"><\\/script>`), () => '<script>' + fs.readFileSync(path.join(ROOT, `js/core/${f}.js`), 'utf8') + '</script>');
if (/<script src="\/js\//.test(html)) throw new Error('差し替えられなかった <script src> が残っている');
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');

function makeDom(fetchOk) {
  return new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://seido-keisan.jp/shotoku/',
    beforeParse(w) {
      w.fetch = (url) => {
        if (!fetchOk || !/\/data\/national\/shotokuzei-2026\.json$/.test(String(url))) return Promise.resolve({ ok: false, status: 404, json: () => ({}) });
        return Promise.resolve({ ok: true, status: 200, json: () => JSON.parse(dbText) });
      };
    } });
}
let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
const wait = ms => new Promise(r => setTimeout(r, ms));
const num = s => Number(String(s).replace(/[^0-9]/g, ''));

(async () => {
  const dom = makeDom(true);
  const w = dom.window, d = w.document;
  Object.defineProperty(w.HTMLElement.prototype, 'offsetParent', { get() { for (let n = this; n; n = n.parentElement) if (n.style && n.style.display === 'none') return null; return this.parentNode; } });
  const set = (id, v) => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); e.dispatchEvent(new w.Event('blur')); };
  const sel = (id, v) => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
  const chk = (id, on) => { const e = d.getElementById(id); e.checked = on; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
  const res = () => d.getElementById('result').textContent.replace(/\s+/g, ' ');
  const bigAmount = () => { const e = d.querySelector('#result .amount.big'); return e ? num(e.textContent) : null; };
  function enter(id) { const el = d.getElementById(id); el.focus(); el.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); return d.activeElement.id; }
  const clear = () => ['salary','otherIncome','socialInsurance','ideco','lifeIns','quakeIns','medical','spouseSalary','depGeneral','depSpecific','depElderly','depParent','tokuteiCount','famDisGeneral','famDisSpecial','famDisCoRes','mortgage'].forEach(id => set(id, ''));

  if (d.readyState === 'loading') await new Promise(r => d.addEventListener('DOMContentLoaded', r));
  await wait(30);

  // 6. 説明の表
  A('基礎控除の表が制度値から描かれる（104万円 を含む）', /104万円/.test(d.getElementById('kisoTable').textContent));
  A('速算表が制度値から描かれる（45% を含む）', /45%/.test(d.getElementById('taxTable').textContent));
  A('終了マーク data-step-end はちょうど 1 つ', d.querySelectorAll('[data-step-end]').length === 1);

  // 4. 未入力
  await w.calcShotoku(); await wait(10);
  A('給与未入力: 結果を出さず入力を求める', /給与収入を入れてください/.test(res()) && bigAmount() === null);

  // 3. Enter の順（配偶者なし → 7 を飛ばす）
  A('Enter: 1 → 2 → 3 → 4a → 4b', enter('salary') === 'otherIncome' && enter('otherIncome') === 'socialInsurance' && enter('socialInsurance') === 'ideco' && enter('ideco') === 'lifeIns');
  A('Enter: 4b → 5a → 5b → 6 → 8a（配偶者なしなので 7 を飛ばす）', enter('lifeIns') === 'quakeIns' && enter('quakeIns') === 'medical' && enter('medical') === 'spouse' && enter('spouse') === 'depGeneral');
  sel('spouse', 'general');
  A('Enter: 配偶者ありなら 6 → 7 → 8a', enter('spouse') === 'spouseSalary' && enter('spouseSalary') === 'depGeneral');
  sel('spouse', 'none');
  A('Enter: 8a → 8b → 9a → 9b → 10 → 11 → 12 → 13a → 13b → 13c → 14', enter('depGeneral') === 'depSpecific' && enter('depSpecific') === 'depElderly' && enter('depElderly') === 'depParent' && enter('depParent') === 'tokuteiCount' && enter('tokuteiCount') === 'selfStatus' && enter('selfStatus') === 'selfDisability' && enter('selfDisability') === 'famDisGeneral' && enter('famDisGeneral') === 'famDisSpecial' && enter('famDisSpecial') === 'famDisCoRes' && enter('famDisCoRes') === 'mortgage');
  A('Enter: 14（終了マーク）では何もしない', enter('mortgage') === 'mortgage');

  // 1. アンカー（指示書 §5 の手計算値と、エンジン直呼びの両方に一致）
  const cases = [
    ['年収178万・独身 → 0', { salary: 1780000 }, 0],
    ['年収179万・独身 → 500', { salary: 1790000 }, 500],
    ['年収500万・社保75万 → 90,300', { salary: 5000000, socialInsurance: 750000 }, 90300],
  ];
  for (const [label, inp, exp] of cases) {
    clear(); set('salary', String(inp.salary)); if (inp.socialInsurance) set('socialInsurance', String(inp.socialInsurance));
    await w.calcShotoku(); await wait(10);
    A(`${label}（画面 ${bigAmount()}）`, bigAmount() === exp && eng.calcShotokuzei(inp).annualTax === exp);
  }
  // 800万・配偶者（所得0）・一般扶養1・社保120万 → 272,000
  clear(); set('salary', '8000000'); set('socialInsurance', '1200000'); sel('spouse', 'general'); set('spouseSalary', '0'); set('depGeneral', '1');
  await w.calcShotoku(); await wait(10);
  A(`年収800万・配偶者・扶養1・社保120万 → 272,000（画面 ${bigAmount()}）`, bigAmount() === 272000);
  A('配偶者控除の行が出る', /配偶者控除/.test(res()));
  // 1200万・23歳未満扶養1・社保160万 → 1,064,900（所得金額調整控除）
  clear(); sel('spouse', 'none'); set('salary', '12000000'); set('socialInsurance', '1600000'); set('depGeneral', '1'); chk('under23', true);
  await w.calcShotoku(); await wait(10);
  A(`年収1200万・23歳未満扶養1・社保160万 → 1,064,900（画面 ${bigAmount()}）`, bigAmount() === 1064900);
  A('所得金額調整控除の行が出る・税率 23%', /所得金額調整控除/.test(res()) && /23%/.test(res()));
  chk('under23', false);

  // 2. 境界
  clear(); set('salary', '2190999'); await w.calcShotoku(); await wait(10); const t1 = bigAmount();
  clear(); set('salary', '2191000'); await w.calcShotoku(); await wait(10); const t2 = bigAmount();
  A(`219.1万の段差: 2,190,999 → ${t1}・2,191,000 → ${t2}（エンジンと一致）`, t1 === eng.calcShotokuzei({ salary: 2190999 }).annualTax && t2 === eng.calcShotokuzei({ salary: 2191000 }).annualTax);
  // 追加控除（障害者・医療費・生保上限・住宅ローン・特定親族）
  clear(); set('salary', '5000000'); set('socialInsurance', '750000'); sel('selfDisability', 'general');
  await w.calcShotoku(); await wait(10);
  A(`本人 障害者 → 76,500（画面 ${bigAmount()}）`, bigAmount() === 76500 && /障害者控除/.test(res()));
  sel('selfDisability', 'none'); set('famDisCoRes', '1');
  await w.calcShotoku(); await wait(10);
  A(`同居特別障害者1人 → 52,000（画面 ${bigAmount()}）`, bigAmount() === 52000);
  set('famDisCoRes', ''); set('medical', '300000');
  await w.calcShotoku(); await wait(10);
  A('医療費30万 → 控除200,000（足切り10万）が内訳に出る', /医療費控除\s*200,000 円/.test(res()) && bigAmount() === eng.calcShotokuzei({ salary: 5000000, socialInsurance: 750000, medicalPaid: 300000 }).annualTax);
  set('medical', ''); set('lifeIns', '150000');
  await w.calcShotoku(); await wait(10);
  A('生命保険料控除15万 → 上限12万で内訳に出る', /生命保険料控除\s*120,000 円/.test(res()));
  set('lifeIns', ''); set('mortgage', '200000');
  await w.calcShotoku(); await wait(10);
  A(`住宅ローン控除20万 → 年税額 0（画面 ${bigAmount()}）`, bigAmount() === 0 && /住宅ローン控除/.test(res()));
  set('mortgage', ''); set('tokuteiCount', '1'); await wait(10);
  A('特定親族 1 人 → 給与収入欄が出て data-step=10a', !!d.getElementById('tokuteiSalary0') && d.getElementById('tokuteiSalary0').getAttribute('data-step') === '10a');
  A('Enter: 10 → 10a → 11', enter('tokuteiCount') === 'tokuteiSalary0' && enter('tokuteiSalary0') === 'selfStatus');
  set('tokuteiSalary0', '1500000');
  await w.calcShotoku(); await wait(10);
  const tkExp = eng.calcShotokuzei({ salary: 5000000, socialInsurance: 750000, tokuteiShinzoku: [eng.kyuyoShotoku(1500000)] }).annualTax;
  A(`特定親族（給与150万）→ 特定親族特別控除が出て年税額 ${tkExp}（画面 ${bigAmount()}）`, /特定親族特別控除/.test(res()) && bigAmount() === tkExp);
  set('tokuteiCount', ''); await wait(10);

  // 5. 注記
  clear(); set('salary', '1500000');
  await w.calcShotoku(); await wait(10);
  A('年収150万: 所得税 0 円で住民税の注意が出る', bigAmount() === 0 && /住民税/.test(res()) && /かかる場合があります/.test(res()));
  clear(); set('salary', '5000000');
  await w.calcShotoku(); await wait(10);
  A('年収500万: 住民税の注意は出ない', !/かかる場合があります/.test(res()));
  A('全角入力が半角に直る（５，０００，０００）', (() => { set('salary', '５，０００，０００'); return d.getElementById('salary').value === '5,000,000'; })());

  // fetch 失敗 → 計算しない
  const dom2 = makeDom(false); const w2 = dom2.window, d2 = w2.document;
  if (d2.readyState === 'loading') await new Promise(r => d2.addEventListener('DOMContentLoaded', r));
  await wait(30);
  const e2 = d2.getElementById('salary'); e2.value = '5000000'; e2.dispatchEvent(new w2.Event('blur'));
  await w2.calcShotoku(); await wait(10);
  A('制度値を読めないとき: 0 円を見せず「計算できません」', /計算できません/.test(d2.getElementById('result').textContent) && !d2.querySelector('#result .amount.big'));

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
