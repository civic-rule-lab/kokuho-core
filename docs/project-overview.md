# Civic Rule Lab — プロジェクト概要

最終更新: 2026-05

---

## 1. ビジョン

> **制度コンパイラ**
> 日本の自治体ごとに異なる制度情報を、エンジンとデータで自動生成・配信する基盤。
> 「市民 ↔ 制度」をつなぐインフラ。

| 普通のアプローチ | Civic Rule Lab のアプローチ |
|-----------------|----------------------------|
| 制度 → サイト（自治体ごとに手作業） | 制度 → データ → 生成 → サイト（自動） |

---

## 2. 全体アーキテクチャ

```
Civic Rule Lab — kokuho-core
│
├ data        自治体制度データ
├ registry    自治体マスタ
├ engines     計算エンジン（normalize / signature / classify / generate）
└ generated   分類結果（テンプレート + オーバーライド）
```

公開サイト: `https://kokuho-keisan.jp/`

### データの流れ

```
data/municipalities/{slug}/kokuho-{year}.json
    ↓ normalize    数値表記を統一
    ↓ signature    制度構造の署名を生成
    ↓ classify     同型自治体をグループ化
    ↓ generate     template + override → generated/kokuho/{year}/
    ↓ publish      {pref}/{slug}/ へ配信
```

---

## 3. 実装状況

最新の対応自治体・年度カバー状況は `README.md` を参照してください。

---

## 4. Civic Rule Engine — コアアルゴリズム

### 処理フロー

```
1. normalize   自治体データを正規化（表記ゆれ解消）
2. signature   制度構造の署名を生成
3. classify    同型自治体をグループ化
4. generate    template + override → generated JSON
```

詳細仕様: `docs/civic-rule-engine-spec.md`

### 署名フォーマット

```
{calcType}|{caps}|{reduction}|{special}
```

例: `3h|nat|R7std|pre`（3方式・全国標準上限・R7標準軽減・未就学児軽減あり）

---

## 5. URL構造

```
kokuho-keisan.jp/                          ← ポータル
kokuho-keisan.jp/{pref}/{slug}/            ← かんたん計算
kokuho-keisan.jp/{pref}/{slug}/income.html ← 所得ベース計算
```

例:
```
kokuho-keisan.jp/kanagawa/chigasaki/
kokuho-keisan.jp/tokyo/shinjuku/income.html
kokuho-keisan.jp/nagano/nagano/
```

---

## 6. ディレクトリ構造

```
kokuho-core/
├ index.html                  ポータル（自動生成）
├ css/
├ js/
│  ├ engine.js                計算エンジン
│  └ selector.js              ポータルレジストリ（自動生成）
├ templates/
│  ├ kokuho-simple.html
│  └ kokuho-income.html
├ {pref}/{slug}/              都道府県・自治体ごとの計算ページ（自動生成）
├ data/
│  └ municipalities/{slug}/kokuho-{year}.json   生データ
├ registry/
│  └ index.json               自治体マスタ
├ engines/
│  └ kokuho/
│     ├ normalize.js
│     ├ signature.js
│     ├ classify.js
│     └ generate.js
├ generated/
│  └ kokuho/{year}/
│     ├ classification.json
│     ├ templates/
│     └ overrides/
├ scripts/                    生成・バリデーションスクリプト
└ docs/
   ├ project-overview.md      このファイル
   ├ architecture.md
   ├ civic-rule-engine-spec.md
   └ constitution.md
```

---

## 7. 自治体追加の手順

1. `data/municipalities/{slug}/kokuho-{year}.json` 作成
2. `registry/index.json` に追記（cityCode / citySlug / cityName / prefecture / systems）
3. `node scripts/generate-official-pages.js` — 計算ページ生成
4. `node scripts/generate-selector.js` — ポータル更新
5. `node engines/kokuho/generate.js` — 分類結果を更新
6. git commit / push

---

## 8. データ構造（kokuho JSON）

```json
{
  "cityCode": "14207",
  "citySlug": "chigasaki",
  "cityName": "茅ヶ崎市",
  "fiscalYear": 2025,
  "system": "kokuho",
  "basicDeduction": 430000,
  "rate": { "medical": 0.0666, "support": 0.0277, "care": 0.0262 },
  "perCapita": { "medical": 44000, "support": 14700, "care": 14000 },
  "household": { "medical": 0, "support": 0, "care": 0 },
  "caps": { "medical": 650000, "support": 240000, "care": 170000 },
  "preschoolReduction": { "enabled": true, "medicalPerCapitaRate": 0.5, "supportPerCapitaRate": 0.5 },
  "reduction": {
    "enabled": true,
    "standards": {
      "sevenTenths": { "base": 430000, "perPersonAdd": 0 },
      "fiveTenths":  { "base": 430000, "perPersonAdd": 305000 },
      "twoTenths":   { "base": 430000, "perPersonAdd": 560000 }
    },
    "salaryPensionAdd": 100000,
    "ratios": { "sevenTenths": 0.7, "fiveTenths": 0.5, "twoTenths": 0.2 }
  }
}
```

資産割あり自治体は `"assetLevy": { "medical": 0.35, "support": 0.15, "care": 0.11 }` を追加。

---

## 9. 将来の制度拡張

```
data/municipalities/chigasaki/
├── kokuho-2025.json    ← 現在実装済み
├── kaigo-2025.json     ← 介護保険（次期）
├── hoiku-2025.json     ← 保育料（次期）
└── jumin-2025.json     ← 住民税（次期）
```

**入力1回 → 複数制度を同時計算 → 統合表示** が最終形。

---

## 10. ロードマップ

### Phase 1（完了）：制度コンパイラの実証
- [x] Civic Rule Engine 実装（normalize / signature / classify / generate）
- [x] 自治体データ整備
- [x] 計算照合テスト（複数自治体の公式計算例と突合）
- [x] 正式版URL構造への移行（`/{pref}/{slug}/`）

### Phase 2（進行中）：全国展開と制度拡張
- [ ] 全47都道府県・全自治体への拡張
- [ ] 介護保険・保育料・住民税エンジン追加

### Phase 3（長期）
複数制度の統合表示、情報発信の発展など、長期的な検討領域があります。
