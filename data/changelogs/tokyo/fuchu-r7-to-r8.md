# 府中市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.fuchu.tokyo.jp/kurashi/hoken/kokuminkenko/hokenze/kokuhosantei.html
- publishedAt: 2026-04-21（公式ページ最終更新日）
- checkedAt: 2026-05-14

## changed fields

- medical.rate:      0.0505 → 0.0563
- medical.perCapita: 23,720 → 28,720
- medical.cap:       670,000 → 660,000（R8 国標準への合わせ込み）
- support.rate:      0.0164 → 0.0192
- support.perCapita: 7,440 → 9,640
- support.cap:       240,000 → 260,000
- care.rate:         0.0164 → 0.0180
- care.perCapita:    9,840 → 11,440
- care.cap:          170,000（据え置き）
- childcare（フラット）→ childcareLevy（新方式 perCapitaAdult あり）への構造変更:
  - 旧: `childcare: { rate: 0, perCapita: 0, household: 0 }`
  - 新: `childcareLevy: { rate: 0.003, perCapita: 1900, perCapitaAdult: 100, perCapitaAdultScope: "all_ages", household: 0 }`
  - 大人 1 人あたり = perCapita + perCapitaAdult = 1,900 + 100 = 2,000 円
  - 18歳未満は全額軽減（formula 上 adults のみ計算対象）
- reduction.standards.fiveTenths.perPersonAdd: 305,000 → 310,000（R8 国基準）
- reduction.standards.twoTenths.perPersonAdd:  560,000 → 570,000（R8 国基準）

## verification

- r8Stage: verified_r8
- test: passed
- verifiedAt: 2026-05-14
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

R7 値はすべて template_r7 状態（registry 自動生成時の仮置き値）。今回 R8 公式ページで全項目を verified 化。
childcareLevy は三鷹市と同じ「perCapitaAdult + perCapitaAdultScope: 'all_ages'」の新方式で、18歳未満は均等割対象外（kokuho.js の `adults * (perCapita + perCapitaAdult)` formula で自動的に 0 算入）。
軽減判定基準は R8 国基準を最初から適用（batch-01 追補 PR #7 と同期）。
