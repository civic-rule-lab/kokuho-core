// 複数制度 オーケストレーション層
// 世帯メンバーの構成から各制度を順序通りに計算し、世帯総負担を返す。
//
// 呼び出し順序（循環なし）:
//   Pass 1: kokuho  ─ 社保控除に依存しない
//   Pass 2: jumin   ─ 社保控除 = kokuho.total のみ算入（第1号介護料は算入しない）
//   Pass 3: kaigo   ─ jumin の課税フラグに依存（household が組み立てて渡す）
//
// mode: 'simple'   → 全制度を独立に計算（社会保険料控除を 0 として住民税を算出）
// mode: 'accurate' → kokuho → jumin → kaigo の順に1パス

'use strict';

const _isNode = typeof module !== 'undefined' && !!module.exports;

// ─── 依存解決 ─────────────────────────────────────────────────

const _calcKokuho = _isNode
  ? require('./kokuho.js').calculateKokuho
  : (() => calculateKokuho)();

const _income = _isNode
  ? require('./shared/income.js')
  : { calcTaxableIncomeForKokuho, calcTaxableIncomeForJumin, calcPensionIncome };

let _calcJumin = null;
let _calcKaigo = null;
if (_isNode) {
  try { _calcJumin = require('./jumin.js').calculateJumin; } catch (_) {}
  try { _calcKaigo = require('./kaigo.js').calculateKaigo; } catch (_) {}
}

// ─── メンバー単位のヘルパー ──────────────────────────────────────

function _memberIncome(m) {
  return _income.calcTaxableIncomeForKokuho({
    salary:      m.salary      || 0,
    pension:     m.pension     || 0,
    age:         m.age,
    otherIncome: m.otherIncome || 0,
  });
}

function _hasSalaryOrPension(m) {
  return (m.salary > 0) || (m.pension > 0);
}

// ─── 国保入力の組み立て ──────────────────────────────────────────

/**
 * household の members 配列から calculateKokuho の inputs を導出する。
 * 擬制世帯主がいる場合は世帯主の所得を reductionJudgmentIncome に加算する。
 */
function deriveKokuhoInputs(members, fixedAssetTax = 0) {
  const insured = members.filter(m => m.isKokuhoInsured);
  const head    = members.find(m => m.role === 'head');

  const income     = insured.reduce((sum, m) => sum + _memberIncome(m), 0);
  const headExtra  = (head && !head.isKokuhoInsured) ? _memberIncome(head) : 0;

  return {
    income,
    reductionJudgmentIncome: income + headExtra,
    family:             insured.length,
    preschool:          insured.filter(m => (m.age || 0) < 6).length,
    under18:            insured.filter(m => (m.age || 0) < 18).length,
    care:               insured.filter(m => (m.age || 0) >= 40 && (m.age || 0) < 65).length,
    salaryPensionCount: Math.max(members.filter(_hasSalaryOrPension).length, 1),
    fixedAssetTax:      fixedAssetTax || 0,
  };
}

// ─── 住民税入力の組み立て ─────────────────────────────────────────

/**
 * メンバー1人分の住民税入力を組み立てる。
 * 社会保険料控除（国保保険料）は納付義務者（世帯主）にのみ算入する。
 */
function _deriveJuminInputs(member, { socialInsurancePaid = 0 } = {}) {
  return {
    salary:      member.salary      || 0,
    pension:     member.pension     || 0,
    age:         member.age,
    otherIncome: member.otherIncome || 0,
    // 国保保険料は世帯主（納付義務者）が控除する
    socialInsurance:      member.role === 'head' ? socialInsurancePaid : 0,
    // Phase 1 未対応: 配偶者控除・扶養控除等は UI 側で個別入力が必要
    spouseDeduction:      0,
    dependentDeduction:   0,
    disabilityDeduction:  0,
    singleParentDeduction:0,
  };
}

// ─── 住民税の集計 ─────────────────────────────────────────────────

function _aggregateJumin(juminByMember) {
  if (!juminByMember || juminByMember.every(j => j === null)) return null;
  const total = juminByMember.reduce((s, j) => s + (j?.total || 0), 0);
  return { total, monthly: Math.round(total / 12), perMember: juminByMember };
}

// ─── 介護保険段階判定用コンテキストの組み立て ──────────────────────

/**
 * jumin 計算結果からメンバーごとの課税状況を集計する。
 * kaigo.js に渡す「段階判定コンテキスト」を household が責任を持って組み立てる。
 */
