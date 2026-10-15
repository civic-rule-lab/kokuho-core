/**
 * test-onestop-dom.cjs — ふるさと納税 ワンストップ特例の判定ページ（生成物 seido-onestop.html）を jsdom で検証
 *
 * 1. 4 つの分岐（ワンストップ可／確定申告する／5団体超／わからない＋該当あり）の判定文
 * 2. 「わからない」でチェック欄が出る、該当なしなら推定である旨が出る
 * 3. 寄附額を入れると控除合計の目安（寄附額 − 2,000円）が出る
 * 4. 期限・無効条件がデータから描画される
 * 5. Enter の順: 確定申告 → 自治体数 → 寄附額（終了）
 * 実行: node scripts/test-onestop-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(ROOT, 'seido-onestop.html'), 'utf8');
for (const [re, file] of [[/<script src="\/js\/core\/shared\/ui-input\.js\?v=[0-9a-f]+"><\/script>/, 'js/core/shared/ui-input.js'], [/<script src="\/js\/core\/onestop\.js\?v=[0-9a-f]+"><\/script>/, 'js/core/onestop.js']])
  html = html.replace(re, () => '<script>' + fs.readFileSync(path.join(ROOT, file), 'utf8') + '</script>');
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://seido-keisan.jp/furusato/onestop/' });
const w = dom.window, d = w.document;
Object.defineProperty(w.HTMLElement.prototype, 'offsetParent', { get() { for (let n = this; n; n = n.parentElement) if (n.style && n.style.display === 'none') return null; return this.parentNode; } });
let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
const sel = (v) => { const e = d.getElementById('shinkoku'); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
const set = (id, v) => { const e = d.getElementById(id); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); e.dispatchEvent(new w.Event('blur')); };
const res = () => d.getElementById('result').textContent.replace(/\s+/g, ' ');
function enter(id) { const el = d.getElementById(id); el.focus(); el.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); return d.activeElement.id; }

(async () => {
  if (d.readyState === 'loading') await new Promise(r => d.addEventListener('DOMContentLoaded', r));
  A('期限がデータから描画される（1月10日・1月31日）', /1月10日/.test(d.getElementById('deadlines').textContent) && /1月31日/.test(d.getElementById('deadlines').textContent));
  A('無効になる条件が 3 行', (d.getElementById('invalidList').innerHTML.match(/<br>/g) || []).length === 2);
  A('チェック欄が 5 項目描画される', d.querySelectorAll('#reasonsList input[type=checkbox]').length === 5);
  A('Enter: 確定申告 → 自治体数 → 寄附額', enter('shinkoku') === 'municipalities' && enter('municipalities') === 'donation');
  A('Enter: 寄附額（終了マーク）で止まる', enter('donation') === 'donation');

  sel('no'); set('municipalities', '3'); set('donation', ''); w.calcOnestop();
  A('しない・3団体 → ワンストップが使える', /ワンストップ特例が使えます/.test(res()) && d.querySelector('#result .verdict.ok'));
  A('手順に申請書と変更届の期限', /第55号の5様式/.test(res()) && /1月10日/.test(res()));
  set('municipalities', '6'); w.calcOnestop();
  A('しない・6団体 → 5団体超で確定申告', /5団体を超える/.test(res()) && d.querySelector('#result .verdict.ng'));
  sel('yes'); set('municipalities', '1'); w.calcOnestop();
  A('する → 確定申告で受ける（ワンストップ不可）', /ワンストップ特例は使えません/.test(res()));
  A('する → 確定申告の手順（2月16日〜3月15日）', /3月15日/.test(res()));
  sel('unknown');
  A('わからない → チェック欄が表示される', d.getElementById('reasonsBox').style.display !== 'none');
  d.getElementById('r_refundDeductions').checked = true; set('municipalities', '2'); w.calcOnestop();
  A('わからない・医療費控除 → 確定申告、理由が表示される', /ワンストップ特例は使えません/.test(res()) && /医療費控除/.test(res()));
  d.getElementById('r_refundDeductions').checked = false; w.calcOnestop();
  A('わからない・該当なし → ワンストップ（推定である旨）', /ワンストップ特例が使えます/.test(res()) && /チェックした項目から判定/.test(res()));
  sel('no'); set('municipalities', '2'); set('donation', '５０，０００'); w.calcOnestop();
  A('寄附額 50,000 → 控除合計の目安 48,000 円', /48,000 円/.test(res()));
  A('控除が戻る時期（ワンストップ／確定申告）の説明が出る', /翌年6月/.test(res()) && /還付/.test(res()));
  sel('no'); set('municipalities', ''); w.calcOnestop();
  A('自治体数が空 → 入力を求める', /自治体数を入れてください/.test(res()));
  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
