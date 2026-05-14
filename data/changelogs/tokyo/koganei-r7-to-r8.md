# 小金井市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.koganei.lg.jp/kurashi/427/kokuhozei/hokenzei_keisan.html
- publishedAt: 2026-03-31（公式ページ最終更新日）
- checkedAt: 2026-05-14

## changed fields

- medical.rate:      0.0654 → 0.0674
- medical.perCapita: 30,000 → 31,000
- medical.cap:       670,000（据え置き・小金井市独自・国標準 660,000 より上方）
- support.rate:      0.0205 → 0.0225
- support.perCapita: 13,000 → 14,000
- support.cap:       240,000 → 260,000
- care.rate:         0.02（据え置き）
- care.perCapita:    15,000（据え置き）
- care.cap:          170,000（据え置き）
- childcare（フラット）→ childcareLevy（新方式 perCapitaAdult あり）への構造変更:
  - 旧: `childcare: { rate: 0, perCapita: 0, household: 0 }`
  - 新: `childcareLevy: { rate: 0.003, perCapita: 1855, perCapitaAdult: 89, perCapitaAdultScope: "all_ages", household: 0 }`
  - 大人 1 人あたり = perCapita + perCapitaAdult = 1,855 + 89 = 1,944 円
  - 18歳未満は formula 上 0 算入（kokuho.js の `adults * (perCapita + perCapitaAdult)` 機構）
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
medical.cap が国標準と異なる点は要記録: 小金井市は R8 でも 670,000 円を維持（公式ページで明示）。validator は WARN するが、公式値として正しい。
childcareLevy は新方式（三鷹市・府中市と同じ pattern）で、`adults * (perCapita + perCapitaAdult)` で 1,944 円 × 大人数の課税。
軽減判定基準は R8 国基準を最初から適用（issue #6・PR #7 と同期）。
