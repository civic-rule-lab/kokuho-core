# Civic Rule Engine — 技術仕様書

最終更新: 2026-04-09

---

## 概要

Civic Rule Engine は、自治体制度データを「正規化 → 署名 → 分類 → 生成」の4段階パイプラインで処理し、制度計算ページを自動生成するエンジンです。

```
data/municipalities/{slug}/kokuho-2025.json
    ↓ normalize    数値表記を統一
    ↓ signature    制度構造の署名を生成
    ↓ classify     同型自治体をグループ化
    ↓ generate     template + override → generated/
    ↓ publish      {pref}/{slug}/ へ配信
```

---

## 実装ファイル

| ファイル | 役割 |
|---------|------|
| `engines/kokuho/normalize.js` | 生JSONを標準スキーマに変換 |
| `engines/kokuho/signature.js` | 制度構造の署名文字列を生成 |
| `engines/kokuho/classify.js` | 署名でグループ化・テンプレート算出 |
| `engines/kokuho/generate.js` | パイプライン実行・ファイル出力 |
| `js/engine.js` | ブラウザ用計算エンジン（絶対パス版） |
| `engines/kokuho/engine.js` | ブラウザ用計算エンジン（test/用） |

---

## Stage 1: normalize

**ファイル:** `engines/kokuho/normalize.js`

**目的:** 入力データの表記ゆれを解消し、標準スキーマに変換する。

### 変換規則

| 入力例 | 変換後 |
|--------|--------|
| `"7.71%"` | `0.0771` |
| `"7.71"` (1以上) | `0.0771` |
| `0.0771` | `0.0771` |
| `"47,300円"` | `47300` |
| `47300` | `47300` |

### 出力スキーマ（標準形式）

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
  "preschoolReduction": {
    "enabled": true,
    "medicalPerCapitaRate": 0.5,
    "supportPerCapitaRate": 0.5
  },
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

資産割あり自治体は `assetLevy: { medical?, support?, care? }` を追加。

### デフォルト値

省略可能フィールドのデフォルト:

| フィールド | デフォルト |
|-----------|-----------|
| `basicDeduction` | 430000 |
| `household.*` | 0 |
| `preschoolReduction.enabled` | true |
| `preschoolReduction.*PerCapitaRate` | 0.5 |
| `reduction.standards.fiveTenths.perPersonAdd` | 305000 |
| `reduction.standards.twoTenths.perPersonAdd` | 560000 |
| `reduction.salaryPensionAdd` | 100000 |

---

## Stage 2: signature

**ファイル:** `engines/kokuho/signature.js`

**目的:** 制度「構造」を文字列化し、同型判定のキーとする。数値（税率）は含まない。

### 署名フォーマット

```
{calcType}|{caps}|{reduction}|{special}
```

### calcType — 計算方式

| 値 | 意味 |
|----|------|
| `2h` | 所得割 + 均等割 |
| `3h` | 所得割 + 均等割 + 平等割 |
| `2h+asset` | 所得割 + 資産割 + 均等割 |
| `4h` | 所得割 + 資産割 + 均等割 + 平等割 |
| `4h[m]` など | 資産割が一部区分のみの場合に区分を付加 |

### caps — 賦課限度額

| 値 | 意味 |
|----|------|
| `nat` | 全国標準（医療660万・支援260万・介護170万） |
| `650-240-170` | 独自上限（千円単位） |

### reduction — 軽減基準

| 値 | 意味 |
|----|------|
| `R7std` | R7全国標準（5割=30.5万/人・2割=56万/人・給年10万） |
| `custom` | 独自軽減基準 |

### special — 特例

| 値 | 意味 |
|----|------|
| `pre` | 未就学児均等割軽減（R4〜国制度） |
| `none` | 特例なし |

### 実装例

```js
generateSignature(data)
// → "3h|nat|R7std|pre"    （茅ヶ崎市）
// → "2h|nat|R7std|pre"    （新宿区）
// → "4h|nat|R7std|pre"    （小笠原村等）
```

---

## Stage 3: classify

**ファイル:** `engines/kokuho/classify.js`

**目的:** 同一署名の自治体をグループ化し、グループ内の「最頻値」をテンプレートとして決定する。

### アルゴリズム

1. 全自治体を署名でグループ化
2. 各グループで数値フィールドの最頻値（mode）を算出 → ベーステンプレート
3. テンプレートと完全一致する自治体: `isExact = true`（オーバーライドなし）
4. 差分がある自治体: 差分のみを `override` として記録

### 2025年度分類結果（164自治体）

