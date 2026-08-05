# 複数制度統合アーキテクチャ設計

**作成日**: 2026-04-27  
**対象**: Civic Rule Lab — kokuho-core 拡張設計  
**ステータス**: Draft v1 (Opus設計)

---

## 0. なぜ今設計するか

R7（2025）国保データが1,727自治体で完成した。この基盤は「制度コンパイラ」として機能している。
次の問いは「同じパイプラインで、何制度まで扱えるか」だ。

**対象制度（優先順）:**

| # | 制度 | 変動性 | データ難易度 | ユーザー需要 |
|---|------|--------|------------|------------|
| 1 | 国民健康保険（既存） | 高（自治体ごと） | 完成 | ★★★★★ |
| 2 | 介護保険料（第1号） | 中（3年ごと改定） | 中 | ★★★★☆ |
| 3 | 住民税（個人）  | 低（ほぼ標準10%） | 低 | ★★★★☆ |
| 4 | 保育料 | 高（世帯所得×自治体）| 高 | ★★★☆☆ |

**Phase 1（2026年6月〜）**: 介護保険 + 住民税  
**Phase 2（2026年度末〜）**: 保育料・その他

---

## 1. コアコンセプト：「入力1回 → 複数制度同時計算」

```
ユーザー入力:
  年収（給与 or 年金）
  家族構成（本人・配偶者・子ども人数・介護認定者有無）
  自治体選択（都道府県 → 市区町村）

             ↓  Shared Input Model

  国保計算  ┐
  介護保険  ├→  合算  →  手取りシミュレーション
  住民税    ┘
```

現在の kakeibo-simulator はこの UI を「全国平均概算」で実装済み。
このアーキテクチャで「全国平均」を「実際の自治体データ」に差し替える。

---

## 2. データスキーマ設計

### 2-1. ディレクトリ構造（拡張後）

```
data/
  municipalities/
    {prefSlug}/
      {citySlug}/
        kokuho-2025.json    ← 既存・変更なし
        kokuho-2026.json    ← 既存パイプラインで生成
        kaigo-2026.json     ← 新規（介護保険）
        jumin-2026.json     ← 新規（住民税）※ほぼ標準のため軽量
        city-meta.json      ← 新規（自治体メタ情報の共有データ）
```

**設計原則: ファイル分離（モノリスにしない）**

理由: 制度ごとに更新サイクルが異なる。
- 国保: 毎年4月改定
- 介護保険: 3年ごと（次は2027年）
- 住民税: 標準税率は変わらない（森林環境税等の追加は別管理）

1ファイルに混ぜると、年次更新スクリプトが複雑になる。

---

### 2-2. `kaigo-2026.json` スキーマ

```json
{
  "cityCode": "14207",
  "citySlug": "chigasaki",
  "cityName": "茅ヶ崎市",
  "prefSlug": "kanagawa",
  "fiscalYear": 2026,
  "system": "kaigo",
  "planPeriod": "第9期（2024-2026）",
  "baseAmount": 79000,
  "brackets": [
    { "level": 1, "label": "第1段階", "rate": 0.285, "condition": "生活保護・世帯非課税+本人年金80万以下" },
    { "label": "第2段階", "rate": 0.485, "condition": "世帯非課税+本人年金80〜120万" },
    { "label": "第3段階①", "rate": 0.685, "condition": "世帯非課税+本人年金120万超" },
    { "label": "第4段階", "rate": 0.90, "condition": "本人非課税・世帯課税" },
    { "label": "第5段階（基準）", "rate": 1.00, "condition": "本人課税・前年所得120万未満" },
    { "label": "第6段階", "rate": 1.20, "condition": "前年所得120〜210万" },
    { "label": "第7段階", "rate": 1.45, "condition": "前年所得210〜320万" },
    { "label": "第8段階", "rate": 1.70, "condition": "前年所得320〜420万" },
    { "label": "第9段階", "rate": 2.00, "condition": "前年所得420万超" }
  ],
  "notes": "低所得者の段階は市が独自に細分化している場合あり"
}
```

