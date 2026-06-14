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
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.join(__dirname, '..');
const TMPL_DIR  = path.join(ROOT, 'templates');
const REGISTRY  = path.join(ROOT, 'registry', 'index.json');
const DATA_DIR  = path.join(ROOT, 'data', 'municipalities');
const BASE_URL  = 'https://seido-keisan.jp';
const DEFAULT_YEAR = 2026;

const _require = createRequire(import.meta.url);
const { calculateJumin } = _require('../js/core/jumin.js');
const { calcSalaryIncome, calcPensionIncome } = _require('../js/core/shared/income.js');

// 年収帯別の住民税 計算例（市ごとに数字が変わる固有コンテンツ＝SEO索引対策）。
// かんたん計算ページと同じ前提（社保を給与の約14.4%で概算）で一致させる。
const JUMIN_CALC_MODELS = [
  { label: '年収300万円（単身）', salary: 3_000_000, pension: 0,         age: 40 },
  { label: '年収500万円（単身）', salary: 5_000_000, pension: 0,         age: 40 },
  { label: '年収700万円（単身）', salary: 7_000_000, pension: 0,         age: 40 },
  { label: '公的年金250万円（65歳）', salary: 0,      pension: 2_500_000, age: 65 },
];

function buildJuminExamples(cityName, data, fy) {
  const rows = JUMIN_CALC_MODELS.map(m => {
    const social = Math.round(m.salary * 0.144);
    const r = calculateJumin(data, { salary: m.salary, pension: m.pension, age: m.age, socialInsurance: social });
    return { label: m.label, total: r.total, monthly: r.monthly };
  });
  const th = 'padding:6px 10px;background:#f3f6fb;font-size:12px;font-weight:600;text-align:left;border:1px solid #e5e7eb;';
  const td = 'padding:6px 10px;font-size:12px;border:1px solid #e5e7eb;';
  const tdR = td + 'text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;';
  const body = rows.map(r =>
    `<tr><td style="${td}">${r.label}</td><td style="${tdR}">約 ${r.total.toLocaleString()}円</td><td style="${tdR}">約 ${r.monthly.toLocaleString()}円</td></tr>`
  ).join('');
  return `
  <div class="jt-card">
    <div class="jt-card-title">${cityName}の住民税の計算例（${fy}）</div>
    <p style="font-size:11px;color:#6b7280;margin:0 0 8px;">${cityName}の税率で、年収別の住民税額の目安を試算しました（給与所得控除・社会保険料控除を概算した単身の概算）。</p>
    <table class="jt-table"><thead><tr><th style="${th}">モデル</th><th style="${th}">住民税（年額）</th><th style="${th}">月額目安</th></tr></thead><tbody>${body}</tbody></table>
  </div>`;
}

// ─── enrichment: 税率の特徴＋他都市比較（市固有コンテンツ＝SEO索引対策） ───

const STD_PREF_RATE = 0.04, STD_CITY_RATE = 0.06; // 標準税率（政令市は県2%/市8%）
const SEIREI_PREF_RATE = 0.02, SEIREI_CITY_RATE = 0.08;
const COMPARE_SALARY = 5_000_000; // 比較モデル: 年収500万円・単身・40歳

function rateLabel(r) { return (r * 100).toFixed(3).replace(/\.?0+$/, '') + '%'; }

function modelTax(data) {
  const social = Math.round(COMPARE_SALARY * 0.144);
  return calculateJumin(data, { salary: COMPARE_SALARY, pension: 0, age: 40, socialInsurance: social }).total;
}

// 標準税率との比較プローズ（超過課税・減税の市だけ固有の文章になる）
function buildRateCharacter(cityName, data, prefSlug) {
  if (!data) return '';
  const pr = data.prefRate ?? STD_PREF_RATE;
  const cr = data.cityRate ?? STD_CITY_RATE;
  const total = pr + cr;
  const isSeirei = Math.abs(pr - SEIREI_PREF_RATE) < 0.005 || pr < 0.04; // 税源移譲（県2%/市8%）型
  const stdTotal = 0.10;
  const isTokyo = prefSlug === 'tokyo';
  const cityLabel = isTokyo ? '特別区民税' : '市民税';
  const prefLabel = isTokyo ? '都民税' : '県民税';
  const breakdown = `（${cityLabel}${rateLabel(cr)}＋${prefLabel}${rateLabel(pr)}）`;

  let sentence;
  if (Math.abs(total - stdTotal) < 0.0001) {
    sentence = `${cityName}の住民税所得割の合計税率は${rateLabel(total)}${breakdown}で、全国の標準税率と同じです。`;
  } else if (total < stdTotal) {
    sentence = `${cityName}の住民税所得割の合計税率は${rateLabel(total)}${breakdown}で、標準税率の10%より${rateLabel(stdTotal - total)}低くなっています。`;
  } else {
    sentence = `${cityName}の住民税所得割の合計税率は${rateLabel(total)}${breakdown}で、標準税率の10%より${rateLabel(total - stdTotal)}高い超過課税が行われています。`;
  }
  if (isSeirei && Math.abs(total - stdTotal) < 0.0001) {
    sentence += `（政令指定都市は税源移譲により県民税2%・市民税8%の配分です）`;
  }
  return sentence;
}

