# 相模原市 R7 → R8 lifecycle retrofit

## source

- sourceStatus: official_rate_page
- URL: https://www.city.sagamihara.kanagawa.jp/kurashi/1026448/kokuho/1007820/1007822.html

- 既存 audit 記録(前セッションで R8 値検証済): verifiedAt 2026-04-08, method official-site
- 値クロスチェック: 2026-05-21(r8-values-collected-2026-05-21.md A 分類 #6e で全項目再確認、対比一致)
- checkedAt: 2026-05-25(本 retrofit 適用日)

## changed fields(本 retrofit commit)

制度値(rate / perCapita / household / caps / childcare)は触らない。前セッションで既に R8 公式値に反映済み。

本 commit で適用される変更(メタのみ):

- meta.dataVersion: `2.0.0` → `2.0.1`
- meta.lifecycle.updatedAt: `2026-04-08` → `2026-05-25T00:00:00.000Z`
- meta.lifecycle.r8Stage: 新規 `"verified_r8"`
- meta.lifecycle.sourceStatus: 新規 `"official_rate_page"`
- meta.lifecycle.sourceUrls: 新規 (上記 1 件の URL 配列)
- meta.lifecycle.previousYearTemplate: 新規 `false`
- meta.lifecycle.r8Updated: 新規 `true`
- meta.lifecycle.verifiedAt: 新規 `"2026-05-21"`(md クロスチェック日)
- meta.lifecycle.verificationLevel: 新規 `"official_source_checked"`

reduction.standards は PR #19 で全国一括で R8 国基準(5 割 310,000 / 2 割 570,000)に同期済。

## notes

神奈川県政令指定都市、18 歳未満(高校生世代まで)は子ども分均等割全額免除、18 歳以上加算 60 円(sakai pattern)、未就学児は医療分・支援分均等割を 5 割減額(国基準)。

PR #2 で導入した R8 検証 lifecycle(meta.lifecycle.r8Stage 系)が未整備だったため、kunitachi / chiba / mito (PR #93) 等と同じ pattern で retrofit 適用。
