# 東京 23 区 R8 lifecycle metadata retrofit

## scope

東京 23 区すべて (chiyoda / chuo / minato / shinjuku / bunkyo / taito / sumida / koto / shinagawa / meguro / ota / setagaya / shibuya / nakano-ku / suginami / toshima / kita / arakawa / itabashi / nerima / adachi / katsushika / edogawa) に対して、`meta.lifecycle.r8Stage` / `sourceStatus` / `sourceUrls` 等のメタデータを retrofit する。

**値の変更は一切行わない。** kunitachi PR #9 と同パターン。

## なぜ retrofit か

23 区の R8 値 (医療 7.51% / 後期支援 2.80% / 介護 2.43% / 子育て 0.27%) は 530d/f9312 系の R8 移行コミットで投入されたが、当時はまだ `lifecycle.r8Stage` 等のフィールドが導入されていなかったため、値だけが入って lifecycle メタが空欄のまま残っていた。本コミット群でその欠落を埋める。

## source

- **canonical:** 特別区長会 「特別区の国民健康保険制度」
  https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html
- **詳細計算方法:** 練馬区 国民健康保険料の計算方法（令和8年度）
  https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html
- **値整合性 cross-check (2026-05-18):**
  - 足立区 計算例ページ: https://www.city.adachi.tokyo.jp/kokuho/kurashi/hoken/hokenryoukeisanrei.html
  - 豊島区 計算方法ページ: https://www.city.toshima.lg.jp/109/tetsuzuki/nenkin/kenkohoken/hokenryo/004922.html

3 ソースで値が完全一致することを確認済。

## 確定値 (令和 8 年度 23 区統一保険料率)

| 区分 | 所得割 | 均等割 | 限度額 |
|---|---|---|---|
| 基礎（医療）分 | 7.51% | 47,600 円 | 670,000 円 |
| 後期高齢者支援金分 | 2.80% | 17,600 円 | 260,000 円 |
| 介護分 | 2.43% | 17,800 円 | 170,000 円 |
| 子ども・子育て支援金分 | 0.27% | 1,800 円（+ 18 歳以上 73 円） | 30,000 円 |

`childcare.perCapita = 1,873` は 18 歳以上を含む合算表現（1,800 + 73）。豊島区表記と整合。

## changed fields (各 23 区共通)

```
meta.dataVersion: 2.0.0 → 2.0.1
meta.lifecycle.updatedAt: <既存値> → 2026-05-18T00:00:00.000Z
meta.lifecycle.r8Stage: (新規) "verified_r8"
meta.lifecycle.sourceStatus: (新規) "official_rate_page"
meta.lifecycle.sourceUrls: (新規) [
  "https://www.tokyo23city-kuchokai.jp/katsudo/kokuho_20hoken.html",
  "https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html"
]
meta.lifecycle.previousYearTemplate: (新規) false
meta.lifecycle.r8Updated: (新規) true
meta.lifecycle.verifiedAt: (新規) "2026-05-18"
meta.lifecycle.verificationLevel: (新規) "official_source_checked"
```

## 触らないもの

- `rate.*` / `perCapita.*` / `household.*` / `caps.*`: R8 値は既に正しい
- `childcare.*`: 既に正しい
- `reduction.standards.*`: 既に R8 国基準 (310000 / 570000) 同期済
- `preschoolReduction.*`: 不変
- `meta.source.*`: 既存値を維持（多くは練馬区参照）

## verification (2026-05-18)

各区共通:
- rate.medical = 0.0751 ✓ (3 ソース一致)
- rate.support = 0.028 ✓ (3 ソース一致)
- rate.care = 0.0243 ✓ (3 ソース一致)
- perCapita.medical = 47600 ✓
- perCapita.support = 17600 ✓
- perCapita.care = 17800 ✓
- caps.medical = 670000 ✓
- caps.support = 260000 ✓
- caps.care = 170000 ✓
- caps.childcare = 30000 ✓
- childcare.rate = 0.0027 ✓
- childcare.perCapita = 1873 ✓ (1800 + 73)
- reduction.standards.fiveTenths.perPersonAdd = 310000 ✓ (R8 国基準)
- reduction.standards.twoTenths.perPersonAdd = 570000 ✓ (R8 国基準)

## commit 戦略

PR scope 原則 (1 PR = 1 自治体) は通常守るが、本 retrofit は

- 23 区すべてが同一 retrofit パターン
- 値変更ゼロ (メタデータのみ)
- 3 ソースで値整合性検証済

の 3 条件を満たすため、kunitachi PR #9 の確立パターンを 23 区に一斉適用する形で **1 branch / 23 commit / 1 PR** で進める。レビュアは 1 commit 分の diff を確認すれば残り 22 commit が同型であることを確認できる構造。

## 関連

- kunitachi PR #9: `data(tokyo): retrofit Kunitachi R8 lifecycle metadata (verified_r8)`
- feedback_retrofit_revalidation.md: retrofit 時の値再検証必須 → 本 retrofit は 3 ソース突合で対応済
- feedback_pr_scope.md: 1 PR = 1 自治体原則からの例外 (上記理由による)
