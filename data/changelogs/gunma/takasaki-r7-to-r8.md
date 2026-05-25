# 高崎市 R7 → R8 lifecycle retrofit

## source

- sourceStatus: official_rate_page
- URL: https://www.city.takasaki.gunma.jp/page/3606.html
- 追加 URL: https://www.city.takasaki.gunma.jp/page/3607.html
- 追加 URL: https://www.city.takasaki.gunma.jp/uploaded/attachment/37655.xlsx
- 既存 audit 記録(前セッションで R8 値検証済): verifiedAt 2026-05-11, method official-site
- 値クロスチェック: 2026-05-21(r8-values-collected-2026-05-21.md A 分類 #6m で全項目再確認、対比一致)
- checkedAt: 2026-05-25(本 retrofit 適用日)

## changed fields(本 retrofit commit)

制度値(rate / perCapita / household / caps / childcare)は触らない。前セッションで既に R8 公式値に反映済み。

本 commit で適用される変更(メタのみ):

- meta.dataVersion: `2.0.0` → `2.0.1`
- meta.lifecycle.updatedAt: `2026-05-11` → `2026-05-25T00:00:00.000Z`
- meta.lifecycle.r8Stage: 新規 `"verified_r8"`
- meta.lifecycle.sourceStatus: 新規 `"official_rate_page"`
- meta.lifecycle.sourceUrls: 新規 (上記 3 件の URL 配列)
- meta.lifecycle.previousYearTemplate: 新規 `false`
- meta.lifecycle.r8Updated: 新規 `true`
- meta.lifecycle.verifiedAt: 新規 `"2026-05-21"`(md クロスチェック日)
- meta.lifecycle.verificationLevel: 新規 `"official_source_checked"`

reduction.standards は PR #19 で全国一括で R8 国基準(5 割 310,000 / 2 割 570,000)に同期済。

## notes

群馬県中核市、平等割あり全カテゴリ(前橋と同じ群馬パターン)、医療限度額 R7 66 万 → R8 67 万到達(国基準達成)、18 歳以上加算 100 円。

PR #2 で導入した R8 検証 lifecycle(meta.lifecycle.r8Stage 系)が未整備だったため、kunitachi / chiba / mito (PR #93) 等と同じ pattern で retrofit 適用。
