/**
 * Node 用 calculateKaigo ローダー
 *
 * js/core/kaigo.js は classic <script> 互換のため CommonJS の
 * `module.exports = { calculateKaigo, matchBracket }` を末尾に書いている。
 * package.json "type": "module" 環境では Node が .js を ESM 扱いし `module`
 * が undefined となって export が実行されないため、vm サンドボックスで
 * CommonJS として実行して取り出す（kokuho-loader.cjs と同方式）。
 *
 * 使い方:
 *   const { calculateKaigo, matchBracket } = require('./lib/kaigo-loader.cjs');
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const KAIGO_PATH = path.join(__dirname, '..', '..', 'js', 'core', 'kaigo.js');
const src = fs.readFileSync(KAIGO_PATH, 'utf-8');

const sandbox = { module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: KAIGO_PATH });

const exported = sandbox.module.exports;
if (typeof exported.calculateKaigo !== 'function') {
  throw new Error(
    `[kaigo-loader] calculateKaigo が ${KAIGO_PATH} から export されていません。` +
    `kaigo.js 末尾の module.exports 行を確認してください。`
  );
}
module.exports = exported;
