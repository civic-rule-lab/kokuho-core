#!/usr/bin/env node
/**
 * test-furusato-portals.cjs — ふるさと納税 6 ページの「寄附の申込み先」枠と、運営者情報ページへの導線を生成物で検査する
 *
 * 収益化設計の固定ルール（data/national/furusato-portals-2026.json の meta.rules と同じ）:
 *   1. 枠は 1 ページに 1 つ。計算ページでは結果（#result）より後ろに置く（計算が先、申込みが後）
 *   2. リンクは enabled のポータル全件で、並びは kana の五十音順
 *   3. 成果報酬リンク（rel に sponsored）が 1 件でもあれば見出しに「広告」。無ければ見出しに「広告」を付けない
 *   4. すべて target=_blank・rel に noopener。href は https の公式トップのみ（クエリ・フラグメント・5 桁以上の数字を含まない＝計算値を載せない）
 *   5. 枠の文中に禁止語（返礼品・還元率・お得・人気・おすすめ・ランキング 等）が無い
 *   6. 枠の data-calc-type は、そのページの calculate イベントの calc_type と同じ
 *   7. 6 ページ・トップとも、フッターに /about/ への導線がある
 *   8. /about/ ページ: canonical・Google アナリティクスの説明・広告の方針・運営者・お問い合わせ先、sitemap に /about/
 *   9. 運営者シグナル: /about/ に noindex が無く Organization JSON-LD がある。kokuho トップに description・canonical・publisher 参照・運営者フッター
 *  10. 全テンプレートの生成物（各 1 ページ）: JSON-LD の主ノードが publisher で Organization の @id を参照し、Organization 本体が 1 つ。フッターに運営者行と自サイトを除いた関連サイト行
 *
 * 実行: 6 ページ＋about＋index を生成してから node scripts/test-furusato-portals.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const ROOT = path.join(__dirname, '..');
const db = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/national/furusato-portals-2026.json'), 'utf8'));
const enabled = db.portals.filter((p) => p.enabled !== false).slice().sort((a, b) => a.kana.localeCompare(b.kana, 'ja'));
const forbidden = db.meta.forbiddenWords;
const organization = require('./lib/organization.cjs');

let pass = 0, fail = 0;
const A = (label, cond) => { console.log(`${cond ? '✓' : '✗'} ${label}`); cond ? pass++ : fail++; };
const load = (f) => new JSDOM(fs.readFileSync(path.join(ROOT, f), 'utf8')).window.document; // script は実行しない（静的検査）

const PAGES = [
  ['seido-furusato.html', 'furusato-simple', true],
  ['seido-onestop.html', 'furusato-onestop', true],
  ['seido-jieigyo.html', 'furusato-jieigyo', true],
  ['seido-ikukyu.html', 'furusato-ikukyu', true],
  ['seido-haito.html', 'furusato-haito', true],
  ['seido-taishoku.html', 'furusato-taishoku', false],
];

for (const [file, calcType, hasResult] of PAGES) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const d = load(file);
  const boxes = d.querySelectorAll('section.portal-box');
  A(`${file}: ポータル枠が 1 つ`, boxes.length === 1);
  const box = boxes[0]; if (!box) continue;
  if (hasResult) {
    const res = d.getElementById('result');
    A(`${file}: 枠は結果（#result）より後ろ`, !!res && (res.compareDocumentPosition(box) & 4) === 4);
  }
  const links = [...box.querySelectorAll('a[data-portal]')];
  A(`${file}: リンクは enabled のポータル全件（${enabled.length} 件）`, links.length === enabled.length);
  A(`${file}: 並びは五十音順（${enabled.map((p) => p.name).join('・')}）`, links.map((a) => a.getAttribute('data-portal')).join(',') === enabled.map((p) => p.id).join(','));
  const sponsored = links.filter((a) => /\bsponsored\b/.test(a.getAttribute('rel') || ''));
  const title = (box.querySelector('.pb-title') || {}).textContent || '';
  A(`${file}: 成果報酬リンクがあれば見出しに「広告」、無ければ付けない（今: ${sponsored.length} 件）`, sponsored.length > 0 ? title.includes('広告') : !title.includes('広告'));
  A(`${file}: 全リンクが target=_blank・rel noopener`, links.every((a) => a.getAttribute('target') === '_blank' && /\bnoopener\b/.test(a.getAttribute('rel') || '')));
  A(`${file}: href は https の公式トップのみ（クエリ・5 桁以上の数字なし）`, links.every((a) => /^https:\/\/[^\s?#]+\/?$/.test(a.getAttribute('href')) && !/\d{5,}/.test(a.getAttribute('href'))));
  A(`${file}: データの URL と一致`, links.every((a) => enabled.find((p) => p.id === a.getAttribute('data-portal') && p.url === a.getAttribute('href'))));
  const text = box.textContent.replace(/\s+/g, '');
  const hit = forbidden.filter((wd) => text.includes(wd));
  A(`${file}: 枠に禁止語が無い${hit.length ? '（検出: ' + hit.join('・') + '）' : ''}`, hit.length === 0);
  A(`${file}: 「寄附先（自治体）を勧めるものではありません」の一文`, text.includes('寄附先（自治体）を勧めるものではありません'));
  A(`${file}: data-calc-type=${calcType}`, box.getAttribute('data-calc-type') === calcType);
  if (hasResult) {
    const m = html.match(/gtag\("event",\s*"calculate",\s*\{\s*calc_type:\s*"([^"]+)"/);
    A(`${file}: calculate イベントの calc_type と同じ`, !!m && m[1] === calcType);
  }
  A(`${file}: 枠の script が portal_click を送り、金額を送らない`, /gtag\("event","portal_click",\{portal:[^}]*calc_type:ct\}\)/.test(html) && !/portal_click[^)]*amount/.test(html));
  A(`${file}: フッターに /about/ への導線`, [...d.querySelectorAll('a[href="/about/"]')].some((a) => /運営者情報/.test(a.textContent)));
}

// トップ
{
  const d = load('seido-index.html');
  A('seido-index.html: フッターに /about/ への導線', [...d.querySelectorAll('a[href="/about/"]')].some((a) => /運営者情報/.test(a.textContent)));
}

// about
{
  const html = fs.readFileSync(path.join(ROOT, 'seido-about.html'), 'utf8');
  const d = load('seido-about.html');
  const text = d.body.textContent.replace(/\s+/g, '');
  A('seido-about.html: canonical が /about/', (d.querySelector('link[rel=canonical]') || {}).href === 'https://seido-keisan.jp/about/');
  A('seido-about.html: 運営者名とお問い合わせ先', text.includes('CivicSystems') && !!d.querySelector('a[href^="https://civicsystems.jp/"]'));
  A('seido-about.html: Google アナリティクスの説明とオプトアウトへのリンク', text.includes('Googleアナリティクス') && !!d.querySelector('a[href^="https://tools.google.com/dlpage/gaoptout"]'));
  A('seido-about.html: 入力値をサーバーに送らない旨', text.includes('運営者のサーバーに送信せず'));
  A('seido-about.html: 広告の方針（成果報酬リンクは「広告」と明記）', text.includes('「広告」と明記'));
  A('seido-about.html: 返礼品の紹介・比較をしない旨', text.includes('返礼品の紹介・比較・ランキングは行いません'));
  const anySponsored = enabled.some((p) => p.program !== 'none');
  A('seido-about.html: 成果報酬リンクの有無の記述がデータと一致', anySponsored ? !text.includes('成果報酬型（アフィリエイト）のリンクや広告枠はありません') : text.includes('成果報酬型（アフィリエイト）のリンクや広告枠はありません'));
  A('seido-about.html: 免責（目安・税務相談ではない）', text.includes('目安') && text.includes('税務相談'));
  A('seido-about.html: 未置換プレースホルダなし', !/__[A-Z_]+__/.test(html));
  // 運営者シグナル（兄弟サイトを同一運営者と伝える）: noindex を外し、Organization の @id をこのページに置く
  A('seido-about.html: robots noindex が無い（検索対象）', !d.querySelector('meta[name=robots]'));
  const aboutLd = [...d.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent));
  const aboutOrg = aboutLd.find((j) => j['@type'] === 'Organization');
  A('seido-about.html: Organization JSON-LD（@id・name・alternateName が定数と一致）', !!aboutOrg && aboutOrg['@id'] === organization.ORGANIZATION_ID && aboutOrg.name === organization.ORGANIZATION.name && aboutOrg.alternateName === organization.ORGANIZATION.alternateName && aboutOrg.url === organization.ABOUT_URL);
  A('seido-about.html: 対象サイトに兄弟サイト 3 つの URL', ['https://kokuho-keisan.jp/', 'https://shaho-keisan.jp/', 'https://shogakukin-keisan.jp/'].every((u) => text.includes(u)));
}
{
  const xml = fs.readFileSync(path.join(ROOT, 'seido-sitemap.xml'), 'utf8');
  A('seido-sitemap.xml: /about/ を含む', xml.includes('<loc>https://seido-keisan.jp/about/</loc>'));
}

// kokuho トップ（index.html・generate-selector.js が出す）: description・canonical・JSON-LD の publisher・運営者フッター
{
  const d = load('index.html');
  A('index.html: meta description があり自治体数が固定文字でない（registry の数と一致）', (() => {
    const c = (d.querySelector('meta[name=description]') || {}).content || '';
    const n = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry/index.json'), 'utf8')).municipalities.filter((m) => (m.systems || []).includes('kokuho')).length;
    return c.includes(`全国${n}自治体`) && c.includes(organization.ORGANIZATION.name);
  })());
  A('index.html: canonical が https://kokuho-keisan.jp/', (d.querySelector('link[rel=canonical]') || {}).href === 'https://kokuho-keisan.jp/');
  const ld = [...d.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => { const j = JSON.parse(s.textContent); return j['@graph'] || [j]; });
  const site = ld.find((j) => j['@type'] === 'WebSite');
  const org = ld.find((j) => j['@type'] === 'Organization');
  A('index.html: WebSite の publisher が Organization の @id を参照', !!site && site.url === 'https://kokuho-keisan.jp/' && (site.publisher || {})['@id'] === organization.ORGANIZATION_ID);
  A('index.html: Organization 本体（@id が /about/ と同じ）', !!org && org['@id'] === organization.ORGANIZATION_ID && org.name === organization.ORGANIZATION.name);
  A('index.html: フッターに運営者行と /about/ への導線', [...d.querySelectorAll('a[href="https://seido-keisan.jp/about/"]')].some((a) => /運営者情報/.test(a.textContent)));
  const sisters = organization.SISTER_SITES.filter((x) => x.host !== 'kokuho-keisan.jp');
  A('index.html: 関連サイト行に自サイト以外の兄弟サイト（nofollow なし）', sisters.every((x) => [...d.querySelectorAll(`a[href="${x.url}"]`)].some((a) => a.textContent === x.name && !/nofollow/.test(a.getAttribute('rel') || ''))) && !d.querySelector('a[href="https://kokuho-keisan.jp/"]'));
  A('index.html: 制度セレクトに奨学金を入れていない', ![...d.querySelectorAll('#system option')].some((o) => /奨学金/.test(o.textContent)));
}

// 全テンプレートの生成物（テンプレートごとに 1 ページ）: publisher が Organization の @id を参照し、Organization 本体が 1 つ。
// フッターは運営者行＋関連サイト行（自サイトを除く）。seido-* の全国ページは JSON-LD を持たないのでフッターだけ検査する
{
  const SAMPLES = [
    // [生成物, 元テンプレート, 自サイト host, JSON-LD を持つか]
    ['aichi/nagoya/index.html',        'kokuho-simple',   'kokuho-keisan.jp', true],
    ['aichi/nagoya/income.html',       'kokuho-income',   'kokuho-keisan.jp', true],
    ['aichi/index.html',               'prefecture-page', 'kokuho-keisan.jp', true],
    ['keigen/index.html',              'article',         'kokuho-keisan.jp', true],
    ['aichi/nagoya/jumin/index.html',  'jumin-simple',    'seido-keisan.jp',  true],
    ['aichi/nagoya/jumin/income.html', 'jumin-income',    'seido-keisan.jp',  true],
    ['aichi/nagoya/kakeibo/index.html','city-integrated', 'seido-keisan.jp',  true],
    ['aichi/nagoya/kouki/index.html',  'kouki-simple',    'seido-keisan.jp',  true],
    ['aichi/nagoya/kouki/income.html', 'kouki-income',    'seido-keisan.jp',  true],
    ['aichi/nagoya/kaigo/index.html',  'kaigo-simple',    'seido-keisan.jp',  true],
    ['aichi/nagoya/hoiku/index.html',  'hoiku-simple',    'seido-keisan.jp',  true],
    ['seido-index.html',               'seido-index',     'seido-keisan.jp',  true],
    ['seido-furusato.html',            'seido-furusato',  'seido-keisan.jp',  false],
    ['seido-onestop.html',             'seido-onestop',   'seido-keisan.jp',  false],
    ['seido-jieigyo.html',             'seido-jieigyo',   'seido-keisan.jp',  false],
    ['seido-ikukyu.html',              'seido-ikukyu',    'seido-keisan.jp',  false],
    ['seido-haito.html',               'seido-haito',     'seido-keisan.jp',  false],
    ['seido-taishoku.html',            'seido-taishoku',  'seido-keisan.jp',  false],
  ];
  const MAIN_TYPES = new Set(['WebApplication', 'WebPage', 'Article', 'WebSite']);
  for (const [file, tmpl, selfHost, hasLd] of SAMPLES) {
    if (!fs.existsSync(path.join(ROOT, file))) { A(`${tmpl}: 生成物 ${file} が存在する`, false); continue; }
    const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const d = new JSDOM(raw).window.document;
    A(`${tmpl}: __OPERATOR_FOOTER__ が未置換で残っていない (${file})`, !raw.includes('__OPERATOR_FOOTER__'));
    if (hasLd) {
      const nodes = [...d.querySelectorAll('script[type="application/ld+json"]')].flatMap((s) => { const j = JSON.parse(s.textContent); return j['@graph'] || [j]; });
      const orgs = nodes.filter((n) => n['@type'] === 'Organization');
      A(`${tmpl}: Organization 本体が 1 つ（@id・name が定数と一致）`, orgs.length === 1 && orgs[0]['@id'] === organization.ORGANIZATION_ID && orgs[0].name === organization.ORGANIZATION.name);
      const mains = nodes.filter((n) => MAIN_TYPES.has(n['@type']));
      A(`${tmpl}: 主ノード（${mains.map((n) => n['@type']).join('/') || 'なし'}）の publisher が Organization の @id を参照`, mains.length >= 1 && mains.every((n) => (n.publisher || {})['@id'] === organization.ORGANIZATION_ID));
      // 他の Organization 定義（name がドメイン名の旧 author/publisher）が残っていない
      A(`${tmpl}: @id 無しの Organization（旧 author/publisher）が残っていない`, !JSON.stringify(nodes).includes('"name":"kokuho-keisan.jp"'));
    }
    const ps = [...d.querySelectorAll('p')];
    const opRow = ps.find((p) => p.textContent.includes(`運営：${organization.ORGANIZATION.name}（${organization.ORGANIZATION.alternateName}）`));
    A(`${tmpl}: フッターに運営者行（/about/ への導線つき）`, !!opRow && !!opRow.querySelector(`a[href="${organization.ABOUT_URL}"]`));
    const relRow = ps.find((p) => p.textContent.trim().startsWith('関連サイト：'));
    const hrefs = relRow ? [...relRow.querySelectorAll('a')].map((a) => a.getAttribute('href')).sort() : [];
    const expected = organization.SISTER_SITES.filter((s) => s.host !== selfHost).map((s) => s.url).sort();
    A(`${tmpl}: 関連サイト行が自サイト（${selfHost}）を除いた兄弟サイトと一致・nofollow なし`, JSON.stringify(hrefs) === JSON.stringify(expected) && !!relRow && ![...relRow.querySelectorAll('a')].some((a) => /nofollow/.test(a.getAttribute('rel') || '')));
  }
}

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
