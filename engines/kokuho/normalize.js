/**
 * normalize.js — kokuho JSON 正規化モジュール
 *
 * 役割:
 *   - 入力データを標準 kokuho JSON スキーマに変換・補完する
 *   - 数値の表記揺れを統一（"7.3%" → 0.073 など）
 *   - 欠損フィールドにデフォルト値を補完
 *   - バリデーションエラーは例外で通知
 *
 * 使用例:
 *   import { normalize } from './normalize.js';
 *   const clean = normalize(rawData);
 */

// ─── スキーマ定義（デフォルト値） ──────────────────────────────

const DEFAULTS = {
  fiscalYear: 2025,
  system: "kokuho",
  basicDeduction: 430000,
  household: { medical: 0, support: 0, care: 0 },
  preschoolReduction: {
    enabled: true,
    medicalPerCapitaRate: 0.5,
    supportPerCapitaRate: 0.5,
  },
  reduction: {
    enabled: true,
    standards: {
      sevenTenths: { base: 430000, perPersonAdd: 0 },
      fiveTenths:  { base: 430000, perPersonAdd: 305000 },
      twoTenths:   { base: 430000, perPersonAdd: 560000 },
    },
    salaryPensionAdd: 100000,
    ratios: { sevenTenths: 0.7, fiveTenths: 0.5, twoTenths: 0.2 },
  },
};

// ─── 数値正規化ヘルパー ─────────────────────────────────────────

/**
 * パーセント文字列または小数を所得割率（0〜1）に変換する。
 *   "7.71%"  → 0.0771
 *   "7.71"   → 0.0771  (1以上ならパーセントとみなす)
 *   0.0771   → 0.0771  (そのまま)
 */
export function toRate(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    const s = value.replace(/[％%\s]/g, "");
    const n = Number(s);
    if (isNaN(n)) return null;
    return n >= 1 ? n / 100 : n;
  }
  if (typeof value === "number") {
    return value >= 1 ? value / 100 : value;
  }
  return null;
}

/**
 * 金額文字列または数値を整数（円）に変換する。
 *   "47,300円" → 47300
 *   47300      → 47300
 */
export function toYen(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    const n = Number(value.replace(/[,，円\s]/g, ""));
    return isNaN(n) ? null : Math.round(n);
  }
  if (typeof value === "number") return Math.round(value);
  return null;
}

// ─── メイン normalize 関数 ──────────────────────────────────────

/**
 * @param {object} raw  - 生データ（未正規化の kokuho JSON または表形式データ）
 * @returns {object}    - 正規化済み kokuho JSON
 * @throws  {Error}     - 必須フィールドが欠損・不正な場合
 */
