// 検証ゲート②: 公式表×サンプル指数の照合（test-hoiku-verify）
// calcHoiku が「指数→月額」を公式どおり返すかをケース照合。
// 実行: node tests/test-hoiku-verify.js
//
// ⚠️ 現状の CASES はフィクスチャ由来の代表ケース（政令市6/8・0歳別額・ひとり親・第2子無償を優先）。
//    実自治体データを収集したら、公式表から読んだ (指数, 時間区分, 年齢, 多子, 月額) を CASES に転記して増やす。
//    転記の際は「指数=市民税所得割の合算」「政令市は通知書8%なら isSeireiNotice:true」に注意。
'use strict';

const fs = require('fs');
const path = require('path');
const { calcHoiku, validateBrackets } = require('../js/core/hoiku.js');
const { generalCity, seireiCity, tokyoFree, secondFree } = require('./fixtures.cjs');

// --- 実自治体: 大田区(13111) 公式利用者負担額基準額表 ---
// ライブは status:"free"(東京都無償化・第1子から0円)。ここでは無償化の下地=区の基準額表(baseTable)を
// エンジンで検証する。free フラグを外して brackets を実走査させた muni を構築。
// 出典: https://www.city.ota.tokyo.jp/seikatsu/kodomo/hoiku/hoikuryo/ketteihouhou.html
const _otaFile = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../data/municipalities/ota/hoiku-2026.json'), 'utf8'));
const otaBase = {
  cityCode: _otaFile.cityCode, citySlug: _otaFile.citySlug, cityName: _otaFile.cityName,
  prefSlug: _otaFile.prefSlug, fiscalYear: _otaFile.fiscalYear, system: 'hoiku', schemaVersion: '1.0',
  status: 'verified', fiscalSwitch: _otaFile.baseTable.fiscalSwitch, seireiConversion: false,
  brackets: _otaFile.baseTable.brackets, multiChild: _otaFile.baseTable.multiChild,
  hitorioya: _otaFile.baseTable.hitorioya,
};

// --- 実自治体: 横浜市(14100) 令和8年度 利用料金表(3号認定・認可保育所) ---
// 政令市。保育料は税源移譲前6%相当で判定(公式)。第2子=明示実額(child2)、ひとり親=E階層 実額付け替え。
// これは status:"verified" のライブ課金自治体(神奈川・都無償化の対象外)。data ファイルをそのまま使う。
// 出典: https://www.city.yokohama.lg.jp/.../0070_20260123.pdf
const yokohama = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../data/municipalities/yokohama/hoiku-2026.json'), 'utf8'));

// --- 実自治体: 京都市(26100) 令和8年度 表A/B/C(0-2歳・3号) ---
// 政令市。timeBand 7区分(短時間+標準6段) × facility A/B/C。第2子以降=全階層無償・ひとり親(≤第9階層)=はぐくみ応援額。
// 出典: 表A/B/C https://www.city.kyoto.lg.jp/hagukumi/page/0000178518.html (hyoua/b/c.pdf・2026-07-06取得)
const kyoto = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../data/municipalities/kyoto/hoiku-2026.json'), 'utf8'));

// --- 実自治体: 名古屋市(23100) 2・3号認定 3歳未満児 ---
// 政令市。施設区分なし単一表・素の階層照合(seireiConversion:false=6/8補正なし。入力の所得割が税源移譲前基準)。
// C1均等割=有料5,700(maxShotokuwari:0)。ひとり親=C1-C3半額/C4-C7a(77,101未満)3,800円・2人目0。多子=2人目1/2・3人目0。
// 出典: 名古屋市 基準月額表(r7mimannjihoikuryou.pdf)+公式シミュレータ。独立3ソースで全セル突合済(2026-07-06)。
const nagoya = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../data/municipalities/nagoya/hoiku-2026.json'), 'utf8'));

// --- 実自治体: 神戸市(28100) 施行細則別表 3歳未満児 ---
// 政令市(6/8補正)。第2子=明示実額(child2)・第3子0。ひとり親(要保護者等)=C:6,100/D1-D2a:9,000・第2子0/D2b:第1子は基準額・第2子0。D2を77,100分割。
const kobe = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../data/municipalities/kobe/hoiku-2026.json'), 'utf8'));

// --- 実自治体: 浜松市(22130) 3号認定 3歳未満児 ---
// 政令市。第2子=明示実額・第3子0。母子世帯等(ひとり親)=階層3-8a(≤77,101)別額・第2子0。階層8を77,101/84,900で分割(境界食い違い)。
const hamamatsu = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../data/municipalities/hamamatsu/hoiku-2026.json'), 'utf8'));

// --- 実自治体: 札幌市(01100) 2・3号認定 3歳未満児 ---
// 政令市(6/8補正)。第2子以降=全世帯無条件0(R6.4〜)。ひとり親等=<77,101で一律4,400(C0/D01/D02)・第2子0。D2を77,100分割。
// ⚠️出典表はR5版(現行掲載・2024-03-15更新)。R8金額の一致は未確認のため status:'provisional'。
const sapporo = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../data/municipalities/sapporo/hoiku-2026.json'), 'utf8'));