// 他の公開都市との比較表。同一県の都市を優先し、cityCode が近い順に最大4都市。
const _juminCache = new Map();
function loadJuminCached(slug, year) {
  const key = `${slug}:${year}`;
  if (!_juminCache.has(key)) _juminCache.set(key, loadJumin(slug, year));
  return _juminCache.get(key);
}

function buildJuminCompare(self, data, fy, publishedTargets) {
  if (!data || !self.cityCode) return '';
  const selfCode = parseInt(self.cityCode, 10);
  const others = publishedTargets
    .filter(m => m.citySlug !== self.citySlug && m.cityCode)
    .sort((a, b) => {
      const samePrefA = a.prefecture === self.prefecture ? 0 : 1;
      const samePrefB = b.prefecture === self.prefecture ? 0 : 1;
      if (samePrefA !== samePrefB) return samePrefA - samePrefB;
      return Math.abs(parseInt(a.cityCode, 10) - selfCode) - Math.abs(parseInt(b.cityCode, 10) - selfCode);
    })
    .slice(0, 4);
  if (others.length < 2) return '';

  const selfTax = modelTax(data);
  const rows = [];
  for (const o of others) {
    const oy = (o.publishYear && o.publishYear.jumin) || DEFAULT_YEAR;
    const od = loadJuminCached(o.citySlug, oy);
    if (!od) continue;
    const t = modelTax(od);
    rows.push({ name: o.cityName, rate: (od.prefRate ?? STD_PREF_RATE) + (od.cityRate ?? STD_CITY_RATE), tax: t, diff: t - selfTax });
  }
  if (rows.length < 2) return '';

  const th = 'padding:6px 10px;background:#f3f6fb;font-size:12px;font-weight:600;text-align:left;border:1px solid #e5e7eb;white-space:nowrap;';
  const td = 'padding:6px 10px;font-size:12px;border:1px solid #e5e7eb;';
  const tdR = td + 'text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;';

  const selfRate = (data.prefRate ?? STD_PREF_RATE) + (data.cityRate ?? STD_CITY_RATE);
  const selfRow = `<tr style="background:#eef2ff;"><td style="${td}font-weight:700;">${self.cityName}（このページ）</td>` +
    `<td style="${tdR}font-weight:700;">${rateLabel(selfRate)}</td><td style="${tdR}font-weight:700;">約 ${selfTax.toLocaleString()}円</td><td style="${tdR}">—</td></tr>`;
  const body = rows.map(r =>
    `<tr><td style="${td}">${r.name}</td><td style="${tdR}">${rateLabel(r.rate)}</td><td style="${tdR}">約 ${r.tax.toLocaleString()}円</td>` +
    `<td style="${tdR}">${r.diff === 0 ? '同額' : (r.diff > 0 ? '＋' : '−') + Math.abs(r.diff).toLocaleString() + '円'}</td></tr>`
  ).join('');

  return `
  <div class="jt-card">
    <div class="jt-card-title">${self.cityName}と他の都市の住民税比較（${fy}）</div>
    <p style="font-size:11px;color:#6b7280;margin:0 0 8px;">年収500万円（単身・40歳）のモデルで、所得割の合計税率と住民税額の目安を比較しました。住民税は税率がほぼ全国一律のため大きな差は出ませんが、超過課税や減税を行う自治体では金額が変わります。</p>
    <table class="jt-table"><thead><tr><th style="${th}">自治体</th><th style="${th}">所得割合計</th><th style="${th}">住民税（年額）</th><th style="${th}">差額</th></tr></thead><tbody>${selfRow}${body}</tbody></table>
  </div>`;
}

// ─── enrichment: 個別Q&A（市固有の数字入り＋FAQPage構造化データ） ───

function calcModelTax(data, salary) {
  const social = Math.round(salary * 0.144);
  return calculateJumin(data, { salary, pension: 0, age: 40, socialInsurance: social }).total;
}