export function normalize(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("入力データがオブジェクトではありません");
  }

  const out = {};

  // ─ 識別情報 ─────────────────────────────────────────────────
  out.cityCode  = String(raw.cityCode  ?? "").trim() || fail("cityCode が未設定");
  out.citySlug  = String(raw.citySlug  ?? "").trim() || fail("citySlug が未設定");
  out.cityName  = String(raw.cityName  ?? "").trim() || fail("cityName が未設定");
  out.fiscalYear = Number(raw.fiscalYear ?? DEFAULTS.fiscalYear);
  out.system    = String(raw.system ?? DEFAULTS.system);
  out.basicDeduction = toYen(raw.basicDeduction) ?? DEFAULTS.basicDeduction;

  // ─ 所得割率 ──────────────────────────────────────────────────
  const rate = raw.rate ?? {};
  out.rate = {
    medical: coerceRate(rate.medical, "rate.medical"),
    support: coerceRate(rate.support, "rate.support"),
    care:    coerceRate(rate.care,    "rate.care"),
  };

  // ─ 均等割 ────────────────────────────────────────────────────
  const perCapita = raw.perCapita ?? {};
  out.perCapita = {
    medical: coerceYen(perCapita.medical, "perCapita.medical"),
    support: coerceYen(perCapita.support, "perCapita.support"),
    care:    coerceYen(perCapita.care,    "perCapita.care"),
  };

  // ─ 平等割（省略可→0） ─────────────────────────────────────────
  const household = raw.household ?? {};
  out.household = {
    medical: toYen(household.medical) ?? DEFAULTS.household.medical,
    support: toYen(household.support) ?? DEFAULTS.household.support,
    care:    toYen(household.care)    ?? DEFAULTS.household.care,
  };

  // ─ 賦課限度額 ─────────────────────────────────────────────────
  const caps = raw.caps ?? {};
  out.caps = {
    medical: coerceYen(caps.medical, "caps.medical"),
    support: coerceYen(caps.support, "caps.support"),
    care:    coerceYen(caps.care,    "caps.care"),
  };

  // ─ 資産割（省略可） ────────────────────────────────────────────
  if (raw.assetLevy) {
    const al = raw.assetLevy;
    out.assetLevy = {};
    if (al.medical != null) out.assetLevy.medical = coerceRate(al.medical, "assetLevy.medical");
    if (al.support != null) out.assetLevy.support = coerceRate(al.support, "assetLevy.support");
    if (al.care    != null) out.assetLevy.care    = coerceRate(al.care,    "assetLevy.care");
  }

  // ─ 未就学児軽減 ───────────────────────────────────────────────
  const pr = raw.preschoolReduction ?? {};
  out.preschoolReduction = {
    enabled:               pr.enabled               ?? DEFAULTS.preschoolReduction.enabled,
    medicalPerCapitaRate:  pr.medicalPerCapitaRate   ?? DEFAULTS.preschoolReduction.medicalPerCapitaRate,
    supportPerCapitaRate:  pr.supportPerCapitaRate   ?? DEFAULTS.preschoolReduction.supportPerCapitaRate,
  };

  // ─ 法定軽減 ───────────────────────────────────────────────────
  const red   = raw.reduction    ?? {};
  const stds  = red.standards    ?? {};
  const seven = stds.sevenTenths ?? {};
  const five  = stds.fiveTenths  ?? {};
  const two   = stds.twoTenths   ?? {};
  const ratios = red.ratios      ?? {};

  out.reduction = {
    enabled: red.enabled ?? DEFAULTS.reduction.enabled,
    standards: {
      sevenTenths: {
        base:         toYen(seven.base)         ?? DEFAULTS.reduction.standards.sevenTenths.base,
        perPersonAdd: toYen(seven.perPersonAdd) ?? DEFAULTS.reduction.standards.sevenTenths.perPersonAdd,
      },
      fiveTenths: {
        base:         toYen(five.base)          ?? DEFAULTS.reduction.standards.fiveTenths.base,
        perPersonAdd: toYen(five.perPersonAdd)  ?? DEFAULTS.reduction.standards.fiveTenths.perPersonAdd,
      },
      twoTenths: {
        base:         toYen(two.base)           ?? DEFAULTS.reduction.standards.twoTenths.base,
        perPersonAdd: toYen(two.perPersonAdd)   ?? DEFAULTS.reduction.standards.twoTenths.perPersonAdd,
      },
    },
    salaryPensionAdd: toYen(red.salaryPensionAdd) ?? DEFAULTS.reduction.salaryPensionAdd,
    ratios: {
      sevenTenths: ratios.sevenTenths ?? DEFAULTS.reduction.ratios.sevenTenths,
      fiveTenths:  ratios.fiveTenths  ?? DEFAULTS.reduction.ratios.fiveTenths,
      twoTenths:   ratios.twoTenths   ?? DEFAULTS.reduction.ratios.twoTenths,
    },
  };

  return out;
}

// ─── ユーティリティ ────────────────────────────────────────────

function fail(msg) { throw new Error(`normalize: ${msg}`); }

function coerceRate(v, field) {
  const r = toRate(v);
  if (r === null) throw new Error(`normalize: ${field} が不正 (${JSON.stringify(v)})`);
  return r;
}

function coerceYen(v, field) {
  const y = toYen(v);
  if (y === null) throw new Error(`normalize: ${field} が不正 (${JSON.stringify(v)})`);
  return y;
}
