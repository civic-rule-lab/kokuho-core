/**
 * test-nenkin-dom.cjs — 国民年金ページ（生成物 seido-nenkin.html）を jsdom で検証
 *   1. 画面の年額・前納・免除区分がエンジン直呼び（js/core/nenkin.js）と一致
 *   2. Enter の順: 1 → 2 → 3 → 4 → 5 → 6a → 6b → 6c → 7a → 7b → 8 → (9a〜9d は配偶者ありのとき) → 10 → (11a〜11d は世帯主が別の人のとき) → 12（終了）
 *   3. 年齢・本人の収入が未入力なら結果を出さない
 *   4. 注記: 20 歳未満・60 歳以上は判定しない。免除なしのとき誰が基準超かを示す
 *   5. 制度値の埋め込み（R5）: NENKIN_DB が JSON と文字列一致、/data/ を fetch しない。説明の表が制度値から描かれる
 * 実行: node scripts/test-nenkin-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const N = require(path.join(ROOT, 'js/core/nenkin.js'));
const { calcSalaryIncome } = require(path.join(ROOT, 'js/core/shared/income.js'));
const dbText = fs.readFileSync(path.join(ROOT, 'data/national/kokumin-nenkin-2026.json'), 'utf8');
const db = JSON.parse(dbText);

let html = fs.readFileSync(path.join(ROOT, 'seido-nenkin.html'), 'utf8');
for (const f of ['shared/ui-input', 'shared/income', 'nenkin'])
  html = html.replace(new RegExp(`<script src="/js/core/${f.replace('/', '\\/')}\\.js\\?v=[0-9a-f]+"><\\/script>`), () => '<script>' + fs.readFileSync(path.join(ROOT, `js/core/${f}.js`), 'utf8') + '</script>');
if (/<script src="\/js\//.test(html)) throw new Error('差し替えられなかった <script src> が残っている');
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://seido-keisan.jp/nenkin/',
  beforeParse(w) { w.fetch = () => Promise.reject(new Error('このページは fetch しない')); } });
const w = dom.window, d = w.document;
Object.defineProperty(w.HTMLElement.prototype, 'offsetParent', { get() { for (let n = this; n; n = n.parentElement) if (n.style && n.style.display === 'none') return null; return this.parentNode; } });
let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
const set = (id, v) => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); e.dispatchEvent(new w.Event('blur')); };
const sel = (id, v) => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
const res = () => d.getElementById('result').textContent.replace(/\s+/g, ' ');
const big = () => { const e = d.querySelector('#result .amount.big'); return e ? Number(e.textContent.replace(/[^0-9]/g, '')) : null; };
const verdict = () => { const e = d.querySelector('#result .verdict'); return e ? e.textContent.trim() : null; };
function enter(id) { const el = d.getElementById(id); el.focus(); el.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); return d.activeElement.id; }
const clear = () => ['age','selfAmount','selfDeps','selfDeps16','selfDeps70','selfDed','spouseAmount','spouseDeps','spouseDed','hhAmount','hhDeps','hhDed'].forEach(id => set(id, ''));

(async () => {
  if (d.readyState === 'loading') await new Promise(r => d.addEventListener('DOMContentLoaded', r));
  await new Promise(r => setTimeout(r, 30));

  // 5. 埋め込みと表
  A('制度値 NENKIN_DB が埋め込まれ、月額 17,920 を持つ', w.eval('typeof NENKIN_DB !== "undefined" && NENKIN_DB.monthly === 17920'));
  A('埋め込んだ制度値は data/national/kokumin-nenkin-2026.json と文字列一致', html.includes('const NENKIN_DB = ' + dbText.trim() + ';'));
  A('ページは /data/ を fetch しない', !/fetch\(\s*["'`]\/data\//.test(html));
  A('基準の表が制度値から描かれる（35万円・88万円・128万円・168万円）', /35万円/.test(d.getElementById('kijunTable').textContent) && /168万円/.test(d.getElementById('kijunTable').textContent));
  A('反映の表に 4分の3免除の月額 4,480 円と 5/8', /4,480 円/.test(d.getElementById('hanneiTable').textContent) && /5\/8/.test(d.getElementById('hanneiTable').textContent));
  A('終了マーク data-step-end はちょうど 1 つ', d.querySelectorAll('[data-step-end]').length === 1);

  // 3. 未入力
  w.calcNenkin(); A('年齢未入力: 結果を出さず入力を求める', /年齢を入れてください/.test(res()) && big() === null);
  set('age', '30'); w.calcNenkin(); A('本人の収入未入力: 入力を求める', /本人の収入を入れてください/.test(res()) && big() === null);

  // 2. Enter の順（配偶者なし・世帯主本人 → 9・11 を飛ばす）
  A('Enter: 1 → 2 → 3 → 4 → 5 → 6a', enter('method') === 'age' && enter('age') === 'student' && enter('student') === 'selfKind' && enter('selfKind') === 'selfAmount' && enter('selfAmount') === 'selfDeps');
  A('Enter: 6a → 6b → 6c → 7a → 7b → 8 → 10（9 を飛ばす）→ 12（11 を飛ばす）', enter('selfDeps') === 'selfDeps16' && enter('selfDeps16') === 'selfDeps70' && enter('selfDeps70') === 'selfDed' && enter('selfDed') === 'selfStatus' && enter('selfStatus') === 'spouse' && enter('spouse') === 'householder' && enter('householder') === 'tsuka');
  A('Enter: 12（終了マーク）では何もしない', enter('tsuka') === 'tsuka');
  sel('spouse', 'yes'); sel('householder', 'other');
  A('Enter: 配偶者あり 8 → 9a → 9b → 9c → 9d → 10 → 11a → 11b → 11c → 11d → 12', enter('spouse') === 'spouseKind' && enter('spouseKind') === 'spouseAmount' && enter('spouseAmount') === 'spouseDeps' && enter('spouseDeps') === 'spouseDed' && enter('spouseDed') === 'householder' && enter('householder') === 'hhKind' && enter('hhKind') === 'hhAmount' && enter('hhAmount') === 'hhDeps' && enter('hhDeps') === 'hhDed' && enter('hhDed') === 'tsuka');
  sel('spouse', 'none'); sel('householder', 'self');

  // 1. エンジンとの一致
  clear(); set('age', '30'); set('selfAmount', '0'); sel('selfKind', 'salary'); sel('method', 'kouza');
  w.calcNenkin();
  A(`年額 215,040（画面 ${big()}）`, big() === 215040);
  A('前納（口座振替）2年 417,150・割引 17,370 が表に出る', /417,150 円/.test(res()) && /17,370 円/.test(res()));
  A('所得 0 → 全額免除・月額 0 円・反映 1/2', verdict() === '全額免除' && /承認されたときの月額0円/.test(res().replace(/\s/g, '')) && /1\/2/.test(res()));
  sel('method', 'nofusho'); w.calcNenkin();
  A('納付書・クレジットカード: 1年 211,220・割引 3,820', /211,220 円/.test(res()) && /3,820 円/.test(res()));
  sel('tsuka', 'yes'); w.calcNenkin();
  A('付加保険料あり: 年額 219,840・月額に付加 400 円', big() === 219840 && /付加保険料 400 円/.test(res()));
  sel('tsuka', 'no');

  // 給与収入 → 所得（住民税側・令和8年度分の給与所得控除）で判定
  set('selfAmount', '1500000'); w.calcNenkin();
  const inc150 = calcSalaryIncome(1500000, 2026);
  const exp150 = N.judgeExemption(db, { age: 30, self: { income: inc150, dependents: {}, other: {} } });
  A(`給与 150 万 → 所得 ${inc150} → ${exp150.level}（画面 ${verdict()}）`, verdict() === ({ full: '全額免除', threeQuarters: '4分の3免除', half: '半額免除', quarter: '4分の1免除', yuyo: '納付猶予', none: '免除・猶予なし' })[exp150.level]);
  A('判定の内訳に本人の前年所得が出る', new RegExp('本人：前年所得 ' + inc150.toLocaleString('ja-JP') + ' 円').test(res()));
  // 所得を直接: 1,680,000 → 4分の1免除・月額 13,440
  sel('selfKind', 'income'); set('selfAmount', '1680000'); w.calcNenkin();
  A(`所得 168 万 → 4分の1免除・月額 13,440（画面 ${verdict()}）`, verdict() === '4分の1免除' && /13,440 円/.test(res()));
  // 世帯主（親）300 万 → 免除なし・30 歳は納付猶予
  set('selfAmount', '500000'); sel('householder', 'other'); sel('hhKind', 'income'); set('hhAmount', '3000000'); w.calcNenkin();
  A('本人 50 万・世帯主 300 万・30 歳 → 納付猶予（反映なし）', verdict() === '納付猶予' && /反映なし/.test(res()));
  set('age', '55'); w.calcNenkin();
  A('同・55 歳 → 免除・猶予なし、世帯主が基準超と表示', verdict() === '免除・猶予なし' && /世帯主の前年所得が基準を超えています/.test(res()));
  sel('householder', 'self'); set('age', '30');
  // 学生
  sel('student', 'yes'); set('selfAmount', '1280000'); w.calcNenkin();
  A('学生・所得 128 万 → 学生納付特例', verdict() === '学生納付特例' && /学生納付特例の基準/.test(res()));
  sel('student', 'no');
  // 本人の状況（ひとり親 35 万）で 4分の1免除の上限が 2,030,000
  sel('selfStatus', 'hitorioya'); set('selfAmount', '2030000'); w.calcNenkin();
  A('ひとり親・所得 203 万 → 4分の1免除', verdict() === '4分の1免除');
  sel('selfStatus', 'none');

  // 4. 年齢
  set('age', '19'); set('selfAmount', '0'); w.calcNenkin();
  A('19 歳: 免除の判定をせず注記', /20〜59歳です/.test(res()) && verdict() === null);
  set('age', '60'); w.calcNenkin();
  A('60 歳: 同上', /20〜59歳です/.test(res()));
  A('全角入力が半角に直る（１，５００，０００）', (() => { set('selfAmount', '１，５００，０００'); return d.getElementById('selfAmount').value === '1,500,000'; })());

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
