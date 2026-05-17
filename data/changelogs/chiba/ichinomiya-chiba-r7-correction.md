# 一宮町（千葉県）R7 国保税 公式値再照合・修正

## source

- 公式 URL: https://www.town.ichinomiya.chiba.jp/iryou/1/2.html （一宮町国民健康保険税、令和7年度）
- 抽出元: ページ table 0（医療給付費分・後期高齢者支援金分・介護納付金分の税率表）
- checkedAt: 2026-05-18

## 検出経緯

issue #21（千葉県内 R8 整理 3 件）の sub-task として ichinomiya-chiba の R8 化を着手した際、R8 公式 source が存在しないことが判明（→ issue #34 で別途追跡）。その過程で R7 公式ページを参照したところ、既存 `kokuho-2025.json` の値が公式 R7 と大きく乖離していることが発覚した。

## 修正前後の比較（caps 以外ほぼ全項目が出所不明値だった）

| 項目 | 公式 R7 | 修正前 JSON | 修正後 JSON |
|---|---|---|---|
| medical.rate | 7.5% | 0.080 ❌ | **0.075** ✅ |
| medical.perCapita | 21,000 | 34,327 ❌ | **21000** ✅ |
| medical.household | 20,000 | 22,284 ❌ | **20000** ✅ |
| medical.cap | 660,000 | 660000 ✅ | 660000 ✅ |
| support.rate | 2.9% | 0.0274 ❌ | **0.029** ✅ |
| support.perCapita | 10,000 | 11,611 ❌ | **10000** ✅ |
| support.household | （掲載なし=0） | 7,537 ❌ | **0** ✅ |
| support.cap | 260,000 | 260000 ✅ | 260000 ✅ |
| care.rate | 2.1% | 0.0228 ❌ | **0.021** ✅ |
| care.perCapita | 14,000 | 11,545 ❌ | **14000** ✅ |
| care.household | （掲載なし=0） | 5,714 ❌ | **0** ✅ |
| care.cap | 170,000 | 170000 ✅ | 170000 ✅ |

## meta 更新

| 項目 | 修正前 | 修正後 |
|---|---|---|
| meta.dataVersion | 1.0.0 | **1.0.1** |
| meta.status | unverified | **verified** |
| meta.source.type | manual | **official** |
| meta.source.title | (空) | 一宮町国民健康保険税（令和7年度） |
| meta.source.url | (空) | https://www.town.ichinomiya.chiba.jp/iryou/1/2.html |
| meta.audit.verifiedBy | (空) | civic-rule-lab |
| meta.audit.verifiedAt | (空) | 2026-05-18 |
| meta.audit.method | manual | official-site |
| meta.quality.confidenceScore | 0.80 | **0.95** |
| meta.lifecycle.updatedAt | 2026-04-07 | 2026-05-18 |
| meta.notes | (空) | 修正経緯と R7 公式値の根拠を明記 |

## 不変更項目（公式と既に一致または独立）

- `basicDeduction: 430000` — 公式表の所得割計算式と一致
- `caps.medical: 660000` / `caps.support: 260000` / `caps.care: 170000` — 公式と完全一致（修正前から正しかった唯一の項目群）
- `reduction.standards`（7割 基底のみ / 5割 perPersonAdd 305,000 / 2割 perPersonAdd 560,000）— 公式 table 1 と一致（R7 国基準）
- `reduction.salaryPensionAdd: 100000` — 公式表の「給与所得者等の数 × 10万円」と一致
- `preschoolReduction`（enabled, 0.5, 0.5）— 国制度デフォルト

## 教訓・継続課題

### caps だけ一致パターンの可能性

修正前 JSON は **caps のみ完全一致、rate / perCapita / household がすべて出所不明値** という特異な状態だった。これは以下のシナリオを示唆する:

- 過去に「caps（賦課限度額）は国基準で全国共通だから先に埋めた」段階で残りはテンプレ値や他自治体値で仮埋めされた可能性
- または `status: unverified` のまま長期間放置され、公式照合が一度もされていない自治体が他にもある可能性

→ **別途 audit script を検討**: 全 1700+ 自治体で「caps だけが妥当値で残りがテンプレ的整数値（10000/20000/30000 等の丸め値）」のパターンを洗い出す。issue #35 に追記推奨。

### R8 への展開

ichinomiya-chiba の R8 化（issue #34）は公式 R8 改定告知の公開待ち。改定告知が出た時点で、本 commit で確立した公式 R7 値からの差分として R8 値を追跡可能になる（R7 公式値が確定したことで R7→R8 改定の意味が解釈しやすくなった）。

## verification

- status: verified（R7 公式ページとの完全照合済み）
- 4 段防衛: test-integrity（cityCode / slug / data dir / HTML 整合）+ validate-kokuho-data PASS 想定
- 計算結果: R7 公式表に「計算例」自体は掲載されていないため、engine 側の挙動はテスト計算で別途確認推奨