| 署名 | 件数 | 完全一致 | 説明 |
|------|------|----------|------|
| `3h\|nat\|R7std\|pre` | 94件 | 0件 | 3方式・全国標準上限（神奈川+長野） |
| `2h\|nat\|R7std\|pre` | 48件 | 16件 | 2方式・全国標準上限（主に東京23区） |
| `4h\|nat\|R7std\|pre` | 12件 | 0件 | 4方式・全国標準上限（長野村落） |
| `2h\|650-240-170\|R7std\|pre` | 5件 | 0件 | 2方式・独自上限（東京一部市） |
| `4h[m]\|nat\|R7std\|pre` | 2件 | 1件 | 医療分のみ資産割 |
| `4h[ms]\|nat\|R7std\|pre` | 1件 | 1件 | 医療+支援分のみ資産割 |
| `2h\|640-230-170\|R7std\|pre` | 1件 | 1件 | 立川市 |
| `2h\|660-240-170\|R7std\|pre` | 1件 | 1件 | 昭島市 |
| **合計** | **164件** | **20件 (12.2%)** | |

---

## Stage 4: generate

**ファイル:** `engines/kokuho/generate.js`

**実行:**

```bash
node engines/kokuho/generate.js           # 通常実行
node engines/kokuho/generate.js --dry-run # ファイル出力なし
```

### 出力ファイル

```
generated/kokuho/2025/
├ classification.json          分類サマリー（全グループ・全自治体）
├ templates/
│  ├ 2h_nat_R7std_pre.json     グループのベーステンプレート
│  ├ 3h_nat_R7std_pre.json
│  └ ...（8ファイル）
└ overrides/
   ├ chigasaki.json             テンプレートとの差分のみ
   ├ fujisawa.json
   └ ...（144ファイル）
```

### classification.json 構造

```json
{
  "generatedAt": "2026-03-30T...",
  "fiscalYear": 2025,
  "totalMunicipalities": 164,
  "groups": {
    "3h|nat|R7std|pre": {
      "count": 94,
      "exactCount": 0,
      "description": { "calcType": "...", "caps": "...", ... },
      "municipalities": [
        { "slug": "chigasaki", "name": "茅ヶ崎市", "pref": "神奈川県", "hasOverride": true },
        ...
      ]
    }
  }
}
```

---

## 計算エンジン（ブラウザ用）

**ファイル:** `js/engine.js`（正式版）/ `engines/kokuho/engine.js`（test/用）

### 計算フロー

```
前年所得
  → 基礎控除 (43万円) を控除 → 賦課基礎額
  → 所得割 = 賦課基礎額 × 料率
  → 均等割 = 人数 × 均等割額
  → 平等割 = 世帯定額（3方式・4方式のみ）
  → 資産割 = 固定資産税額 × 資産割率（4方式のみ）
  → 未就学児軽減 = 未就学児数 × 均等割 × 0.5（医療・支援のみ）
  → 法定軽減 = 7割/5割/2割（世帯所得に基づき判定）
  → 限度額適用（区分別）
  → 年間保険料 = 医療分 + 支援分 + 介護分
```

### 法定軽減判定（R7標準）

```
7割軽減: 所得 ≤ 43万円 + 給年加算
5割軽減: 所得 ≤ 43万円 + 30.5万円/人 + 給年加算
2割軽減: 所得 ≤ 43万円 + 56万円/人 + 給年加算
```

給年加算 = 10万円 × (給与・年金所得者数 - 1)

### 重要な実装上の注意

**介護分所得割は介護対象者がいる場合のみ計算する**

```js
// ✅ 正しい実装
const careIncome = care > 0 ? Math.round(baseIncome * data.rate.care) : 0;

// ❌ バグ（care=0でも介護所得割が発生してしまう）
const careIncome = Math.round(baseIncome * data.rate.care);
```

---

## データバリデーション

**ファイル:** `scripts/validate-kokuho-data.js`

**実行:**

```bash
node scripts/validate-kokuho-data.js
```

検証項目:
- 必須フィールドの存在
- 数値範囲（所得割率 0.5〜20%、均等割 0〜10万円 等）
- スラグ一致（citySlug とディレクトリ名）
- R7標準値との整合性

---

## 計算照合テスト

**ファイル:** `scripts/test-calc-verify.js`

**実行:**

```bash
node scripts/test-calc-verify.js
```

検証対象:
- 新宿区: 公式サイト掲載例 2ケース
- 長野市: 公式目安表 7ケース（軽減なしシナリオ）
- 藤沢市: 軽減境界 4ケース

全13テスト PASS。

---

## データステータス定義

| status | 意味 | 公開可否 |
|--------|------|---------|
| `verified` | 公式資料で確認済み | ✅ 可 |
| `needs_update` | 前年度からの推定値 | ⚠️ 参考値として可（注記表示） |
| `draft` | 作成中 | ❌ 不可 |

---

## 将来の多制度展開（2026-04-09確定）

### データ構造

```
data/municipalities/{slug}/
├── kokuho-{year}.json      国保（現在）
├── juminzei-{year}.json    住民税（将来）
├── kaigo-{year}.json       介護保険（将来）
└── kodomo-{year}.json      子育て支援金（将来）
```

### フロントサイト構成

```
制度別サイト（SEO特化）
├── kokuho-keisan.jp       稼働中
├── juminzei-keisan.jp     将来
└── kaigo-keisan.jp        将来

ポータル（横断計算）
└── civic-keisan.jp        世帯の年間総負担額を全制度横断で計算
```

**実装タイミング：国保の needs_update 解消・全ファイル精査完了後に開始。**
