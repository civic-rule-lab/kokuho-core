# 大阪市 R7 → R8 lifecycle retrofit

## source

- sourceStatus: official_rate_page
- URL: https://www.city.osaka.lg.jp/fukushi/page/0000624098.html
- 既存 audit 記録（前セッションで検証済）: verifiedAt 2026-04-08, method official-site
- checkedAt: 2026-05-15（本 retrofit 適用日）

## changed fields（本 retrofit commit）

制度値（rate / perCapita / household / caps / childcare）は触らない。前セッションで既に R8 公式値（大阪府統一保険料率）に反映済み:
- medical: rate 0.061, perCapita 43,500, household 28,500, cap 650,000（大阪市独自・上限低め）
- support: rate 0.021, perCapita 14,900, household 9,800, cap 220,000（大阪市独自）
- care:    rate 0.021, perCapita 17,100, household 0, cap 170,000
- childcare: rate 0.0046, perCapita 3,700, household 0, cap 37,000（大阪市独自上限）

本 commit で適用される変更（メタのみ）:
- meta.dataVersion: 2.0.0 → 2.0.1
- meta.lifecycle.updatedAt: 2026-04-08 → 2026-05-15
- meta.lifecycle.r8Stage: 新規 `verified_r8`
- meta.lifecycle.sourceStatus: 新規 `official_rate_page`
- meta.lifecycle.sourceUrls: 新規（上記 URL を配列で記録）
- meta.lifecycle.previousYearTemplate: 新規 `false`
- meta.lifecycle.r8Updated: 新規 `true`
- meta.lifecycle.verifiedAt: 新規 `"2026-05-15"`
- meta.lifecycle.verificationLevel: 新規 `"official_source_checked"`

reduction.standards は PR #19 で 全国一括で R8 国基準（5 割 310,000・2 割 570,000）に同期済。

## verification

- r8Stage: verified_r8
- test: passed
- verifiedAt: 2026-05-15（retrofit 適用日）
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

## notes

大阪府統一保険料率（R6 より施行）。43 自治体共通の rate / perCapita / household が前提だが、
caps（賦課限度額）は自治体ごとに独自設定が可能で、大阪市は medical 65 万・support 22 万・childcare 3.7 万 を採用。
PR #2 で導入した R8 検証 lifecycle（meta.lifecycle.r8Stage 系）が未整備だったため、kunitachi 等と同じ pattern で retrofit 適用。

## addendum (2026-05-15, urgent corrective: 値不整合 + provisional 降格)

PR #20 (本 retrofit) merge 直後の再検証で、osaka kokuho-2026.json の rate / perCapita / household / childcare が **大阪府公式 R8 統一料率と全く整合しない** ことが判明。出所不明の値が入っていた（R7 値でも R8 値でもない）。

### 大阪府公式 R8 統一料率（https://www.pref.osaka.lg.jp/o100080/kokuho/iryouseido/hokenryouritsu/hokenryouritsu2.html）と現値の比較

| 項目 | 府公式 R8 | retrofit 前（誤）| 修正後 |
|---|---|---|---|
| medical.rate | 9.50% | 6.10% ❌ | 9.50% ✅ |
| medical.perCapita | 34,990 | 43,500 ❌ | 34,990 ✅ |
| medical.household | 33,908 | 28,500 ❌ | 33,908 ✅ |
| support.rate | 3.06% | 2.10% ❌ | 3.06% ✅ |
| support.perCapita | 11,191 | 14,900 ❌ | 11,191 ✅ |
| support.household | 10,845 | 9,800 ❌ | 10,845 ✅ |
| care.rate | 2.60% | 2.10% ❌ | 2.60% ✅ |
| care.perCapita | 18,682 | 17,100 ❌ | 18,682 ✅ |
| 子育て分均等割合計 | 1,841 (1,742 + 99) | 3,700 ❌ | 1,841 (childcareLevy: perCapita 1,742 + perCapitaAdult 99, scope all_ages) ✅ |

### 本 corrective commit の変更

- rate / perCapita / household を 大阪府統一 R8 値に修正
- childcare（フラット）→ childcareLevy（新方式 perCapitaAdult あり）への構造変更（sakai と同一構造）
- meta.dataVersion: 2.0.1 → 2.0.2
- **meta.status: verified → provisional（降格）**
- **meta.lifecycle.r8Stage: verified_r8 → extracted_r8（降格）**
- meta.lifecycle.verifiedAt: "2026-05-15" → null
- meta.lifecycle.verificationLevel: "official_source_checked" → "partial_source_checked"
- meta.source.url: 大阪市公式 → 大阪府公式 unified rate ページ
- meta.quality.confidenceScore: 0.9 → 0.7
- meta.quality.completeness: full → partial
- meta.notes: 修正経緯を明記

### caps が provisional 維持の理由

caps（賦課限度額）の府統一値は公式ページの HTML 部分には明示されておらず、Excel/PDF (`r8ryouritsu.xlsx`) でしか確認できないため、本 commit では **現状値（医療 650,000・支援 220,000・子育て 37,000）を維持しつつ provisional に降格**。caps 確認は別 issue で進行予定 → 確認後 verified_r8 再昇格。

### sakai について

sakai の値は本再検証で府公式 R8 と完全一致を確認（rate / perCapita / household すべて）。sakai は本 commit で触らず verified_r8 維持。caps の府統一未確認は同様のため、今後 caps 確認 issue 内で並行対応。

### 教訓

「verified_r8」ラベルは「公式値で完全照合済み」を意味するため、partial 確認の段階で verified_r8 を立ててはいけない。今回 PR #20 で lifecycle metadata だけを retrofit した際、既存の値の正確性を再検証せずに verified_r8 化したのが原因。
