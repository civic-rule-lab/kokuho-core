# 福生市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.fussa.tokyo.jp/life/procedure/insurance/1001872.html
- 補助 URL（子ども・子育て支援納付金分）: https://www.city.fussa.tokyo.jp/life/procedure/insurance/1021041.html
- publishedAt: 2026-05-15（公式ページの厳密な改訂日が明示されていないため checkedAt 同日扱い）
- checkedAt: 2026-05-15

## changed fields

- medical.rate:      0.0539 → 0.0594
- medical.perCapita: 29,700 → 33,900
- medical.cap:       670,000（福生市独自・国標準 660,000 より上方、据え置き）
- support.rate:      0.0225 → 0.024
- support.perCapita: 13,200 → 14,200
- support.cap:       260,000（据え置き）
- care.rate:         0.0179 → 0.0193
- care.perCapita:    14,000 → 14,800
- care.cap:          170,000（据え置き）
- childcare（フラット）→ childcareLevy（新方式 perCapitaAdult あり）への構造変更:
  - 旧: `childcare: { rate: 0, perCapita: 0, household: 0 }`
  - 新: `childcareLevy: { rate: 0.0031, perCapita: 1928, perCapitaAdult: 92, perCapitaAdultScope: "all_ages", household: 0 }`
  - 大人 1 人あたり = perCapita + perCapitaAdult = 1,928 + 92 = 2,020 円
  - 18歳未満は formula 上 0 算入（kokuho.js の `adults * (perCapita + perCapitaAdult)` 機構）
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
childcareLevy は三鷹市・府中市・小金井市と同じ「perCapitaAdult + perCapitaAdultScope: 'all_ages'」の新方式パターン。
medical.cap = 670,000 円は国標準と異なる福生市独自値（validator は WARN するが正規 R8 値）。
子ども分は本ページとは別の補助ページ /1021041.html で構造詳細を確認。