**基準額（baseAmount）の分布:**
- 全国平均: 約6,000〜7,000円/月（2024年 第9期）
- 自治体差: 4,000〜9,000円/月程度
- **段階数**: 国標準は9段階だが、多くの自治体が12〜16段階に細分化

→ `brackets` 配列の柔軟性が重要。標準9段階でも独自12段階でもそのまま格納できるスキーマ。

---

### 2-3. `jumin-2026.json` スキーマ

住民税はほぼ全国標準（所得割10%・均等割5,000円）だが、
超過課税をしている自治体（神奈川、横浜市等）のために分離管理。

```json
{
  "cityCode": "14207",
  "citySlug": "chigasaki",
  "cityName": "茅ヶ崎市",
  "prefSlug": "kanagawa",
  "fiscalYear": 2026,
  "system": "jumin",
  "cityRate": 0.06,
  "prefRate": 0.04,
  "cityPerCapita": 3500,
  "prefPerCapita": 1500,
  "forestTax": 1000,
  "basicDeduction": 430000,
  "salaryDeduction": "standard",
  "specialDeductions": {
    "disability": { "standard": 270000, "severe": 400000 },
    "singleParent": 350000,
    "widow": 270000,
    "spouse": 330000,
    "dependent": 330000
  },
  "surcharge": null,
  "notes": ""
}
```

> 99%の自治体は同一値（cityRate=6%, prefRate=4%, perCapita合計=5000円）。
> これを利用して「標準テンプレートからの差分だけを管理」する最適化が可能（後述）。

---

### 2-4. `city-meta.json` — 自治体横断メタデータ

```json
{
  "cityCode": "14207",
  "citySlug": "chigasaki",
  "cityName": "茅ヶ崎市",
  "prefSlug": "kanagawa",
  "prefName": "神奈川県",
  "population": 243000,
  "elderlyRate": 0.27,
  "availableSystems": ["kokuho", "kaigo", "jumin"],
  "lastVerified": {
    "kokuho": "2026-03-15",
    "kaigo": null,
    "jumin": null
  }
}
```

`availableSystems` でどの制度データが揃っているかを管理。
kakeibo-simulator が「この自治体でいくつの制度を計算できるか」を判定できる。

---

## 3. パイプライン拡張設計

### 3-1. 現在のパイプライン（国保）

```
pref-specs/{pref}.js  →  normalize  →  signature  →  classify  →  generate
                                ↑
                    data/municipalities/{slug}/kokuho-2025.json
```

### 3-2. 拡張後パイプライン

```
engines/
  kokuho/           ← 既存・変更なし
    normalize.js
    signature.js
    classify.js
    generate.js
  kaigo/            ← 新規
    normalize.js    （収入 → 段階判定）
    signature.js    （baseAmount|brackets数|上限段階）
    classify.js     （全国で何パターンに分類できるか）
    generate.js     （自治体ページ生成）
  jumin/            ← 新規（軽量）
    normalize.js    （課税所得計算）
    signature.js    （標準/超過課税 2パターンのみ）
    generate.js     （標準テンプレートで大半を処理）
  shared/           ← 新規（共通ロジック）
    income.js       （給与所得控除・年金所得控除 共通計算）
    deductions.js   （基礎控除・社会保険料控除 共通）
    registry.js     （自治体コード解決）
```

### 3-3. 共通所得計算モジュール（重要）

現在、各制度が独自に所得を計算しているが、入力値（年収・家族）は同じ。
`engines/shared/income.js` に切り出す:

