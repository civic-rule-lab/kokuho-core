# 船橋市 R7 → R8 lifecycle retrofit

## source

- sourceStatus: official_rate_page
- URL: https://www.city.funabashi.lg.jp/kenkou/kokuho/002/p001880.html
- 既存 audit 記録（前セッションで検証済）: verifiedAt 2026-04-08, method official-site
- checkedAt: 2026-05-15（本 retrofit 適用日）

## changed fields（本 retrofit commit）

制度値（rate / perCapita / caps / childcare）は触らない。前セッションで既に R8 公式値に反映済み:
- medical: rate 0.0705, perCapita 39,300, household 0, cap 670,000（船橋市独自・国標準より上方）
- support: rate 0.0274, perCapita 12,700, household 0, cap 260,000
- care:    rate 0.0188, perCapita 13,900, household 0, cap 170,000
- childcare: rate 0.0027, perCapita 1,800, household 0, cap 30,000（18 歳未満免除）

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

船橋市は中核市で、平等割なし（2 方式）。子育て支援金分の 18 歳未満免除が note に明記されているが、現 schema の `childcare`（フラット）形式では `under18Reduction: true` フィールドが無いため、計算上は 18 歳未満も均等割対象になる。
将来的に `childcare.under18Reduction: true` を立てる、または `childcareLevy` 新方式（perCapitaAdult）に移行する検討余地あり（本 retrofit ではスコープ外、別 commit）。
caps.medical = 670,000 円は国標準 660,000 より上方の船橋市独自値。
PR #2 で導入した R8 検証 lifecycle（meta.lifecycle.r8Stage 系）が未整備だったため、kunitachi 等と同じ pattern で retrofit 適用。
