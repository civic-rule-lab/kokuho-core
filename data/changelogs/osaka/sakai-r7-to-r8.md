# 堺市 R7 → R8 lifecycle retrofit

## source

- sourceStatus: official_rate_page
- URL: https://www.city.sakai.lg.jp/kurashi/honen/kokuho/hokenryo/shikumi.html
- 既存 audit 記録（前セッションで検証済）: verifiedAt 2026-04-08, method official-site
- checkedAt: 2026-05-15（本 retrofit 適用日）

## changed fields（本 retrofit commit）

制度値（rate / perCapita / household / caps / childcare）は触らない。前セッションで既に R8 公式値に反映済み:
- medical: rate 0.095, perCapita 34,990, household 33,908, cap 660,000
- support: rate 0.0306, perCapita 11,191, household 10,845, cap 260,000
- care:    rate 0.026, perCapita 18,682, household 0, cap 170,000
- childcare: rate 0.0028, perCapita 1,742, household 0, cap 30,000

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

## notes

note フィールドに「大阪府統一保険料率」と記載があるが、実値は大阪市と異なる（堺市独自の率／均等／平等）。
これは「大阪府統一」が将来構想を含むラベル表記の可能性あり、堺市は現状独自設定を維持。
caps は国標準（66 万 / 26 万 / 17 万）。
PR #2 で導入した R8 検証 lifecycle（meta.lifecycle.r8Stage 系）が未整備だったため、kunitachi 等と同じ pattern で retrofit 適用。
