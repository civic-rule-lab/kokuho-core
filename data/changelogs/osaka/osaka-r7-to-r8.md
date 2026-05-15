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

## addendum 2 (2026-05-15, caps 確定 + childcareLevy 内訳補正 + verified_r8 再昇格)

ユーザーから提供された大阪府公式ページ（pref.osaka.lg.jp/o100080/.../hokenryouritsu2.html）および大阪市公式 保険料の決め方ページ（city.osaka.lg.jp/fukushi/page/0000624098.html）のスクリーンショット画像により、addendum 1 で provisional に降格していた caps 全項目と、子育て分の内訳が直接確認できた。

### 直接確認できた値（大阪府公式 R8 統一保険料率テーブル）

| 項目 | 値 | 確認元 |
|---|---|---|
| 医療分 賦課限度額 | 660,000円 (+1万) | 大阪府公式テーブル |
| 後期支援分 賦課限度額 | 260,000円 (+2万) | 大阪府公式テーブル |
| 介護分 賦課限度額 | 170,000円 (±0) | 大阪府公式テーブル |
| 子ども分 賦課限度額 | 30,000円 (新設) | 大阪府公式テーブル |
| 子ども分 均等割 内訳 | perCapita 1,745 + 18歳以上 96 = 1,841円 | 大阪市公式「保険料の決め方」二段構成表記 |

R7→R8 増減は大阪府公式テーブルの () 表記で確認:
- 医療: 所得割 +0.20% / 均等割 +566円 / 平等割 +334円 / 上限 +1万円
- 後期: 所得割 +0.04% / 均等割 +157円 / 平等割 +84円 / 上限 +2万円
- 介護: 所得割 +0.04% / 均等割 ▲102円 / 上限 ±0
- 子ども: 新設

### 本 corrective commit の変更

| 項目 | addendum 1 (誤) | addendum 2 (修正) |
|---|---|---|
| caps.medical | 650,000 | **660,000** |
| caps.support | 220,000 | **260,000** |
| caps.childcare | 37,000 | **30,000** |
| childcareLevy.perCapita | 1,742 | **1,745** |
| childcareLevy.perCapitaAdult | 99 | **96** |
| meta.status | provisional | **verified** |
| meta.lifecycle.r8Stage | extracted_r8 | **verified_r8** |
| meta.lifecycle.verifiedAt | null | **"2026-05-15"** |
| meta.lifecycle.verificationLevel | partial_source_checked | **official_source_checked** |
| meta.quality.confidenceScore | 0.7 | **0.95** |
| meta.quality.completeness | partial | **full** |
| meta.dataVersion | 2.0.2 | **2.0.3** |
| meta.note (top-level) | "賦課限度額650000/240000円" | "賦課限度額660000/260000/170000/30000円" |
| meta.notes | 修正経緯説明 (provisional 降格理由) | 完全確認済の確定情報 |

### 子育て分内訳の解釈

addendum 1 で sakai と同じ「1,742 + 99」を採用していたが、大阪市公式ページが「均等割 1,745円 + 18歳以上均等割 96円」と二段表記しているのが直接確認できたため、大阪市独自の表記に合わせて 1,745 + 96 を採用。合計は 1,841円で sakai と同じ。

sakai は引き続き 1,742 + 99 を維持（堺市公式の内訳表記未確認のため、現状維持で別途確認）。大阪府公式テーブルは合計 1,841円のみ掲載で内訳の指定なし。

### verification

- r8Stage: verified_r8（再昇格）
- test: passed（integrity test 22/22 PASS）
- verifiedAt: 2026-05-15
- previousYearTemplate: false
- r8Updated: true
- verificationLevel: official_source_checked

### 教訓 (更新)

- 公式 HTML/PDF だけでなく **スクリーンショット直接確認**も official_source_checked の根拠として扱える（人間が見て読み取ったもの）。
- 一度 provisional 降格しても、出典が揃えば短サイクルで verified_r8 に再昇格できる lifecycle 設計が機能した。
- 「府内統一」と言われていても、各市公式ページの内訳表記（1,745+96 vs 1,742+99）が異なるため、市単位で公式ページの直接確認が必要。
