/**
 * Node 用 calculateKokuho ローダー
 *
 * 背景:
 * - js/core/kokuho.js は classic <script> でブラウザロードされる必要があるため、
 *   ES module 構文 (`export ...`) を使えない。CommonJS の `module.exports = ...`
 *   を末尾に書いている。
 * - 本リポジトリの package.json は `"type": "module"` のため、Node が .js を
 *   ESM として扱う。ESM context では `module` global は undefined となり、
 *   kokuho.js の `if (typeof module !== 'undefined') module.exports = ...` が
 *   実行されず、`require("../js/core/kokuho.js")` は空 object を返す。
 * - 結果、snapshot-generate / snapshot-verify が calculateKokuho を取得できず、
 *   全自治体で計算結果が null となる silent failure 状態だった (issue #3)。
 *
 * 解決:
 * - kokuho.js のソースを fs.readFileSync で取得
 * - vm.runInContext でサンドボックス実行（global 汚染なし）
 * - サンドボックス内の module.exports を取り出して再 export
 *
 * ブラウザ classic script との互換性のため kokuho.js 本体には触らない。
 * 拡張子を .cjs にすることで Node に CommonJS として強制解釈させる
 * (package.json の "type": "module" を override)。
 *
 * 使い方:
 *   const { calculateKokuho } = require('./lib/kokuho-loader.cjs');
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const KOKUHO_PATH = path.join(__dirname, '..', '..', 'js', 'core', 'kokuho.js');

const src = fs.readFileSync(KOKUHO_PATH, 'utf-8');

// サンドボックス。`module.exports = { calculateKokuho }` が kokuho.js 末尾で
// 実行されるため、`sandbox.module.exports` から関数を取り出せる。
const sandbox = { module: { exports: {} } };
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: KOKUHO_PATH });

const exported = sandbox.module.exports;

if (typeof exported.calculateKokuho !== 'function') {
  throw new Error(
    `[kokuho-loader] calculateKokuho が ${KOKUHO_PATH} から export されていません。` +
    `kokuho.js 末尾の \`if (typeof module !== 'undefined') module.exports = { calculateKokuho }\` ` +
    `行が削除されていないか確認してください。`
  );
}

module.exports = exported;
