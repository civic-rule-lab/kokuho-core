/**
 * generate-seido-haito.js — 配当の課税方式 損得判定（国保加入者・全国1ページ）を生成する
 *
 * 入力: templates/seido-haito.html
 *       registry/index.json（国保ページを公開している自治体の一覧＝都道府県→市区町村のプルダウン）
 *       data/reference/kyuchi.json（住民税 均等割の非課税限度額に使う級地。自治体ごとにページへ埋め込む）
 *       data/national/furusato-2027.json（控除上限額の制度値）
 *       data/national/shotokuzei-2026.json（令和8年分の所得税の基礎控除の表）
 *       data/national/kokumin-nenkin-2026.json（国民年金保険料・定額）
 *       data/national/furusato-jieigyo-2026.json（青色申告特別控除の選択肢・医療費控除の制度値）
 *       data/national/jumin-haigusha-kojo.json（配偶者控除・配偶者特別控除の表）
 * 出力: seido-haito.html（kokuho-core 直下。deploy-seido.sh が seido-keisan の furusato/haito/index.html へコピーする）
 * 自治体ごとの国保データ・住民税データはページが /data/municipalities/{slug}/ から fetch する（seido-keisan に同期済み）。
 *
 * 実行: node scripts/generate-seido-haito.js
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
const TMPL = path.join(ROOT, 'templates', 'seido-haito.html');
const OUT = path.join(ROOT, 'seido-haito.html');

function fileHash(...filePaths) {
  const h = createHash('sha256');
  for (const p of filePaths) if (existsSync(p)) h.update(readFileSync(p));
  return h.digest('hex').slice(0, 8);
}
const CSS_V = fileHash(path.join(ROOT, 'css', 'common.css'));
const JS_V = fileHash(
  path.join(ROOT, 'js', 'core', 'shared', 'ui-input.js'), path.join(ROOT, 'js', 'core', 'shared', 'income.js'),
  path.join(ROOT, 'js', 'core', 'jumin.js'), path.join(ROOT, 'js', 'core', 'kokuho.js'), path.join(ROOT, 'js', 'core', 'furusato.js'), path.join(ROOT, 'js', 'core', 'haito.js'),
);

// 制度値は JSON の文字列をそのまま埋め込む（parse → stringify を通さない）
const furusatoText = readFileSync(path.join(ROOT, 'data', 'national', 'furusato-2027.json'), 'utf-8').trim();
JSON.parse(furusatoText);
const nenkinText = readFileSync(path.join(ROOT, 'data', 'national', 'kokumin-nenkin-2026.json'), 'utf-8').trim();
JSON.parse(nenkinText);
const kojoText = readFileSync(path.join(ROOT, 'data', 'national', 'furusato-jieigyo-2026.json'), 'utf-8').trim();
JSON.parse(kojoText);
const haitoText = readFileSync(path.join(ROOT, 'data', 'national', 'haito-2026.json'), 'utf-8').trim();
JSON.parse(haitoText);
const haiguText = readFileSync(path.join(ROOT, 'data', 'national', 'jumin-haigusha-kojo.json'), 'utf-8').trim();
JSON.parse(haiguText);
for (const t of [furusatoText, nenkinText, kojoText, haiguText, haitoText]) if (/<\/script/i.test(t)) throw new Error('制度値に </script が含まれている');

const Shotoku = require(path.join(ROOT, 'js', 'core', 'shotoku.js'));
const shotokuDb = JSON.parse(readFileSync(path.join(ROOT, 'data', 'national', 'shotokuzei-2026.json'), 'utf-8'));
const shotokuP = Shotoku.loadParams(2026, shotokuDb);
const SHOTOKU_P = { taxTable: shotokuP.taxTable.map(([u, r, s]) => [Number.isFinite(u) ? u : null, r, s]), surtaxRate: shotokuP.surtaxRate, kazeiRoundDown: shotokuP.kazeiRoundDown, taxRoundDown: shotokuP.taxRoundDown };
const kiso = shotokuP.kisoKojo.map(([upTo, amount]) => [Number.isFinite(upTo) ? upTo : null, amount]);

// 自治体一覧（国保ページを公開している自治体のみ。JIS コード順）＋級地
const registry = JSON.parse(readFileSync(path.join(ROOT, 'registry', 'index.json'), 'utf-8'));
const KYUCHI = JSON.parse(readFileSync(path.join(ROOT, 'data', 'reference', 'kyuchi.json'), 'utf-8')).municipalities;
const has = (m, sys) => !!((m.systems && m.systems.includes(sys)) || (m.publishYear && m.publishYear[sys]));
const index = {};
for (const m of [...registry.municipalities].sort((a, b) => String(a.cityCode).localeCompare(String(b.cityCode)))) {
  if (!has(m, 'kokuho')) continue;
  const kv = KYUCHI[m.citySlug];
  if (!/^[123]-[12]$/.test(kv || '')) throw new Error(`級地が data/reference/kyuchi.json にありません: ${m.citySlug}`);
  if (!index[m.prefecture]) index[m.prefecture] = { slug: m.prefectureSlug, cities: [] };
  index[m.prefecture].cities.push({ slug: m.citySlug, name: m.cityName, k: Number(kv[0]), j: has(m, 'jumin') ? 1 : 0, kb: (has(m, 'jumin') || has(m, 'kaigo')) ? 1 : 0 });
}
const cityCount = Object.values(index).reduce((n, p) => n + p.cities.length, 0);

const html = readFileSync(TMPL, 'utf-8')
  .replaceAll('__CSS_V__', CSS_V)
  .replaceAll('__JS_V__', JS_V)
  .replaceAll('__CITY_COUNT__', String(cityCount))
  .replace('__CITY_INDEX__', () => JSON.stringify(index))
  .replace('__FURUSATO_DATA__', () => furusatoText)
  .replace('__NENKIN_DATA__', () => nenkinText)
  .replace('__KOJO_DATA__', () => kojoText)
  .replace('__HAIGU_DATA__', () => haiguText)
  .replace('__HAITO_DATA__', () => haitoText)
  .replace('__SHOTOKU_P__', () => JSON.stringify(SHOTOKU_P))
  .replace('__SHOTOKU_KISO__', () => JSON.stringify(kiso));
if (/__[A-Z_]+__/.test(html)) throw new Error('未置換のプレースホルダが残っている: ' + html.match(/__[A-Z_]+__/)[0]);
writeFileSync(OUT, html, 'utf-8');
console.log(`✅ 配当の課税方式 損得判定ページを生成しました: ${path.relative(ROOT, OUT)}（${cityCount}自治体・JS v=${JS_V}）`);
