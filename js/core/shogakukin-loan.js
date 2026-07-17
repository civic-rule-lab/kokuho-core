// 貸与型奨学金（第一種・第二種・入学時特別増額・返還シミュレーション）コア — Fable5設計版
// 給付コア（shogakukin.js）は無改変。本モジュールは spec.loan のみを参照する自己完結エンジン。
// 一次資料: 2026-07-12 調査（設計 claude/貸与型設計_2026-07-12.md §1）。
//
// 主要な制度事実（[確認済 2026-07-16 再確認]）:
//   L1 貸与額算定基準額 = 課税標準×6% − 市町村民税調整控除額（政令市×3/4）− 多子控除 − ひとり親控除 − 私立自宅外控除。
//      給付式と違い「調整額（税額調整額）」は引かない[§7-1確認済]。100円未満切捨て。所得割非課税者は0円。
//   L2 基準額は「生計維持者」で算出（本人=isStudent は合算しない）[§7-2確認済]。
//   L3 判定閾値: 第一種189,400 / 第二種381,500 / 併用164,600（大学・短大・専修専門課程）。最高月額は併用基準以下で選択可。
//   L4 返還・定額方式: 基礎額表→年数=floor(総額/基礎額)→月額=floor(総額/回数)、端数は最終回。
//   L5 所得連動（第一種のみ）: floor((課税総所得−子1人33万)×9%/12)、下限2,000円、初年度は定額の半分。
//   L6 第二種は元利均等＋据置期間利息/回数の上乗せ（概算）。据置日数は spec.loan.repayment.interest.graceDaysApprox。
//      JASSO公式返還例(大学)全20点で較正: graceDaysApprox=179 で返還月額が全ケース±1円以内[確認済 2026-07-16 kappu/sample/daigaku.html]。
//      最終端数規則は非公開のため _approx を継続。
'use strict';
const _isNodeL = typeof module !== 'undefined' && !!module.exports;
// _adjustmentCreditBase は jumin の実装を共用（core と同じ一本化方針）。browser bundle では前方の定義を使う。
const _adjBaseL = _isNodeL ? require('./jumin.js')._adjustmentCreditBase : _adjustmentCreditBase;

// ─── 生計維持者1人分の貸与基準額成分（合算前・切捨て前・世帯控除前） ───────
//   課税標準×6% − 調整控除（政令市は実額×3/4、標準は humanDeductionDiff から3%合成）。調整額は引かない[L1]。
function _loanSupporterComponent(s, cfg) {
  if (s.shotokuwariTaxable === false) return 0;                 // 所得割非課税 → 0円
  const taxable = Math.max(0, Math.floor(s.taxableIncome || 0));
  if (taxable <= 0) return 0;
  const cityGross = Math.floor(taxable * cfg.rate);             // ×6%
  let cityAdjust;
  if (Number.isFinite(s.cityAdjustActual)) {
    const factor = s.designatedCity ? cfg.designatedCityFactor : 1;
    cityAdjust = Math.floor(Math.max(0, s.cityAdjustActual) * factor);
  } else {
    const adjBase = _adjBaseL(taxable, s.humanDeductionDiff ?? 50000, s.totalIncome ?? taxable);
    cityAdjust = Math.floor(adjBase * cfg.cityAdjustRate);      // 標準3%合成
  }
  return cityGross - cityAdjust;                                // ★調整額は引かない[L1]
}

// ─── 貸与額算定基準額（世帯合算・世帯控除適用・100円未満切捨て） ─────────────
function calcLoanKijungaku(spec, inputs) {
  const L = spec.loan, f = L.kijunFormula;
  const supporters = (Array.isArray(inputs.supporters) ? inputs.supporters : [])
    .filter(s => !s.isStudent);                                 // 本人は合算しない[L2]
  let raw = 0;
  for (const s of supporters) raw += _loanSupporterComponent(s, f);
  const base100 = Math.floor(Math.max(0, raw) / 100) * 100;

  const student = inputs.student || {};
  const children = Math.max(0, inputs.childrenCount || 0);
  const d = f.deductions;
  let ded = d.tashiPerChild * Math.max(0, children - d.tashiFreeChildren); // 多子控除（2人超分×4万）
  if (inputs.singleParent === 'mother' || inputs.singleParent === 'father') ded += d.singleParent; // ひとり親4万
  const isPrivateAway = (student.schoolType === '私立') && (student.attendance === '自宅外');
  if (isPrivateAway && inputs.applicationType !== 'yoyaku') ded += d.privateAway; // 私立自宅外2.2万（予約時は0）
  // 世帯控除も100の倍数のため切捨て順は無害（設計§2-1）。
  return Math.max(0, base100 - ded);
}

