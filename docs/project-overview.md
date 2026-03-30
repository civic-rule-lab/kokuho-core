# Civic Rule Lab — プロジェクト詳細設計

最終更新: 2026-03-30

---

## 1. ビジョン

> **制度コンパイラ**
> 日本の1741自治体の制度情報を、エンジンとデータで自動生成・配信する基盤。
> 「市民 ↔ 制度」をつなぐインフラ。

| 普通のアプローチ | Civic Systemsのアプローチ |
|-----------------|--------------------------|
| 制度 → サイト（1741個を手作業） | 制度 → データ → 生成 → サイト（自動） |

---

## 2. 全体アーキテクチャ

```
Civic Systems（インフラ会社）
│
├─ Civic Rule Lab        制度研究・制度OS
│   ├ data               自治体制度データ（164自治体実装済み）
│   ├ registry           自治体マスタ
│   ├ engines            計算エンジン（normalize/signature/classify/generate）
│   └ generated          自動生成結果（テンプレート・オーバーライド）
│
├─ Municipal Control     自治体ネットワーク管理
│   └ 1700site           1741自治体サイト配信基盤
│
├─ Civic Exchange        市民サービス
│   ├ ポータル（index.html）
│   ├ 国保計算ツール（164自治体、現行実装）
│   └ 自治体ページ（/{pref}/{slug}/）
│
└─ CCP                   循環型リサイクル事業
```

### データの流れ

```
data/municipalities/{slug}/kokuho-2025.json
    ↓ normalize    数値表記を統一
    ↓ signature    制度構造の署名を生成
    ↓ classify     同型自治体をグループ化（現在8グループ）
    ↓ generate     template + override → generated/kokuho/2025/
    ↓ publish      {pref}/{slug}/ へ配信
```

---

## 3. 実装状況（2026-03-30 時点）

| 場所 | 内容 | 状態 |
|------|------|------|
| `data/municipalities/{slug}/kokuho-2025.json` | 自治体制度データ | 164自治体（神奈川33・長野77・東京54） |
| `{pref}/{slug}/index.html` | かんたん計算（正式版） | 164自治体生成済み |
| `{pref}/{slug}/income.html` | 所得ベース計算（正式版） | 164自治体生成済み |
| `index.html` | ポータル（都道府県・自治体選択） | 稼働中 |
| `js/engine.js` | 計算エンジン（絶対パス版） | 稼働中 |
| `engines/kokuho/normalize.js` | 正規化モジュール | 実装済み |
| `engines/kokuho/signature.js` | 制度構造署名生成 | 実装済み |
| `engines/kokuho/classify.js` | 同型自治体分類 | 実装済み |
| `engines/kokuho/generate.js` | 自動生成パイプライン | 実装済み |
| `generated/kokuho/2025/` | 分類結果・テンプレート・オーバーライド | 生成済み |
| `registry/index.json` | 自治体マスタ | 164自治体登録済み |
| `test/` | テスト版UI（旧メイン） | 引き続き稼働 |

**公開URL：** `https://kokuho-keisan.jp/`

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

### 2025年度分類結果（164自治体・8グループ）

| 署名 | 件数 | 完全一致 | 代表自治体 |
|------|------|----------|-----------|
| `3h\|nat\|R7std\|pre` | 94件 | 0件 | 神奈川・長野の3方式自治体 |
| `2h\|nat\|R7std\|pre` | 48件 | 16件 | 東京23区など |
| `4h\|nat\|R7std\|pre` | 12件 | 0件 | 長野の村落（資産割あり） |
| `2h\|650-240-170\|R7std\|pre` | 5件 | 0件 | 東京の独自上限市 |
| その他4グループ | 5件 | 4件 | 立川市・昭島市等 |

---

## 5. URL構造（正式版）

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

## 6. ディレクトリ構造（現状）

```
kokuho-keisan/
├ index.html                  ポータル（自動生成）
├ css/
│  ├ common.css               計算ページ共通スタイル
│  └ selector.css             ポータルスタイル
├ js/
│  ├ engine.js                計算エンジン（絶対パス版）
│  └ selector.js              ポータルレジストリ（自動生成）
├ templates/
│  ├ kokuho-simple.html       かんたん計算テンプレート
│  └ kokuho-income.html       所得ベース計算テンプレート
├ kanagawa/{slug}/            神奈川県33自治体 × 2ページ
├ nagano/{slug}/              長野県77自治体 × 2ページ
├ tokyo/{slug}/               東京都54自治体 × 2ページ
├ data/
│  └ municipalities/{slug}/kokuho-2025.json  生データ（164自治体）
├ registry/
│  └ index.json               自治体マスタ（164自治体）
├ engines/
│  └ kokuho/
│     ├ engine.js             計算エンジン（test/用）
│     ├ normalize.js          正規化
│     ├ signature.js          構造署名化
│     ├ classify.js           同型分類
│     └ generate.js           自動生成パイプライン
├ generated/
│  └ kokuho/2025/
│     ├ classification.json
│     ├ templates/
│     └ overrides/
├ scripts/
│  ├ generate-official-pages.js  正式版HTML生成
│  ├ generate-selector.js        ポータル更新
│  ├ generate-kanagawa-kokuho.js
│  ├ generate-tokyo-kokuho.js
│  ├ validate-kokuho-data.js
│  └ test-calc-verify.js
├ docs/
│  ├ project-overview.md         このファイル
│  ├ architecture.md
│  ├ civic-rule-engine-spec.md   エンジン技術仕様
│  └ civic-exchange-constitution.md  プロジェクト憲法
└ test/                       テスト版UI（旧メイン・引き続き稼働）
```

---

## 7. 自治体追加の手順（現行）

1. `data/municipalities/{slug}/kokuho-2025.json` 作成
2. `registry/index.json` に追記（cityCode / citySlug / cityName / prefecture / systems）
3. `node scripts/generate-official-pages.js` — 正式版HTML生成
4. `node scripts/generate-selector.js` — index.html・js/selector.js 更新
5. `node engines/kokuho/generate.js` — 分類結果を更新
6. git push

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
├── kaigo-2025.json     ← 介護保険（Phase 2）
├── hoiku-2025.json     ← 保育料（Phase 2）
└── jumin-2025.json     ← 住民税（Phase 2）
```

**入力1回 → 複数制度を同時計算 → 統合表示** が最終形。

---

## 10. ロードマップ

### Phase 1（完了）：制度コンパイラの実証
- [x] Civic Rule Engine 実装（normalize / signature / classify / generate）
- [x] 164自治体データ整備（神奈川・長野・東京）
- [x] 計算照合テスト（新宿区・長野市・藤沢市）
- [x] 正式版URL構造への移行（`/{pref}/{slug}/`）
- [x] docs 整備（engine-spec / constitution）

### Phase 2（次）：全国展開
- [ ] 神奈川・長野・東京以外の都道府県データ追加
- [ ] 1741自治体への拡張
- [ ] 介護保険・保育料・住民税エンジン追加

### Phase 3（長期）：双方向認証基盤
- 個人 ↔ 行政の認証システム
- DID / Verifiable Credentials
