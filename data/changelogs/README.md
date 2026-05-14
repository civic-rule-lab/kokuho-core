# data/changelogs/

R8（令和8年度・2026年度）以降の制度値更新における R(N-1) → R(N) 差分証跡を保管するディレクトリ。

JSON 自体は「現在の正データ」、changelog は「人間向けの差分証跡」、commit message は「作業単位の履歴」、と役割を分離する設計。差分情報を JSON 内に持たせると肥大化し、commit message だけだと検索性はあるが構造化された検証資料として弱いため、このディレクトリに外出しする。

## 配置規約

```
data/changelogs/{prefSlug}/{citySlug}-r{N-1}-to-r{N}.md
```

例:

```
data/changelogs/tokyo/tachikawa-r7-to-r8.md
data/changelogs/tokyo/musashino-r7-to-r8.md
data/changelogs/tokyo/mitaka-r7-to-r8.md
```

> 上記ファイル名は **example reference**。実値は本 README には記載せず、各 batch PR で当該 changelog を新規作成して埋める。インフラ層と data 層の scope を分離するため。

## テンプレート

```markdown
# {自治体名} R{N-1} → R{N} 差分

## source

- sourceStatus: {official_rate_page | official_rate_pdf | ordinance_after_revision | official_final_notice}
- URL: https://...
- checkedAt: YYYY-MM-DD

## changed fields

- medical.rate:      0.xxxx → 0.xxxx
- medical.perCapita: xx,xxx → xx,xxx
- medical.cap:       xxx,xxx → xxx,xxx
- support.rate:      0.xxxx → 0.xxxx
- support.perCapita: xx,xxx → xx,xxx
- care.rate:         0.xxxx → 0.xxxx
- ...
- childcareLevy: { ... } (R8 新設の場合は構造ごと追記)

## verification

- r8Stage: verified_r8
- test: passed
- verifiedAt: YYYY-MM-DD
```

## sourceStatus の出典ランク

`verified_r8` への昇格に使える 4 値:

- `official_rate_page` 公式の料率掲載ページ
- `official_rate_pdf` 公式料率表 PDF
- `ordinance_after_revision` 条例改正後ページ
- `official_final_notice` 公式確定通知

`extracted_r8` 止まり（`verified_r8` 禁止）の 5 値:

- `council_bill` `proposal_pdf` `draft_revision` `budget_material` `press_release`

`needs_update` / `source_found_r8` 止まりの 3 値:

- `no_r8_source` `secondary_source` `unclear_source`

`scripts/test-integrity.js` の G セクションが `verified_r8` 自治体に対してこれらの整合性を検証する。

## 関連

- `scripts/validate-kokuho-data.js` — `meta.lifecycle.*` の型/enum 認識
- `scripts/test-integrity.js` G セクション — `verified_r8` cross-field rule
- `registry/legacy-slug-collisions.json` — slug 衝突解消の運用記録
- project memory `project_r8_verification_workflow.md` — R8 検証ワークフロー全体方針
