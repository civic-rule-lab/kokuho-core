/**
 * 都道府県スペックファイルに PREF_SOURCE を一括追記するスクリプト
 * 実行: node scripts/set-pref-source.js
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPECS_DIR  = path.join(__dirname, '..', 'data', 'jumin-specs');

// ─── 各都道府県の確認済みソース ────────────────────────────────────
const PREF_SOURCES = {
  // ── 公式ページ直接確認済み ──
  miyagi:    { url: 'https://www.city.sendai.jp/shiminze-kikaku/kurashi/tetsuzuki/zekin/kojin/gaiyo.html', note: '仙台市公式ページでprefPerCapita=2,200（みやぎ環境税+1,200円）確認' },
  iwate:     { url: 'https://www.pref.iwate.jp/kensei/zei/gaiyou/kojin/1073136.html', note: '岩手県公式ページでprefPerCapita=2,000（いわての森林づくり県民税+1,000円）確認' },
  yamagata:  { url: 'https://www.pref.yamagata.jp/020007/zei_shitsumon/midori/midori.html', note: '山形県公式ページでやまがた緑環境税+1,000円/年確認' },
  fukushima: { url: 'https://www.pref.fukushima.lg.jp/sec/01115d/zeimu22.html', note: '福島県公式ページでprefPerCapita=2,000（ふくしま森林づくり県民税+1,000円）確認' },
  ibaraki:   { url: 'https://www.pref.ibaraki.jp/nourinsuisan/rinsei/shinkozei/tax/gaiyou/index.html', note: '茨城県公式ページで森林湖沼環境税+1,000円確認' },
  gifu:      { url: 'https://www.pref.gifu.lg.jp/page/8460.html', note: '岐阜県公式ページで清流の国ぎふ森林・環境税+1,000円確認' },
  mie:       { url: 'https://www.pref.mie.lg.jp/ZEIMU/HP/80013017950.htm', note: '三重県公式ページでみえ森と緑の県民税+1,000円確認' },
  akita:     { url: 'https://www.pref.akita.lg.jp/pages/archive/3973', note: '秋田県公式ページで水と緑の森づくり税+800円（prefPerCapita=1,800）確認' },
  shiga:     { url: 'https://www.pref.shiga.lg.jp/ippan/kurashi/zeikin/20003.html', note: '滋賀県公式ページで琵琶湖森林づくり県民税+800円確認' },
  hyogo:     { url: 'https://www.city.kobe.lg.jp/a83576/kurashi/tax/shikenminze/keisan/index.html', note: '神戸市公式ページで兵庫県民緑税+800円（prefPerCapita=1,800）確認' },
  tochigi:   { url: 'https://www.pref.tochigi.lg.jp/b07/life/zeikin/zeikin/mori.html', note: '栃木県公式ページでとちぎの元気な森づくり県民税+700円（prefPerCapita=1,700）確認' },
  gunma:     { url: 'https://www.pref.gunma.jp/page/7190.html', note: '群馬県公式ページでぐんま緑の県民税+700円（prefPerCapita=1,700）確認' },
  ehime:     { url: 'https://www.pref.ehime.jp/page/1629.html', note: '愛媛県公式ページで森林環境税+700円（prefPerCapita=1,700）確認' },
  kyoto:     { url: 'https://www.city.kyoto.lg.jp/gyozai/page/0000028299.html', note: '京都市公式ページで豊かな森を育てる府民税+600円（prefPerCapita=1,600）確認' },
  osaka:     { url: 'https://www.city.osaka.lg.jp/zaisei/page/0000383147.html', note: '大阪市公式ページで大阪府森林環境税+300円（prefPerCapita=1,300）確認' },
  kanagawa:  { url: 'https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/zeikin/y-shizei/kojin-shiminzei-kenminzei/kojin-shimin.html', note: '横浜市公式ページで神奈川県水源環境保全税: prefRate=4.025%、prefPerCapita=1,300確認' },
  shizuoka:  { url: 'https://www.city.hamamatsu.shizuoka.jp/shiminze/zei/siminze/kintou.html', note: '浜松市公式ページで静岡県森林づくり県民税+400円（prefPerCapita=1,400）確認' },
  aichi:     { url: 'https://www.pref.aichi.jp/zeimu/shotoku/midori.html', note: '愛知県公式ページであいち森と緑づくり税+500円（prefPerCapita=1,500）確認' },

  // ── a-agent.co.jp（2026年4月最新）で確認済み ──
  // 以下は a-agent.co.jp の包括的一覧（+500円グループ）で確認
  toyama:    { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版で富山県 水と緑の森づくり税+500円（prefPerCapita=1,500）確認' },
  ishikawa:  { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版でいしかわ森林環境税+500円（prefPerCapita=1,500）確認' },
  yamanashi: { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版で山梨県 森林環境税+500円（prefPerCapita=1,500）確認' },
  nagano:    { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版で長野県 森林づくり県民税+500円（prefPerCapita=1,500）確認' },
  nara:      { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版で奈良県 森林環境税+500円（prefPerCapita=1,500）確認' },
  wakayama:  { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版で和歌山県 紀の国森づくり税+500円（prefPerCapita=1,500）確認' },
  tottori:   { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版で鳥取県 豊かな森づくり協働税+500円（prefPerCapita=1,500）確認' },
  shimane:   { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版で島根県 水と緑の森づくり税+500円（prefPerCapita=1,500）確認' },
  okayama:   { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版でおかやま森づくり県民税+500円（prefPerCapita=1,500）確認' },
  hiroshima: { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版でひろしまの森づくり県民税+500円（prefPerCapita=1,500）確認' },
  yamaguchi: { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版でやまぐち森林づくり県民税+500円（prefPerCapita=1,500）確認' },
  kochi:     { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版で高知県 森林環境税+500円（prefPerCapita=1,500）確認' },
  fukuoka:   { url: 'https://www.city.kitakyushu.lg.jp/contents/08801107.html', note: '北九州市公式ページで福岡県 森林環境税+500円（prefPerCapita=1,500）確認' },
  saga:      { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版で佐賀県 森林環境税+500円（prefPerCapita=1,500）確認' },
  nagasaki:  { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版でながさき森林環境税+500円（prefPerCapita=1,500）確認' },
  kumamoto:  { url: 'https://www.city.kumamoto.jp/kiji00312986/index.html', note: '熊本市公式ページで水とみどりの森づくり税+500円（prefPerCapita=1,500）確認' },
  oita:      { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版で大分県 森林環境税+500円（prefPerCapita=1,500）確認' },
  miyazaki:  { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版でみやざき森林環境税+500円（prefPerCapita=1,500）確認' },
  kagoshima: { url: 'https://a-agent.co.jp/municipal-tax-list/', note: 'a-agent.co.jp 2026年4月版でみんなの森づくり県民税+500円（prefPerCapita=1,500）確認' },
};

const SECONDARY_SOURCE = 'https://a-agent.co.jp/municipal-tax-list/';
const RETRIEVED_AT     = '2026-04-30';

// ─── スペックファイルを更新 ──────────────────────────────────────

let updated = 0;

for (const [prefSlug, info] of Object.entries(PREF_SOURCES)) {
  const specPath = path.join(SPECS_DIR, `${prefSlug}.js`);
  let content;
  try {
    content = readFileSync(specPath, 'utf-8');
  } catch {
    console.log(`  ⚠️  ${prefSlug}: スペックファイルなし`);
    continue;
  }

  if (content.includes('PREF_SOURCE')) {
    console.log(`  ⏭️  ${prefSlug}: PREF_SOURCE 既存`);
    continue;
  }

  // PREF_DEFAULTS の直前に PREF_SOURCE を追記
  const sourceBlock = `
/**
 * PREF_DEFAULTS の verified 化ソース
 * 都道府県レベルの均等割超過額を公式または信頼性の高い二次資料で確認済み。
 */
export const PREF_SOURCE = {
  url:         '${info.url}',
  retrievedAt: '${RETRIEVED_AT}',
  notes:       '${info.note}',
};

`;

  const insertBefore = 'export const PREF_DEFAULTS';
  if (!content.includes(insertBefore)) {
    console.log(`  ⚠️  ${prefSlug}: PREF_DEFAULTS が見つかりません`);
    continue;
  }

  const newContent = content.replace(insertBefore, sourceBlock + insertBefore);
  writeFileSync(specPath, newContent, 'utf-8');
  console.log(`  ✅ ${prefSlug}: PREF_SOURCE を追記`);
  updated++;
}

console.log(`\n更新: ${updated}件`);
