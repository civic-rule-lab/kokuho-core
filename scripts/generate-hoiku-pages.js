/**
 * 【実装ドラフト v1・レビュー用／本番未配置】保育料ページ生成スクリプト
 *
 * ※これは kokuho-core に置く前提の generate-hoiku-pages.js のドラフト。
 *   現状は hoiku-keisan/docs/drafts/ に置いてレビューするだけ（本番 kokuho-core には未配置）。
 *   移行時は kokuho-core/scripts/ へ。生成対象・テンプレ・エンジンの正本は kokuho-core。
 *
 * registry/index.json を回し、各自治体の保育料ページを生成する。
 * 国保({pref}/{slug}/index.html)・住民税(jumin/)を壊さないよう hoiku/ 名前空間に出力。
 *
 * 生成物（自治体ごと）:
 *   {prefSlug}/{citySlug}/hoiku/index.html   保育料 かんたん計算（0-2歳・3号）
 *   （income.html は将来。初版は単一ページ）
 *
 * テンプレート:
 *   templates/hoiku-simple.html
 *
 * エンジン同梱（テンプレ側で <script src>）:
 *   /js/core/shared/income.js  → /js/core/jumin.js → /js/core/hoiku.js  （読み込み順が重要）
 *   保育料指数は jumin.calculateJumin().hoikuShotokuwari（父母2回）を hoiku.calcHoiku に渡す。
 *
 * 公開対象の選定:
 *   - 引数で slug 指定 → その自治体のみ（テスト用）
 *   - 引数なし → registry で systems に "hoiku" を含む or publishYear.hoiku がある自治体のみ
 *     （verified 先行公開。registry 未登録なら 0 件＝死にリンクを作らない）
 *
 * 実行:
 *   node scripts/generate-hoiku-pages.js yokohama
 *   node scripts/generate-hoiku-pages.js            （公開対象を一括生成）
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

// エンジンは生成時の検算にも使う（任意）。ページ側はブラウザで直接読むが、
// ここで require できることで「移行後 Node で動く」ことを最低限確認できる。
const _require = createRequire(import.meta.url);
// ※ hoiku.js は移行時に _isNode ガードを入れる前提（Fable5 高①）。ガード前は Node のみで動く。
const { calcHoiku } = _require('../js/core/hoiku.js');
const { calculateJumin } = _require('../js/core/jumin.js');

// ─── バージョンハッシュ（キャッシュバスティング） ───
function fileHash(...filePaths) {
  const h = createHash('sha256');
  for (const p of filePaths) if (existsSync(p)) h.update(readFileSync(p));
  return h.digest('hex').slice(0, 8);
}
const CSS_V = fileHash(path.join(ROOT, 'css', 'common.css'));
// ★保育料は income.js + jumin.js + hoiku.js の3本を同梱するので、JS_V に3本とも含める（Fable5 §2）。
const JS_V  = fileHash(
  path.join(ROOT, 'js', 'core', 'shared', 'income.js'),
  path.join(ROOT, 'js', 'core', 'jumin.js'),
  path.join(ROOT, 'js', 'core', 'hoiku.js'),
);

// ─── ヘルパー ───
function fiscalYearLabel(year) { return `令和${year - 2018}年度`; }

function loadHoiku(citySlug, year) {
  const p = path.join(DATA_DIR, citySlug, `hoiku-${year}.json`);
  if (existsSync(p)) {
    try { return JSON.parse(readFileSync(p, 'utf-8')); }
    catch (e) { console.warn(`⚠️  JSON parse error: ${p}\n   ${e.message}`); }
  }
  return null;
}

function metaDesc(cityName, fy, data) {
  if (data && data.status === 'free') {
    return `${cityName}の保育料（認可保育所・0〜2歳）は${fy}いくら？${cityName}は第1子から保育料が無償です。対象・条件と、無償対象外ケースの確認をまとめました。`;
  }
  return `${cityName}の保育料（認可保育所・0〜2歳・3号認定）は${fy}いくら？父母の年収から市民税所得割ベースで階層・多子軽減・ひとり親軽減を反映して無料でかんたん試算できます。`;
}

function introText(cityName, fy, data) {
  if (data && data.status === 'free') {
    return `${cityName}の認可保育所（0〜2歳・3号認定）の保育料が${fy}いくらになるかをまとめました。${cityName}は第1子から保育料が無償化されています。`;
  }
  return `${cityName}の認可保育所（0〜2歳・3号認定）の保育料が${fy}いくらになるか、父母の年収から無料で試算できます。保育料は市民税の所得割額をもとにした階層で決まり、多子（きょうだい）軽減・ひとり親軽減も反映します。`;
}

function jsonLd(cityName, prefName, prefSlug, citySlug, desc, url, fy) {
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
    name: `${cityName} 保育料計算ツール（${fy}）`,
    description: desc,
    url,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    inLanguage: 'ja',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
  };
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [breadcrumb, app] });
}

// 共通プレースホルダ置換（jumin と同方式）
function fill(template, map) {
  let out = template;
  for (const [k, v] of Object.entries(map)) out = out.replaceAll(k, v);
  return out;
}

// ─── テンプレート読込 ───
const tmplSimple = readFileSync(path.join(TMPL_DIR, 'hoiku-simple.html'), 'utf-8');

// ─── 対象自治体の決定 ───
const registry   = JSON.parse(readFileSync(REGISTRY, 'utf-8'));
const targetSlug = process.argv[2] || null;

const isHoikuPublished = m =>
  (m.systems && m.systems.includes('hoiku')) || (m.publishYear && m.publishYear.hoiku);

let targets;
if (targetSlug) {
  targets = registry.municipalities.filter(m => m.citySlug === targetSlug);
  if (targets.length === 0) { console.error(`❌ スラグが見つかりません: ${targetSlug}`); process.exit(1); }
} else {
  targets = registry.municipalities.filter(isHoikuPublished);
}

let generated = 0;
const skipped = [];

for (const m of targets) {
  const prefSlug = m.prefectureSlug;
  const prefName = m.prefecture;
  if (!prefSlug) { skipped.push(`${m.cityName}: prefectureSlug 未定義`); continue; }

  const citySlug = m.citySlug;
  const cityName = m.cityName;
  const year = (m.publishYear && m.publishYear.hoiku) || DEFAULT_YEAR;
  const fy = fiscalYearLabel(year);
  const data = loadHoiku(citySlug, year);
  if (!data && !targetSlug) { skipped.push(`${cityName}: hoiku-${year}.json 無し`); continue; }

  // ★自治体ずれ防止（最重要）: データJSON内部の識別子が台帳(registry)レコードと一致することを fail-fast 検証。
  //   URL・表示名・埋め込みデータを必ず同一レコードに束ねる＝「バラバラに呼ばない」。
  //   不一致なら生成しない（誤った自治体の表を別名で公開する事故を防ぐ。旧 getCurrentCity |=chigasaki の教訓）。
  if (data) {
    const dSlug = data.citySlug;
    const dCode = data.cityCode != null ? String(data.cityCode) : null;
    const dPref = data.prefectureSlug || data.prefSlug;
    const mism = [];
    if (dSlug && dSlug !== citySlug) mism.push(`citySlug(data=${dSlug}≠台帳=${citySlug})`);
    if (dCode && dCode !== String(m.cityCode)) mism.push(`cityCode(data=${dCode}≠台帳=${m.cityCode})`);
    if (dPref && dPref !== prefSlug) mism.push(`prefSlug(data=${dPref}≠台帳=${prefSlug})`);
    if (mism.length) {
      skipped.push(`${cityName}: ⚠️自治体ずれ検出 → 生成中止 [${mism.join(', ')}]`);
      continue; // 生成しない（--strict 運用なら process.exit(1) に切替可）
    }
  }
  const hoikuDataLiteral = data ? JSON.stringify(data) : 'null';

  const cityBase = `${BASE_URL}/${prefSlug}/${citySlug}`;
  const url = `${cityBase}/hoiku/`;
  const desc = metaDesc(cityName, fy, data);

  // 「この自治体の負担をまとめて見る」= ../kakeibo/ は、その自治体に kakeibo ページがある時だけ出す
  // （kakeibo は jumin か kaigo の公開自治体で生成される。保育料のみの自治体では死にリンクになるため出さない）。
  const hasKakeibo = (m.systems && (m.systems.includes('jumin') || m.systems.includes('kaigo')))
                  || (m.publishYear && (m.publishYear.jumin || m.publishYear.kaigo));
  const kakeiboBlock = hasKakeibo
    ? '<a href="../kakeibo/" class="kakeibo-card">'
      + '<span class="kakeibo-ico"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#0b7285" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 3v18M12 8h5M12 12h5"/></svg></span>'
      + '<span class="kakeibo-txt"><span class="kakeibo-main">この自治体の負担をまとめて見る</span>'
      + '<span class="kakeibo-sub">住民税・国保・介護をまとめて試算（家計簿シミュレーターへ）→</span></span></a>'
    : '';

  const html = fill(tmplSimple, {
    '__CITY_NAME__': cityName,
    '__CITY_SLUG__': citySlug,
    '__FISCAL_YEAR_LABEL__': fy,
    '__META_DESC__': desc,
    '__CANONICAL_URL__': url,
    '__JSON_LD__': jsonLd(cityName, prefName, prefSlug, citySlug, desc, url, fy),
    '__INTRO_TEXT__': introText(cityName, fy, data),
    '__HOIKU_DATA__': hoikuDataLiteral,   // muni JSON（brackets/inputBasis/timeBands/facilityTypes/status/selector 等）を丸ごと埋め込み
    '__KAKEIBO_BLOCK__': kakeiboBlock,     // kakeibo ページがある自治体だけ「まとめて見る」リンクを出す（死にリンク防止）
    '__PUBLISH_YEAR__': String(year),
    '__CSS_V__': CSS_V,
    '__JS_V__': JS_V,
  });

  const outDir = path.join(ROOT, prefSlug, citySlug, 'hoiku');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
  generated++;
}

console.log(`\n✅ ${generated}自治体の保育料ページを生成しました`);
console.log(`   出力: {pref}/{slug}/hoiku/index.html`);
if (!targetSlug && generated === 0) {
  console.log(`   （registry の systems に "hoiku" を追加すると一括公開対象になります）`);
}
if (skipped.length > 0) { console.warn('\n⚠️  スキップ:'); skipped.forEach(s => console.warn('  ', s)); }
console.log();
