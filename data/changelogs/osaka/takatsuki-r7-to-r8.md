# 高槻市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.takatsuki.osaka.jp/soshiki/31/2366.html
- 補助 URL: https://www.pref.osaka.lg.jp/o100080/kokuho/iryouseido/hokenryouritsu/hokenryouritsu2.html
- publishedAt: 未確認（公式ページ最終更新日が HTML 表示されないため）
- checkedAt: 2026-05-15

## changed fields

```
- medical.rate:      0.0930 → 0.0950  (+0.20pt)
- medical.perCapita: 34,424 → 34,990  (+566)
- medical.household: 33,574 → 33,908  (+334)
- medical.cap:       670,000 → 660,000  (-10,000 R7 残骸の是正 = R8 国標準 660,000 への合わせ込み)
- support.rate:      0.0302 → 0.0306  (+0.04pt)
- support.perCapita: 11,034 → 11,191  (+157)
- support.household: 10,761 → 10,845  (+84)
- support.cap:       240,000 → 260,000  (+20,000)
- care.rate:         0.0256 → 0.0260  (+0.04pt)
- care.perCapita:    18,784 → 18,682  (▲102 大阪府公式の R7→R8 改定差と一致)
- care.cap:          170,000 (据え置き)
- caps.childcare:    30,000 (R8 新設・据え置き)
- childcare（フラット 0/0/0）→ childcareLevy（新方式 perCapitaAdult あり）への構造変更:
  - 旧: childcare: { rate: 0, perCapita: 0, household: 0 }  ← R7 段階で未設定値
  - 新: childcareLevy: { rate: 0.0028, perCapita: 1745, perCapitaAdult: 96, perCapitaAdultScope: "all_ages", household: 0 }
  - 18歳以上 1 人あたり = perCapita + perCapitaAdult = 1,745 + 96 = 1,841 円
  - 18歳未満は全額軽減（formula 上 adults のみ計算対象）
- reduction.standards.fiveTenths.perPersonAdd: 310,000 (据え置き・R8 国基準)
- reduction.standards.twoTenths.perPersonAdd:  570,000 (据え置き・R8 国基準)
```

## meta updates

- meta.dataVersion: 2.0.0 → 2.0.1
- meta.status: needs_update → verified
- meta.lifecycle.updatedAt: 2026-04-08 → 2026-05-15
- meta.lifecycle.r8Stage: (none) → verified_r8
- meta.lifecycle.sourceStatus: (none) → official_rate_page
- meta.lifecycle.sourceUrls: (none) → 高槻市公式 + 大阪府公式 (上記 URL)
- meta.lifecycle.previousYearTemplate: (none) → false
- meta.lifecycle.r8Updated: (none) → true
- meta.lifecycle.verifiedAt: (none) → 2026-05-15
- meta.lifecycle.verificationLevel: (none) → official_source_checked
- meta.source: type "estimated" → "official"、title/url/publishedAt を高槻市公式に
- meta.audit: 空 → verifiedBy: civic-rule-lab, verifiedAt: 2026-05-15, method: official-page
- meta.quality: 0.5/partial → 0.95/full
- meta.notes: R7→R8 移行プレースホルダ → 大阪府統一料率の R8 確定情報に書き換え
- top-level note: 賦課限度額 R7 表記 (650000/240000) → R8 表記 (660000/260000/170000/30000)

## verification

- r8Stage: verified_r8
- test: passed（integrity test 22/22 PASS）
- verifiedAt: 2026-05-15
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

高槻市は大阪府の府内統一保険料率（R6 から施行）の適用市。R8 値は大阪府公式テーブル（pref.osaka.lg.jp/o100080/.../hokenryouritsu2.html）と高槻市公式「国民健康保険料の算定方法」ページの両方で確認した。

### childcareLevy 内訳の根拠

大阪府公式テーブルは子ども分の均等割を「1,841円」（合計値）でのみ掲載しており、内訳の指定はない。本 PR では osaka と同じ breakdown（perCapita 1,745円 + perCapitaAdult 96円）を採用した:
- 計算結果に影響なし（合計 1,841円 / 18歳以上のみ課税）
- osaka と consistency を保つことで JSON データの統一感を維持
- 大阪市公式「保険料の決め方」ページに「均等割 1,745円 + 18歳以上 96円」と二段で書かれていたため osaka では breakdown が直接確認できている

ただし高槻市公式ページの内訳表記は未確認。万一高槻市公式に独自 breakdown 表記があれば、後日訂正することを推奨。calculation result への影響はない。

### R7→R8 改定の検証

大阪府公式テーブルの () 内に R7 → R8 の増減が明示されており、本 PR の差分はそれと完全一致:
- 医療: +0.20% / +566円 / +334円 / +1万円
- 後期: +0.04% / +157円 / +84円 / +2万円
- 介護: +0.04% / ▲102円 / ±0
- 子ども: 新設
