# Civic Rule Lab — アーキテクチャドキュメント

最終更新: 2026-05

---

## 発案の背景

AIの普及により「どの情報が正しいか」の問題が深刻化している。医療・税・社会保障など生活に直結する領域では、誤情報が生命・生活を脅かす可能性がある。

この問題への解として：

1. **制度データを構造化・検証可能にする**
2. **市民が自分の制度情報に直接アクセスできる基盤を整える**

---

## 核心思想：制度コンパイラ

```
【普通のアプローチ】
制度 → サイト（自治体ごとに手作業）

【Civic Rule Lab のアプローチ】
制度 → データ → 生成 → サイト（自動）
```

法律・条例を「構造化データ」にコンパイルし、自治体ごとのサービスを自動生成する。

---

## モジュール構成

```
Civic Rule Lab — kokuho-core
│
├ data        自治体制度データ（自治体ごとに JSON で記述）
├ registry    自治体マスタ（registry/index.json）
├ engines     計算エンジン（normalize / signature / classify / generate）
└ generated   分類結果・テンプレート・オーバーライド
```

---

## データフロー

```
data/municipalities/{slug}/kokuho-{year}.json
    ↓ normalize    数値表記を統一（7.3% → 0.073）
    ↓ signature    制度構造の署名を生成
    ↓ classify     同型自治体をグループ化
    ↓ generate     template + override → generated/kokuho/{year}/
    ↓
    ├ {pref}/{slug}/index.html     かんたん計算ページ（自動生成）
    └ {pref}/{slug}/income.html    所得ベース計算ページ（自動生成）
```

---

## URL構造

```
kokuho-keisan.jp/                          ← ポータル
kokuho-keisan.jp/{pref}/{slug}/            ← かんたん計算
kokuho-keisan.jp/{pref}/{slug}/income.html ← 所得ベース計算
```

prefスラグ: `kanagawa` / `nagano` / `tokyo` / ...（全47都道府県対応）

---

## ディレクトリ構造

```
kokuho-core/
├ index.html                  ポータル（自動生成）
├ css/
│  ├ common.css               計算ページ共通スタイル
│  └ selector.css             ポータルスタイル
├ js/
│  ├ engine.js                計算エンジン
│  └ selector.js              ポータルレジストリ（自動生成）
├ templates/
│  ├ kokuho-simple.html
│  └ kokuho-income.html
├ {pref}/{slug}/              都道府県・自治体ごとの計算ページ
├ data/
│  └ municipalities/{slug}/kokuho-{year}.json
├ registry/
│  └ index.json
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
├ scripts/
│  ├ generate-official-pages.js
│  ├ generate-selector.js
│  ├ validate-kokuho-data.js
│  └ test-calc-verify.js
└ docs/
   ├ project-overview.md
   ├ architecture.md           このファイル
   ├ civic-rule-engine-spec.md
   └ constitution.md
```

---

## 自治体追加の手順

1. `data/municipalities/{slug}/kokuho-{year}.json` 作成
2. `registry/index.json` に追記
3. `node scripts/generate-official-pages.js` 実行
4. `node scripts/generate-selector.js` 実行
5. `node engines/kokuho/generate.js` 実行
6. git commit / push

---

## 制度横断計算（将来）

国保計算ツールの入力項目は他制度にも流用できる：

```
【共通入力】所得・世帯人数・年齢構成・所得種別

これで計算できる制度:
  国保料     ← 実装済み
  住民税     ← 所得・控除から計算可能
  介護保険料 ← 40〜64歳人数取得済み
  保育料     ← 世帯所得・子ども数から算定
  高額療養費 ← 所得区分から導出
```

**入力1回 → 複数制度を同時計算 → 統合表示** が最終形。

---

## ロードマップ

### Phase 1（完了）：制度コンパイラの実証
- [x] Civic Rule Engine 実装
- [x] 自治体データ整備
- [x] 正式版URL構造（`/{pref}/{slug}/`）への移行
- [x] docs 整備

### Phase 2（進行中）：全国展開
- [ ] 全47都道府県・全自治体への拡張
- [ ] 介護保険・保育料・住民税エンジン追加

### Phase 3（長期）
複数制度の統合表示、情報発信の発展など、長期的な検討領域があります。

---

## コンテキスト共有

このリポジトリのアーキテクチャは以下で参照できます：

```
https://github.com/civic-rule-lab/kokuho-core/blob/main/docs/architecture.md
```
