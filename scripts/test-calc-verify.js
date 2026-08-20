/**
 * 国保計算 公式値照合テスト（複数自治体）
 *
 * 各自治体の公式サイト・公式PDFに掲載された計算例と
 * エンジンの出力を照合する。
 *
 * 実行: node scripts/test-calc-verify.js
 * 特定自治体のみ: node scripts/test-calc-verify.js shinjuku
 *
 * ※ 「income」は前年の総所得金額等（給与所得・事業所得など）
 *    エンジンが内部で basicDeduction(43万) を差し引く。
 * ※ 複数所得者世帯は所得割が簡易計算（各人ごとの控除が1回になる）。
 *    公式計算例は単一所得者のケースを対象とすること。
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
// js/core/kokuho.js を直接 require すると、package.json "type": "module" 環境では
// `module` global が undefined となり、kokuho.js 末尾の module.exports が実行されず
// 空 object が返る (issue #36)。scripts/lib/kokuho-loader.cjs (vm.runInContext 経由) で読み込む。
const { calculateKokuho } = require("./lib/kokuho-loader.cjs");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT     = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data", "municipalities");

// ─── テスト用ラッパー ────────────────────────────────────────────
// expected フィールド名（medical/support/care）と engine 出力（medicalTotal/...）を吸収し、
// 未指定の入力フィールドにデフォルト値を補う。
function runKokuho(data, input) {
  const r = calculateKokuho({
    income:                  input.income                  ?? 0,
    family:                  input.family                  ?? 1,
    preschool:               input.preschool               ?? 0,
    under18:                 input.under18                 ?? 0,
    care:                    input.care                    ?? 0,
    salaryPensionCount:      input.salaryPensionCount      ?? 1,
    fixedAssetTax:           input.fixedAssetTax           ?? 0,
    reductionJudgmentIncome: input.reductionJudgmentIncome,  // undefined のまま渡す（フォールバックはエンジン側）
  }, data);
  return {
    medical:          r.medicalTotal,
    support:          r.supportTotal,
    care:             r.careTotal,
    childcare:        r.childcareTotal,
    total:            r.total,
    reductionLabel:   r.reductionLabel,
    preschoolReduction: r.preschoolReduction,
    totalReduction:   r.totalReduction,
  };
}

// ─── テストケース定義 ──────────────────────────────────────────
//
// source: 出典（公式サイト・PDF等）
// tolerance: 許容誤差（円）。デフォルト1円。
// expected.medical/support/care/total: null は照合スキップ
//
const TEST_SUITES = [

  // ============================================================
  // 新宿区（東京都）
  // 出典: https://www.city.shinjuku.lg.jp/hoken/hoken01_002029.html
  // ============================================================
  {
    slug: "shinjuku",
    label: "新宿区",
    cases: [
      {
        label: "【公式例1】単身・給与所得160万円（20歳・介護なし）",
        note:  "給与収入240万円 → 給与所得160万円",
        input: { income: 1600000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { medical: 137507, support: 48273, care: 0, total: 185780, reductionLabel: "軽減なし" },
        source: "新宿区公式サイト 計算例",
      },
      {
        label: "【公式例2】4人家族・給与所得340万（45歳・未就学1人・介護1人）",
        note:  "給与収入480万 → 給与所得340万。子2歳（未就学）1人含む",
        input: { income: 3400000, family: 4, preschool: 1, care: 1, salaryPensionCount: 1 },
        expected: { medical: 394537, support: 138693, care: 83425, total: 616655, reductionLabel: "軽減なし" },
        source: "新宿区公式サイト 計算例",
      },
    ],
  },

  // ============================================================
  // 長野市（長野県）
  // 出典: 長野市 令和7年度 国民健康保険料 目安表（PDF）
  //       https://www.city.nagano.nagano.jp/documents/3682/meyasuhyou.pdf
  //
  // ※ 目安表は法定軽減を適用しない「総額」の表。
  //    軽減が生じないケース（所得高め）のみを照合対象とする。
  // ※ 「介護あり」列 = 世帯内に40〜64歳が2名いる想定（care=2）。
  //    ただし1人世帯（介護あり）は care=1。
  // ※ income = 総所得金額等（給与所得控除後）を入力する。
  // ============================================================
  {
    slug: "nagano",
    label: "長野市",
    cases: [
      {
        label: "【公式目安表】総所得202万・1人世帯・介護なし",
        note:  "給与収入300万 → 総所得金額等202万。twoTenthsLimit=99万 < 202万 → 軽減なし",
        input: { income: 2020000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { medical: 167820, support: 58320, care: 0, total: 226140, reductionLabel: "軽減なし" },
        source: "長野市 R7 目安表（給与収入300万・1人・その他）",
      },
      {
        label: "【公式目安表】総所得202万・1人世帯・介護あり（care=1）",
        note:  "給与収入300万 → 総所得金額等202万",
        input: { income: 2020000, family: 1, preschool: 0, care: 1, salaryPensionCount: 1 },
        expected: { medical: 167820, support: 58320, care: 57180, total: 283320, reductionLabel: "軽減なし" },
        source: "長野市 R7 目安表（給与収入300万・1人・介護あり）",
      },
      {
        label: "【公式目安表】総所得202万・2人世帯・介護なし",
        note:  "twoTenthsLimit=155万 < 202万 → 軽減なし",
        input: { income: 2020000, family: 2, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { medical: 185580, support: 64560, care: 0, total: 250140, reductionLabel: "軽減なし" },
        source: "長野市 R7 目安表（給与収入300万・2人・その他）",
      },
      {
        label: "【公式目安表】総所得202万・2人世帯・介護あり（care=2）",
        note:  "介護あり列は40〜64歳2名想定。twoTenthsLimit=155万 < 202万 → 軽減なし",
        input: { income: 2020000, family: 2, preschool: 0, care: 2, salaryPensionCount: 1 },
        expected: { medical: 185580, support: 64560, care: 65940, total: 316080, reductionLabel: "軽減なし" },
        source: "長野市 R7 目安表（給与収入300万・2人・介護あり）",
      },
      {
        label: "【公式目安表】総所得132万・1人世帯・介護なし",
        note:  "給与収入200万 → 総所得金額等132万。twoTenthsLimit=99万 < 132万 → 軽減なし",
        input: { income: 1320000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 149140, reductionLabel: "軽減なし" },
        source: "長野市 R7 目安表（給与収入200万・1人・その他）",
      },
      {
        label: "7割軽減判定（総所得43万・1人）",
        note:  "sevenTenthsLimit=43万。43万 ≤ 43万 → 7割軽減。合計額は目安表の51,240（軽減前）ではなく軽減後を検証",
        input: { income: 430000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "7割軽減" },
        source: "法定軽減判定確認",
      },
      {
        label: "5割軽減判定（総所得80万・2人・給与所得者1人）",
        note:  "fiveTenthsLimit=43万+30.5万×2=104万。80万 ≤ 104万 → 5割軽減",
        input: { income: 800000, family: 2, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "5割軽減" },
        source: "法定軽減判定確認",
      },
    ],
  },

  // ============================================================
  // 藤沢市（神奈川県）
  // 料率は公式サイトで確認済み。計算例はPNG画像のため目視不可。
  // 軽減判定の確認のみ行う。
  // ============================================================
  {
    slug: "fujisawa",
    label: "藤沢市",
    cases: [
      {
        label: "単身・所得0円（7割軽減）",
        input: { income: 0, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "7割軽減" },
        source: "手計算（軽減判定確認）",
      },
      {
        label: "2人世帯・所得43万（7割軽減ボーダー）",
        note: "sevenTenthsLimit=43万。所得43万=ジャスト7割軽減",
        input: { income: 430000, family: 2, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得43.1万（7割軽減外・5割軽減内）",
        note: "fiveTenthsLimit=43万+30.5万×2=104万。所得43.1万 → 5割軽減",
        input: { income: 431000, family: 2, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "5割軽減" },
        source: "手計算",
      },
      {
        label: "1人世帯・所得300万（軽減なし）",
        note:  "twoTenthsLimit=43万+56万=99万 < 300万 → 軽減なし",
        input: { income: 3000000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "軽減なし" },
        source: "手計算",
      },
    ],
  },

  // ============================================================
  // さいたま市（埼玉県）
  // 料率: 医療7.13% 支援2.60% 介護2.24%
  // 均等割: 医療38,300 支援13,500 介護14,600 / 平等割なし
  // 上限: 医療66万 支援26万 介護17万
  // 手計算による軽減判定・計算確認
  // ============================================================
  {
    slug: "saitama",
    label: "さいたま市",
    cases: [
      {
        label: "単身・所得0円（7割軽減）",
        note:  "sevenTenthsLimit=43万。所得0 → 7割軽減。医療=38300×0.3=11490、支援=13500×0.3=4050",
        input: { income: 0, family: 1, preschool: 0, care: 0 },
        expected: { medical: 11490, support: 4050, care: 0, total: 15540, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "単身・所得200万（軽減なし）",
        note:  "twoTenthsLimit=43万+56万=99万 < 200万 → 軽減なし。baseIncome=157万",
        input: { income: 2000000, family: 1, preschool: 0, care: 0 },
        expected: { medical: 150241, support: 54320, care: 0, total: 204561, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得43万（7割軽減ボーダー）",
        note:  "sevenTenthsLimit=43万（perPersonAdd=0）。43万 ≤ 43万 → 7割軽減",
        input: { income: 430000, family: 2, preschool: 0, care: 0 },
        expected: { reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得43.1万（5割軽減）",
        note:  "fiveTenthsLimit=43万+30.5万×2=104万。43.1万 ≤ 104万 → 5割軽減",
        input: { income: 431000, family: 2, preschool: 0, care: 0 },
        expected: { reductionLabel: "5割軽減" },
        source: "手計算",
      },
    ],
  },

  // ============================================================
  // 千葉市（千葉県）
  // 料率: 医療7.14% 支援2.85% 介護2.36%
  // 均等割: 医療21,840 支援8,640 介護10,680
  // 平等割: 医療25,800 支援10,320 介護8,040
  // 上限: 医療66万 支援26万 介護17万
  // 手計算による確認（平等割あり自治体の動作検証）
  // ============================================================
  {
    slug: "chiba",
    label: "千葉市",
    cases: [
      {
        label: "単身・所得0円（7割軽減・平等割あり）",
        note:  "均等割+平等割=47,640。7割軽減=33,348。医療=14,292。支援=5,688",
        input: { income: 0, family: 1, preschool: 0, care: 0 },
        expected: { medical: 14292, support: 5688, care: 0, total: 19980, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "単身・所得200万（軽減なし・平等割あり）",
        note:  "twoTenthsLimit=99万 < 200万 → 軽減なし。医療=112,098+21,840+25,800=159,738",
        input: { income: 2000000, family: 1, preschool: 0, care: 0 },
        expected: { medical: 159738, support: 63705, care: 0, total: 223443, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得0円（7割軽減・平等割あり）",
        note:  "均等割2人分+平等割: 医療69,480 支援27,600。7割軽減後: 医療20,844 支援8,280",
        input: { income: 0, family: 2, preschool: 0, care: 0 },
        expected: { medical: 20844, support: 8280, care: 0, total: 29124, reductionLabel: "7割軽減" },
        source: "手計算",
      },
    ],
  },

  // ============================================================
  // 大阪市（大阪府）
  // 料率: 医療9.30% 支援3.02% 介護2.56%（府統一料率）
  // 均等割: 医療34,424 支援11,034 介護18,784
  // 平等割: 医療33,574 支援10,761 介護0
  // 上限: 医療65万 支援24万 介護17万
  // 大阪府統一保険料率（R6〜）の動作確認
  // ============================================================
  {
    slug: "osaka",
    label: "大阪市",
    cases: [
      {
        label: "単身・所得0円（7割軽減・府統一料率）",
        note:  "均等割+平等割=67,998。7割軽減=47,599。医療=20,399、支援=6,538",
        input: { income: 0, family: 1, preschool: 0, care: 0 },
        expected: { medical: 20399, support: 6538, care: 0, total: 26937, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "単身・所得200万（軽減なし・府統一料率）",
        note:  "twoTenthsLimit=99万 < 200万 → 軽減なし。医療=146,010+34,424+33,574=214,008",
        input: { income: 2000000, family: 1, preschool: 0, care: 0 },
        expected: { medical: 214008, support: 69209, care: 0, total: 283217, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得43万（7割軽減ボーダー）",
        note:  "sevenTenthsLimit=43万（perPersonAdd=0）。43万 ≤ 43万 → 7割軽減",
        input: { income: 430000, family: 2, preschool: 0, care: 0 },
        expected: { reductionLabel: "7割軽減" },
        source: "手計算",
      },
    ],
  },

  // ============================================================
  // 福岡市（福岡県）
  // 料率: 医療5.96% 支援3.28% 介護2.81%
  // 均等割: 医療19,980 支援10,334 介護10,386
  // 平等割: 医療18,863 支援9,757 介護7,912
  // 上限: 医療66万 支援26万 介護17万
  // 手計算による確認
  // ============================================================
  {
    slug: "fukuoka",
    label: "福岡市",
    cases: [
      {
        label: "単身・所得0円（7割軽減）",
        note:  "均等割+平等割: 医療38,843 支援20,091。7割軽減後: 医療11,653 支援6,027",
        input: { income: 0, family: 1, preschool: 0, care: 0 },
        expected: { medical: 11653, support: 6027, care: 0, total: 17680, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "単身・所得200万（軽減なし）",
        note:  "twoTenthsLimit=99万 < 200万 → 軽減なし。医療=93,572+19,980+18,863=132,415",
        input: { income: 2000000, family: 1, preschool: 0, care: 0 },
        expected: { medical: 132415, support: 71587, care: 0, total: 204002, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      {
        label: "2人世帯・所得43万（7割軽減ボーダー）",
        note:  "sevenTenthsLimit=43万（perPersonAdd=0）。43万 ≤ 43万 → 7割軽減",
        input: { income: 430000, family: 2, preschool: 0, care: 0 },
        expected: { reductionLabel: "7割軽減" },
        source: "手計算",
      },
    ],
  },

  // ============================================================
  // 練馬区（東京都）R8 — childcareLevy（子ども・子育て支援金分）検証
  // rate 0.0027 / perCapita 1873 / cap 30000（verified 2026-04-27）
  // cap=0 のとき ?? 演算子で正しく 0 になるか（旧バグの回帰テスト）
  // ============================================================
  {
    slug: "nerima",
    year: 2026,
    label: "練馬区（R8・子育て支援金分）",
    cases: [
      {
        label: "単身・所得0円（7割軽減・childcare均等割のみ）",
        note:  "childcarePerCapita=1873、7割軽減額=round(1873×0.7)=1311、childcareTotal=1873-1311=562",
        input: { income: 0, family: 1, preschool: 0, under18: 0, care: 0 },
        expected: { childcare: 562, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "単身・所得200万（軽減なし・childcare所得割+均等割）",
        note:  "baseIncome=157万、childcareIncome=round(1570000×0.0027)=4239、perCapita=1873 → 6112。cap=30000以内",
        input: { income: 2000000, family: 1, preschool: 0, under18: 0, care: 0 },
        expected: { childcare: 6112, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      {
        label: "cap=0 の自治体で childcareTotal が 30000 にならないこと（旧バグ回帰）",
        note:  "cap=0 の自治体データを動的に作成。?? 修正が有効なら 0 のまま",
        input: { income: 5000000, family: 1, preschool: 0, under18: 0, care: 0 },
        _overrideData: { childcareLevy: { rate: 0, perCapita: 0, household: 0, cap: 0 } },
        expected: { childcare: 0 },
        source: "cap=0バグ回帰テスト（engine.js: childcareCfg?.cap ?? 30000）",
      },
    ],
  },

  // ============================================================
  // 擬制世帯主テスト（さいたま市 R7 データを流用）
  //
  // 世帯主: 会社員（社保加入・国保非加入）、所得600万
  // 加入者: 配偶者（国保加入）、所得0
  //
  // 軽減判定は「世帯主所得 + 加入者所得 = 600万」で行う
  // （加入者所得0だけで判定すると7割軽減になるが、正しくは軽減なし）
  //
  // reductionJudgmentIncome なし → income（0）で判定 → 7割軽減（誤）
  // reductionJudgmentIncome あり → 600万で判定 → 軽減なし（正）
  // ============================================================
  {
    slug: "saitama",
    label: "擬制世帯主（さいたま市）",
    cases: [
      {
        label: "reductionJudgmentIncome なし（後方互換）→ 加入者所得0で判定 → 7割軽減",
        note:  "income=0 のみ。reductionJudgmentIncome 未指定 → income にフォールバック",
        input: { income: 0, family: 1, preschool: 0, care: 0 },
        expected: { reductionLabel: "7割軽減" },
        source: "後方互換確認",
      },
      {
        label: "reductionJudgmentIncome あり → 世帯主所得600万で判定 → 軽減なし",
        note:  "income=0（加入者所得）、reductionJudgmentIncome=6,000,000（世帯主所得を加算）",
        input: {
          income: 0, family: 1, preschool: 0, care: 0,
          reductionJudgmentIncome: 6_000_000,
        },
        expected: { reductionLabel: "軽減なし" },
        source: "擬制世帯主：世帯主の所得を軽減判定に反映",
      },
      {
        label: "7割軽減ボーダー上で reductionJudgmentIncome が判定を変える",
        note:  "sevenTenthsLimit=43万（1人世帯）。income=0、reductionJudgmentIncome=430,001 → 軽減なし側へ",
        input: {
          income: 0, family: 1, preschool: 0, care: 0,
          reductionJudgmentIncome: 430_001,
        },
        expected: { reductionLabel: "5割軽減" },
        source: "境界値テスト（43万+1円で7割軽減を外れる）",
      },
    ],
  },

  // ============================================================
  // 京都市（京都府）R8 — perCapitaMode 両解釈フラグ検証
  //
  // childcareLevy 構造:
  //   rate=0.0028 / perCapita=1110 / perCapitaAdult=60 / household=660 / cap=30000
  //   under18Reduction=true（18歳未満全額減額）
  //
  // all_ages モード（大人 = 1110+60=1170円）
  //   childcarePerCapitaTotal = adults × 1170
  //   7割軽減: round((1170+660)×0.7) = round(1281) = 1281
  //   childcareTotal = 0+1170+660-1281 = 549
  //
  // adults_only モード（大人 = 60円のみ）
  //   childcarePerCapitaTotal = adults × 60
  //   7割軽減: round((60+660)×0.7) = round(504) = 504
  //   childcareTotal = 0+60+660-504 = 216
  //
  // 電話確認（075-222-3500）後に perCapitaMode を確定。
  // ============================================================
  {
    slug: "kyoto",
    year: 2026,
    label: "京都市（R8・perCapitaMode 両解釈）",
    cases: [
      {
        label: "all_ages モード・単身・所得0（大人=1170円、7割軽減）",
        note:  "adults=1。perCapitaTotal=1×(1110+60)=1170。household=660。7割軽減=round(1830×0.7)=1281。childcare=549",
        input: { income: 0, family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1 },
        expected: { childcare: 549, reductionLabel: "7割軽減" },
        source: "手計算（perCapitaMode=all_ages）",
      },
      {
        label: "adults_only モード・単身・所得0（大人=60円、7割軽減）",
        note:  "adults=1。perCapitaTotal=1×60=60。household=660。7割軽減=round(720×0.7)=504。childcare=216",
        input: { income: 0, family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1 },
        _overrideData: { childcareLevy: { rate: 0.0028, perCapita: 1110, perCapitaAdult: 60, perCapitaAdultScope: "adults_only", household: 660, cap: 30000, under18Reduction: true } },
        expected: { childcare: 216, reductionLabel: "7割軽減" },
        source: "手計算（perCapitaMode=adults_only）",
      },
      {
        label: "all_ages・under18=1（adults=0）→ childcarePerCapita=0、household のみ",
        note:  "adults=0。perCapitaTotal=0×1170=0。household=660。7割軽減=round(660×0.7)=462。childcare=198",
        input: { income: 0, family: 1, preschool: 0, under18: 1, care: 0, salaryPensionCount: 1 },
        expected: { childcare: 198, reductionLabel: "7割軽減" },
        source: "手計算（under18=family → adults=0）",
      },
      {
        label: "all_ages・軽減なし・所得300万（所得割+perCapita+household）",
        note:  "baseIncome=257万。childcareIncome=round(2570000×0.0028)=7196。perCapita=1170。household=660。cap内",
        input: { income: 3000000, family: 1, preschool: 0, under18: 0, care: 0, salaryPensionCount: 1 },
        expected: { reductionLabel: "軽減なし" },
        source: "手計算（総額確認）",
      },
    ],
  },

  // ============================================================
  // 茅ヶ崎市（神奈川県）R7 — 軽減判定境界値テスト
  //
  // sevenTenths:  base=43万, perPersonAdd=0
  // fiveTenths:   base=43万, perPersonAdd=30.5万
  // twoTenths:    base=43万, perPersonAdd=56万
  // salaryPensionAdd: 10万（2人目以降の給与・年金所得者に加算）
  //
  // 単身・spc=1 の各境界:
  //   7割上限 = 43万
  //   5割上限 = 43万 + 30.5万×1 = 73.5万
  //   2割上限 = 43万 + 56万×1  = 99万
  //
  // ============================================================
  {
    slug: "chigasaki",
    label: "茅ヶ崎市（境界値・限度額）",
    cases: [
      // ── 7割 / 5割 境界（境界-1 / ちょうど / +1 の3点） ──────────
      {
        label: "boundary_7to5_minus1: income=429,999（7割軽減）",
        note:  "reductionBase=429,999 ≤ 430,000 → 7割。baseIncome=0 なので金額は境界ちょうどと同値",
        input: { income: 429_999, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 21252, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "boundary_7to5_exact: income=430,000（7割軽減）",
        note:  "reductionBase=430,000 ≤ sevenTenthsLimit=430,000 → 7割軽減",
        input: { income: 430_000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 21252, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "boundary_7to5_plus1: income=430,001（5割軽減・境界+1）",
        note:  "reductionBase=430,001 > 430,000 → 5割軽減",
        input: { income: 430_001, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 35419, reductionLabel: "5割軽減" },
        source: "手計算",
      },
      // ── 5割 / 2割 境界（境界-1 / ちょうど / +1 の3点） ──────────
      {
        label: "boundary_5to2_minus1: income=734,999（5割軽減）",
        note:  "reductionBase=734,999 ≤ 735,000 → 5割。supportIncome が1円少なく total=64,180",
        input: { income: 734_999, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 64180, reductionLabel: "5割軽減" },
        source: "手計算",
      },
      {
        label: "boundary_5to2_exact: income=735,000（5割軽減）",
        note:  "reductionBase=735,000 ≤ fiveTenthsLimit=735,000 → 5割軽減",
        input: { income: 735_000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 64181, reductionLabel: "5割軽減" },
        source: "手計算",
      },
      {
        label: "boundary_5to2_plus1: income=73.5万+1円（2割軽減・境界+1）",
        note:  "reductionBase=735,001 > 735,000 → 2割軽減",
        input: { income: 735_001, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 85434, reductionLabel: "2割軽減" },
        source: "手計算",
      },
      // ── 2割 / 軽減なし 境界（境界-1 / ちょうど / +1 の3点） ─────
      {
        label: "boundary_2toNone_minus1: income=989,999（2割軽減）",
        note:  "reductionBase=989,999 ≤ 990,000 → 2割。金額は境界ちょうどと同値",
        input: { income: 989_999, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 109480, reductionLabel: "2割軽減" },
        source: "手計算",
      },
      {
        label: "boundary_2toNone_exact: income=990,000（2割軽減）",
        note:  "reductionBase=990,000 ≤ twoTenthsLimit=990,000 → 2割軽減",
        input: { income: 990_000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 109480, reductionLabel: "2割軽減" },
        source: "手計算",
      },
      {
        label: "boundary_2toNone_plus1: income=99万+1円（軽減なし・境界+1）",
        note:  "reductionBase=990,001 > 990,000 → 軽減なし",
        input: { income: 990_001, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 123647, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      // ── 未就学児×7割軽減：法定軽減「後」の額に5割（＝合計8.5割軽減） ──
      // 制度: 7割軽減世帯の未就学児は「軽減後の残り3割」にさらに5割軽減がかかり、
      //       合計 8.5割軽減となる（厚労省ルール。葛飾区・世田谷区等の公式が明記）。
      //   旧実装は満額の5割を法定軽減と単純加算（独立加算型）しており、7割世帯で
      //   per-capita×1.2 の過大控除になっていた（＝旧期待値 14,919 はそのバグ値）。
      //   修正: kokuho.js の preschoolReduction に (1 - reductionRate) を乗算。
      {
        label: "preschool_7ten: 2人世帯・未就学1人・7割軽減（軽減後の額に5割＝合計8.5割）",
        note:  "income0/2人/7割。未就学児分=per-capita×(1-0.7)×0.5: 医療round(22432×0.3×0.5)=3,365 / 支援round(9231×0.3×0.5)=1,385。医療=72,619-3,365-50,833=18,421、支援=29,883-1,385-20,918=7,580",
        input: { income: 0, family: 2, preschool: 1, care: 0, salaryPensionCount: 1 },
        expected: { medical: 18421, support: 7580, total: 26001, reductionLabel: "7割軽減" },
        source: "手計算＋厚労省8.5割ルール。旧14,919は加算型バグの固定値",
      },
      // ── salaryPensionAdd による閾値延長 ─────────────────────────
      {
        label: "2人世帯・spc=2・income=53万（7割軽減・salaryPensionAdd延長後の境界）",
        note:  "sevenTenthsLimit=43万+salaryPensionAdd×(2-1)=53万。income=530,000 ≤ 53万 → 7割軽減",
        input: { income: 530_000, family: 2, preschool: 0, care: 0, salaryPensionCount: 2 },
        expected: { total: 40181, reductionLabel: "7割軽減" },
        source: "手計算",
      },
      {
        label: "2人世帯・spc=2・income=53万+1円（5割軽減・境界+1）",
        note:  "reductionBase=530,001 > 530,000 → 5割軽減",
        input: { income: 530_001, family: 2, preschool: 0, care: 0, salaryPensionCount: 2 },
        expected: { total: 60680, reductionLabel: "5割軽減" },
        source: "手計算",
      },
      // ── 賦課限度額（高所得世帯） ────────────────────────────────
      {
        label: "単身・income=1000万（医療・支援 上限頭打ち）",
        note:  "medical上限66万、support上限26万。計算値: 医療687,549→66万、支援285,741→26万",
        input: { income: 10_000_000, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { medical: 660000, support: 260000, care: 0, total: 920000, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      {
        label: "単身・介護1人・income=1000万（3区分すべて上限）",
        note:  "medical上限66万 + support上限26万 + care上限17万 = 109万",
        input: { income: 10_000_000, family: 1, preschool: 0, care: 1, salaryPensionCount: 1 },
        expected: { medical: 660000, support: 260000, care: 170000, total: 1090000, reductionLabel: "軽減なし" },
        source: "手計算",
      },
    ],
  },

  // ============================================================
  // バグ修正回帰テスト（kokuho.js 入力バリデーション）
  //
  // ① income=undefined → NaN 伝播バグ
  // ② salaryPensionCount > family → 軽減閾値が不正拡張されるバグ
  // ③ preschool > family → 過剰な未就学児軽減が発生するバグ
  // ④ care > family → 介護分が余分に計算されるバグ
  // ============================================================
  {
    slug: "chigasaki",
    label: "茅ヶ崎市（入力バリデーション回帰）",
    cases: [
      // ① income=undefined
      {
        label: "income=undefined → 0 として計算（NaNにならない）",
        note:  "修正前: NaN。修正後: income=0 と同値 → 7割軽減 total=21,252",
        input: { income: undefined, family: 1, preschool: 0, care: 0, salaryPensionCount: 1 },
        expected: { total: 21252, reductionLabel: "7割軽減" },
        source: "バグ修正回帰",
      },
      // ② salaryPensionCount > family
      {
        label: "spc=5 > family=1, income=80万 → 2割軽減（7割軽減にならない）",
        note:  "修正前: B=5 → 7割閾値=83万 → 7割軽減（誤）。修正後: B=min(5,1)=1 → 7割閾値=43万 → 2割軽減",
        input: { income: 800_000, family: 1, preschool: 0, care: 0, salaryPensionCount: 5 },
        expected: { reductionLabel: "2割軽減" },
        source: "バグ修正回帰",
      },
      {
        label: "spc=10 > family=2, income=80万 → 5割軽減（7割軽減にならない）",
        note:  "修正前: 7割閾値=133万 → 7割軽減（誤）。修正後: B=min(10,2)=2 → 7割閾値=53万 → 5割軽減",
        input: { income: 800_000, family: 2, preschool: 0, care: 0, salaryPensionCount: 10 },
        expected: { reductionLabel: "5割軽減" },
        source: "バグ修正回帰",
      },
      // ③ preschool > family
      {
        label: "preschool=3 > family=2 → preschool=2 と同値",
        note:  "clamp回帰: preschool=3 は family=2 に clamp。未就学児軽減は法定軽減(5割)後の額に5割＝per-capita×(1-0.5)×0.5。医療49,735+支援20,574=70,309（旧54,478は加算型バグ値）",
        input: { income: 800_000, family: 2, preschool: 3, care: 0, salaryPensionCount: 1 },
        expected: { total: 70309 },
        source: "バグ修正回帰",
        _sameAs: { income: 800_000, family: 2, preschool: 2, care: 0, salaryPensionCount: 1 },
      },
      // ④ care > family
      {
        label: "care=2 > family=1 → care=1 と同値",
        note:  "修正前: care=2 で介護分が2人分。修正後: clamp して care=1 と同じ結果になる",
        input: { income: 0, family: 1, preschool: 0, care: 2, salaryPensionCount: 1 },
        expected: { total: 26734 },
        source: "バグ修正回帰",
        _sameAs: { income: 0, family: 1, preschool: 0, care: 1, salaryPensionCount: 1 },
      },
    ],
  },
  // ============================================================
  // 昭島市: 自治体独自の学齢児軽減(schoolReduction) × 法定軽減
  //   制度: 法定軽減(7/5/2割)が適用される世帯では「軽減後の均等割額」に独自率を掛ける。
  //     未就学児軽減と同じ考え方（厚労省の8.5割ルール）。乗算なので順序不問。
  //   旧実装は (1 - reductionRate) を掛けておらず、軽減率+独自率が100%を超えて
  //     他の被保険者分まで食いつぶし、7割軽減世帯で医療分・支援分が0円に張り付いていた。
  //   修正: kokuho.js の schoolReduction に (1 - reductionRate) を乗算（2026-08-19）。
  // ============================================================
  {
    slug: "akishima",
    year: 2026,   // ★ suite.year の既定は 2025。R8データで検証するので明示必須
    label: "昭島市（独自の学齢児軽減 × 法定軽減の重ね掛け）",
    cases: [
      {
        label: "school_7ten: 親1+学齢児2・7割軽減（軽減後の額に独自5割＝合計8.5割）",
        note:  "学齢児軽減=round(2×28,000×0.3×0.5)=8,400 / round(2×12,000×0.3×0.5)=3,600。" +
               "医療=84,000×0.3-8,400=16,800、支援=36,000×0.3-3,600=7,200。" +
               "パッチ前は軽減前額の5割(40,000)を引き、医療・支援とも0円に張り付いていた",
        input: { income: 400_000, family: 3, preschool: 0, under18: 2, care: 1, salaryPensionCount: 1 },
        expected: { medical: 16800, support: 7200, total: 29100, reductionLabel: "7割軽減" },
        source: "手計算＋昭島市の独自減免（未就学児を除く18歳未満の医療・支援均等割を5割減額）",
      },
      {
        label: "school_5ten: 親1+学齢児2・5割軽減",
        note:  "学齢児軽減=round(2×28,000×0.5×0.5)=14,000 / round(2×12,000×0.5×0.5)=6,000（計20,000）",
        input: { income: 1_000_000, family: 3, preschool: 0, under18: 2, care: 1, salaryPensionCount: 1 },
        expected: { medical: 61630, support: 24825, total: 106355, reductionLabel: "5割軽減" },
        source: "手計算",
      },
      {
        label: "school_2ten: 親1+学齢児2・2割軽減",
        note:  "学齢児軽減=round(2×28,000×0.8×0.5)=22,400 / round(2×12,000×0.8×0.5)=9,600（計32,000）",
        input: { income: 1_600_000, family: 3, preschool: 0, under18: 2, care: 1, salaryPensionCount: 1 },
        expected: { medical: 113830, support: 45525, total: 196355, reductionLabel: "2割軽減" },
        source: "手計算",
      },
      {
        label: "school_none: 親1+学齢児2・軽減なし（★パッチ前後で同値＝非回帰の確認）",
        note:  "reductionRate=0 なので (1-0)=1。学齢児軽減=40,000 のままでパッチ前と一致する",
        input: { income: 4_000_000, family: 3, preschool: 0, under18: 2, care: 1, salaryPensionCount: 1 },
        expected: { medical: 266630, support: 104325, total: 459355, reductionLabel: "軽減なし" },
        source: "手計算",
      },
      {
        label: "school_preschool_mix: 親1+未就学児1+学齢児1・7割軽減（対象の切り分け・パッチ前は15,100円）",
        note:  "schoolSafe = under18(2) - preschool(1) = 1。未就学児は preschoolReduction 側、" +
               "学齢児は schoolReduction 側で、どちらも同率0.5なので合計は学齢児2人ケースと一致する。" +
             "パッチ前は医療7,000/支援3,000/計15,100円だった",
        input: { income: 400_000, family: 3, preschool: 1, under18: 2, care: 1, salaryPensionCount: 1 },
        expected: { medical: 16800, support: 7200, total: 29100, reductionLabel: "7割軽減" },
        source: "手計算",
      },
    ],
  },
];

// ─── テスト実行 ────────────────────────────────────────────────
const targetSlug = process.argv[2] || null;
const suites = targetSlug
  ? TEST_SUITES.filter(s => s.slug === targetSlug || s.label.includes(targetSlug))
  : TEST_SUITES;

if (suites.length === 0) {
  console.error(`❌ テストスイートが見つかりません: ${targetSlug}`);
  process.exit(1);
}

let totalPassed = 0;
let totalFailed = 0;

for (const suite of suites) {
  const year     = suite.year ?? 2025;
  const dataPath = path.join(DATA_DIR, suite.slug, `kokuho-${year}.json`);
  if (!existsSync(dataPath)) {
    console.log(`\n❌ ${suite.label}: kokuho-${year}.json が存在しません`);
    continue;
  }
  const baseData = JSON.parse(readFileSync(dataPath, "utf-8"));

  console.log(`\n${"=".repeat(64)}`);
  console.log(`${suite.label} (${suite.slug} / ${year}年度)`);
  console.log(`${"=".repeat(64)}`);

  for (const tc of suite.cases) {
    // _overrideData があれば一部フィールドを上書き（バグ回帰テスト等）
    const data = tc._overrideData ? { ...baseData, ...tc._overrideData } : baseData;

    const result = runKokuho(data, tc.input);
    const exp    = tc.expected;
    const tol    = tc.tolerance ?? 1;
    const issues = [];

    for (const key of ["medical", "support", "care", "childcare", "total"]) {
      if (exp[key] != null) {
        const diff = Math.abs(result[key] - exp[key]);
        if (diff > tol) {
          issues.push(`${key}: 期待=${exp[key].toLocaleString()} 実際=${result[key].toLocaleString()} 差=${diff}`);
        }
      }
    }
    if (exp.reductionLabel != null && result.reductionLabel !== exp.reductionLabel) {
      issues.push(`軽減判定: 期待=${exp.reductionLabel} 実際=${result.reductionLabel}`);
    }

    const ok = issues.length === 0;
    if (ok) totalPassed++; else totalFailed++;

    const icon   = ok ? "✅" : "❌";
    const inputs = `所得${(tc.input.income/10000).toFixed(0)}万 / ${tc.input.family}人 / 介護${tc.input.care ?? 0} / 未就学${tc.input.preschool ?? 0}`;
    const childcareStr = result.childcare > 0 ? ` + 子育て${result.childcare.toLocaleString()}` : "";
    console.log(`${icon} ${tc.label}`);
    if (tc.note) console.log(`   補足: ${tc.note}`);
    console.log(`   入力: ${inputs}`);
    console.log(`   結果: 医療${result.medical.toLocaleString()} + 支援${result.support.toLocaleString()} + 介護${result.care.toLocaleString()}${childcareStr} = 年間${result.total.toLocaleString()}円 [${result.reductionLabel}]`);
    console.log(`   出典: ${tc.source}`);
    if (!ok) issues.forEach(i => console.log(`   ⚠️  ${i}`));
  }
}

console.log(`\n${"─".repeat(64)}`);
console.log(`結果: PASS ${totalPassed} / FAIL ${totalFailed}`);
if (totalFailed === 0) console.log("✅ 全テスト通過");
console.log();
