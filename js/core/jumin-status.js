/**
 * 住民税・各制度データのステータス判定
 *
 * fiscalYear ベースで verified / needs_update / inferred を返す。
 * 4月1日を年度切り替え日とする（日本の会計年度に準拠）。
 */

/**
 * 指定日時点の会計年度を返す
 * @param {Date} [date]
 * @returns {number} 会計年度（例: 2026年4月〜2027年3月 → 2026）
 */
function getFiscalYear(date = new Date()) {
  const year  = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 4 ? year : year - 1;
}

/**
 * データスペックからステータスを判定する
 * @param {object|null} spec - { status, fiscalYear, ... } または null
 * @param {Date} [currentDate]
 * @returns {'verified'|'needs_update'|'inferred'}
 */
function getDataStatus(spec, currentDate = new Date()) {
  if (!spec) return 'inferred';
  if (spec.status === 'inferred') return 'inferred';

  const currentFY = getFiscalYear(currentDate);

  if (typeof spec.fiscalYear === 'number' && spec.fiscalYear < currentFY) {
    return 'needs_update';
  }

  return spec.status === 'verified' ? 'verified' : 'inferred';
}

// Node.js 環境向け（generate スクリプトから require で使う場合）
if (typeof module !== 'undefined') {
  module.exports = { getFiscalYear, getDataStatus };
}
