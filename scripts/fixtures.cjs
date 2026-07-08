// 検証ゲート共通フィクスチャ（実データ投入前の代表自治体）
// 実データ data/municipalities/{slug}/hoiku-2026.json が揃ったらそちらを優先し、本ファイルは
// 「構造の代表例」として残す。数値は国基準ベースの近似で、公式表転記ではない [未確認・推測]。
'use strict';

// 一般市（非政令）: 0歳別額・ひとり親軽減あり
const generalCity = {
  slug: 'fixture-general', system: 'hoiku', year: 2026, status: 'verified', fiscalSwitch: 9,
  brackets: [
    { level: 1, criteria: 'seikatsuhogo', standard: 0, short: 0 },
    { level: 2, criteria: 'hikazei', standard: 0, short: 0 },
    { level: 3, maxShotokuwari: 48600, standard: 19500, short: 19100, reduced: { hitorioya: 9000 } },
    { level: 4, maxShotokuwari: 97000, standard: 30000, short: 29600, byAge: { age0: 31000 } },
    { level: 5, maxShotokuwari: 169000, standard: 44500, short: 43900 },
    { level: 6, maxShotokuwari: 301000, standard: 61000, short: 60100 },
    { level: 7, maxShotokuwari: 397000, standard: 80000, short: 79000 },
    { level: 8, standard: 104000, short: 102400 },
  ],
  multiChild: { second: 0.5, third: 0, countScope: 'preschool' },
};

// 政令市: seireiConversion（通知書8%直接入力時のみ×6/8）
const seireiCity = {
  slug: 'fixture-seirei', system: 'hoiku', year: 2026, status: 'verified',
  seireiConversion: true, fiscalSwitch: 9,
  brackets: [
    { level: 2, criteria: 'hikazei', standard: 0, short: 0 },
    { level: 3, maxShotokuwari: 48600, standard: 20000, short: 19600 },
    { level: 4, maxShotokuwari: 97000, standard: 33000, short: 32500 },
    { level: 5, maxShotokuwari: 169000, standard: 47000, short: 46300 },
    { level: 6, standard: 63000, short: 62000 },
  ],
  multiChild: { second: 0.5, third: 0 },
};

// 東京free（第1子から無償）: brackets 不要
const tokyoFree = {
  slug: 'fixture-tokyo-free', system: 'hoiku', year: 2026, status: 'free',
  freePolicy: { firstChild: true, since: '2025-09', source: '(要公式確認)' },
};

// 大阪市型（第2子無償）: multiChild.second = 0
const secondFree = {
  slug: 'fixture-second-free', system: 'hoiku', year: 2026, status: 'verified', fiscalSwitch: 9,
  brackets: [
    { level: 2, criteria: 'hikazei', standard: 0, short: 0 },
    { level: 3, maxShotokuwari: 48600, standard: 19500, short: 19100 },
    { level: 4, maxShotokuwari: 97000, standard: 30000, short: 29600 },
    { level: 5, standard: 44500, short: 43900 },
  ],
  multiChild: { second: 0, third: 0, note: '大阪市型・第2子以降無償' },
};

module.exports = { generalCity, seireiCity, tokyoFree, secondFree };
