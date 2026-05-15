# 千葉市 R7 → R8 lifecycle retrofit

## source

- sourceStatus: official_rate_page
- URL: https://www.city.chiba.jp/hokenfukushi/iryoeisei/hoken/hokenryou-ketteishimashita.html
- 既存 audit 記録（前セッションで検証済）: verifiedAt 2026-04-08, method official-site
- checkedAt: 2026-05-15（本 retrofit 適用日）

## changed fields（本 retrofit commit）

制度値（rate / perCapita / household / caps / childcare）は触らない。前セッションで既に R8 公式値に反映済み:
- medical: rate 0.0721, perCapita 23,280, household 26,640, cap 670,000（千葉市独自・国標準より上方）
- support: rate 0.0285, perCapita 8,880, household 10,320, cap 260,000
- care:    rate 0.0257, perCapita 16,560, household 0, cap 170,000
- childcare: rate 0.0031, perCapita 1,800, household 0, cap 30,000

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

千葉市は政令市で、医療分・支援分の両方に平等割（household）を設定する独自 3 方式（介護分のみ平等割なし）。
caps.medical = 670,000 円は国標準 660,000 より上方の千葉市独自値。
PR #2 で導入した R8 検証 lifecycle（meta.lifecycle.r8Stage 系）が未整備だったため、kunitachi 等と同じ pattern で retrofit 適用。
