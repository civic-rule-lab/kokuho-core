#!/usr/bin/env node
/**
 * test-top-selector-dom.cjs — 2つのトップ（制度の選択）を jsdom で検証する（TASKS X173-7）
 *
 * 1. seido-keisan.jp トップ（生成物 seido-index.html）
 *    - 自治体ごとの「後期あり」の印（CITY_INDEX の sys.kouki）が、後期ページ {pref}/{slug}/kouki/index.html の有無と一致する
 *    - 千代田区で「後期高齢者医療」を選ぶと選択可能で、遷移先が /tokyo/chiyoda/kouki/
 * 2. kokuho-keisan.jp トップ（生成物 index.html ＋ js/selector.js）
 *    - 千代田区で「後期高齢者医療」を選ぶと選択可能で、遷移先が https://seido-keisan.jp/tokyo/chiyoda/kouki/
 *    - 国保の無い泊村（国後）で既定が後期へ切り替わる（FG-05）・保育料が公開済み自治体だけ選べる（FG-04）
 *    （1. には後期だけ公開の 3 自治体が一覧に載ること（FG-06）も足した）
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

  // 後期だけ公開の自治体（jumin/kaigo/hoiku なし）も一覧に載り、後期ページへ行ける（S1-1 FG-06）
  for (const [pn, slug, url] of [['北海道', 'tomari-kunashir', '/hokkaido/tomari-kunashir/kouki/'], ['和歌山県', 'taiji', '/wakayama/taiji/kouki/'], ['高知県', 'okawamura', '/kochi/okawamura/kouki/']]) {
    const inIdx = !!(idx[pn] && idx[pn].cities.some((c) => c.slug === slug));
    A(`${slug} が一覧に載っている`, inIdx);
    if (!inIdx) continue;
    selectValue(d, w, 'pref', pn);
    selectValue(d, w, 'city', slug);
    const sysEl = d.getElementById('system');
    A(`${slug}: 既定の制度が選択可能なものに切り替わる`, !sysEl.selectedOptions[0].disabled, sysEl.value);
    selectValue(d, w, 'system', 'kouki');
    w.__go = undefined;
    w.goCity();
    A(`${slug}: 後期を選ぶと ${url} へ`, w.__go === url, String(w.__go));
  }
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

  // 国保の無い自治体（tomari-kunashir＝kouki のみ）では既定が有効な制度へ切り替わり、alert で終わらない（S1-1 FG-05）
  const sysEl = d.getElementById('system');
  sysEl.value = 'kokuho';
  selectValue(d, w, 'prefecture', 'hokkaido');
  selectValue(d, w, 'municipality', 'tomari-kunashir');
  A('泊村（国後）: 国保は選択不可', [...sysEl.options].find((o) => o.value === 'kokuho').disabled);
  A('泊村（国後）: 既定が後期に切り替わる', sysEl.value === 'kouki', sysEl.value);
  let alerted = null;
  w.alert = (m) => { alerted = m; };
  w.__go = undefined;
  w.goPage();
  A('泊村（国後）: そのまま開くと後期ページへ（alert なし）', alerted === null && w.__go === 'https://seido-keisan.jp/hokkaido/tomari-kunashir/kouki/', `alert=${alerted} go=${w.__go}`);

  // 保育料の選択肢（S1-1 FG-04）: 公開済み自治体だけ選択可能
  const hoiku = [...sysEl.options].find((o) => o.value === 'hoiku');
  A('選択肢に「保育料」がある', !!hoiku);
  selectValue(d, w, 'prefecture', 'hokkaido');
  selectValue(d, w, 'municipality', 'sapporo');
  A('札幌市では保育料を選択できる', !!hoiku && !hoiku.disabled);
  sysEl.value = 'hoiku';
  w.__go = undefined;
  w.goPage();
  A('札幌市の保育料の遷移先が https://seido-keisan.jp/hokkaido/sapporo/hoiku/', w.__go === 'https://seido-keisan.jp/hokkaido/sapporo/hoiku/', String(w.__go));
  selectValue(d, w, 'prefecture', 'aichi');
  selectValue(d, w, 'municipality', 'agui');
  A('阿久比町（保育料未公開）では保育料を選択できない', !!hoiku && hoiku.disabled);
  A('阿久比町: 保育料から有効な制度へ切り替わる', !!hoiku && sysEl.value !== 'hoiku' && !!sysEl.selectedOptions[0] && !sysEl.selectedOptions[0].disabled, sysEl.value);
}

console.log(`\n結果: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
