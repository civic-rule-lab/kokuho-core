# 青梅市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.ome.tokyo.jp/soshiki/18/711.html
- publishedAt: 2026-03-27（公式ページ更新日）
- checkedAt: 2026-05-15

## changed fields

- medical.rate:      0.0637（R7 と同値据え置き）
- medical.perCapita: 34,400（R7 と同値据え置き）
- medical.cap:       670,000（青梅市独自・国標準 660,000 より上方、据え置き）
- support.rate:      0.0217（R7 と同値据え置き）
- support.perCapita: 12,700（R7 と同値据え置き）
- support.cap:       260,000（R7 と同値据え置き）
- care.rate:         0.0203（R7 と同値据え置き）
- care.perCapita:    13,800（R7 と同値据え置き）
- care.cap:          170,000（据え置き）
- childcare:         { rate: 0, perCapita: 0, household: 0 }
                  → { rate: 0.0031, perCapita: 2,014, household: 0, under18Reduction: true }
  - 子ども・子育て支援金分新設、18歳未満は全額軽減（under18Reduction: true）
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

青梅市は medical/support/care の rate/perCapita/cap が R7 値と完全一致。R8 で料率変更なし、子ども分新設のみ。
medical.cap = 670,000 円は国標準 660,000 と異なる青梅市独自値（公式ページで明示）。validator は WARN するが正規 R8 値。
