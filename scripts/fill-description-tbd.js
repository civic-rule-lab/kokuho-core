/**
 * scripts/fill-description-tbd.js
 *
 * prefecture-info.js の description.full に残る [TBD] を
 * 調査済みの開始年度・使途で一括置換する。
 *
 * 実行: node scripts/fill-description-tbd.js
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.join(__dirname, '..', 'js', 'core', 'prefecture-info.js');

// 各県の [TBD: 開始年度] と [TBD: 使途] の値
// 出典: 各都道府県公式サイト（sourceUrl に記録済み）
const TBD_DATA = {
  aichi:     { year: '2008', use: '荒廃した人工林の間伐・再造林と里山整備' },
  akita:     { year: '2008', use: '森林整備（間伐・育林）と水源かん養機能の維持向上' },
  ehime:     { year: '2005', use: '間伐・再造林など人工林整備と県民参加の森林保全活動' },
  fukuoka:   { year: '2007', use: '人工林の間伐・再造林と水源かん養機能の維持向上' },
  fukushima: { year: '2006', use: '荒廃した人工林の間伐・再造林と森林環境の保全整備' },
  gifu:      { year: '2007', use: '間伐・再造林など森林整備と清流・自然環境の保全' },
  gunma:     { year: '2014', use: '人工林の間伐・整備と里山林の保全活動' },
  hiroshima: { year: '2007', use: '人工林の間伐・再造林と水源かん養・土砂災害防止など森林の公益的機能の維持向上' },
  hyogo:     { year: '2006', use: '森林整備（間伐・再造林）と里山・水源林の保全活動' },
  ibaraki:   { year: '2006', use: '森林整備と霞ヶ浦をはじめとする湖沼の水質保全' },
  ishikawa:  { year: '2007', use: '人工林の強度間伐による混交林化など森林の公益的機能の回復' },
  iwate:     { year: '2007', use: '人工林の間伐・再造林と森林の公益的機能の維持向上' },
  kagoshima: { year: '2005', use: '荒廃した人工林の再造林支援と里山の保全整備' },
  kanagawa:  { year: '2007', use: '水源地域の森林・河川・湧水地の整備保全' },
  kochi:     { year: '2003', use: '人工林の間伐・再造林と県民参加の森林保全活動（全国初の県独自森林環境税）' },
  kumamoto:  { year: '2006', use: '荒廃した人工林の間伐・再造林と水源かん養機能の維持向上' },
  kyoto:     { year: '2006', use: '人工林の間伐・再造林と府民参加の里山保全活動' },
  mie:       { year: '2014', use: '間伐・再造林など森林整備と県民参加による森林保全活動' },
  miyagi:    { year: '2011', use: '自然環境の保全整備および森林・里山の整備' },
  miyazaki:  { year: '2006', use: '花粉の少ないスギ苗木の普及支援と人工林の再造林・間伐整備' },
  nagano:    { year: '2008', use: '人工林の間伐・再造林と森林整備による水源かん養機能の維持向上' },
  nagasaki:  { year: '2007', use: '人工林の間伐・整備と水源かん養・土砂災害防止など森林の公益的機能の保全' },
  nara:      { year: '2006', use: '人工林の間伐・再造林と水源かん養・生物多様性の維持向上' },
  oita:      { year: '2006', use: '人工林の間伐・再造林と水源かん養機能の維持向上' },
  okayama:   { year: '2004', use: '荒廃した人工林の間伐・再造林と水源かん養機能の維持向上' },
  osaka:     { year: '2016', use: '森林整備による土砂流出・流木発生防止など府民の生命・財産を守る防災対策' },
  saga:      { year: '2008', use: '人工林の間伐・再造林と県民参加の森林保全活動' },
  shiga:     { year: '2006', use: '琵琶湖の水源を担う森林の間伐・再造林と公益的機能の維持向上' },
  shimane:   { year: '2005', use: '人工林の間伐・再造林と水源かん養・山地災害防止など森林の公益的機能の維持向上' },
  shizuoka:  { year: '2007', use: '人工林の間伐・再造林と水源かん養機能の維持向上' },
  tochigi:   { year: '2008', use: '人工林の間伐・再造林と里山林整備による森林の公益的機能の維持向上' },
  tottori:   { year: '2023', use: '市民と行政が協働する里山・人工林の整備（前身の「森林環境保全税」は2005年度から実施）' },
  toyama:    { year: '2007', use: '水と緑の豊かな森林の整備と水源かん養機能の維持向上' },
  wakayama:  { year: '2007', use: '人工林の間伐・再造林と紀伊半島の水源林・里山保全' },
  yamagata:  { year: '2007', use: '荒廃した人工林の間伐・再造林と里山・水源林の整備保全' },
  yamaguchi: { year: '2005', use: '放置人工林の間伐・竹林整備と水源かん養・山地災害防止など森林の公益的機能の回復' },
  yamanashi: { year: '2012', use: '荒廃した人工林の間伐・再造林と富士山をはじめとする水源林の保全' },
};

let src = readFileSync(FILE, 'utf-8');
let count = 0;

for (const [slug, { year, use }] of Object.entries(TBD_DATA)) {
  const before = src;

  // [TBD: 開始年度] を置換
  const yearPattern = new RegExp(`("${slug}"[\\s\\S]*?)\\[TBD: 開始年度\\]`, 'g');
  src = src.replace(yearPattern, `$1${year}`);

  // [TBD: 使途] を置換
  const usePattern = new RegExp(`("${slug}"[\\s\\S]*?)\\[TBD: 使途\\]`, 'g');
  src = src.replace(usePattern, `$1${use}`);

  if (src !== before) {
    count++;
    console.log(`  ✅ ${slug}`);
  }
}

// 残存 TBD の確認
const remaining = (src.match(/\[TBD:/g) || []).length;

writeFileSync(FILE, src, 'utf-8');
console.log(`\n${count}件の TBD を置換。残存: ${remaining}箇所`);
