# Civic Rule Lab — プロジェクト詳細設計

最終更新: 2026-03-25

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
│   ├ rulesets           制度ルール（年度別）
│   ├ templates          制度パターン（同型グループ）
│   ├ municipalities     自治体差分データ
│   ├ engines            計算エンジン
│   └ generated          自動生成結果
│
├─ Municipal Control     自治体ネットワーク管理
│   └ 1700site           1741自治体サイト配信基盤
│
├─ Civic Exchange        市民サービス
│   ├ 自治体制度ポータル
│   ├ 国保計算ツール（現在の実装）
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
Municipal Control / 1700site
    ↓
Civic Exchange
    ↓
市民
```

---

## 3. Civic Rule Engine — コアアルゴリズム

### 処理フロー

```
1. normalize   自治体データを正規化（表記ゆれ解消）
2. signature   制度構造の署名を生成
3. classify    同型自治体をグループ化
4. generate    template + override → generated JSON
```

### 3-1. normalize（正規化）

**目的：** 入力差・表記ゆれを比較可能な形に統一。

```js
// 入力例
{ "incomeRate": "7.3%", "perCapita": "42,000円" }

// 正規化後
{ "incomeRate": 0.073, "perCapita": 42000 }
```

正規化対象フィールド：
- `calculationType` / `sections` / `incomeRate` / `perCapita`
- `householdRate` / `assetRate` / `cap` / `reductionRule`
- `premiumYear` / `incomeYear` / `specialRule`

### 3-2. signature（構造署名化）

**目的：** 税率ではなく「制度構造」で同型判定する。

署名キー：

| キー | 意味 |
|------|------|
| `calculationType` | 計算方式（income+perCapita+household 等） |
| `sections` | 区分構成（medical / support / care） |
| `limitStructure` | 上限構造（total / separate） |
| `reductionRule` | 軽減ルール（7-5-2 等） |
| `premiumYear` | 保険料年度 |
| `specialRule` | 特例有無 |

### 3-3. classify（同型分類）

**目的：** 同じ署名の自治体をグループ化。

```json
{
  "KOKUHO-2026-001": ["kanagawa/chigasaki", "kanagawa/fujisawa"],
  "KOKUHO-2026-002": ["kanagawa/hiratsuka"]
}
```

### 3-4. generate（自動生成）

| ケース | 出力 |
|--------|------|
| 署名一致・数値も一致 | template のみ |
| 署名一致・数値差分あり | template + override |
| 署名不一致 | custom/（完全個別） |

---

## 4. ディレクトリ構造（最終形）

```
civic-rule-lab/
├ docs/
│  ├ project-overview.md       このファイル
│  ├ architecture.md
│  ├ civic-exchange-constitution.md  （未作成）
│  └ civic-rule-engine-spec.md       （未作成）
│
├ registry/
│  ├ municipalities.json       自治体一覧
│  ├ prefectures.json
│  └ systems.json              対応制度一覧
│
├ engines/
│  └ kokuho/
│     ├ engine.js              計算エンジン（稼働中）
│     ├ normalize.js           （未実装）
│     ├ signature.js           （未実装）
│     ├ classify.js            （未実装）
│     └ generate.js            （未実装）
│
├ rulesets/
│  └ kokuho/
│     └ 2025.json, 2026.json
│
├ templates/
│  └ kokuho/
│     └ type-a.json ...
│
├ municipalities/
│  └ kanto/kanagawa/{slug}/systems/kokuho.json
│
├ overrides/
│  └ kokuho/{slug}-{year}.json
│
├ custom/                      テンプレ適用外（横浜・大阪等）
│  └ kokuho/{slug}-{year}.json
│
├ generated/
│  └ kokuho/{year}/{prefecture}/{slug}.json
│
├ municipal-control/
│  └ scripts/
│     ├ build-generated.js
│     ├ validate-rules.js
│     └ publish-sites.js
│
├ sites/                       公開サイト
│  ├ portal/
│  └ municipalities/{slug}/
│
└ data/municipalities/{slug}/kokuho-2025.json   （現行・移行前）
```

---

## 5. municipalities JSONフォーマット（目標形式）

```json
{
  "cityId": "chigasaki",
  "prefectureId": "kanagawa",
  "regionBlock": "kanto",
  "premiumYear": 2026,
  "incomeYear": 2025,
  "calculationType": "income+perCapita+household",
  "sections": ["medical", "support", "care"],
  "incomeRate": "7.3%",
  "perCapita": "42000",
  "householdRate": "18000",
  "assetRate": "0%",
  "cap": { "medical": 650000, "support": 240000, "care": 170000 },
  "reductionRule": "7-5-2",
  "specialRule": false
}
```

---

## 6. 1700site — Municipal Control

### 機能

| 機能 | 内容 |
|------|------|
| Municipality Registry | 全国自治体台帳管理 |
| Rule Distribution | 制度データ配信 |
| Update Manager | 年度更新・制度改正 |
| Rollback Manager | 全国 / 都道府県 / 自治体 / 制度 / 年度単位でロールバック |
| Emergency Broadcast | 災害時緊急通知 |

### 通常更新フロー

```
Rule Lab → Validation → Municipal Control → 1700site → Staging → Production
```

### 緊急更新フロー

```
Emergency Input → Quick Validation → Emergency Broadcast → Target Deployment
```

---

## 7. 設計原則

1. **制度ロジックはデータ化** — コードに埋め込まない
2. **年度分離** — `registry/kokuho/2026/chigasaki.json`
3. **ID固定** — `prefectureId` / `cityId` / `slug` は変更不可
4. **個人データ非保持** — 氏名・住所・個別所得は保存しない
5. **匿名統計のみ** — 利用数・閲覧数のみ取得
6. **必ずロールバック可能**

---

## 8. 次の作業優先順位

### Phase 1（現在）：制度コンパイラの実証
- [ ] `engines/kokuho/normalize.js` 実装
- [ ] `engines/kokuho/signature.js` 実装
- [ ] `engines/kokuho/classify.js` 実装
- [ ] `engines/kokuho/generate.js` 実装
- [ ] 神奈川県全自治体 kokuho-2025.json 一括生成スクリプト
- [ ] 茅ヶ崎市公式計算例との照合テスト
- [ ] `docs/civic-exchange-constitution.md` 作成
- [ ] `docs/civic-rule-engine-spec.md` 作成
- [ ] test/ → 正式版（municipalities/）への移行完了

### Phase 2：制度横展開
- 住民税・介護保険・保育料エンジン追加
- 制度横断計算（入力共通化）
- Municipal Control 自動生成基盤

### Phase 3：双方向認証基盤（長期）
- 個人 ↔ 行政の認証システム
- DID / Verifiable Credentials

---

## 9. Claudeからの補足

### このプロジェクトが強い理由

単なる計算ツールではなく：
1. 制度ルールを**正規化**し
2. 制度構造の**署名を生成**し
3. 同型自治体を**自動分類**し
4. テンプレート＋差分で**自治体サービスを生成**する

この処理構造が**知的財産として強い**。

### 推奨ドキュメント追加

```
docs/civic-exchange-constitution.md  プロジェクト憲法（思想・原則）
docs/civic-rule-engine-spec.md       エンジン仕様（技術詳細）
```

この2つが完成すると「完全な自治体制度OS」になる。

### 最小実装で試す場合

神奈川県3市（茅ヶ崎・藤沢・平塚）で動かすのが最も安全。
`npm run kokuho:classify` で分類 → 生成まで一気通貫。

### 命名規則まとめ

| 項目 | 形式 | 例 |
|------|------|-----|
| slug | ローマ字小文字 | `chigasaki` |
| cityCode | 総務省6桁コード | `14207` |
| prefectureId | ローマ字小文字 | `kanagawa` |
| regionBlock | 地方ブロック名 | `kanto` |
| ファイル名 | `{year}.json` | `2026.json` |
