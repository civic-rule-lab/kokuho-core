/**
 * test-ui-input-dom.cjs — 入力 UI 共通実装（js/core/shared/ui-input.js）を jsdom で検証。
 *
 * 1. 数値入力欄（UI 共通ルール §1）: 全角→半角、入力中はカンマ無し、blur でカンマ（withCommas の欄のみ）
 * 2. Enter で次の欄へ（§2 段・横枠方式）: 1 → 2a → 2b → 3。非表示の欄は飛ばす。
 *    data-step-end の欄では何もしない。次が無ければ何もしない。
 * 3. IME 確定の Enter（isComposing / keyCode 229 / compositionend 直後）では欄を動かさない。
 *    ※ IME による文字の挿入そのものは jsdom で再現できない。「確定の Enter で動かない」ことまでを見る。
 * 4. 全テンプレートが ui-input.js を読み込み、自前の toHalfWidth / setupNumericInput を持たないこと。
 *    data-step を持つテンプレートには data-step-end が 1 つあること。
 * 実行: node scripts/test-ui-input-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const UI = fs.readFileSync(path.join(ROOT, 'js/core/shared/ui-input.js'), 'utf8');

let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };

const html = `<!doctype html><html><body>
  <input id="a" data-step="1" type="text">
  <input id="b1" data-step="2a" type="text">
  <input id="b2" data-step="2b" type="text">
  <div id="hiddenBox" style="display:none"><input id="c" data-step="3" type="text"></div>
  <select id="d" data-step="4"><option>x</option></select>
  <input id="chk" data-step="5" type="checkbox">
  <input id="e" data-step="6" type="text" data-step-end>
  <input id="z" data-step="7" type="text">
  <script>${UI}</script>
</body></html>`;
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
const w = dom.window, d = w.document;
// jsdom はレイアウトを持たないので、display:none の祖先が無ければ表示中として扱う
Object.defineProperty(w.HTMLElement.prototype, 'offsetParent', { get() {
  for (let n = this; n; n = n.parentElement) if (n.style && n.style.display === 'none') return null;
  return this.parentNode;
} });

function enter(id, extra) {
  const el = d.getElementById(id); el.focus();
  el.dispatchEvent(new w.KeyboardEvent('keydown', Object.assign({ key: 'Enter', bubbles: true, cancelable: true }, extra || {})));
  return d.activeElement && d.activeElement.id;
}

(async () => {
  // §2 移動
  A('1 → 2a', enter('a') === 'b1');
  A('2a → 2b（横枠）', enter('b1') === 'b2');
  A('2b → 4（非表示の 3 を飛ばす）', enter('b2') === 'd');
  d.getElementById('hiddenBox').style.display = '';
  A('2b → 3（表示されれば止まる）', enter('b2') === 'c');
  A('4（select）→ 6（チェックボックス 5 は飛ばす）', enter('d') === 'e');
  A('終了マークの欄: 次（7）があっても動かない', enter('e') === 'e');
  A('次が無い欄: 動かない', enter('z') === 'z');
  // IME
  A('IME 確定（isComposing）: 動かない', enter('a', { isComposing: true }) === 'a');
  A('IME 確定（keyCode 229・Safari 型）: 動かない', enter('a', { keyCode: 229 }) === 'a');
  d.getElementById('a').dispatchEvent(new w.Event('compositionend', { bubbles: true }));
  A('compositionend 直後の Enter: 動かない', enter('a') === 'a');
  await new Promise(r => setTimeout(r, 120));
  A('120ms 後の Enter: 動く', enter('a') === 'b1');

  // §1 数値入力
  w.setupNumericInput('a', { withCommas: true });
  w.setupNumericInput('b1');
  const set = (id, v) => { const el = d.getElementById(id); el.value = v; el.dispatchEvent(new w.Event('input')); return el; };
  let el = set('a', '３５６０，000');
  A('入力中: 全角→半角・カンマ除去・カンマ無し', el.value === '3560000');
  el.dispatchEvent(new w.Event('blur'));
  A('blur: 金額欄はカンマ付与', el.value === '3,560,000');
  el = set('b1', '１２'); el.dispatchEvent(new w.Event('blur'));
  A('blur: 人数欄はカンマ無し', el.value === '12');
  const kd = new w.KeyboardEvent('keydown', { key: '-', cancelable: true }); d.getElementById('a').dispatchEvent(kd);
  A('金額欄で - は入力不可', kd.defaultPrevented);

  // 4. テンプレートの点検
  for (const f of fs.readdirSync(path.join(ROOT, 'templates')).filter(x => x.endsWith('.html'))) {
    const s = fs.readFileSync(path.join(ROOT, 'templates', f), 'utf8');
    const hasField = /<(input|select) id="[^"]+"[^>]*(inputmode="numeric"|data-step)/.test(s) || /inputmode="numeric"/.test(s);
    if (!hasField) continue;
    A(`${f}: ui-input.js を読み込む`, s.includes('/js/core/shared/ui-input.js?v=__JS_V__'));
    A(`${f}: 自前の toHalfWidth / setupNumericInput を持たない`, !/function (toHalfWidth|setupNumericInput|setupNum)\(/.test(s));
    A(`${f}: type="number" を使わない`, !/type="number"/.test(s));
    const steps = (s.match(/data-step="/g) || []).length, ends = (s.match(/data-step-end/g) || []).length;
    A(`${f}: data-step あり（${steps}）・終了マーク 1 つ（${ends}）`, steps > 0 && ends === 1);
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
