/**
 * ui-input.js — 制度計算サイト共通の入力 UI（数値入力欄・Enter で次の欄へ移動）。
 *
 * 正本の仕様: civic-site-common-rules スキル references/ui-rules.md §1・§2。
 * 全サイト・全テンプレートはこのファイルを <script> で読み込む。複製・再実装はしない
 * （サイトごとに書き直したことが仕様分裂の原因だった）。
 *
 * ── 数値入力欄（§1） ──
 *   setupNumericInput(id, { withCommas: true|false })
 *   ・入力中: 全角数字→半角、数字以外を除去。入力中にカンマは入れない
 *   ・カンマ付与: blur と compositionend（IME 確定）のみ。withCommas の欄だけ
 *   ・- + e E は入力不可
 *
 * ── Enter で次の欄へ（§2「段・横枠」方式） ──
 *   各 <input>/<select> に data-step="2b" のように位置を明示する（段=数字、横枠=a,b,c…。横枠が無ければ数字だけ）。
 *   進む順は 1 → 2a → 2b → 3 …。非表示（display:none の中）や disabled の欄は飛ばす。
 *   最後の欄には data-step-end を付ける（終了マーク）。その欄で Enter を押しても何もしない
 *   （移動も blur もしない）。次の欄が無いときも同じ。
 *   IME（日本語入力）の変換確定の Enter では何もしない。2026-10-07 にふるさと納税の本番で、
 *   確定前に focus を移した結果、確定した文字が二重に入った（3,560,000 → 35,600,003,560,000）。
 *   確定の Enter は Chrome 等では isComposing=true、Safari では compositionend の直後に keyCode 229 で届く。
 *   両方に加え、compositionend 直後（100ms 以内）の Enter も無視する。
 *   チェックボックス・ラジオ・hidden は移動の対象にしない（data-step を付けない）。
 */
(function (global) {
  'use strict';

  function toHalfWidth(str) {
    return String(str)
      .replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/[，、,]/g, "");
  }

  function setupNumericInput(id, options) {
    const el = document.getElementById(id);
    if (!el) return;
    const withCommas = !!(options && options.withCommas);
    let isComposing = false;

    function clean() {
      if (isComposing) return;
      el.value = toHalfWidth(el.value).replace(/[^\d]/g, "");
    }

    function commit() {
      const raw = toHalfWidth(el.value).replace(/[^\d]/g, "");
      if (!raw) { el.value = ""; return; }
      el.value = withCommas ? Number(raw).toLocaleString("ja-JP") : raw;
    }

    el.addEventListener('compositionstart', () => { isComposing = true; });
    el.addEventListener('compositionend', () => {
      isComposing = false;
      setTimeout(commit, 0);
    });
    el.addEventListener('input', clean);
    el.addEventListener('blur', commit);
    el.addEventListener('keydown', (e) => {
      if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
        e.preventDefault();
      }
    });
  }

  // ── Enter で次の欄へ ──
  const STEP_RE = /^(\d+)([a-z]?)$/;
  function parseStep(el) {
    const m = STEP_RE.exec((el.getAttribute('data-step') || '').trim());
    if (!m) return null;
    return { row: Number(m[1]), col: m[2] ? m[2].charCodeAt(0) - 96 : 0 };
  }
  function stepKey(el) {
    const s = parseStep(el);
    return s ? s.row * 100 + s.col : Infinity;
  }
  function isStepTarget(el) {
    if (!el || !el.matches || !el.matches('input[data-step], select[data-step]')) return false;
    if (el.tagName === 'INPUT') {
      const t = (el.getAttribute('type') || 'text').toLowerCase();
      if (t === 'checkbox' || t === 'radio' || t === 'hidden' || t === 'button' || t === 'submit') return false;
    }
    return true;
  }
  function isVisible(el) {
    if (el.disabled) return false;
    if (el.offsetParent === null) return false;   // display:none の中（祖先を含む）
    return true;
  }
  function nextStep(from) {
    const all = Array.prototype.slice.call(document.querySelectorAll('input[data-step], select[data-step]'))
      .filter(isStepTarget);
    const cur = stepKey(from);
    let best = null, bestKey = Infinity;
    for (const el of all) {
      if (el === from) continue;
      const k = stepKey(el);
      if (k <= cur || k >= bestKey) continue;
      if (!isVisible(el)) continue;
      best = el; bestKey = k;
    }
    return best;
  }

  let lastCompositionEnd = 0;
  function setupEnterFlow() {
    if (setupEnterFlow._done) return;
    setupEnterFlow._done = true;
    document.addEventListener('compositionend', () => { lastCompositionEnd = Date.now(); }, true);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      const t = e.target;
      if (!isStepTarget(t)) return;
      if (e.isComposing || e.keyCode === 229) return;            // IME 確定の Enter
      if (Date.now() - lastCompositionEnd < 100) return;          // 確定直後の Enter（Safari の取りこぼし対策）
      e.preventDefault();
      if (t.hasAttribute('data-step-end')) return;                // 終了マーク: 何もしない
      const next = nextStep(t);
      if (next) next.focus();                                     // focus 移動で元の欄が blur → カンマ付与（§1）
    });
  }

  global.toHalfWidth = toHalfWidth;
  global.setupNumericInput = setupNumericInput;
  global.setupEnterFlow = setupEnterFlow;
  if (typeof document !== 'undefined') setupEnterFlow();
})(typeof window !== 'undefined' ? window : globalThis);
