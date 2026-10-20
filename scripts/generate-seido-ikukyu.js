/**
 * generate-seido-furusato.js — ふるさと納税 育休・産休の年モード（全国1ページ）を生成する
 *
 * 入力: templates/seido-ikukyu.html
 *       data/national/furusato-ikukyu-2026.json（制度値。ページに埋め込む）
 *        * 出力: seido-ikukyu.html（kokuho-core 直下。deploy-seido.sh が seido-keisan の furusato/ikukyu/index.html へコピーする）
 *
 * 実行: node scripts/generate-seido-furusato.js
 * 2回実行して差分が出ないこと（実行日などの可変値を入れない）。
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import organization from './lib/organization.cjs';
import { renderPortalBox } from './lib/furusato-portals.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const TMPL = path.join(ROOT, 'templates', 'seido-ikukyu.html');
const OUT = path.join(ROOT, 'seido-ikukyu.html');
const DATA = path.join(ROOT, 'data', 'national', 'furusato-ikukyu-2026.json');

function fileHash(...filePaths) {
  const h = createHash('sha256');
  for (const p of filePaths) if (existsSync(p)) h.update(readFileSync(p));
  return h.digest('hex').slice(0, 8);
}

const CSS_V = fileHash(path.join(ROOT, 'css', 'common.css'));
const JS_V = fileHash(path.join(ROOT, 'js', 'core', 'shared', 'ui-input.js'), path.join(ROOT, 'js', 'core', 'shared', 'income.js'), path.join(ROOT, 'js', 'core', 'jumin.js'), path.join(ROOT, 'js', 'core', 'shaho.js'), path.join(ROOT, 'js', 'core', 'furusato.js'));

// 制度値は JSON の文字列をそのまま埋め込む（parse → stringify を通さない＝数値表記を保つ）。
// JSON.parse で妥当性だけ確かめる。
const ikukyuText = readFileSync(DATA, 'utf-8').trim();
JSON.parse(ikukyuText);
// </script> の混入を防ぐ（データに無いことを確かめる）
if (/<\/script/i.test(ikukyuText)) throw new Error('furusato-ikukyu-2026.json に </script が含まれている');


const furusatoText = readFileSync(path.join(ROOT, 'data', 'national', 'furusato-2027.json'), 'utf-8').trim();
JSON.parse(furusatoText);
const Shotoku = require(path.join(ROOT, 'js', 'core', 'shotoku.js'));
const shotokuDb = JSON.parse(readFileSync(path.join(ROOT, 'data', 'national', 'shotokuzei-2026.json'), 'utf-8'));
const kiso = Shotoku.loadParams(2026, shotokuDb).kisoKojo.map(([upTo, amount]) => [Number.isFinite(upTo) ? upTo : null, amount]);
const prefs = JSON.parse(readFileSync(path.join(ROOT, 'data', 'shaho', 'kenpo-2026.json'), 'utf-8')).prefRates.map(p => ({ slug: p.prefSlug, name: p.prefName }));

const html = readFileSync(TMPL, 'utf-8')
  .replaceAll('__CSS_V__', CSS_V)
  .replace('__PORTALS__', () => renderPortalBox('furusato-ikukyu'))
  .replaceAll('__JS_V__', JS_V)
  .replace('__IKUKYU_DATA__', () => ikukyuText)
  .replace('__FURUSATO_DATA__', () => furusatoText)
  .replace('__SHOTOKU_KISO__', () => JSON.stringify(kiso))
  .replace('__PREFS__', () => JSON.stringify(prefs))
  .replaceAll('__OPERATOR_FOOTER__', () => organization.operatorFooterHtml('seido-keisan.jp'));

if (/__[A-Z_]+__/.test(html)) throw new Error('未置換のプレースホルダが残っている: ' + html.match(/__[A-Z_]+__/)[0]);
writeFileSync(OUT, html, 'utf-8');
console.log(`✅ ふるさと納税 育休・産休の年モードを生成しました: ${path.relative(ROOT, OUT)}（JS v=${JS_V}）`);
