// 検証ゲート①: 階層表の不変条件チェック（validate-hoiku-brackets）
// data/municipalities/{slug}/hoiku-2026.json を走査し、無ければフィクスチャを検証。
// 実行: node tests/validate-hoiku-brackets.js
//
// 検証する不変条件:
//   ・level 昇順
//   ・数値段の maxShotokuwari 昇順（到達可能性＝どの指数も必ず1段に収まる）
//   ・最上段は maxShotokuwari 無し（∞。指数の上限が塞がれていない）
//   ・standard ≥ short（短時間は標準以下）
//   ・国基準上限 104,000 円以下
//   ・criteria段（seikatsuhogo/hikazei/kintowari-only）は standard/short = 0
//   ・reduced.hitorioya ≤ standard（軽減額が本体を超えない）
//   ・byAge の各額も国基準上限以下
//   ・free自治体（freePolicy.firstChild）は brackets 不要
'use strict';

const fs = require('fs');
const path = require('path');
const { validateBrackets, timeKeysOf, NATIONAL_CAP } = require('../js/core/hoiku.js');
const fixtures = require('./fixtures.cjs');

// 追加チェック（hoiku.js の validateBrackets を土台に上乗せ）
function extendedValidate(muni) {
  const errs = [...validateBrackets(muni)];
  if (muni.status === 'free' || (muni.freePolicy && muni.freePolicy.firstChild)) return errs;
  const brackets = muni.brackets || [];
  const numeric = brackets.filter((b) => !b.criteria);
  const tkeys = timeKeysOf(muni); // 既定['standard','short']・timeBands宣言時はN区分

  // criteria段は0額のはず
  for (const b of brackets) {
    if (b.criteria && (b.standard !== 0 || b.short !== 0)) {
      errs.push(`criteria段(${b.criteria})が非0: level${b.level}`);
    }
  }
  // 最上段(数値)に maxShotokuwari が付いていると上限が塞がる＝到達不能域が出る
  if (numeric.length) {
    const last = numeric[numeric.length - 1];
    if (last.maxShotokuwari != null) {
      errs.push(`最上段 level${last.level} に maxShotokuwari(${last.maxShotokuwari})＝上限が塞がっている`);
    }
  }
  // 金額セット(時間区分キー・byAge・国上限)の共通チェック。
  // 国上限 ＋ 単調性(長い区分≥短い区分・隣接)を宣言した全 timeBand キーで検証。
  const capMono = (obj, label, lvl) => {
    for (const key of tkeys) {
      if (obj[key] != null && obj[key] > NATIONAL_CAP) errs.push(`${label}.${key}が国基準上限超: level${lvl}=${obj[key]}`);
    }
    for (let i = 0; i < tkeys.length - 1; i++) {
      const lo = obj[tkeys[i]];
      const sh = obj[tkeys[i + 1]];
      if (lo != null && sh != null && lo < sh) errs.push(`${label}: ${tkeys[i]}<${tkeys[i + 1]}: level${lvl}`);
    }
  };
  const chkSet = (s, label, lvl) => {
    if (!s) return;
    capMono(s, label, lvl);
    if (s.byAge) {
      for (const [k, v] of Object.entries(s.byAge)) {
        if (v && typeof v === 'object') capMono(v, `${label}.byAge.${k}`, lvl);
        else if (v > NATIONAL_CAP) errs.push(`${label}.byAge.${k}が国基準上限超: level${lvl}=${v}`);
      }
    }
  };
  // reduced.hitorioya は本体(standard)以下（数値の旧仕様のみ）
  for (const b of brackets) {
    if (b.reduced && typeof b.reduced.hitorioya === 'number' && b.standard != null && b.reduced.hitorioya > b.standard) {
      errs.push(`ひとり親軽減が本体超: level${b.level} (${b.reduced.hitorioya}>${b.standard})`);
    }
    // 施設タイプ別 金額セット(横浜型)
    if (b.facility) {
      for (const [ft, s] of Object.entries(b.facility)) {
        chkSet(s, `facility.${ft}`, b.level);
        if (s && s.child2) chkSet(s.child2, `facility.${ft}.child2`, b.level);
        if (s && s.hitorioya) { chkSet(s.hitorioya, `facility.${ft}.hitorioya`, b.level); chkSet(s.hitorioya.child2, `facility.${ft}.hitorioya.child2`, b.level); }
      }
    }
    // 第2子の明示実額・ひとり親の代替セット(＋その child2)
    chkSet(b.child2, 'child2', b.level);
    if (b.hitorioya) { chkSet(b.hitorioya, 'hitorioya', b.level); chkSet(b.hitorioya.child2, 'hitorioya.child2', b.level); }
    // bracket直下の byAge(時間区分別・大田型)
    if (b.byAge) {
      for (const [k, v] of Object.entries(b.byAge)) {
        if (v && typeof v === 'object') capMono(v, `byAge.${k}`, b.level);
        else if (v > NATIONAL_CAP) errs.push(`byAge.${k}が国基準上限超: level${b.level}=${v}`);
      }
    }
  }
  // muni.hitorioya(実行時率) の妥当性
  if (muni.hitorioya) {
    const f = muni.hitorioya.factor;
    if (!Number.isFinite(f) || f < 0 || f > 1) errs.push(`hitorioya.factor が範囲外(0〜1): ${f}`);
    if (muni.hitorioya.maxIndex != null && !(muni.hitorioya.maxIndex >= 0)) errs.push(`hitorioya.maxIndex が不正: ${muni.hitorioya.maxIndex}`);
  }
  return errs;
}

