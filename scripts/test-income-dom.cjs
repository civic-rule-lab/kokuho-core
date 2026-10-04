/**
 * test-income-dom.cjs — 所得ベース計算ページ（templates/kokuho-income.html）の結線を jsdom で統合検証。
 *   テンプレを埋め、js/core/kokuho.js と js/engine.js をインライン化し、fetch をローカルデータへモックして
 *   window.calc() を実行し、#result の金額を検査する。
 *
 * 2026-10-04 追加（TASKS X170-12 第2段）:
 *   「1人ずつ入力」欄（.member-row）に市原市の公式計算例を入れると、加入者ごとに基礎控除を引き、
 *   介護分を 40〜64歳 の人の所得だけに掛けた金額になること。欄が空なら従来の世帯合算で計算されること。
 * 実行: node scripts/test-income-dom.cjs
 */
'use strict';
const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const { calculateKokuho } = require('./lib/kokuho-loader.cjs');
const ROOT = path.join(__dirname, '..');

const SLUG = 'ichihara';
const YEAR = 2026;
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, `data/municipalities/${SLUG}/kokuho-${YEAR}.json`), 'utf8'));

function buildHtml() {
  let html = fs.readFileSync(path.join(ROOT, 'templates/kokuho-income.html'), 'utf8');
  const fill = {
    '__CANONICAL_URL__': 'https://kokuho-keisan.jp/chiba/ichihara/income.html', '__CITY_NAME__': '市原市',
    '__CITY_SLUG__': SLUG, '__CSS_V__': 'x', '__FISCAL_YEAR_LABEL__': '令和8年度', '__INTRO_TEXT__': '',
    '__JSON_LD__': '{}', '__JS_V__': 'x', '__META_DESC__': '', '__PREFECTURE_DESC__': '', '__PUBLISH_YEAR__': String(YEAR),
    '__RATE_TABLE__': '', '__STANDARD_NOTE__': '', '__TRUST_BADGE__': '',
  };
  for (const [k, v] of Object.entries(fill)) html = html.split(k).join(v);
  const inline = { '/js/core/kokuho.js': 'js/core/kokuho.js', '/js/engine.js': 'js/engine.js' };
  html = html.replace(/<script src="([^"?]+)\?v=x"><\/script>/g, (m, p) =>
    inline[p] ? '<script>' + fs.readFileSync(path.join(ROOT, inline[p]), 'utf8') + '</script>' : m);
  html = html.replace(/<script async src="https:\/\/www\.googletagmanager[^<]*<\/script>/g, '');
  return html;
}

function mkFetch() {
  return (url) => {
    if (url === `/data/municipalities/${SLUG}/kokuho-${YEAR}.json`) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(JSON.stringify(DATA))) });
    }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject(new Error('404')) });
  };
}

async function runPage(fillFn) {
  const errors = [];
  const dom = new JSDOM(buildHtml(), {
    runScripts: 'dangerously', url: 'https://kokuho-keisan.jp/chiba/ichihara/income.html',
    beforeParse(w) { w.fetch = mkFetch(); w.gtag = () => {}; w.addEventListener('error', e => errors.push(String(e.message))); },
  });
  const w = dom.window, d = w.document;
  await new Promise(r => setTimeout(r, 20));
  fillFn(d);
  await w.calc();
  const rows = {};
  d.querySelectorAll('#result .result-row').forEach(r => {
    const label = r.querySelector('.result-label')?.textContent.trim();
    const amt = r.querySelector('.amount')?.textContent || '';
    rows[label] = amt;
  });
  dom.window.close();
  return { rows, errors };
}

const yen = (s) => Number(String(s || '').replace(/[^\d]/g, '')) || 0;
let passed = 0, failed = 0;
function eq(label, actual, expected) {
  const ok = actual === expected;
  if (ok) passed++; else failed++;
  console.log(`  ${ok ? '✅' : '❌'} ${label}${ok ? '' : `  期待=${expected} 実際=${actual}`}`);
}
const set = (d, id, v) => { d.getElementById(id).value = String(v); };