// --- 実自治体: 新潟市(15100) 3号認定 3歳未満児 ---
// 政令市(6%算定基準で階層判定・8%通知は6/8補正)。表①=第2子実額(C/D1=0,D2A以降=第1子×1/4)。
// 表③=ひとり親/在宅障がい児者/生保 かつ 6%77,101未満(D3Aまで)。第3子以降0。表②はセレクタギャップ(未実装)。
// 出典 R8hoikuryouhyou.pdf(令和8年4月版) 全4ページ本人提供・実額確認済 → status:'verified'。
const niigata = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '../data/municipalities/niigata/hoiku-2026.json'), 'utf8'));
// 下地表の brackets 不変条件も同時に検証（free 自治体は auto-scan 対象外のためここで担保）
{
  const errs = validateBrackets(otaBase);
  if (errs.length) { console.log('✗ 大田区 baseTable validateBrackets:', errs.join(' / ')); process.exit(1); }
}

// { name, muni, input, expected:{monthly, level?} }
const CASES = [
  // --- 一般市: 標準/短時間 ---
  { name: '一般:level4標準', muni: generalCity,
    input: { father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 } }, expected: { monthly: 30000, level: 4 } },
  { name: '一般:level4短時間', muni: generalCity,
    input: { father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 }, timeType: 'short' }, expected: { monthly: 29600 } },
  // --- 0歳別額（優先ケース）---
  { name: '一般:level4・0歳別額', muni: generalCity,
    input: { father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 }, age: 'age0' }, expected: { monthly: 31000 } },
  // --- ひとり親軽減（優先ケース）---
  { name: '一般:level3ひとり親', muni: generalCity,
    input: { mother: { shotokuwari: 20000 }, hitorioya: true }, expected: { monthly: 9000, level: 3 } },
  // --- 多子軽減 ---
  { name: '一般:第2子半額', muni: generalCity,
    input: { father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 }, childOrder: 2 }, expected: { monthly: 15000 } },
  { name: '一般:第3子無償', muni: generalCity,
    input: { father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 }, childOrder: 3 }, expected: { monthly: 0 } },
  // --- 非課税/生活保護 ---
  { name: '一般:非課税0', muni: generalCity, input: { hikazei: true }, expected: { monthly: 0, level: 2 } },
  { name: '一般:生活保護0', muni: generalCity, input: { seikatsuhogo: true }, expected: { monthly: 0, level: 1 } },
  // --- 最上段（国基準上限）到達 ---
  { name: '一般:最上段104,000', muni: generalCity,
    input: { father: { shotokuwari: 300000 }, mother: { shotokuwari: 200000 } }, expected: { monthly: 104000, level: 8 } },
  // --- 政令市6/8（優先ケース）: 通知書8% 父80000+母40000=120000 → ×6/8=90000 → level4 33000 ---
  { name: '政令市:6/8補正後level4', muni: seireiCity,
    input: { father: { shotokuwari: 80000 }, mother: { shotokuwari: 40000 }, isSeireiNotice: true }, expected: { monthly: 33000, level: 4 } },
  // --- 政令市: 年収連動(6%相当を既に算出済)なら補正しない。90000そのまま → level4 ---
  { name: '政令市:年収連動は補正なし', muni: seireiCity,
    input: { father: { shotokuwari: 60000 }, mother: { shotokuwari: 30000 }, isSeireiNotice: false }, expected: { monthly: 33000, level: 4 } },
  // --- 東京free ---
  { name: '東京free:第1子0', muni: tokyoFree, input: { father: { shotokuwari: 999999 } }, expected: { monthly: 0 } },
  // --- 大阪市型(第2子無償) ---
  { name: '大阪型:第1子は有料', muni: secondFree,
    input: { father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 } }, expected: { monthly: 30000, level: 4 } },
  { name: '大阪型:第2子無償', muni: secondFree,
    input: { father: { shotokuwari: 40000 }, mother: { shotokuwari: 30000 }, childOrder: 2 }, expected: { monthly: 0 } },

  // --- 実自治体: 大田区(下地表 baseTable・公式実額) ---
  // 指数=区民税所得割の父母合算。1,2歳=standard / 0歳=byAge.age0 / 短時間=×0.983切捨。
  { name: '大田区:C1均等割のみ(index0)1,2歳', muni: otaBase,
    input: { father: { shotokuwari: 0 }, mother: { shotokuwari: 0 } }, expected: { monthly: 2000, level: 3 } },
  { name: '大田区:C2(所得割<3万)1,2歳', muni: otaBase,
    input: { father: { shotokuwari: 20000 }, mother: { shotokuwari: 0 } }, expected: { monthly: 3000, level: 4 } },
  { name: '大田区:C4(5万〜6万未満)1,2歳', muni: otaBase,
    input: { father: { shotokuwari: 55000 }, mother: { shotokuwari: 0 } }, expected: { monthly: 5400, level: 6 } },
  { name: '大田区:C4 0歳別額', muni: otaBase,
    input: { father: { shotokuwari: 55000 }, mother: { shotokuwari: 0 }, age: 'age0' }, expected: { monthly: 5700 } },
  { name: '大田区:C4 短時間(5400×0.983切捨)', muni: otaBase,
    input: { father: { shotokuwari: 55000 }, mother: { shotokuwari: 0 }, timeType: 'short' }, expected: { monthly: 5300 } },
  { name: '大田区:C4 0歳×短時間(5700×0.983切捨=5600)', muni: otaBase,
    input: { father: { shotokuwari: 55000 }, mother: { shotokuwari: 0 }, age: 'age0', timeType: 'short' }, expected: { monthly: 5600 } },
  { name: '大田区:C4 0歳×ひとり親(5700×0.40)', muni: otaBase,
    input: { father: { shotokuwari: 55000 }, mother: { shotokuwari: 0 }, age: 'age0', hitorioya: true }, expected: { monthly: 2280 } },
  { name: '大田区:境界 index30000→C3', muni: otaBase,
    input: { father: { shotokuwari: 30000 }, mother: { shotokuwari: 0 } }, expected: { monthly: 4000, level: 5 } },
  { name: '大田区:境界 index193300→C15', muni: otaBase,
    input: { father: { shotokuwari: 100000 }, mother: { shotokuwari: 93300 } }, expected: { monthly: 33000, level: 17 } },
  { name: '大田区:C27最上段(60万〜)1,2歳', muni: otaBase,
    input: { father: { shotokuwari: 400000 }, mother: { shotokuwari: 200000 } }, expected: { monthly: 69800, level: 29 } },
  { name: '大田区:ひとり親C1(均等割のみ/所得割0)×0.40', muni: otaBase,
    input: { father: { shotokuwari: 0 }, mother: { shotokuwari: 0 }, hitorioya: true }, expected: { monthly: 800, level: 3 } },
  { name: '大田区:ひとり親C2(所得割<77101)×0.40', muni: otaBase,
    input: { mother: { shotokuwari: 20000 }, hitorioya: true }, expected: { monthly: 1200 } },
  { name: '大田区:ひとり親C6内・所得割75000(<77101)×0.40', muni: otaBase,
    input: { father: { shotokuwari: 75000 }, mother: { shotokuwari: 0 }, hitorioya: true }, expected: { monthly: 4520, level: 8 } },
  { name: '大田区:ひとり親C6内・所得割78000(>=77101)は軽減なし', muni: otaBase,
    input: { father: { shotokuwari: 78000 }, mother: { shotokuwari: 0 }, hitorioya: true }, expected: { monthly: 11300, level: 8 } },
  { name: '大田区:第2子無償', muni: otaBase,
    input: { father: { shotokuwari: 300000 }, mother: { shotokuwari: 0 }, childOrder: 2 }, expected: { monthly: 0 } },
  { name: '大田区:非課税0', muni: otaBase, input: { hikazei: true }, expected: { monthly: 0, level: 2 } },

  // --- 実自治体: 横浜市(6%基準・第2子実額・ひとり親E階層) ---
  { name: '横浜:C均等割のみ(index0)第1子', muni: yokohama,
    input: { father: { shotokuwari: 0 }, mother: { shotokuwari: 0 } }, expected: { monthly: 6700, level: 3 } },
  { name: '横浜:境界 D1(index10000以下)', muni: yokohama,
    input: { father: { shotokuwari: 10000 }, mother: { shotokuwari: 0 } }, expected: { monthly: 8200, level: 4 } },
  { name: '横浜:境界 D2(index10100)', muni: yokohama,
    input: { father: { shotokuwari: 10100 }, mother: { shotokuwari: 0 } }, expected: { monthly: 10000, level: 5 } },
  { name: '横浜:D5境界(index77100)', muni: yokohama,
    input: { father: { shotokuwari: 77100 }, mother: { shotokuwari: 0 } }, expected: { monthly: 16500, level: 8 } },
  { name: '横浜:D27最上段', muni: yokohama,
    input: { father: { shotokuwari: 500000 }, mother: { shotokuwari: 0 } }, expected: { monthly: 77500, level: 30 } },
  { name: '横浜:D13 第1子(index20万は父母合算)', muni: yokohama,
    input: { father: { shotokuwari: 120000 }, mother: { shotokuwari: 80000 } }, expected: { monthly: 47500, level: 16 } },
  { name: '横浜:D13 第2子(明示実額)', muni: yokohama,
    input: { father: { shotokuwari: 120000 }, mother: { shotokuwari: 80000 }, childOrder: 2 }, expected: { monthly: 21400 } },
  { name: '横浜:第2子短時間(D13)', muni: yokohama,
    input: { father: { shotokuwari: 120000 }, mother: { shotokuwari: 80000 }, childOrder: 2, timeType: 'short' }, expected: { monthly: 21000 } },
  { name: '横浜:第3子=0', muni: yokohama,
    input: { father: { shotokuwari: 500000 }, mother: { shotokuwari: 0 }, childOrder: 3 }, expected: { monthly: 0 } },
  { name: '横浜:ひとり親 C→E0', muni: yokohama,
    input: { father: { shotokuwari: 0 }, mother: { shotokuwari: 0 }, hitorioya: true }, expected: { monthly: 2300, level: 3 } },
  { name: '横浜:ひとり親 D5→E5(境界77100)', muni: yokohama,
    input: { father: { shotokuwari: 77100 }, mother: { shotokuwari: 0 }, hitorioya: true }, expected: { monthly: 3200, level: 8 } },
  { name: '横浜:ひとり親 D6は付け替えなし', muni: yokohama,
    input: { father: { shotokuwari: 90000 }, mother: { shotokuwari: 0 }, hitorioya: true }, expected: { monthly: 20400, level: 9 } },
  { name: '横浜:ひとり親 第2子=0(E child2)', muni: yokohama,
    input: { father: { shotokuwari: 0 }, mother: { shotokuwari: 0 }, hitorioya: true, childOrder: 2 }, expected: { monthly: 0 } },
  { name: '横浜:6/8補正 通知書8%所得割100000→75000→D5', muni: yokohama,
    input: { father: { shotokuwari: 100000 }, mother: { shotokuwari: 0 }, isSeireiNotice: true }, expected: { monthly: 16500, level: 8 } },
  { name: '横浜:非課税0', muni: yokohama, input: { hikazei: true }, expected: { monthly: 0, level: 2 } },
  { name: '横浜:生活保護0', muni: yokohama, input: { seikatsuhogo: true }, expected: { monthly: 0, level: 1 } },
  // 施設タイプ: 小規模保育(kogata) — 認可より安い別額列
  { name: '横浜:小規模 C第1子', muni: yokohama,
    input: { father: { shotokuwari: 0 }, mother: { shotokuwari: 0 }, facility: 'kogata' }, expected: { monthly: 4000, level: 3 } },
  { name: '横浜:小規模 C第2子', muni: yokohama,
    input: { father: { shotokuwari: 0 }, mother: { shotokuwari: 0 }, facility: 'kogata', childOrder: 2 }, expected: { monthly: 1600 } },
  { name: '横浜:小規模 D27第1子', muni: yokohama,
    input: { father: { shotokuwari: 500000 }, mother: { shotokuwari: 0 }, facility: 'kogata' }, expected: { monthly: 58100, level: 30 } },
  { name: '横浜:小規模 ひとり親C→E0', muni: yokohama,
    input: { father: { shotokuwari: 0 }, mother: { shotokuwari: 0 }, facility: 'kogata', hitorioya: true }, expected: { monthly: 1600, level: 3 } },
  { name: '横浜:小規模 短時間(C)', muni: yokohama,
    input: { father: { shotokuwari: 0 }, mother: { shotokuwari: 0 }, facility: 'kogata', timeType: 'short' }, expected: { monthly: 3900 } },
  { name: '横浜:facility既定=認可(6700)', muni: yokohama,
    input: { father: { shotokuwari: 0 }, mother: { shotokuwari: 0 } }, expected: { monthly: 6700, level: 3 } },

  // --- 京都市: timeBand 7区分 × facility A/B/C（公式表A/B/Cの実額） ---
  // 公式算定例: 父母各40,000(旧6%)=80,000 → ⑩階層, 10時間, 表A = 24,300
  { name: '京都:公式例 ⑩/10時間/A=24300', muni: kyoto,
    input: { father: { shotokuwari: 40000 }, mother: { shotokuwari: 40000 }, timeType: 'std_10h', facility: 'A' }, expected: { monthly: 24300, level: 10 } },
  // facility 既定=A（defaultFacility）で同額
  { name: '京都:facility既定=A(⑩/10時間)', muni: kyoto,
    input: { father: { shotokuwari: 40000 }, mother: { shotokuwari: 40000 }, timeType: 'std_10h' }, expected: { monthly: 24300, level: 10 } },
  // 時間区分の両端（表A ⑦: 短時間12,800 / 11時間15,600）
  { name: '京都:A ⑦ 短時間=12800', muni: kyoto,
    input: { father: { shotokuwari: 58099 }, timeType: 'short', facility: 'A' }, expected: { monthly: 12800, level: 7 } },
  { name: '京都:A ⑦ 11時間=15600', muni: kyoto,
    input: { father: { shotokuwari: 58099 }, timeType: 'std_11h', facility: 'A' }, expected: { monthly: 15600, level: 7 } },
  // 既定 timeType（省略時=std_11h）で最上段 ㉒ 表A = 94,400
  { name: '京都:A ㉒ 既定std_11h=94400', muni: kyoto,
    input: { father: { shotokuwari: 400000 }, facility: 'A' }, expected: { monthly: 94400, level: 22 } },
  // 施設B/C の別額（表B ⑩ 10時間=21,900 / 表C ⑨ 11時間=22,800）
  { name: '京都:B ⑩ 10時間=21900', muni: kyoto,
    input: { father: { shotokuwari: 80000 }, timeType: 'std_10h', facility: 'B' }, expected: { monthly: 21900, level: 10 } },
  { name: '京都:C ⑨ 11時間=22800', muni: kyoto,
    input: { father: { shotokuwari: 77100 }, timeType: 'std_11h', facility: 'C' }, expected: { monthly: 22800, level: 9 } },
  // 階層境界 ⑨(≤77,100)／⑩(77,101〜) 表A 11時間
  { name: '京都:境界 index=77100→⑨/A/11時間=24700', muni: kyoto,
    input: { father: { shotokuwari: 77100 }, timeType: 'std_11h', facility: 'A' }, expected: { monthly: 24700, level: 9 } },
  { name: '京都:境界 index=77101→⑩/A/11時間=25800', muni: kyoto,
    input: { father: { shotokuwari: 77101 }, timeType: 'std_11h', facility: 'A' }, expected: { monthly: 25800, level: 10 } },
  // ③=均等割のみ(所得割0) 表A 短時間=3,800 ／ ②非課税=0
  { name: '京都:③ index=0/A/短時間=3800', muni: kyoto,
    input: { father: { shotokuwari: 0 }, timeType: 'short', facility: 'A' }, expected: { monthly: 3800, level: 3 } },
  { name: '京都:非課税=0', muni: kyoto, input: { hikazei: true, facility: 'A' }, expected: { monthly: 0, level: 2 } },
  // 第2子以降=全階層無償
  { name: '京都:⑩ 第2子=0', muni: kyoto,
    input: { father: { shotokuwari: 40000 }, mother: { shotokuwari: 40000 }, timeType: 'std_10h', facility: 'A', childOrder: 2 }, expected: { monthly: 0 } },
  // ひとり親(≤第9階層): 1人目=はぐくみ応援額（表A ⑨ 11時間=8,900 / 表B ⑨ 短時間=7,000）、2人目以降=0
  { name: '京都:ひとり親 ⑨/A/11時間=8900', muni: kyoto,
    input: { father: { shotokuwari: 77100 }, hitorioya: true, timeType: 'std_11h', facility: 'A' }, expected: { monthly: 8900, level: 9 } },
  { name: '京都:ひとり親 ⑨/B/短時間=7000', muni: kyoto,
    input: { father: { shotokuwari: 77100 }, hitorioya: true, timeType: 'short', facility: 'B' }, expected: { monthly: 7000, level: 9 } },
  { name: '京都:ひとり親 ⑩は対象外→基準額24300', muni: kyoto,
    input: { father: { shotokuwari: 40000 }, mother: { shotokuwari: 40000 }, hitorioya: true, timeType: 'std_10h', facility: 'A' }, expected: { monthly: 24300, level: 10 } },
  // 指定都市6/8補正: 通知書8% 父80,000+母40,000=120,000 → ×6/8=90,000 → ⑪(≤96,999) 表A 11時間=27,000
  { name: '京都:6/8補正後 ⑪/A/11時間=27000', muni: kyoto,
    input: { father: { shotokuwari: 80000 }, mother: { shotokuwari: 40000 }, isSeireiNotice: true, timeType: 'std_11h', facility: 'A' }, expected: { monthly: 27000, level: 11 } },

  // --- 名古屋市: 施設区分なし単一表・所得割(税源移譲前基準)を直接照合 ---
  // 基準額(標準/短時間)
  { name: '名古屋:C1均等割(index=0)標準=5700', muni: nagoya,
    input: { father: { shotokuwari: 0 } }, expected: { monthly: 5700, level: 3 } },
  { name: '名古屋:非課税=0', muni: nagoya, input: { hikazei: true }, expected: { monthly: 0, level: 2 } },
  { name: '名古屋:生活保護=0', muni: nagoya, input: { seikatsuhogo: true }, expected: { monthly: 0, level: 1 } },
  { name: '名古屋:父母合算50,000→C5標準=17500', muni: nagoya,
    input: { father: { shotokuwari: 30000 }, mother: { shotokuwari: 20000 } }, expected: { monthly: 17500, level: 7 } },
  { name: '名古屋:C10 短時間=42000', muni: nagoya,
    input: { father: { shotokuwari: 150000 }, timeType: 'short' }, expected: { monthly: 42000, level: 13 } },
  { name: '名古屋:C16(最高額)標準=64000', muni: nagoya,
    input: { father: { shotokuwari: 600000 } }, expected: { monthly: 64000, level: 19 } },
  // 階層境界
  { name: '名古屋:境界 index=9999→C2 短時間=6300', muni: nagoya,
    input: { father: { shotokuwari: 9999 }, timeType: 'short' }, expected: { monthly: 6300, level: 4 } },
  { name: '名古屋:境界 index=10000→C3 短時間=11100', muni: nagoya,
    input: { father: { shotokuwari: 10000 }, timeType: 'short' }, expected: { monthly: 11100, level: 5 } },
  { name: '名古屋:境界 index=518000→C16 標準=64000', muni: nagoya,
    input: { father: { shotokuwari: 518000 } }, expected: { monthly: 64000, level: 19 } },
  // 多子(2人目1/2・3人目0)
  { name: '名古屋:C3 第2子=1/2=5600', muni: nagoya,
    input: { father: { shotokuwari: 20000 }, childOrder: 2 }, expected: { monthly: 5600 } },
  { name: '名古屋:C3 第3子=0', muni: nagoya,
    input: { father: { shotokuwari: 20000 }, childOrder: 3 }, expected: { monthly: 0 } },
  // ひとり親(C1-C3半額・C4-C7a=3,800・2人目0/C7b以上対象外)
  { name: '名古屋:ひとり親 C1 1人目=半額2850', muni: nagoya,
    input: { father: { shotokuwari: 0 }, hitorioya: true }, expected: { monthly: 2850, level: 3 } },
  { name: '名古屋:ひとり親 C4 1人目=3800', muni: nagoya,
    input: { father: { shotokuwari: 41000 }, hitorioya: true }, expected: { monthly: 3800, level: 6 } },
  { name: '名古屋:ひとり親 C7a(index=77100)1人目=3800', muni: nagoya,
    input: { father: { shotokuwari: 77100 }, hitorioya: true }, expected: { monthly: 3800, level: 9 } },
  { name: '名古屋:ひとり親 C7a 2人目=0', muni: nagoya,
    input: { father: { shotokuwari: 77100 }, hitorioya: true, childOrder: 2 }, expected: { monthly: 0 } },
  { name: '名古屋:ひとり親 C7b(index=77101)対象外=25800', muni: nagoya,
    input: { father: { shotokuwari: 77101 }, hitorioya: true }, expected: { monthly: 25800, level: 10 } },

  // --- 神戸市: 第2子=明示実額・ひとり親(要保護者等)C/D1-D2a/D2b ---
  { name: '神戸:生活保護=0', muni: kobe, input: { seikatsuhogo: true }, expected: { monthly: 0, level: 1 } },
  { name: '神戸:非課税=0', muni: kobe, input: { hikazei: true }, expected: { monthly: 0, level: 2 } },
  { name: '神戸:C 第1子 標準=12300', muni: kobe,
    input: { father: { shotokuwari: 30000 } }, expected: { monthly: 12300, level: 3 } },
  { name: '神戸:C 第2子(明示)=6200', muni: kobe,
    input: { father: { shotokuwari: 30000 }, childOrder: 2 }, expected: { monthly: 6200 } },
  { name: '神戸:D6 第1子 標準=66000', muni: kobe,
    input: { father: { shotokuwari: 400000 } }, expected: { monthly: 66000, level: 10 } },
  { name: '神戸:D3 短時間=35000', muni: kobe,
    input: { father: { shotokuwari: 100000 }, timeType: 'short' }, expected: { monthly: 35000, level: 7 } },
  { name: '神戸:境界 index=48600→D1=20300', muni: kobe,
    input: { father: { shotokuwari: 48600 } }, expected: { monthly: 20300, level: 4 } },
  { name: '神戸:ひとり親 C 第1子=6100', muni: kobe,
    input: { father: { shotokuwari: 30000 }, hitorioya: true }, expected: { monthly: 6100, level: 3 } },
  { name: '神戸:ひとり親 C 第2子=0', muni: kobe,
    input: { father: { shotokuwari: 30000 }, hitorioya: true, childOrder: 2 }, expected: { monthly: 0 } },
  { name: '神戸:ひとり親 D2a(≤77,100)第1子=9000', muni: kobe,
    input: { father: { shotokuwari: 70000 }, hitorioya: true }, expected: { monthly: 9000, level: 5 } },
  { name: '神戸:ひとり親 D2b(>77,100)第1子=基準額24000', muni: kobe,
    input: { father: { shotokuwari: 80000 }, hitorioya: true }, expected: { monthly: 24000, level: 6 } },
  { name: '神戸:ひとり親 D2b 第2子=0', muni: kobe,
    input: { father: { shotokuwari: 80000 }, hitorioya: true, childOrder: 2 }, expected: { monthly: 0 } },
  { name: '神戸:6/8補正 8%64,800→48,600→D1=20300', muni: kobe,
    input: { father: { shotokuwari: 64800 }, isSeireiNotice: true }, expected: { monthly: 20300, level: 4 } },

  // --- 浜松市: 母子/その他の境界食い違い(階層8=77,101/84,900)を段分割で吸収 ---
  { name: '浜松:生保=0', muni: hamamatsu, input: { seikatsuhogo: true }, expected: { monthly: 0, level: 1 } },
  { name: '浜松:階層3(index=0)標準=8100', muni: hamamatsu,
    input: { father: { shotokuwari: 0 } }, expected: { monthly: 8100, level: 3 } },
  { name: '浜松:階層17 標準=73600', muni: hamamatsu,
    input: { father: { shotokuwari: 400000 } }, expected: { monthly: 73600, level: 18 } },
  { name: '浜松:階層5 第2子(明示)=5900', muni: hamamatsu,
    input: { father: { shotokuwari: 30000 }, childOrder: 2 }, expected: { monthly: 5900 } },
  { name: '浜松:階層5 第3子=0', muni: hamamatsu,
    input: { father: { shotokuwari: 30000 }, childOrder: 3 }, expected: { monthly: 0 } },
  { name: '浜松:母子 階層3 第1子=3000', muni: hamamatsu,
    input: { father: { shotokuwari: 0 }, hitorioya: true }, expected: { monthly: 3000, level: 3 } },
  { name: '浜松:母子 階層8a(index=77100)第1子=5400', muni: hamamatsu,
    input: { father: { shotokuwari: 77100 }, hitorioya: true }, expected: { monthly: 5400, level: 8 } },
  { name: '浜松:境界食い違い ひとり親 階層8b(index=77101)=母子軽減なし20100', muni: hamamatsu,
    input: { father: { shotokuwari: 77101 }, hitorioya: true }, expected: { monthly: 20100, level: 9 } },

  // --- 札幌市: 第2子以降全世帯0(R6.4〜)・ひとり親一律4,400(<77,101)。出典R5表・現行性[要確認] ---
  { name: '札幌:生保=0', muni: sapporo, input: { seikatsuhogo: true }, expected: { monthly: 0, level: 1 } },
  { name: '札幌:非課税=0', muni: sapporo, input: { hikazei: true }, expected: { monthly: 0, level: 2 } },
  { name: '札幌:均等割のみ(index0)→C1標準=11000', muni: sapporo,
    input: { father: { shotokuwari: 0 } }, expected: { monthly: 11000, level: 3 } },
  { name: '札幌:D9標準=75900', muni: sapporo,
    input: { father: { shotokuwari: 400000 } }, expected: { monthly: 75900, level: 13 } },
  { name: '札幌:境界 index48600→D1標準=15680', muni: sapporo,
    input: { father: { shotokuwari: 48600 } }, expected: { monthly: 15680, level: 4 } },
  { name: '札幌:D2分割 index77101→D2b level6', muni: sapporo,
    input: { father: { shotokuwari: 77101 } }, expected: { monthly: 22550, level: 6 } },
  { name: '札幌:第2子=全世帯0', muni: sapporo,
    input: { father: { shotokuwari: 30000 }, childOrder: 2 }, expected: { monthly: 0 } },
  { name: '札幌:ひとり親 C0(index30000)=4400', muni: sapporo,
    input: { father: { shotokuwari: 30000 }, hitorioya: true }, expected: { monthly: 4400, level: 3 } },
  { name: '札幌:ひとり親 D02a(index70000,≤77,100)=4400', muni: sapporo,
    input: { father: { shotokuwari: 70000 }, hitorioya: true }, expected: { monthly: 4400, level: 5 } },
  { name: '札幌:ひとり親 D2b(index80000,>77,101)=基準額22550', muni: sapporo,
    input: { father: { shotokuwari: 80000 }, hitorioya: true }, expected: { monthly: 22550, level: 6 } },
  { name: '札幌:6/8補正 8%64,800→48,600→D1標準15680', muni: sapporo,
    input: { father: { shotokuwari: 64800 }, isSeireiNotice: true }, expected: { monthly: 15680, level: 4 } },

  // --- 新潟市: 6%算定基準で階層判定・表①第2子実額(×1/4)・表③ひとり親等(D3Aまで)。R8実額[確認済] ---
  { name: '新潟:生保=0', muni: niigata, input: { seikatsuhogo: true }, expected: { monthly: 0, level: 1 } },
  { name: '新潟:非課税=0', muni: niigata, input: { hikazei: true }, expected: { monthly: 0, level: 2 } },
  { name: '新潟:C所得割非課税(index0)標準=11000', muni: niigata,
    input: { father: { shotokuwari: 0 } }, expected: { monthly: 11000, level: 3 } },
  { name: '新潟:D1標準=13300', muni: niigata,
    input: { father: { shotokuwari: 30000 } }, expected: { monthly: 13300, level: 4 } },
  { name: '新潟:境界 index48600→D2A標準=16300', muni: niigata,
    input: { father: { shotokuwari: 48600 } }, expected: { monthly: 16300, level: 5 } },
  { name: '新潟:D3A/D3B境界 index77101→D3B level8', muni: niigata,
    input: { father: { shotokuwari: 77101 } }, expected: { monthly: 20500, level: 8 } },
  { name: '新潟:D11標準=57200', muni: niigata,
    input: { father: { shotokuwari: 400000 } }, expected: { monthly: 57200, level: 16 } },
  { name: '新潟:第2子D2A(実額×1/4)標準=4070', muni: niigata,
    input: { father: { shotokuwari: 50000 }, childOrder: 2 }, expected: { monthly: 4070, level: 5 } },
  { name: '新潟:第2子D1=0(表①C/D1は第2子0)', muni: niigata,
    input: { father: { shotokuwari: 30000 }, childOrder: 2 }, expected: { monthly: 0 } },
  { name: '新潟:第3子以降=0', muni: niigata,
    input: { father: { shotokuwari: 400000 }, childOrder: 3 }, expected: { monthly: 0 } },
  { name: '新潟:表③ひとり親D2A(index50000)=8150', muni: niigata,
    input: { father: { shotokuwari: 50000 }, hitorioya: true }, expected: { monthly: 8150, level: 5 } },
  { name: '新潟:表③ D3A(index77000)標準=9000', muni: niigata,
    input: { father: { shotokuwari: 77000 }, hitorioya: true }, expected: { monthly: 9000, level: 7 } },
  { name: '新潟:表③外 D3B(index78000)ひとり親→表①20500', muni: niigata,
    input: { father: { shotokuwari: 78000 }, hitorioya: true }, expected: { monthly: 20500, level: 8 } },
  { name: '新潟:6/8補正 8%64,800→48,600→D2A標準16300', muni: niigata,
    input: { father: { shotokuwari: 64800 }, isSeireiNotice: true }, expected: { monthly: 16300, level: 5 } },
  // 表②(child2alt): 非在園の年上きょうだい=第2子×1/2。C/D1/D2Aのみ。第2子・非ひとり親でのみ
  { name: '新潟:表② C(index0)第2子=5500', muni: niigata,
    input: { father: { shotokuwari: 0 }, childOrder: 2, olderSiblingNotEnrolled: true }, expected: { monthly: 5500, level: 3 } },
  { name: '新潟:表② C 短時間=5400', muni: niigata,
    input: { father: { shotokuwari: 0 }, childOrder: 2, olderSiblingNotEnrolled: true, timeType: 'short' }, expected: { monthly: 5400 } },
  { name: '新潟:表② D2A(index50000)第2子=8150', muni: niigata,
    input: { father: { shotokuwari: 50000 }, childOrder: 2, olderSiblingNotEnrolled: true }, expected: { monthly: 8150, level: 5 } },
  { name: '新潟:表②なし D2B(index58000)第2子→表①4070', muni: niigata,
    input: { father: { shotokuwari: 58000 }, childOrder: 2, olderSiblingNotEnrolled: true }, expected: { monthly: 4070, level: 6 } },
  { name: '新潟:フラグ無し C第2子=0(表①)', muni: niigata,
    input: { father: { shotokuwari: 0 }, childOrder: 2 }, expected: { monthly: 0 } },
  { name: '新潟:第1子は表②非適用 C=11000', muni: niigata,
    input: { father: { shotokuwari: 0 }, olderSiblingNotEnrolled: true }, expected: { monthly: 11000, level: 3 } },
  { name: '新潟:表③優先 ひとり親×フラグ C第2子=0', muni: niigata,
    input: { father: { shotokuwari: 0 }, childOrder: 2, hitorioya: true, olderSiblingNotEnrolled: true }, expected: { monthly: 0 } },
  // 表② 境界値(off-by-one 防護): D2A上端57,699=表②8,150 / D2B先頭57,700=表①4,070
  { name: '新潟:表② 境界 index57699(D2A)第2子=8150', muni: niigata,
    input: { father: { shotokuwari: 57699 }, childOrder: 2, olderSiblingNotEnrolled: true }, expected: { monthly: 8150, level: 5 } },
  { name: '新潟:表②なし 境界 index57700(D2B)第2子→表①4070', muni: niigata,
    input: { father: { shotokuwari: 57700 }, childOrder: 2, olderSiblingNotEnrolled: true }, expected: { monthly: 4070, level: 6 } },
  { name: '新潟:表② D1 第2子=6650', muni: niigata,
    input: { father: { shotokuwari: 30000 }, childOrder: 2, olderSiblingNotEnrolled: true }, expected: { monthly: 6650, level: 4 } },
  { name: '新潟:表② 第3子+フラグ=0(第3子以降優先)', muni: niigata,
    input: { father: { shotokuwari: 0 }, childOrder: 3, olderSiblingNotEnrolled: true }, expected: { monthly: 0 } },
  { name: '新潟:表② 非課税+フラグ=0', muni: niigata,
    input: { hikazei: true, childOrder: 2, olderSiblingNotEnrolled: true }, expected: { monthly: 0, level: 2 } },
];

function main() {
  let pass = 0, fail = 0;
  for (const c of CASES) {
    let got;
    try { got = calcHoiku(c.input, c.muni); }
    catch (e) { console.log(`✗ ${c.name}: 例外 ${e.message}`); fail++; continue; }
    const okMonthly = got.monthly === c.expected.monthly;
    const okLevel = c.expected.level == null || got.level === c.expected.level;
    if (okMonthly && okLevel) { console.log(`  ✓ ${c.name}  月額${got.monthly}${c.expected.level != null ? ` / level${got.level}` : ''}`); pass++; }
    else {
      console.log(`✗ ${c.name}: got={monthly:${got.monthly}, level:${got.level}} want={monthly:${c.expected.monthly}${c.expected.level != null ? `, level:${c.expected.level}` : ''}}`);
      fail++;
    }
  }
  console.log(`\n結果: ${pass} passed, ${fail} failed（CASES=${CASES.length}）`);
  console.log('※フィクスチャ由来。実自治体の公式表を収集したら CASES に実額を転記して増やすこと。');
  process.exit(fail ? 1 : 0);
}

main();
