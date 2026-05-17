# 富津市 R7 → R8 verified_r8 化（子育て分修正 + lifecycle 整備）

## source

- sourceStatus: official_rate_page
- 主 URL: https://www.city.futtsu.lg.jp/0000000227.html （富津市 国民健康保険税の計算方法、更新日 2026-04-01）
- 副 URL: https://www.city.futtsu.lg.jp/0000007346.html （令和8年度国民健康保険税の改定告知、更新日 2026-04-01）
- checkedAt: 2026-05-18

主 URL（計算方法ページ）は 4 区分（基礎・後期支援・介護・子ども子育て）すべての所得割／均等割／18 歳以上均等割／課税限度額が一表に掲載されており、verified_r8 の根拠として決定的。副 URL（改正告知）は R7→R8 の比較表のみで子育て分は別ページ案内のため副扱い。

## 既存値との照合結果

主要 3 区分 + 賦課限度額は **既存 JSON と公式 R8 値が完全一致**。修正対象は子ども子育て分のみ。

| 項目 | 公式 R8 | 修正前 JSON | 判定 |
|---|---|---|---|
| medical.rate | 7.40% | 0.074 | 一致 |
| medical.perCapita | 41,000 | 41000 | 一致 |
| medical.cap | 67万 | 670000 | 一致 |
| support.rate | 2.50% | 0.025 | 一致 |
| support.perCapita | 13,800 | 13800 | 一致 |
| support.cap | 26万 | 260000 | 一致 |
| care.rate | 2.40% | 0.024 | 一致 |
| care.perCapita | 13,700 | 13700 | 一致 |
| care.cap | 17万 | 170000 | 一致 |
| household (平等割) | なし | 全 0 | 一致 (2方式) |
| **childcare.rate** | **0.29%** | 0.003 (=0.3%) | **修正** |
| **childcare.perCapita** | **1,700円** | 1200 | **修正** |
| **childcare.perCapitaAdult** | **100円 (18歳以上)** | （未定義） | **追加** |
| **childcareLevy 構造** | perCapitaAdult 必要 | childcare flat | **構造変更** |
| childcare.cap | 3万 | 30000 | 一致 |

## 本 commit の変更（メタ + 子育て分）

### 制度値（childcare → childcareLevy）

```diff
- "childcare": {
-   "rate": 0.0030,
-   "perCapita": 1200,
-   "household": 0
- }
+ "childcareLevy": {
+   "rate": 0.0029,
+   "perCapita": 1700,
+   "perCapitaAdult": 100,
+   "perCapitaAdultScope": "all_ages",
+   "household": 0
+ }
```

公式説明:「18歳の誕生日以後の最初の3月31日を迎えるまでの被保険者は、子ども・子育て支援金の均等割額の全額が軽減されます。その軽減した総額を、18歳以上の被保険者で負担するもの」
→ `perCapitaAdultScope: "all_ages"`（全員に perCapita 適用 + 18 歳以上に perCapitaAdult を加算）。osaka / sakai / akishima / ichikawa など既存 17 自治体と同一パターン。engine 側 (`js/core/kokuho.js`) で完全対応済み。

### meta（lifecycle 整備）

| 項目 | 修正前 | 修正後 |
|---|---|---|
| meta.dataVersion | 2.0.0 | 2.0.1 |
| meta.status | provisional | **verified** |
| meta.lifecycle.r8Stage | （未定義） | **verified_r8** |
| meta.lifecycle.sourceStatus | （未定義） | **official_rate_page** |
| meta.lifecycle.sourceUrls | （未定義） | 主 URL + 副 URL の 2 件 |
| meta.lifecycle.previousYearTemplate | （未定義） | false |
| meta.lifecycle.r8Updated | （未定義） | true |
| meta.lifecycle.verifiedAt | （未定義） | "2026-05-18" |
| meta.lifecycle.verificationLevel | （未定義） | official_source_checked |
| meta.lifecycle.updatedAt | 2026-05-11 | 2026-05-18 |
| meta.source.url | 改正告知ページ | **計算方法ページ**（4区分 + caps 明示の主源に変更） |
| meta.source.title | 改定（公式サイト） | 国民健康保険税の計算方法（令和8年度） |
| meta.audit.verifiedAt | 2026-05-11 | 2026-05-18 |
| meta.quality.confidenceScore | 0.80 | **0.95** |
| meta.quality.completeness | partial | **full** |
| meta.notes | 暫定値の説明 | 4 区分完全確認済みの確定情報 |

reduction.standards は PR #19 で全国一括 R8 国基準（5割 310,000 / 2割 570,000）に同期済み。本 commit では触らず。

## verification

- r8Stage: verified_r8
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked
- 公式 source 直接確認（curl で HTML 取得 → 値抽出）

## 教訓 (retrofit_revalidation memory 適用例)

主要 3 区分が一致していても、子育て分（新設区分）は別ページ参照のため見落とされやすい。今回の修正前 JSON は副 URL（改正告知）のみを参照しており、子育て分は R8 国基準 0.3% / 1,200円 の暫定値が入っていた。主 URL（計算方法ページ）で 4 区分一括確認することで、初めて公式値（0.29% / 1,700円 + 100円）に整合できた。

→ verified_r8 化前のチェックリストに「**4 区分（基礎・後期支援・介護・子育て）すべてを公式 source で値照合済み**」を追加すべき。
