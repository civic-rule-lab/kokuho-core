/**
 * classify.js — 同型自治体分類モジュール
 *
 * 役割:
 *   - 全自治体の kokuho JSON を読み込み、署名でグループ化する
 *   - グループ内で「ベーステンプレート」（代表値）を決定する
 *   - 各自治体の「オーバーライド」（テンプレートとの差分）を計算する
 *
 * テンプレート決定アルゴリズム:
 *   - 数値フィールドはグループ内の「最頻値」をテンプレートとする
 *   - テンプレートと完全一致 → override なし
 *   - 数値が異なる → 差分のみを override として記録
 *
 * 使用例:
 *   import { classify } from './classify.js';
 *   const result = classify(municipalitiesArray);
 *   // result.groups[sig].template  → ベーステンプレート
 *   // result.groups[sig].members[slug].override → 差分（空なら完全一致）
 */

import { generateSignature } from "./signature.js";

/**
 * @param {Array<{slug, name, pref, data}>} municipalities
 *   - data: normalize() 済みの kokuho JSON
 * @returns {object} 分類結果
 */
export function classify(municipalities) {
  // ─ 1. 署名でグループ化 ─────────────────────────────────────
  const groups = {};

  for (const m of municipalities) {
    const sig = generateSignature(m.data);
    if (!groups[sig]) groups[sig] = { signature: sig, members: [] };
    groups[sig].members.push(m);
  }

  // ─ 2. 各グループのテンプレートと差分を計算 ────────────────
  const result = {};

  for (const [sig, group] of Object.entries(groups)) {
    const template = computeTemplate(group.members.map(m => m.data));
    const members  = {};

    for (const m of group.members) {
      const override = computeOverride(template, m.data);
      members[m.slug] = {
        name:     m.name,
        pref:     m.pref,
        override: override,                    // 空オブジェクトなら完全一致
        isExact:  Object.keys(override).length === 0,
      };
    }

    result[sig] = {
      signature:    sig,
      count:        group.members.length,
      exactCount:   Object.values(members).filter(m => m.isExact).length,
      template,
      members,
    };
  }

  return result;
}

// ─── テンプレート計算（グループ内の最頻値） ────────────────────

function computeTemplate(dataArray) {
  if (dataArray.length === 0) return {};

  // 数値フィールドのパスを列挙
  const numericPaths = [
    "rate.medical", "rate.support", "rate.care",
    "perCapita.medical", "perCapita.support", "perCapita.care",
    "household.medical", "household.support", "household.care",
    "caps.medical", "caps.support", "caps.care",
    "basicDeduction",
    "preschoolReduction.medicalPerCapitaRate",
    "preschoolReduction.supportPerCapitaRate",
    "reduction.standards.sevenTenths.base",
    "reduction.standards.sevenTenths.perPersonAdd",
    "reduction.standards.fiveTenths.base",
    "reduction.standards.fiveTenths.perPersonAdd",
    "reduction.standards.twoTenths.base",
    "reduction.standards.twoTenths.perPersonAdd",
    "reduction.salaryPensionAdd",
  ];

  // 代表値（最頻値）を計算
  const template = deepClone(dataArray[0]);
  // cityCode/citySlug/cityName はテンプレートから除去
  delete template.cityCode;
  delete template.citySlug;
  delete template.cityName;

  for (const path of numericPaths) {
    const values = dataArray.map(d => getPath(d, path)).filter(v => v != null);
    if (values.length === 0) continue;
    const modal = mode(values);
    setPath(template, path, modal);
  }

  // 資産割はグループ内で共通の場合のみテンプレートに含める
  const hasAsset = dataArray.every(d => !!d.assetLevy);
  if (!hasAsset) delete template.assetLevy;

  return template;
}

// ─── オーバーライド計算（テンプレートとの差分） ────────────────

function computeOverride(template, data) {
  const override = {};

  const numericPaths = [
    "rate.medical", "rate.support", "rate.care",
    "perCapita.medical", "perCapita.support", "perCapita.care",
    "household.medical", "household.support", "household.care",
    "caps.medical", "caps.support", "caps.care",
  ];

  for (const path of numericPaths) {
    const tval = getPath(template, path);
    const dval = getPath(data, path);
    if (tval != null && dval != null && tval !== dval) {
      setPath(override, path, dval);
    }
  }

  // 資産割の差分
  if (data.assetLevy) {
    const tAsset = template.assetLevy ?? {};
    for (const [k, v] of Object.entries(data.assetLevy)) {
      if (tAsset[k] !== v) {
        if (!override.assetLevy) override.assetLevy = {};
        override.assetLevy[k] = v;
      }
    }
  }

  return override;
}

// ─── ユーティリティ ────────────────────────────────────────────

/** ドット区切りパスで値を取得 */
function getPath(obj, path) {
  return path.split(".").reduce((o, k) => o?.[k], obj) ?? null;
}

/** ドット区切りパスで値をセット */
function setPath(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

/** 最頻値（複数同率の場合は最初のもの） */
function mode(arr) {
  const freq = {};
  for (const v of arr) freq[v] = (freq[v] || 0) + 1;
  return arr.reduce((best, v) => freq[v] > freq[best] ? v : best);
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
