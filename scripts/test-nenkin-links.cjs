/**
 * test-nenkin-links.cjs — 国民年金の保険料と免除（/nenkin/）への導線の検査
 *
 *  1. トップ・働き方の比較・自営業（ふるさと納税）の生成物に、/nenkin/ へのリンクが 1 つずつある
 *  2. 同じサイトの中のリンクなので、別のタブで開かない
 *  3. リンクの文言に、使わない語（お得・節税・最適・おすすめ・有利・対策）が無い
 *  4. リンク先のページが配信される（deploy-seido.sh が nenkin/index.html に置く・canonical が一致）
 *  5. 導線を足したテンプレート以外に /nenkin/ へのリンクが無い（別のサイトに配るページに混ざらない）
 *  6. 生成物がテンプレートから作り直されている（テンプレートのリンクの数と一致）
 *
 * 実行: node scripts/test-nenkin-links.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let pass = 0, fail = 0;
const A = (label, cond, extra) => { console.log(`${cond ? '✓' : '✗'} ${label}${!cond && extra ? '  → ' + extra : ''}`); cond ? pass++ : fail++; };

const LINK = /<a\b[^>]*href="\/nenkin\/"[^>]*>([\s\S]*?)<\/a>/g;
const links = (html) => [...html.matchAll(LINK)].map((m) => ({ tag: m[0], text: m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }));
const BANNED = ['お得', '節税', '最適', 'おすすめ', '有利', '対策'];
const PAGES = [['seido-index.html', 'トップ'], ['seido-hatarakikata.html', '働き方の比較'], ['seido-jieigyo.html', '自営業（ふるさと納税）']];
const texts = [];

// ── 1・2. 全国ページ ──
for (const [file, name] of PAGES) {
  const ls = links(read(file));
  A(`${name}（${file}）に /nenkin/ へのリンクが 1 つある`, ls.length === 1, `件数 ${ls.length}`);
  ls.forEach((l) => texts.push(l.text));
  A(`${name}: 別のタブで開かない`, ls.length > 0 && ls.every((l) => !/target=/.test(l.tag)));
}

// ── 3. 文言 ──
{
  const hit = texts.filter((t) => BANNED.some((b) => t.includes(b)));
  A('リンクの文言に、使わない語が無い', hit.length === 0, hit.join(' / '));
  A('リンクの文言が空でない', texts.length === PAGES.length && texts.every((t) => t.length >= 4), texts.join(' / '));
  A('リンクの文言にページの名前（国民年金）が入っている', texts.length > 0 && texts.every((t) => t.includes('国民年金')), texts.join(' / '));
}

// ── 4. リンク先 ──
{
  const deploy = read('scripts/deploy-seido.sh');
  A('deploy-seido.sh がページを nenkin/index.html に置く', /cp "\$CORE_DIR\/seido-nenkin\.html"\s+"\$PUBLIC_DIR\/nenkin\/index\.html"/.test(deploy));
  A('リンク先のページの canonical が https://seido-keisan.jp/nenkin/', read('seido-nenkin.html').includes('<link rel="canonical" href="https://seido-keisan.jp/nenkin/">'));
  A('リンク先のページ自身には /nenkin/ へのリンクが無い（自分へのリンクを置かない）', links(read('seido-nenkin.html')).length === 0);
}

// ── 5・6. テンプレート ──
{
  const ALLOWED = new Set(PAGES.map(([f]) => f));
  const others = fs.readdirSync(path.join(ROOT, 'templates')).filter((f) => f.endsWith('.html') && !ALLOWED.has(f))
    .filter((f) => /href="\/nenkin\/"/.test(read('templates/' + f)));
  A('導線を足した 3 つのテンプレート以外に /nenkin/ へのリンクが無い', others.length === 0, others.join(' '));
  A('導線を足した 3 つのテンプレートには、リンクが 1 つずつある', [...ALLOWED].every((f) => links(read('templates/' + f)).length === 1));
  A('生成物のリンクの文言がテンプレートと同じ', PAGES.every(([f]) => JSON.stringify(links(read(f)).map((l) => l.text)) === JSON.stringify(links(read('templates/' + f)).map((l) => l.text))));
}

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
