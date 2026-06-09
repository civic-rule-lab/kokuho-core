/**
 * アンブレラ・ランディング（seido-keisan.jp トップ）生成
 *
 * registry の jumin 公開自治体（systems に "jumin" を含む）を
 * 都道府県→市区町村のインデックスにして templates/seido-index.html に注入し、
 * リポジトリ直下に seido-index.html を書き出す。
 * deploy-seido.sh がこれを公開リポの index.html としてコピーする。
 *
 * 実行: node scripts/generate-seido-index.js
 */
'use strict';

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT     = path.join(__dirname, '..');
const REGISTRY = path.join(ROOT, 'registry', 'index.json');
const TMPL     = path.join(ROOT, 'templates', 'seido-index.html');
const OUT      = path.join(ROOT, 'seido-index.html');

const registry = JSON.parse(readFileSync(REGISTRY, 'utf-8'));

// jumin 公開自治体を都道府県でグルーピング
const index = {};
for (const m of registry.municipalities) {
  const published = (m.systems && m.systems.includes('jumin')) || (m.publishYear && m.publishYear.jumin);
  if (!published) continue;
  const prefName = m.prefecture;
  if (!index[prefName]) index[prefName] = { slug: m.prefectureSlug, cities: [] };
  index[prefName].cities.push({ slug: m.citySlug, name: m.cityName });
}
// 市区町村名で安定ソート
for (const pn of Object.keys(index)) {
  index[pn].cities.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

const cityCount = Object.values(index).reduce((n, p) => n + p.cities.length, 0);

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '制度計算｜税金・保険料まるごとシミュレーター',
  description: 'お住まいの市区町村を選ぶだけで、住民税・国民健康保険・介護保険の年間負担をまとめて試算できる無料ツール。',
  url: 'https://seido-keisan.jp/',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Web',
  inLanguage: 'ja',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
});

const html = readFileSync(TMPL, 'utf-8')
  .replaceAll('__CITY_INDEX__', JSON.stringify(index))
  .replaceAll('__JSON_LD__', jsonLd);

writeFileSync(OUT, html, 'utf-8');
console.log(`\n✅ アンブレラ・ランディングを生成しました: seido-index.html`);
console.log(`   公開自治体: ${cityCount}市区町村 / ${Object.keys(index).length}都道府県`);
console.log(`   ${Object.keys(index).join('・')}`);