function _buildTaxStatus(juminByMember, members) {
  const byMember = {};
  members.forEach((m, i) => {
    const j = juminByMember[i];
    const totalIncome = j ? j.totalIncome : 0;     // 合計所得金額（年金所得を含む・第6段階以上用）
    const rawPension  = m.pension || 0;            // 課税年金収入額（控除前）
    const pensionShotoku = _income.calcPensionIncome(rawPension, m.age);
    // その他の合計所得金額 = 合計所得金額 − 公的年金等に係る所得（負なら0）
    const otherTotal  = Math.max(0, totalIncome - pensionShotoku);
    byMember[m.id] = {
      isSelfTaxable:  j ? j.isTaxable   : false,
      totalIncome,
      // kaigo 段階1〜3（年金のみ近似）の判定に使う年金受給額（控除前・収入額）
      pensionIncome:  rawPension,
      // kaigo 第1〜5段階の合算しきい値 = 課税年金収入額 ＋ その他の合計所得金額
      sumIncome:      rawPension + otherTotal,
    };
  });
  const isAllNonTaxable = Object.values(byMember).every(s => !s.isSelfTaxable);
  return { byMember, household: { isAllNonTaxable } };
}

function _buildKaigoMemberContext(member, taxStatus) {
  const ms = taxStatus.byMember[member.id] || {};
  return {
    pensionIncome:            ms.pensionIncome            ?? 0,
    totalIncome:              ms.totalIncome              ?? 0,
    sumIncome:                ms.sumIncome                ?? 0,
    isSelfTaxable:            ms.isSelfTaxable            ?? false,
    isHouseholdAllNonTaxable: taxStatus.household.isAllNonTaxable,
  };
}

// ─── メイン関数 ───────────────────────────────────────────────

/**
 * 複数制度を順序通りに計算し、世帯総負担を返す。
 *
 * @param {Object} municipalityData - { kokuho, kaigo, jumin } 各制度 JSON（null 可）
 * @param {Object} householdInput
 * @param {Object[]} householdInput.members
 *   members[].id                    - 識別子
 *   members[].role                  - 'head' | 'spouse' | 'child' | 'other'
 *   members[].age                   - 年齢
 *   members[].salary                - 給与収入（円）
 *   members[].pension               - 年金受給額（円）
 *   members[].otherIncome           - 事業・不動産所得等（所得換算済み）
 *   members[].isKokuhoInsured       - 国保加入者か
 *   members[].isOnSocialInsurance   - 職場社保加入か（擬制世帯主の識別に使う）
 * @param {number} [householdInput.fixedAssetTax]
 * @param {number} [householdInput.year]
 * @param {Object} [options]
 * @param {string} [options.mode='simple'] - 'simple' | 'accurate'
 */
function calculateHousehold(municipalityData, householdInput, options = {}) {
  const { members = [], fixedAssetTax = 0, year = 2026 } = householdInput;
  const { mode = 'simple' } = options;
  const mData = municipalityData || {};

  // ── Pass 1: 国保（第2号介護分を内包・社保控除に依存しない） ──────
  const kokuhoInputs = deriveKokuhoInputs(members, fixedAssetTax);
  const kokuho = (mData.kokuho && _calcKokuho)
    ? _calcKokuho(kokuhoInputs, mData.kokuho)
    : null;

  // ── Pass 2: 住民税（メンバーごと）─────────────────────────────
  // accurate: 社保控除 = kokuho.total（第2号は kokuho.careTotal として内包済み）
  // 第1号介護料は当年計算のため算入しない（住民税は前年実支払額が建前）
  const socialInsurancePaid = (mode === 'accurate') ? (kokuho?.total || 0) : 0;

  const juminByMember = (_calcJumin && members.length > 0)
    ? members.map(m => _calcJumin(mData.jumin || null, _deriveJuminInputs(m, { socialInsurancePaid })))
    : members.map(() => null);

  const jumin = _aggregateJumin(juminByMember);

  // ── Pass 3: 介護保険第1号（jumin 課税フラグに依存）─────────────
  const taxStatus = _buildTaxStatus(juminByMember, members);

  const kaigo = (_calcKaigo && mData.kaigo)
    ? members
        .filter(m => (m.age || 0) >= 65)
        .map(m => ({
          memberId: m.id,
          ..._calcKaigo(mData.kaigo, _buildKaigoMemberContext(m, taxStatus)),
        }))
    : [];

  // ── 集計 ───────────────────────────────────────────────────
  const kaigoFirstTotal = kaigo.reduce((s, k) => s + (k.annual || 0), 0);

  const careInsuranceCombined = {
    secondCategory: kokuho?.careTotal   || 0,  // 第2号（国保内）
    firstCategory:  kaigoFirstTotal,            // 第1号（独立）
    total:         (kokuho?.careTotal || 0) + kaigoFirstTotal,
  };

  const totalBurden =
    (kokuho?.total || 0) +
    (jumin?.total  || 0) +
    kaigoFirstTotal;

  return {
    mode,
    year,
    kokuho,
    jumin,
    kaigo,
    careInsuranceCombined,
    totalBurden,
    monthly: Math.round(totalBurden / 12),
    availableSystems: [
      kokuho          && 'kokuho',
      jumin           && 'jumin',
      kaigo.length > 0 && 'kaigo',
    ].filter(Boolean),
    _debug: { kokuhoInputs, socialInsurancePaid, taxStatus },
  };
}

if (_isNode) module.exports = { calculateHousehold, deriveKokuhoInputs };
