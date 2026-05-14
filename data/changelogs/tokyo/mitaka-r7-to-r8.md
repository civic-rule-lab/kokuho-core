# 三鷹市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.mitaka.lg.jp/c_service/000/000431.html
- publishedAt: 2026-05-14（公式ページの厳密な改訂日が明示されていないため checkedAt と同日扱い）
- checkedAt: 2026-05-14

## changed fields

- medical.rate:      0.061（据え置き）
- medical.perCapita: 29,000（据え置き）
- medical.cap:       670,000 → 660,000（R8 国標準への合わせ込み）
- support.rate:      0.023（据え置き）
- support.perCapita: 11,800（据え置き）
- support.cap:       260,000（据え置き）
- care.rate:         0.016（据え置き）
- care.perCapita:    13,400（据え置き）
- care.cap:          170,000（据え置き）
- childcare（フラット）→ childcareLevy（新方式 perCapitaAdult あり）への構造変更:
  - 旧: `childcare: { rate: 0, perCapita: 0, household: 0 }`
  - 新: `childcareLevy: { rate: 0.003, perCapita: 1846, perCapitaAdult: 98, perCapitaAdultScope: "all_ages", household: 0 }`
  - 大人 1 人あたり = perCapita + perCapitaAdult = 1,846 + 98 = 1,944 円
  - 18歳到達後の最初の3/31以前の被保険者は均等割 10割軽減（formula 上 adults のみ計算対象）

## verification

- r8Stage: verified_r8
- test: passed
- verifiedAt: 2026-05-14
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

medical/support/care は R7 値と完全一致。医療上限のみ R8 国標準合わせで 670,000 → 660,000。
childcareLevy は R8 新設で構造ごと追加。`perCapitaAdult + perCapitaAdultScope: "all_ages"` の新方式は kokuho.js の既存サポート機構（京都市等で利用）で計算可能。

## addendum (2026-05-14, R8 国基準軽減判定値の修正)

batch-01 初版で `reduction.standards.{fiveTenths,twoTenths}.perPersonAdd` が R7 国基準のまま残っていたため、三鷹市公式ページの記載（「31万円×（被保険者数）」「57万円×（被保険者数）」）と整合させて R8 公式値に修正。

- reduction.standards.fiveTenths.perPersonAdd: 305,000 → 310,000
- reduction.standards.twoTenths.perPersonAdd:  560,000 → 570,000

軽減判定基準は国の統一基準で自治体ごとには変わらないため、立川市・武蔵野市も同時修正。
全国一括適用（残り 1725 自治体）は別 issue で管理。
