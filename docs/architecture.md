# Civic Systems アーキテクチャドキュメント

最終更新: 2026年3月23日

-----

## プロジェクトの思想・背景

### 発案の原点

AIの普及により「どの情報が正しいか」の問題が深刻化している。特に医療・税・社会保障など生命・生活に直結する領域では、誤った情報が生命を脅かす可能性がある。

この問題に対する答えとして、以下の2つの基盤を構築する：

1. **制度データを構造化・検証可能にする**（Civic Rule Lab）
1. **市民と行政・民間が互いに信頼できる双方向認証基盤**（長期目標）

### 核心思想：制度コンパイラ

```
【普通のアプローチ】
制度 → サイト（1741個を手作業）

【Civic Systemsのアプローチ】
制度 → データ → 生成 → サイト（自動）
```

制度そのものをソフトウェア工学的に扱う。法律・条例をソースコードとして、構造化データにコンパイルし、1741自治体サイトを自動生成する。

-----

## 会社構造

```
Civic Systems（開発・インフラ会社）
│
├─ Civic Rule Lab        制度研究・制度OS
│   ├ rulesets           制度ルール
│   ├ templates          制度パターン
│   ├ municipalities     自治体差分
│   ├ engines            計算エンジン
│   └ generated          自治体制度データ生成
│
├─ Municipal Control     自治体ネットワーク管理
│   ├ 1741 site          自治体ページ生成
│   ├ scripts            自動生成
│   └ updates            年度更新
│
├─ Civic Exchange        市民サービス（市民 ↔ 制度）
│   ├ 自治体制度ポータル
│   ├ 国保計算ツール（現在の本体）
│   ├ 制度検索
│   └ 自治体ページ
│
└─ CCP                   循環型リサイクル事業
```

### データの流れ

```
rulesets（制度ルール）
    ↓
templates（制度パターン）
    ↓
municipalities（自治体差分）
    ↓
engines（計算エンジン）
    ↓
generated（生成）
    ↓
Municipal Control
    ↓
Civic Exchange
    ↓
市民
```

-----

## リポジトリ構成

|リポジトリ             |役割                    |状態          |
|------------------|----------------------|------------|
|kokuho-keisan     |現行本体・計算エンジン           |稼働中（261コミット）|
|civicexchange-site|Civic Exchange フロントエンド|整備中         |
|civicsystems-site |コーポレートサイト             |ほぼ空         |
|kokuho-calculator |旧版                    |役割終了        |

**→ kokuho-keisan を中心に育てる**

-----

## kokuho-keisan の正式ディレクトリ構造

### 現在（test/ 段階）

```
kokuho-keisan/
├── index.html
└── test/
    ├── chigasaki-kokuho.html
    ├── js/
    │   └── engine.js
    └── data/
        └── municipalities/
            └── chigasaki/
                └── kokuho-2025.json
```

### 正式版（移行先）

```
kokuho-keisan/
├── index.html
├── engines/
│   └── kokuho/
│       └── engine.js              ← 制度ごとにエンジンを分離
├── data/
│   └── municipalities/
│       └── chigasaki/
│           └── kokuho-2025.json   ← 自治体×制度×年度
├── municipalities/
│   └── chigasaki/
│       └── kokuho.html            ← 自動生成されるページ
├── registry/
│   └── index.json                 ← 自治体一覧（自動生成の土台）
└── docs/
    └── architecture.md            ← このファイル
```

-----

## 自治体データ構造（kokuho-2025.json）

茅ヶ崎市を基準とした標準フォーマット：

```json
{
  "cityCode": "14207",         // 総務省自治体コード（重要）
  "citySlug": "chigasaki",    // URL生成に使用
  "cityName": "茅ヶ崎市",
  "fiscalYear": 2025,
  "system": "kokuho",         // 制度種別（拡張キー）

  "basicDeduction": 430000,

  "rate": {
    "medical": 0.0666,        // 所得割
    "support": 0.0277,
    "care": 0.0262
  },
  "perCapita": { ... },       // 均等割
  "household": { ... },       // 平等割（三方式の自治体はnull）
  "caps": { ... },            // 賦課限度額
  "preschoolReduction": { ... },
  "reduction": { ... }        // 7割・5割・2割軽減
}
```

### 将来の制度拡張

```
municipalities/chigasaki/
├── kokuho-2025.json    ← 現在
├── kaigo-2025.json     ← 介護保険（次フェーズ）
├── hoiku-2025.json     ← 保育料
└── jumin-2025.json     ← 住民税
```

**自治体×制度×年度の3軸でデータ管理する。**

-----

## registry/index.json（自動生成の核）

```json
{
  "municipalities": [
    {
      "cityCode": "14207",
      "citySlug": "chigasaki",
      "cityName": "茅ヶ崎市",
      "prefecture": "神奈川県",
      "systems": ["kokuho"]
    }
  ]
}
```

ここに自治体を追加するだけでサイト全体に反映される。

-----

## 入力データの共通化（将来の制度横断計算）

国保計算ツールの入力項目は、他制度の計算にも流用できる：

```
【共通入力】
所得・世帯人数・年齢構成・所得種別

【これで計算できる制度】
国保料       ← 実装済み
住民税       ← 所得・控除から計算可能
介護保険料   ← 40〜64歳人数取得済み
保育料       ← 世帯所得・子ども数から算定
高額療養費   ← 所得区分から導出
就学援助     ← 所得・世帯から判定
```

**入力1回 → 複数制度を同時計算 → 統合表示**が最終形。

-----

## 長期ロードマップ

### Phase 1（現在）：制度コンパイラの実証

- 国保計算ツールの完成・正式化
- 近県自治体の手入力追加（神奈川県内）
- 自動生成スクリプトの開発
- ディレクトリ構造の正式化

### Phase 2：制度の横展開

- 介護保険・保育料・住民税エンジンの追加
- 制度横断計算（入力共通化）
- Municipal Control の自動生成基盤構築

### Phase 3：双方向認証基盤（長期）

- 個人↔行政の認証システム設計
- DID / Verifiable Credentials の検討
- 法整備との連携
- 民間サービスとの連携API

-----

## 次の作業タスク

- [ ] `engines/kokuho/engine.js` の作成（パス修正）
- [ ] `registry/index.json` の作成
- [ ] `municipalities/chigasaki/kokuho.html` の正式化
- [ ] `test/` フォルダの削除
- [ ] 藤沢市など近県自治体データの追加

-----

## 次回の会話を始めるとき

このファイルのURLをClaudeに貼ると文脈を即座に共有できます：

```
https://github.com/civic-rule-lab/kokuho-keisan/blob/main/docs/architecture.md
```

（このファイルをリポジトリに追加後）
