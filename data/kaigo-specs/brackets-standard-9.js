/**
 * 介護保険料 標準9段階 criteria テンプレート
 *
 * 厚生労働省が示す第9期（2024-2026）標準9段階の判定基準。
 * 多くの自治体がこの基準を採用し、baseAmount のみ自治体ごとに異なる。
 *
 * 使い方:
 *   import { BRACKETS_STANDARD_9 } from './brackets-standard-9.js';
 *   const brackets = BRACKETS_STANDARD_9;  // そのまま使う
 *   // または独自に細分化した段階を追加して使う
 *
 * 境界値の格納方法:
 *   Max/Min はすべて「含む（≤）」で格納する。
 *   「未満」は値 -1 で表す（例: 120万円未満 → totalIncomeMax: 1_199_999）。
 *   「以上」はそのまま（例: 120万円以上 → totalIncomeMin: 1_200_000）。
 *
 * pensionIncome = 年金受給額（控除前・収入額）
 * totalIncome   = 合計所得金額（給与/年金所得控除後・所得控除前）
 */

export const BRACKETS_STANDARD_9 = [
  {
    level: "1",
    label: "第1段階",
    rate: 0.285,
    criteria: {
      householdAllNonTaxable: true,
      pensionIncomeMax: 800_000,          // 年金収入80万円以下
    },
    condition: "世帯全員非課税 かつ 本人年金収入80万円以下（または生活保護受給者）",
  },
  {
    level: "2",
    label: "第2段階",
    rate: 0.485,
    criteria: {
      householdAllNonTaxable: true,
      pensionIncomeMin: 800_001,          // 年金収入80万円超
      pensionIncomeMax: 1_200_000,        // 年金収入120万円以下
    },
    condition: "世帯全員非課税 かつ 本人年金収入80万円超〜120万円以下",
  },
  {
    level: "3",
    label: "第3段階",
    rate: 0.685,
    criteria: {
      householdAllNonTaxable: true,
      pensionIncomeMin: 1_200_001,        // 年金収入120万円超
    },
    condition: "世帯全員非課税 かつ 本人年金収入120万円超",
  },
  {
    level: "4",
    label: "第4段階",
    rate: 0.90,
    criteria: {
      selfTaxable: false,
      householdAllNonTaxable: false,      // 世帯に課税者あり
    },
    condition: "本人非課税 かつ 世帯内に住民税課税者あり",
  },
  {
    level: "5",
    label: "第5段階（基準）",
    rate: 1.00,
    criteria: {
      selfTaxable: true,
      totalIncomeMax: 1_199_999,          // 合計所得120万円未満
    },
    condition: "本人課税 かつ 前年合計所得金額120万円未満",
  },
  {
    level: "6",
    label: "第6段階",
    rate: 1.20,
    criteria: {
      selfTaxable: true,
      totalIncomeMin: 1_200_000,          // 合計所得120万円以上
      totalIncomeMax: 2_099_999,          // 合計所得210万円未満
    },
    condition: "本人課税 かつ 前年合計所得金額120万円以上210万円未満",
  },
  {
    level: "7",
    label: "第7段階",
    rate: 1.45,
    criteria: {
      selfTaxable: true,
      totalIncomeMin: 2_100_000,
      totalIncomeMax: 3_199_999,          // 合計所得320万円未満
    },
    condition: "本人課税 かつ 前年合計所得金額210万円以上320万円未満",
  },
  {
    level: "8",
    label: "第8段階",
    rate: 1.70,
    criteria: {
      selfTaxable: true,
      totalIncomeMin: 3_200_000,
      totalIncomeMax: 4_199_999,          // 合計所得420万円未満
    },
    condition: "本人課税 かつ 前年合計所得金額320万円以上420万円未満",
  },
  {
    level: "9",
    label: "第9段階",
    rate: 2.00,
    criteria: {
      selfTaxable: true,
      totalIncomeMin: 4_200_000,          // 合計所得420万円以上
    },
    condition: "本人課税 かつ 前年合計所得金額420万円以上",
  },
];

/**
 * 都道府県スペックのひな型。
 * data/kaigo-specs/{prefSlug}.js の export 構造。
 *
 * 使い方: このオブジェクトをコピーして prefSlug.js を作成し、
 *         municipalities に自治体ごとの baseAmount を記入する。
 */
export const PREF_SPEC_TEMPLATE = {
  prefName:    "〇〇県",
  prefSlug:    "xxxx",
  fiscalYear:  2026,
  planPeriod:  "第9期（2024-2026）",
  // brackets をカスタマイズしない場合は null（generate スクリプトが標準9段階を使う）
  brackets:    null,
  municipalities: [
    // { cityCode, citySlug, cityName, baseAmount, brackets?: [...] }
    // brackets を省略した場合は上位の brackets または標準9段階を使う
    { cityCode: "XXXXX", citySlug: "example", cityName: "例市", baseAmount: 80_000 },
  ],
};
