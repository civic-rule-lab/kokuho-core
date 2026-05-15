# 日野市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.hino.lg.jp/kurashi/kokuhonenkin/1023198/1023202/1023220.html
- R7 改定参考 URL: https://www.city.hino.lg.jp/kurashi/kokuhonenkin/1023198/1023199/1028419.html
- publishedAt: 2026-05-15（公式ページの厳密な改訂日が明示されていないため checkedAt 同日扱い）
- checkedAt: 2026-05-15

## changed fields

- medical.rate:      0.058（R7 と同値据え置き）
- medical.perCapita: 34,500（R7 と同値据え置き）
- medical.cap:       670,000（日野市独自・国標準 660,000 より上方、据え置き）
- support.rate:      0.021（R7 と同値据え置き）
- support.perCapita: 12,300（R7 と同値据え置き）
- support.cap:       260,000（R7 と同値据え置き）
- care.rate:         0.021（R7 と同値据え置き）
- care.perCapita:    14,700（R7 と同値据え置き）
- care.cap:          170,000（据え置き）
- childcare（フラット）→ childcareLevy（新方式 perCapitaAdult あり）への構造変更:
  - 旧: `childcare: { rate: 0, perCapita: 0, household: 0 }`
  - 新: `childcareLevy: { rate: 0.003, perCapita: 1899, perCapitaAdult: 84, perCapitaAdultScope: "all_ages", household: 0 }`
  - 大人 1 人あたり = perCapita + perCapitaAdult = 1,899 + 84 = 1,983 円
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

日野市は medical/support/care の rate/perCapita が R7 と完全一致（R7 改定ページ /1028419.html で確認可能）。R8 で料率変更なし、子ども分新設のみ。
childcareLevy は新方式（三鷹市・府中市・小金井市・福生市と同じパターン）で、`adults * (perCapita + perCapitaAdult)` で 1,983 円 × 大人数の課税。
medical.cap = 670,000 円は国標準と異なる日野市独自値（validator は WARN するが正規 R8 値）。