// ─── 第一種の月額表を引く（level→設置者→通学） ───────────────────────────
function _type1Cell(spec, student) {
  const tbl = spec.loan.type1Monthly;
  let level = student.level || '大学';
  if (level === '高等専門学校' && (student.kosenGrade === '1-3' || student.kosenLower === true)) level = '高専1-3年';
  const lv = tbl[level] || tbl['大学'];
  const setti = student.schoolType === '私立' ? '私立' : '国公立';
  const att = student.attendance === '自宅外' ? '自宅外' : '自宅';
  return (lv[setti] && lv[setti][att]) || null;
}

// 第一種の選択可能な月額（自宅外は自宅の選択肢も選べる[確認済]）。最高月額は maxAllowed のときのみ。
function _type1Options(spec, student, maxAllowed) {
  const cell = _type1Cell(spec, student);
  if (!cell) return [];
  const opts = new Set(cell.others || []);
  if (maxAllowed) opts.add(cell.max);
  // 自宅外通学者は自宅側の選択肢も選べる。
  if ((student.attendance === '自宅外')) {
    const home = _type1Cell(spec, Object.assign({}, student, { attendance: '自宅' }));
    if (home) { (home.others || []).forEach(v => opts.add(v)); if (maxAllowed) opts.add(home.max); }
  }
  return Array.from(opts).sort((a, b) => a - b);
}

// 第二種の選択肢（2〜12万・1万刻み）＋増額（医歯薬獣医・私立大学）。
function _type2Options(spec, student) {
  const t = spec.loan.type2Monthly;
  if (student.level === '高等専門学校' && (student.kosenGrade === '1-3' || student.kosenLower === true) && !t.kosen13Eligible) {
    return { monthly: [], zougaku: [] };                       // 高専1-3年は第二種対象外
  }
  const monthly = [];
  for (let v = t.min; v <= t.max; v += t.step) monthly.push(v);
  const zougaku = [];
  if (student.level === '大学' && student.schoolType === '私立') {
    const c = student.course; // '医' '歯' '薬' '獣医' など
    if (c === '医' || c === '歯') zougaku.push({ label: '医・歯学課程', add: t.zougaku['医歯_私立大学'].add, requiresBase: t.zougaku['医歯_私立大学'].requiresBase });
    else if (c === '薬' || c === '獣医') zougaku.push({ label: '薬・獣医学課程', add: t.zougaku['薬獣医_私立大学'].add, requiresBase: t.zougaku['薬獣医_私立大学'].requiresBase });
  }
  return { monthly, zougaku };
}

