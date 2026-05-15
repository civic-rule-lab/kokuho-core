# 西東京市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.nishitokyo.lg.jp/kurasi/kokuho/kokuminnkenkouhokeryou/sansyutu_osamekata/sansyutuhouhou.html
- 補助 URL（子ども・子育て支援金制度）: https://www.city.nishitokyo.lg.jp/kurasi/kokuho/kodomokosodate.html
- publishedAt: 2026-05-15（公式ページの厳密な改訂日が明示されていないため checkedAt 同日扱い）
- checkedAt: 2026-05-15

## changed fields

- medical.rate:      0.0541 → 0.0563
- medical.perCapita: 31,600 → 33,100
- medical.cap:       670,000（西東京市独自・国標準 660,000 より上方、据え置き）
- support.rate:      0.0168 → 0.0181
- support.perCapita: 6,500 → 7,600（他自治体より低水準だが公式値）
- support.cap:       260,000（据え置き）
- care.rate:         0.0164 → 0.0172
- care.perCapita:    14,300 → 14,600
- care.cap:          170,000（据え置き）
- childcare:         { rate: 0, perCapita: 0, household: 0 }
                  → { rate: 0.003, perCapita: 1,900, household: 0, under18Reduction: true }
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

⚠️ **西東京市は『国民健康保険「料」』方式**（他多くの自治体は「税」方式）。
現行 schema は `system: "kokuho"` 統一で「料」「税」の区別はなく、計算挙動も同じ（地方税法ベースの算定構造は税/料いずれも同様）。本 commit では meta.notes に記録のみ。
将来的に税/料の区分を schema レベルで管理したい場合は、`system: "kokuho"` を `kokuho-tax` / `kokuho-premium` 等に細分化する別 PR で対応。

support.perCapita = 7,600 円は他多摩地区より大幅に低い水準だが、公式ページで明示された値。
medical.cap = 670,000 円は国標準と異なる西東京市独自値（validator は WARN するが正規 R8 値）。
子ども分は補助ページ /kodomokosodate.html で構造詳細を確認。
