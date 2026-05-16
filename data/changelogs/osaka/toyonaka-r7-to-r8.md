# 豊中市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.toyonaka.osaka.jp/kenko/kokuho/topics/hokennryokaiseiten.html
- 補助 URL: https://www.pref.osaka.lg.jp/o100080/kokuho/iryouseido/hokenryouritsu/hokenryouritsu2.html
- publishedAt: 未確認（公式ページ最終更新日が HTML 表示されないため）
- checkedAt: 2026-05-15

## changed fields

```
- medical.rate:      0.0930 → 0.0950  (+0.20pt)
- medical.perCapita: 34,424 → 34,990  (+566)
- medical.household: 33,574 → 33,908  (+334)
- medical.cap:       670,000 → 660,000  (-10,000 R7 残骸の是正)
- support.rate:      0.0302 → 0.0306  (+0.04pt)
- support.perCapita: 11,034 → 11,191  (+157)
- support.household: 10,761 → 10,845  (+84)
- support.cap:       240,000 → 260,000  (+20,000)
- care.rate:         0.0256 → 0.0260  (+0.04pt)
- care.perCapita:    18,784 → 18,682  (▲102)
- care.cap:          170,000 (据え置き)
- caps.childcare:    30,000 (R8 新設・据え置き)
- childcare（フラット 0/0/0）→ childcareLevy（新方式 perCapitaAdult あり）への構造変更:
  - 新: childcareLevy: { rate: 0.0028, perCapita: 1745, perCapitaAdult: 96, perCapitaAdultScope: "all_ages", household: 0 }
  - 18歳以上 1 人あたり = 1,745 + 96 = 1,841 円
- reduction.standards.fiveTenths.perPersonAdd: 310,000 (据え置き・R8 国基準)
- reduction.standards.twoTenths.perPersonAdd:  570,000 (据え置き・R8 国基準)
```

## meta updates

- meta.dataVersion: 2.0.0 → 2.0.1
- meta.status: needs_update → verified
- meta.lifecycle: r8Stage / sourceStatus / sourceUrls / previousYearTemplate / r8Updated / verifiedAt / verificationLevel を新規追加
- meta.source: type estimated → official、豊中市公式 URL に設定
- meta.audit: civic-rule-lab / 2026-05-15 / official-page
- meta.quality: 0.5/partial → 0.95/full
- meta.notes: 豊中市公式 R8 改正点ページの数値で書き換え
- top-level note: R8 値に更新

## verification

- r8Stage: verified_r8
- test: passed（integrity test 22/22 PASS）
- verifiedAt: 2026-05-15
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

豊中市公式「令和8年度国民健康保険料の改正点について」ページは **R7 → R8 の対比形式で改正内容を明示している**ため、本 PR の R8 値の主要 ground truth として採用した。大阪府公式テーブルとも完全一致。

### childcareLevy 内訳の根拠

osaka の changelog と同様、大阪府公式テーブルは合計 1,841 円のみ掲載で内訳の指定なし。osaka と同じ breakdown (1,745 + 96 / scope all_ages) を採用し、5 市の府内統一料率市と consistency を保つ。calculation 結果は 1,841円 / 18歳以上 で同一。豊中市公式の独自 breakdown 表記は未確認のため、後日確認した上で異なれば訂正可能（計算結果への影響なし）。