function buildJuminFaq(cityName, data, fy, prefSlug) {
  if (!data) return { html: '', entity: null };
  const isTokyo = prefSlug === 'tokyo';
  const cityLabel = isTokyo ? '特別区民税' : '市民税';
  const prefLabel = isTokyo ? '都民税' : '県民税';
  const pr = data.prefRate ?? STD_PREF_RATE;
  const cr = data.cityRate ?? STD_CITY_RATE;
  const total = pr + cr;
  const pc = (data.cityPerCapita ?? 3000) + (data.prefPerCapita ?? 1000);
  const qa = [];

  // Q1: いくら？
  const t300 = calcModelTax(data, 3_000_000);
  const t500 = calcModelTax(data, 5_000_000);
  qa.push({
    q: `${cityName}の住民税はいくらですか？`,
    a: `${cityName}の${fy}の住民税は、単身・年収300万円なら年間約${t300.toLocaleString()}円（月約${Math.round(t300 / 12).toLocaleString()}円）、年収500万円なら年間約${t500.toLocaleString()}円が目安です（社会保険料控除を概算した単身の場合）。このページの計算機で、年収・年齢に応じた金額を無料で試算できます。`,
  });

  // Q2: 税率は？
  const stdDiff = Math.abs(total - 0.10) < 0.0001 ? '全国の標準税率と同じです'
    : total < 0.10 ? `標準税率の10%より${rateLabel(0.10 - total)}低い税率です`
    : `標準税率の10%より${rateLabel(total - 0.10)}高い超過課税です`;
  qa.push({
    q: `${cityName}の住民税の税率はいくつですか？`,
    a: `${fy}の${cityName}の所得割は合計${rateLabel(total)}（${cityLabel}${rateLabel(cr)}＋${prefLabel}${rateLabel(pr)}）で、${stdDiff}。均等割は${cityLabel}${(data.cityPerCapita ?? 3000).toLocaleString()}円＋${prefLabel}${(data.prefPerCapita ?? 1000).toLocaleString()}円に森林環境税（国税）1,000円を加えた合計${(pc + 1000).toLocaleString()}円です。`,
  });

  // Q3: 他の市より高い？
  qa.push({
    q: `${cityName}の住民税は他の市町村より高いですか？`,
    a: `住民税の所得割はほぼ全国一律の10%なので、住む場所による違いは基本的にわずかです。${cityName}は${stdDiff.replace('です', '')}ため、${Math.abs(total - 0.10) < 0.0001 ? '他の多くの市町村と同水準です' : '一部の市町村と金額が異なります'}。均等割は都道府県の森林環境税等の上乗せにより数百円〜千円程度の地域差があります。`,
  });

  // Q4: いつから払う？
  qa.push({
    q: `住民税はいつ・どうやって払いますか？`,
    a: `住民税は前年1月〜12月の所得に対して翌年度に課税され、毎年6月から納付が始まります。会社員は給与天引き（特別徴収・6月〜翌年5月の12回）、自営業や年金受給者などは納付書や口座振替（普通徴収・通常6月・8月・10月・翌年1月の4回）で納めます。`,
  });

  const items = qa.map(x => `
    <details style="border:1px solid #e5e7eb;border-radius:8px;padding:10px 14px;margin-bottom:8px;background:#fff;">
      <summary style="font-size:13px;font-weight:700;color:#374151;cursor:pointer;">${x.q}</summary>
      <p style="font-size:12px;color:#4b5563;line-height:1.8;margin:8px 0 0;">${x.a}</p>
    </details>`).join('');

  const html = `
  <div class="jt-card">
    <div class="jt-card-title">${cityName}の住民税 よくある質問</div>
    ${items}
  </div>`;

  const entity = {
    '@type': 'FAQPage',
    mainEntity: qa.map(x => ({
      '@type': 'Question',
      name: x.q,
      acceptedAnswer: { '@type': 'Answer', text: x.a },
    })),
  };
  return { html, entity };
}

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

function jsonLd(cityName, prefName, prefSlug, citySlug, desc, url, fy, appName, extraEntities = []) {
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
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [breadcrumb, app, ...extraEntities] });
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

// 比較表の母集団は常に「公開対象の全都市」（slug 指定実行時もブレないように）
const publishedJumin = registry.municipalities.filter(
  m => (m.systems && m.systems.includes('jumin')) || (m.publishYear && m.publishYear.jumin)
);

// jumin 公開 = 住民税ページ（単独 + 統合）を出す自治体
const isJuminPublished = m => (m.systems && m.systems.includes('jumin')) || (m.publishYear && m.publishYear.jumin);
// kaigo 公開 = 住民税は未整備だが介護が verified/inferred で、統合(家計簿)ページだけ出す自治体
const isKaigoPublished = m => (m.systems && m.systems.includes('kaigo')) || (m.publishYear && m.publishYear.kaigo);

