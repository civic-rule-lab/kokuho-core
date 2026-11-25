/**
 * test-hatarakikata-dom.cjs — 働き方の比較（生成物 seido-hatarakikata.html）を jsdom で検証
 *
 *  0. 生成物が最新（テンプレートと制度値から作り直しても同じ）・2 回実行して差分なし・未置換のプレースホルダなし
 *  1. 画面の各金額が、Hatarakikata.compare を Node から直接呼んだ値と一致する（会社員から／個人事業から／家族あり）
 *  2. Enter の順と終了マーク。非表示の欄を飛ばす。日本語入力の確定の Enter を無視。全角を半角に
 *  3. 自治体・稼ぎ・年齢が未入力なら結果を出さない（0 円と区別）。対象外の年齢・赤字・人数の矛盾は案内だけ
 *  4. 注記文（結果の末尾の 1 文・年金の注記 3 点・端末の中だけで計算・「計算上は、」）と、使わない語が画面に無いこと
 *  5. 手取りと年金を足した行が無い
 *  6. 自治体を変えると値が変わる。自治体データを取得できなければ警告を出し、結果を出さない
 *  7. 掛金は列ごとの上限で打ち切り、打ち切ったことを書く
 *  8. 表は列の配列から組み立てる（列を 1 つ足した結果を渡すと、その列と「会社に残る額」の行が出る）
 *
 * 試算の条件はすべて架空のモデル世帯。
 * 実行: node scripts/test-hatarakikata-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const H = require(path.join(ROOT, 'js/core/hatarakikata.js'));
const KYUCHI = J('data/reference/kyuchi.json').municipalities;
const config = J('data/national/hatarakikata-2026.json');
const baseData = {
  config,
  shaho: { kenpo: J('data/shaho/kenpo-2026.json'), kosei: J('data/shaho/kosei-nenkin.json'), koyo: J('data/shaho/koyo-2026.json'), standard: J('data/shaho/standard-monthly.json'), senpo: null },
  shotokuDb: J('data/national/shotokuzei-2026.json'), haigu: J('data/national/jumin-haigusha-kojo.json'),
  nenkin: J('data/national/kokumin-nenkin-2026.json'), nenkinKyufu: J('data/national/nenkin-kyufu-2026.json'), jigyozei: J('data/national/kojin-jigyozei-2026.json'),
};
const muni = (slug, sys) => { const p = path.join(ROOT, `data/municipalities/${slug}/${sys}-${config.years.kokuhoYear}.json`); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; };
const dataFor = (slug) => Object.assign({}, baseData, { kokuho: muni(slug, 'kokuho'), jumin: muni(slug, 'jumin') });
const CAP = { idecoK: config.kakekin.idecoMonthlyMax.kaishain * 12, idecoJ: config.kakekin.idecoMonthlyMax.kojin * 12, kyosai: config.kakekin.kyosaiMonthlyMax * 12 };

let pass = 0, fail = 0;
const A = (label, cond, extra) => { console.log(`${cond ? '✓' : '✗'} ${label}${!cond && extra ? '  → ' + extra : ''}`); cond ? pass++ : fail++; };

// ── 0. 生成物 ──
const OUT = path.join(ROOT, 'seido-hatarakikata.html');
const GEN = path.join(ROOT, 'scripts/generate-seido-hatarakikata.js');
{
  const committed = fs.readFileSync(OUT, 'utf8');
  execFileSync(process.execPath, [GEN], { stdio: 'pipe' });
  const first = fs.readFileSync(OUT, 'utf8');
  execFileSync(process.execPath, [GEN], { stdio: 'pipe' });
  const second = fs.readFileSync(OUT, 'utf8');
  A('生成物が最新（作り直しても同じ）', committed === first);
  A('生成器を 2 回実行して差分なし', first === second);
  const shell = first.replace(/<script>\s*const CITY_INDEX[\s\S]*?<\/script>/, '');
  A('未置換のプレースホルダが無い', !/__[A-Z_]+__/.test(shell));
  A('制度値の埋め込みが 1 つの script にまとまっている（上の検査が埋め込みを除けている）', shell.length < first.length);
}

const SCRIPTS = ['shared/ui-input', 'shared/income', 'shaho', 'shotoku', 'jumin', 'kokuho', 'nenkin-kyufu', 'jigyozei', 'hatarakikata'];
let html = fs.readFileSync(OUT, 'utf8');
for (const f of SCRIPTS) {
  const re = new RegExp(`<script src="/js/core/${f}\\.js\\?v=[0-9a-f]+"></script>`);
  A(`ページが /js/core/${f}.js を読む`, re.test(html));
  html = html.replace(re, () => '<script>' + fs.readFileSync(path.join(ROOT, `js/core/${f}.js`), 'utf8') + '</script>');
}
A('ほかの外部 JS（/js/…）を読んでいない', !/<script src="\/js\//.test(html));
html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
let fetchFail = false; const fetched = [];
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://seido-keisan.jp/hatarakikata/',
  beforeParse(w) {
    w.fetch = (url) => {
      fetched.push(String(url));
      const m = String(url).match(/\/data\/municipalities\/([a-z0-9-]+)\/(kokuho|jumin)-(\d{4})\.json$/);
      if (fetchFail || !m) return Promise.resolve({ ok: false, status: 404, json: () => ({}) });
      const p = path.join(ROOT, `data/municipalities/${m[1]}/${m[2]}-${m[3]}.json`);
      if (!fs.existsSync(p)) return Promise.resolve({ ok: false, status: 404, json: () => ({}) });
      return Promise.resolve({ ok: true, status: 200, json: () => JSON.parse(fs.readFileSync(p, 'utf8')) });
    };
  } });
const w = dom.window, d = w.document;
Object.defineProperty(w.HTMLElement.prototype, 'offsetParent', { get() { for (let n = this; n; n = n.parentElement) if (n.style && n.style.display === 'none') return null; return this.parentNode; } });
const $ = (id) => d.getElementById(id);
const set = (id, v) => { const e = $(id); e.value = v; e.dispatchEvent(new w.Event('input', { bubbles: true })); e.dispatchEvent(new w.Event('blur')); };
const sel = (id, v) => { const e = $(id); e.value = v; e.dispatchEvent(new w.Event('change', { bubbles: true })); };
const enter = (id, opt) => { const el = $(id); el.focus(); el.dispatchEvent(new w.KeyboardEvent('keydown', Object.assign({ key: 'Enter', bubbles: true, cancelable: true }, opt))); return d.activeElement.id; };
const resText = () => $('result').textContent.replace(/\s+/g, ' ');
const hasGrid = () => !!$('result').querySelector('.hk-grid');
const amt = (id) => { const e = $(id); if (!e) return undefined; const t = e.querySelector('.hk-amt').textContent.trim(); if (t === '—') return null; const m = t.match(/^([0-9,]+) 円$/); return m ? Number(m[1].replace(/,/g, '')) : NaN; };
const calc = () => w.calcHatarakikata();
const clearAll = () => { for (const id of ['nenshu', 'uriage', 'keihi', 'age', 'spouseAge', 'spouseSalary', 'kidsU16', 'kidsPre', 'kids1618', 'kids1922', 'ideco', 'kyosai']) set(id, ''); sel('spouse', 'none'); sel('mode', 'kaishain'); sel('aoiro', String(config.kojin.aoiroDefault)); sel('gyoshu', config.kojin.gyoshuDefault); };
const pickCity = (pref, slug) => { sel('pref', pref); sel('city', slug); };
const taxOf = (c, k) => { const t = c.taxes.find((x) => x.key === k); return t ? t.amount : null; };

// 画面の全セルを、直接呼んだ結果と突き合わせる
function sameAsEngine(label, r) {
  const bad = [];
  const eq = (id, want) => { const got = amt(id); if (got !== want) bad.push(`${id}: 画面 ${got} ／ 計算 ${want}`); };
  const total = Number($('res-total').textContent.replace(/[^0-9]/g, ''));
  if (total !== r.total) bad.push(`res-total: 画面 ${total} ／ 計算 ${r.total}`);
  const taxKeys = [...new Set(r.columns.flatMap((c) => c.taxes.map((t) => t.key)))];
  for (const c of r.columns) {
    eq(`res-${c.key}-gross`, c.gross); eq(`res-${c.key}-siEmployer`, c.siEmployer); eq(`res-${c.key}-siEmployee`, c.siEmployee);
    for (const k of taxKeys) eq(`res-${c.key}-tax-${k}`, taxOf(c, k));
    eq(`res-${c.key}-takehome`, c.takeHome);
    if (r.columns.some((x) => x.buckets.savings > 0)) eq(`res-${c.key}-savings`, c.buckets.savings);
    for (const k of ['kiso', 'kosei', 'spouseKiso']) if (r.columns.some((x) => x.pension[k] !== null)) eq(`res-pension-${c.key}-${k}`, c.pension[k]);
  }
  A(label, bad.length === 0, bad.slice(0, 3).join(' ｜ '));
}

(async () => {
  if (d.readyState === 'loading') await new Promise((r) => d.addEventListener('DOMContentLoaded', r));
  const SLUG = 'setagaya', PREF = '東京都', K = Number(KYUCHI[SLUG][0]);

  // ── 選択肢 ──
  A('都道府県の選択肢が 47', $('pref').options.length === 48);
  A('働き方の選択肢は 計算の既定の列と同じ並び', [...$('mode').options].map((o) => o.value).join(',') === H.DEFAULT_COLUMNS.join(','));
  A('青色申告特別控除の選択肢と既定値が制度値から入る', [...$('aoiro').options].map((o) => o.value).join(',') === config.kojin.aoiroOptions.join(',') && $('aoiro').value === String(config.kojin.aoiroDefault));
  A('業種の選択肢と既定値が制度値から入る', [...$('gyoshu').options].map((o) => o.value).join(',') === baseData.jigyozei.rates.map((x) => x.key).join(',') && $('gyoshu').value === config.kojin.gyoshuDefault);
  A('説明文の中の制度値が入る（扶養の目安・掛金の上限・事業主控除）', [...d.querySelectorAll('[data-cfg]')].every((e) => e.textContent.length > 0) && $('ideco').parentElement.textContent.includes(CAP.idecoK.toLocaleString('ja-JP')) && $('kyosai').parentElement.textContent.includes(CAP.kyosai.toLocaleString('ja-JP')));
  A('金額に入っていない違いの表が、既定の列の数で出る', $('infoTable').querySelectorAll('.hk-h').length === H.DEFAULT_COLUMNS.length && $('infoTable').querySelectorAll('.hk-l').length >= 3);

  // ── 3. 未入力 ──
  await calc();
  A('自治体が未選択なら結果を出さない', !hasGrid() && resText().includes('都道府県と市区町村を選んで'));
  pickCity(PREF, SLUG);
  A('東京都を選ぶと市区町村が入る', $('city').value === SLUG);
  await calc();
  A('稼ぎが未入力なら結果を出さない（0 円の結果にしない）', !hasGrid() && resText().includes('額面年収を入れて') && !resText().includes('0 円'));
  set('nenshu', '5000000');
  await calc();
  A('年齢が未入力なら結果を出さない', !hasGrid() && resText().includes('年齢を入れて'));
  set('age', String(config.ageRange.under));
  await calc();
  A(`${config.ageRange.under}歳以上は対象外の案内だけ`, !hasGrid() && !!$('result').querySelector('.warn') && resText().includes('後期高齢者医療'));

  // ── 2. Enter・入力欄 ──
  A('全角の数字は半角になり、金額欄は欄を離れるとカンマが付く', (set('nenshu', '５００００００'), $('nenshu').value === '5,000,000'));
  A('年齢の欄にはカンマが付かない', (set('age', '35'), $('age').value === '35'));
  A('Enter（会社員）: 都道府県 → 市区町村 → 働き方 → 額面年収 → 年齢 → 配偶者（売上・経費・青色・業種を飛ばす）',
    enter('pref') === 'city' && enter('city') === 'mode' && enter('mode') === 'nenshu' && enter('nenshu') === 'age' && enter('age') === 'spouse');
  A('Enter: 配偶者（いない）→ 子 4 欄 → iDeCo → 共済（配偶者の欄を飛ばす）',
    enter('spouse') === 'kidsU16' && enter('kidsU16') === 'kidsPre' && enter('kidsPre') === 'kids1618' && enter('kids1618') === 'kids1922' && enter('kids1922') === 'ideco' && enter('ideco') === 'kyosai');
  A('Enter: 共済は終了マーク（動かない）', enter('kyosai') === 'kyosai' && d.querySelectorAll('[data-step-end]').length === 1);
  A('日本語入力の確定の Enter では動かない', enter('nenshu', { isComposing: true }) === 'nenshu' && enter('nenshu', { keyCode: 229 }) === 'nenshu');
  sel('mode', 'kojin');
  A('個人事業を選ぶと、売上・経費・青色・業種の欄が出て、額面年収の欄が消える', $('boxKojin').style.display === '' && $('boxKojinOpt').style.display === '' && $('boxKaishain').style.display === 'none');
  A('Enter（個人事業）: 働き方 → 売上 → 経費 → 年齢 → 青色 → 業種 → 配偶者',
    enter('mode') === 'uriage' && enter('uriage') === 'keihi' && enter('keihi') === 'age' && enter('age') === 'aoiro' && enter('aoiro') === 'gyoshu' && enter('gyoshu') === 'spouse');
  sel('spouse', 'yes');
  A('配偶者「いる」で欄が出て、Enter: 配偶者 → 年齢 → 給与収入 → 子', $('spouseBox').style.display === '' && enter('spouse') === 'spouseAge' && enter('spouseAge') === 'spouseSalary' && enter('spouseSalary') === 'kidsU16');
  sel('mode', 'kaishain');
  A('会社員に戻すと、青色・業種の欄が消える', $('boxKojinOpt').style.display === 'none' && $('boxKaishain').style.display === '');

  // ── 1. 値の一致 ──
  clearAll(); pickCity(PREF, SLUG);
  set('nenshu', '5000000'); set('age', '35');
  await calc();
  const rA = H.compare({ mode: 'kaishain', common: { age: 35, prefSlug: 'tokyo', kyuchi: K, spouse: null, kids: { u16: 0, preschool: 0, a1618: 0, a1922: 0 } }, kaishain: { nenshu: 5_000_000, ideco: 0 }, kojin: { ideco: 0, kyosai: 0 } }, dataFor(SLUG));
  A('会社員から: 結果の表が出る', hasGrid());
  A('列の見出しは働き方の名前（既定の列の順）', [...$('result').querySelector('.hk-grid').querySelectorAll('.hk-h')].map((e) => e.textContent).join(',') === '会社員,個人事業');
  sameAsEngine('会社員から（単身・35歳・年収 500 万円）: 画面の全金額が計算と一致', rA);
  A('会社員の個人事業税は「—」（0 円と区別）', amt('res-kaishain-tax-kojinJigyozei') === null && amt('res-kojin-siEmployer') === null);
  A('会社員から入れたときも、青色申告特別控除と税率を結果に書く', $('res-kojin-gross').textContent.includes('青色申告特別控除 65 万円') && $('res-kojin-tax-kojinJigyozei').textContent.includes('税率 5%'));
  A('会社員から入れたときは、揃えきれない差の注記を出さない', !$('res-gap'));
  A('積立が無ければ「自分の積立」の行を出さない／「会社に残る額」の行は該当する列が無ければ出さない', !$('res-kaishain-savings') && !$('res-kaishain-retained'));
  A('取得したのは選んだ自治体の国保と住民税のデータだけ', fetched.length > 0 && fetched.every((u) => new RegExp(`^/data/municipalities/${SLUG}/(kokuho|jumin)-${config.years.kokuhoYear}\\.json$`).test(u)));

  // ── 4. 注記 ──
  const body = () => d.body.textContent.replace(/\s+/g, ' ');
  A('結果の末尾の 1 文', $('res-closing').textContent === 'この結果は、入力した前提での計算結果の比較です。実際の手続きや申告では、年金事務所・税務署または税理士にご確認ください。');
  A('「計算上は、」の形で書く', /^計算上は、(会社員|個人事業)の手取りが最も多くなります。1年働くと増える年金は、(会社員|個人事業)が最も多くなります。$/.test($('res-summary').textContent));
  A('年金の注記 3 点', resText().includes('年金額は毎年度見直されます') && resText().includes('受け取りは原則65歳からです') && resText().includes('障害年金・遺族年金の上乗せ'));
  A('「この端末の中だけで計算」の文', body().includes('入力した内容はこの端末の中だけで計算し、送信・保存しません。'));
  A('「計算の前提」の見出しがあり、「※…」の段落が無い', html.includes('<h2>計算の前提</h2>') && !/※[^<]*<br>/.test(html.replace(/<script[\s\S]*?<\/script>/g, '')));
  const banned = ['お得', '節税', '最適', 'おすすめ', '有利', '対策'].filter((x) => body().replace(/const CITY_INDEX[\s\S]*/, '').includes(x) || resText().includes(x));
  A('使わない語（お得・節税・最適・おすすめ・有利・対策）が画面に無い', banned.length === 0, banned.join(' '));
  // ── 5. 足した行が無い ──
  const labels = [...$('result').querySelectorAll('.hk-l')].map((e) => e.textContent);
  const sums = rA.columns.map((c) => c.takeHome + (c.pension.kiso || 0) + (c.pension.kosei || 0));
  A('手取りと年金を足した行が無い', !labels.some((t) => /手取り/.test(t) && /年金/.test(t)) && ![...$('result').querySelectorAll('.hk-amt')].some((e) => sums.includes(Number(e.textContent.replace(/[^0-9]/g, '')))));
  A('強調する行は手取りだけ', [...$('result').querySelectorAll('.hk-l.hk-strong')].map((e) => e.textContent).join() === '手取り（年）');

  // ── 個人事業から・家族あり・積立あり ──
  clearAll(); pickCity(PREF, SLUG); sel('mode', 'kojin');
  set('uriage', '8000000'); set('keihi', '2000000'); set('age', '45'); sel('aoiro', '550000'); sel('gyoshu', 'type3low');
  sel('spouse', 'yes'); set('spouseAge', '40'); set('spouseSalary', '900000');
  set('kidsU16', '2'); set('kidsPre', '1'); set('kids1618', '1'); set('kids1922', '1'); set('ideco', '240000'); set('kyosai', '360000');
  await calc();
  const famB = { age: 45, prefSlug: 'tokyo', kyuchi: K, spouse: { age: 40, salary: 900_000 }, kids: { u16: 2, preschool: 1, a1618: 1, a1922: 1 } };
  const rB = H.compare({ mode: 'kojin', common: famB, kaishain: { ideco: 240_000 }, kojin: { uriage: 8_000_000, keihi: 2_000_000, aoiro: 550_000, gyoshu: 'type3low', ideco: 240_000, kyosai: 360_000 } }, dataFor(SLUG));
  sameAsEngine('個人事業から（45歳・配偶者・子 4 人・青色 55 万・税率 3%・積立あり）: 画面の全金額が計算と一致', rB);
  A('選んだ青色申告特別控除と税率を結果に書く', $('res-kojin-gross').textContent.includes('青色申告特別控除 55 万円') && $('res-kojin-tax-kojinJigyozei').textContent.includes('税率 3%'));
  A('個人事業から入れて揃えきれない差があれば、その額を書く', rB.align.gap > 0 ? $('res-gap').textContent.includes(rB.align.gap.toLocaleString('ja-JP') + ' 円') : !$('res-gap'));
  A('配偶者の基礎年金の行が出る', amt('res-pension-kaishain-spouseKiso') === rB.columns[0].pension.spouseKiso && rB.columns[0].pension.spouseKiso !== null);
  A('「計算の流れ」が折りたたみの中にある', !!$('result').querySelector('details > summary') && $('result').querySelector('details').textContent.includes('国民健康保険'));

  // ── 会社員から・配偶者が自分の社会保険 ──
  clearAll(); pickCity(PREF, SLUG);
  set('nenshu', '7000000'); set('age', '62'); sel('spouse', 'yes'); set('spouseAge', '58'); set('spouseSalary', '1500000');
  await calc();
  const rC = H.compare({ mode: 'kaishain', common: { age: 62, prefSlug: 'tokyo', kyuchi: K, spouse: { age: 58, salary: 1_500_000 }, kids: { u16: 0, preschool: 0, a1618: 0, a1922: 0 } }, kaishain: { nenshu: 7_000_000, ideco: 0 }, kojin: { ideco: 0, kyosai: 0 } }, dataFor(SLUG));
  sameAsEngine('会社員から（62歳・配偶者は年収 150 万円）: 画面の全金額が計算と一致', rC);
  A('60 歳以上は基礎年金の行を出さない（どの列も該当なし）。厚生年金の行は出る。配偶者が自分の社会保険なら配偶者の行を出さない', !$('res-pension-kaishain-kiso') && amt('res-pension-kaishain-kosei') === rC.columns[0].pension.kosei && amt('res-pension-kojin-kosei') === null && !$('res-pension-kaishain-spouseKiso'));

  // ── 3. 案内だけの場合（続き） ──
  clearAll(); pickCity(PREF, SLUG); sel('mode', 'kojin'); set('uriage', '1000000'); set('keihi', '2000000'); set('age', '35');
  await calc();
  A('経費が売上を上回るときは結果を出さない', !hasGrid() && resText().includes('経費が売上を上回っています'));
  clearAll(); pickCity(PREF, SLUG); set('nenshu', '5000000'); set('age', '35'); set('kidsU16', '1'); set('kidsPre', '2');
  await calc();
  A('小学校に入る前の子が 16 歳未満の子より多いときは結果を出さない', !hasGrid() && resText().includes('16歳未満の子の人数以下'));
  clearAll(); pickCity(PREF, SLUG); set('nenshu', '5000000'); set('age', '35'); sel('spouse', 'yes');
  await calc();
  A('配偶者「いる」で年齢が未入力なら結果を出さない', !hasGrid() && resText().includes('配偶者の年齢を入れて'));
  set('spouseAge', String(config.ageRange.under));
  await calc();
  A(`配偶者が ${config.ageRange.under}歳以上なら案内だけ`, !hasGrid() && !!$('result').querySelector('.warn'));

  // ── 7. 掛金の上限 ──
  clearAll(); pickCity(PREF, SLUG); set('nenshu', '6000000'); set('age', '40'); set('ideco', '900000'); set('kyosai', '999999');
  await calc();
  const rD = H.compare({ mode: 'kaishain', common: { age: 40, prefSlug: 'tokyo', kyuchi: K, spouse: null, kids: {} }, kaishain: { nenshu: 6_000_000, ideco: CAP.idecoK }, kojin: { ideco: CAP.idecoJ, kyosai: CAP.kyosai } }, dataFor(SLUG));
  sameAsEngine('掛金が上限を超えたとき: 列ごとの上限で計算した値と一致', rD);
  A('積立の行は上限の額（会社員は iDeCo の上限、個人事業は iDeCo と共済の上限の合計）', amt('res-kaishain-savings') === CAP.idecoK && amt('res-kojin-savings') === CAP.idecoJ + CAP.kyosai);
  A('上限で打ち切ったことを書く', $('res-cap').textContent.includes(CAP.idecoK.toLocaleString('ja-JP')) && $('res-cap').textContent.includes(CAP.idecoJ.toLocaleString('ja-JP')) && $('res-cap').textContent.includes(CAP.kyosai.toLocaleString('ja-JP')));
  set('ideco', '120000'); set('kyosai', '0');
  await calc();
  A('上限の中なら、打ち切りの注記を出さない', !$('res-cap') && amt('res-kaishain-savings') === 120_000 && amt('res-kojin-savings') === 120_000);

  // ── 6. 自治体を変える ──
  clearAll(); pickCity(PREF, SLUG); set('nenshu', '5000000'); set('age', '35');
  await calc();
  const before = { kokuho: amt('res-kojin-siEmployee'), jumin: amt('res-kaishain-tax-juminzei') };
  const OTHER = { pref: '神奈川県', slug: 'yokohama', prefSlug: 'kanagawa' };
  pickCity(OTHER.pref, OTHER.slug);
  await calc();
  const rE = H.compare({ mode: 'kaishain', common: { age: 35, prefSlug: OTHER.prefSlug, kyuchi: Number(KYUCHI[OTHER.slug][0]), spouse: null, kids: {} }, kaishain: { nenshu: 5_000_000, ideco: 0 }, kojin: { ideco: 0, kyosai: 0 } }, dataFor(OTHER.slug));
  sameAsEngine('自治体を横浜市に変える: 画面の全金額が、その自治体のデータで計算した値と一致', rE);
  A('自治体を変えると国保料（個人事業の社会保険料）が変わる', amt('res-kojin-siEmployee') !== before.kokuho);
  A('見出しに自治体名と年が出る', resText().includes('横浜市') && resText().includes(config.years.shotokuYear + '年'));
  // 級地（住民税の均等割の非課税の線）は自治体ごとに違う。級地が 1 でない自治体で、級地を取り違えると住民税が変わる年収を探して確かめる
  {
    const INDEX = JSON.parse(html.match(/const CITY_INDEX = (\{.*?\});\n/)[1]);
    let hit = null;
    outer: for (const [pn, p] of Object.entries(INDEX)) for (const c of p.cities) {
      if (c.k === 1) continue;
      const dd = dataFor(c.slug);
      for (let n = 900_000; n <= 1_400_000; n += 10_000) {
        const mk = (k) => H.compare({ mode: 'kaishain', common: { age: 35, prefSlug: p.slug, kyuchi: k, spouse: null, kids: {} }, kaishain: { nenshu: n, ideco: 0 }, kojin: { ideco: 0, kyosai: 0 } }, dd);
        const right = mk(c.k), wrong = mk(1);
        if (taxOf(right.columns[0], 'juminzei') !== taxOf(wrong.columns[0], 'juminzei')) { hit = { pn, slug: c.slug, n, right }; break outer; }
      }
    }
    A('級地で住民税が変わる条件が見つかる（検査が空振りしない）', !!hit);
    if (hit) {
      clearAll(); pickCity(hit.pn, hit.slug); set('nenshu', String(hit.n)); set('age', '35');
      await calc();
      sameAsEngine(`級地が 1 でない自治体（${hit.slug}・年収 ${hit.n.toLocaleString('ja-JP')} 円）: その自治体の級地で計算した値と一致`, hit.right);
    }
  }
  fetchFail = true;
  pickCity('大阪府', 'osaka');
  await calc();
  A('自治体データを取得できなければ警告を出し、結果を出さない', !hasGrid() && !!$('result').querySelector('.warn') && resText().includes('国保データを取得できませんでした'));
  fetchFail = false;

  // ── 8. 表は列の配列から組み立てる ──
  {
    const extra = JSON.parse(JSON.stringify(rA.columns[0]));
    extra.key = 'tsuika'; extra.buckets.retained = 123_456; extra.taxes.push({ key: 'betsuNoZei', amount: 7_000 });
    const r3 = Object.assign({}, rA, { columns: rA.columns.concat([extra]) });
    const box = d.createElement('div');
    box.innerHTML = w.hatarakikataRender(r3, { name: '世田谷区' }, { capped: {} });
    const g = box.querySelector('.hk-grid');
    A('列を 1 つ足した結果を渡すと 3 列になる（列の数は CSS の変数で渡す）', g.getAttribute('style').includes('--hk-cols:3') && g.querySelectorAll('.hk-h').length === 3);
    A('知らない列は、列の名前をそのまま見出しに出す（ほかの列の名前を使い回さない）', [...g.querySelectorAll('.hk-h')].map((e) => e.textContent).join(',') === '会社員,個人事業,tsuika');
    A('足した列の id に列の名前が入り、既定の列の id は変わらない', !!box.querySelector('#res-tsuika-takehome') && !!box.querySelector('#res-kaishain-takehome') && !!box.querySelector('#res-kojin-takehome'));
    A('「会社に残る額」の行は、該当する列があるときだけ出る（無い列は「—」）', box.querySelector('#res-tsuika-retained .hk-amt').textContent === '123,456 円' && box.querySelector('#res-kojin-retained .hk-amt').textContent === '—');
    A('列によって税目の数が違っても、税目ごとに 1 行ずつ出る', box.querySelector('#res-tsuika-tax-betsuNoZei .hk-amt').textContent === '7,000 円' && box.querySelector('#res-kaishain-tax-betsuNoZei .hk-amt').textContent === '—');
  }
  A('文言に列の数を書いていない（「2つの働き方」など）', !/[2２二]\s*つの働き方|[2２二]\s*通り/.test(body()));

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