```javascript
// engines/shared/income.js

/**
 * 給与所得控除後の金額を計算
 * @param {number} salary - 給与収入（円）
 * @returns {number} 給与所得
 */
function calcSalaryIncome(salary) {
  if (salary <= 550999)  return 0
  if (salary <= 1618999) return salary - 550000
  if (salary <= 1619999) return 1069000
  if (salary <= 1621999) return 1070000
  if (salary <= 1623999) return 1072000
  if (salary <= 1627999) return 1074000
  if (salary <= 1799999) return Math.floor(salary / 4) * 4 * 0.6 - 100000 + salary % 4
  if (salary <= 3599999) return Math.floor(salary * 0.7) - 80000
  if (salary <= 6599999) return Math.floor(salary * 0.8) - 440000
  if (salary <= 8499999) return Math.floor(salary * 0.9) - 1100000
  return salary - 1950000
}

/**
 * 共通課税所得を計算（国保・介護・住民税で共用）
 */
function calcTaxableIncome(params) {
  const { salary, pension, age, dependents, disability, singleParent } = params
  
  const salaryIncome = calcSalaryIncome(salary || 0)
  const pensionIncome = calcPensionIncome(pension || 0, age || 40)
  const totalIncome = salaryIncome + pensionIncome
  
  // 基礎控除
  let deductions = 430000
  // ... 各種控除
  
  return { totalIncome, taxableIncome: Math.max(totalIncome - deductions, 0) }
}

module.exports = { calcSalaryIncome, calcPensionIncome, calcTaxableIncome }
```

---

## 4. kakeibo-simulator の実データ連携設計

### 4-1. 現状

```html
<!-- 現在: 都道府県 dropdown あり → 未使用 -->
<select id="pref">
  <option value="">全国平均で概算する</option>
  <option value="tokyo">東京都</option>
  ...
</select>
```

計算は全国平均のハードコード値を使っている。

### 4-2. 実データ連携フロー

```javascript
// kakeibo-simulator の新しい calc() フロー

async function calc() {
  const prefSlug = document.getElementById('pref').value
  const citySlug = document.getElementById('city').value
  
  // 自治体未選択 → 全国平均モード（既存動作を維持）
  if (!citySlug) {
    return calcWithNationalAverage(inputs)
  }
  
  // 自治体選択済み → 実データ取得
  const BASE = 'https://kokuho-keisan.jp'
  const [kokuhoData, kaigoData, juminData] = await Promise.allSettled([
    fetch(`${BASE}/data/municipalities/${prefSlug}/${citySlug}/kokuho-2026.json`).then(r => r.json()),
    fetch(`${BASE}/data/municipalities/${prefSlug}/${citySlug}/kaigo-2026.json`).then(r => r.json()),
    fetch(`${BASE}/data/municipalities/${prefSlug}/${citySlug}/jumin-2026.json`).then(r => r.json()),
  ])
  
  // 取得できた制度だけ計算（Promise.allSettled で部分成功を許容）
  const results = {}
  if (kokuhoData.status === 'fulfilled') results.kokuho = calcKokuho(inputs, kokuhoData.value)
  if (kaigoData.status   === 'fulfilled') results.kaigo  = calcKaigo(inputs, kaigoData.value)
  if (juminData.status   === 'fulfilled') results.jumin  = calcJumin(inputs, juminData.value)
  
  renderResults(results)
}
```

**Promise.allSettled の採用理由**: 介護保険データが未整備の自治体でも、国保と住民税だけ表示できる。段階的リリースに対応。

### 4-3. 都道府県 → 市区町村の2段階ドロップダウン

```javascript
// registry/index.json を使って市区町村リストを動的生成
async function loadCities(prefSlug) {
  const registry = await fetch('https://kokuho-keisan.jp/registry/index.json').then(r => r.json())
  const cities = registry.filter(m => m.prefSlug === prefSlug)
  
  const citySelect = document.getElementById('city')
  citySelect.innerHTML = '<option value="">市区町村を選択</option>'
  cities.forEach(c => {
    const opt = document.createElement('option')
    opt.value = c.slug
    opt.textContent = c.name
    citySelect.appendChild(opt)
  })
}
```

registry/index.json は既に存在する（1,727自治体マスタ）。追加コストゼロ。

---

## 5. URL・ページ設計

### 5-1. 制度別ページ（既存パターン踏襲）

```
kokuho-keisan.jp/{pref}/{slug}/              国保かんたん計算（既存）
kokuho-keisan.jp/{pref}/{slug}/income.html   国保所得ベース計算（既存）
kokuho-keisan.jp/{pref}/{slug}/kaigo/        介護保険料計算（新規）
kokuho-keisan.jp/{pref}/{slug}/kakeibo/      複数制度統合（新規）
```

### 5-2. 統合ページのコンセプト（`/kakeibo/`）

