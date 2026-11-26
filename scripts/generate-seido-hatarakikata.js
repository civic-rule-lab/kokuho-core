/**
 * generate-seido-hatarakikata.js — 働き方の比較（全国1ページ）を生成する
 *
 * 入力: templates/seido-hatarakikata.html
 *       registry/index.json（国保ページを公開している自治体の一覧＝都道府県→市区町村のプルダウン）
 *       data/reference/kyuchi.json（住民税 均等割の非課税限度額に使う級地。自治体ごとにページへ埋め込む）
 *       data/national/hatarakikata-2026.json（年の組み合わせ・比較の前提・掛金の上限）
 *       data/shaho/kenpo-2026.json・kosei-nenkin.json・koyo-2026.json・standard-monthly.json（会社員の社会保険料）
 *       data/national/shotokuzei-2026.json（所得税）・jumin-haigusha-kojo.json（配偶者控除の表）
 *       data/national/kokumin-nenkin-2026.json（国民年金保険料）・nenkin-kyufu-2026.json（年金額）・kojin-jigyozei-2026.json（個人の事業税）
 * 出力: seido-hatarakikata.html（kokuho-core 直下。deploy-seido.sh が配信先の hatarakikata/index.html へコピーする）
 * 自治体ごとの国保データ・住民税データはページが /data/municipalities/{slug}/ から fetch する。
 *
 * 実行: node scripts/generate-seido-hatarakikata.js
 * 2回実行して差分が出ないこと（実行日などの可変値を入れない）。
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import organization from './lib/organization.cjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TMPL = path.join(ROOT, 'templates', 'seido-hatarakikata.html');
const OUT = path.join(ROOT, 'seido-hatarakikata.html');

// このページが読む JS の全部（1 本でも漏れると ?v= が動かず、CDN に旧版が残る）。テンプレートの <script src> と突き合わせる
const JS_FILES = ['shared/ui-input.js', 'shared/income.js', 'shaho.js', 'shotoku.js', 'jumin.js', 'kokuho.js', 'nenkin-kyufu.js', 'jigyozei.js', 'hatarakikata.js'];
function fileHash(...filePaths) {
  const h = createHash('sha256');
  for (const p of filePaths) { if (!existsSync(p)) throw new Error(`ハッシュの対象がありません: ${p}`); h.update(readFileSync(p)); }
  return h.digest('hex').slice(0, 8);
}
const CSS_V = fileHash(path.join(ROOT, 'css', 'common.css'));
const JS_V = fileHash(...JS_FILES.map((f) => path.join(ROOT, 'js', 'core', f)));

const tmpl = readFileSync(TMPL, 'utf-8');
const srcs = [...tmpl.matchAll(/<script src="\/js\/core\/([^"?]+)\?v=__JS_V__"><\/script>/g)].map((m) => m[1]);
if (srcs.join(',') !== JS_FILES.join(',')) throw new Error(`テンプレートが読む JS と JS_FILES が食い違っている: ${srcs.join(',')}`);

// 制度値は JSON の文字列をそのまま埋め込む（parse → stringify を通さない）
const DATA = {
  __HK_CONFIG__: 'data/national/hatarakikata-2026.json',
  __SHAHO_KENPO__: 'data/shaho/kenpo-2026.json',
  __SHAHO_KOSEI__: 'data/shaho/kosei-nenkin.json',
  __SHAHO_KOYO__: 'data/shaho/koyo-2026.json',
  __SHAHO_STANDARD__: 'data/shaho/standard-monthly.json',
  __SHOTOKU_DB__: 'data/national/shotokuzei-2026.json',
  __HAIGU_DATA__: 'data/national/jumin-haigusha-kojo.json',
  __NENKIN_DATA__: 'data/national/kokumin-nenkin-2026.json',
  __NENKIN_KYUFU_DATA__: 'data/national/nenkin-kyufu-2026.json',
  __JIGYOZEI_DATA__: 'data/national/kojin-jigyozei-2026.json',
};
const texts = {};
for (const [ph, rel] of Object.entries(DATA)) {
  const t = readFileSync(path.join(ROOT, rel), 'utf-8').trim();
  JSON.parse(t);
  if (/<\/script/i.test(t)) throw new Error(`制度値に </script が含まれている: ${rel}`);
  texts[ph] = t;
}

// 自治体一覧（国保ページを公開している自治体のみ。JIS コード順）＋級地
const registry = JSON.parse(readFileSync(path.join(ROOT, 'registry', 'index.json'), 'utf-8'));
const KYUCHI = JSON.parse(readFileSync(path.join(ROOT, 'data', 'reference', 'kyuchi.json'), 'utf-8')).municipalities;
const has = (m, sys) => !!((m.systems && m.systems.includes(sys)) || (m.publishYear && m.publishYear[sys]));
const index = {};
for (const m of [...registry.municipalities].sort((a, b) => String(a.cityCode).localeCompare(String(b.cityCode)))) {
  if (!has(m, 'kokuho')) continue;
  const kv = KYUCHI[m.citySlug];
  if (!/^[123]-[12]$/.test(kv || '')) throw new Error(`級地が data/reference/kyuchi.json にありません: ${m.citySlug}`);
  if (!index[m.prefecture]) index[m.prefecture] = { slug: m.prefectureSlug, cities: [] };
  index[m.prefecture].cities.push({ slug: m.citySlug, name: m.cityName, k: Number(kv[0]), j: has(m, 'jumin') ? 1 : 0 });
}
const cityCount = Object.values(index).reduce((n, p) => n + p.cities.length, 0);

let html = tmpl
  .replaceAll('__CSS_V__', CSS_V)
  .replaceAll('__JS_V__', JS_V)
  .replaceAll('__CITY_COUNT__', String(cityCount))
  .replace('__CITY_INDEX__', () => JSON.stringify(index))
  .replaceAll('__OPERATOR_FOOTER__', () => organization.operatorFooterHtml('seido-keisan.jp'));
for (const [ph, t] of Object.entries(texts)) {
  if (html.split(ph).length !== 2) throw new Error(`プレースホルダは 1 か所だけにする: ${ph}`);
  html = html.replace(ph, () => t);
}
// 未置換のプレースホルダ（__JS_V__ のような形）が残っていないこと。埋め込んだ制度値の中は見ない
const shell = tmpl.replace(/__[A-Z_]+__/g, (m) => (m in texts || ['__CSS_V__', '__JS_V__', '__CITY_COUNT__', '__CITY_INDEX__', '__OPERATOR_FOOTER__'].includes(m) ? '' : m));
if (/__[A-Z_]+__/.test(shell)) throw new Error('未置換のプレースホルダが残っている: ' + shell.match(/__[A-Z_]+__/)[0]);
writeFileSync(OUT, html, 'utf-8');
console.log(`✅ 働き方の比較を生成しました: ${path.relative(ROOT, OUT)}（${cityCount}自治体・JS v=${JS_V}）`);
