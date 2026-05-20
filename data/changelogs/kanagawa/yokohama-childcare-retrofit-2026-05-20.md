# 横浜市 子ども分 childcare → childcareLevy 構造変更 + verified_r8 化

R7 → R8 の前段（医療・支援・介護・caps・reduction.standards）は PR 移行時に既に R8 公式値で投入済のため、本 changelog は **子ども・子育て支援納付金分の構造変更** と **meta.lifecycle 充填による verified_r8 昇格** に範囲を絞る。

## source

- sourceStatus: official_rate_page
- URL（一次根拠・料率実額）: https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/kokuho/hokenryo/r7hokennryouritu.html
- 補助 URL（制度改正・子ども分新設の制度構造）: https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/kokuho/hokenryo/04seidokaisei.html
- 補助 URL（保険料概要）: https://www.city.yokohama.lg.jp/kurashi/koseki-zei-hoken/kokuho/hokenryo/04hokenryounituite.html
- publishedAt: 2026-04-01（推定。公式ページに厳密な改訂日明示なし、checkedAt 同日扱い）
- checkedAt: 2026-05-20

## changed fields

### 前段（医療・支援・介護）— 変更なし

R8 移行時に既に公式値で投入済。本 PR では再検証のみ実施し、すべて公式値と一致を確認。

- medical.rate:      0.0833 ✅
- medical.perCapita: 40,870 ✅
- medical.cap:       670,000 ✅
- support.rate:      0.0262 ✅
- support.perCapita: 13,380 ✅
- support.cap:       260,000 ✅
- care.rate:         0.0284 ✅
- care.perCapita:    16,200 ✅
- care.cap:          170,000 ✅
- household.medical / .support / .care: すべて 0（横浜は世帯割なし）

### 子ども分（R8 新設） — 構造変更 + 値分解

公式記載（r7hokennryouritu.html 抜粋）:

> 18歳未満の被保険者は、子ども分均等割額が全額軽減されます。なお、その軽減分は18歳以上の被保険者で負担します（18歳以上被保険者均等割額）。
> 子ども分の均等割料率は、「被保険者均等割：1,690円」と「18歳以上被保険者均等割額：80円」の合算額になります。

公式記載（04seidokaisei.html 抜粋）:

> 医療分、支援分、介護分及び子ども分のそれぞれにつき、被保険者均等割額及び18歳以上被保険者均等割額の7/5/2割を減額

`childcare`（誤ったフラット）→ `childcareLevy`（abiko/akishima 同型）への構造変更:

- 旧: `childcare: { rate: 0.0034, perCapita: 1770, household: 0 }`
  - フラット形式で perCapita が合算値（1,690 + 80）になっており、kokuho.js:137 の旧分岐で **18 歳未満を含む全員に 1,770 円を賦課** していた（横浜公式の「18 歳未満全額軽減」を表現できていなかった）
- 新: `childcareLevy: { rate: 0.0034, perCapita: 1690, perCapitaAdult: 80, perCapitaAdultScope: "all_ages", household: 0 }`
  - 18 歳以上 1 人あたり = perCapita + perCapitaAdult = 1,690 + 80 = 1,770 円
  - 18 歳未満は kokuho.js:122-134 の `adults * (perCapita + perCapitaAdult)` 機構で formula 上 0 算入

caps.childcare = 30,000 は既設定値そのまま（変更なし）。

### reduction.standards — 変更なし

5 割 perPersonAdd 310,000 ／ 2 割 perPersonAdd 570,000 は R8 国基準で既設定済み（不変更）。
04seidokaisei.html により「子ども分にも 7/5/2 割軽減を適用」が確認でき、engine の `childcareReduction = round((perCapita + perCapitaAdult) × adults × reductionRate)` が公式と整合することも合わせて検証。

### meta — verified_r8 昇格に必要な lifecycle 充填

- dataVersion: 2.0.0 → 2.0.1
- lifecycle.updatedAt: 2026-04-08T13:02:38.409Z → 2026-05-20T00:00:00.000Z
- lifecycle.r8Stage: （未設定） → verified_r8
- lifecycle.sourceStatus: （未設定） → official_rate_page
- lifecycle.sourceUrls: （未設定） → 上記 3 URL
- lifecycle.previousYearTemplate: （未設定） → false
- lifecycle.r8Updated: （未設定） → true
- lifecycle.verifiedAt: （未設定） → 2026-05-20
- lifecycle.verificationLevel: （未設定） → official_source_checked
- source.publishedAt: "" → 2026-04-01
- audit.verifiedAt: 2026-04-08 → 2026-05-20
- quality.confidenceScore: 0.9 → 1.0

## verification

- r8Stage: verified_r8
- test-integrity.js: 22 / 22 PASS（G セクション「verified_r8 49 件」を確認、48 → 49 増分が本 PR）
- test-calc-verify.js: 55 / 55 PASS
- 計算スポットチェック（kokuho.js:122-134 の perCapitaAdultScope="all_ages" 分岐）:
  - ケース A（親 2 + 子 1, 所得 300 万, 軽減なし）: childcare = 2 × (1690 + 80) + round(2,570,000 × 0.0034) = 3,540 + 8,738 = **12,278 円** ✓
  - ケース B（単身成人, 所得 0, 7 割軽減）: childcare = 1 × 1,770 - round(1,770 × 0.7) = 1,770 - 1,239 = **531 円** ✓
- verifiedAt: 2026-05-20
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

abiko (`20895a0c3`) / akishima retrofit と同型のパターン。横浜は神奈川県内で **R8 lifecycle 未設定の第 1 例**（kanagawa/ ディレクトリ・本 changelog 共に本 PR で新設）。

本 PR で全国の verified_r8 数は 48 → 49。神奈川県内 verified_r8 数は 0 → 1。

R8 子ども分の構造変更パターンとしては、abiko / akishima / 三鷹 / 府中 / 小金井 / 福生 / 日野（東京都多摩地区）と同じ「新方式（perCapitaAdult + scope="all_ages"）」を採用。横浜の特殊事情は「18 歳未満全額軽減」が R8 子ども分の **基本動作と完全一致** している点で、engine 側の処理 (`adults * (perCapita + perCapitaAdult)`) で自然に表現可能。

横浜公式の `04seidokaisei.html` には「医療分、支援分、介護分及び子ども分のそれぞれにつき、被保険者均等割額及び18歳以上被保険者均等割額の7/5/2割を減額」と明文化されており、engine の `childcareReduction = round(childcarePerCapitaTotal × reductionRate)` の振る舞いが公式準拠であることを確認できた。