// ─── 給付併用時の第一種上限（併給調整） ─────────────────────────────────
//   戻り値: null=調整なし（通常選択肢）/ {amounts:[...], special:[...]} / 0のときは amounts:[0]。
function _heikyuCell(spec, student, grantResult) {
  const H = spec.loan.heikyuChosei;
  const level = student.level || '大学';
  // JSONに level キーがあり値が null ＝「表は存在するが未転記」→ 大学表を黙って流用せず未対応と返す（§7-4）。
  const table = (H[level] !== undefined) ? H[level] : H['大学'];
  if (table === null) return { unsupported: true };
  if (!table || !grantResult) return null;
  const setti = student.schoolType === '私立' ? '私立' : '国公立';
  const att = student.attendance === '自宅外' ? '自宅外' : '自宅';
  const key = setti + att;                                      // 例 '私立自宅外'
  const isTashi = !!grantResult.isTashiSetai;
  const kubun = grantResult.kubunCode;                          // '1'..'4' or null
  const isRiko = !!grantResult.isRiko;
  const tashiOver = isTashi && !kubun;                          // 区分外多子

  if (isTashi) {
    const t = table.tashiKakudai;
    if (!t) return null;
    // 区分内多子は区分別セル（大学=全0だが短大/専門/高専は0でないセルがある[確認済 2019ikou 2026-07-17]）
    if (kubun) return _wrapCell(t.kubun && t.kubun[kubun] && t.kubun[kubun][key]);
    if (tashiOver) return _wrapCell(t.over && t.over[key]);     // 区分外多子
    return null;
  }
  const n = table.normal;
  if (!kubun) return null;                                      // 給付なし → 調整対象外
  if (kubun === '4') {
    if (isRiko) return _wrapCell(n['4riko'] && n['4riko'][key]);
    return _wrapCell(n['4tashi'] && n['4tashi'][key]);          // 非多子・非理工農はそもそも区分4対象外だが安全側
  }
  return _wrapCell(n[kubun] && n[kubun][key]);
}
function _wrapCell(cell) {
  if (cell === null || cell === undefined) return null;         // 調整なし
  if (cell === '調整なし') return null;
  if (typeof cell === 'number') return { amounts: [cell], special: null };
  if (Array.isArray(cell)) return { amounts: cell, special: null };
  return { amounts: cell.amounts || [], special: cell.special || null }; // {amounts,special}
}

// ─── 判定メイン ───────────────────────────────────────────────────────
/**
 * @param spec  shogakukin-2026.json
 * @param inputs {
 *   supporters, student:{level,schoolType,attendance,course?,kosenGrade?},
 *   childrenCount, singleParent, applicationType?('zaigaku'|'yoyaku'),
 *   grantResult?  // calcShogakukin の戻り値（併給調整用）。null=給付を受けない
 * }
 */
function calcLoanEligibility(spec, inputs) {
  const L = spec.loan;
  const student = inputs.student || {};
  const key = 'univ_college_senmon'; // 閾値は大学等共通（高専1-3年は[未確認]→大学等で近似）
  const th = L.thresholds[key];
  const kijun = calcLoanKijungaku(spec, inputs);

  const type2Elig = kijun <= th.type2;
  const type1Elig = kijun <= th.type1;
  const heiyoElig = kijun <= th.heiyo;
  const maxAllowed = heiyoElig;                                 // 最高月額は併用基準以下で可[L3]

  const t2 = _type2Options(spec, student);
  const grantResult = inputs.grantResult || null;
  const heikyu = grantResult ? _heikyuCell(spec, student, grantResult) : null;

  const notes = [];
  if (kijun === 0) notes.push('kijun0_gakuryoku'); // 学力基準の特例対象（基準額0円）
  if (grantResult && (grantResult.kubunCode || grantResult.isTashiSetai)) notes.push('grant_heikyu');

  return {
    loanKijungaku: kijun,
    thresholds: { type1: th.type1, type2: th.type2, heiyo: th.heiyo },
    type1: {
      eligible: type1Elig,
      maxMonthlyAllowed: maxAllowed,
      monthlyOptions: type1Elig ? _type1Options(spec, student, maxAllowed) : [],
      heikyuCap: heikyu,                                        // 給付併用時の上限（null=調整なし）
    },
    type2: {
      eligible: type2Elig,
      monthlyOptions: type2Elig ? t2.monthly : [],
      zougakuOptions: type2Elig ? t2.zougaku : [],
    },
    heiyo: { eligible: heiyoElig },
    nyugakuZougaku: {
      amounts: L.nyugakuZougaku.amounts.slice(),
      direct: kijun <= L.nyugakuZougaku.directKijunLe,          // 基準額75,000以下は公庫手続き不要
      needsKoko: kijun > L.nyugakuZougaku.directKijunLe,
    },
    notes,
  };
}

// ─── 返還: 割賦金の基礎額 ─────────────────────────────────────────────
function _kisogaku(spec, total) {
  const t = Math.max(0, Math.floor(total));
  for (const row of spec.loan.repayment.kisogakuTable) {
    if (row.le != null && t <= row.le) return row.base;
    if (row.over != null && t > row.over) return Math.floor(t / row.divisor);
  }
  return Math.floor(t / 20);
}

