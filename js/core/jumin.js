// 個人住民税 計算ロジック（純粋関数）
// 99%の自治体が同一税率のため、JUMIN_DEFAULTS からマージして使う。
// 差分のある自治体のみ data に値を持つ。
//
// Node: require('./js/core/jumin') で { calculateJumin, JUMIN_DEFAULTS } を取得
// Browser: <script> で読み込むとグローバル関数

'use strict';

const _isNode = typeof module !== 'undefined' && !!module.exports;

const _income = _isNode
  ? require('./shared/income.js')
  : { calcTaxableIncomeForKokuho, calcTaxableIncomeForJumin };

// ─── 全国標準値（差分管理のベース） ─────────────────────────────

// 令和6年度（2024年）改正:
//   東日本大震災復興特例（均等割 +1,000円）が令和5年度で終了。
//   代わりに国の森林環境税（1,000円）が令和6年度から課税開始。
//   均等割の合計は 5,000円 で変わらないが内訳が変わった。
//     旧: 都道府県 1,500円 + 市区町村 3,500円          = 5,000円
//     新: 都道府県 1,000円 + 市区町村 3,000円 + 国税 1,000円 = 5,000円

const JUMIN_DEFAULTS = {
  prefRate:            0.04,    // 都道府県民税 所得割
  cityRate:            0.06,    // 市区町村民税 所得割
  prefPerCapita:       1_000,   // 都道府県民税 均等割（令和6年度以降）
  cityPerCapita:       3_000,   // 市区町村民税 均等割（令和6年度以降）
  forestTax:           1_000,   // 森林環境税（国税・令和6年度〜、全国一律）
  basicDeductionJumin: 430_000,
};

// ─── 計算関数 ─────────────────────────────────────────────────

/**
 * 個人住民税を計算する。
 *
 * @param {Object|null} data    - jumin-{year}.json（差分のみ）。null なら標準値のみ使用。
 * @param {Object} inputs
 * @param {number} [inputs.salary=0]
 * @param {number} [inputs.pension=0]
 * @param {number} [inputs.age]
 * @param {number} [inputs.otherIncome=0]     - 事業・不動産所得等（所得換算済み）
 * @param {number} [inputs.socialInsurance=0] - 社会保険料控除（国保+介護等の実支払額）
 * @param {number} [inputs.spouseDeduction=0]
 * @param {number} [inputs.dependentDeduction=0]
 * @param {number} [inputs.disabilityDeduction=0]
 * @param {number} [inputs.singleParentDeduction=0]
 * @returns {Object}
 *   taxableIncome    - 課税所得（所得割の算定基礎）
 *   totalIncome      - 合計所得金額（介護保険段階判定に使用）
 *   incomeLevy       - 所得割
 *   perCapita        - 均等割（森林環境税を含む）
 *   total            - 年間住民税
 *   monthly          - 月額目安
 *   isTaxable        - 住民税課税者か（介護保険段階判定に使用）
 */
function calculateJumin(data, inputs) {
  const cfg = { ...JUMIN_DEFAULTS, ...(data || {}) };
  const {
    salary = 0, pension = 0, age,
    otherIncome = 0,
    socialInsurance = 0,
    spouseDeduction = 0,
    dependentDeduction = 0,
    disabilityDeduction = 0,
    singleParentDeduction = 0,
  } = inputs || {};

  // 合計所得金額（介護保険段階判定・基礎控除前）
  const totalIncome = _income.calcTaxableIncomeForKokuho({ salary, pension, age, otherIncome });

  // 住民税課税所得（所得控除後）
  const taxableIncome = _income.calcTaxableIncomeForJumin({
    salary, pension, age, otherIncome,
    socialInsurance, spouseDeduction, dependentDeduction,
    disabilityDeduction, singleParentDeduction,
    basicDeductionJumin: cfg.basicDeductionJumin,
  });

  // 所得割
  const incomeLevy = Math.floor(taxableIncome * (cfg.prefRate + cfg.cityRate));

  // 課税判定（Phase 1 簡易版: 課税所得 > 0 を課税の代理変数とする）
  // 正確には合計所得金額 ≤ 35万円（単身）→ 均等割非課税 だが、
  // 課税所得 = 0 の場合は合計所得 ≤ 43万円（基礎控除）なので非課税に落ちる。
  const isTaxable = taxableIncome > 0;

  // 均等割 + 森林環境税（課税者のみ）
  const perCapita = isTaxable
    ? cfg.prefPerCapita + cfg.cityPerCapita + cfg.forestTax
    : 0;

  const total   = incomeLevy + perCapita;
  const monthly = Math.round(total / 12);

  return { taxableIncome, totalIncome, incomeLevy, perCapita, total, monthly, isTaxable };
}

if (_isNode) module.exports = { calculateJumin, JUMIN_DEFAULTS };
