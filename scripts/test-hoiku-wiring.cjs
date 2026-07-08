// 検証ゲート③: 年収→所得割→階層→額の結線（test-hoiku-wiring）
// 住民税エンジン(jumin)の hoikuShotokuwari を父母2人分合算 → calcHoiku で階層・月額に着地するかを検証。
// 実行: node tests/test-hoiku-wiring.js
//       別リポの jumin.js を参照するため、場所を次の順で解決:
//         1) 環境変数 JUMIN_PATH
//         2) ~/Desktop/seido-keisan/js/core/jumin.js
//         3) hoiku-keisan からの相対 ../../seido-keisan/js/core/jumin.js（制度計算/直下に seido-keisan がある場合）
//         4) ../../../seido-keisan/js/core/jumin.js（Desktop 直下に seido-keisan がある通常配置）
//       見つからない場合はスキップ（exit 0）。jumin 未接続でもゲート単体は壊さない。
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { calcHoiku } = require('../js/core/hoiku.js');

function resolveJumin() {
  const cands = [
    process.env.JUMIN_PATH,
    path.join(os.homedir(), 'Desktop/seido-keisan/js/core/jumin.js'),
    path.resolve(__dirname, '../../seido-keisan/js/core/jumin.js'),
    path.resolve(__dirname, '../../../seido-keisan/js/core/jumin.js'),
  ].filter(Boolean);
  return cands.find((p) => fs.existsSync(p)) || null;
}

// 結線検証用の代表自治体（国基準ベースの近似）
const muni = {
  slug: 'wiring', status: 'verified', fiscalSwitch: 9,
  brackets: [
    { level: 2, criteria: 'hikazei', standard: 0, short: 0 },
    { level: 3, maxShotokuwari: 48600, standard: 19500, short: 19100 },
    { level: 4, maxShotokuwari: 97000, standard: 30000, short: 29600 },
    { level: 5, maxShotokuwari: 169000, standard: 44500, short: 43900 },
    { level: 6, maxShotokuwari: 301000, standard: 61000, short: 60100 },
    { level: 7, maxShotokuwari: 397000, standard: 80000, short: 79000 },
    { level: 8, standard: 104000, short: 102400 },
  ],
  multiChild: { second: 0.5, third: 0 },
};

function main() {
  const juminPath = resolveJumin();
  if (!juminPath) {
    console.log('⏭  jumin.js が見つからないため結線テストをスキップ（exit 0）');
    console.log('   JUMIN_PATH を指定するか ~/Desktop/seido-keisan を配置すると実行されます。');
    process.exit(0);
  }
  console.log(`jumin.js = ${juminPath}`);
  const jumin = require(juminPath);
  if (typeof jumin.calculateJumin !== 'function' || !('hoikuShotokuwari' in jumin.calculateJumin(null, { salary: 5000000 }))) {
    console.log('✗ jumin.calculateJumin が hoikuShotokuwari を返しません（jumin改修が未反映）');
    process.exit(1);
  }

  let pass = 0, fail = 0;
  const ok = (l, c, extra = '') => { console.log(`${c ? '  ✓' : '✗ FAIL'} ${l}${extra ? '  ' + extra : ''}`); c ? pass++ : fail++; };

  // 父母の年収パターン → 指数合算 → 階層
  const pairs = [
    [5000000, 3000000],
    [8000000, 0],
    [10000000, 6000000],
    [2000000, 0],
  ];
  for (const [fs_, ms] of pairs) {
    const f = jumin.calculateJumin(null, { salary: fs_ });
    const m = ms ? jumin.calculateJumin(null, { salary: ms }) : { hoikuShotokuwari: 0 };
    const index = f.hoikuShotokuwari + m.hoikuShotokuwari;
    const r = calcHoiku({ father: { shotokuwari: f.hoikuShotokuwari }, mother: { shotokuwari: m.hoikuShotokuwari } }, muni);
    ok(`父${fs_}/母${ms}: 指数${index} → level${r.level} 月額${r.monthly}`, r.level >= 2 && r.monthly >= 0 && r.level <= 8);
  }

  // 高所得ほど指数が単調増加（結線の健全性）
  const idxLow = jumin.calculateJumin(null, { salary: 3000000 }).hoikuShotokuwari;
  const idxHigh = jumin.calculateJumin(null, { salary: 9000000 }).hoikuShotokuwari;
  ok('年収が高いほど指数が大きい', idxHigh > idxLow, `(${idxLow} < ${idxHigh})`);

  // SEO鉄板: ふるさと納税(taxCredits)で指数=保育料は不変
  const base = jumin.calculateJumin(null, { salary: 6000000 });
  const furu = jumin.calculateJumin(null, { salary: 6000000, taxCredits: 60000 });
  ok('ふるさと納税で保育料指数は不変', furu.hoikuShotokuwari === base.hoikuShotokuwari, `(${base.hoikuShotokuwari})`);
  ok('ふるさと納税で住民税本体は下がる', furu.incomeLevy < base.incomeLevy);

  // 非課税世帯の結線: jumin.isTaxable=false → hoiku 入力に hikazei:true を渡す（重要な結線規約）。
  // ※指数0だけでは非課税段に落ちない（数値段level3に入る）。課税判定フラグの受け渡しが必須。
  const low = jumin.calculateJumin(null, { salary: 900000 });
  const rLow = calcHoiku({ father: { shotokuwari: low.hoikuShotokuwari }, hikazei: !low.isTaxable }, muni);
  ok('非課税(isTaxable=false)→hikazei結線→level2(月額0)', low.isTaxable === false && low.hoikuShotokuwari === 0 && rLow.level === 2 && rLow.monthly === 0);
  // フラグを渡し忘れると数値段に誤着地することも確認（結線の落とし穴の明示）
  const rNoFlag = calcHoiku({ father: { shotokuwari: 0 } }, muni);
  ok('（注意）hikazei未指定+指数0は数値段level3に誤着地', rNoFlag.level === 3);

  console.log(`\n結果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main();
