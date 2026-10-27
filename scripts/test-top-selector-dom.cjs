#!/usr/bin/env node
/**
 * test-top-selector-dom.cjs — 2つのトップ（制度の選択）を jsdom で検証する（TASKS X173-7）
 *
 * 1. seido-keisan.jp トップ（生成物 seido-index.html）
 *    - 自治体ごとの「後期あり」の印（CITY_INDEX の sys.kouki）が、後期ページ {pref}/{slug}/kouki/index.html の有無と一致する
 *    - 千代田区で「後期高齢者医療」を選ぶと選択可能で、遷移先が /tokyo/chiyoda/kouki/
 * 2. kokuho-keisan.jp トップ（生成物 index.html ＋ js/selector.js）
 *    - 千代田区で「後期高齢者医療」を選ぶと選択可能で、遷移先が https://seido-keisan.jp/tokyo/chiyoda/kouki/
 *
 * 遷移は jsdom で実行できないため、読み込む HTML／JS の location.href への代入を window.__go への代入に置き換えて見る。
 *
 * 実行: node scripts/generate-selector.js && node scripts/generate-seido-index.js && node scripts/test-top-selector-dom.cjs
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const A = (label, cond, detail) => { console.log(`${cond ? '✓' : '✗'} ${label}${!cond && detail ? ' — ' + detail : ''}`); cond ? pass++ : fail++; };
const stripGtag = (h) => h.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
function selectValue(d, w, id, value) {
  const el = d.getElementById(id);
  el.value = value;
  el.dispatchEvent(new w.Event('change', { bubbles: true }));
}

// ─── 1. seido-keisan.jp トップ ───
{
  console.log('\n== seido-index.html ==');
  let html = stripGtag(fs.readFileSync(path.join(ROOT, 'seido-index.html'), 'utf8'));
  const NAV = 'location.href=s.url(prefSlug,cs);';
  A('遷移の行が1か所ある（置き換えの前提）', html.split(NAV).length === 2);
  html = html.replace(NAV, 'window.__go=s.url(prefSlug,cs);');
  const dom = new JSDOM(html, { runScripts: 'dangerously' });
  const w = dom.window, d = w.document;

  const idx = w.eval('CITY_INDEX');
  let cities = 0, bad = [];
  for (const pref of Object.values(idx)) {
    for (const c of pref.cities) {
      cities++;
      const has = fs.existsSync(path.join(ROOT, pref.slug, c.slug, 'kouki', 'index.html'));
      if (!!(c.sys && c.sys.kouki) !== has) bad.push(`${pref.slug}/${c.slug}: 印=${!!(c.sys && c.sys.kouki)}・ページ=${has}`);
    }
  }
  A(`掲載 ${cities} 自治体の「後期あり」の印が後期ページの有無と一致`, cities > 0 && bad.length === 0, bad.slice(0, 5).join(' / '));

  selectValue(d, w, 'pref', '東京都');
  selectValue(d, w, 'city', 'chiyoda');
  const opt = [...d.getElementById('system').options].find((o) => o.value === 'kouki');
  A('選択肢に「後期高齢者医療」がある', !!opt);
  A('千代田区では選択できる', !!opt && !opt.disabled);
  selectValue(d, w, 'system', 'kouki');
  A('ボタンの文言が後期になる', d.getElementById('go').textContent === '後期高齢者医療の計算を開く', d.getElementById('go').textContent);
  w.goCity();
  A('遷移先が /tokyo/chiyoda/kouki/', w.__go === '/tokyo/chiyoda/kouki/', String(w.__go));
}

// ─── 2. kokuho-keisan.jp トップ ───
{
  console.log('\n== index.html（kokuho-keisan.jp） ==');
  let js = fs.readFileSync(path.join(ROOT, 'js', 'selector.js'), 'utf8');
  const NAV = 'window.location.href = url;';
  A('遷移の行が1か所ある（置き換えの前提）', js.split(NAV).length === 2);
  js = js.replace(NAV, 'window.__go = url;');
  let html = stripGtag(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  const SRC = /<script src="\/js\/selector\.js\?v=[0-9a-z]+"><\/script>/;
  A('selector.js の読み込みが1か所ある', (html.match(new RegExp(SRC, 'g')) || []).length === 1);
  html = html.replace(SRC, () => '<script>' + js + '</script>');
  const dom = new JSDOM(html, { runScripts: 'dangerously' });
  const w = dom.window, d = w.document;

  selectValue(d, w, 'prefecture', 'tokyo');
  selectValue(d, w, 'municipality', 'chiyoda');
  const opt = [...d.getElementById('system').options].find((o) => o.value === 'kouki');
  A('選択肢に「後期高齢者医療」がある', !!opt);
  A('千代田区では選択できる', !!opt && !opt.disabled);
  d.getElementById('system').value = 'kouki';
  w.goPage();
  A('遷移先が https://seido-keisan.jp/tokyo/chiyoda/kouki/', w.__go === 'https://seido-keisan.jp/tokyo/chiyoda/kouki/', String(w.__go));
}

console.log(`\n結果: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
