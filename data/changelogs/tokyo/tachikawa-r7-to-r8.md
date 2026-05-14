# 立川市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.tachikawa.lg.jp/kurashi/nenkin/1002478/1002510/1002554/1002560.html
- publishedAt: 2026-05-11（公式ページ更新日）
- checkedAt: 2026-05-14

## changed fields

- medical.rate:      0.0668 → 0.0685
- medical.perCapita: 32,500 → 34,200
- medical.cap:       670,000 → 660,000（R8 国標準への合わせ込み）
- support.rate:      0.0224 → 0.0229
- support.perCapita: 11,700 → 12,200
- support.cap:       230,000 → 250,000（立川市独自・国標準 260,000 とは異なる）
- care.rate:         0.017 → 0.0173
- care.perCapita:    14,500 → 14,800
- care.cap:          170,000（据え置き）
- childcare:         { rate: 0, perCapita: 0, household: 0 }
                  → { rate: 0.0031, perCapita: 2,000, household: 0, under18Reduction: true }
  - 4月1日現在18歳以上のみ均等割 2,000 円が課される構造
  - kokuho.js の `under18Reduction: true` 機構で「18歳未満を計算対象から除外」を実装

## verification

- r8Stage: verified_r8
- test: passed
- verifiedAt: 2026-05-14
- previousYearTemplate: false（R7 template 状態を脱した）
- r8Updated: true
- verificationLevel: official_source_checked

## notes

R7 値はすべて template_r7 状態（registry 自動生成時の仮置き値）。今回 R8 公式ページで全項目を verified 化。
support.cap が国標準と異なる点は要記録: 立川市は R8 で 250,000 円を採用（公式ページで明示）。

## addendum (2026-05-14, R8 国基準軽減判定値の修正)

batch-01 初版で `reduction.standards.{fiveTenths,twoTenths}.perPersonAdd` が R7 国基準のまま残っていたため、R8 公式値（5割: 31万円、2割: 57万円）に修正。

- reduction.standards.fiveTenths.perPersonAdd: 305,000 → 310,000
- reduction.standards.twoTenths.perPersonAdd:  560,000 → 570,000

軽減判定基準は国の統一基準で自治体ごとには変わらないため、立川市公式ページの記載と独立して全国共通の改正。三鷹市公式ページ確認時に発覚し、立川市・武蔵野市も同時修正。
全国一括適用（残り 1725 自治体）は別 issue で管理。
