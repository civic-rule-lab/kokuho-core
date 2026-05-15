# 大阪市 R7 → R8 lifecycle retrofit

## source

- sourceStatus: official_rate_page
- URL: https://www.city.osaka.lg.jp/fukushi/page/0000624098.html
- 既存 audit 記録（前セッションで検証済）: verifiedAt 2026-04-08, method official-site
- checkedAt: 2026-05-15（本 retrofit 適用日）

## changed fields（本 retrofit commit）

制度値（rate / perCapita / household / caps / childcare）は触らない。前セッションで既に R8 公式値（大阪府統一保険料率）に反映済み:
- medical: rate 0.061, perCapita 43,500, household 28,500, cap 650,000（大阪市独自・上限低め）
- support: rate 0.021, perCapita 14,900, household 9,800, cap 220,000（大阪市独自）
- care:    rate 0.021, perCapita 17,100, household 0, cap 170,000
- childcare: rate 0.0046, perCapita 3,700, household 0, cap 37,000（大阪市独自上限）

本 commit で適用される変更（メタのみ）:
- meta.dataVersion: 2.0.0 → 2.0.1
- meta.lifecycle.updatedAt: 2026-04-08 → 2026-05-15
- meta.lifecycle.r8Stage: 新規 `verified_r8`
- meta.lifecycle.sourceStatus: 新規 `official_rate_page`
- meta.lifecycle.sourceUrls: 新規（上記 URL を配列で記録）
- meta.lifecycle.previousYearTemplate: 新規 `false`
- meta.lifecycle.r8Updated: 新規 `true`
- meta.lifecycle.verifiedAt: 新規 `"2026-05-15"`
- meta.lifecycle.verificationLevel: 新規 `"official_source_checked"`

reduction.standards は PR #19 で 全国一括で R8 国基準（5 割 310,000・2 割 570,000）に同期済。

## verification

- r8Stage: verified_r8
- test: passed
- verifiedAt: 2026-05-15（retrofit 適用日）
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

大阪府統一保険料率（R6 より施行）。43 自治体共通の rate / perCapita / household が前提だが、
caps（賦課限度額）は自治体ごとに独自設定が可能で、大阪市は medical 65 万・support 22 万・childcare 3.7 万 を採用。
PR #2 で導入した R8 検証 lifecycle（meta.lifecycle.r8Stage 系）が未整備だったため、kunitachi 等と同じ pattern で retrofit 適用。
