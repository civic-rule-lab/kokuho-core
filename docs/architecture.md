# Civic Systems アーキテクチャドキュメント

最終更新: 2026-03-30

---

## 発案の背景

AIの普及により「どの情報が正しいか」の問題が深刻化している。医療・税・社会保障など生活に直結する領域では、誤情報が生命・生活を脅かす可能性がある。

この問題への解として：

1. **制度データを構造化・検証可能にする**（Civic Rule Lab）
2. **市民と行政・民間が互いに信頼できる双方向認証基盤**（長期目標）

---

## 核心思想：制度コンパイラ

```
【普通のアプローチ】
制度 → サイト（1741個を手作業）

【Civic Systemsのアプローチ】
制度 → データ → 生成 → サイト（自動）
```

法律・条例を「構造化データ」にコンパイルし、1741自治体のサービスを自動生成する。

---

## 会社構造

```
Civic Systems（開発・インフラ会社）
│
├─ Civic Rule Lab        制度研究・制度OS
│   ├ data               自治体制度データ（164自治体実装済み）
│   ├ registry           自治体マスタ（registry/index.json）
│   ├ engines            計算エンジン（normalize/signature/classify/generate）
│   └ generated          自治体制度データ生成結果
│
├─ Municipal Control     自治体ネットワーク管理
│   └ 1700site           1741自治体サイト配信基盤
│
├─ Civic Exchange        市民サービス（市民 ↔ 制度）
│   ├ ポータル（kokuho-keisan.jp/）
│   ├ 国保計算ツール（164自治体・現行実装）
│   └ 自治体ページ（/{pref}/{slug}/）
│
└─ CCP                   循環型リサイクル事業
```

---

## データフロー

```
data/municipalities/{slug}/kokuho-2025.json
    ↓ normalize    数値表記を統一（7.3% → 0.073）
    ↓ signature    制度構造の署名を生成
    ↓ classify     同型自治体をグループ化（8グループ）
    ↓ generate     template + override → generated/kokuho/2025/
    ↓
    ├ {pref}/{slug}/index.html     かんたん計算ページ（自動生成）
    └ {pref}/{slug}/income.html    所得ベース計算ページ（自動生成）
```

---

## URL構造（正式版）

```
kokuho-keisan.jp/                          ← ポータル
kokuho-keisan.jp/{pref}/{slug}/            ← かんたん計算
kokuho-keisan.jp/{pref}/{slug}/income.html ← 所得ベース計算
```

prefスラグ: `kanagawa` / `nagano` / `tokyo` / ...（全47都道府県対応済み）

---

## ディレクトリ構造（現状）

```
kokuho-keisan/
├ index.html                  ポータル（自動生成）
├ css/
│  ├ common.css               計算ページ共通スタイル
│  └ selector.css             ポータルスタイル
├ js/
│  ├ engine.js                計算エンジン（絶対パス・正式版）
│  └ selector.js              ポータルレジストリ（自動生成）
├ templates/
│  ├ kokuho-simple.html
│  └ kokuho-income.html
├ kanagawa/{slug}/            神奈川県 33自治体
├ nagano/{slug}/              長野県   77自治体
├ tokyo/{slug}/               東京都   54自治体
├ data/
│  └ municipalities/{slug}/kokuho-2025.json  164自治体
├ registry/
│  └ index.json               164自治体登録済み
├ engines/
│  └ kokuho/
│     ├ engine.js             計算エンジン（test/用）
│     ├ normalize.js
│     ├ signature.js
│     ├ classify.js
│     └ generate.js
├ generated/
│  └ kokuho/2025/
│     ├ classification.json
│     ├ templates/（8ファイル）
│     └ overrides/（144ファイル）
├ scripts/
│  ├ generate-official-pages.js
│  ├ generate-selector.js
│  ├ generate-kanagawa-kokuho.js
│  ├ generate-tokyo-kokuho.js
│  ├ validate-kokuho-data.js
│  └ test-calc-verify.js
├ docs/
│  ├ project-overview.md
│  ├ architecture.md          このファイル
│  ├ civic-rule-engine-spec.md
│  └ civic-exchange-constitution.md
└ test/                       旧テスト版UI（引き続き稼働）
```

---

## 自治体追加の手順

1. `data/municipalities/{slug}/kokuho-2025.json` 作成
2. `registry/index.json` に追記
3. `node scripts/generate-official-pages.js` 実行
4. `node scripts/generate-selector.js` 実行
5. `node engines/kokuho/generate.js` 実行
6. git push

---

## 2025年度 分類結果サマリー（164自治体・8グループ）

| 署名 | 件数 | 完全一致 | 備考 |
|------|------|----------|------|
| `3h\|nat\|R7std\|pre` | 94件 | 0件 | 神奈川+長野の3方式 |
| `2h\|nat\|R7std\|pre` | 48件 | 16件 | 主に東京23区 |
| `4h\|nat\|R7std\|pre` | 12件 | 0件 | 長野の村落（資産割） |
| `2h\|650-240-170\|R7std\|pre` | 5件 | 0件 | 東京の独自上限市 |
| `4h[m]\|nat\|R7std\|pre` | 2件 | 1件 | 医療分のみ資産割 |
| `4h[ms]\|nat\|R7std\|pre` | 1件 | 1件 | 医療+支援分資産割 |
| `2h\|640-230-170\|R7std\|pre` | 1件 | 1件 | 立川市 |
| `2h\|660-240-170\|R7std\|pre` | 1件 | 1件 | 昭島市 |

テンプレート完全一致: 20件 (12.2%) / オーバーライド要: 144件 (87.8%)

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
- [x] 164自治体データ整備（神奈川・長野・東京）
- [x] 正式版URL構造（`/{pref}/{slug}/`）への移行
- [x] docs 整備

### Phase 2（次）：全国展開
- [ ] 全47都道府県・1741自治体への拡張
- [ ] 介護保険・保育料・住民税エンジン追加
- [ ] Municipal Control 自動生成基盤構築

### Phase 3（長期）：双方向認証基盤
- 個人 ↔ 行政の認証システム設計
- DID / Verifiable Credentials

---

## コンテキスト共有

このリポジトリのアーキテクチャを即座に共有するには：

```
https://github.com/civic-rule-lab/kokuho-keisan/blob/main/docs/architecture.md
```
