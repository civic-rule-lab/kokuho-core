/**
 * generate-seido-taishoku.js — ふるさと納税「退職金がある年」の解説ページ（全国1ページ・静的）を生成する
 *
 * 入力: templates/seido-taishoku.html
 * 出力: seido-taishoku.html（kokuho-core 直下。deploy-seido.sh が seido-keisan の furusato/taishoku/index.html へコピーする）
 *
 * 実行: node scripts/generate-seido-taishoku.js
 * 計算は無く、共通 CSS のハッシュを埋めるだけ。2回実行して差分が出ないこと（実行日などの可変値を入れない）。
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TMPL = path.join(ROOT, 'templates', 'seido-taishoku.html');
const OUT = path.join(ROOT, 'seido-taishoku.html');

function fileHash(...filePaths) {
  const h = createHash('sha256');
  for (const p of filePaths) if (existsSync(p)) h.update(readFileSync(p));
  return h.digest('hex').slice(0, 8);
}

const CSS_V = fileHash(path.join(ROOT, 'css', 'common.css'));

const html = readFileSync(TMPL, 'utf-8').replaceAll('__CSS_V__', CSS_V);

if (/__[A-Z_]+__/.test(html)) throw new Error('未置換のプレースホルダが残っている: ' + html.match(/__[A-Z_]+__/)[0]);
writeFileSync(OUT, html, 'utf-8');
console.log(`✅ ふるさと納税 退職金がある年の解説ページを生成しました: ${path.relative(ROOT, OUT)}`);
