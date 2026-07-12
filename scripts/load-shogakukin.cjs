/**
 * 奨学金 core を vm で評価して読み込む共有ローダー（core 無改変・既存 test-kouki.cjs と同方針）。
 * 本リポジトリは package.json "type":"module" のため js/core/*.js を require/import できない。
 * さらに shogakukin(-bridge).js は core 同士を require するので、require を横取りして解決する。
 * 実行前提: node（CommonJS/.cjs）。
 */
'use strict';
const fs = require('fs'), vm = require('vm'), path = require('path');
const CORE = path.join(__dirname, '..', 'js', 'core');
const cache = {};

function load(rel) {                       // rel 例: 'jumin.js' / 'shared/income.js'
  rel = rel.replace(/\\/g, '/');
  if (cache[rel]) return cache[rel];
  const abs = path.join(CORE, rel);
  const src = fs.readFileSync(abs, 'utf8');
  const module = { exports: {} };
  const localRequire = (id) => {
    if (id.startsWith('./') || id.startsWith('../')) {
      const r = path.posix.normalize(path.posix.join(path.posix.dirname(rel), id));
      return load(r);                      // core 内相対 require を再帰解決
    }
    return require(id);                     // 'fs' 等の標準はそのまま
  };
  const sandbox = {
    module, exports: module.exports, require: localRequire, console,
    Math, Number, Array, JSON, Object, Date, String, Boolean, isNaN, parseInt, parseFloat
  };
  vm.runInNewContext(src, sandbox);
  cache[rel] = module.exports;
  return cache[rel];
}

module.exports = {
  load,
  income: () => load('shared/income.js'),
  jumin: () => load('jumin.js'),
  shogakukin: () => load('shogakukin.js'),
  bridge: () => load('shogakukin-bridge.js'),
  spec: () => JSON.parse(fs.readFileSync(path.join(CORE, 'shogakukin-2026.json'), 'utf8')),
};