// 定額返還方式（第一種・第二種の回数決定にも使用）。月賦。
function simulateTeigaku(spec, total) {
  const t = Math.max(0, Math.floor(total));
  if (t <= 0) return { years: 0, n: 0, monthly: 0, lastMonthly: 0, totalPaid: 0 };
  const base = _kisogaku(spec, t);
  const years = Math.floor(t / base);                          // 小数点以下切捨て
  const n = years * 12;
  const monthly = Math.floor(t / n);                           // 1円未満切捨て
  const lastMonthly = t - monthly * (n - 1);                   // 端数は最終回
  return { years, n, monthly, lastMonthly, totalPaid: t };
}

// 月賦・半年賦併用（総額を半分ずつ）。
function simulateHeiyoHenkan(spec, total) {
  const t = Math.max(0, Math.floor(total));
  const base = _kisogaku(spec, t);
  const years = Math.floor(t / base);
  const half = Math.floor(t / 2);
  const monthlyN = years * 12, halfN = years * 2;
  const monthly = Math.floor(half / monthlyN);
  const hanki = Math.floor((t - half) / halfN);
  return { years, monthlyN, halfN, monthly, hanki };
}

// 所得連動返還方式（第一種のみ）。課税総所得金額と本人の子ども数から算出。
function simulateShotokuRendo(spec, taxableTotal, childCount, teigakuMonthly) {
  const sr = spec.loan.repayment.shotokuRendo;
  const tt = Math.max(0, Math.floor(taxableTotal || 0));
  const base = Math.max(0, tt - sr.childDeduction * Math.max(0, childCount || 0));
  let monthly = Math.floor(base * sr.rate / 12);
  if (monthly < sr.minMonthly) monthly = sr.minMonthly;
  const firstYearMonthly = sr.firstYearHalfOfTeigaku && teigakuMonthly
    ? Math.floor(teigakuMonthly / 2) : null;
  return { monthly, firstYearMonthly, minApplied: monthly === sr.minMonthly };
}

// 第二種（元利均等＋据置期間利息/回数）。概算（_approx）。annualRate は小数（例 0.02922）。
//   opts.graceDays: 据置日数（既定は貸与終了3月→初回返還10月27日 ≈ 210日相当を呼び出し側指定可）。
function simulateType2(spec, total, annualRate, opts) {
  const o = opts || {};
  const t = Math.max(0, Math.floor(total));
  if (t <= 0) return { monthly: 0, n: 0, years: 0, totalPaid: 0, interest: 0, _approx: true };
  const base = _kisogaku(spec, t);
  const years = Math.floor(t / base);
  const n = years * 12;
  const rate = Math.min(annualRate || 0, spec.loan.repayment.interest.cap);
  const r = rate / 12;
  let pmt;
  if (r <= 0) pmt = t / n;
  else pmt = t * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const graceDays = Number.isFinite(o.graceDays) ? o.graceDays
    : (Number.isFinite(spec.loan.repayment.interest.graceDaysApprox) ? spec.loan.repayment.interest.graceDaysApprox : 180); // JASSO公式20点較正=179日[§6-3]
  const graceInterest = Math.round(t * rate * graceDays / 365);
  const monthly = Math.floor(pmt + graceInterest / n);
  // 総返還額は概算表示のため monthly×n を採用（最終回の端数調整は表示上省略）。
  const totalApprox = monthly * n;
  return {
    monthly, n, years, rate,
    totalPaid: totalApprox,
    interest: Math.max(0, totalApprox - t),
    _approx: true,
  };
}

if (_isNodeL) module.exports = {
  calcLoanEligibility, calcLoanKijungaku,
  simulateTeigaku, simulateHeiyoHenkan, simulateShotokuRendo, simulateType2,
  _kisogaku,
};
else if (typeof window !== 'undefined') window.ShogakukinLoan = {
  calcLoanEligibility, calcLoanKijungaku,
  simulateTeigaku, simulateHeiyoHenkan, simulateShotokuRendo, simulateType2,
};
