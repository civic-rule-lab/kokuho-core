/**
 * seido-provenance.cjs — 後期・介護・住民税・保育料・家計簿ページの「出典」節を静的 HTML で組み立てる
 *
 * なぜ要るか（2026-11-09 S1-1 ID-03・S-5 / 修正順 S1 3-1）:
 *   国保ページには「この数値の根拠」節（generate-official-pages.js の buildProvenance）があるが、
 *   後期・介護・住民税・保育料・家計簿の 7,189 ページには出典の節が無かった。データ JSON には
 *   source.url と取得日があるのに描いておらず、利用者が数字を自治体の公表値と照らす手段がページ上に無かった。
 *
 * 設計:
 *   - 出典として外部に見せてよいホストの判定（許可リスト）と日付・エスケープの関数は、
 *     generate-official-pages.js にある正本をテキストとして読み、そのまま評価して使う。複製しない
 *     （verify-provenance-hosts.js と同じ思想。複製すると片方が古くなる）。
 *     正本の書式が変わって読めなくなったら、黙って全件リンク無しにせず例外で止める。
 *   - 許可外ホストの URL はリンクにしない。資料名に「（出典ページ未確認）」を付けて文字で出す。
 *   - 確認状態はデータの status どおりに書き分ける（verified / inferred / needs_update / free）。
 *     verified 以外を確認済みに見せない。
 *   - 見た目と文言は国保の buildProvenance に揃える（灰色の枠・12px・「出典: 〇〇 ↗」「最終確認: 〜 — Civic Rule Lab が…」）。
 *     見出しは ui-rules §4-3・§4-4 の節名「出典」。
 *
 * 日付の扱い [未確認・推測]:
 *   後期・介護・住民税の JSON は source.retrievedAt（資料の取得日）しか持たない。verified のデータでは
 *   取得した資料で照合しているので「最終確認」として出す。保育料は source.asOf。
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const GEN = path.join(ROOT, 'scripts', 'generate-official-pages.js');

// ── 正本（generate-official-pages.js）から許可リストと判定関数を読む ──
function loadCanonical() {
  const src = fs.readFileSync(GEN, 'utf8');
  const pick = (re, name) => {
    const m = src.match(re);
    if (!m) {
      throw new Error(
        `${name} を generate-official-pages.js から読み取れなかった。書式が変わった可能性がある。` +
        'scripts/lib/seido-provenance.cjs の正規表現を実物に合わせて直すこと（リストや関数をこちらへ複製してはいけない）。'
      );
    }
    return m[0];
  };
  const code = [
    pick(/const PROVENANCE_HOST_PATTERNS = \[[\s\S]*?\n\];/, 'PROVENANCE_HOST_PATTERNS'),
    pick(/const PROVENANCE_HOST_EXTRA = new Set\(\[[\s\S]*?\n\]\);/, 'PROVENANCE_HOST_EXTRA'),
    'const provenanceRejectedHosts = new Map();',
    pick(/function isPublicSourceUrl\(u\) \{[\s\S]*?\n\}/, 'isPublicSourceUrl'),
    pick(/function escapeHtml\(s\) \{[\s\S]*?\n\}/, 'escapeHtml'),
    pick(/function fmtSourceDate\(s\) \{[\s\S]*?\n\}/, 'fmtSourceDate'),
    'return { isPublicSourceUrl, escapeHtml, fmtSourceDate, provenanceRejectedHosts };',
  ].join('\n');
  // eslint-disable-next-line no-new-func
  return new Function('URL', code)(URL);
}
const C = loadCanonical();
const esc = C.escapeHtml;

const P_STYLE = 'margin:0 0 4px;font-size:12px;line-height:1.9;color:#4b5563;';
const P_LAST  = 'margin:0;font-size:12px;line-height:1.9;color:#4b5563;';
const SECTION_STYLE = 'margin-top:36px;padding:14px 16px;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;';

// 1 件の資料 → HTML（許可ホストはリンク、それ以外は文字＋「出典ページ未確認」）
function sourceHtml({ url, title }) {
  const name = esc((typeof title === 'string' && title.trim()) || '公式ページ');
  if (url && C.isPublicSourceUrl(url)) {
    return `<a href="${esc(url)}" target="_blank" rel="noopener">${name} ↗</a>`;
  }
  return `${name}（出典ページ未確認）`;
}

const uniqBy = (arr, key) => { const s = new Set(); return arr.filter((x) => { const k = key(x); if (!k || s.has(k)) return false; s.add(k); return true; }); };

// ── 制度ごとに「資料の並び・日付・状態」を取り出す ──
//   戻り値: { sources:[{url,title}], date:"2026年6月26日"|null, state:"verified"|"inferred"|"needs_update"|"free"|"pending"|"none", extra:"状態の補足文"|"" }

function koukiEntry(d) {
  const s = (d && d.source) || {};
  const sources = [];
  if (s.rates) sources.push({ url: s.rates.url, title: s.rates.title || '保険料率の公表資料' });
  if (s.kansho) sources.push({ url: s.kansho.url, title: s.kansho.title || '広域連合の保険料軽減の案内' });
  if (s.url) sources.push({ url: s.url, title: s.pageTitle || s.title });
  return { sources: uniqBy(sources, (x) => x.url), date: C.fmtSourceDate((s.rates && s.rates.retrievedAt) || s.retrievedAt), state: d && d.status, extra: '' };
}

function kaigoEntry(d) {
  const s = (d && d.source) || {};
  const sources = [];
  if (s.url) sources.push({ url: s.url, title: s.pageTitle || s.title });
  if (s.pdfUrl) sources.push({ url: s.pdfUrl, title: '保険料の資料（PDF）' });
  return { sources: uniqBy(sources, (x) => x.url), date: C.fmtSourceDate(s.retrievedAt), state: d && d.status, extra: '' };
}

// 住民税。inferred（台帳未登録）は source.scope=prefecture＝都道府県民税の公表資料だけを確認し、
// 市区町村民税は標準税率（JUMIN_DEFAULTS）を当てた推計（data に cityRate が無い）。
function juminEntry(d, ctx = {}) {
  if (!d) return { sources: [], date: null, state: 'none', extra: '' };
  const s = d.source || {};
  const isPrefScope = s.scope === 'prefecture';
  const prefName = ctx.prefName || '都道府県';
  // 都道府県名の末字（都・道・府・県）で「〇民税」と呼ぶ（例: 愛知県 → 愛知県の県民税の案内）
  const title = s.pageTitle || s.title || (isPrefScope && ctx.prefName ? `${prefName}の${prefName.slice(-1)}民税の案内` : '住民税の案内');
  const sources = s.url ? [{ url: s.url, title }] : [];
  let extra = '';
  if (isPrefScope && d.cityRate == null) {
    const { JUMIN_DEFAULTS } = require(path.join(ROOT, 'js', 'core', 'jumin.js'));
    extra = `都道府県民税の税率は上記の資料の値、市区町村民税は標準税率（所得割${pctLabel(JUMIN_DEFAULTS.cityRate)}・均等割${JUMIN_DEFAULTS.cityPerCapita.toLocaleString('ja-JP')}円）を当てた推計です。`;
  }
  return { sources, date: C.fmtSourceDate(s.retrievedAt), state: d.status, extra };
}

function hoikuEntry(d) {
  if (!d) return { sources: [], date: null, state: 'none', extra: '' };
  if (d.status === 'free') {
    const fp = d.freePolicy || {};
    const urls = Array.isArray(fp.source) ? fp.source : (fp.source ? [fp.source] : []);
    const sources = urls.map((u, i) => ({ url: u, title: i === 0 ? '保育料の無償化の案内' : '無償化の関連資料' }));
    const conf = typeof d.confidence === 'string' ? d.confidence : '';
    const state = (conf.startsWith('確認済') && !conf.includes('再確認')) ? 'free' : 'pending';
    return { sources, date: null, state, extra: '' };
  }
  const s = d.source;
  let sources = [];
  if (Array.isArray(s)) sources = s.map((u, i) => ({ url: u, title: i === 0 ? '保育料の案内' : '保育料の資料' }));
  else if (s && typeof s === 'object') {
    if (s.page) sources.push({ url: s.page, title: s.name || '保育料の案内' });
    if (s.pdf) sources.push({ url: s.pdf, title: '保育料の資料（PDF）' });
    if (s.reiki) sources.push({ url: typeof s.reiki === 'string' ? s.reiki : s.reiki.url, title: '保育料の条例・規則' });
  }
  const asOf = (s && !Array.isArray(s) && s.asOf) || d.asOf;
  return { sources: uniqBy(sources.filter((x) => typeof x.url === 'string'), (x) => x.url), date: C.fmtSourceDate(asOf), state: d.status, extra: '' };
}

// 国保（家計簿の 1 行用）。国保ページの buildProvenance と同じ材料（meta.source・meta.lifecycle）を使う。
function kokuhoEntry(d, ctx = {}) {
  if (!d) return { sources: [], date: null, state: 'none', extra: '' };
  const src = (d.meta && d.meta.source) || {};
  const lc = (d.meta && d.meta.lifecycle) || {};
  const candidates = [src.url, ...(Array.isArray(lc.sourceUrls) ? lc.sourceUrls : [])].filter((u) => typeof u === 'string' && u);
  const url = candidates.find((u) => C.isPublicSourceUrl(u)) || candidates[0] || null;
  const sources = url ? [{ url, title: src.title }] : [];
  const isStandard = lc.r8Stage === 'standard_r8' || src.type === 'prefecture_standard';
  const status = d.meta && d.meta.status;
  const verifiedAt = C.fmtSourceDate(lc.verifiedAt);
  let state = 'pending', extra = '';
  if (isStandard) { state = 'standard'; extra = `${ctx.prefName || '都道府県'}が公表した標準保険料率（参考値）です。`; }
  else if (status === 'verified' && verifiedAt) state = 'verified';
  return { sources, date: state === 'verified' ? verifiedAt : null, state, extra };
}

function pctLabel(r) { return (r * 100).toFixed(3).replace(/\.?0+$/, '') + '%'; }

// 状態 → 文（国保の buildProvenance の文言に揃える）。compact は家計簿の 1 行用（資料名の後ろに続ける短い形）
function stateText(e, { fyLabel = '', compact = false } = {}) {
  const ref = compact ? 'この' : '上記の';
  const got = e.date ? `（資料の取得: ${e.date}）` : '';
  switch (e.state) {
    case 'verified':
      if (compact) return e.date ? `最終確認: ${e.date}（Civic Rule Lab が資料と照合）` : 'Civic Rule Lab が資料と照合（確認日の記録なし）';
      return e.date
        ? `最終確認: ${e.date} — Civic Rule Lab が上記の一次資料と照合しました。`
        : 'Civic Rule Lab が上記の一次資料と照合しました（確認日の記録はありません）。';
    case 'free':
      return compact ? '無償化を公式ページで確認（確認日の記録なし）'
        : 'Civic Rule Lab が上記の公式ページで無償化を確認しました（確認日の記録はありません）。';
    case 'inferred':
      return `${e.extra || ''}確認中の推計値を含みます（Civic Rule Lab が確認作業中）。${ref}出典で最新の内容をご確認ください。${got}`;
    case 'needs_update':
      return `最新の公表値への更新を確認中です。金額が変わっている可能性があります。${ref}出典で最新の内容をご確認ください。${got}`;
    case 'standard':
      return `${e.extra}確定料率は Civic Rule Lab が確認作業中です。`;
    default:
      return `${fyLabel ? esc(fyLabel) + 'の' : ''}値は Civic Rule Lab が確認作業中です。${ref}出典で最新の内容をご確認ください。`;
  }
}

function sectionHtml(state, inner) {
  // 生成器の fill() は String.replaceAll なので、置換文字列の $ が特殊パターンとして解釈されないよう数値参照にする
  inner = inner.replace(/\$/g, '&#36;');
  return `
  <section class="source-section" data-source-state="${esc(state)}" style="${SECTION_STYLE}">
    <h2 style="margin-top:0;">出典</h2>
    ${inner}
  </section>`;
}

const ENTRY = { kouki: koukiEntry, kaigo: kaigoEntry, jumin: juminEntry, hoiku: hoikuEntry, kokuho: kokuhoEntry };

/**
 * 単一制度ページの出典節。
 * @param {'kouki'|'kaigo'|'jumin'|'hoiku'} sys
 * @param {object|null} data  その制度の JSON
 * @param {{prefName?:string, fyLabel?:string}} ctx
 */
