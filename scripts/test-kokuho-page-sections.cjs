#!/usr/bin/env node
/**
 * test-kokuho-page-sections.cjs — 国保 市区町村ページ（かんたん・所得ベース）の節の検査（S1 3-4・3-5・4-4・4-5・4-6）
 *
 * なぜ生成器を一時ディレクトリへ走らせるか:
 *   リポにコミットされている生成物は deploy 時に作り直されるまで古いままなので、
 *   テンプレ・生成器の変更を検査するにはその場で生成した HTML を見るしかない。
 *   GEN_OUT_DIR で出力先を一時ディレクトリにし、リポの生成物には触れない。
 *
 * 検査:
 *   S-1 全ページに「この数値の根拠」節がある（許可外ホストでも節を落とさない・FG-03/ID-08）
 *   S-2 許可外ホストの節（data-prov-link="omitted"）は <a> を描かず「直接リンクは省略」と書く
 *   S-3 全ページに「計算のしかた」節があり、料率表の後にある（§4-3）
 *   S-4 注意書きは見出し「計算の前提」付きの箇条書き（※…<br> の段落が残っていない・§4-4）
 *   S-5 他サイト導線: seido-keisan.jp/furusato へのリンクはボタン（cta-item）で末尾に ↗（§4-5・ID-06）
 *   S-6 所得ベースの memberIncome1〜4 に <label for> がある（ID-05）
 *   S-7 置換し忘れのプレースホルダ（__XXX__）が無い
 *
 * 使い方: node scripts/test-kokuho-page-sections.cjs
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'kokuho-sections-'));
let fails = 0;
function fail(name, list) {
  fails++;
  console.error(`  ✗ ${name}: ${list.length} 件`);
  for (const x of list.slice(0, 10)) console.error(`      ${x}`);
}
function ok(name) { console.log(`  ✓ ${name}`); }

try {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts/generate-official-pages.js')], {
    cwd: ROOT, env: { ...process.env, GEN_OUT_DIR: OUT, PROVENANCE_AB: '' }, stdio: ['ignore', 'ignore', 'ignore'],
  });

  const pages = [];
  for (const pref of fs.readdirSync(OUT)) {
    const pd = path.join(OUT, pref);
    if (!fs.statSync(pd).isDirectory()) continue;
    for (const slug of fs.readdirSync(pd)) {
      for (const f of ['index.html', 'income.html']) {
        const p = path.join(pd, slug, f);
        if (fs.existsSync(p)) pages.push(path.relative(OUT, p));
      }
    }
  }
  console.log(`対象ページ: ${pages.length}`);
  if (pages.length < 1000) fail('生成ページ数が少なすぎる', [String(pages.length)]);

  const bad = { s1: [], s2: [], s3: [], s4: [], s5: [], s6: [], s7: [] };
  const omitted = new Set();
  for (const rel of pages) {
    const html = fs.readFileSync(path.join(OUT, rel), 'utf8');
    const prov = (html.match(/<section class="provenance"[\s\S]*?<\/section>/) || [''])[0];
    if (!prov.includes('この数値の根拠')) bad.s1.push(rel);
    if (prov.includes('data-prov-link="omitted"')) {
      omitted.add(path.dirname(rel));
      if (/<a\s/.test(prov) || !prov.includes('直接リンクは省略')) bad.s2.push(rel);
    }
    const iTable = html.indexOf('の国民健康保険料率</h2>');
    const iCalc = html.indexOf('<section class="calc-method"');
    if (iCalc < 0 || iTable < 0 || iCalc < iTable || !html.includes('<h2>計算のしかた</h2>')) bad.s3.push(rel);
    const note = (html.match(/<div class="note">[\s\S]*?<\/div>/) || [''])[0];
    if (!note.includes('<h2>計算の前提</h2>') || !note.includes('<ul>') || /※[^<]*<br>/.test(note)) bad.s4.push(rel);
    const furu = html.match(/<a [^>]*href="https:\/\/seido-keisan\.jp\/furusato\/[^"]*"[^>]*>[\s\S]*?<\/a>/g) || [];
    if (furu.length === 0 || furu.some((a) => !a.includes('cta-ext">↗') || a.includes('→'))) bad.s5.push(rel);
    if (!/class="cta-item"[^\n]*seido-keisan\.jp\/furusato\//.test(html)) bad.s5.push(rel + '（cta-item 外）');
    if (rel.endsWith('income.html')) {
      for (let i = 1; i <= 4; i++) if (!html.includes(`<label for="memberIncome${i}"`)) bad.s6.push(`${rel} memberIncome${i}`);
    }
    const ph = html.match(/__[A-Z][A-Z0-9_]*__/g);
    if (ph) bad.s7.push(`${rel} ${[...new Set(ph)].join(',')}`);
  }

  const names = {
    s1: 'S-1 全ページに根拠節', s2: 'S-2 許可外ホストの節はリンク無し・省略の明記', s3: 'S-3 計算のしかた節が料率表の後にある',
    s4: 'S-4 注意書きは見出し付き箇条書き', s5: 'S-5 seido-keisan への導線はボタン＋↗', s6: 'S-6 memberIncome1〜4 に label for',
    s7: 'S-7 プレースホルダの置換漏れ無し',
  };
  for (const k of Object.keys(names)) bad[k].length ? fail(names[k], bad[k]) : ok(names[k]);
  console.log(`  ℹ 出典リンクを省略した自治体: ${omitted.size} 件 ${[...omitted].sort().join(' ')}`);
} finally {
  fs.rmSync(OUT, { recursive: true, force: true });
}

console.log(fails ? `\n❌ ${fails} 件の検査が失敗` : '\n✅ 国保ページの節の検査: すべて通過');
process.exit(fails ? 1 : 0);
