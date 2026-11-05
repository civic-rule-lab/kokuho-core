#!/usr/bin/env node
/**
 * test-provenance-events.cjs — M6: 根拠節の計測（result_shown / provenance_view / provenance_click）の検証
 *
 * 何を守るか:
 *   1. 3 つのイベントがテンプレート 2 本（kokuho-simple / kokuho-income）に入っていること
 *   2. 計測スクリプトが入力欄や金額に触れないこと（送るのは calc_type / prov_pos / prov_state / host だけ）
 *   3. jsdom で実際に発火し、パラメータに数値入力が混ざらないこと
 *   4. 生成器が data-prov-pos / data-prov-state を付け、PROVENANCE_AB で配置が切り替わること
 *
 */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { JSDOM } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');
let fails = 0, passes = 0;
function A(name, ok) { if (ok) { passes++; console.log('  ✓ ' + name); } else { fails++; console.log('  ✗ ' + name); } }

const FORBIDDEN_IN_SCRIPT = ['getElementById("income")', 'memberIncome', 'fixedAssetTax', 'amount', '.value', 'toLocaleString', 'innerText', 'textContent'];

function trackingScript(html) {
  const m = html.match(/<!-- M6: [^\n]*-->\n<script>([\s\S]*?)<\/script>/);
  return m ? m[1] : '';
}

// ── 1・2: テンプレートの静的検査 ──────────────────────────────
for (const [tpl, ctype] of [['templates/kokuho-simple.html', 'simple'], ['templates/kokuho-income.html', 'income']]) {
  console.log(tpl);
  const html = fs.readFileSync(path.join(ROOT, tpl), 'utf8');
  const sc = trackingScript(html);
  A('計測スクリプトがある', sc.length > 0);
  for (const ev of ['result_shown', 'provenance_view', 'provenance_click']) A(`イベント ${ev} を送る`, sc.includes(`"${ev}"`));
  A(`calc_type が "${ctype}"`, sc.includes(`calc_type:  "${ctype}"`));
  const hit = FORBIDDEN_IN_SCRIPT.filter((w) => sc.includes(w));
  A(`入力欄・金額・本文に触れない${hit.length ? '（検出: ' + hit.join('・') + '）' : ''}`, hit.length === 0);
  A('gtag が無ければ何もしない', sc.includes('if (typeof window.gtag !== "function") return;'));
  A('__PROVENANCE_TOP__ が #result の直後にある', /id="result">[^\n]*<\/div>\n__PROVENANCE_TOP__\n/.test(html));
}

// ── 3: jsdom で発火を確かめる ─────────────────────────────────
function buildPage(tpl, { withIO }) {
  let html = fs.readFileSync(path.join(ROOT, tpl), 'utf8');
  const prov = '<section class="provenance" data-prov-pos="after_table" data-prov-state="verified"><h2>この数値の根拠</h2>'
    + '<p>出典: <a href="https://www.city.example.lg.jp/kokuho/ritsu.html" target="_blank" rel="noopener">公式ページ ↗</a></p></section>';
  const fill = {
    '__CANONICAL_URL__': 'https://kokuho-keisan.jp/x/y/', '__CITY_NAME__': 'テスト市', '__CITY_SLUG__': 'y', '__CSS_V__': 'x',
    '__FISCAL_YEAR_LABEL__': '令和8年度', '__INTRO_TEXT__': '', '__JSON_LD__': '{}', '__JS_V__': 'x', '__META_DESC__': '',
    '__PREFECTURE_DESC__': '', '__PUBLISH_YEAR__': '2026', '__RATE_TABLE__': prov, '__PROVENANCE_TOP__': '',
    '__STANDARD_NOTE__': '', '__TRUST_BADGE__': '', '__CALC_EXAMPLES__': '', '__OPERATOR_FOOTER__': '',
  };
  for (const [k, v] of Object.entries(fill)) html = html.split(k).join(v);
  // エンジンは読まない（結果の DOM は手で書き換える）。gtag.js も読まない。
  html = html.replace(/<script src="[^"]+"><\/script>/g, '').replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
  // テンプレート自身が function gtag(){dataLayer.push(arguments)} を定義するので、スタブではなく dataLayer を読む
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url: 'https://kokuho-keisan.jp/x/y/',
    beforeParse(w) {
      if (withIO) {
        w.IntersectionObserver = class { constructor(cb) { this.cb = cb; } observe(el) { this.cb([{ target: el, intersectionRatio: 0.6 }]); } disconnect() {} };
      }
    },
  });
  const calls = () => Array.from(dom.window.dataLayer || [], (a) => Array.from(a));
  return { dom, calls };
}

