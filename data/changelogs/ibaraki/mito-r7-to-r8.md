# 水戸市 R7 → R8 lifecycle retrofit

## source

- sourceStatus: official_rate_page
- URL: https://www.city.mito.lg.jp/site/kokuho/3055.html
- 既存 audit 記録（前セッションで R8 値検証済）: verifiedAt 2026-05-09, method official-site
- 値クロスチェック: 2026-05-21（r8-values-collected-2026-05-21.md A 分類 #6h で全項目再確認、対比一致）
- checkedAt: 2026-05-25（本 retrofit 適用日）

## changed fields（本 retrofit commit）

制度値（rate / perCapita / household / caps / childcare）は触らない。前セッションで既に R8 公式値に反映済み:

- medical: rate 0.0785, perCapita 31,600, household 0, cap 670,000
- support: rate 0.0350, perCapita 13,700, household 0, cap 260,000
- care:    rate 0.0237, perCapita 16,300, household 0, cap 170,000
- childcare: rate 0.0023, perCapita 1,700, household 0
- caps.childcare: 30,000
- preschoolReduction: 国基準（医療・後期支援 perCapita 5 割減）
- reduction.standards: R8 国基準（5 割 310,000・2 割 570,000）に同期済

本 commit で適用される変更（メタのみ）:

- meta.dataVersion: `2.0.0` → `2.0.1`
- meta.lifecycle.updatedAt: `2026-05-09` → `2026-05-25T00:00:00.000Z`
- meta.lifecycle.r8Stage: 新規 `"verified_r8"`
- meta.lifecycle.sourceStatus: 新規 `"official_rate_page"`
- meta.lifecycle.sourceUrls: 新規 `["https://www.city.mito.lg.jp/site/kokuho/3055.html"]`
- meta.lifecycle.previousYearTemplate: 新規 `false`
- meta.lifecycle.r8Updated: 新規 `true`
- meta.lifecycle.verifiedAt: 新規 `"2026-05-21"`（値クロスチェック日）
- meta.lifecycle.verificationLevel: 新規 `"official_source_checked"`

reduction.standards は PR #19 で全国一括で R8 国基準（5 割 310,000・2 割 570,000）に同期済。

## notes

水戸市は **2 方式（平等割なし）** の独自運用。医療分・後期支援分・介護分すべて household = 0。

**水戸市独自の特殊事項（schema 表現の限界含む）:**

- 後期支援分上限が R7 24 万 → R8 26 万に引上げ済（公式ページ記載、JSON 反映済）
- 医療・後期支援の均等割は「18 歳まで」半額という独自軽減（国の未就学児 5 割減額とは別の独自措置）。現行 schema は `preschoolReduction` のみで、18 歳までの半額軽減は schema 拡張待ち（v0.6 RFC §2 関連）
- 子ども・子育て支援金分は 18 歳未満全額軽減（perCapita は 18 歳以上に賦課）
- これらの schema 表現は v0.6 RFC で議論継続中。本 retrofit では構造値は変えず、lifecycle メタのみ更新

PR #2 で導入した R8 検証 lifecycle（meta.lifecycle.r8Stage 系）が未整備だったため、kunitachi / chiba 等と同じ pattern で retrofit 適用。
