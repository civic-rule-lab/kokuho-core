/**
 * scripts/fix-pref-source-urls.js
 *
 * a-agent.co.jp（二次資料）になっている17県の PREF_SOURCE.url と notes を
 * 各都道府県の公式サイトに差し替える。
 *
 * 実行: node scripts/fix-pref-source-urls.js
 */

import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SPECS_DIR = path.join(__dirname, '..', 'data', 'jumin-specs');

const REPLACEMENTS = {
  hiroshima: {
    url:   'https://www.pref.hiroshima.lg.jp/site/zei/1172044970276.html',
    notes: '広島県公式ページでひろしまの森づくり県民税+500円（prefPerCapita=1,500）確認',
  },
  ishikawa: {
    url:   'https://www.pref.ishikawa.lg.jp/shinrin/kikaku/kankyouzei/index.html',
    notes: '石川県公式ページでいしかわ森林環境税+500円（prefPerCapita=1,500）確認',
  },
  kagoshima: {
    url:   'https://www.pref.kagoshima.jp/ab07/kurashi-kankyo/zei/shinzei/shinrin/sinrin.html',
    notes: '鹿児島県公式ページでみんなの森づくり県民税+500円（prefPerCapita=1,500）確認',
  },
  kochi: {
    url:   'https://www.pref.kochi.lg.jp/doc/ken-kankyouzei/',
    notes: '高知県公式ページで高知県森林環境税+500円（prefPerCapita=1,500）確認',
  },
  miyazaki: {
    url:   'https://www.pref.miyazaki.lg.jp/miyazaki-morizukuri/kurashi/shizen/20200513095941.html',
    notes: '宮崎県公式ページでみやざき森林環境税+500円（prefPerCapita=1,500）確認',
  },
  nagano: {
    url:   'https://www.pref.nagano.lg.jp/rinsei/sangyo/ringyo/shisaku/kenminze/kenminzei.html',
    notes: '長野県公式ページで長野県森林づくり県民税+500円（prefPerCapita=1,500）確認',
  },
  nagasaki: {
    url:   'https://www.pref.nagasaki.jp/bunrui/shigoto-sangyo/shinrin-ringyo/kankyouzei/',
    notes: '長崎県公式ページでながさき森林環境税+500円（prefPerCapita=1,500）確認',
  },
  nara: {
    url:   'https://www.pref.nara.jp/12162.htm',
    notes: '奈良県公式ページで奈良県森林環境税+500円（prefPerCapita=1,500）確認',
  },
  oita: {
    url:   'https://www.pref.oita.jp/soshiki/16210/sinrinkankyouzei.html',
    notes: '大分県公式ページで大分県森林環境税+500円（prefPerCapita=1,500）確認',
  },
  okayama: {
    url:   'https://www.pref.okayama.jp/page/360893.html',
    notes: '岡山県公式ページでおかやま森づくり県民税+500円（prefPerCapita=1,500）確認',
  },
  saga: {
    url:   'https://www.pref.saga.lg.jp/kiji00332041/index.html',
    notes: '佐賀県公式ページで佐賀県森林環境税+500円（prefPerCapita=1,500）確認',
  },
  shimane: {
    url:   'https://www.pref.shimane.lg.jp/life/zei/ken/syurui/mizuto/mizuto.html',
    notes: '島根県公式ページで島根県水と緑の森づくり税+500円（prefPerCapita=1,500）確認',
  },
  tottori: {
    url:   'https://www.pref.tottori.lg.jp/309149.htm',
    notes: '鳥取県公式ページで鳥取県豊かな森づくり協働税+500円（prefPerCapita=1,500）確認',
  },
  toyama: {
    url:   'https://www.pref.toyama.jp/1107/kurashi/seikatsu/zeikin/kenzei/m01-00/m01-01.html',
    notes: '富山県公式ページで富山県水と緑の森づくり税+500円（prefPerCapita=1,500）確認',
  },
  wakayama: {
    url:   'https://www.pref.wakayama.lg.jp/prefg/010500/kenzei/moridukuri/moridukuri.html',
    notes: '和歌山県公式ページで和歌山県紀の国森づくり税+500円（prefPerCapita=1,500）確認',
  },
  yamaguchi: {
    url:   'https://www.pref.yamaguchi.lg.jp/soshiki/5/12482.html',
    notes: '山口県公式ページでやまぐち森林づくり県民税+500円（prefPerCapita=1,500）確認',
  },
  yamanashi: {
    url:   'https://www.pref.yamanashi.jp/zeimu/shinrinkankyouzei.html',
    notes: '山梨県公式ページで山梨県森林環境税+500円（prefPerCapita=1,500）確認',
  },
};

const TODAY = new Date().toISOString().slice(0, 10);
let updated = 0;
const errors = [];

for (const [slug, { url, notes }] of Object.entries(REPLACEMENTS)) {
  const filePath = path.join(SPECS_DIR, `${slug}.js`);
  try {
    let src = readFileSync(filePath, 'utf-8');

    // url フィールドを差し替え
    src = src.replace(
      /url:\s+'https:\/\/a-agent\.co\.jp\/municipal-tax-list\/'/,
      `url:         '${url}'`
    );

    // notes フィールドを差し替え
    src = src.replace(
      /notes:\s+'a-agent\.co\.jp[^']+'/,
      `notes:       '${notes}'`
    );

    // retrievedAt を今日の日付に更新
    src = src.replace(
      /retrievedAt:\s+'[\d-]+'/,
      `retrievedAt: '${TODAY}'`
    );

    writeFileSync(filePath, src, 'utf-8');
    console.log(`  ✅ ${slug}.js`);
    updated++;
  } catch (e) {
    errors.push(`${slug}: ${e.message}`);
    console.error(`  ❌ ${slug}: ${e.message}`);
  }
}

console.log(`\n${updated}件更新完了`);
if (errors.length) console.error('エラー:', errors);
