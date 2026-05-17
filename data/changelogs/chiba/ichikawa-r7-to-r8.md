# 市川市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL (一次抽出元): https://www.city.ichikawa.lg.jp/page/4191.html
- 補助 URL: https://www.city.ichikawa.lg.jp/pub04/1111000007.html (国保税概要)
- publishedAt: 未確認
- checkedAt: 2026-05-15

## changed fields

```
- medical.rate:      0.0750 (据え置き)
- medical.perCapita: 12,000 (据え置き)
- medical.household: 20,400 (据え置き・通常世帯)
- medical.cap:       670,000 (据え置き)
- support.rate:      0.0190 (据え置き)
- support.perCapita: 8,800 (据え置き)
- support.cap:       260,000 (据え置き)
- care.rate:         0.0205 (据え置き)
- care.perCapita:    13,600 (据え置き)
- care.cap:          170,000 (据え置き)
- caps.childcare:    30,000 (R8 新設・据え置き)
- childcare(フラット 0/0/0) → childcareLevy(新方式) に構造変更:
  - 新: { rate: 0.0023, perCapita: 2000, perCapitaAdult: 100, perCapitaAdultScope: "all_ages", household: 0 }
  - 18 歳以上 1 人あたり = perCapita + perCapitaAdult = 2,000 + 100 = 2,100 円
  - 18 歳未満は formula 上除外
- reduction.standards.fiveTenths.perPersonAdd: 310,000 (据え置き・R8 国基準)
- reduction.standards.twoTenths.perPersonAdd:  570,000 (据え置き・R8 国基準)
```

## meta updates

- meta.dataVersion: 2.0.0 → 2.0.1
- meta.status: needs_update → verified
- meta.lifecycle: 全 R8 lifecycle フィールドを新規追加
- meta.source: estimated → official、市川市公式 pub04/1111000007.html
- meta.audit: civic-rule-lab / 2026-05-15 / official-page
- meta.quality: 0.5/partial → 0.95/full
- meta.notes: 市川市公式の R8 制度内容で書き換え
- top-level note: 千葉県独自料率・R8 据え置き(子ども分のみ新設)を明記

## verification

- r8Stage: verified_r8
- test: passed (integrity test 22/22 PASS)
- verifiedAt: 2026-05-15
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

市川市公式「国民健康保険税について」ページで医療・後期・介護・子ども分の全項目を直接確認した。R8 では主要 4 区分 (医療・後期・介護) はすべて R7 から **据え置き**で、子ども・子育て支援金分のみが R8 で新設された。

### 子ども分の構造 (公式ページより)

```
子ども・子育て支援金分 (賦課限度額3万円)
  所得割 0.23%
  均等割 2,000円 × 子ども分該当者数
  18歳以上均等割 100円 × 子ども分該当者数
  ※「子ども分該当者」= 18歳に達する日以後の最初の3月31日までにある方を除く被保険者 = 18歳以上
```

→ childcareLevy 新方式 (matsudo / kashiwa / osaka と同パターン) で表現:
- perCapita: 2,000
- perCapitaAdult: 100
- scope: all_ages
- 18 歳以上 1 人 → adults × (2,000 + 100) = adults × 2,100 ✓

### 軽減判定 (公式ページより)

> 43万円 + 10万円 × (給与所得者等の数 − 1) 以下	7割軽減
> 43万円 + (31万円 × 国保加入者数) + 10万円 × (給与所得者等の数 − 1) 以下	5割軽減
> 43万円 + (57万円 × 国保加入者数) + 10万円 × (給与所得者等の数 − 1) 以下	2割軽減

→ R8 国基準 (5割 310,000 / 2割 570,000) と完全一致 ✓

### 注意点

- 医療.household 20,400 は **通常世帯** の値。市川市は「特定世帯 10,200円 (1/2 軽減)・特定継続世帯 15,300円 (1/4 軽減)」の特殊扱いがあるが、現行 schema (household: 単一値) は通常世帯のみ表現。特殊世帯対応は engine 側のオプション拡張があれば検討対象。
- Earlier agent 調査は「R7 で medical.cap は 660,000」と推定したが、公式ページで明確に 67万円 (670,000) と R7 から確認された。**agent 推定の R7 値は誤り**だった (matsudo の事例と同じ教訓)。

### 千葉県の料率方式について

千葉県は大阪府と異なり **府内統一料率方式ではない**。各市町村が独自設定し、千葉県は標準保険料率 (参考値) のみ公表。市川市の R8 料率は県標準ではなく市川市独自値。
