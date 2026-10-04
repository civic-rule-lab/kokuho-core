/**
 * js/core/household.js 統合テスト
 * 実行: node scripts/test-household.js
 */
// 2026-10-04: package.json "type":"module" 環境で require が使えず、起動時に ReferenceError で
// 止まっていた（CI 外のため気づかれていなかった）。test-kaigo-wiring.js と同じく
// createRequire + scripts/lib/core-loader.cjs で js/core を読む形に直した。
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { load } = require("./lib/core-loader.cjs");
const { calculateHousehold, deriveKokuhoInputs } = load("household.js");
const { calculateKokuho } = load("kokuho.js");
const { calculateJumin }  = load("jumin.js");
const { calculateKaigo }  = load("kaigo.js");

const saitamaKokuho = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/municipalities/saitama/kokuho-2025.json'), 'utf-8')
);

// テスト用 kaigo データ（インライン）
const TEST_KAIGO = {
  baseAmount: 80_000,
  brackets: [
    { level: '1', label: '第1段階', rate: 0.285,
      criteria: { householdAllNonTaxable: true, pensionIncomeMax: 800_000 } },
    { level: '3', label: '第3段階', rate: 0.685,
      criteria: { householdAllNonTaxable: true, pensionIncomeMin: 800_001 } },
    { level: '4', label: '第4段階', rate: 0.90,
      criteria: { selfTaxable: false, householdAllNonTaxable: false } },
    { level: '5', label: '第5段階（基準）', rate: 1.00,
      criteria: { selfTaxable: true, totalIncomeMax: 1_199_999 } },
    { level: '9', label: '第9段階', rate: 2.00,
      criteria: { selfTaxable: true, totalIncomeMin: 1_200_000 } },
  ],
  fallbackLevel: '5',
};

let passed = 0;
let failed = 0;

function ok(label, cond, detail = '') {
  if (cond) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.log(`  ❌ ${label}${detail ? '\n     ' + detail : ''}`); }
}
function eq(label, actual, expected) {
  ok(label, actual === expected, `期待=${JSON.stringify(expected)} 実際=${JSON.stringify(actual)}`);
}

// ═══════════════════════════════════════════════════════════
// 1. deriveKokuhoInputs（変更なし・回帰）
// ═══════════════════════════════════════════════════════════
console.log('\n== deriveKokuhoInputs ==');

{
  const members = [
    { id: 'a', role: 'head', age: 35, salary: 2_000_000,
      isKokuhoInsured: true, isOnSocialInsurance: false },
  ];
  const inputs = deriveKokuhoInputs(members);
  eq('単身: income = 1,320,000',          inputs.income,                  1_320_000);
  eq('単身: reductionJudgmentIncome = income', inputs.reductionJudgmentIncome, 1_320_000);
  eq('単身: family = 1',                  inputs.family,                  1);
  eq('単身: salaryPensionCount = 1',      inputs.salaryPensionCount,      1);
}

{
  const members = [
    { id: 'h', role: 'head',   age: 45, salary: 6_000_000,
      isKokuhoInsured: false, isOnSocialInsurance: true },
    { id: 's', role: 'spouse', age: 42, salary: 0,
      isKokuhoInsured: true, isOnSocialInsurance: false },
  ];
  const inputs = deriveKokuhoInputs(members);
  eq('擬制世帯主: income = 0',                        inputs.income,                  0);
  eq('擬制世帯主: reductionJudgmentIncome = 4,360,000', inputs.reductionJudgmentIncome, 4_360_000);
}

