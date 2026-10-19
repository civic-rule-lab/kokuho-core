/**
 * generate-seido-about.js — 運営者情報・プライバシーポリシー・免責事項（seido-keisan.jp/about/・静的）を生成する
 *
 * 入力: templates/seido-about.html
 * 出力: seido-about.html（kokuho-core 直下。deploy-seido.sh が seido-keisan の about/index.html へコピーする）
 *
 * 実行: node scripts/generate-seido-about.js
 * 計算は無く、共通 CSS のハッシュを埋めるだけ。2回実行して差分が出ないこと（実行日などの可変値を入れない）。
 * 改定日はテンプレートの「改定」節に手で書く。
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TMPL = path.join(ROOT, 'templates', 'seido-about.html');
const OUT = path.join(ROOT, 'seido-about.html');

function fileHash(...filePaths) {
  const h = createHash('sha256');
  for (const p of filePaths) if (existsSync(p)) h.update(readFileSync(p));
  return h.digest('hex').slice(0, 8);
}

const CSS_V = fileHash(path.join(ROOT, 'css', 'common.css'));
const html = readFileSync(TMPL, 'utf-8').replaceAll('__CSS_V__', CSS_V);

if (/__[A-Z_]+__/.test(html)) throw new Error('未置換のプレースホルダが残っている: ' + html.match(/__[A-Z_]+__/)[0]);
writeFileSync(OUT, html, 'utf-8');
console.log(`✅ 運営者情報・プライバシーポリシー・免責事項ページを生成しました: ${path.relative(ROOT, OUT)}`);