```
┌──────────────────────────────────────────┐
│  茅ヶ崎市 家計シミュレーター               │
│  ─────────────────────────────          │
│  年収: [___________] 万円                 │
│  家族: 本人 + 配偶者 + 子ども [_] 人      │
│  介護認定: □ あり                        │
│  [計算する]                              │
├──────────────────────────────────────────┤
│  国民健康保険料        ¥ 423,600/年       │
│  介護保険料（第5段階） ¥  79,000/年       │
│  住民税               ¥ 380,000/年       │
│  ─────────────────────────────          │
│  合計負担             ¥ 882,600/年       │
│  手取り推計           ¥ 3,117,400/年     │
│                                          │
│  ※ kokuho-keisan.jp のデータを使用       │
└──────────────────────────────────────────┘
```

### 5-3. ドメイン戦略

kakeibo-simulator は現在 GitHub Pages で動いているが、
将来的には `kokuho-keisan.jp/kakeibo/` にマージする。

理由:
- SEO: `kokuho-keisan.jp` の権威を引き継ぐ
- データアクセス: CORS問題なし（同一ドメイン）
- Cloudflare Pages: 既存インフラをそのまま使用

---

## 6. 介護保険データ収集戦略

### 6-1. データソース

| ソース | 内容 | 取得方法 |
|--------|------|---------|
| 各市区町村 HP | 基準額・段階表 | スクレイピング or 手動 |
| 厚労省 | 第9期事業計画 集計値 | PDF → 手動 |
| 都道府県 | 一覧ページがある都道府県も | 半自動 |

### 6-2. 段階的収集ロードマップ

```
Phase 1（2026年6〜8月）: 主要100都市
  東京23区・政令指定都市・県庁所在地 = 概ね上位100自治体
  人口カバレッジ: 約45%

Phase 2（2026年9〜12月）: 都道府県庁所在地以外の市
  残り750都市

Phase 3（2027年以降）: 町村
  第10期改定（2027年4月）と同時進行
```

### 6-3. 収集スクリプト設計

```javascript
// scripts/collect-kaigo-data.js のひな型

const template = {
  cityCode: null,
  citySlug: null,
  cityName: null,
  prefSlug: null,
  fiscalYear: 2026,
  system: 'kaigo',
  planPeriod: '第9期（2024-2026）',
  baseAmount: null,      // ← ここだけ自治体ごとに異なる
  brackets: null,        // ← ここも
  status: 'needs_update' // kokuho と同じ検証フロー
}
```

**重要**: `baseAmount` と `brackets` の2フィールドに収集コストを集中。
段階の構造は9割の自治体で同じパターン → signature で分類して使い回せる。

---

## 7. シグネチャ設計（介護保険）

介護保険の分類キー:

```
{bracketCount}|{baseAmount_range}|{topRate}
例: "9|75000-84999|2.00"   → 標準9段階 + 基準額8万円台 + 上位倍率2.0倍
    "12|60000-69999|2.50"  → 独自12段階 + 基準額6万円台 + 上位倍率2.5倍
```

**想定パターン数**: 国保の200〜300パターンに対し、介護は30〜50パターン程度。
理由: 段階構造は国が強く標準化している。基準額の差だけが主な変数。

---

## 8. 住民税の最適化設計

住民税は99%の自治体で同じ税率。差分管理パターンを採用:

```javascript
// data/jumin-standard.json — 標準値
const JUMIN_STANDARD = {
  cityRate: 0.06,
  prefRate: 0.04,
  cityPerCapita: 3500,
  prefPerCapita: 1500,
  forestTax: 1000,
  basicDeduction: 430000
}

// data/municipalities/{pref}/{slug}/jumin-2026.json
// → 差分がある自治体のみファイルを作成
// → ファイルがない場合は JUMIN_STANDARD を使う（エンジン側でフォールバック）
```

これにより:
- 全1,727自治体ファイルを作らなくてよい
- 差分のある自治体（超過課税: 横浜市、神奈川県 森林環境税など）だけ管理
- 推定: 50〜100自治体のみファイル作成が必要

---

## 9. 既存コードへの影響分析

### 9-1. 変更が不要なもの（後方互換性）

