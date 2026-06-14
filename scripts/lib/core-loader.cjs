/**
 * js/core/*.js（ブラウザ classic script 互換の CommonJS 群）を Node から
 * 読み込むためのローダー。package.json "type":"module" 環境では .js が ESM 扱いに
 * なり require できないため、vm サンドボックスで CommonJS として実行し、相対 require を
 * 再帰解決する（kokuho/jumin/kaigo/income/household を相互依存ごと読める）。
 *
 * 使い方:
 *   const { load } = require('./lib/core-loader.cjs');
 *   const { calculateHousehold } = load('household.js');
 *   const { calculateKaigo }     = load('kaigo.js');
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CORE = path.join(__dirname, '..', '..', 'js', 'core');
const cache = {};

function loadAbs(absPath) {
  if (cache[absPath]) return cache[absPath].exports;
  const mod = { exports: {} };
  cache[absPath] = mod;                       // 循環防止のため先に登録
  const src = fs.readFileSync(absPath, 'utf-8');
  const dir = path.dirname(absPath);
  const localRequire = (req) => {
    if (req.startsWith('.')) {
      let p = path.resolve(dir, req);
      if (!p.endsWith('.js') && !fs.existsSync(p)) p += '.js';
      return loadAbs(p);
    }
    return require(req);                       // Node 組込み
  };
  const sandbox = { module: mod, exports: mod.exports, require: localRequire,
                    console, Math, JSON, Number, String, Array, Object };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: absPath });
  return mod.exports;
}

module.exports = { load: (rel) => loadAbs(path.join(CORE, rel)) };