// 共働き（2026-10-04・TASKS X170-12）: 基礎控除は1人ずつ引く。
// 各 給与250万円（所得 1,670,000円）・45歳と38歳 → 所得割の基礎額は 1,240,000 × 2 = 2,480,000円。
// 介護分は45歳の1人の基礎額 1,240,000円 だけに掛かる。
{
  const members = [
    { id: 'h', role: 'head',   age: 45, salary: 2_500_000, isKokuhoInsured: true, isOnSocialInsurance: false },
    { id: 's', role: 'spouse', age: 38, salary: 2_500_000, isKokuhoInsured: true, isOnSocialInsurance: false },
  ];
  const inputs = deriveKokuhoInputs(members);
  eq('共働き: members が2人分',              inputs.members.length, 2);
  eq('共働き: 1人目の所得 = 1,670,000',      inputs.members[0].income, 1_670_000);
  eq('共働き: careTarget は45歳だけ',        inputs.members.map(m => m.careTarget).join(','), 'true,false');
  eq('共働き: 軽減判定は所得の合計',        inputs.reductionJudgmentIncome, 3_340_000);

  const d = saitamaKokuho;
  const r = calculateKokuho(inputs, d);
  const base = 2 * (1_670_000 - d.basicDeduction);
  eq('共働き: 医療分＝基礎額 2,480,000 で旧経路に渡した結果と同じ',
     r.medicalTotal,
     calculateKokuho({ ...inputs, members: undefined, income: base + d.basicDeduction }, d).medicalTotal);
  eq('共働き: 介護分は45歳1人の基礎額 1,240,000 だけ',
     r.careTotal,
     calculateKokuho({ ...inputs, members: undefined, income: 1_670_000 }, d).careTotal);
  ok('共働き: 合算1本で渡すより保険料が低い（基礎控除が2回）',
     r.total < calculateKokuho({ ...inputs, members: undefined }, d).total);
}

// ═══════════════════════════════════════════════════════════
// 2. calculateHousehold（国保 + 住民税）
// ═══════════════════════════════════════════════════════════
console.log('\n== calculateHousehold（国保 + 住民税） ==');

{
  const members = [
    { id: 'a', role: 'head', age: 40, salary: 2_000_000,
      isKokuhoInsured: true, isOnSocialInsurance: false },
  ];
  const result = calculateHousehold(
    { kokuho: saitamaKokuho, kaigo: null, jumin: null },
    { members }
  );

  // 直接計算で比較
  const kInputs = deriveKokuhoInputs(members);
  const kDirect = calculateKokuho(kInputs, saitamaKokuho);
  const jDirect = calculateJumin(null, { salary: 2_000_000 });

  ok('kokuho が計算される',   result.kokuho !== null);
  ok('jumin が計算される',    result.jumin  !== null);
  eq('kokuho.total が一致',   result.kokuho.total, kDirect.total);
  eq('jumin.total が一致',    result.jumin.total,  jDirect.total);
  eq('totalBurden = kokuho + jumin',
     result.totalBurden, kDirect.total + jDirect.total);
  ok('"kokuho" が availableSystems に含まれる',
     result.availableSystems.includes('kokuho'));
  ok('"jumin" が availableSystems に含まれる',
     result.availableSystems.includes('jumin'));
  ok('kaigo は [] （データなし）', result.kaigo.length === 0);
}

// ═══════════════════════════════════════════════════════════
// 3. 擬制世帯主の軽減判定
// ═══════════════════════════════════════════════════════════
console.log('\n== 擬制世帯主の軽減判定 ==');

{
  const withHead = [
    { id: 'h', role: 'head',   age: 45, salary: 6_000_000,
      isKokuhoInsured: false, isOnSocialInsurance: true },
    { id: 's', role: 'spouse', age: 42, salary: 0,
      isKokuhoInsured: true, isOnSocialInsurance: false },
  ];
  const withoutHead = [
    { id: 's', role: 'head', age: 42, salary: 0,
      isKokuhoInsured: true, isOnSocialInsurance: false },
  ];
  const mData = { kokuho: saitamaKokuho, kaigo: null, jumin: null };

  const rWith    = calculateHousehold(mData, { members: withHead });
  const rWithout = calculateHousehold(mData, { members: withoutHead });

  eq('擬制世帯主なし → 7割軽減', rWithout.kokuho.reductionLabel, '7割軽減');
  eq('擬制世帯主あり → 軽減なし', rWith.kokuho.reductionLabel,    '軽減なし');
  ok('保険料: 擬制世帯主あり > なし', rWith.kokuho.total > rWithout.kokuho.total);
}

// ═══════════════════════════════════════════════════════════
// 4. simple / accurate モード（socialInsurancePaid の違い）
// ═══════════════════════════════════════════════════════════
console.log('\n== simple / accurate モード ==');

{
  const members = [
    { id: 'a', role: 'head', age: 40, salary: 3_000_000,
      isKokuhoInsured: true, isOnSocialInsurance: false },
  ];
  const mData = { kokuho: saitamaKokuho, kaigo: null, jumin: null };

  const simple   = calculateHousehold(mData, { members }, { mode: 'simple' });
  const accurate = calculateHousehold(mData, { members }, { mode: 'accurate' });

  eq('simple.mode = "simple"',     simple.mode,   'simple');
  eq('accurate.mode = "accurate"', accurate.mode, 'accurate');
  eq('simple: socialInsurancePaid = 0',
     simple._debug.socialInsurancePaid, 0);
  eq('accurate: socialInsurancePaid = kokuho.total',
     accurate._debug.socialInsurancePaid, accurate.kokuho.total);
  // accurate では社保控除が増える → 住民税が減る → totalBurden が小さい
  ok('accurate の totalBurden ≤ simple の totalBurden（社保控除効果）',
     accurate.totalBurden <= simple.totalBurden);
}

