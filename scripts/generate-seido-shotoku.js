/**
 * generate-seido-shotoku.js — 所得税の計算（令和8年分・給与所得者・全国1ページ）を生成する
 *
 * 入力: templates/seido-shotoku.html
 *       data/national/shotokuzei-2026.json（制度値。文字列のまま埋め込む＝全国1ページは埋め込み・2026-10-21 R5 決定。
 *       vendored の js/core/shotoku.js が createEngineFromDB で読む）
 * 出力: seido-shotoku.html（kokuho-core 直下。deploy-seido.sh が seido-keisan の shotoku/index.html へコピーする）
 *
 * 実行: node scripts/generate-seido-shotoku.js
 * 2回実行して差分が出ないこと（実行日などの可変値を入れない）。
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import organization from './lib/organization.cjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TMPL = path.join(ROOT, 'templates', 'seido-shotoku.html');
const OUT = path.join(ROOT, 'seido-shotoku.html');
const PAGE_URL = 'https://seido-keisan.jp/shotoku/';

function fileHash(...filePaths) {
  const h = createHash('sha256');
  for (const p of filePaths) if (existsSync(p)) h.update(readFileSync(p));
  return h.digest('hex').slice(0, 8);
}

const CSS_V = fileHash(path.join(ROOT, 'css', 'common.css'));
// ページが読む全 JS のハッシュ（1 本でも漏れると ?v= が動かず CDN に旧版が残る）
const JS_V = fileHash(path.join(ROOT, 'js', 'core', 'shared', 'ui-input.js'), path.join(ROOT, 'js', 'core', 'shotoku.js'));

// 制度値は JSON の文字列をそのまま埋め込む（parse → stringify を通さない＝数値表記を保つ）。JSON.parse で妥当性だけ確かめる
const dbPath = path.join(ROOT, 'data', 'national', 'shotokuzei-2026.json');
const dbText = readFileSync(dbPath, 'utf-8').trim();
const db = JSON.parse(dbText);
if (!db.years || !db.years['2026']) throw new Error('shotokuzei-2026.json に 2026 年分のキーが無い');
if (/<\/script/i.test(dbText)) throw new Error('shotokuzei-2026.json に </script が含まれている');

const jsonLd = organization.jsonLdScript({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': PAGE_URL,
  url: PAGE_URL,
  name: '所得税の計算（令和8年分・給与所得者）',
  description: '給与収入と控除から令和8年分の所得税の年税額・課税所得・控除の内訳を計算する。令和8年度改正（基礎控除104万円・給与所得控除74万円・特定親族特別控除）を反映。',
  inLanguage: 'ja',
  isPartOf: { '@type': 'WebSite', url: 'https://seido-keisan.jp/', name: '制度計算' },
  publisher: organization.ORGANIZATION_REF,
});

const html = readFileSync(TMPL, 'utf-8')
  .replaceAll('__CSS_V__', CSS_V)
  .replaceAll('__JS_V__', JS_V)
  .replace('__JSON_LD__', () => jsonLd)
  .replace('__SHOTOKU_DB__', () => dbText)
  .replaceAll('__OPERATOR_FOOTER__', () => organization.operatorFooterHtml('seido-keisan.jp'));

if (/__[A-Z_]+__/.test(html)) throw new Error('未置換のプレースホルダが残っている: ' + html.match(/__[A-Z_]+__/)[0]);
writeFileSync(OUT, html, 'utf-8');
console.log(`✅ 所得税の計算ページを生成しました: ${path.relative(ROOT, OUT)}（JS v=${JS_V}）`);