async function domChecks(tpl, ctype) {
  console.log(tpl + '（jsdom）');
  const { dom, calls } = buildPage(tpl, { withIO: true });
  const w = dom.window, d = w.document;
  const evs = () => calls().filter((c) => c[0] === 'event');
  A('読み込み直後は result_shown を送らない', !evs().some((c) => c[1] === 'result_shown'));
  A('根拠節が見えたら provenance_view を 1 回送る', evs().filter((c) => c[1] === 'provenance_view').length === 1);
  // 結果の描画を模す（金額を含む）
  d.getElementById('result').innerHTML = '<div class="result-row"><div class="result-label">医療分</div><div class="amount">123,456 円</div></div>';
  await new Promise((r) => setTimeout(r, 10));
  d.getElementById('result').innerHTML += '<div class="result-row"><div class="result-label">支援分</div><div class="amount">7,890 円</div></div>';
  await new Promise((r) => setTimeout(r, 10));
  const shown = evs().filter((c) => c[1] === 'result_shown');
  A('結果が出たら result_shown を 1 回だけ送る', shown.length === 1);
  d.querySelector('section.provenance a').dispatchEvent(new w.MouseEvent('click', { bubbles: true, cancelable: true }));
  const clicks = evs().filter((c) => c[1] === 'provenance_click');
  A('出典リンクのクリックで provenance_click を送る', clicks.length === 1);
  A('provenance_click の host は出典のホスト名', clicks[0] && clicks[0][2].host === 'www.city.example.lg.jp');
  for (const c of evs()) {
    const p = c[2] || {};
    A(`${c[1]}: calc_type=${ctype}・prov_pos・prov_state を持つ`, p.calc_type === ctype && p.prov_pos === 'after_table' && p.prov_state === 'verified');
    const keys = Object.keys(p).sort().join(',');
    A(`${c[1]}: パラメータは既知の 4 つ以内（${keys}）`, keys === 'calc_type,prov_pos,prov_state' || keys === 'calc_type,host,prov_pos,prov_state');
    A(`${c[1]}: 値に 3 桁以上の数字が無い`, Object.values(p).every((v) => typeof v === 'string' && !/\d{3,}/.test(v)));
  }
  // IntersectionObserver が無い環境でも壊れない
  const { calls: c2 } = buildPage(tpl, { withIO: false });
  A('IntersectionObserver が無くてもエラーにならず、provenance_view を送らない', !c2().some((c) => c[1] === 'provenance_view'));
}

// ── 4: 生成器の出力 ───────────────────────────────────────────
function generate(slug, ab) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'm6-gen-'));
  const env = { ...process.env, GEN_OUT_DIR: out };
  if (ab) env.PROVENANCE_AB = ab; else delete env.PROVENANCE_AB;
  execFileSync('node', ['scripts/generate-official-pages.js', slug], { cwd: ROOT, env, stdio: ['ignore', 'ignore', 'inherit'] });
  const files = [];
  (function walk(dir) { for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); if (fs.statSync(p).isDirectory()) walk(p); else if (p.endsWith('.html')) files.push(p); } })(out);
  return files.map((f) => [path.relative(out, f), fs.readFileSync(f, 'utf8')]);
}

function generatorChecks() {
  console.log('生成器（adachi）');
  const reg = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry/index.json'), 'utf8'));
  const list = Array.isArray(reg) ? reg : (reg.municipalities || Object.values(reg));
  const entry = list.find((m) => m.citySlug === 'adachi');
  A('registry に adachi がある', !!entry && /^\d{5}$/.test(String(entry.cityCode)));
  const even = Number(String(entry.cityCode)[4]) % 2 === 0;
  for (const [ab, expectBelow] of [[null, false], ['even', even], ['odd', !even]]) {
    const pages = generate('adachi', ab).filter(([rel]) => /\/(index|income)\.html$/.test(rel));
    A(`PROVENANCE_AB=${ab ?? '未設定'}: index と income が生成される`, pages.length >= 2);
    for (const [rel, html] of pages) {
      A(`${rel}: __PROVENANCE_TOP__ が残っていない`, !html.includes('__PROVENANCE_TOP__'));
      const secs = html.match(/<section class="provenance"[^>]*>/g) || [];
      A(`${rel}: 根拠節は 1 つ`, secs.length === 1);
      if (secs.length !== 1) continue;
      const pos = (secs[0].match(/data-prov-pos="([a-z_]+)"/) || [])[1];
      const state = (secs[0].match(/data-prov-state="([a-z]+)"/) || [])[1];
      A(`${rel}: data-prov-pos=${pos}（期待 ${expectBelow ? 'below_result' : 'after_table'}）`, pos === (expectBelow ? 'below_result' : 'after_table'));
      A(`${rel}: data-prov-state は 4 値のどれか（${state}）`, ['verified', 'standard', 'primary', 'pending'].includes(state));
      const iRes = html.indexOf('id="result"'), iSec = html.indexOf('<section class="provenance"');
      const after = html.slice(iRes).search(/<table|class="rate-table"/);
      const iRate = after < 0 ? -1 : iRes + after;
      if (expectBelow) A(`${rel}: 根拠節が #result の直後（料率表より前）にある`, iSec > iRes && (iRate < 0 || iSec < iRate));
      else A(`${rel}: 根拠節が料率表の後にある`, iSec > iRes && iRate >= 0 && iSec > iRate);
    }
  }
  let bad = false; try { generate('adachi', 'both'); } catch (_) { bad = true; }
  A('PROVENANCE_AB に不正値を渡すと失敗する', bad);
}

(async () => {
  await domChecks('templates/kokuho-simple.html', 'simple');
  await domChecks('templates/kokuho-income.html', 'income');
  generatorChecks();
  console.log(`\n${passes} passed, ${fails} failed`);
  process.exit(fails ? 1 : 0);
})();