// ═══════════════════════════════════════════════════════════
// 5. kaigo 第1号統合（65歳以上メンバー）
// ═══════════════════════════════════════════════════════════
console.log('\n== kaigo 第1号統合 ==');

{
  const members = [
    { id: 'h', role: 'head', age: 70, pension: 2_000_000,
      isKokuhoInsured: true, isOnSocialInsurance: false },
  ];
  const mData = { kokuho: saitamaKokuho, kaigo: TEST_KAIGO, jumin: null };
  const result = calculateHousehold(mData, { members });

  ok('kaigo が計算される',                       result.kaigo.length === 1);
  ok('"kaigo" が availableSystems に含まれる',   result.availableSystems.includes('kaigo'));
  ok('careInsuranceCombined.firstCategory > 0', result.careInsuranceCombined.firstCategory > 0);
  ok('totalBurden に kaigo が加算される',
     result.totalBurden === (result.kokuho?.total || 0) + (result.jumin?.total || 0) + result.careInsuranceCombined.firstCategory);

  // 年金200万・65歳: calcPensionIncome(2M,70)=90万 → totalIncome=90万
  // jumin で isTaxable = taxableIncome(90万-43万=47万 > 0) = true
  // kaigo: selfTaxable=true, totalIncome=90万 < 120万 → 第5段階
  eq('70歳・年金200万 → kaigo 第5段階', result.kaigo[0].level, '5');
  eq('第5段階: annual = 80,000',         result.kaigo[0].annual, 80_000);
}

{
  // 世帯全員非課税（年金60万・70歳）
  const members = [
    { id: 'h', role: 'head', age: 70, pension: 600_000,
      isKokuhoInsured: true, isOnSocialInsurance: false },
  ];
  const mData = { kokuho: saitamaKokuho, kaigo: TEST_KAIGO, jumin: null };
  const result = calculateHousehold(mData, { members });

  // 年金60万: calcPensionIncome(600000,70)=0 → taxableIncome=0 → isTaxable=false
  // isHouseholdAllNonTaxable=true → 第1段階（pensionIncome=60万 ≤ 80万）
  eq('年金60万・非課税 → kaigo 第1段階', result.kaigo[0].level, '1');
  eq('careInsuranceCombined.secondCategory = kokuho.careTotal',
     result.careInsuranceCombined.secondCategory, result.kokuho.careTotal);
}

// ═══════════════════════════════════════════════════════════
// 6. taxStatus（課税フラグ）が kaigo に正しく伝わるか
// ═══════════════════════════════════════════════════════════
console.log('\n== taxStatus の伝達 ==');

{
  // 世帯主（課税）＋65歳以上の親（非課税）
  const members = [
    { id: 'head', role: 'head',  age: 45, salary: 4_000_000,
      isKokuhoInsured: true, isOnSocialInsurance: false },
    { id: 'p',    role: 'other', age: 72, pension: 800_000,
      isKokuhoInsured: true, isOnSocialInsurance: false },
  ];
  const mData = { kokuho: saitamaKokuho, kaigo: TEST_KAIGO, jumin: null };
  const result = calculateHousehold(mData, { members });

  // 72歳・年金80万: calcPensionIncome(800000,72)=0 → taxableIncome=0 → isSelfTaxable=false
  // 世帯主は課税 → isHouseholdAllNonTaxable=false
  // → 第4段階（本人非課税・世帯課税）
  const kaigoForParent = result.kaigo.find(k => k.memberId === 'p');
  ok('72歳の親の kaigo が計算される', !!kaigoForParent);
  eq('本人非課税・世帯課税 → 第4段階', kaigoForParent?.level, '4');
}

// ═══════════════════════════════════════════════════════════
// 結果
// ═══════════════════════════════════════════════════════════
console.log(`\n${'─'.repeat(55)}`);
console.log(`結果: PASS ${passed} / FAIL ${failed}`);
if (failed === 0) console.log('✅ 全テスト通過');
console.log();
if (failed > 0) process.exit(1);
