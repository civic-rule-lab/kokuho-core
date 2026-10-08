#!/usr/bin/env node
/**
 * test-furusato-dom.cjs — ふるさと納税 控除上限額ページ（生成物 seido-furusato.html）を jsdom で検証
 *
 * 1. Enter の移動（UI 共通ルール §2）: 通常の Enter は次の欄へ、最後の欄では移動しない
 * 2. 日本語入力（IME）の変換確定の Enter（isComposing=true / keyCode 229）では欄を動かさない
 *    （2026-10-07 本番で、確定前に欄を移したため数字が移動先にも入り、最後の欄で二重になった）
 *    ※ IME による文字の挿入そのものは jsdom で再現できない。ここで見るのは「確定の Enter で欄が動かないこと」まで
 * 3. 計算: 単身・所得割 238,500・課税標準 2,410,000・総所得 3,560,000 → 上限 58,187 円（test-furusato.cjs の A と同じ手計算）
 * 4. 入力の取り違え対策（X173-20）: 計算に使った数字の表示と、所得控除が極端に大きいときの桁の注意
 *
 * 実行: node scripts/generate-seido-furusato.js && node scripts/test-furusato-dom.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(ROOT, 'seido-furusato.html'), 'utf8');
html = html.replace(/<script src="\/js\/core\/furusato\.js\?v=[0-9a-f]+"><\/script>/,
  () => '<script>' + fs.readFileSync(path.join(ROOT, 'js/core/furusato.js'), 'utf8') + '</script>');
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
const w = dom.window, d = w.document;
// jsdom はレイアウトを持たず offsetParent が常に null になるため、表示中として扱う
Object.defineProperty(w.HTMLElement.prototype, 'offsetParent', { get() { return this.parentNode; } });

(async () => {
// 入力欄の初期化（setupNumericInput）は DOMContentLoaded で走るので、それを待ってから操作する
if (d.readyState === 'loading') await new Promise((r) => d.addEventListener('DOMContentLoaded', r));

let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
function enter(id, extra) {
  const el = d.getElementById(id);
  el.focus();
  const ev = new w.KeyboardEvent('keydown', Object.assign({ key: 'Enter', bubbles: true, cancelable: true }, extra || {}));
  el.dispatchEvent(ev);
  return d.activeElement && d.activeElement.id;
}
function set(id, v) {
  const el = d.getElementById(id);
  el.value = v; el.dispatchEvent(new w.Event('input')); el.dispatchEvent(new w.Event('blur'));
}

A('通常の Enter: 所得割 → 課税標準額へ移動', enter('shotokuwari') === 'kazeiHyojun');
A('通常の Enter: 総所得金額 → 配偶者控除へ移動（カードをまたぐ）', enter('soShotoku') === 'spouse');
A('IME 変換確定の Enter（isComposing）: 所得割の欄から動かない', enter('shotokuwari', { isComposing: true }) === 'shotokuwari');
A('IME 変換確定の Enter（keyCode 229・Safari 型）: 課税標準額の欄から動かない', enter('kazeiHyojun', { keyCode: 229 }) === 'kazeiHyojun');
A('IME 変換確定の Enter（isComposing）: 総所得金額の欄から動かない', enter('soShotoku', { isComposing: true }) === 'soShotoku');
A('最後の欄の通常の Enter: 次へは移動しない', enter('sanrinTaishoku') !== 'sanrinTaishoku' && d.activeElement.id !== 'shotokuwari');

set('shotokuwari', '238500'); set('kazeiHyojun', '2410000'); set('soShotoku', '3560000');
A('入力欄はカンマ付きに整形される（3,560,000）', d.getElementById('soShotoku').value === '3,560,000');
w.calcFurusato();
const out = d.getElementById('result').textContent.replace(/\s+/g, '');
A('計算: 上限 58,187 円（手計算と一致）', out.includes('58,187円'));
A('計算: 人的控除差調整額 610,000 円', out.includes('人的控除差調整額610,000円'));

// 入力の取り違え対策（X173-20）
A('入力の表示: 計算に使った3つの数字が結果に出る', out.includes('所得割額238,500円・課税標準額2,410,000円・総所得金額3,560,000円'));
A('通常の入力（所得控除 115万円・総所得の32%）では桁の注意を出さない', !out.includes('桁が合っているか'));
function calcWith(sw, kz, so) {
  set('shotokuwari', sw); set('kazeiHyojun', kz); set('soShotoku', so);
  w.calcFurusato();
  return d.getElementById('result').textContent.replace(/\s+/g, '');
}
A('総所得の桁を1つ多く打った（35,600,000）→ 桁の注意を出す', calcWith('238500', '2410000', '35600000').includes('桁が合っているか'));
A('課税標準の桁を1つ少なく打った（241,000）→ 桁の注意を出す', calcWith('238500', '241000', '3560000').includes('桁が合っているか'));
A('注意を出しても計算結果は出す', calcWith('238500', '241000', '3560000').includes('控除上限額の目安'));
A('総所得が少なく基礎控除だけで8割を超える方（総所得80万・課税標準10万）には出さない', !calcWith('10000', '100000', '800000').includes('桁が合っているか'));
A('所得控除 200万円以上でも総所得の8割未満（総所得600万・課税標準140万＝77%）なら出さない', !calcWith('140000', '1400000', '6000000').includes('桁が合っているか'));

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
})();
