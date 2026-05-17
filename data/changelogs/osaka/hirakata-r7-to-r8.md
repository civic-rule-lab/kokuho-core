# 枚方市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.hirakata.osaka.jp/0000037140.html
- 補助 URL: https://www.pref.osaka.lg.jp/o100080/kokuho/iryouseido/hokenryouritsu/hokenryouritsu2.html
- publishedAt: 未確認
- checkedAt: 2026-05-15

## changed fields

```
- medical.rate:      0.0930 → 0.0950
- medical.perCapita: 34,424 → 34,990
- medical.household: 33,574 → 33,908  ← 公式ページで直接確認
- medical.cap:       670,000 → 660,000  ← 公式ページで直接確認
- support.rate:      0.0302 → 0.0306  ← 公式ページで直接確認
- support.perCapita: 11,034 → 11,191
- support.household: 10,761 → 10,845
- support.cap:       240,000 → 260,000
- care.rate:         0.0256 → 0.0260
- care.perCapita:    18,784 → 18,682
- caps.childcare:    30,000 (R8 新設・据え置き)
- childcare（フラット 0/0/0）→ childcareLevy（新方式）への構造変更:
  - 新: { rate: 0.0028, perCapita: 1745, perCapitaAdult: 96, perCapitaAdultScope: "all_ages", household: 0 }
- reduction.standards: 5割 310,000 / 2割 570,000 (R8 国基準・据え置き)
```

## meta updates

- meta.dataVersion: 2.0.0 → 2.0.1
- meta.status: needs_update → verified
- meta.lifecycle: 全 R8 lifecycle フィールドを新規追加
- meta.source: estimated → official
- meta.audit: civic-rule-lab / 2026-05-15 / official-page
- meta.quality: 0.5/partial → 0.95/full

## verification

- r8Stage: verified_r8
- test: passed
- verifiedAt: 2026-05-15
- verificationLevel: official_source_checked

## notes

枚方市公式「令和8年度の国民健康保険料について」専用ページ (0000037140.html) で、医療分平等割 33,908円・賦課限度額 660,000円・後期支援分所得割 3.06% などの数値が直接確認できた。大阪府公式 R8 統一保険料率テーブルとも完全一致。

### childcareLevy 内訳の根拠

osaka と同じ breakdown (1,745 + 96 / scope all_ages) を採用。府公式テーブルは合計 1,841円 のみで内訳指定なし。枚方市公式の独自 breakdown 表記は未確認のため、後日確認した上で異なれば訂正可能（calculation 結果への影響なし）。
