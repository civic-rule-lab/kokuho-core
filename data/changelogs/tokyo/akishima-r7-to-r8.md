# 昭島市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.akishima.lg.jp/kurashi/kokuho/1002176/1002195/1002197.html
- 補助 URL（保険税の軽減と減免）: https://www.city.akishima.lg.jp/kurashi/kokuho/1002176/1002195/1002199.html
- publishedAt: 2026-05-15（公式ページの厳密な改訂日が明示されていないため checkedAt 同日扱い）
- checkedAt: 2026-05-15

## changed fields

- medical.rate:      0.056 → 0.059
- medical.perCapita: 27,500 → 28,000
- medical.cap:       670,000（昭島市独自・国標準 660,000 より上方、据え置き）
- support.rate:      0.0225（据え置き）
- support.perCapita: 11,500 → 12,000
- support.cap:       240,000 → 260,000
- care.rate:         0.017（据え置き）
- care.perCapita:    14,500 → 15,000
- care.cap:          170,000（据え置き）
- childcare（フラット）→ childcareLevy（新方式 perCapitaAdult あり）への構造変更:
  - 旧: `childcare: { rate: 0, perCapita: 0, household: 0 }`
  - 新: `childcareLevy: { rate: 0.003, perCapita: 1900, perCapitaAdult: 100, perCapitaAdultScope: "all_ages", household: 0 }`
  - 大人 1 人あたり = perCapita + perCapitaAdult = 1,900 + 100 = 2,000 円
  - 18歳未満は formula 上 0 算入（kokuho.js の `adults * (perCapita + perCapitaAdult)` 機構）
- **schoolReduction（新フィールド）**: 未定義 → `{ enabled: true, medicalPerCapitaRate: 0.5, supportPerCapitaRate: 0.5 }`
  - 昭島市独自減免: 未就学児を除く 18 歳未満（学齢児・6-17 歳）の医療分・支援分均等割を 5 割減額
  - PR #13 (issue #12) で追加した `schoolReduction` 機構を使った最初の自治体
  - 計算ロジック: `school = max(0, under18 - preschool)` → `school × perCapita × 0.5` を医療・支援均等割から控除（介護分には適用しない）
- reduction.standards.fiveTenths.perPersonAdd: 305,000 → 310,000（R8 国基準）
- reduction.standards.twoTenths.perPersonAdd:  560,000 → 570,000（R8 国基準）

## verification

- r8Stage: verified_r8
- test: passed
- verifiedAt: 2026-05-15
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

R7 値はすべて template_r7 状態（registry 自動生成時の仮置き値）。今回 R8 公式ページで全項目を verified 化。
昭島市は東京都多摩地区で **schoolReduction を導入する初めての verified_r8 自治体**。本 commit が schoolReduction 機構の実 data 適用第 1 号。

childcareLevy は新方式（三鷹市・府中市・小金井市・福生市・日野市と同じパターン）で、`adults * (perCapita + perCapitaAdult)` で 2,000 円 × 大人数の課税。
medical.cap = 670,000 円は国標準と異なる昭島市独自値（validator は WARN するが正規 R8 値）。
独自減免の補助情報は本ページとは別の補助ページ /1002199.html で詳細を確認可能。