let targets;
if (targetSlug) {
  targets = registry.municipalities.filter(m => m.citySlug === targetSlug);
  if (targets.length === 0) { console.error(`❌ スラグが見つかりません: ${targetSlug}`); process.exit(1); }
} else {
  // jumin 公開 or kaigo 公開のどちらかがあれば対象
  targets = registry.municipalities.filter(m => isJuminPublished(m) || isKaigoPublished(m));
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

  // jumin が公開対象の自治体だけ住民税の単独ページを出す。
  // kaigo のみ公開（住民税未整備）の自治体は統合(家計簿)ページのみ生成する。
  const juminHere = isJuminPublished(m);
  const juminLinkBlock = juminHere ? '<a href="../jumin/">住民税だけ詳しく →</a>' : '';

  const cityBase = `${BASE_URL}/${prefSlug}/${citySlug}`;

  // 1)+2) 住民税の単独ページ（jumin 公開自治体のみ生成。kaigo のみ公開は出さない）
  if (juminHere) {
    // 1) かんたん計算: {pref}/{slug}/jumin/index.html
    const simpleUrl = `${cityBase}/jumin/`;
    const simpleDesc = metaDesc(cityName, fy, data, 'simple');
    const faq = buildJuminFaq(cityName, data, fy, prefSlug);
    const simpleHtml = fill(tmplSimple, {
      '__CITY_NAME__': cityName,
      '__CITY_SLUG__': citySlug,
      '__FISCAL_YEAR_LABEL__': fy,
      '__META_DESC__': simpleDesc,
      '__CANONICAL_URL__': simpleUrl,
      '__JSON_LD__': jsonLd(cityName, prefName, prefSlug, citySlug, simpleDesc, simpleUrl, fy, '住民税計算ツール', faq.entity ? [faq.entity] : []),
      '__INTRO_TEXT__': introText(cityName, fy, data) + (data ? ' ' + buildRateCharacter(cityName, data, prefSlug) : ''),
      '__JUMIN_DATA__': juminDataLiteral,
      '__JUMIN_CALC_EXAMPLES__': buildJuminExamples(cityName, data, fy) + buildJuminCompare(m, data, fy, publishedJumin) + faq.html,
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

    const juminDir = path.join(ROOT, prefSlug, citySlug, 'jumin');
    mkdirSync(juminDir, { recursive: true });
    writeFileSync(path.join(juminDir, 'index.html'),  simpleHtml, 'utf-8');
    writeFileSync(path.join(juminDir, 'income.html'), incomeHtml, 'utf-8');
  }

  // 3) 統合（負担まとめて）: {pref}/{slug}/kakeibo/index.html（全対象で生成）
  const kakeiboUrl = `${cityBase}/kakeibo/`;
  const kakeiboDesc = metaDesc(cityName, fy, data, 'kakeibo');
  const kakeiboHtml = fill(tmplKakeibo, {
    '__CITY_NAME__': cityName,
    '__CITY_SLUG__': citySlug,
    '__FISCAL_YEAR_LABEL__': fy,
    '__META_DESC__': kakeiboDesc,
    '__CANONICAL_URL__': kakeiboUrl,
    '__JSON_LD__': jsonLd(cityName, prefName, prefSlug, citySlug, kakeiboDesc, kakeiboUrl, fy, '家計簿シミュレーター'),
    // 住民税の単独ページがある自治体だけ「住民税だけ詳しく」リンクを出す（kaigo のみ公開は空）
    '__LINK_JUMIN_BLOCK__': juminLinkBlock,
    // 暫定: seido-keisan に国保ページが無い間は、既存の kokuho-keisan.jp の該当ページを参照。
    // 国保を seido-keisan へ移行したら '../' に戻す（templates の target=_blank も外す）。
    '__LINK_KOKUHO__': `https://kokuho-keisan.jp/${prefSlug}/${citySlug}/`,
    '__CSS_V__': CSS_V,
    '__JS_V__': JS_V,
  });

  const kakeiboDir = path.join(ROOT, prefSlug, citySlug, 'kakeibo');
  mkdirSync(kakeiboDir, { recursive: true });
  writeFileSync(path.join(kakeiboDir, 'index.html'), kakeiboHtml, 'utf-8');

  generated++;
}

console.log(`\n✅ ${generated}自治体の住民税ページを生成しました`);
console.log(`   出力: {pref}/{slug}/jumin/{index,income}.html ＋ {pref}/{slug}/kakeibo/index.html`);
if (!targetSlug && generated === 0) {
  console.log(`   （registry の systems に "jumin" を追加すると一括公開対象になります）`);
}
if (skipped.length > 0) { console.warn('\n⚠️  スキップ:'); skipped.forEach(s => console.warn('  ', s)); }
console.log();