function buildSourceSection(sys, data, ctx = {}) {
  const e = ENTRY[sys](data, ctx);
  if (e.state === 'none') {
    // 住民税で JSON が無い（標準税率で計算）。リンクは無いが、何で計算したかは書く
    if (sys === 'jumin') {
      return sectionHtml('standard_default', `<p style="${P_LAST}">${esc(standardJuminText())}</p>`);
    }
    return '';
  }
  const lines = [];
  if (e.sources.length) lines.push(`<p style="${P_STYLE}">出典: ${e.sources.map(sourceHtml).join('・')}</p>`);
  else lines.push(`<p style="${P_STYLE}">出典: 記録なし（出典ページ未確認）</p>`);
  lines.push(`<p style="${P_LAST}">${stateText(e, ctx)}</p>`);
  return sectionHtml(e.state, lines.join('\n    '));
}

function standardJuminText() {
  const { JUMIN_DEFAULTS: D } = require(path.join(ROOT, 'js', 'core', 'jumin.js'));
  const kinto = D.prefPerCapita + D.cityPerCapita + D.forestTax;
  return `この自治体の住民税のデータは未収録です。全国の標準税率（所得割${pctLabel(D.prefRate + D.cityRate)}・均等割${kinto.toLocaleString('ja-JP')}円〈森林環境税を含む〉）で計算しています。`;
}

