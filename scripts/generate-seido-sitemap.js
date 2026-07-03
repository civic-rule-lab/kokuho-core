/**
 * seido-keisan.jp 用 sitemap 生成スクリプト
 *
 * registry/index.json から、seido-keisan に公開される各制度ページのURLを収集する。
 * deploy-seido.sh が同期するサブディレクトリ（jumin / kakeibo / kouki / kaigo）と
 * 1:1 で対応するURLのみを出力するため、サイトマップに 404 が混入しない。
 *
 *   - systems に jumin … /{pref}/{slug}/jumin/ ＋ /jumin/income.html
 *   - systems に kaigo … /{pref}/{slug}/kaigo/ ＋ /kakeibo/（家計簿は介護公開と1:1）
 *   - systems に kouki … /{pref}/{slug}/kouki/ ＋ /kouki/income.html
 *
 * 出力: リポジトリ直下 seido-sitemap.xml
 *   （旧 kokuho-keisan 用 sitemap.xml とは別ファイル。deploy-seido.sh が
 *     公開リポの sitemap.xml としてコピーする）
 *
 * 実行: node scripts/generate-seido-sitemap.js
 */
'use strict';

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT     = path.join(__dirname, '..');
const BASE_URL = 'https://seido-keisan.jp';

const registry = JSON.parse(readFileSync(path.join(ROOT, 'registry', 'index.json'), 'utf-8'));
const today    = new Date().toISOString().slice(0, 10);

const urls = [
  // アンブレラ・トップ
  { loc: `${BASE_URL}/`, priority: '1.0', changefreq: 'monthly' },
];

let n = { jumin: 0, kakeibo: 0, kouki: 0, kaigo: 0 };
const koukiPrefs = new Set();

for (const m of registry.municipalities) {
  const prefSlug = m.prefectureSlug;
  if (!prefSlug || !m.citySlug) continue;
  const base = `${BASE_URL}/${prefSlug}/${m.citySlug}`;
  const sys  = m.systems || [];

  // 住民税：index は income.html を canonical に指定済みのため income を優先度高めに
  if (sys.includes('jumin')) {
    urls.push({ loc: `${base}/jumin/income.html`, priority: '0.8', changefreq: 'yearly' });
    urls.push({ loc: `${base}/jumin/`,            priority: '0.6', changefreq: 'yearly' });
    n.jumin++;
  }
  // 介護（第1号）＋ 家計簿（統合）。家計簿は介護公開と 1:1。
  if (sys.includes('kaigo')) {
    urls.push({ loc: `${base}/kaigo/`,   priority: '0.7', changefreq: 'yearly' });
    urls.push({ loc: `${base}/kakeibo/`, priority: '0.7', changefreq: 'yearly' });
    n.kaigo++;
    n.kakeibo++;
  }
  // 後期高齢者医療：自治体別ページは県版 /{pref}/kouki/ に canonical 集約済みのため
  // sitemap には県版のみを載せる（canonical 先でない URL は sitemap に含めない）。
  if (sys.includes('kouki')) {
    koukiPrefs.add(prefSlug);
  }
}

// 後期高齢者医療 県版：/{pref}/kouki/ ＋ income.html（47都道府県 × 2）
for (const prefSlug of [...koukiPrefs].sort()) {
  urls.push({ loc: `${BASE_URL}/${prefSlug}/kouki/`,            priority: '0.8', changefreq: 'yearly' });
  urls.push({ loc: `${BASE_URL}/${prefSlug}/kouki/income.html`, priority: '0.7', changefreq: 'yearly' });
  n.kouki++;
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

writeFileSync(path.join(ROOT, 'seido-sitemap.xml'), xml, 'utf-8');
console.log(`✅ seido-sitemap.xml 生成完了 (${urls.length} URL)`);
console.log(`   jumin ${n.jumin} / kaigo ${n.kaigo} / kakeibo ${n.kakeibo} / kouki ${n.kouki} 自治体`);
