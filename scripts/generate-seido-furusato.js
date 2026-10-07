/**
 * generate-seido-furusato.js — ふるさと納税の控除上限額 かんたん計算（全国1ページ）を生成する
 *
 * 入力: templates/seido-furusato.html
 *       data/national/furusato-2027.json（制度値。ページに埋め込む）
 *       data/national/shotokuzei-2026.json（令和8年分の所得税の基礎控除の表。ページに埋め込む）
 * 出力: seido-furusato.html（kokuho-core 直下。deploy-seido.sh が seido-keisan の furusato/index.html へコピーする）
 *
 * 実行: node scripts/generate-seido-furusato.js
 * 2回実行して差分が出ないこと（実行日などの可変値を入れない）。
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TMPL = path.join(ROOT, 'templates', 'seido-furusato.html');
const OUT = path.join(ROOT, 'seido-furusato.html');
const DATA = path.join(ROOT, 'data', 'national', 'furusato-2027.json');

function fileHash(...filePaths) {
  const h = createHash('sha256');
  for (const p of filePaths) if (existsSync(p)) h.update(readFileSync(p));
  return h.digest('hex').slice(0, 8);
}

const CSS_V = fileHash(path.join(ROOT, 'css', 'common.css'));
const JS_V = fileHash(path.join(ROOT, 'js', 'core', 'furusato.js'));

// 制度値は JSON の文字列をそのまま埋め込む（parse → stringify を通さない＝数値表記を保つ）。
// JSON.parse で妥当性だけ確かめる。
const furusatoText = readFileSync(DATA, 'utf-8').trim();
JSON.parse(furusatoText);
// </script> の混入を防ぐ（データに無いことを確かめる）
if (/<\/script/i.test(furusatoText)) throw new Error('furusato-2027.json に </script が含まれている');

const Shotoku = require(path.join(ROOT, 'js', 'core', 'shotoku.js'));
const shotokuDb = JSON.parse(readFileSync(path.join(ROOT, 'data', 'national', 'shotokuzei-2026.json'), 'utf-8'));
// loadParams は上限なしを Infinity に正規化する。JSON では null（furusato.js は null を上限なしとして読む）。
const kiso = Shotoku.loadParams(2026, shotokuDb).kisoKojo.map(([upTo, amount]) => [Number.isFinite(upTo) ? upTo : null, amount]);

const html = readFileSync(TMPL, 'utf-8')
  .replaceAll('__CSS_V__', CSS_V)
  .replaceAll('__JS_V__', JS_V)
  .replace('__FURUSATO_DATA__', () => furusatoText)
  .replace('__SHOTOKU_KISO__', () => JSON.stringify(kiso));

if (/__[A-Z_]+__/.test(html)) throw new Error('未置換のプレースホルダが残っている: ' + html.match(/__[A-Z_]+__/)[0]);
writeFileSync(OUT, html, 'utf-8');
console.log(`✅ ふるさと納税 控除上限額ページを生成しました: ${path.relative(ROOT, OUT)}（JS v=${JS_V}）`);