function loadDataFiles() {
  const dataDir = path.resolve(__dirname, '../data/municipalities');
  if (!fs.existsSync(dataDir)) return [];
  const out = [];
  for (const slug of fs.readdirSync(dataDir)) {
    const f = path.join(dataDir, slug, 'hoiku-2026.json');
    if (fs.existsSync(f)) {
      try { out.push({ name: slug, muni: JSON.parse(fs.readFileSync(f, 'utf8')) }); }
      catch (e) { out.push({ name: slug, parseError: e.message }); }
    }
  }
  return out;
}

function main() {
  let targets = loadDataFiles();
  const usingFixtures = targets.length === 0;
  if (usingFixtures) {
    console.log('（data/municipalities に hoiku-2026.json が無いためフィクスチャを検証）');
    targets = Object.entries(fixtures).map(([name, muni]) => ({ name, muni }));
  } else {
    console.log(`data/municipalities から ${targets.length} 件を検証`);
  }

  let bad = 0;
  for (const t of targets) {
    if (t.parseError) { console.log(`✗ ${t.name}: JSONパース失敗 ${t.parseError}`); bad++; continue; }
    const errs = extendedValidate(t.muni);
    if (errs.length) { console.log(`✗ ${t.name}:`); errs.forEach((e) => console.log(`    - ${e}`)); bad++; }
    else console.log(`  ✓ ${t.name}`);
    // free自治体の下地表(baseTable)も不変条件を検証（auto-scanはfreeをskipするため取りこぼしを防ぐ）
    if (t.muni && t.muni.baseTable && Array.isArray(t.muni.baseTable.brackets)) {
      const bt = { ...t.muni, status: 'verified', freePolicy: undefined,
        brackets: t.muni.baseTable.brackets,
        multiChild: t.muni.baseTable.multiChild, hitorioya: t.muni.baseTable.hitorioya };
      const be = extendedValidate(bt);
      if (be.length) { console.log(`✗ ${t.name}(baseTable):`); be.forEach((e) => console.log(`    - ${e}`)); bad++; }
      else console.log(`  ✓ ${t.name}(baseTable)`);
    }
  }

  console.log(`\n結果: ${targets.length - bad}/${targets.length} OK` + (usingFixtures ? '（フィクスチャ）' : ''));
  process.exit(bad ? 1 : 0);
}

main();
