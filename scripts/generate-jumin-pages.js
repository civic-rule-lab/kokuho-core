/**
 * 住民税ページ生成スクリプト
 *
 * registry/index.json を回し、各自治体の住民税ページを生成する。
 * 国保ページ（{pref}/{slug}/index.html）を壊さないよう、住民税は jumin/ 名前空間、
 * 自治体統合ページは kakeibo/ に出力する。
 *
 * 生成物（自治体ごと）:
 *   {prefSlug}/{citySlug}/jumin/index.html    住民税 かんたん計算
 *   {prefSlug}/{citySlug}/jumin/income.html   住民税 詳しく計算
 *   {prefSlug}/{citySlug}/kakeibo/index.html  負担まとめて計算（住民税＋国保＋介護）
 *
 * テンプレート:
 *   templates/jumin-simple.html / jumin-income.html / city-integrated.html
 *
 * 公開対象の選定:
 *   - 引数で slug 指定 → その自治体のみ（テスト用・データ無くても標準値で生成）
 *   - 引数なし → registry で systems に "jumin" を含む or publishYear.jumin がある自治体のみ
 *     （verified 先行公開の方針。registry 未設定なら 0 件）
 *
 * 実行:
 *   node scripts/generate-jumin-pages.js nagoya
 *   node scripts/generate-jumin-pages.js            （公開対象を一括生成）
 */

'use strict';

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const TMPL_DIR  = path.join(ROOT, 'templates');
const REGISTRY  = path.join(ROOT, 'registry', 'index.json');
const DATA_DIR  = path.join(ROOT, 'data', 'municipalities');
const BASE_URL  = 'https://seido-keisan.jp';
const DEFAULT_YEAR = 2026;

// ─── バージョンハッシュ（キャッシュバスティング） ───
function fileHash(...filePaths) {
  const h = createHash('sha256');
  for (const p of filePaths) if (existsSync(p)) h.update(readFileSync(p));
  return h.digest('hex').slice(0, 8);
}
const CSS_V = fileHash(path.join(ROOT, 'css', 'common.css'));
const JS_V  = fileHash(
  path.join(ROOT, 'js', 'core', 'shared', 'income.js'),
  path.join(ROOT, 'js', 'core', 'jumin.js'),
  path.join(ROOT, 'js', 'core', 'kokuho.js'),
  path.join(ROOT, 'js', 'core', 'kaigo.js'),
);

// ─── ヘルパー ───
function fiscalYearLabel(year) { return `令和${year - 2018}年度`; }

function loadJumin(citySlug, year) {
  const p = path.join(DATA_DIR, citySlug, `jumin-${year}.json`);
  if (existsSync(p)) {
    try { return JSON.parse(readFileSync(p, 'utf-8')); }
    catch (e) { console.warn(`⚠️  JSON parse error: ${p}\n   ${e.message}`); }
  }
  return null; // 標準値で計算（エンジンがフォールバック）
}

function totalRateLabel(data) {
  const pr = data?.prefRate ?? 0.04;
  const cr = data?.cityRate ?? 0.06;
  return ((pr + cr) * 100).toFixed(3).replace(/\.?0+$/, '') + '%';
}

function metaDesc(cityName, fy, data, kind) {
  const rate = totalRateLabel(data);
  if (kind === 'income') {
    return `${cityName}の住民税（市民税・県民税）はいくら？社会保険料・扶養・保険料控除・ふるさと納税まで入力して${fy}の税額を詳しくシミュレーション。所得割${rate}・均等割を反映。`;
  }
  if (kind === 'kakeibo') {
    return `${cityName}の税金・保険料はいくら？${fy}の住民税・国民健康保険・介護保険の年間負担を、収入と家族構成からまとめて概算する家計簿シミュレーター。`;
  }
  return `${cityName}の住民税（市民税・県民税）はいくら？${fy}の税額を給与収入から無料でシミュレーション。所得割${rate}・均等割を反映した年間の目安をかんたん計算（シュミレーション）できます。`;
}

function introText(cityName, fy, data) {
  const rate = totalRateLabel(data);
  return `${cityName}の住民税（市民税・県民税）が${fy}いくらになるか、無料でシミュレーションできます。所得割の合計税率は${rate}です。給与収入・年金・年齢を入力すると、社会保険料控除を概算した年間の住民税額の目安を計算します。`;
}

function jsonLd(cityName, prefName, prefSlug, citySlug, desc, url, fy, appName) {
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: '制度計算ポータル', item: BASE_URL + '/' },
      { '@type': 'ListItem', position: 2, name: prefName, item: `${BASE_URL}/#${prefSlug}` },
      { '@type': 'ListItem', position: 3, name: cityName, item: `${BASE_URL}/${prefSlug}/${citySlug}/` },
    ],
  };
  const app = {
    '@type': 'WebApplication',
    name: `${cityName} ${appName}（${fy}）`,
    description: desc,
    url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    inLanguage: 'ja',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
  };
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [breadcrumb, app] });
}

// 共通プレースホルダ置換
function fill(template, map) {
  let out = template;
  for (const [k, v] of Object.entries(map)) out = out.replaceAll(k, v);
  return out;
}

// ─── テンプレート読込 ───
const tmplSimple = readFileSync(path.join(TMPL_DIR, 'jumin-simple.html'), 'utf-8');
const tmplIncome = readFileSync(path.join(TMPL_DIR, 'jumin-income.html'), 'utf-8');
const tmplKakeibo = readFileSync(path.join(TMPL_DIR, 'city-integrated.html'), 'utf-8');

