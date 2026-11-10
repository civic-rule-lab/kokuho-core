#!/usr/bin/env node
/**
 * test-seido-tpl-dom.cjs — 後期・介護・住民税・保育料・家計簿テンプレの表示まわり（S1 第2期 修正2回目・担当 B）
 *
 * テンプレートを直接読んで検査する（生成済みページは merge 後にまとめて再生成するため、ここでは見ない）。
 *   1. 出典節（S1-1 ID-03）: 各テンプレに __SOURCE_SECTION__ があり、生成器が置換する。
 *      scripts/lib/seido-provenance.cjs が許可ホストはリンク・許可外は「出典ページ未確認」の文字にし、
 *      確認状態（verified / inferred / needs_update / データ無し）を書き分ける。
 *   2. 注記（S1-1 ID-02・ID-07）: 担当テンプレに「※…<br>」の段落が残っていない。「計算の前提」見出しがある。
 *   3. ラベル（S1-1 ID-05）: kouki-income・seido-shotoku の入力欄はすべて label に結線されている。
 *   4. 介護かんたん（S1-1 W2C-05）: 課税状況の選択と所得が食い違えば結果欄の上に注意。計算は選択どおり続ける。
 *   5. 家計簿（S1-1 W2a-02・RF-1・RF-2）: 住民税をどの税率で計算したかを住民税カードの下に出す。
 *      2026 年度のデータが無く 2025 年度に下がったら「令和7年度の料率で計算」と出す。
 *
 * 実行: node scripts/test-seido-tpl-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const prov = require('./lib/seido-provenance.cjs');
const { calculateJumin, JUMIN_DEFAULTS } = require(path.join(ROOT, 'js/core/jumin.js'));

let pass = 0, fail = 0;
const A = (l, c, extra) => { console.log(`${c ? '✓' : '✗'} ${l}${!c && extra ? ' — ' + extra : ''}`); c ? pass++ : fail++; };
const tpl = (n) => fs.readFileSync(path.join(ROOT, 'templates', n), 'utf8');

// ── 1. 出典節 ──
console.log('== 出典節（ID-03） ==');
for (const n of ['kouki-simple.html', 'kouki-income.html', 'kaigo-simple.html', 'jumin-simple.html', 'jumin-income.html', 'hoiku-simple.html', 'city-integrated.html']) {
  const s = tpl(n);
  A(`${n}: __SOURCE_SECTION__ が 1 つ`, (s.match(/__SOURCE_SECTION__/g) || []).length === 1);
  // 節の順（ui-rules §4-3）: 計算の前提 → 出典
  A(`${n}: 「計算の前提」の後に出典節`, s.indexOf('<h2>計算の前提</h2>') >= 0 && s.indexOf('<h2>計算の前提</h2>') < s.indexOf('__SOURCE_SECTION__'));
}
for (const [f, ph] of [['generate-system-pages.js', '"__SOURCE_SECTION__"'], ['generate-jumin-pages.js', "'__SOURCE_SECTION__'"], ['generate-hoiku-pages.js', "'__SOURCE_SECTION__'"]]) {
  A(`${f}: __SOURCE_SECTION__ を置換する`, fs.readFileSync(path.join(ROOT, 'scripts', f), 'utf8').includes(ph));
}
{
  const kouki = { status: 'verified', source: { rates: { url: 'https://www.mhlw.go.jp/x.pdf', title: '厚労省資料', retrievedAt: '2026-06-28' }, kansho: { url: 'https://www.example-kouiki.jp/a', retrievedAt: '2026-06-28' } } };
  const h = prov.buildSourceSection('kouki', kouki, {});
  A('許可ホスト（go.jp）はリンク・↗ 付き', /<a href="https:\/\/www\.mhlw\.go\.jp\/x\.pdf" target="_blank" rel="noopener">厚労省資料 ↗<\/a>/.test(h));
  A('許可外ホストはリンクにせず「出典ページ未確認」', !h.includes('example-kouiki') && h.includes('（出典ページ未確認）'));
  A('verified は「最終確認: 2026年6月28日」', h.includes('最終確認: 2026年6月28日'));
  const inf = prov.buildSourceSection('jumin', { status: 'inferred', prefRate: 0.04, prefPerCapita: 1500, source: { url: 'https://www.pref.aichi.jp/a.html', retrievedAt: '2026-10-09', scope: 'prefecture' } }, { prefName: '愛知県' });
  A('inferred の住民税: 推計と書き、確認済みと書かない', inf.includes('推計') && !inf.includes('照合しました') && inf.includes('愛知県の県民税の案内'));
  const nu = prov.buildSourceSection('kaigo', { status: 'needs_update', source: { url: 'https://www.mhlw.go.jp/b.pdf', pageTitle: '一覧', retrievedAt: '2026-07-08' } }, {});
  A('needs_update: 更新を確認中と書く', nu.includes('更新を確認中') && !nu.includes('照合しました'));
  const none = prov.buildSourceSection('jumin', null, {});
  const kinto = JUMIN_DEFAULTS.prefPerCapita + JUMIN_DEFAULTS.cityPerCapita + JUMIN_DEFAULTS.forestTax;
  A('住民税データ無し: 標準税率で計算と書く', none.includes('標準税率') && none.includes(kinto.toLocaleString('ja-JP') + '円'));
  const kk = prov.buildKakeiboSourceSection('nagoya', { prefName: '愛知県' });
  A('家計簿（名古屋）: 読む制度ごとに 1 行（住民税・国保・後期・介護・保育料）', (kk.match(/<li>/g) || []).length === 5);
}

// ── 2. 注記 ──
console.log('\n== 注記の箇条書き（ID-02・ID-07） ==');
for (const n of ['kouki-simple.html', 'kouki-income.html', 'kaigo-simple.html', 'jumin-simple.html', 'jumin-income.html', 'hoiku-simple.html', 'city-integrated.html', 'seido-haito.html', 'seido-jieigyo.html']) {
  const s = tpl(n);
  const html = s.replace(/<script[\s\S]*?<\/script>/g, '');   // 結果欄に JS で出す注意は別扱い
  A(`${n}: 「※…<br>」の段落が無い`, !/※[^<]*<br>/.test(html));
  A(`${n}: 「計算の前提」見出しがある`, html.includes('<h2>計算の前提</h2>'));
}

// ── 3. ラベル ──
console.log('\n== ラベルの結線（ID-05） ==');
for (const n of ['kouki-income.html', 'seido-shotoku.html', 'kouki-simple.html', 'kaigo-simple.html', 'jumin-simple.html', 'jumin-income.html', 'city-integrated.html']) {
  const d = new JSDOM(tpl(n)).window.document;
  const bad = [...d.querySelectorAll('input,select,textarea')].filter(el => el.type !== 'hidden'
    && !((el.id && d.querySelector(`label[for="${el.id}"]`)) || el.closest('label'))).map(el => el.id);
  A(`${n}: label の無い入力欄 0`, bad.length === 0, bad.join(' '));
}
{
  const s = tpl('hoiku-simple.html');
  A('hoiku-simple: JS で作る label に for がある（素の <label> が残らない）', !s.includes("'<label>") && !s.includes('+\'<label>'));
  A('hoiku-simple: 年齢にクラス年齢（4月1日時点）の注記（HOIKU-06）', s.includes('クラス年齢（4月1日時点の年齢）'));
}

// ── 4. 介護かんたんの課税状況チェック ──
function inlineEngines(html, files) {
  for (const f of files) {
    html = html.replace(new RegExp(`<script src="/js/core/${f.replace('/', '\\/')}\\.js\\?v=x"><\\/script>`), () => '<script>' + fs.readFileSync(path.join(ROOT, `js/core/${f}.js`), 'utf8') + '</script>');
  }
  return html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
}
async function load(html, url, fetchImpl) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url,
    beforeParse(w) { if (fetchImpl) w.fetch = fetchImpl; } });
  const w = dom.window;
  const errs = [];
  w.addEventListener('error', e => errs.push(String(e.error || e.message)));
  await new Promise(r => { if (w.document.readyState === 'complete') r(); else w.addEventListener('load', r); });
  return { w, errs };
}

(async () => {
  console.log('\n== 介護かんたん: 課税状況と所得の食い違い（W2C-05） ==');
  {
    const kaigo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/municipalities/nagoya/kaigo-2026.json'), 'utf8'));
    let html = tpl('kaigo-simple.html');
    const map = { '__KAIGO_DATA__': JSON.stringify(kaigo), '__CITY_SLUG__': 'nagoya', '__PUBLISH_YEAR__': '2026', '__JUMIN_KYUCHI__': '1',
      '__JS_V__': 'x', '__CSS_V__': 'x', '__SOURCE_SECTION__': '', '__OPERATOR_FOOTER__': '' };
    for (const [k, v] of Object.entries(map)) html = html.split(k).join(v);
    A('kaigo-simple: jumin.js を読み込む', html.includes('/js/core/jumin.js?v=x'));
    html = inlineEngines(html, ['shared/ui-input', 'shared/income', 'jumin', 'kaigo']);
    const { w, errs } = await load(html, 'https://seido-keisan.jp/aichi/nagoya/kaigo/');
    const d = w.document;
    const run = (pension, status) => {
      d.getElementById('pension').value = String(pension); d.getElementById('salary').value = ''; d.getElementById('other').value = '';
      d.getElementById('taxstatus').value = status; w.calcKaigo();
      const r = d.getElementById('result');
      return { warn: r.querySelector('.tax-warn'), text: r.textContent };
    };
    const j400 = calculateJumin(null, { pension: 4_000_000, age: 70, kyuchi: 1 });
    const j100 = calculateJumin(null, { pension: 1_000_000, age: 70, kyuchi: 1 });
    A(`前提: 年金400万（70歳・1級地）は課税（${j400.isTaxable}）・年金100万は非課税（${j100.isTaxable}）`, j400.isTaxable === true && j100.isTaxable === false);
    let r = run(4_000_000, 'house_nontax');
    A('年金400万 ×「世帯全員が住民税非課税」: 注意を出す', !!r.warn && r.warn.textContent.includes('住民税がかかる見込み'));
    A('同: 結果欄の先頭に出し、計算（段階・年額）は続ける', !!r.warn && d.getElementById('result').firstElementChild === r.warn && r.text.includes('あなたの段階') && r.text.includes('介護保険料（年額・概算）'));
    r = run(4_000_000, 'self_nontax');
    A('年金400万 ×「本人は非課税」: 注意を出す', !!r.warn);
    r = run(4_000_000, 'self_tax');
    A('年金400万 ×「本人が住民税課税」: 注意を出さない', !r.warn);
    r = run(1_000_000, 'self_tax');
    A('年金100万 ×「本人が住民税課税」: 非課税の見込みと注意', !!r.warn && r.warn.textContent.includes('非課税になる見込み'));
    r = run(1_000_000, 'house_nontax');
    A('年金100万 ×「世帯全員が住民税非課税」: 注意を出さない', !r.warn);
    A('介護かんたん: JS エラーなし', errs.length === 0, errs.join(' / '));
  }

  console.log('\n== 家計簿: 住民税の税率の出所・年度（W2a-02・RF-1・RF-2） ==');
  {
    const fillMap = {
      '__CITY_SLUG__': 'testcity', '__PREF_SLUG__': 'aichi', '__CITY_NAME__': 'テスト市', '__FISCAL_YEAR_LABEL__': '令和8年度', '__META_DESC__': 'test',
      '__CANONICAL_URL__': 'https://seido-keisan.jp/aichi/testcity/kakeibo/', '__JSON_LD__': '{}', '__CSS_V__': 'x', '__JS_V__': 'x',
      '__LINK_JUMIN_BLOCK__': '', '__LINK_KOKUHO__': 'https://kokuho-keisan.jp/aichi/testcity/', '__JUMIN_KYUCHI__': '1', '__HAS_JUMIN_PAGE__': 'true', '__KAIGO_YEAR__': '2026',
      '__SOURCE_SECTION__': '', '__OPERATOR_FOOTER__': '',
    };
    let base = tpl('city-integrated.html');
    for (const [k, v] of Object.entries(fillMap)) base = base.split(k).join(v);
    base = inlineEngines(base, ['shared/ui-input', 'shared/income', 'jumin', 'kokuho', 'kaigo', 'kouki', 'hoiku', 'shaho', 'shotoku', 'shogakukin', 'shogakukin-bridge', 'furusato']);
    const D = path.join(ROOT, 'data/municipalities');
    // municipal: { 'jumin-2026': 'agui/jumin-2026.json', ... } のように testcity の URL を実在データへ割り当てる
    const mkFetch = (municipal) => (url) => {
      let p = null;
      if (url.startsWith('/data/shaho/')) p = path.join(ROOT, 'data/shaho', url.split('/').pop());
      else if (url.startsWith('/data/national/')) p = path.join(ROOT, 'data/national', url.split('/').pop());
      else if (url === '/js/core/shogakukin-2026.json') p = path.join(ROOT, 'js/core/shogakukin-2026.json');
      else { const m = url.match(/^\/data\/municipalities\/testcity\/([a-z]+-\d{4})\.json$/); if (m && municipal[m[1]]) p = path.join(D, municipal[m[1]]); }
      if (p && fs.existsSync(p)) { const j = JSON.parse(fs.readFileSync(p, 'utf8')); return Promise.resolve({ ok: true, json: () => Promise.resolve(j) }); }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('404')) });
    };
    const runCase = async (municipal) => {
      const { w, errs } = await load(base, 'https://seido-keisan.jp/aichi/testcity/kakeibo/', mkFetch(municipal));
      const d = w.document;
      d.getElementById('salary').value = '4000000'; d.getElementById('age').value = '40'; d.getElementById('family').value = '1';
      d.getElementById('employment').value = 'jiei';
      await w.calcAll();
      return { text: d.getElementById('systems').textContent, errs };
    };
    const kinto = (JUMIN_DEFAULTS.prefPerCapita + JUMIN_DEFAULTS.cityPerCapita + JUMIN_DEFAULTS.forestTax).toLocaleString();
    let c = await runCase({ 'kokuho-2026': 'agui/kokuho-2026.json' });
    A(`住民税データ無し: 「標準税率（所得割 10%・均等割 ${kinto} 円）で計算」`, c.text.includes(`標準税率（所得割 10%・均等割 ${kinto} 円）で計算`), c.text.slice(0, 200));
    A('国保 2026 あり: 年度の注記を出さない', !c.text.includes('令和7年度の料率'));
    c = await runCase({ 'jumin-2026': 'agui/jumin-2026.json', 'kokuho-2026': 'agui/kokuho-2026.json' });
    A('inferred（阿久比町）: 「自治体の税率（確認中の推計値）で計算」', c.text.includes('自治体の税率（確認中の推計値）で計算'));
    c = await runCase({ 'jumin-2026': 'nagoya/jumin-2026.json', 'kokuho-2026': 'nagoya/kokuho-2026.json' });
    A('verified（名古屋市）: 「自治体の公表値の税率で計算」', c.text.includes('自治体の公表値の税率で計算'));
    c = await runCase({ 'kokuho-2025': 'agui/kokuho-2025.json' });
    A('国保 2026 無し・2025 で計算: 「令和7年度の料率で計算」を出す', c.text.includes('令和7年度の料率で計算しています'));
    A('家計簿: JS エラーなし', c.errs.length === 0, c.errs.join(' / '));
  }

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exitCode = fail > 0 ? 1 : 0;
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