| ファイル | 理由 |
|---------|------|
| `data/municipalities/**/kokuho-*.json` | 既存ファイルに一切手を加えない |
| `js/engine.js` | 国保計算エンジン変更なし |
| `{pref}/{slug}/index.html` | 国保ページ変更なし |
| `registry/index.json` | 新フィールド追加のみ（既存フィールド変更なし） |

### 9-2. 変更が必要なもの

| ファイル | 変更内容 | リスク |
|---------|---------|--------|
| `registry/index.json` | `availableSystems` フィールド追加 | 低（既存フィールドに変更なし） |
| `scripts/validate-kokuho-data.js` | kaigo/jumin 対応の validation 追加 | 低 |
| `kakeibo-simulator/index.html` | 自治体選択 + 実データ取得ロジック | 中（既存UI維持しつつ拡張） |

### 9-3. 新規作成が必要なもの

```
engines/kaigo/            (normalize, signature, classify, generate)
engines/jumin/            (normalize, generate のみ、classifyは不要)
engines/shared/           (income.js, deductions.js)
scripts/collect-kaigo.js
scripts/validate-kaigo-data.js
data/jumin-standard.json
```

---

## 10. 実装ロードマップ

### Phase 0（今すぐ〜6月 R8更新まで）

K2/K3/K4/K5 を優先。複数制度の実装はR8確定後に本格着手。
ただし以下の「ゼロコスト準備」は今できる:

```
✅ jumin-standard.json の作成（30分）
✅ city-meta.json スキーマ定義（1時間）
✅ engines/shared/income.js の抽出（既存 engine.js から移植）
✅ kaigo JSON スキーマ確定（このドキュメント）
```

### Phase 1（2026年6〜8月）: 基盤構築

```
Week 1-2:  engines/shared/ を整備
Week 3-4:  engines/kaigo/ パイプライン実装
Week 5-6:  主要100自治体の介護保険データ収集
Week 7-8:  kakeibo-simulator に実データ連携
```

### Phase 2（2026年9〜12月）: スケール

```
- 介護保険 750都市に拡張
- jumin 差分自治体 50〜100件収集
- kokuho-keisan.jp/kakeibo/ として統合ページ公開
- SEO: 「{市区町村名} 介護保険料 計算」でのランクイン
```

### Phase 3（2027年〜）: 制度OS完成

```
- 第10期介護保険（2027年4月改定）対応
- 保育料計算（段階的）
- 「制度コンパイラ」として B2B SaaS 展開
```

---

## 11. B2B展開との接続

この複数制度統合は、技術的な拡張だけでなく、収益構造に直結する。

```
無料ユーザー:
  kokuho-keisan.jp → 国保1制度を自由に利用

有料プラン候補（B2B）:
  - FP事務所向け API（国保+介護+住民税 一括取得）
  - 社労士向け 埋め込みウィジェット
  - 自治体向け 自社HP組み込み
  - 不動産会社向け「引越し前後の税負担比較」
```

国保だけでは「引っ越し時の比較」しかユースケースがない。
複数制度になると「退職・独立時の社会保険試算」「年金受給開始の試算」など、
**人生の重要な意思決定**に使われるツールになる。ここに課金ポイントがある。

---

## 12. 決定事項サマリー

| 決定事項 | 採用案 | 理由 |
|---------|--------|------|
| ファイル構造 | 制度ごとに分離 | 更新サイクルが異なる |
| 住民税管理 | 差分管理（標準テンプレート） | 99%が同値 |
| 介護保険段階 | 配列方式（bracketCount柔軟） | 独自細分化に対応 |
| パイプライン | engines/ 以下に制度ごと独立 | 既存国保パイプラインと同構造 |
| 共通ロジック | engines/shared/ に抽出 | DRY、テスト容易 |
| kakeibo連携 | Promise.allSettled で部分成功許容 | 段階的リリート対応 |
| ドメイン | kokuho-keisan.jp/kakeibo/ に統合 | SEO・CORS有利 |
| フォールバック | availableSystems で制御 | データなし自治体でも動作 |

---

*Civic Rule Lab — 2026-04-27*