// ─── 対象自治体の決定 ───
const registry   = JSON.parse(readFileSync(REGISTRY, 'utf-8'));
const targetSlug = process.argv[2] || null;

let targets;
if (targetSlug) {
  targets = registry.municipalities.filter(m => m.citySlug === targetSlug);
  if (targets.length === 0) { console.error(`❌ スラグが見つかりません: ${targetSlug}`); process.exit(1); }
} else {
  targets = registry.municipalities.filter(
    m => (m.systems && m.systems.includes('jumin')) || (m.publishYear && m.publishYear.jumin)
  );
}

let generated = 0;
const skipped = [];

for (const m of targets) {
  const prefSlug = m.prefectureSlug;
  const prefName = m.prefecture;
  if (!prefSlug) { skipped.push(`${m.cityName}: prefectureSlug 未定義`); continue; }

  const citySlug = m.citySlug;
  const cityName = m.cityName;
  const year = (m.publishYear && m.publishYear.jumin) || DEFAULT_YEAR;
  const fy = fiscalYearLabel(year);
  const data = loadJumin(citySlug, year);
  const juminDataLiteral = data ? JSON.stringify(data) : 'null';

  const cityBase = `${BASE_URL}/${prefSlug}/${citySlug}`;

  // 1) かんたん計算: {pref}/{slug}/jumin/index.html
  const simpleUrl = `${cityBase}/jumin/`;
  const simpleDesc = metaDesc(cityName, fy, data, 'simple');
  const simpleHtml = fill(tmplSimple, {
    '__CITY_NAME__': cityName,
    '__CITY_SLUG__': citySlug,
    '__FISCAL_YEAR_LABEL__': fy,
    '__META_DESC__': simpleDesc,
    '__CANONICAL_URL__': simpleUrl,
    '__JSON_LD__': jsonLd(cityName, prefName, prefSlug, citySlug, simpleDesc, simpleUrl, fy, '住民税計算ツール'),
    '__INTRO_TEXT__': introText(cityName, fy, data),
    '__JUMIN_DATA__': juminDataLiteral,
    '__PORTAL_LINK__': '../kakeibo/',
    '__PUBLISH_YEAR__': String(year),
    '__CSS_V__': CSS_V,
    '__JS_V__': JS_V,
  });

  // 2) 詳しく計算: {pref}/{slug}/jumin/income.html
  const incomeUrl = `${cityBase}/jumin/income.html`;
  const incomeDesc = metaDesc(cityName, fy, data, 'income');
  const incomeHtml = fill(tmplIncome, {
    '__CITY_NAME__': cityName,
    '__CITY_SLUG__': citySlug,
    '__FISCAL_YEAR_LABEL__': fy,
    '__META_DESC__': incomeDesc,
    '__CANONICAL_URL__': incomeUrl,
    '__JSON_LD__': jsonLd(cityName, prefName, prefSlug, citySlug, incomeDesc, incomeUrl, fy, '住民税計算ツール（詳しく）'),
    '__JUMIN_DATA__': juminDataLiteral,
    '__PUBLISH_YEAR__': String(year),
    '__CSS_V__': CSS_V,
    '__JS_V__': JS_V,
  });

  // 3) 統合（負担まとめて）: {pref}/{slug}/kakeibo/index.html
  const kakeiboUrl = `${cityBase}/kakeibo/`;
  const kakeiboDesc = metaDesc(cityName, fy, data, 'kakeibo');
  const kakeiboHtml = fill(tmplKakeibo, {
    '__CITY_NAME__': cityName,
    '__CITY_SLUG__': citySlug,
    '__FISCAL_YEAR_LABEL__': fy,
    '__META_DESC__': kakeiboDesc,
    '__CANONICAL_URL__': kakeiboUrl,
    '__JSON_LD__': jsonLd(cityName, prefName, prefSlug, citySlug, kakeiboDesc, kakeiboUrl, fy, '家計簿シミュレーター'),
    '__LINK_JUMIN__': '../jumin/',
    // 暫定: seido-keisan に国保ページが無い間は、既存の kokuho-keisan.jp の該当ページを参照。
    // 国保を seido-keisan へ移行したら '../' に戻す（templates の target=_blank も外す）。
    '__LINK_KOKUHO__': `https://kokuho-keisan.jp/${prefSlug}/${citySlug}/`,
    '__CSS_V__': CSS_V,
    '__JS_V__': JS_V,
  });

  const juminDir   = path.join(ROOT, prefSlug, citySlug, 'jumin');
  const kakeiboDir = path.join(ROOT, prefSlug, citySlug, 'kakeibo');
  mkdirSync(juminDir,   { recursive: true });
  mkdirSync(kakeiboDir, { recursive: true });
  writeFileSync(path.join(juminDir,   'index.html'),  simpleHtml,  'utf-8');
  writeFileSync(path.join(juminDir,   'income.html'), incomeHtml,  'utf-8');
  writeFileSync(path.join(kakeiboDir, 'index.html'),  kakeiboHtml, 'utf-8');

  generated++;
}

console.log(`\n✅ ${generated}自治体の住民税ページを生成しました`);
console.log(`   出力: {pref}/{slug}/jumin/{index,income}.html ＋ {pref}/{slug}/kakeibo/index.html`);
if (!targetSlug && generated === 0) {
  console.log(`   （registry の systems に "jumin" を追加すると一括公開対象になります）`);
}
if (skipped.length > 0) { console.warn('\n⚠️  スキップ:'); skipped.forEach(s => console.warn('  ', s)); }
console.log();
