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
}
{
  const xml = fs.readFileSync(path.join(ROOT, 'seido-sitemap.xml'), 'utf8');
  A('seido-sitemap.xml: /about/ を含む', xml.includes('<loc>https://seido-keisan.jp/about/</loc>'));
}

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
