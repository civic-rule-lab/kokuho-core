# 柏市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL: https://www.city.kashiwa.lg.jp/hokennenkin/kaitei/r8kaitei.html
- 補助 URL (R8 試算): https://www.city.kashiwa.lg.jp/hokennenkin/hokennenkin/kokuho/hokenryo/hokenryosante.html
- publishedAt: 未確認
- checkedAt: 2026-05-15

## changed fields

```
- medical.rate:      0.0711 → 0.0720  (+0.09pt)
- medical.perCapita: 29,340 → 30,000  (+660)
- medical.household: 13,740 → 14,340  (+600)
- medical.cap:       660,000 → 670,000  (+10,000 = R7 66万 → R8 67万)
- support.rate:      0.0264 → 0.0268  (+0.04pt)
- support.perCapita: 14,160 → 14,520  (+360)
- support.cap:       260,000 (据え置き)
- care.rate:         0.0212 → 0.0217  (+0.05pt)
- care.perCapita:    15,780 → 16,260  (+480)
- care.cap:          170,000 (据え置き)
- caps.childcare:    30,000 (R8 新設・据え置き)
- childcare(フラット 0/0/0) → childcareLevy(新方式) に構造変更:
  - 新: { rate: 0.0027, perCapita: 1800, perCapitaAdult: 84, perCapitaAdultScope: "all_ages", household: 0 }
  - 18 歳以上 1 人あたり = perCapita + perCapitaAdult = 1,800 + 84 = 1,884 円
  - 18 歳未満は formula 上除外 (10割軽減・「当該軽減に要する費用は18歳以上被保険者に賦課」)
- reduction.standards.fiveTenths.perPersonAdd: 310,000 (据え置き・R8 国基準)
- reduction.standards.twoTenths.perPersonAdd:  570,000 (据え置き・R8 国基準)
```

## meta updates

- meta.dataVersion: 2.0.0 → 2.0.1
- meta.status: needs_update → verified
- meta.lifecycle: 全 R8 lifecycle フィールドを新規追加
- meta.source: estimated → official、柏市公式 r8kaitei.html
- meta.audit: civic-rule-lab / 2026-05-15 / official-page
- meta.quality: 0.5/partial → 0.95/full
- meta.notes: 柏市公式の R7→R8 対比表で書き換え
- top-level note: 柏市独自料率・R6-R11 段階的改定計画・1人当たり平均約7,000円増を明記

## verification

- r8Stage: verified_r8
- test: passed (integrity test 22/22 PASS)
- verifiedAt: 2026-05-15
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

柏市公式「令和8年度国民健康保険料率・料額」ページ (r8kaitei.html) は R7 (改定前) → R8 (改定後) → 増減 → 県標準保険料率 の対比表形式で全項目掲載しており、本 PR の R8 値の ground truth として直接採用した。

### R8 改定の経緯と方針 (公式ページより)

> 平成30年度から、国民健康保険は市町村単位での運営から都道府県単位での運営に変わりました。... なかには、令和6年度から保険料水準の統一を実現した都道府県もあります。

千葉県は **R6 から保険料水準統一を実現した府県ではない**ため、柏市は独自料率を維持。県は標準保険料率 (参考値) を公表しているが、各市町村が独自に料率を設定する形式。柏市は R6-R11 段階的改定計画に基づき、毎年県標準に近づける方向で改定中。R8 は計画 3 年目で 1 人当たり平均約7,000円増の改定。

### 県標準保険料率との比較 (R8)

| 区分 | 柏市 R8 | 県標準 (参考) | 差 |
|---|---|---|---|
| 医療.所得割 | 7.20% | 7.76% | -0.56pt (柏市が低い) |
| 医療.均等割 | 30,000 | 34,157 | -4,157 |
| 医療.平等割 | 14,340 | 15,090 | -750 |
| 後期.所得割 | 2.68% | 2.81% | -0.13pt |
| 介護.所得割 | 2.17% | 2.36% | -0.19pt |
| 子ども.所得割 | 0.27% | 0.26% | +0.01pt |
| 子ども.均等割 | 1,800 | 2,004 | -204 |
| 子ども.18歳以上加算 | 84 | 155 | -71 |

柏市は県標準より一貫して低い設定。これは段階的改定計画の途上である(まだ完全には県標準に追いついていない)ことを意味する。

### 子ども分の構造 (公式ページより)

```
子ども・子育て支援納付金分 (賦課限度額3万円)
  所得割 0.27%
  均等割(※) 1,800円
  18歳以上均等割(※) 84円
  ※18歳未満の方については、子ども・子育て支援金分の均等割は全額軽減され、
    当該軽減に要する費用は18歳以上被保険者に対して18歳以上被保険者均等割額が賦課されます。
```

→ childcareLevy 新方式 (matsudo / ichikawa / osaka と同パターン) で表現:
- perCapita: 1,800 (18 歳未満は 10割軽減で実質 0)
- perCapitaAdult: 84 (18 歳以上加算・「軽減費用負担」相当)
- scope: all_ages
- 18 歳以上 1 人 → adults × (1,800 + 84) = adults × 1,884 ✓

### モデルケース (R7→R8 改定の影響)

公式ページに掲載された 3 モデルケースで R7→R8 で年間 +1,100〜+14,400 円 の増額。これは料率引き上げの影響を住民向けに具体的に示したもの。

### 千葉県の料率方式について

千葉県は大阪府と異なり **府内統一料率方式ではない**。柏市は R6 から段階的に県標準に近づける方針で改定を進めており、R11 (令和11年度) までに完全な統一を目指す。