function loadJson(p) {
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

/**
 * 家計簿（複数制度）ページの出典節。ページが実行時に読む JSON（city-integrated.html の loadSystem と同じ
 * /data/municipalities/{slug}/{sys}-{年度}.json・年度は 2026→2025 の順）を生成時に読み、制度ごとに 1 行。
 */
function buildKakeiboSourceSection(citySlug, ctx = {}) {
  const dir = path.join(ROOT, 'data', 'municipalities', citySlug);
  const YEARS = [2026, 2025];
  const load = (sys) => {
    for (const y of YEARS) { const d = loadJson(path.join(dir, `${sys}-${y}.json`)); if (d) return { d, y }; }
    return { d: null, y: null };
  };
  const SYS = [
    ['jumin', '住民税'], ['kokuho', '国民健康保険'], ['kouki', '後期高齢者医療'], ['kaigo', '介護保険（第1号）'], ['hoiku', '保育料'],
  ];
  const items = [];
  for (const [sys, label] of SYS) {
    const { d, y } = load(sys);
    if (sys === 'kaigo' && d && !(d.status === 'verified' || d.status === 'inferred')) continue; // ページ側も点灯しない（kaigoReady）
    if (!d) {
      if (sys === 'jumin') items.push(`<li>${label}: ${esc(standardJuminText())}</li>`);
      continue;
    }
    const e = ENTRY[sys](d, ctx);
    const yearNote = (y && y !== YEARS[0]) ? `令和${y - 2018}年度のデータで計算。` : '';
    const src = e.sources.length ? e.sources.map(sourceHtml).join('・') : '記録なし（出典ページ未確認）';
    items.push(`<li>${label}: ${src} — ${yearNote}${stateText(e, { ...ctx, compact: true })}</li>`);
  }
  if (!items.length) return '';
  return sectionHtml('kakeibo',
    `<ul style="margin:0;padding-left:1.4em;font-size:12px;line-height:1.9;color:#4b5563;">\n      ${items.join('\n      ')}\n    </ul>\n    ` +
    `<p style="${P_LAST}margin-top:4px;">所得税・社会保険料（会社員）・国民年金・ふるさと納税の上限は全国共通の制度値で計算しています。</p>`);
}

/** 許可外で文字にしたホストと件数（生成器のログ用。追加はオーナー判断で generate-official-pages.js の許可リストへ） */
function rejectedHosts() { return C.provenanceRejectedHosts; }

module.exports = { buildSourceSection, buildKakeiboSourceSection, rejectedHosts, _entries: ENTRY, _isPublicSourceUrl: C.isPublicSourceUrl };
