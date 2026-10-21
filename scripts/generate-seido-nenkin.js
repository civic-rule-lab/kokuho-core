/**
 * generate-seido-nenkin.js — 国民年金の保険料と免除の判定（令和8年度・全国1ページ）を生成する
 *
 * 入力: templates/seido-nenkin.html
 *       data/national/kokumin-nenkin-2026.json（制度値。文字列のまま埋め込む＝全国1ページは埋め込み・R5）
 * 出力: seido-nenkin.html（kokuho-core 直下。deploy-seido.sh が seido-keisan の nenkin/index.html へコピーする）
 *
 * 実行: node scripts/generate-seido-nenkin.js
 * 2回実行して差分が出ないこと（実行日などの可変値を入れない）。
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import organization from './lib/organization.cjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TMPL = path.join(ROOT, 'templates', 'seido-nenkin.html');
const OUT = path.join(ROOT, 'seido-nenkin.html');
const PAGE_URL = 'https://seido-keisan.jp/nenkin/';

function fileHash(...filePaths) {
  const h = createHash('sha256');
  for (const p of filePaths) if (existsSync(p)) h.update(readFileSync(p));
  return h.digest('hex').slice(0, 8);
}

const CSS_V = fileHash(path.join(ROOT, 'css', 'common.css'));
// ページが読む全 JS のハッシュ（1 本でも漏れると ?v= が動かず CDN に旧版が残る）
const JS_V = fileHash(
  path.join(ROOT, 'js', 'core', 'shared', 'ui-input.js'),
  path.join(ROOT, 'js', 'core', 'shared', 'income.js'),
  path.join(ROOT, 'js', 'core', 'nenkin.js'),
);

// 制度値は JSON の文字列をそのまま埋め込む（parse → stringify を通さない＝数値表記を保つ）。JSON.parse で妥当性だけ確かめる
const dbPath = path.join(ROOT, 'data', 'national', 'kokumin-nenkin-2026.json');
const dbText = readFileSync(dbPath, 'utf-8').trim();
const db = JSON.parse(dbText);
if (!db.monthly || !db.prepay || !db.exemption) throw new Error('kokumin-nenkin-2026.json に monthly / prepay / exemption が無い');
if (/<\/script/i.test(dbText)) throw new Error('kokumin-nenkin-2026.json に </script が含まれている');

const jsonLd = organization.jsonLdScript({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': PAGE_URL,
  url: PAGE_URL,
  name: '国民年金の保険料と免除の判定（令和8年度）',
  description: '国民年金保険料の年額・前納の割引と、前年所得による免除・納付猶予・学生納付特例の区分、免除後の月額と年金額への反映を計算する。',
  inLanguage: 'ja',
  isPartOf: { '@type': 'WebSite', url: 'https://seido-keisan.jp/', name: '制度計算' },
  publisher: organization.ORGANIZATION_REF,
});

const html = readFileSync(TMPL, 'utf-8')
  .replaceAll('__CSS_V__', CSS_V)
  .replaceAll('__JS_V__', JS_V)
  .replace('__JSON_LD__', () => jsonLd)
  .replace('__NENKIN_DB__', () => dbText)
  .replaceAll('__OPERATOR_FOOTER__', () => organization.operatorFooterHtml('seido-keisan.jp'));

if (/__[A-Z_]+__/.test(html)) throw new Error('未置換のプレースホルダが残っている: ' + html.match(/__[A-Z_]+__/)[0]);
writeFileSync(OUT, html, 'utf-8');
console.log(`✅ 国民年金の保険料と免除ページを生成しました: ${path.relative(ROOT, OUT)}（JS v=${JS_V}）`);
