/**
 * generate-seido-nenkin.js — 国民年金の保険料と免除の判定（令和8年度・全国1ページ）を生成する
 *
 * 入力: templates/seido-nenkin.html
 *       data/national/kokumin-nenkin-2026.json（制度値。文字列のまま埋め込む＝全国1ページは埋め込み）
 *       data/national/jumin-haigusha-kojo.json（扶養親族等の所得の上限 fuyoIncomeLimit。入力欄の説明に出す数字 1 つだけ）
 * 出力: seido-nenkin.html（kokuho-core 直下。deploy-seido.sh が配信先の nenkin/index.html へコピーする）
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

// このページが読む JS の全部（1 本でも漏れると ?v= が動かず、CDN に旧版が残る）。テンプレートの <script src> と突き合わせる
const JS_FILES = ['shared/ui-input.js', 'shared/income.js', 'nenkin.js'];
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

// 制度値は JSON の文字列をそのまま埋め込む（parse → stringify を通さない＝数値表記を保つ）。JSON.parse で妥当性だけ確かめる
const dbText = readFileSync(path.join(ROOT, 'data', 'national', 'kokumin-nenkin-2026.json'), 'utf-8').trim();
const db = JSON.parse(dbText);
if (!Number.isInteger(db.monthly) || !db.prepay || !db.exemption || !db.meta || !Number.isInteger(db.meta.fiscalYear)) throw new Error('kokumin-nenkin-2026.json に monthly / prepay / exemption / meta.fiscalYear が無い');
if (/<\/script/i.test(dbText)) throw new Error('kokumin-nenkin-2026.json に </script が含まれている');

// 扶養親族等の所得の上限（免除の年度と同じ年度の住民税の値＝前年の所得に当てる額）
const haigu = JSON.parse(readFileSync(path.join(ROOT, 'data', 'national', 'jumin-haigusha-kojo.json'), 'utf-8'));
const fuyoLimit = haigu.fuyoIncomeLimit && haigu.fuyoIncomeLimit[String(db.meta.fiscalYear)];
if (!Number.isInteger(fuyoLimit)) throw new Error(`jumin-haigusha-kojo.json の fuyoIncomeLimit に ${db.meta.fiscalYear} 年度の値が無い`);

const jsonLd = organization.jsonLdScript({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': PAGE_URL,
  url: PAGE_URL,
  name: '国民年金の保険料と免除の判定（令和8年度）',
  description: '国民年金保険料の年額・前納の割引と、前年の所得による免除・納付猶予・学生納付特例の区分、承認されたときの月額と年金額への反映を計算する。',
  inLanguage: 'ja',
  isPartOf: { '@type': 'WebSite', url: 'https://seido-keisan.jp/', name: '制度計算' },
  publisher: organization.ORGANIZATION_REF,
});

const KNOWN = ['__CSS_V__', '__JS_V__', '__MONTHLY_YEN__', '__FUYO_LIMIT__', '__JSON_LD__', '__NENKIN_DB__', '__OPERATOR_FOOTER__'];
for (const ph of ['__JSON_LD__', '__NENKIN_DB__', '__FUYO_LIMIT__']) {
  if (tmpl.split(ph).length !== 2) throw new Error(`プレースホルダは 1 か所だけにする: ${ph}`);
}
// 未置換のプレースホルダが残っていないこと。埋め込む制度値の中は見ない（テンプレートの側で確かめる）
const shell = tmpl.replace(/__[A-Z_]+__/g, (m) => (KNOWN.includes(m) ? '' : m));
if (/__[A-Z_]+__/.test(shell)) throw new Error('未置換のプレースホルダが残っている: ' + shell.match(/__[A-Z_]+__/)[0]);

const html = tmpl
  .replaceAll('__CSS_V__', CSS_V)
  .replaceAll('__JS_V__', JS_V)
  .replaceAll('__MONTHLY_YEN__', db.monthly.toLocaleString('ja-JP'))
  .replace('__FUYO_LIMIT__', String(fuyoLimit))
  .replace('__JSON_LD__', () => jsonLd)
  .replaceAll('__OPERATOR_FOOTER__', () => organization.operatorFooterHtml('seido-keisan.jp'))
  .replace('__NENKIN_DB__', () => dbText);

writeFileSync(OUT, html, 'utf-8');
console.log(`✅ 国民年金の保険料と免除ページを生成しました: ${path.relative(ROOT, OUT)}（JS v=${JS_V}）`);
