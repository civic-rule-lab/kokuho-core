# 国立市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.kunitachi.tokyo.jp/soshiki/Dept03/Div04/Sec01/gyomu/0116/kokuhozei/1542343600065.html
- publishedAt: 2026-04-23（公式ページの既存 audit 記録、前セッションで検証済）
- checkedAt: 2026-05-14（本 retrofit 適用日）

## changed fields

### R7 (kokuho-2025.json) → R8 (kokuho-2026.json、前セッション既に反映済)

- medical.rate:      0.055 → 0.057
- medical.perCapita: 20,000 → 23,500
- medical.cap:       660,000 → 670,000（国立市独自・国標準 660,000 より上方）
- support.rate:      0.018 → 0.0195
- support.perCapita: 10,000 → 11,200
- support.cap:       260,000（据え置き）
- care.rate:         0.0185 → 0.0195
- care.perCapita:    11,000 → 12,000
- care.cap:          170,000（据え置き）
- childcare:         未定義 → { rate: 0.0029, perCapita: 1,931, household: 0 }（18歳未満全額軽減後の表示）

### 本 retrofit commit で適用される変更（メタ + 軽減判定）

- meta.dataVersion: 2.0.0 → 2.0.1
- meta.lifecycle.updatedAt: 2026-05-10 → 2026-05-14
- meta.lifecycle.r8Stage: 新規 `verified_r8`
- meta.lifecycle.sourceStatus: 新規 `official_rate_page`
- meta.lifecycle.sourceUrls: 新規 (上記 URL を配列で記録)
- meta.lifecycle.previousYearTemplate: 新規 `false`
- meta.lifecycle.r8Updated: 新規 `true`
- meta.lifecycle.verifiedAt: 新規 `"2026-05-14"`
- meta.lifecycle.verificationLevel: 新規 `"official_source_checked"`
- reduction.standards.fiveTenths.perPersonAdd: 305,000 → 310,000（R8 国基準）
- reduction.standards.twoTenths.perPersonAdd:  560,000 → 570,000（R8 国基準）

## verification

- r8Stage: verified_r8
- test: passed
- verifiedAt: 2026-05-14（retrofit 適用日）
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

国立市の保険税率は前セッションで既に R8 値に更新されており（audit.verifiedAt: 2026-05-10）、本 commit はその retrofit。
batch-01 (PR #2) で導入した R8 検証ライフサイクル（meta.lifecycle.r8Stage 系）が未整備だったため、後付けで適用。
あわせて軽減判定基準を R8 国基準 (310,000 / 570,000) に同期（issue #6・PR #7 と整合）。

⚠️ user 提示の最新確認では公式ページの「更新: 2026年4月1日」とされているが、既存 audit 記録（publishedAt: 2026-04-23）を保持。公式ページが複数の更新日を持つ可能性あり。

medical.cap = 670,000 円は国立市独自値（公式ページで明示、国標準 660,000 より上方）。validator は WARN するが正規 R8 値。
