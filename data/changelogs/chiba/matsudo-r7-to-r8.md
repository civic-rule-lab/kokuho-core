# 松戸市 R7 → R8 差分

## source

- sourceStatus: official_rate_page
- URL (一次・R7→R8 対比表): https://www.city.matsudo.chiba.jp/kurashi/hoken_nenkin/kokuho/oshirase/korona_hokenyuuyo.html
  - ※ URL slug は `korona_hokenyuuyo` だが、実体は「令和8年度国民健康保険料率について」のお知らせページ。CMS で旧ページの URL が流用されたとみられる。スクリーンショットでページタイトル・R7→R8 対比表・更新日 2026-04-24 を直接確認。
- 補助 URL (PDF 早見表・caps 確認用): https://www.city.matsudo.chiba.jp/kurashi/hoken_nenkin/kokuho/ryounosantei/ryouhayamihyou.html
  - 早見表 PDF: R8-sousyotoku-kyuuyo-d60e081f.pdf (賦課限度額 67万/26万/17万/3万を確認)
- publishedAt: 2026-04-24 (お知らせページ更新日)
- checkedAt: 2026-05-15

## changed fields

```
- medical.rate:      0.0762 (据え置き)
- medical.perCapita: 21,000 → 27,000  (+6,000)
- medical.household: 18,000 (据え置き)
- medical.cap:       670,000 (据え置き)
- support.rate:      0.0262 → 0.0286  (+0.24pt)
- support.perCapita: 12,000 → 15,000  (+3,000)
- support.household: 0 (据え置き)
- support.cap:       260,000 (据え置き)
- care.rate:         0.0181 → 0.0226  (+0.45pt)
- care.perCapita:    15,000 → 18,000  (+3,000)
- care.household:    0 (据え置き)
- care.cap:          170,000 (据え置き)
- caps.childcare:    30,000 (R8 新設・据え置き)
- childcare(フラット 0/0/0) → childcareLevy(新方式) に構造変更:
  - 新: { rate: 0.0031, perCapita: 1860, perCapitaAdult: 140, perCapitaAdultScope: "all_ages", household: 0 }
  - 18 歳以上 1 人あたり = perCapita + perCapitaAdult = 1,860 + 140 = 2,000 円
  - 18 歳未満は formula 上除外 (= 10割軽減)
- reduction.standards.fiveTenths.perPersonAdd: 310,000 (据え置き・R8 国基準)
- reduction.standards.twoTenths.perPersonAdd:  570,000 (据え置き・R8 国基準)
```

## meta updates

- meta.dataVersion: 2.0.0 → 2.0.1
- meta.status: needs_update → verified
- meta.lifecycle: 全 R8 lifecycle フィールドを新規追加
- meta.source: estimated → official、松戸市公式 hoken.html
- meta.audit: civic-rule-lab / 2026-05-15 / official-pdf
- meta.quality: 0.5/partial → 0.95/full
- meta.notes: PDF 確認後の R8 確定情報に書き換え
- top-level note: 千葉県独自料率方式・R8 改定内容を明記

## verification

- r8Stage: verified_r8
- test: passed (integrity test 22/22 PASS)
- verifiedAt: 2026-05-15
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

松戸市公式「令和8年度 松戸市国民健康保険料早見表」(PDF) の末尾に R8 料率表が掲載されており、医療・後期・介護・子ども分すべての所得割・均等割・平等割・賦課限度額を直接確認できた。さらに早見表本体の年間保険料計算結果 (40-64歳ありなし両方) が掲載されており、料率値の妥当性も間接的に検証できる。

### childcareLevy 内訳の根拠 (PDF 注釈)

> ※子ども分の均等割(2,000円)=均等割額(1,860円)+18歳以上均等割額(140円)

この明示的な内訳を JSON に正確に反映:
- perCapita: 1860 (18 歳未満は 10割軽減で実質 0)
- perCapitaAdult: 140 (18 歳以上加算)
- scope: all_ages (engine 上 adults だけが課税対象)
- 18 歳以上 1 人 → adults × (1,860 + 140) = adults × 2,000 ✓

### Agent 調査の誤りからの教訓

本作業に着手する前に WebSearch ベースの研究 agent を投入したが、agent は「松戸市は全項目据え置き」と判定していた。実際には PDF 確認で後期・介護で大幅変動(後期 rate +0.24pt / perCapita +3,000、介護 rate +0.45pt / perCapita +3,000、医療 perCapita +6,000)が判明。

→ feedback_retrofit_revalidation.md の教訓「公式 source の直接確認なしに verified_r8 化してはいけない」が再度実証された。今後の千葉県・東京 23区 retrofit 等でも PDF/HTML 直接確認を必須化すべき。

### 千葉県の料率方式について

千葉県は大阪府と異なり **府内統一料率方式ではない**。各市町村が独自設定し、千葉県は標準保険料率 (参考値) のみ公表 (pref.chiba.lg.jp/hoken/kokubo/r8std-premium.html)。柏市の changelog でも同じ説明あり。