(async () => {
  // ── 1. 1人ずつ入力（市原市の公式計算例・5人世帯） ──
  console.log('\n== 1人ずつ入力：市原市の公式計算例 ==');
  {
    const { rows, errors } = await runPage(d => {
      set(d, 'income', 9999999);          // members があれば使われないことも確かめる
      set(d, 'family', 5); set(d, 'preschool', 0); set(d, 'care', 1); set(d, 'salaryPensionCount', 4); set(d, 'under18', 1);
      [[900000, false], [700000, false], [2760000, true], [350000, false]].forEach(([inc, care], i) => {
        set(d, `memberIncome${i + 1}`, inc);
        d.getElementById(`memberCare${i + 1}`).checked = care;
      });
    });
    const exp = calculateKokuho({
      family: 5, preschool: 0, under18: 1, care: 1, salaryPensionCount: 4, fixedAssetTax: 0,
      members: [{ income: 900000 }, { income: 700000 }, { income: 2760000, careTarget: true }, { income: 350000 }],
    }, DATA);
    eq('JSエラーなし', errors.length, 0);
    eq('医療分 = エンジン直算（members）', yen(rows['医療分']), exp.medicalTotal);
    eq('介護分 = エンジン直算（members）', yen(rows['介護分']), exp.careTotal);
    eq('子ども分 = エンジン直算（members）', yen(rows['子ども・子育て支援金分']), exp.childcareTotal);
    eq('年間保険料 = エンジン直算（members）', yen(rows['年間保険料（概算）']), exp.total);
    // 市の公表値（区分ごと100円未満切捨て）: 医療376,000・支援154,500・介護77,000・子ども17,000
    eq('医療分が市の公表値と100円未満の差', Math.floor(yen(rows['医療分']) / 100) * 100, 376000);
    eq('介護分が市の公表値と100円未満の差', Math.floor(yen(rows['介護分']) / 100) * 100, 77000);
    eq('軽減判定', rows['軽減判定'], '軽減なし');
  }

  // ── 2. 1人ずつ欄が空なら従来の世帯合算 ──
  console.log('\n== 1人ずつ欄が空：従来どおり世帯合算 ==');
  {
    const { rows, errors } = await runPage(d => {
      set(d, 'income', 3000000); set(d, 'family', 2); set(d, 'care', 1); set(d, 'salaryPensionCount', 1);
    });
    const exp = calculateKokuho({ income: 3000000, family: 2, preschool: 0, under18: 0, care: 1, salaryPensionCount: 1, fixedAssetTax: 0 }, DATA);
    eq('JSエラーなし', errors.length, 0);
    eq('年間保険料 = 従来経路の直算', yen(rows['年間保険料（概算）']), exp.total);
  }

  // ── 3. チェック人数が介護保険人数より多ければ合わせる ──
  console.log('\n== 40〜64歳のチェックが介護保険人数より多い ==');
  {
    const { rows } = await runPage(d => {
      set(d, 'family', 2); set(d, 'care', 0); set(d, 'salaryPensionCount', 2);
      set(d, 'memberIncome1', 2000000); d.getElementById('memberCare1').checked = true;
      set(d, 'memberIncome2', 1500000); d.getElementById('memberCare2').checked = true;
    });
    const exp = calculateKokuho({
      family: 2, preschool: 0, under18: 0, care: 2, salaryPensionCount: 2, fixedAssetTax: 0,
      members: [{ income: 2000000, careTarget: true }, { income: 1500000, careTarget: true }],
    }, DATA);
    eq('介護分 = 介護2人で直算', yen(rows['介護分']), exp.careTotal);
  }

  console.log(`\n結果: PASS ${passed} / FAIL ${failed}`);
  if (failed > 0) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
