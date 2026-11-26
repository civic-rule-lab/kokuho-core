/**
 * test-hatarakikata-links.cjs — 働き方の比較（/hatarakikata/）への導線の検査
 *
 *  1. トップ・所得税・自営業（ふるさと納税）の生成物に、/hatarakikata/ へのリンクが 1 つずつある
 *  2. 自治体ごとの家計簿ページすべてに、/hatarakikata/ へのリンクが 1 つずつある
 *  3. リンクの文言に、使わない語（お得・節税・最適・おすすめ・有利・対策）が無い
 *  4. リンク先のページが配信される（deploy-seido.sh が hatarakikata/index.html に置く・canonical が一致）
 *  5. 導線を足したテンプレート以外に /hatarakikata/ へのリンクが無い（別のサイトに配るページに混ざらない）
 *
 * 実行: node scripts/test-hatarakikata-links.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
let pass = 0, fail = 0;
const A = (label, cond, extra) => { console.log(`${cond ? '✓' : '✗'} ${label}${!cond && extra ? '  → ' + extra : ''}`); cond ? pass++ : fail++; };

const LINK = /<a\b[^>]*href="\/hatarakikata\/"[^>]*>([\s\S]*?)<\/a>/g;
const links = (html) => [...html.matchAll(LINK)].map((m) => ({ tag: m[0], text: m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() }));
const BANNED = ['お得', '節税', '最適', 'おすすめ', '有利', '対策'];
const texts = [];

// ── 1. 全国ページ ──
for (const [file, name] of [['seido-index.html', 'トップ'], ['seido-shotoku.html', '所得税'], ['seido-jieigyo.html', '自営業（ふるさと納税）']]) {
  const ls = links(read(file));
  A(`${name}（${file}）に /hatarakikata/ へのリンクが 1 つある`, ls.length === 1, `件数 ${ls.length}`);
  ls.forEach((l) => texts.push(l.text));
  A(`${name}: 同じサイトの中のリンクなので、別のタブで開かない`, ls.every((l) => !/target=/.test(l.tag)));
}

// ── 2. 家計簿（自治体ごと） ──
{
  const pages = [];
  for (const pref of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!pref.isDirectory() || pref.name.startsWith('.') || pref.name === 'node_modules') continue;
    const pdir = path.join(ROOT, pref.name);
    for (const city of fs.readdirSync(pdir, { withFileTypes: true })) {
      if (!city.isDirectory()) continue;
      const f = path.join(pdir, city.name, 'kakeibo', 'index.html');
      if (fs.existsSync(f)) pages.push(f);
    }
  }
  A('家計簿ページが 1,700 以上ある（検査の対象が空でない）', pages.length >= 1700, `件数 ${pages.length}`);
  const bad = [];
  const seen = new Set();
  for (const f of pages) {
    const ls = links(fs.readFileSync(f, 'utf8'));
    if (ls.length !== 1 || /target=/.test(ls[0].tag)) bad.push(path.relative(ROOT, f));
    ls.forEach((l) => seen.add(l.text));
  }
  A(`家計簿ページ ${pages.length} 件すべてに /hatarakikata/ へのリンクが 1 つずつある`, bad.length === 0, bad.slice(0, 5).join(' '));
  A('家計簿ページのリンクの文言は 1 種類', seen.size === 1, [...seen].join(' / '));
  seen.forEach((t) => texts.push(t));
}

// ── 3. 文言 ──
{
  const hit = texts.filter((t) => BANNED.some((b) => t.includes(b)));
  A('リンクの文言に、使わない語が無い', hit.length === 0, hit.join(' / '));
  A('リンクの文言が空でない', texts.length > 0 && texts.every((t) => t.length >= 4), texts.join(' / '));
}

// ── 4. リンク先 ──
{
  const deploy = read('scripts/deploy-seido.sh');
  A('deploy-seido.sh がページを hatarakikata/index.html に置く', /cp "\$CORE_DIR\/seido-hatarakikata\.html"\s+"\$PUBLIC_DIR\/hatarakikata\/index\.html"/.test(deploy));
  A('リンク先のページの canonical が https://seido-keisan.jp/hatarakikata/', read('seido-hatarakikata.html').includes('<link rel="canonical" href="https://seido-keisan.jp/hatarakikata/">'));
}

// ── 5. ほかのテンプレートに混ざっていない ──
{
  const ALLOWED = new Set(['city-integrated.html', 'seido-index.html', 'seido-shotoku.html', 'seido-jieigyo.html']);
  const others = fs.readdirSync(path.join(ROOT, 'templates')).filter((f) => f.endsWith('.html') && !ALLOWED.has(f))
    .filter((f) => /href="\/hatarakikata\/"/.test(read('templates/' + f)));
  A('導線を足した 4 つのテンプレート以外に /hatarakikata/ へのリンクが無い', others.length === 0, others.join(' '));
  A('導線を足した 4 つのテンプレートには、リンクが 1 つずつある', [...ALLOWED].every((f) => links(read('templates/' + f)).length === 1));
}

console.log(`\n結果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
